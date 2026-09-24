import { useState } from 'react';
import { X, Loader2, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';

const PLACEHOLDER = `Example:

Swiggy 350
Amazon 1200
Uber 180
Netflix 199
College Canteen 100`;

export default function TransactionModal({ onClose, onTransactionsAdded }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleAnalyse = async () => {
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Please enter at least one transaction.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/transactions/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Server error (${res.status})`);
      }

      const data = await res.json();

      if (!data.transactions || data.transactions.length === 0) {
        throw new Error('No transactions could be parsed. Please check the format.');
      }

      setResult(data);
    } catch (err) {
      setError(err.message || 'Unable to analyse transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (result?.transactions) {
      onTransactionsAdded(result.transactions);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-raised border border-border rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Add Transactions</h2>
            <p className="text-xs text-text-muted mt-0.5">Paste your transactions below and let AI organise them.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-overlay text-text-muted transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-5 space-y-4">
          {/* Input phase */}
          {!result && (
            <>
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(null); }}
                placeholder={PLACEHOLDER}
                rows={8}
                disabled={loading}
                className="w-full bg-surface-overlay border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary
                           placeholder:text-text-muted resize-none outline-none focus:border-accent/50 transition-colors
                           disabled:opacity-50 font-mono leading-relaxed"
              />

              {/* Error */}
              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-danger/10 border border-danger/20">
                  <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  <p className="text-xs text-danger">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={onClose} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-surface-overlay transition-colors disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleAnalyse} disabled={loading || !text.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-accent hover:bg-accent/80 text-white text-sm font-medium transition-colors
                             disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Analysing…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" />Analyse Transactions</>
                  )}
                </button>
              </div>
            </>
          )}

          {/* Result phase */}
          {result && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <p className="text-xs text-success font-medium">
                  {result.transactions.length} transaction{result.transactions.length > 1 ? 's' : ''} categorised • Total: ₹{result.totalAmount?.toLocaleString()}
                </p>
              </div>

              {/* Transaction list */}
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {result.transactions.map((t, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-overlay">
                    <div className="min-w-0">
                      <p className="text-sm text-text-primary font-medium truncate">{t.description}</p>
                      <p className="text-[11px] text-text-muted">{t.category}</p>
                    </div>
                    <span className="text-sm font-semibold text-text-primary shrink-0 ml-3">₹{t.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Highest category */}
              {result.highestSpendingCategory && (
                <p className="text-xs text-text-secondary text-center">
                  Highest: <span className="font-semibold text-text-primary">{result.highestSpendingCategory}</span>
                  {result.categoryTotals?.[result.highestSpendingCategory] && (
                    <> — ₹{result.categoryTotals[result.highestSpendingCategory].toLocaleString()}</>
                  )}
                </p>
              )}

              {/* Confirm / Edit */}
              <div className="flex gap-3">
                <button onClick={() => { setResult(null); setError(null); }}
                  className="flex-1 py-2.5 rounded-xl border border-border-subtle text-sm text-text-secondary hover:bg-surface-overlay transition-colors">
                  Edit
                </button>
                <button onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl bg-success hover:bg-success/80 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />Add to Dashboard
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
