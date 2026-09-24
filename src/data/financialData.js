/**
 * Single source of truth for all financial data.
 * Every dashboard value is derived from this object.
 */
const financialData = {
  monthlyBudget: 20000,

  categories: [
    { name: 'Food', color: '#e17055', icon: 'UtensilsCrossed' },
    { name: 'Shopping', color: '#6c5ce7', icon: 'ShoppingBag' },
    { name: 'Transport', color: '#00cec9', icon: 'Car' },
    { name: 'Entertainment', color: '#fdcb6e', icon: 'Gamepad2' },
    { name: 'Bills', color: '#74b9ff', icon: 'Receipt' },
    { name: 'Education', color: '#a29bfe', icon: 'GraduationCap' },
    { name: 'Other', color: '#55efc4', icon: 'MoreHorizontal' },
  ],

  expenses: [
    { category: 'Food', amount: 3850 },
    { category: 'Shopping', amount: 2800 },
    { category: 'Transport', amount: 1950 },
    { category: 'Entertainment', amount: 1500 },
    { category: 'Bills', amount: 1800 },
    { category: 'Education', amount: 950 },
    { category: 'Other', amount: 400 },
  ],

  weeklySpending: [
    { week: 'Week 1', amount: 3200 },
    { week: 'Week 2', amount: 3800 },
    { week: 'Week 3', amount: 3450 },
    { week: 'Week 4', amount: 2800 },
  ],

  /* ── Budget Planner defaults ── */
  budgetPlanner: {
    monthlyIncome: 40000,
    fixedExpenses: 12000,
    desiredSavings: 8000,
  },

  /* ── Savings Goals ── */
  savingsGoals: [
    { id: 1, name: 'Emergency Fund', target: 50000, current: 12000, icon: 'Shield',         color: '#00cec9' },
    { id: 2, name: 'Laptop',         target: 60000, current: 25000, icon: 'Laptop',          color: '#6c5ce7' },
    { id: 3, name: 'Online Course',   target: 15000, current: 8000,  icon: 'GraduationCap',   color: '#a29bfe' },
    { id: 4, name: 'Travel Fund',     target: 30000, current: 5000,  icon: 'Plane',            color: '#fdcb6e' },
  ],
};

export default financialData;
