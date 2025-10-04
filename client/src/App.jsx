import React, { useEffect, useMemo, useState } from 'react';
import { getToken, setToken, clearToken, parseJwt, fetchWithAuthJSON } from './utils/auth';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
// eslint-disable-next-line no-undef

// ... existing code ...

export default function App() {
    const [auth, setAuth] = useState({ token: null, role: null, username: '' });
    const [form, setForm] = useState({ username: '', password: '' });
    const [error, setError] = useState('');

    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const payload = parseJwt(token);
                setAuth({ token, role: payload.role, username: payload.username || '' });
            } catch {
                clearToken();
            }
        }
    }, []);

    const isAuthed = useMemo(() => Boolean(auth.token && auth.role), [auth]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: form.username, password: form.password }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Login failed');
            }
            const data = await res.json();
            setToken(data.token);
            const payload = parseJwt(data.token);
            setAuth({ token: data.token, role: payload.role, username: payload.username || form.username });
            setForm({ username: '', password: '' });
        } catch (err) {
            setError(err.message || 'Login failed');
        }
    };

    const handleLogout = () => {
        clearToken();
        setAuth({ token: null, role: null, username: '' });
        setForm({ username: '', password: '' });
        setError('');
    };

    const pingProtected = async () => {
        try {
            await fetchWithAuthJSON('/api/admin/users');
            alert('Protected request succeeded');
        } catch (e) {
            alert('Protected request failed: ' + e.message);
        }
    };

    if (isAuthed && auth.role === 'admin') {
        return <AdminDashboard onLogout={handleLogout} />;
    }
    if (isAuthed && auth.role === 'user') {
        return <UserDashboard onLogout={handleLogout} />;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white w-full max-w-sm p-6 rounded-lg shadow">
                <h2 className="text-2xl font-bold text-center mb-4">Login</h2>
                <form onSubmit={handleLogin} className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium mb-1">Username</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            value={form.username}
                            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
                            autoComplete="username"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Password</label>
                        <input
                            className="w-full border rounded px-3 py-2"
                            type="password"
                            value={form.password}
                            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                        Login
                    </button>
                </form>

                <button onClick={pingProtected} className="mt-4 w-full border py-2 rounded text-sm">
                    Test protected call
                </button>
            </div>
        </div>
    );
}