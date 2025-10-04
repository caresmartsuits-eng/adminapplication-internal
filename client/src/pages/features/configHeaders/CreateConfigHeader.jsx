import React from 'react';
import Modal from '../../../components/Modal';

export default function CreateConfigHeader({ onConfigHeaderCreated }) {
  const [newHeader, setNewHeader] = React.useState({
    category_code: '',
    category_description_english: '',
    category_description_telugu: '',
    status: 'A',
  });
  const [createHeaderError, setCreateHeaderError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');

  const handleCreateHeader = async (e) => {
    e.preventDefault();
    setCreateHeaderError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/config-headers/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(newHeader),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create config header');
      }

      setModalMessage('Config header created successfully!');
      setNewHeader({
        category_code: '',
        category_description_english: '',
        category_description_telugu: '',
        status: 'A',
      });
      if (onConfigHeaderCreated) onConfigHeaderCreated();
    } catch (err) {
      setCreateHeaderError(err.message);
    }
  };

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Add New Config Category</h3>
      <form
        onSubmit={handleCreateHeader}
        className="space-y-3 sm:space-y-4 max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-xl shadow-md"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Category Code</label>
          <input
            type="text"
            value={newHeader.category_code}
            onChange={(e) => setNewHeader({ ...newHeader, category_code: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">English Description</label>
          <textarea
            value={newHeader.category_description_english}
            onChange={(e) =>
              setNewHeader({ ...newHeader, category_description_english: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Telugu Description</label>
          <textarea
            value={newHeader.category_description_telugu}
            onChange={(e) =>
              setNewHeader({ ...newHeader, category_description_telugu: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Status</label>
          <select
            value={newHeader.status}
            onChange={(e) => setNewHeader({ ...newHeader, status: e.target.value })}
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="A">Active</option>
            <option value="D">Deactivated</option>
          </select>
        </div>
        {createHeaderError && (
          <p className="text-red-500 text-sm text-center font-medium">{createHeaderError}</p>
        )}
        <button
          type="submit"
          className="w-full bg-green-500 text-white font-bold py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Create Category
        </button>
      </form>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}