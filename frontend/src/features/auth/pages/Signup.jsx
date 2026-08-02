import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../../contexts/AuthContext';
import { GlassCard, GlassButton } from '../../../components/ui';
import { GlassInput } from '../../../components/ui/GlassInput';

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
        <div className="auth-page">
            <motion.div
                className="auth-hero"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
                <motion.span
                    className="auth-hero__heart"
                    aria-hidden="true"
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M12 21s-6.7-4.35-9.33-8.6C1.02 9.7 1.9 6.2 4.9 5.02 7 4.2 9.2 5 10.5 6.75L12 8.6l1.5-1.85C14.8 5 17 4.2 19.1 5.02c3 1.18 3.88 4.68 2.23 7.38C18.7 16.65 12 21 12 21z"
                            fill="currentColor"
                        />
                    </svg>
                </motion.span>
                <h1 className="auth-hero__title">Create your story</h1>
                <p className="auth-hero__subtitle">Every forever starts somewhere.</p>
            </motion.div>

            <GlassCard as="div" className="auth-card">
                {error && (
                    <motion.div
                        className="auth-card__error"
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        role="alert"
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="auth-form" noValidate>
                    <GlassInput
                        label="Display Name"
                        type="text"
                        name="displayName"
                        autoComplete="name"
                        required
                        placeholder="What should we call you?"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <GlassInput
                        label="Email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isSubmitting}
                    />
                    <GlassInput
                        label="Password"
                        type="password"
                        name="password"
                        autoComplete="new-password"
                        required
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isSubmitting}
                    />

                    <GlassButton
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        disabled={isSubmitting}
                        className="auth-form__submit"
                    >
                        Begin Your Journey
                    </GlassButton>
                </form>
            </GlassCard>

            <p className="auth-footer">
                Already part of a story?{' '}
                <Link to="/login" className="auth-footer__link">
                    Sign in
                </Link>
            </p>
        </div>
    );
};