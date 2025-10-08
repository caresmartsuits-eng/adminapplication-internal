import React from 'react';

export default function SidebarNav({ title, items, onSelect, onLogout }) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-white/10">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>
      <nav className="flex-1 overflow-y-auto">
        {items.map((i) => (
          <button
            key={i.key}
            onClick={() => onSelect(i.key)}
            className="w-full text-left p-4 hover:bg-gray-700 transition-colors rounded-none block"
          >
            {i.label}
          </button>
        ))}
      </nav>

    </div>
  );
}