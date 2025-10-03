import React from 'react';

export default function TopBar({ title, onLogout, onMenu }) {
  return (
    <div className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="flex items-center justify-between h-14 px-3 sm:px-4 md:px-6">
        <button onClick={onMenu} className="md:hidden p-2 rounded hover:bg-gray-100" aria-label="Open menu">
          <svg width="24" height="24" fill="none" stroke="currentColor">
            <path strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-gray-800 truncate">{title}</h1>
        {onLogout ? (
          <button
            onClick={onLogout}
            className="text-sm bg-red-500 text-white px-3 py-2 rounded md:py-2.5 hover:bg-red-600"
          >
            Logout
          </button>
        ) : (
          <span className="w-[74px]" aria-hidden="true"></span>
        )}
      </div>
    </div>
  );
}