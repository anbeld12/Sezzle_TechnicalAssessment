import { Calculator } from './components/Calculator';

export function App() {
  return (
    <main className="min-h-screen bg-[#ECEFF3] dark:bg-[#12141A] flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <Calculator />

      {/* Integrated Author Branding, Shortcuts & API Reference */}
      <footer className="mt-4 sm:mt-5 text-center text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 max-w-md w-full px-2">
        <div className="flex items-center gap-1.5 font-medium">
          <span>Crafted by Acbel</span>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <span>Keyboard Shortcuts</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px]">
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-white dark:bg-[#282D37] border border-slate-300 dark:border-[#353B48] border-b-2 rounded shadow-2xs text-slate-700 dark:text-slate-200">
            Enter
          </kbd>
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-white dark:bg-[#282D37] border border-slate-300 dark:border-[#353B48] border-b-2 rounded shadow-2xs text-slate-700 dark:text-slate-200">
            Backspace
          </kbd>
          <kbd className="px-1.5 py-0.5 font-mono text-[10px] font-semibold bg-white dark:bg-[#282D37] border border-slate-300 dark:border-[#353B48] border-b-2 rounded shadow-2xs text-slate-700 dark:text-slate-200">
            Esc
          </kbd>
          <span className="text-slate-300 dark:text-slate-600">•</span>
          <a
            href="/swagger/index.html"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Swagger API documentation"
            className="font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline decoration-slate-300 dark:decoration-slate-600 underline-offset-2 transition-colors inline-flex items-center gap-0.5"
          >
            API Docs ↗
          </a>
        </div>
      </footer>
    </main>
  );
}

export default App;
