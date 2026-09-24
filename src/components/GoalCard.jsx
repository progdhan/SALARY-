import * as LucideIcons from 'lucide-react';
import { Clock } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { getEstimatedMonths } from '../utils/financeUtils';

export default function GoalCard({ goal, monthlySaving = 0, onEdit, onDelete }) {
  const Icon = LucideIcons[goal.icon] || LucideIcons.Target;
  const percentage = Math.min(Math.round((goal.current / goal.target) * 100), 100);
  const remaining = Math.max(goal.target - goal.current, 0);
  const estMonths = remaining > 0 ? getEstimatedMonths(remaining, monthlySaving) : 0;

  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 hover:border-border transition-colors duration-200 group">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2.5 rounded-xl shrink-0"
          style={{ backgroundColor: `${goal.color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: goal.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-text-primary truncate">{goal.name}</h3>
          <p className="text-xs text-text-muted">{percentage}% complete</p>
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={() => onEdit(goal)}
                className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-muted hover:text-text-secondary transition-colors"
              >
                <LucideIcons.Pencil className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(goal.id)}
                className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors"
              >
                <LucideIcons.Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Progress */}
      <ProgressBar value={goal.current} max={goal.target} color={goal.color} />

      {/* Amounts */}
      <div className="flex justify-between mt-3">
        <span className="text-xs text-text-secondary">₹{goal.current.toLocaleString()}</span>
        <span className="text-xs text-text-muted">₹{goal.target.toLocaleString()}</span>
      </div>

      {/* Footer stats */}
      <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Remaining</p>
          <p className="text-xs font-semibold text-text-primary mt-0.5">₹{remaining.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-text-muted uppercase tracking-wider">Est. Time</p>
          <p className="text-xs font-semibold text-text-primary mt-0.5 flex items-center justify-end gap-1">
            <Clock className="w-3 h-3 text-text-muted" />
            {estMonths === 0
              ? 'Done!'
              : estMonths === Infinity
                ? '—'
                : `${estMonths} mo`}
          </p>
        </div>
      </div>
    </div>
  );
}
