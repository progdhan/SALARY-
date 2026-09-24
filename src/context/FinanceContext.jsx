import { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import financialData from '../data/financialData';
import {
  getTotalExpenses,
  getCategoryTotals,
  getHighestCategory,
  getAvailableMoney,
  getSpendingBudget,
  getRemainingSpendingBudget,
  getActualSavings,
  getBudgetUsagePercent,
  getBudgetHealth,
  getAISavingOpportunity,
} from '../utils/financeUtils';

const FinanceContext = createContext(null);
const LS_KEY = 'moneyMattersTransactions';
const LS_BUDGET_KEY = 'moneyMattersBudget';

/* ── localStorage helpers ── */
function loadTransactions() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveTransactions(txns) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(txns)); } catch { /* ignore */ }
}

function loadBudget() {
  try {
    const raw = localStorage.getItem(LS_BUDGET_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveBudget(budget) {
  try { localStorage.setItem(LS_BUDGET_KEY, JSON.stringify(budget)); } catch { /* ignore */ }
}

/* ── Merge transactions into category expenses ── */
function buildExpensesFromTransactions(transactions) {
  const catMap = {};
  // Start from default mock data
  for (const e of financialData.expenses) {
    catMap[e.category] = e.amount;
  }
  // Add stored transactions
  for (const t of transactions) {
    const cat = t.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + t.amount;
  }
  return Object.entries(catMap).map(([category, amount]) => ({ category, amount }));
}

export function FinanceProvider({ children }) {
  /* ── Transaction history (persisted) ── */
  const [transactions, setTransactions] = useState(loadTransactions);

  /* ── Budget planner state (persisted) ── */
  const savedBudget = loadBudget();
  const [income, setIncome] = useState(savedBudget?.income ?? financialData.budgetPlanner.monthlyIncome);
  const [fixedExpenses, setFixedExpenses] = useState(savedBudget?.fixedExpenses ?? financialData.budgetPlanner.fixedExpenses);
  const [desiredSavings, setDesiredSavings] = useState(savedBudget?.desiredSavings ?? financialData.budgetPlanner.desiredSavings);

  /* ── Goals ── */
  const [goals, setGoals] = useState(financialData.savingsGoals);

  /* ── Weekly spending ── */
  const [weeklySpending, setWeeklySpending] = useState(financialData.weeklySpending);

  /* ── Persist transactions ── */
  useEffect(() => { saveTransactions(transactions); }, [transactions]);

  /* ── Persist budget settings ── */
  useEffect(() => { saveBudget({ income, fixedExpenses, desiredSavings }); }, [income, fixedExpenses, desiredSavings]);

  /* ── Computed expenses from defaults + transactions ── */
  const expenses = useMemo(() => buildExpensesFromTransactions(transactions), [transactions]);

  /* ── Add new transactions ── */
  const addTransactions = useCallback((newTxns) => {
    const timestamped = newTxns.map((t) => ({
      id: `txn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      description: t.description,
      amount: t.amount,
      category: t.category || 'Other',
      date: new Date().toISOString(),
    }));
    setTransactions((prev) => [...prev, ...timestamped]);

    // Update weekly spending
    const addedTotal = newTxns.reduce((s, t) => s + t.amount, 0);
    setWeeklySpending((ws) => {
      const updated = ws.map((w) => ({ ...w }));
      updated[updated.length - 1] = {
        ...updated[updated.length - 1],
        amount: updated[updated.length - 1].amount + addedTotal,
      };
      return updated;
    });
  }, []);

  /* ── Legacy addExpenses (used by AI chat) ── */
  const addExpenses = addTransactions;

  /* ── Goal CRUD ── */
  const addGoal = useCallback((goal) => {
    setGoals((prev) => [...prev, { ...goal, id: Date.now() }]);
  }, []);
  const updateGoal = useCallback((goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
  }, []);
  const deleteGoal = useCallback((id) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  /* ── Data snapshot for utility functions ── */
  const dataSnapshot = useMemo(() => ({
    monthlyBudget: getSpendingBudget(income, fixedExpenses, desiredSavings),
    categories: financialData.categories,
    expenses,
    weeklySpending,
  }), [income, fixedExpenses, desiredSavings, expenses, weeklySpending]);

  /* ── All derived values ── */
  const derived = useMemo(() => {
    const totalSpent = getTotalExpenses(dataSnapshot);
    const categoryTotals = getCategoryTotals(dataSnapshot);
    const highest = categoryTotals.length > 0 ? categoryTotals[0] : null;
    const spendingBudget = getSpendingBudget(income, fixedExpenses, desiredSavings);
    const available = getAvailableMoney(income, fixedExpenses);
    const remaining = getRemainingSpendingBudget(income, fixedExpenses, desiredSavings, totalSpent);
    const actualSavings = getActualSavings(income, fixedExpenses, totalSpent);
    const budgetUsage = getBudgetUsagePercent(income, fixedExpenses, desiredSavings, totalSpent);
    const health = getBudgetHealth(budgetUsage);
    const opportunity = getAISavingOpportunity(dataSnapshot, totalSpent, income, fixedExpenses);
    const budgetPct = spendingBudget > 0 ? Math.round((totalSpent / spendingBudget) * 100) : 100;

    const aiInsight = {
      title: 'AI Insight',
      message: highest
        ? `You have used ${budgetPct}% of your spending budget. Your ${highest.name} expenses are currently your largest spending category at ₹${highest.value.toLocaleString()}.`
        : 'Start adding expenses to see insights here.',
    };

    const savingOpp = highest
      ? {
          title: 'Saving Opportunity',
          message: `Reducing ${highest.name} spending by ₹${opportunity.reduction.toLocaleString()} could increase your monthly savings to ₹${opportunity.potentialMonthlySavings.toLocaleString()}.`,
        }
      : { title: 'Saving Opportunity', message: 'Add expenses to see saving opportunities.' };

    return {
      totalSpent, categoryTotals, highest, spendingBudget, available,
      remaining, actualSavings, budgetUsage, budgetPct, health, opportunity,
      aiInsight, savingOpp,
    };
  }, [dataSnapshot, income, fixedExpenses, desiredSavings]);

  const value = useMemo(() => ({
    income, setIncome,
    fixedExpenses, setFixedExpenses,
    desiredSavings, setDesiredSavings,
    expenses, addExpenses, addTransactions,
    transactions,
    goals, addGoal, updateGoal, deleteGoal,
    weeklySpending,
    categories: financialData.categories,
    ...derived,
  }), [income, fixedExpenses, desiredSavings, expenses, transactions, goals, weeklySpending, derived, addExpenses, addTransactions, addGoal, updateGoal, deleteGoal]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider');
  return ctx;
}
