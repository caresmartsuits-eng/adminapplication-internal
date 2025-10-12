import React, { useState } from 'react';


export default function SidebarNav({ items,profileItems, onSelect, activeKey }) {
    const [openGroups, setOpenGroups] = useState({});

    const toggleGroup = (key) => {
        setOpenGroups(prev => {
            const isCurrentlyOpen = !!prev[key];

            // If the clicked group is already open, return an empty object to close all groups.
            if (isCurrentlyOpen) {
                return {};
            }

            // If the clicked group is closed, open it and close all others
            // by setting the state to only include the new key.
            return {
                [key]: true,
            };
        });
    };

    const renderItem = (item, isChild = false) => {
        const isActive = activeKey === item.key;

        const itemClasses = `p-3 flex items-center transition-colors cursor-pointer ${
            isActive ? 'bg-blue-600 text-white font-bold' : 'text-gray-300 hover:bg-gray-700'
        } ${isChild ? 'pl-12' : 'pl-4'}`;
        const iconClasses = `fa-fw mr-3 ${isChild ? 'text-xs' : 'text-base'}`;

        if (item.isGroup) {
            const isOpen = !!openGroups[item.key];
            return (
                <div key={item.key}>
                    <div className={`${itemClasses} font-semibold`} onClick={() => toggleGroup(item.key)}>
                        <i className={`fa-solid ${item.icon} ${iconClasses}`}></i>
                        <span className="flex-1">{item.label}</span>
                        <i className={`fa-solid fa-chevron-down ml-2 transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
                    </div>
                    <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                        {item.children.map(child => renderItem(child, true))}
                    </div>
                </div>
            );
        }

        return (
            <div
                key={item.key}
                className={itemClasses}
                onClick={() => onSelect(item.key)}
            >
                <i className={`fa-solid ${item.icon || 'fa-circle-dot'} ${iconClasses}`}></i>
                <span>{item.label}</span>
            </div>
        );
    };

    return (
        <nav className="space-y-1 p-2">
            {items.map(item => renderItem(item))}
            {/* Separator for profile items */}
            <hr className="border-gray-700 my-4" />
            {profileItems.map(item => renderItem(item))}
        </nav>
    );
}