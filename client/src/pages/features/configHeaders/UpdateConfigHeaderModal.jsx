import React from 'react';
import Modal from '../../../components/Modal';

export default function UpdateConfigHeaderModal({ header, onClose, onHeaderUpdated }) {
  const [updatedHeader, setUpdatedHeader] = React.useState({ ...header });
  const [updateError, setUpdateError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdateError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + `/api/admin/config-headers/update/${updatedHeader.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(updatedHeader),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update config header');
      }

      setModalMessage('Config header updated successfully!');
      if (onHeaderUpdated) onHeaderUpdated();
      onClose();
    } catch (err) {
      setUpdateError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white p-5 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-md mx-auto">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 text-center">Update Config Header</h3>
        <form onSubmit={handleUpdate} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Category Code</label>
            <input
              type="text"
              value={updatedHeader.category_code}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              readOnly
            />
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">English Description</label>
            <textarea
              value={updatedHeader.category_description_english}
              onChange={(e) =>
                setUpdatedHeader({ ...updatedHeader, category_description_english: e.target.value })
              }
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Telugu Description</label>
            <textarea
              value={updatedHeader.category_description_telugu}
              onChange={(e) =>
                setUpdatedHeader({ ...updatedHeader, category_description_telugu: e.target.value })
              }
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            ></textarea>
          </div>
          <div>
            <label className="block text-gray-700 font-semibold mb-1">Status</label>
            <select
              value={updatedHeader.status}
              onChange={(e) => setUpdatedHeader({ ...updatedHeader, status: e.target.value })}
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="A">Active</option>
              <option value="D">Deactivated</option>
            </select>
          </div>
          {updateError && <p className="text-red-500 text-sm text-center font-medium">{updateError}</p>}
          <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-green-600 transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}