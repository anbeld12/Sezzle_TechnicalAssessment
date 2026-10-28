import { Calculator } from './components/Calculator';

export function App() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      <header className="mb-4 text-center">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800">
          Full-Stack Calculator
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Ergonomic Pastel UI • Microservice API Powered
        </p>
      </header>

      <Calculator />

      <footer className="mt-5 text-center text-xs text-slate-400">
        <p>Keyboard friendly • Numpad, Enter (=), Backspace (Del), Esc (AC)</p>
      </footer>
    </main>
  );
}

export default App;
