import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// 💡 Assuming you have react-fontawesome installed and imported somewhere
// If not, use standard <svg> or other icon libraries.
import { faSignOutAlt, faBars } from '@fortawesome/free-solid-svg-icons';


export default function TopBar({ title, onLogout, onMenu, username }) {
    // Use a primary color for the top bar (e.g., dark blue/gray for a professional look)
    // We'll use a shadow for depth and keep the backdrop blur.
    return (
        <div className="sticky top-0 z-40 bg-gray-900 shadow-md">
            <div className="flex items-center justify-between h-14 px-3 sm:px-4 md:px-6">

                {/* 1. Menu Button for Mobile (Hidden on Medium screens and up) */}
                <button
                    onClick={onMenu}
                    className="md:hidden p-2 rounded text-white hover:bg-gray-700 transition-colors"
                    aria-label="Open menu"
                >
                    {/* Use Font Awesome Icon for cleaner look */}
                    <FontAwesomeIcon icon={faBars} className="text-xl" />
                </button>

                {/* 2. Main Title (Left-aligned) */}
                <h1 className="text-xl font-extrabold text-white truncate flex-1 md:text-2xl">
                    {title}
                </h1>

                {onLogout ? (
                    <div className="flex items-center space-x-4">
                        {/* 3. Username Display (Optional but nice touch) */}
                        {username && (
                            <span className="hidden sm:inline-block text-sm font-medium text-gray-300">
                Logged in as: <strong className="text-white">{username}</strong>
              </span>
                        )}

                        {/* 4. Logout Button */}
                        <button
                            onClick={onLogout}
                            className="text-sm bg-red-600 text-white px-3 py-2 rounded-full font-semibold flex items-center space-x-2
                         hover:bg-red-700 transition-colors shadow-lg"
                            aria-label="Logout"
                        >
                            <FontAwesomeIcon icon={faSignOutAlt} className="text-sm" />
                            <span className="hidden sm:inline">Logout</span> {/* Show text on larger screens */}
                        </button>
                    </div>
                ) : (
                    <span className="w-[74px]" aria-hidden="true"></span>
                )}
            </div>
        </div>
    );
}