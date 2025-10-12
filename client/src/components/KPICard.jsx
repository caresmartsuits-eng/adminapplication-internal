import React from 'react';

// Assumes you are using a library like Font Awesome for the 'icon' prop
// If not, replace the <i> tag with a component or SVG import.

const KPICard = ({ title, value, icon, color, linkAction }) => {
    return (
        <div
            className={`bg-white shadow-xl rounded-lg p-6 flex items-center justify-between transition duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02] cursor-pointer`}
            onClick={linkAction}
        >
            {/* Icon and Color Indicator */}
            <div
                className={`p-3 rounded-full ${color} bg-opacity-80 text-white`}
            >
                <i className={`${icon} text-xl w-6 h-6 flex items-center justify-center`}></i>
            </div>

            {/* Content */}
            <div className="text-right">
                <p className="text-gray-500 text-sm uppercase font-semibold">{title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{value}</p>
            </div>
        </div>
    );
};

export default KPICard;