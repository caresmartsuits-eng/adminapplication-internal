import React, { useState, useEffect } from 'react';
import { fetchWithAuthJSON } from '../../../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE;

// Regex for password validation:
// Must be alphanumeric, contain at least one number and one letter, and be 8+ characters.
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export default function UpdatePassword({ username }) {
    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
        // Clear status messages on change
        setMessage('');
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const { newPassword, confirmPassword } = passwordForm;

        // 1. Check for empty password
        if (!newPassword || !confirmPassword) {
            return setError('Password fields cannot be empty.');
        }

        // 2. Check password strength (alphanumeric, one number, one letter, 8+ chars)
        if (!passwordRegex.test(newPassword)) {
            return setError(
                'New password must be at least 8 characters long, contain at least one letter and one number.'
            );
        }

        // 3. Check if passwords match
        if (newPassword !== confirmPassword) {
            return setError('New password and confirmation password do not match.');
        }

        setIsSubmitting(true);

        try {
            // Note: The backend must check if the newPassword is the same as the old one.
            const endpoint = `${API_BASE}/api/user/${username}/password`;

            const res = await fetchWithAuthJSON(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ newPassword }),
            });

            if (res.error) {
                // The backend will return an error if the new password is the same as the old one
                console.log(res.error);
                throw new Error(res.error);
            }

            setMessage('Password updated successfully!');
            setPasswordForm({ newPassword: '', confirmPassword: '' }); // Clear fields
        } catch (err) {
            console.error('Error updating password:', err);
            setError(err.error || 'Failed to update password.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 bg-white shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Update Password</h2>

            {message && <p className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</p>}
            {error && <p className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username (Non-editable) */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed"
                        disabled
                    />
                </div>

                {/* New Password */}
                <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                    <input
                        type="password"
                        name="newPassword"
                        id="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isSubmitting}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Must be at least 8 characters, include one letter and one number.
                    </p>
                </div>

                {/* Confirm Password */}
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Changing Password...' : 'Change Password'}
                </button>
            </form>
        </div>
    );
}