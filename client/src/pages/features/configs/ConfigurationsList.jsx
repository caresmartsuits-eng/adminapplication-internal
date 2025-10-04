import React from 'react';
import UpdateConfigHeaderModal from "../configHeaders/UpdateConfigHeaderModal.jsx";
import UpdateConfigModal from './UpdateConfigurationModal.jsx';
import {fetchWithAuthJSON} from "../../../utils/auth.js";

export default function ConfigurationsList({ setView }) {
  const [configs, setConfigs] = React.useState([]);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [editingId, setEditingId] = React.useState(null);
  const [form, setForm] = React.useState({
        english_description: '',
        telugu_description: '',
        sort_order: 0,
        status: 'A',
    });

    const load = React.useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await fetchWithAuthJSON(import.meta.env.VITE_API_BASE + '/api/admin/configurations');
            setConfigs(data);
        } catch (e) {
            setError(e.message || 'Failed to load configurations');
        } finally {
            setLoading(false);
        }
    }, []);
  const fetchConfigs = async () => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(import.meta.env.VITE_API_BASE + '/api/admin/configurations', {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch configurations');
      }
      const data = await response.json();
      setConfigs(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchConfigs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
    const startEdit = (cfg) => {
        setEditingId(cfg.id);
        setForm({
            english_description: cfg.english_description,
            telugu_description: cfg.telugu_description,
            sort_order: cfg.sort_order,
            status: cfg.status,
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({ english_description: '', telugu_description: '', sort_order: 0, status: 'A' });
    };


    const saveEdit = async () => {
        try {
            setError('');
            await fetchWithAuthJSON(import.meta.env.VITE_API_BASE + `/api/admin/configurations/update/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            await load();
            cancelEdit();
        } catch (e) {
            setError(e.message || 'Update failed');
        }
    };




    if (loading) return <div className="text-center text-gray-500">Loading configurations...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-4">
      <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Configurations</h3>
      <div className="mb-4">
        <button
          onClick={() => setView && setView('createConfiguration')}
          className="bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors"
        >
          Add New Config
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg shadow-md">
        <table className="min-w-full bg-white text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                ID
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Category
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                English Description
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Telugu Description
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Sort Order
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Created Date
              </th>
              <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                Status
              </th>
                <th className="py-3 px-4 sm:px-6 text-left font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {configs.length > 0 ? (
              configs.map((config) => (
                <tr key={config.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-900">{config.id}</td>
                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">{config.category}</td>
                    <td className="p-3">
                        {editingId === config.id ? (
                            <input
                                className="border rounded px-2 py-1 w-full"
                                value={form.english_description}
                                onChange={(e) => setForm((s) => ({ ...s, english_description: e.target.value }))}
                            />
                        ) : (
                            config.english_description
                        )}
                    </td>
                    <td className="p-3">
                        {editingId === config.id ? (
                            <input
                                className="border rounded px-2 py-1 w-full"
                                value={form.telugu_description}
                                onChange={(e) => setForm((s) => ({ ...s, telugu_description: e.target.value }))}
                            />
                        ) : (
                            config.telugu_description
                        )}
                    </td>
                    <td className="p-3">
                        {editingId === config.id ? (
                            <input
                                type="number"
                                className="border rounded px-2 py-1 w-24"
                                value={form.sort_order}
                                onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                            />
                        ) : (
                            config.sort_order
                        )}
                    </td>

                  <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap text-gray-600">
                    {new Date(config.created_date).toLocaleString()}
                  </td>
                    <td className="p-3">
                        {editingId === config.id ? (
                            <select
                                className="border rounded px-2 py-1"
                                value={form.status}
                                onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                            >
                                <option value="A">Active</option>
                                <option value="D">Disabled</option>
                            </select>
                        ) : config.status === 'A' ? (
                            <span className="text-green-700">Active</span>
                        ) : (
                            <span className="text-gray-500">Disabled</span>
                        )}
                    </td>
                    <td className="py-3 px-4 sm:py-4 sm:px-6 whitespace-nowrap">

                        {editingId === config.id ? (
                            <>
                                <button onClick={saveEdit} className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md hover:bg-blue-600 transition-colors">
                                    Save
                                </button>
                                <button onClick={cancelEdit} className="bg-red-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md hover:bg-red-600 transition-colors">
                                    Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => startEdit(config)} className="bg-blue-500 text-white font-bold py-2 px-3 rounded-lg text-xs shadow-md hover:bg-blue-600 transition-colors">
                                    Update
                                </button>

                            </>
                        )}


                    </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="py-4 px-6 text-center text-gray-500">
                  No configurations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
        
    </div>
  );
}