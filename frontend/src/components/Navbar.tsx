import React from 'react';
import { GraduationCap, Sparkles, Database, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">SIAKAD Modern</h1>

              </div>
              <p className="text-xs text-slate-500 font-medium">Portal KRS Mahasiswa & Akademik</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
              <span>Semester Ganjil 2025/2026</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
