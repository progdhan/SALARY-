import { useState } from 'react';
import {
  Wallet, CreditCard, PiggyBank, TrendingDown,
  Lightbulb, BadgeDollarSign, ArrowUpRight, Plus,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard';
import InsightCard from '../components/InsightCard';
import ProgressBar from '../components/ProgressBar';
import TransactionModal from '../components/TransactionModal';
import { useFinance } from '../context/FinanceContext';

/* ── Recharts tooltip ── */
const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-overlay border border-border rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-text-secondary mb-0.5">{payload[0].payload.name || payload[0].payload.week}</p>
      <p className="text-sm text-text-primary font-semibold">₹{payload[0].value.toLocaleString()}</p>
    </div>
  );
};

/* ── Category icon lookup ── */
const CATEGORY_ICONS = {
  Food: 'UtensilsCrossed', Shopping: 'ShoppingBag', Transport: 'Car',
  Entertainment: 'Gamepad2', Bills: 'Receipt', Education: 'GraduationCap',
  Healthcare: 'Heart', Other: 'MoreHorizontal',
};
const CATEGORY_COLORS = {
  Food: '#e17055', Shopping: '#6c5ce7', Transport: '#00cec9',
  Entertainment: '#fdcb6e', Bills: '#74b9ff', Education: '#a29bfe',
  Healthcare: '#ff6b6b', Other: '#55efc4',
};

/* ──────────────────── Dashboard ──────────────────── */
export default function Dashboard() {
  const {
    spendingBudget, totalSpent, actualSavings, remaining,
    budgetPct, categoryTotals, highest, weeklySpending,
    aiInsight, savingOpp, transactions, addTransactions,
  } = useFinance();

  const [showModal, setShowModal] = useState(false);
  const budget = spendingBudget;
  const HighestIcon = highest ? (LucideIcons[highest.icon] || ArrowUpRight) : ArrowUpRight;

  // Recent transactions (newest first, max 10)
  const recentTxns = [...transactions].reverse().slice(0, 10);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto pb-8">

      {/* ── Header with Add Transaction ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-text-primary">Financial Overview</h1>
          <p className="text-xs text-text-muted mt-0.5">Your spending at a glance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-white text-sm font-medium transition-colors shadow-lg shadow-accent/20"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Transaction</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <StatCard icon={Wallet}       label="Spending Budget" value={budget}        prefix="₹" color="text-text-primary" />
        <StatCard icon={CreditCard}   label="Total Spent"     value={totalSpent}    prefix="₹" color="text-danger" />
        <StatCard icon={PiggyBank}    label="Total Saved"     value={actualSavings} prefix="₹" color="text-success" />
        <StatCard icon={TrendingDown} label="Remaining"       value={remaining}     prefix="₹" color="text-accent-light" />
      </div>

      {/* ── Budget Usage ── */}
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-primary">Budget Usage</h2>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
            budgetPct > 100 ? 'bg-danger/15 text-danger'
              : budgetPct > 80 ? 'bg-danger/15 text-danger'
              : budgetPct > 60 ? 'bg-warning/15 text-warning'
              : 'bg-success/15 text-success'
          }`}>{budgetPct}% used</span>
        </div>
        <ProgressBar
          value={Math.min(totalSpent, budget > 0 ? budget : 1)}
          max={budget > 0 ? budget : 1}
          color={budgetPct > 80 ? '#ff6b6b' : budgetPct > 60 ? '#fdcb6e' : '#00cec9'}
          height="h-3"
        />
        <div className="flex justify-between mt-2.5 text-xs text-text-secondary">
          <span>₹{totalSpent.toLocaleString()} spent</span>
          <span>₹{budget.toLocaleString()} budget</span>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut */}
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Expense Breakdown</h2>
          {categoryTotals.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48 sm:w-52 sm:h-52 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryTotals} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" stroke="none">
                      {categoryTotals.map((c, i) => <Cell key={i} fill={c.color} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                    <text x="50%" y="45%" textAnchor="middle" dominantBaseline="central" className="fill-text-primary text-base sm:text-lg font-bold">
                      ₹{totalSpent.toLocaleString()}
                    </text>
                    <text x="50%" y="57%" textAnchor="middle" dominantBaseline="central" className="fill-text-secondary" style={{ fontSize: '11px' }}>
                      Total Spent
                    </text>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2 w-full min-w-0">
                {categoryTotals.map((cat) => {
                  const CatIcon = LucideIcons[cat.icon] || LucideIcons.Circle;
                  return (
                    <div key={cat.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}18` }}>
                          <CatIcon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-text-primary font-medium truncate">{cat.name}</p>
                          <p className="text-[11px] text-text-muted">{cat.percentage}%</p>
                        </div>
                      </div>
                      <span className="text-sm text-text-primary font-semibold shrink-0">₹{cat.value.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-sm text-text-muted">No expenses recorded yet</div>
          )}
        </div>

        {/* Bar chart */}
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Weekly Spending</h2>
          <div className="h-[260px] sm:h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklySpending} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                <XAxis dataKey="week" tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8888a0', fontSize: 11 }} axisLine={false} tickLine={false} width={45} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(108,92,231,0.08)' }} />
                <Bar dataKey="amount" fill="#6c5ce7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Highest + Insights ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 hover:border-border transition-colors duration-200">
          <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Highest Spending</h2>
          {highest ? (
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: `${highest.color}18` }}>
                <HighestIcon className="w-6 h-6" style={{ color: highest.color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">Your highest spending is {highest.name}</p>
                <p className="text-xs text-text-secondary mt-0.5">₹{highest.value.toLocaleString()} • {highest.percentage}% of total</p>
              </div>
            </div>
          ) : <p className="text-sm text-text-muted">No expenses yet</p>}
        </div>
        <InsightCard icon={Lightbulb} title={aiInsight.title} message={aiInsight.message} accentColor="border-warning" />
        <InsightCard icon={BadgeDollarSign} title={savingOpp.title} message={savingOpp.message} accentColor="border-success" />
      </div>

      {/* ── Recent Transactions ── */}
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Transactions</h2>
        {recentTxns.length > 0 ? (
          <div className="space-y-2">
            {recentTxns.map((t) => {
              const iconName = CATEGORY_ICONS[t.category] || 'MoreHorizontal';
              const color = CATEGORY_COLORS[t.category] || '#888';
              const TxnIcon = LucideIcons[iconName] || LucideIcons.Circle;
              return (
                <div key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-overlay transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                      <TxnIcon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{t.description}</p>
                      <p className="text-[11px] text-text-muted">{t.category}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-text-primary shrink-0">₹{t.amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-text-muted">No transactions yet</p>
            <p className="text-xs text-text-muted mt-1">Use the <span className="text-accent-light font-medium">+ Add Transaction</span> button to get started</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onTransactionsAdded={(txns) => addTransactions(txns)}
        />
      )}
    </div>
  );
}
