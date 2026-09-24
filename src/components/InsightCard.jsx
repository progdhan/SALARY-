export default function InsightCard({ icon: Icon, title, message, accentColor = 'border-accent' }) {
  return (
    <div className={`bg-surface-raised border-l-4 ${accentColor} border border-border-subtle rounded-2xl p-5 hover:border-border transition-colors duration-200`}>
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-surface-overlay shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-text-secondary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
          <p className="text-sm text-text-secondary leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}
