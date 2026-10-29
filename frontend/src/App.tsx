import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { ShortcutsModal } from './components/ShortcutsModal';

export function App() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <main className="min-h-screen py-10 px-4 bg-[#ECEFF3] dark:bg-[#070A12] bg-dots-pattern flex flex-col items-center justify-center text-slate-800 dark:text-slate-100 transition-colors duration-200 relative overflow-x-hidden">
      {/* Ambient glow accent behind calculator */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-indigo-400/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full flex flex-col items-center">
        <Calculator />

        {/* Integrated Author Branding, Shortcuts & API Reference */}
        <footer className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-md w-full px-2">
          <div className="flex items-center gap-1.5 font-medium">
            <span>Crafted by</span>
            <a
              href="https://github.com/anbeld12"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Author GitHub profile: anbeld12"
              data-testid="author-link"
              className="font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition-colors"
            >
              @anbeld12
            </a>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              aria-label="Open keyboard shortcuts modal"
              data-testid="btn-open-shortcuts"
              className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </button>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <a
              href="/swagger/index.html"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open Swagger API documentation"
              className="font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition-colors inline-flex items-center gap-0.5"
            >
              API Docs ↗
            </a>
          </div>
        </footer>
      </div>

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </main>
  );
}

export default App;
