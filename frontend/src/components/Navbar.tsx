import React from 'react';
import { GraduationCap, Sparkles, Database, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white/85 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Kampus Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-100">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">SIAKAD Modern</h1>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Online
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Portal KRS Mahasiswa & Akademik</p>
            </div>
          </div>

          {/* Academic Info & System Pill */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-800 px-3.5 py-1.5 rounded-xl border border-sky-200/70 text-xs font-semibold shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Semester Ganjil 2025/2026</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1.5 text-xs font-medium text-slate-600 bg-slate-100/90 px-3 py-1.5 rounded-xl border border-slate-200/70">
              <Database className="w-3.5 h-3.5 text-sky-600" />
              <span>Skala 5M Data</span>
            </div>

            {/* Profile Mahasiswa Chip */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                M
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-slate-700 leading-tight">Mahasiswa Aktif</p>
                <p className="text-[10px] text-slate-400 font-mono">Reguler S1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
