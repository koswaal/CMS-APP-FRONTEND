import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export default function Footer() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  return (
    <footer className={`mt-auto border-t ${isDark ? 'border-gray-700 bg-[#0f0f0f]' : 'border-gray-200 bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`py-6 text-left`}>
          {/* Información del desarrollador */}
          <div className={`space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="text-sm">
              Desarrollado por: <span className={`font-semibold ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}>T.S.U Oswaldo Medina</span>
            </p>
            <p className="text-sm">
              Versión: <span className={`font-mono ${isDark ? 'text-[#c8f135]' : 'text-green-600'}`}>1.0</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
