import { Calculator } from './components/Calculator';

const KBD_CLASS =
  'px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-white dark:bg-[#334155] border border-slate-300 dark:border-[#475569] border-b-2 dark:border-b-[#0F172A] rounded shadow-2xs text-slate-700 dark:text-white';

export function App() {
  return (
    <main className="min-h-screen bg-[#ECEFF3] dark:bg-[#0B0F19] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
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
            className="font-semibold text-slate-600 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-[#C7CEFF] underline decoration-slate-300 dark:decoration-slate-500 underline-offset-2 transition-colors"
          >
            @anbeld12
          </a>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <kbd className={KBD_CLASS}>Enter</kbd>
          <kbd className={KBD_CLASS}>Backspace</kbd>
          <kbd className={KBD_CLASS}>Esc</kbd>
          <kbd className={KBD_CLASS}>Ctrl+C</kbd>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <a
            href="/swagger/index.html"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Swagger API documentation"
            className="font-medium text-slate-500 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#C7CEFF] underline decoration-slate-300 dark:decoration-slate-500 underline-offset-2 transition-colors inline-flex items-center gap-0.5"
          >
            API Docs ↗
          </a>
        </div>
      </footer>
    </main>
  );
}

export default App;
