import React, { useEffect, useMemo, useState } from 'react';
import { getToken, setToken, clearToken, parseJwt, fetchWithAuthJSON } from './utils/auth';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserDashboard from './pages/user/UserDashboard';
import ForgotPassword from './pages/user/ForgotPassword';
// eslint-disable-next-line no-undef

// A simple loading spinner component (purely for demonstration, you might use a library one)
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export default function App() {
    const [auth, setAuth] = useState({token: null, role: null, username: ''});
    const [form, setForm] = useState({username: '', password: ''});
    const [error, setError] = useState('');
    // New state to track if the login request is in progress
    const [isLoading, setIsLoading] = useState(false);

    const [view, setView] = useState('login');
    useEffect(() => {
        const token = getToken();
        if (token) {
            try {
                const payload = parseJwt(token);
                setAuth({token, role: payload.role, username: payload.username || ''});
            } catch {
                clearToken();
            }
        }
    }, []);

    const isAuthed = useMemo(() => Boolean(auth.token && auth.role), [auth]);


    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        // 1. Start loading
        setIsLoading(true);

        try {
            const res = await fetch(import.meta.env.VITE_API_BASE + '/api/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username: form.username, password: form.password}),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Login failed');
            }
            const data = await res.json();
            setToken(data.token);
            const payload = parseJwt(data.token);
            setAuth({token: data.token, role: payload.role, username: payload.username || form.username});
            setForm({username: '', password: ''});
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            // 2. Stop loading, regardless of success or failure
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        clearToken();
        setAuth({token: null, role: null, username: ''});
        setForm({username: '', password: ''});
        setError('');
    };

    if (isAuthed && auth.role === 'admin') {
        return <AdminDashboard onLogout={handleLogout} username={auth.username}/>;
    }
    if (isAuthed && auth.role === 'user') {
        return <UserDashboard onLogout={handleLogout} username={auth.username}/>;
    }
    //const renderContent = () => {
        if (view === 'forgotPassword') {
            return <ForgotPassword />;
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
                                onChange={(e) => setForm((s) => ({...s, username: e.target.value}))}
                                autoComplete="username"
                                required
                                // Disable input while loading
                                disabled={isLoading}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Password</label>
                            <input
                                className="w-full border rounded px-3 py-2"
                                type="password"
                                value={form.password}
                                onChange={(e) => setForm((s) => ({...s, password: e.target.value}))}
                                autoComplete="current-password"
                                required
                                // Disable input while loading
                                disabled={isLoading}
                            />
                        </div>
                        {error && <p className="text-red-600 text-sm">{error}</p>}
                        <button
                            type="submit"
                            className={`w-full py-2 rounded transition-colors flex items-center justify-center ${
                                // Change button style based on loading state
                                isLoading
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                            // Disable button while loading
                            disabled={isLoading}
                        >
                            {/* Display spinner and text based on loading state */}
                            {isLoading ? (
                                <>
                                    <LoadingSpinner/>
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={() => setView('forgotPassword')}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    </form>
                </div>
            </div>
    );
    }
