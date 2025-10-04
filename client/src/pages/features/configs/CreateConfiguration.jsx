import React from 'react';
import Modal from '../../../components/Modal';

export default function CreateConfiguration({ onConfigCreated, headers }) {
  const [newConfig, setNewConfig] = React.useState({
    category: '',
    english_description: '',
    telugu_description: '',
    sort_order: '',
    status: 'A',
  });
  const [createConfigError, setCreateConfigError] = React.useState('');
  const [modalMessage, setModalMessage] = React.useState('');
  const [categories, setCategories] = React.useState([]);
  const [loadingCategories, setLoadingCategories] = React.useState(true);
  const [category, setCategory] = React.useState('');
  const [categoryCode, setCategoryCode] = React.useState('');

  React.useEffect(() => {
    const fetchCategories = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/active-config-headers', {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err.message);
        setCreateConfigError('Failed to load categories. Please try again.');
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Optional: auto-map category code if headers prop is supplied
  React.useEffect(() => {
    if (headers) {
      const selectedHeader = headers.find(
        (h) => h.category_description_english === category
      );
      if (selectedHeader) {
        setCategoryCode(selectedHeader.category_code);
      } else {
        setCategoryCode('');
      }
    }
  }, [category, headers]);

  const handleCreateConfig = async (e) => {
    e.preventDefault();
    setCreateConfigError('');
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/configurations/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(newConfig),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create configuration');
      }

      setModalMessage('Configuration created successfully!');
      setNewConfig({
        category: '',
        english_description: '',
        telugu_description: '',
        sort_order: '',
        status: 'A',
      });
      if (onConfigCreated) onConfigCreated();
    } catch (err) {
      setCreateConfigError(err.message);
    }
  };

  if (loadingCategories) {
    return <div className="p-4 text-center text-gray-500">Loading categories...</div>;
  }

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">
        Add New Configuration
      </h3>
      <form
        onSubmit={handleCreateConfig}
        className="space-y-3 sm:space-y-4 max-w-lg mx-auto bg-white p-5 sm:p-6 rounded-xl shadow-md"
      >
        <div>
          <label className="block text-gray-700 font-semibold mb-1">Category</label>
          <select
            value={newConfig.category}
            onChange={(e) =>
              setNewConfig({ ...newConfig, category: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat, index) => (
              <option key={index} value={cat.category_code}>
                {cat.category_description_english}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            English Description
          </label>
          <textarea
            value={newConfig.english_description}
            onChange={(e) =>
              setNewConfig({ ...newConfig, english_description: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">
            Telugu Description
          </label>
          <textarea
            value={newConfig.telugu_description}
            onChange={(e) =>
              setNewConfig({ ...newConfig, telugu_description: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          ></textarea>
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Sort Order</label>
          <input
            type="number"
            value={newConfig.sort_order}
            onChange={(e) =>
              setNewConfig({ ...newConfig, sort_order: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700 font-semibold mb-1">Status</label>
          <select
            value={newConfig.status}
            onChange={(e) =>
              setNewConfig({ ...newConfig, status: e.target.value })
            }
            className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="A">Active</option>
            <option value="D">Deactivated</option>
          </select>
        </div>

        {createConfigError && (
          <p className="text-red-500 text-sm text-center font-medium">
            {createConfigError}
          </p>
        )}

        <button
          type="submit"
          className="w-full bg-green-500 text-white font-bold py-2.5 sm:py-3 rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Add Config
        </button>
      </form>
      <Modal message={modalMessage} onClose={() => setModalMessage('')} />
    </div>
  );
}