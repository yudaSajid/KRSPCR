import React from 'react';
import { GraduationCap, BookOpen, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-200">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">SIAKAD Kampus Merdeka</h1>
              <p className="text-xs text-slate-500 font-medium">Portal Pengambilan Kartu Rencana Studi (KRS)</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-sky-50 text-sky-700 px-3 py-1.5 rounded-lg border border-sky-100 text-xs font-semibold">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>T.A. 2025/2026 (Semester Ganjil)</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 bg-slate-100 px-2.5 py-1.5 rounded-lg">
              <Layers className="w-3.5 h-3.5 text-slate-600" />
              <span>Skala: 5M Record Engine</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
