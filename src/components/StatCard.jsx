export default function StatCard({ icon: Icon, label, value, prefix = '', suffix = '', color = 'text-accent-light' }) {
  return (
    <div className="bg-surface-raised border border-border-subtle rounded-2xl p-5 hover:border-border transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-surface-overlay">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
        <span className="text-sm text-text-secondary font-medium">{label}</span>
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
      </p>
    </div>
  );
}
