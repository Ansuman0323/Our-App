import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { signup } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await signup(email, password, displayName);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow-lg rounded-xl border border-slate-100">
            <h2 className="text-3xl font-bold mb-6 text-center text-slate-800">Create Account</h2>
            {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
                    <input type="text" required className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isSubmitting} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input type="email" required className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input type="password" required className="w-full border border-slate-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                </div>
                <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50">
                    {isSubmitting ? 'Creating...' : 'Sign Up'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-slate-600">
                Already have an account? <Link to="/login" className="text-blue-600 font-medium hover:underline">Log in</Link>
            </p>
        </div>
    );
};