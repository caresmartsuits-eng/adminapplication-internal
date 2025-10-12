import React, { useState } from 'react';
import loginImage from "../../assets/SS_logo.png";

// Helper to check if a string is a valid email format
const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
const API_BASE = import.meta.env.VITE_API_BASE;


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
            const response = await fetch(`${API_BASE}/api/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

             if (response.ok) {
            // Assuming success after submitting email
            setMessage('Password reset link has been sent.');

            setEmail(''); // Clear the field on success

             } else {
            //     // Handle specific backend errors (e.g., email not found)
                 const err = await response.json();
                 setError(err.error || 'Failed to send reset email. Please try again.');
             }
        } catch (err) {
            setError('Network error. Please check your connection.'+err);
        } finally {
            setIsSubmitting(false);
        }
    };

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

            <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-xl shadow-2xl">
                <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-6">  Forgot Password
                </h1>
        <div className="p-2 sm:p-4">
            <div className={ message ? 'hidden' : ''}>
                <p className="text-gray-600 mb-6 text-sm ">Enter your email address to receive a password reset link.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className={ message ? 'hidden' : ''}>
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
                    <div className={ message ? 'hidden' : ''}>
                    <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                        disabled={isSubmitting || !!message}
                    >
                        {isSubmitting ? 'Sending...' : 'Submit'}
                    </button>
                    </div>
                </div>
            </form>
        </div>
            </div>
        </div>
            </div>

    );
}