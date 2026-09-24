import { Menu, Calendar, User } from 'lucide-react';
import { currentMonth, user } from '../data/mockData';

export default function TopBar({ title, onMenuClick }) {
  return (
    <header className="sticky top-0 z-30 h-16 bg-surface/80 backdrop-blur-md border-b border-border-subtle flex items-center justify-between px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-overlay text-text-secondary transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2 text-sm text-text-secondary">
          <Calendar className="w-4 h-4" />
          <span>{currentMonth}</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
          <User className="w-4 h-4 text-accent-light" />
        </div>
      </div>
    </header>
  );
}
