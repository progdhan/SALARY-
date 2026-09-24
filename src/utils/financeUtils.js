/**
 * Pure utility functions that derive all dashboard values
 * from the single financialData object.
 *
 * No hardcoded values — everything recomputes automatically
 * if the underlying data changes.
 */

/**
 * Sum of all expense amounts.
 */
export function getTotalExpenses(data) {
  return data.expenses.reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Budget minus total expenses.
 */
export function getRemainingBudget(data) {
  return data.monthlyBudget - getTotalExpenses(data);
}

/**
 * Amount saved this month (same as remaining budget in the MVP model).
 */
export function getSavings(data) {
  return getRemainingBudget(data);
}

/**
 * Percentage of budget consumed (0–100).
 */
export function getBudgetPercentage(data) {
  const total = getTotalExpenses(data);
  return Math.round((total / data.monthlyBudget) * 100);
}

/**
 * Merges expense amounts with category metadata (color, icon)
 * for chart consumption.
 * Returns: [{ name, value, color, icon, percentage }]
 */
export function getCategoryTotals(data) {
  const total = getTotalExpenses(data);

  return data.expenses.map((expense) => {
    const cat = data.categories.find((c) => c.name === expense.category);
    return {
      name: expense.category,
      value: expense.amount,
      color: cat?.color ?? '#888',
      icon: cat?.icon ?? 'Circle',
      percentage: Math.round((expense.amount / total) * 100),
    };
  }).sort((a, b) => b.value - a.value);
}

/**
 * The single category with the highest spend.
 * Returns: { name, value, color, icon, percentage }
 */
export function getHighestCategory(data) {
  const sorted = getCategoryTotals(data);
  return sorted[0];
}

/**
 * Generate the AI insight text from actual data.
 */
export function getAIInsight(data) {
  const pct = getBudgetPercentage(data);
  const highest = getHighestCategory(data);
  return {
    title: 'AI Insight',
    message: `You have used ${pct}% of your monthly budget. Your ${highest.name} expenses are currently your largest spending category.`,
  };
}

/**
 * Generate the saving opportunity text from actual data.
 */
export function getSavingOpportunity(data) {
  const highest = getHighestCategory(data);
  const reduction = 500;
  const currentSavings = getSavings(data);
  const potentialSavings = currentSavings + reduction;
  return {
    title: 'Saving Opportunity',
    message: `Reducing ${highest.name} spending by ₹${reduction.toLocaleString()} could increase your monthly savings to ₹${potentialSavings.toLocaleString()}.`,
  };
}

/* ══════════════════════════════════════════════════════════
 *  Budget Planner Utilities
 *  All calculations are deterministic JavaScript.
 * ══════════════════════════════════════════════════════════ */

/**
 * Money available after fixed expenses.
 * availableMoney = income − fixedExpenses
 */
export function getAvailableMoney(income, fixedExpenses) {
  return income - fixedExpenses;
}

/**
 * Maximum the user should spend on variable expenses.
 * spendingBudget = availableMoney − desiredSavings
 */
export function getSpendingBudget(income, fixedExpenses, desiredSavings) {
  return getAvailableMoney(income, fixedExpenses) - desiredSavings;
}

/**
 * How much of the spending budget is left.
 * remainingBudget = spendingBudget − variableExpenses
 */
export function getRemainingSpendingBudget(income, fixedExpenses, desiredSavings, variableExpenses) {
  return getSpendingBudget(income, fixedExpenses, desiredSavings) - variableExpenses;
}

/**
 * Actual savings = income − fixedExpenses − variableExpenses
 */
export function getActualSavings(income, fixedExpenses, variableExpenses) {
  return income - fixedExpenses - variableExpenses;
}

/**
 * Budget usage percentage.
 * budgetUsage = (variableExpenses / spendingBudget) × 100
 */
export function getBudgetUsagePercent(income, fixedExpenses, desiredSavings, variableExpenses) {
  const budget = getSpendingBudget(income, fixedExpenses, desiredSavings);
  if (budget <= 0) return 100;
  return Math.round((variableExpenses / budget) * 100);
}

/**
 * Returns a health status object based on budget usage %.
 */
export function getBudgetHealth(usagePercent) {
  if (usagePercent > 100) {
    return {
      label: 'Over Budget',
      color: '#ff6b6b',
      bgClass: 'bg-danger/10 text-danger',
      description: "You've exceeded your planned spending budget.",
    };
  }
  if (usagePercent > 80) {
    return {
      label: 'Caution',
      color: '#ff6b6b',
      bgClass: 'bg-danger/10 text-danger',
      description: "You're approaching your budget limit.",
    };
  }
  if (usagePercent > 60) {
    return {
      label: 'On Track',
      color: '#fdcb6e',
      bgClass: 'bg-warning/10 text-warning',
      description: "You're on track, but watch your spending.",
    };
  }
  return {
    label: 'Healthy',
    color: '#00cec9',
    bgClass: 'bg-success/10 text-success',
    description: "You're comfortably within your budget.",
  };
}

/**
 * Estimated months to reach a savings goal.
 */
export function getEstimatedMonths(remaining, monthlySaving) {
  if (monthlySaving <= 0) return Infinity;
  return Math.ceil(remaining / monthlySaving);
}

/**
 * AI Saving Opportunity for Budget page.
 * Suggests reducing the highest category by ~15% and projects 12-month savings.
 */
export function getAISavingOpportunity(data, variableExpenses, income, fixedExpenses) {
  const highest = getHighestCategory(data);
  const reduction = Math.round(highest.value * 0.15 / 100) * 100; // round to nearest 100
  const currentSavings = getActualSavings(income, fixedExpenses, variableExpenses);
  const projectedAnnual = reduction * 12;

  return {
    reduction,
    currentSavings,
    potentialMonthlySavings: currentSavings + reduction,
    projectedAnnual,
    categoryName: highest.name,
  };
}

