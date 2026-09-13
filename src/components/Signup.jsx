// src/components/Signup.jsx - Exact Clerk colors
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    auth,
    db,
    createUserWithEmailAndPassword,
    doc,
    setDoc,
    serverTimestamp,
    GoogleAuthProvider,
    signInWithPopup
} from '../firebase/config';

function Signup() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+1',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const countryCodes = [
        { code: '+1', country: 'US/CA' },
        { code: '+91', country: 'India' },
        { code: '+61', country: 'Australia' },
        { code: '+44', country: 'UK' },
        { code: '+81', country: 'Japan' },
        { code: '+86', country: 'China' },
        { code: '+49', country: 'Germany' },
        { code: '+33', country: 'France' },
        { code: '+39', country: 'Italy' },
        { code: '+55', country: 'Brazil' },
        { code: '+7', country: 'Russia' },
        { code: '+82', country: 'South Korea' },
        { code: '+31', country: 'Netherlands' },
        { code: '+46', country: 'Sweden' },
        { code: '+34', country: 'Spain' },
        { code: '+41', country: 'Switzerland' },
        { code: '+65', country: 'Singapore' },
        { code: '+971', country: 'UAE' },
        { code: '+966', country: 'Saudi Arabia' },
        { code: '+20', country: 'Egypt' },
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
        setError('');
    };

    const handleGoogleSignUp = async () => {
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
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            } catch (firestoreErr) {
                console.warn('Firestore save failed (non-blocking):', firestoreErr);
            }

            alert(`✅ Account ready! Welcome, ${user.displayName || user.email}!`);
            navigate('/');

        } catch (error) {
            console.error('Google Sign-Up Error:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                setError('Sign-up cancelled. Please try again.');
            } else if (error.code === 'auth/popup-blocked') {
                setError('Popup was blocked. Please allow popups and try again.');
            } else if (error.code === 'auth/cancelled-popup-request') {
                setError('Sign-up cancelled.');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                setError('An account already exists with this email. Please sign in with your password.');
            } else {
                setError(error.message);
            }
        }

        setIsGoogleLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            const user = userCredential.user;
            const fullPhoneNumber = formData.countryCode + formData.phone;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                phone: fullPhoneNumber,
                countryCode: formData.countryCode,
                role: 'user',
                provider: 'email',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            alert('✅ Account created successfully! Welcome to Syntax SaaS!');
            navigate('/login');

        } catch (error) {
            console.error('Signup Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setError('This email is already registered. Please login instead.');
            } else if (error.code === 'auth/invalid-email') {
                setError('Invalid email address. Please check and try again.');
            } else if (error.code === 'auth/weak-password') {
                setError('Password is too weak. Please use a stronger password.');
            } else {
                setError(error.message);
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
                    max-width: 440px;
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
                    margin: 0 0 6px 0;
                    letter-spacing: -0.01em;
                }

                .auth-subtitle {
                    color: #6B7280;
                    font-size: 0.875rem;
                    margin: 0;
                    line-height: 1.5;
                }

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

                .divider {
                    display: flex;
                    align-items: center;
                    margin: 20px 0;
                    color: #9CA3AF;
                    font-size: 0.75rem;
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
                }

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

                .error-message {
                    color: #DC2626;
                    padding: 8px 12px;
                    background: #FEF2F2;
                    border-radius: 8px;
                    border: 1px solid #FECACA;
                    margin-bottom: 16px;
                    font-size: 0.8125rem;
                }

                .phone-input-group {
                    display: flex;
                    gap: 8px;
                }

                .phone-input-group select {
                    min-width: 120px;
                    padding: 8px 10px;
                    background: #FFFFFF;
                    border: 1px solid #D1D5DB;
                    border-radius: 8px;
                    color: #111827;
                    font-size: 0.8125rem;
                    cursor: pointer;
                    transition: border-color 0.15s ease, box-shadow 0.15s ease;
                    font-family: inherit;
                    box-sizing: border-box;
                }

                .phone-input-group select:focus {
                    outline: none;
                    border-color: #6B7280;
                    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.05);
                }

                .phone-input-group .form-input {
                    flex: 1;
                }

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
                    margin-top: 4px;
                }

                .submit-btn:hover:not(:disabled) {
                    background: #27272A;
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

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

                @media (max-width: 480px) {
                    .auth-card {
                        padding: 24px 20px;
                    }

                    .phone-input-group {
                        flex-direction: column;
                    }

                    .phone-input-group select {
                        min-width: 100%;
                    }
                }
            `}</style>

            <div className="auth-page">
                <div className="auth-card">
                    <div className="auth-header">
                        <h1 className="auth-title">Create your account</h1>
                        <p className="auth-subtitle">Welcome! Please fill in the details to get started.</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button
                        type="button"
                        className="google-btn"
                        onClick={handleGoogleSignUp}
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
                            <label className="form-label">Full name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>

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
                            <label className="form-label">Phone number</label>
                            <div className="phone-input-group">
                                <select
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                >
                                    {countryCodes.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.code} {country.country}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="234 567 890"
                                />
                            </div>
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
                                    placeholder="Create a password"
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

                        <div className="form-group">
                            <label className="form-label">Confirm password</label>
                            <div className="input-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
                                    className="form-input"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="toggle-password"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading || isGoogleLoading}>
                            {isLoading ? 'Creating account...' : 'Continue'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        Already have an account?{' '}
                        <Link to="/login" className="auth-link">Sign in</Link>
                    </div>

                    <div className="secure-footer">
                        🔒 Secured with Firebase Authentication
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;