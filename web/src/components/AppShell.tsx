import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Outlet />
        </div>
        <footer className="py-3 px-6 border-t border-slate-200 text-right text-xs text-slate-400 bg-white shrink-0">
          © 2026 CECS AI Learning Hub — VinUniversity
        </footer>
      </div>
    </div>
  );
}
