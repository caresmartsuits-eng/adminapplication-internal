import React from 'react';
import Modal from '../../../components/Modal';
import { fetchWithAuthJSON } from '../../../utils/auth';

export default function ConfigurationsList() {
    const [configs, setConfigs] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
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
            const data = await fetchWithAuthJSON('/api/admin/configurations');
            setConfigs(data);
        } catch (e) {
            setError(e.message || 'Failed to load configurations');
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

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
            await fetchWithAuthJSON(`/api/admin/configurations/update/${editingId}`, {
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

    const remove = async (id) => {
        if (!confirm('Delete this configuration?')) return;
        try {
            setError('');
            await fetchWithAuthJSON(`/api/admin/configurations/update/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                // Soft-delete by setting status to D (matches backend validation)
                body: JSON.stringify({
                    english_description: configs.find((c) => c.id === id).english_description,
                    telugu_description: configs.find((c) => c.id === id).telugu_description,
                    sort_order: configs.find((c) => c.id === id).sort_order,
                    status: 'D',
                }),
            });
            await load();
        } catch (e) {
            setError(e.message || 'Delete failed');
        }
    };

    if (loading) return <p className="p-4">Loading...</p>;
    if (error) return <p className="p-4 text-red-600">{error}</p>;

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurations</h3>
            <table className="w-full bg-white rounded shadow overflow-hidden">
                <thead className="bg-gray-100 text-left">
                <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">English</th>
                    <th className="p-3">Telugu</th>
                    <th className="p-3">Sort</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                </tr>
                </thead>
                <tbody>
                {configs.map((cfg) => (
                    <tr key={cfg.id} className="border-t">
                        <td className="p-3">{cfg.category}</td>
                        <td className="p-3">
                            {editingId === cfg.id ? (
                                <input
                                    className="border rounded px-2 py-1 w-full"
                                    value={form.english_description}
                                    onChange={(e) => setForm((s) => ({ ...s, english_description: e.target.value }))}
                                />
                            ) : (
                                cfg.english_description
                            )}
                        </td>
                        <td className="p-3">
                            {editingId === cfg.id ? (
                                <input
                                    className="border rounded px-2 py-1 w-full"
                                    value={form.telugu_description}
                                    onChange={(e) => setForm((s) => ({ ...s, telugu_description: e.target.value }))}
                                />
                            ) : (
                                cfg.telugu_description
                            )}
                        </td>
                        <td className="p-3">
                            {editingId === cfg.id ? (
                                <input
                                    type="number"
                                    className="border rounded px-2 py-1 w-24"
                                    value={form.sort_order}
                                    onChange={(e) => setForm((s) => ({ ...s, sort_order: Number(e.target.value) }))}
                                />
                            ) : (
                                cfg.sort_order
                            )}
                        </td>
                        <td className="p-3">
                            {editingId === cfg.id ? (
                                <select
                                    className="border rounded px-2 py-1"
                                    value={form.status}
                                    onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
                                >
                                    <option value="A">Active</option>
                                    <option value="D">Disabled</option>
                                </select>
                            ) : cfg.status === 'A' ? (
                                <span className="text-green-700">Active</span>
                            ) : (
                                <span className="text-gray-500">Disabled</span>
                            )}
                        </td>
                        <td className="p-3 space-x-2">
                            {editingId === cfg.id ? (
                                <>
                                    <button onClick={saveEdit} className="bg-blue-600 text-white px-2 py-1 rounded">
                                        Save
                                    </button>
                                    <button onClick={cancelEdit} className="border px-2 py-1 rounded">
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => startEdit(cfg)} className="border px-2 py-1 rounded">
                                        Update
                                    </button>
                                    <button
                                        onClick={() => remove(cfg.id)}
                                        className="border px-2 py-1 rounded text-red-600"
                                    >
                                        Delete
                                    </button>
                                </>
                            )}
                        </td>
                    </tr>
                ))}
                {configs.length === 0 && (
                    <tr>
                        <td className="p-4 text-center text-gray-500" colSpan={6}>
                            No configurations found.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    );
}
// ... existing code ...