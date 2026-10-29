import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { ShortcutsModal } from './components/ShortcutsModal';

export function App() {
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#ECEFF3] dark:bg-[#070A12] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Calculator />

      {/* Integrated Author Branding, Shortcuts & API Reference */}
      <footer className="mt-4 sm:mt-5 text-center text-xs text-slate-500 dark:text-slate-300 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-md w-full px-2">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Crafted by</span>
          <a
            href="https://github.com/anbeld12"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Author GitHub profile: anbeld12"
            data-testid="author-link"
            className="font-semibold text-slate-600 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-[#D1D7FF] underline decoration-slate-300 dark:decoration-slate-500 underline-offset-2 transition-colors"
          >
            @anbeld12
          </a>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <button
            type="button"
            onClick={() => setIsShortcutsOpen(true)}
            aria-label="Open keyboard shortcuts modal"
            data-testid="btn-open-shortcuts"
            className="inline-flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-[#D1D7FF] underline decoration-slate-300 dark:decoration-slate-500 underline-offset-2 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 rounded"
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </button>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <a
            href="/swagger/index.html"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Swagger API documentation"
            className="font-medium text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#D1D7FF] underline decoration-slate-300 dark:decoration-slate-500 underline-offset-2 transition-colors inline-flex items-center gap-0.5"
          >
            API Docs ↗
          </a>
        </div>
      </footer>

      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </main>
  );
}

export default App;
