import React from 'react';

export default function Modal({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-md mx-auto text-center">
        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Notification</h3>
        <p className="mb-4 sm:mb-6 text-sm sm:text-base">{message}</p>
        <button
          onClick={onClose}
          className="w-full sm:w-auto bg-blue-600 text-white font-bold py-2 px-4 sm:px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}