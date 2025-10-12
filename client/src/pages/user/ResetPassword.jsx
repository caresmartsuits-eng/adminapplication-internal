// src/pages/auth/ResetPassword.jsx

import React, { useState, useEffect } from 'react';
// Assuming the utility functions are available in your App component scope or similar
// If not, you may need to define or import the passwordRegex
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
const API_BASE = import.meta.env.VITE_API_BASE;
import loginImage from "../../assets/SS_logo.png";

export default function ResetPassword({ onBack, onLoginSuccess }) {
    // State to hold the new password and its confirmation
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState(null);
    const [isFatalError, setIsFatalError] = useState(false);

    const isFormDisabled = isSubmitting || !!message || !!error || !token;
    // 1. Extract Token from URL on component mount
    useEffect(() => {
        // Get the full query string from the browser's location
        const params = new URLSearchParams(window.location.search);
        // Look for the 'token' parameter
        const resetToken = params.get('token');

        if (!resetToken) {
            setError('Missing password reset token.');
            setIsFatalError(true);
        } else {
            setToken(resetToken);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            return setError('Reset token is missing or invalid.');
        }

        if (password !== confirmPassword) {
            return setError('Passwords do not match.');
        }

        if (!passwordRegex.test(password)) {
            return setError(
                'Password must be at least 8 characters long, contain at least one letter and one number.'
            );
        }

        setIsSubmitting(true);

        try {
            const response = await fetch(API_BASE + '/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    newPassword: password
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Password successfully reset
                setMessage(data.message || 'Your password has been reset successfully. Please log in.');
                // Optionally redirect to login after a delay
                setTimeout(onBack, 3000);
            } else {
                setError(data.error || 'Failed to reset password. The link may have expired.');
                setIsSubmitting(false);
            }
        } catch (e) {
            console.error('Reset password error:', e);
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token && !error) {
        return <div className="text-center p-8">Checking reset link...</div>;
    }

    return (
        <div className="min-h-screen flex">
            {/* LEFT HALF: VISUAL/MARKETING SIDE */}
            <div className="hidden lg:flex w-1/2 bg-gray-900 relative items-center justify-center p-12">
                {/* Background Image (Replace with your actual image path) */}
                <img
                    src={loginImage} // Use your imported image here
                    alt="Delivery Dashboard Background"
                    className="absolute inset-0 h-full w-full object-cover opacity-60 "
                />
                {/* Overlay Content */}
                <div className="relative z-10 text-center text-white">
                    <h1 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Delivery Dashboard</h1>
                    <p className="text-lg font-light">Efficiently manage your deliveries and users.</p>
                    {/*  */}
                </div>
            </div>

            <div className={`
                min-h-screen 
                flex items-center justify-center p-4 
                bg-[url('${loginImage}')] bg-no-repeat bg-top bg-contain
                sm:bg-gray-100 sm:bg-none w-full sm:w-1/2 
            `}>
            <div className="max-w-md w-full p-6 sm:p-8 space-y-4 bg-white shadow-xl rounded-xl">
                <h2 className="text-2xl font-bold text-gray-900 text-center">Set New Password</h2>
                <div className={ message ? 'hidden' : ''}>
                <p className="text-sm text-center text-gray-500">
                    Enter and confirm your new password.
                </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password Field */}
                    <div className={ message ? 'hidden' : ''}>
                        <label className="block text-sm font-medium mb-1">New Password</label>
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={isSubmitting || !!message || isFatalError} // Disable on success/error
                        />
                    </div>

                    {/* Confirm Password Field */}
                    <div className={ message ? 'hidden' : ''}>
                        <label className="block text-sm font-medium mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={isSubmitting || !!message || isFatalError}
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {message && <p className="text-green-600 text-sm font-medium">{message}</p>}

                    <div className="flex justify-between items-center pt-2">
                        <button
                            type="button"
                            onClick={onBack}
                            className="text-blue-600 hover:underline text-sm disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            ← Back to Login
                        </button>
                        <div className={ message ? 'hidden' : ''}>
                        <button
                            type="submit"
                            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                            disabled={isSubmitting || !!message || isFatalError} // Disable on success/invalid token
                        >
                            {isSubmitting ? 'Resetting...' : 'Reset Password'}
                        </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
        </div>
    );
}