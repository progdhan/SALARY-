import financialData from './financialData';
import {
  getTotalExpenses,
  getRemainingBudget,
  getSavings,
} from '../utils/financeUtils';

/* Dashboard values — derived from the single financialData source */
export const monthlyBudget = financialData.monthlyBudget;
export const totalSpent = getTotalExpenses(financialData);
export const totalSaved = getSavings(financialData);
export const budgetRemaining = getRemainingBudget(financialData);

export const currentMonth = 'September 2026';

export const user = {
  name: 'Dhanish',
  avatar: null,
};

