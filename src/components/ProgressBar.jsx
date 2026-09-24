export default function ProgressBar({ value, max, color = '#6c5ce7', height = 'h-2' }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={`w-full bg-surface-overlay rounded-full ${height} overflow-hidden`}>
      <div
        className={`${height} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${percentage}%`, backgroundColor: color }}
      />
    </div>
  );
}
