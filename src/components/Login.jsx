// src/components/Login.jsx - With Forgot Password & Enhanced Password Toggle
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../firebase/config';

function Login() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: 'loki@gmail.com',  // Pre-filled
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.email.trim() || !formData.password) {
            setError('❌ Please enter both email and password.');
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
            console.log('Login successful:', user.email);

            if (user.email === 'loki@gmail.com') {
                alert('👑 Welcome Admin! You have full access.');
            } else {
                alert('👋 Welcome! You are now logged in.');
            }

            navigate('/');

        } catch (error) {
            console.error('Login Error:', error);

            if (error.code === 'auth/user-not-found') {
                setError('❌ No account found. Please sign up first.');
            } else if (error.code === 'auth/wrong-password') {
                setError('❌ Incorrect password. Please try again.');
            } else if (error.code === 'auth/invalid-credential') {
                setError('❌ Invalid email or password.');
            } else if (error.code === 'auth/too-many-requests') {
                setError('❌ Too many failed attempts. Please try again later.');
            } else {
                setError(`❌ ${error.message}`);
            }
        }

        setIsLoading(false);
    };

    // Handle Forgot Password
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');

        if (!resetEmail.trim()) {
            setResetError('❌ Please enter your email address.');
            return;
        }

        setIsLoading(true);

        try {
            await sendPasswordResetEmail(auth, resetEmail.trim());
            setResetMessage('✅ Password reset email sent! Please check your inbox.');
            setTimeout(() => {
                setShowResetPassword(false);
                setResetMessage('');
                setResetEmail('');
            }, 5000);
        } catch (error) {
            console.error('Reset Password Error:', error);
            if (error.code === 'auth/user-not-found') {
                setResetError('❌ No account found with this email.');
            } else if (error.code === 'auth/invalid-email') {
                setResetError('❌ Invalid email address.');
            } else {
                setResetError(`❌ ${error.message}`);
            }
        }

        setIsLoading(false);
    };

    return (
        <>
            <style>{`
                /* ============================================
                   AUTH PAGES - VIBRANT COLOR SCHEME
                   ============================================ */
                .auth-container {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 40px 20px;
                    background: #0A0E27;
                    position: relative;
                    overflow: hidden;
                }

                /* Animated Background */
                .auth-container::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: 
                        radial-gradient(circle at 30% 40%, rgba(255, 107, 107, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, rgba(255, 217, 61, 0.03) 0%, transparent 50%);
                    animation: bgFloat 15s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes bgFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-20px, 20px) scale(1.05); }
                    66% { transform: translate(20px, -20px) scale(0.95); }
                }

                /* Floating Orbs */
                .auth-orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.08;
                    pointer-events: none;
                    animation: orbFloat 20s ease-in-out infinite;
                }

                .auth-orb-1 {
                    width: 400px;
                    height: 400px;
                    background: #FF6B6B;
                    top: -100px;
                    right: -100px;
                    animation-delay: 0s;
                }

                .auth-orb-2 {
                    width: 300px;
                    height: 300px;
                    background: #4D96FF;
                    bottom: -50px;
                    left: -50px;
                    animation-delay: -7s;
                }

                .auth-orb-3 {
                    width: 250px;
                    height: 250px;
                    background: #FFD93D;
                    top: 50%;
                    left: 50%;
                    animation-delay: -14s;
                }

                .auth-orb-4 {
                    width: 200px;
                    height: 200px;
                    background: #6BCB77;
                    top: 20%;
                    right: 10%;
                    animation-delay: -5s;
                }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(80px, -40px) scale(1.1); }
                    50% { transform: translate(-40px, 60px) scale(0.9); }
                    75% { transform: translate(50px, 30px) scale(1.05); }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .auth-card {
                    background: #1A1E37;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    padding: 50px 45px;
                    max-width: 450px;
                    width: 100%;
                    animation: fadeInUp 0.6s ease;
                    position: relative;
                    z-index: 1;
                    box-shadow: 0 0 60px rgba(255, 107, 107, 0.05);
                    transition: all 0.3s ease;
                }

                .auth-card:hover {
                    border-color: rgba(255, 217, 61, 0.2);
                    box-shadow: 0 0 80px rgba(255, 107, 107, 0.08);
                }

                .auth-title {
                    font-size: 2.2rem;
                    font-weight: 700;
                    text-align: center;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 8px;
                    letter-spacing: 1px;
                }

                .auth-subtitle {
                    text-align: center;
                    color: #A8B2D1;
                    font-size: 1rem;
                    margin-bottom: 30px;
                    letter-spacing: 1px;
                }

                .error-message {
                    color: #FF6B6B;
                    padding: 12px 16px;
                    background: rgba(255, 107, 107, 0.08);
                    border-radius: 10px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    margin-bottom: 20px;
                    font-size: 0.95rem;
                }

                .success-message {
                    color: #6BCB77;
                    padding: 12px 16px;
                    background: rgba(107, 203, 119, 0.08);
                    border-radius: 10px;
                    border: 1px solid rgba(107, 203, 119, 0.15);
                    margin-bottom: 20px;
                    font-size: 0.95rem;
                }

                .auth-form .form-group {
                    margin-bottom: 22px;
                }

                .auth-form label {
                    display: block;
                    margin-bottom: 8px;
                    color: #FFD93D;
                    font-weight: 500;
                    font-size: 0.95rem;
                }

                .auth-form input {
                    width: 100%;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .auth-form input:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                    background: rgba(255, 107, 107, 0.04);
                }

                .auth-form input::placeholder {
                    color: #666;
                }

                .input-wrapper {
                    position: relative;
                }

                .input-wrapper input {
                    padding-right: 50px;
                }

                .toggle-password {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    font-size: 1.3rem;
                    cursor: pointer;
                    padding: 5px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    color: #A8B2D1;
                }

                .toggle-password:hover {
                    background: rgba(255, 107, 107, 0.08);
                    transform: translateY(-50%) scale(1.1);
                    color: #FFD93D;
                }

                .auth-options {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .forgot-password-btn {
                    background: none;
                    border: none;
                    color: #4D96FF;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 5px 0;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .forgot-password-btn:hover {
                    color: #FFD93D;
                    text-decoration: underline;
                }

                .auth-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .auth-btn::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transform: rotate(45deg);
                    transition: all 0.6s ease;
                }

                .auth-btn:hover::before {
                    left: 100%;
                }

                .auth-btn:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);
                }

                .auth-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .auth-footer {
                    text-align: center;
                    margin-top: 25px;
                    padding-top: 20px;
                    border-top: 1px solid rgba(255, 107, 107, 0.06);
                }

                .auth-footer p {
                    color: #A8B2D1;
                    font-size: 0.95rem;
                }

                .auth-link {
                    color: #FF6B6B;
                    text-decoration: none;
                    font-weight: 600;
                    transition: all 0.3s ease;
                }

                .auth-link:hover {
                    color: #FFD93D;
                    text-decoration: underline;
                }

                /* Reset Password Modal */
                .reset-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(10, 14, 39, 0.95);
                    backdrop-filter: blur(10px);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    animation: fadeInUp 0.3s ease;
                }

                .reset-modal-content {
                    background: #1A1E37;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    padding: 40px;
                    max-width: 420px;
                    width: 100%;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 0 60px rgba(255, 107, 107, 0.05);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .reset-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .reset-modal-header h2 {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.3rem;
                }

                .reset-modal-close {
                    background: none;
                    border: none;
                    color: #A8B2D1;
                    font-size: 1.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 0 5px;
                }

                .reset-modal-close:hover {
                    color: #FF6B6B;
                    transform: rotate(90deg);
                }

                .reset-modal-subtitle {
                    color: #A8B2D1;
                    font-size: 0.95rem;
                    margin-bottom: 25px;
                    line-height: 1.6;
                }

                .reset-form .form-group {
                    margin-bottom: 20px;
                }

                .reset-form label {
                    display: block;
                    margin-bottom: 8px;
                    color: #FFD93D;
                    font-weight: 500;
                    font-size: 0.95rem;
                }

                .reset-form input {
                    width: 100%;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .reset-form input:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                }

                .reset-form input::placeholder {
                    color: #666;
                }

                .reset-form .reset-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #4D96FF 0%, #6BCB77 50%, #4D96FF 100%);
                    background-size: 200% 200%;
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    animation: shimmer 3s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .reset-form .reset-btn:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 10px 40px rgba(77, 150, 255, 0.3);
                }

                .reset-form .reset-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .reset-cancel-btn {
                    width: 100%;
                    padding: 14px;
                    background: rgba(255, 107, 107, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #A8B2D1;
                    font-size: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .reset-cancel-btn:hover {
                    background: rgba(255, 107, 107, 0.08);
                    border-color: rgba(255, 107, 107, 0.25);
                }

                /* Auto-fill email from login form */
                .reset-email-hint {
                    color: #666;
                    font-size: 0.85rem;
                    margin-top: 5px;
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }

                .reset-email-hint .hint-btn {
                    background: none;
                    border: none;
                    color: #4D96FF;
                    cursor: pointer;
                    font-size: 0.85rem;
                    padding: 2px 8px;
                    border-radius: 4px;
                    transition: all 0.3s ease;
                }

                .reset-email-hint .hint-btn:hover {
                    color: #FFD93D;
                    background: rgba(255, 107, 107, 0.05);
                }

                /* Rainbow Scrollbar */
                ::-webkit-scrollbar {
                    width: 6px;
                }

                ::-webkit-scrollbar-track {
                    background: #0A0E27;
                }

                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
                    border-radius: 3px;
                }

                ::-webkit-scrollbar-thumb:hover {
                    background: #FF6B6B;
                }

                /* Responsive */
                @media (max-width: 480px) {
                    .auth-card {
                        padding: 30px 20px;
                    }

                    .auth-title {
                        font-size: 1.8rem;
                    }

                    .auth-subtitle {
                        font-size: 0.9rem;
                    }

                    .auth-options {
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .reset-modal-content {
                        padding: 25px 20px;
                    }
                }
            `}</style>

            <div className="auth-container">
                {/* Floating Orbs */}
                <div className="auth-orb auth-orb-1"></div>
                <div className="auth-orb auth-orb-2"></div>
                <div className="auth-orb auth-orb-3"></div>
                <div className="auth-orb auth-orb-4"></div>

                <div className="auth-card">
                    <h1 className="auth-title">Welcome Back</h1>
                    <p className="auth-subtitle">Login to your account</p>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>📧 Email Address</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="your@email.com"
                            />
                        </div>

                        <div className="form-group">
                            <label>🔒 Password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowPassword(!showPassword)}
                                    title={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <div className="auth-options">
                            <button
                                type="button"
                                className="forgot-password-btn"
                                onClick={() => {
                                    setResetEmail(formData.email); // Auto-fill with current email
                                    setShowResetPassword(true);
                                }}
                            >
                                🔑 Forgot Password?
                            </button>
                        </div>

                        <button type="submit" className="auth-btn" disabled={isLoading}>
                            {isLoading ? '⏳ Logging in...' : '🚀 Login'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Don't have an account?{' '}
                            <Link to="/signup" className="auth-link">Sign up</Link>
                        </p>
                    </div>
                </div>
            </div>

            {/* Reset Password Modal */}
            {showResetPassword && (
                <div className="reset-modal-overlay" onClick={() => {
                    setShowResetPassword(false);
                    setResetError('');
                    setResetMessage('');
                    setResetEmail('');
                }}>
                    <div className="reset-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="reset-modal-header">
                            <h2>🔑 Reset Password</h2>
                            <button
                                className="reset-modal-close"
                                onClick={() => {
                                    setShowResetPassword(false);
                                    setResetError('');
                                    setResetMessage('');
                                    setResetEmail('');
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <p className="reset-modal-subtitle">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        {resetError && <div className="error-message">{resetError}</div>}
                        {resetMessage && <div className="success-message">{resetMessage}</div>}

                        <form className="reset-form" onSubmit={handleForgotPassword}>
                            <div className="form-group">
                                <label>📧 Email Address</label>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    disabled={isLoading}
                                    autoFocus
                                />
                                {formData.email && !resetEmail && (
                                    <div className="reset-email-hint">
                                        💡 Use your login email: 
                                        <button
                                            type="button"
                                            className="hint-btn"
                                            onClick={() => setResetEmail(formData.email)}
                                        >
                                            {formData.email}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <button type="submit" className="reset-btn" disabled={isLoading}>
                                {isLoading ? '⏳ Sending...' : '📧 Send Reset Email'}
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