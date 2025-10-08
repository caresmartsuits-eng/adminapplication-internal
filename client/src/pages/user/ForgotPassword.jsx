import React, { useState } from 'react';

// Helper to check if a string is a valid email format
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);

export default function ForgotPassword({ onBack }) {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        // Validation Check
        if (!email) {
            return setError('Email ID is required.');
        }
        if (!isValidEmail(email)) {
            return setError('Please enter a valid email address.');
        }

        setIsSubmitting(true);

        // ----------------------------------------------------------------
        // NOTE: INTEGRATE BACKEND API CALL HERE
        // ----------------------------------------------------------------
        try {
            // Replace with your actual password reset API endpoint
            // const response = await fetch(import.meta.env.VITE_API_BASE + '/api/forgot-password', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ email }),
            // });

            // if (response.ok) {
            // Assuming success after submitting email
            setMessage('If an account exists with that email, a password reset link has been sent.');
            setEmail(''); // Clear the field on success
            // } else {
            //     // Handle specific backend errors (e.g., email not found)
            //     const err = await response.json();
            //     setError(err.error || 'Failed to send reset email. Please try again.');
            // }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">  Forgot Password
                </h1>
        <div className="p-2 sm:p-4">
            <p className="text-gray-600 mb-6 text-sm">Enter your email address to receive a password reset link.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">Email ID</label>
                    <input
                        id="email"
                        type="email"
                        className="w-full border rounded px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                        disabled={isSubmitting || !!message} // Disable after successful submit
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
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        disabled={isSubmitting || !!message}
                    >
                        {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                </div>
            </form>
        </div>
            </div>
        </div>

    );
}