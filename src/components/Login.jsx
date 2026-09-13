// src/components/Login.jsx - Exact Clerk colors
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    auth,
    db,
    doc,
    setDoc,
    serverTimestamp,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    GoogleAuthProvider,
    signInWithPopup
} from '../firebase/config';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleLoading(true);
        setError('');

        try {
            const provider = new GoogleAuthProvider();
            provider.setCustomParameters({ prompt: 'select_account' });

            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            try {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    name: user.displayName || user.email?.split('@')[0] || 'User',
                    email: user.email,
                    photoURL: user.photoURL || '',
                    phone: '',
                    role: user.email === 'loki@gmail.com' ? 'admin' : 'user',
                    provider: 'google',
                    lastLogin: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (firestoreErr) {
                console.warn('Firestore save failed (non-blocking):', firestoreErr);
            }

            if (user.email === 'loki@gmail.com') {
                alert('👑 Welcome Admin! You have full access.');
            } else {
                alert(`👋 Welcome, ${user.displayName || user.email}!`);
            }

            navigate('/');

        } catch (error) {
            console.error('Google Sign-In Error:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                setError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                setError('Popup was blocked. Please allow popups and try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                setError('Sign-in cancelled.');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with this email using a different sign-in method.');
            } else {
                setError(error.message);
            }
        }

        setIsGoogleLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.email.trim() || !formData.password) {
            setError('Please enter both email and password.');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email.trim(),
                formData.password
            );

            const user = userCredential.user;

            if (user.email === 'loki@gmail.com') {
                alert('👑 Welcome Admin! You have full access.');
            } else {
                alert('👋 Welcome! You are now logged in.');
            }

            navigate('/');

        } catch (error) {
            console.error('Login Error:', error);

            if (error.code === 'auth/user-not-found') {
                setError('No account found. Please sign up first.');
            } else if (error.code === 'auth/wrong-password') {
                setError('Incorrect password. Please try again.');
            } else if (error.code === 'auth/invalid-credential') {
                setError('Invalid email or password.');
            } else if (error.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError(error.message);
            }
        }

        setIsLoading(false);
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');

        if (!resetEmail.trim()) {
            setResetError('Please enter your email address.');
            return;
        }

        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setResetMessage('Password reset email sent! Please check your inbox.');
            setTimeout(() => {
                setShowResetPassword(false);
                setResetMessage('');
                setResetEmail('');
            }, 5000);
        } catch (error) {
            console.error('Reset Password Error:', error);
            if (error.code === 'auth/user-not-found') {
                setResetError('No account found with this email.');
            } else if (error.code === 'auth/invalid-email') {
                setResetError('Invalid email address.');
            } else {
                setResetError(error.message);
            }
        }

        setIsLoading(false);
    };

    return (
        <>
            <style>{`
                /* ============================================
                   EXACT CLERK COLORS
                   ============================================ */
                .auth-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background: #FAFAFA;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    position: relative;
                }

                /* Subtle grid pattern background */
                .auth-page::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image:
                        linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
                    background-size: 40px 40px;
                    pointer-events: none;
                }

                .auth-card {
                    background: #FFFFFF;
                    border-radius: 12px;
                    border: 1px solid #E5E7EB;
                    padding: 32px;
                    max-width: 400px;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px rgba(0, 0, 0, 0.04);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 24px;
                }

                .auth-title {
                    font-size: 1.25rem;
                    font-weight: 600;
                    color: #000000;
                    text-align: center;
                    margin: 0 0 6px 0;
                    letter-spacing: -0.01em;
                }

                .auth-subtitle {
                    color: #6B7280;
                    font-size: 0.875rem;
                    margin: 0;
                    line-height: 1.5;
                }

                /* ---------- Google Button ---------- */
                .google-btn {
                    width: 100%;
                    padding: 10px 16px;
                    background: #FFFFFF;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    color: #111827;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s ease, border-color 0.15s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    font-family: inherit;
                }

                .google-btn:hover:not(:disabled) {
                    background: #F9FAFB;
                    border-color: #9CA3AF;
                }

                .google-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .google-icon {
                    width: 16px;
                    height: 16px;
                    flex-shrink: 0;
                }

                /* ---------- Divider ---------- */
                .divider {
                    display: flex;
                    align-items: center;
                    margin: 20px 0;
                    color: #9CA3AF;
                    font-size: 0.75rem;
                    font-weight: 400;
                }

                .divider::before,
                .divider::after {
                    content: '';
                    flex: 1;
                    height: 1px;
                    background: #E5E7EB;
                }

                .divider span {
                    padding: 0 10px;
                    text-transform: lowercase;
                }

                /* ---------- Form ---------- */
                .form-group {
                    margin-bottom: 16px;
                }

                .form-label {
                    display: block;
                    font-size: 0.8125rem;
                    font-weight: 500;
                    color: #000000;
                    margin-bottom: 6px;
                }

                .form-input {
                    width: 100%;
                    padding: 8px 12px;
                    background: #FFFFFF;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    color: #111827;
                    font-size: 0.875rem;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .form-input::placeholder {
                    color: #9CA3AF;
                }

                .form-input:focus {
                    outline: none;
                    border-color: #6B7280;
                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
                }

                .input-wrapper {
                    position: relative;
                }

                .input-wrapper .form-input {
                    padding-right: 42px;
                }

                .toggle-password {
                    position: absolute;
                    right: 6px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    color: #6B7280;
                    font-size: 0.875rem;
                    border-radius: 6px;
                    transition: background 0.15s ease;
                    line-height: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toggle-password:hover {
                    background: #F3F4F6;
                }

                /* ---------- Messages ---------- */
                .error-message {
                    color: #DC2626;
                    padding: 8px 12px;
                    background: #FEF2F2;
                    border-radius: 8px;
                    border: 1px solid #FECACA;
                    margin-bottom: 16px;
                    font-size: 0.8125rem;
                }

                .success-message {
                    color: #059669;
                    padding: 8px 12px;
                    background: #ECFDF5;
                    border-radius: 8px;
                    border: 1px solid #A7F3D0;
                    margin-bottom: 16px;
                    font-size: 0.8125rem;
                }

                /* ---------- Forgot Password ---------- */
                .auth-options {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    margin-bottom: 16px;
                }

                .forgot-password-btn {
                    background: none;
                    border: none;
                    color: #6B7280;
                    font-size: 0.8125rem;
                    cursor: pointer;
                    padding: 4px 0;
                    font-family: inherit;
                    transition: color 0.15s ease;
                }

                .forgot-password-btn:hover {
                    color: #000000;
                    text-decoration: underline;
                }

                /* ---------- Submit Button ---------- */
                .submit-btn {
                    width: 100%;
                    padding: 10px 16px;
                    background: #3F3F46;
                    color: #FFFFFF;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    font-family: inherit;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                .submit-btn:hover:not(:disabled) {
                    background: #27272A;
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* ---------- Footer ---------- */
                .auth-footer {
                    text-align: center;
                    margin-top: 24px;
                    font-size: 0.8125rem;
                    color: #6B7280;
                }

                .auth-link {
                    color: #000000;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.15s ease;
                }

                .auth-link:hover {
                    text-decoration: underline;
                }

                /* ---------- Secured Footer ---------- */
                .secure-footer {
                    text-align: center;
                    margin-top: 16px;
                    padding-top: 16px;
                    border-top: 1px solid #F3F4F6;
                    font-size: 0.75rem;
                    color: #9CA3AF;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 6px;
                }

                /* ---------- Reset Modal ---------- */
                .reset-modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.5);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .reset-modal-content {
                    background: #FFFFFF;
                    border-radius: 12px;
                    border: 1px solid #E5E7EB;
                    padding: 28px;
                    max-width: 400px;
                    width: 100%;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                }

                .reset-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }

                .reset-modal-header h2 {
                    color: #000000;
                    font-size: 1.125rem;
                    font-weight: 600;
                    margin: 0;
                }

                .reset-modal-close {
                    background: none;
                    border: none;
                    color: #6B7280;
                    font-size: 1.25rem;
                    cursor: pointer;
                    padding: 4px 8px;
                    line-height: 1;
                    border-radius: 6px;
                    transition: all 0.15s ease;
                }

                .reset-modal-close:hover {
                    color: #000000;
                    background: #F3F4F6;
                }

                .reset-modal-subtitle {
                    color: #6B7280;
                    font-size: 0.8125rem;
                    margin-bottom: 20px;
                    line-height: 1.5;
                }

                .reset-cancel-btn {
                    width: 100%;
                    padding: 10px;
                    background: #FFFFFF;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    color: #111827;
                    font-size: 0.875rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.15s ease;
                    margin-top: 8px;
                    font-family: inherit;
                }

                .reset-cancel-btn:hover {
                    background: #F9FAFB;
                }

                @media (max-width: 480px) {
                    .auth-card {
                        padding: 24px 20px;
                    }
                }
            `}</style>

            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Sign in to your account</h1>
                        <p className="auth-subtitle">Welcome back! Please enter your details.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {/* Google Button */}
                    <button
                        type="button"
                        className="google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={isGoogleLoading || isLoading}
                    >
                        {isGoogleLoading ? (
                            'Connecting...'
                        ) : (
                            <>
                                <svg className="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                                </svg>
                                Continue with Google
                            </>
                        )}
                    </button>

                    <div className="divider"><span>or</span></div>

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-input"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="you@example.com"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <button
                                type="button"
                                className="forgot-password-btn"
                                onClick={() => {
                                    setResetEmail(formData.email);
                                    setShowResetPassword(true);
                                }}
                            >
                                Forgot password?
                            </button>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading || isGoogleLoading}>
                            {isLoading ? 'Signing in...' : 'Continue'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Don't have an account?{' '}
                        <Link to="/signup" className="auth-link">Sign up</Link>
                    </div>

                    <div className="secure-footer">
                        🔒 Secured with Firebase Authentication
                    </div>
                </div>
            </div>

            {showResetPassword && (
                <div
                    className="reset-modal-overlay"
                    onClick={() => {
                        setShowResetPassword(false);
                        setResetError('');
                        setResetMessage('');
                        setResetEmail('');
                    }}
                >
                    <div className="reset-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="reset-modal-header">
                            <h2>Reset your password</h2>
                            <button
                                className="reset-modal-close"
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setResetError('');
                                    setResetMessage('');
                                    setResetEmail('');
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p className="reset-modal-subtitle">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {resetError && <div className="error-message">{resetError}</div>}
                        {resetMessage && <div className="success-message">{resetMessage}</div>}

                        <form onSubmit={handleForgotPassword}>
                            <div className="form-group">
                                <label className="form-label">Email address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send reset email'}
                            </button>

                            <button
                                type="button"
                                className="reset-cancel-btn"
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setResetError('');
                                    setResetMessage('');
                                    setResetEmail('');
                                }}
                            >
                                Cancel
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Login;