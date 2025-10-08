import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithAuthJSON } from '../../../utils/auth';

const API_BASE = import.meta.env.VITE_API_BASE;

// Helper to check if a string is a valid email format
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

export default function UpdateProfile({ role, currentUsername }) {
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUsername, setSelectedUsername] = useState(currentUsername);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobileNumber: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    console.log(role,currentUsername);
    // 1. Fetch data on component mount or when selected user changes
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true);
            setError('');
            setMessage('');
            try {
                // Admin fetches all users for dropdown
                if (role === 'admin') {
                    const usersRes = await fetchWithAuthJSON(`${API_BASE}/api/admin/users`);
                    console.log(usersRes);
                    setAllUsers(usersRes || []);
                }

                // Fetch details for the currently selected user (either logged-in user or selected admin user)
                if (selectedUsername) {
                    const userDetailsRes = await fetchWithAuthJSON(`${API_BASE}/api/user/${selectedUsername}`);
                    console.log(userDetailsRes);
                    setFormData({
                        fullName: userDetailsRes.fullName || '',
                        email: userDetailsRes.email || '',
                        mobileNumber: userDetailsRes.mobileNumber || '',
                    });
                }
            } catch (err) {
                setError(err.message || 'Failed to fetch user data.');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [role, selectedUsername]);

    // Handler for form input changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handler for admin changing the user in the dropdown
    const handleUserChange = (e) => {
        setSelectedUsername(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Client-side validation
        if (!formData.email) {
            return setError('Email ID is mandatory.');
        }
        if (!isValidEmail(formData.email)) {
            return setError('Please enter a valid email address.');
        }

        setIsSubmitting(true);
        const userToUpdate = role === 'admin' ? selectedUsername : currentUsername;

        try {
            const endpoint = `${API_BASE}/api/user/${userToUpdate}`;

            const payload = {
                fullName: formData.fullName || undefined, // Optional field
                email: formData.email,
                mobileNumber: formData.mobileNumber || undefined, // Optional field
            };
            console.log("Submitting payload:", payload); // <-- Add this line

            const res = await fetchWithAuthJSON(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (res.error) {
                throw new Error(res.error);
            }

            setMessage(`Profile for ${userToUpdate} updated successfully!`);
        } catch (err) {
            setError(err.message || 'Failed to update profile.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-6 text-gray-500">Loading profile data...</div>;

    const isUserEditable = role === 'user'; // For user, username field is non-editable

    return (
        <div className="max-w-xl mx-auto p-4 sm:p-6 bg-white rounded-lg shadow-xl">
            <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-6 text-left md:text-center">
                Update Profile
            </h3>

            {message && <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 rounded">{message}</div>}
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Username Field (Conditional Dropdown for Admin) */}
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    {role === 'admin' ? (
                        <select
                            id="username"
                            value={selectedUsername}
                            onChange={handleUserChange}
                            className="mt-1 block w-full border border-gray-300 bg-white rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            disabled={isSubmitting}
                        >
                            <option value="">-- Select User --</option>
                            {allUsers.map(user => (
                                <option key={user.username} value={user.username}>{user.username}</option>
                            ))}
                        </select>
                    ) : (
                        <input
                            type="text"
                            id="username"
                            value={currentUsername}
                            className="mt-1 block w-full border border-gray-300 bg-gray-100 rounded-md py-2 px-3 text-gray-600 cursor-not-allowed"
                            readOnly
                        />
                    )}
                </div>

                {/* User Full Name (Optional) */}
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">User Full Name (Optional)</label>
                    <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting || !selectedUsername}
                    />
                </div>

                {/* Email ID (Mandatory) */}
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email ID <span className="text-red-500">*</span></label>
                    <input
                        type="email"
                        name="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        required
                        disabled={isSubmitting || !selectedUsername}
                    />
                </div>

                {/* Mobile Number (Optional) */}
                <div>
                    <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700">Mobile Number (Optional)</label>
                    <input
                        type="tel"
                        name="mobileNumber"
                        id="mobileNumber"
                        value={formData.mobileNumber}
                        onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                        disabled={isSubmitting || !selectedUsername}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed"
                    disabled={isSubmitting || !selectedUsername}
                >
                    {isSubmitting ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
}