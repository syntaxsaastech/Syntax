import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, doc, setDoc, serverTimestamp } from '../firebase/config';

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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Country codes data
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            setError('❌ Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            setError('❌ Password must be at least 6 characters');
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

            // Combine country code and phone number
            const fullPhoneNumber = formData.countryCode + formData.phone;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                name: formData.name,
                email: formData.email,
                phone: fullPhoneNumber,
                countryCode: formData.countryCode,
                role: 'user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            alert('✅ Account created successfully! Welcome to Syntax SaaS!');
            navigate('/login');

        } catch (error) {
            console.error('Signup Error:', error);
            if (error.code === 'auth/email-already-in-use') {
                setError('❌ This email is already registered. Please login instead.');
            } else if (error.code === 'auth/invalid-email') {
                setError('❌ Invalid email address. Please check and try again.');
            } else if (error.code === 'auth/weak-password') {
                setError('❌ Password is too weak. Please use a stronger password.');
            } else {
                setError(`❌ ${error.message}`);
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
                        radial-gradient(circle at 70% 60%, rgba(107, 203, 119, 0.03) 0%, transparent 50%);
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
                    background: #6BCB77;
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
                    background: #FF6BD6;
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
                    max-width: 480px;
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

                .auth-form .form-group {
                    margin-bottom: 20px;
                }

                .auth-form label {
                    display: block;
                    margin-bottom: 8px;
                    color: #FFD93D;
                    font-weight: 500;
                    font-size: 0.95rem;
                }

                .auth-form label .required {
                    color: #FF6B6B;
                    margin-left: 3px;
                }

                .auth-form input,
                .auth-form select {
                    width: 100%;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .auth-form select option {
                    background: #1A1E37;
                    color: #E0E0E0;
                }

                .auth-form input:focus,
                .auth-form select:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                    background: rgba(255, 107, 107, 0.04);
                }

                .auth-form input::placeholder,
                .auth-form select::placeholder {
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

                .phone-input-group {
                    display: flex;
                    gap: 10px;
                }

                .phone-input-group select {
                    min-width: 120px;
                    padding: 14px 12px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 0.95rem;
                    transition: all 0.3s ease;
                    cursor: pointer;
                }

                .phone-input-group select:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                }

                .phone-input-group input {
                    flex: 1;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                }

                .phone-input-group input:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                    background: rgba(255, 107, 107, 0.04);
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

                    .phone-input-group {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .phone-input-group select {
                        min-width: 100%;
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">Join the Syntax SaaS family today</p>

                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-group">
                            <label>👤 Full Name <span className="required">*</span></label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                placeholder="John Doe"
                            />
                        </div>

                        <div className="form-group">
                            <label>📧 Email Address <span className="required">*</span></label>
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
                            <label>📞 Phone Number</label>
                            <div className="phone-input-group">
                                <select
                                    name="countryCode"
                                    value={formData.countryCode}
                                    onChange={handleChange}
                                >
                                    {countryCodes.map((country) => (
                                        <option key={country.code} value={country.code}>
                                            {country.code} ({country.country})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="234 567 890"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>🔒 Password <span className="required">*</span></label>
                            <div className="input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="Create a password (min 6 chars)"
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

                        <div className="form-group">
                            <label>🔐 Confirm Password <span className="required">*</span></label>
                            <div className="input-wrapper">
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    name="confirmPassword"
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
                                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="auth-btn" disabled={isLoading}>
                            {isLoading ? '⏳ Creating Account...' : '✨ Sign Up'}
                        </button>
                    </form>

                    <div className="auth-footer">
                        <p>
                            Already have an account?{' '}
                            <Link to="/login" className="auth-link">Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default Signup;