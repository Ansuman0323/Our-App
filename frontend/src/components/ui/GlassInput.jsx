import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';

const EyeIcon = ({ open }) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {open ? (
            <>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            </>
        ) : (
            <>
                <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M10.6 5.2A10.6 10.6 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.6 6.6C3.7 8.5 2 12 2 12s3.5 7 10 7a9.9 9.9 0 0 0 3.4-.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </>
        )}
    </svg>
);

/**
 * GlassInput — the auth/premium text field used by Login and Signup.
 * A plain, fully controlled `<input>` under the hood (no new state
 * beyond an optional local password-visibility toggle), styled to
 * read correctly against the dark glass surfaces: real placeholder
 * contrast, a visible caret and focus ring, and a Chrome-autofill fix
 * — all real problems the previous inputs had, not just re-skinning.
 */
export const GlassInput = ({
    label,
    type = 'text',
    id,
    error,
    className = '',
    ...rest
}) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const isPassword = type === 'password';
    const [revealed, setRevealed] = useState(false);

    return (
        <div className={`glass-input ${error ? 'glass-input--error' : ''} ${className}`.trim()}>
            {label && (
                <label className="glass-input__label" htmlFor={inputId}>
                    {label}
                </label>
            )}
            <div className="glass-input__field">
                <input
                    id={inputId}
                    type={isPassword ? (revealed ? 'text' : 'password') : type}
                    className="glass-input__control"
                    {...rest}
                />
                {isPassword && (
                    <button
                        type="button"
                        className="glass-input__toggle"
                        onClick={() => setRevealed((v) => !v)}
                        aria-label={revealed ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                    >
                        <EyeIcon open={revealed} />
                    </button>
                )}
            </div>
            {error && (
                <motion.p
                    className="glass-input__error"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
};

export default GlassInput;