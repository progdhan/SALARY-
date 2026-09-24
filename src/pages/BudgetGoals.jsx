import { useState } from 'react';
import {
  Banknote, Receipt, PiggyBank, Target,
  TrendingUp, Lightbulb, Plus, X, Check,
} from 'lucide-react';
import ProgressBar from '../components/ProgressBar';
import GoalCard from '../components/GoalCard';
import { useFinance } from '../context/FinanceContext';

/* ── Editable number input ── */
function NumberInput({ label, icon: Icon, value, onChange, prefix = '₹' }) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4 hover:border-border transition-colors">
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="p-1.5 rounded-lg bg-surface-overlay">
          <Icon className="w-4 h-4 text-text-secondary" />
        </div>
        <label className="text-xs font-medium text-text-secondary">{label}</label>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-sm text-text-muted">{prefix}</span>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
          className="w-full bg-transparent text-xl font-bold text-text-primary outline-none
                     [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}

/* ── Computed stat display ── */
function ComputedStat({ label, value, color = 'text-text-primary', sub }) {
  return (
    <div className="text-center py-2">
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>₹{value.toLocaleString()}</p>
      {sub && <p className="text-[10px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Goal icon/color options ── */
const GOAL_ICONS = [
  { value: 'Shield', label: 'Emergency' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'GraduationCap', label: 'Course' },
  { value: 'Plane', label: 'Travel' },
  { value: 'Target', label: 'Custom' },
  { value: 'Heart', label: 'Health' },
  { value: 'Home', label: 'Home' },
  { value: 'Car', label: 'Vehicle' },
];
const GOAL_COLORS = ['#00cec9', '#6c5ce7', '#a29bfe', '#fdcb6e', '#e17055', '#74b9ff', '#55efc4', '#ff6b6b'];

/* ── Goal form ── */
function GoalForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(
    initial
      ? { name: initial.name, target: initial.target, current: initial.current, icon: initial.icon, color: initial.color }
      : { name: '', target: '', current: '', icon: 'Target', color: '#6c5ce7' }
  );
  const update = (f, v) => setForm((p) => ({ ...p, [f]: v }));
  const canSave = form.name.trim() && Number(form.target) > 0;

  return (
    <div className="bg-surface-raised border border-border rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-primary">{initial ? 'Edit Goal' : 'New Goal'}</h3>
        <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-muted"><X className="w-4 h-4" /></button>
      </div>
      <input
        type="text" placeholder="Goal name" value={form.name}
        onChange={(e) => update('name', e.target.value)}
        className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none focus:border-accent/50 transition-colors"
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Target Amount</label>
          <div className="flex items-center bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2">
            <span className="text-xs text-text-muted mr-1">₹</span>
            <input type="number" placeholder="0" value={form.target} onChange={(e) => update('target', e.target.value)}
              className="w-full bg-transparent text-sm text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>
        </div>
        <div>
          <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-1">Currently Saved</label>
          <div className="flex items-center bg-surface-overlay border border-border-subtle rounded-xl px-3 py-2">
            <span className="text-xs text-text-muted mr-1">₹</span>
            <input type="number" placeholder="0" value={form.current} onChange={(e) => update('current', e.target.value)}
              className="w-full bg-transparent text-sm text-text-primary outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
          </div>
        </div>
      </div>
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-2">Icon</label>
        <div className="flex flex-wrap gap-1.5">
          {GOAL_ICONS.map((o) => (
            <button key={o.value} onClick={() => update('icon', o.value)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${form.icon === o.value ? 'bg-accent/15 text-accent-light border border-accent/30' : 'bg-surface-overlay text-text-secondary border border-border-subtle hover:border-border'}`}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[10px] text-text-muted uppercase tracking-wider block mb-2">Color</label>
        <div className="flex gap-2">
          {GOAL_COLORS.map((c) => (
            <button key={c} onClick={() => update('color', c)}
              className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'scale-110 ring-2 ring-offset-2 ring-offset-surface-raised' : 'hover:scale-105'}`}
              style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
      <button
        onClick={() => canSave && onSave({ ...form, id: initial?.id || Date.now(), target: Number(form.target), current: Number(form.current) || 0 })}
        disabled={!canSave}
        className="w-full py-2.5 rounded-xl bg-accent hover:bg-accent/80 disabled:opacity-30 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
        <Check className="w-4 h-4" />{initial ? 'Update Goal' : 'Add Goal'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════ */
export default function BudgetGoals() {
  const {
    income, setIncome,
    fixedExpenses, setFixedExpenses,
    desiredSavings, setDesiredSavings,
    totalSpent, available, spendingBudget, remaining,
    actualSavings, budgetUsage, health, opportunity,
    goals, addGoal, updateGoal, deleteGoal,
  } = useFinance();

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const handleSave = (goal) => {
    if (editingGoal) updateGoal(goal);
    else addGoal(goal);
    setShowForm(false);
    setEditingGoal(null);
  };

  const monthlySaving = Math.max(actualSavings, 0);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto pb-8">

      {/* ── Budget Planner Inputs ── */}
      <div>
        <h2 className="text-xs font-medium text-text-muted uppercase tracking-wider mb-3">Budget Planner</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          <NumberInput icon={Banknote}  label="Monthly Income"   value={income}         onChange={setIncome} />
          <NumberInput icon={Receipt}   label="Fixed Expenses"   value={fixedExpenses}   onChange={setFixedExpenses} />
          <NumberInput icon={PiggyBank} label="Savings Goal"     value={desiredSavings}  onChange={setDesiredSavings} />
        </div>
      </div>

      {/* ── Computed Values ── */}
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-4 lg:p-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <ComputedStat label="Available Money" value={available} color="text-text-primary" sub="After fixed expenses" />
          <ComputedStat label="Spending Budget" value={spendingBudget} color="text-accent-light" sub="Available − savings goal" />
          <ComputedStat label="Remaining Budget" value={remaining} color={remaining >= 0 ? 'text-success' : 'text-danger'} sub={`₹${totalSpent.toLocaleString()} spent`} />
          <ComputedStat label="Actual Savings" value={actualSavings} color="text-success" sub="Income − all expenses" />
        </div>
      </div>

      {/* ── Budget Usage Progress ── */}
      <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Budget Usage</h2>
            <p className="text-xs text-text-secondary mt-0.5">{health.description}</p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full self-start sm:self-auto ${health.bgClass}`}>
            {health.label} • {budgetUsage}%
          </span>
        </div>
        <ProgressBar
          value={Math.min(totalSpent, spendingBudget > 0 ? spendingBudget : 1)}
          max={spendingBudget > 0 ? spendingBudget : 1}
          color={health.color}
          height="h-3"
        />
        <div className="flex justify-between mt-2.5 text-xs text-text-secondary">
          <span>₹{totalSpent.toLocaleString()} variable expenses</span>
          <span>₹{spendingBudget.toLocaleString()} budget</span>
        </div>
      </div>

      {/* ── AI Saving Opportunity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface-raised border-l-4 border-success border border-border-subtle rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-success/10 shrink-0 mt-0.5">
              <Lightbulb className="w-5 h-5 text-success" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary mb-1">AI Saving Opportunity</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                You could save an additional{' '}
                <span className="font-semibold text-success">₹{opportunity.reduction.toLocaleString()}</span>{' '}
                by reducing your highest spending category ({opportunity.categoryName}).
              </p>
            </div>
          </div>
        </div>
        <div className="bg-surface-raised border-l-4 border-accent border border-border-subtle rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-accent/10 shrink-0 mt-0.5">
              <TrendingUp className="w-5 h-5 text-accent-light" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-text-primary mb-1">12-Month Projection</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                If you save <span className="font-semibold text-accent-light">₹{opportunity.reduction.toLocaleString()}</span>{' '}
                more each month: <span className="font-semibold text-text-primary">₹{opportunity.projectedAnnual.toLocaleString()}</span>{' '}
                could be accumulated in 12 months.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Savings Goals ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Savings Goals</h2>
            <p className="text-xs text-text-muted mt-0.5">Based on ₹{monthlySaving.toLocaleString()}/month savings</p>
          </div>
          <button
            onClick={() => { setEditingGoal(null); setShowForm(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent-light hover:bg-accent/20 text-xs font-medium transition-colors">
            <Plus className="w-3.5 h-3.5" />Add Goal
          </button>
        </div>

        {showForm && (
          <div className="mb-4">
            <GoalForm
              initial={editingGoal}
              onSave={handleSave}
              onCancel={() => { setShowForm(false); setEditingGoal(null); }}
            />
          </div>
        )}

        {goals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                monthlySaving={monthlySaving}
                onEdit={(g) => { setEditingGoal(g); setShowForm(true); }}
                onDelete={deleteGoal}
              />
            ))}
          </div>
        ) : (
          <div className="bg-surface-raised border border-border-subtle rounded-2xl p-8 text-center">
            <Target className="w-8 h-8 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">No savings goals yet</p>
            <p className="text-xs text-text-muted mt-1">Create your first goal to start tracking</p>
          </div>
        )}
      </div>
    </div>
  );
}
