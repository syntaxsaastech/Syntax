import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { auth, onAuthStateChanged, signOut } from '../firebase/config';
import logo from '../assets/image.png';

function Navbar() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            console.log('Auth state changed:', currentUser);

            if (currentUser) {
                setUser(currentUser);
                console.log('User email:', currentUser.email);

                const displayName = currentUser.displayName || currentUser.email || 'User';
                setUserName(displayName);

                const adminEmail = 'loki@gmail.com';
                const isAdminUser = currentUser.email === adminEmail;

                console.log('Is admin?', isAdminUser);
                setIsAdmin(isAdminUser);

            } else {
                setUser(null);
                setIsAdmin(false);
                setUserName('');
            }
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            unsubscribe();
        };
    }, []);

    const toggleMobileMenu = () => {
        setIsMobile(!isMobile);
    };

    const closeMenu = () => {
        setIsMobile(false);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert('👋 You have been logged out.');
            navigate('/');
            closeMenu();
        } catch (error) {
            console.error('Logout Error:', error);
        }
    };

    const getInitial = () => {
        if (userName) {
            return userName.charAt(0).toUpperCase();
        }
        return '?';
    };

    return (
        <>
            <style>{`
                /* ============================================
                   NAVBAR STYLES - VIBRANT COLOR SCHEME
                   ============================================ */
                .navbar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    padding: 0 40px;
                    height: 80px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #0A0E27;
                    backdrop-filter: blur(10px);
                    border-bottom: 1px solid rgba(255, 107, 107, 0.15);
                    transition: all 0.4s ease;
                    box-shadow: 0 2px 20px rgba(0, 0, 0, 0.06);
                }

                .navbar.scrolled {
                    background: #0A0E27;
                    box-shadow: 0 4px 30px rgba(255, 107, 107, 0.12);
                    height: 70px;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.25);
                }

                .navbar-brand {
                    display: flex;
                    align-items: center;
                }

                .brand-link {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    text-decoration: none;
                    transition: all 0.3s ease;
                }

                .brand-link:hover {
                    transform: scale(1.02);
                }

                .brand-logo {
                    height: 45px;
                    width: auto;
                    transition: all 0.3s ease;
                    filter: drop-shadow(0 0 10px rgba(255, 107, 107, 0.1));
                }

                .navbar.scrolled .brand-logo {
                    height: 38px;
                }

                .brand-name {
                    font-size: 1.2rem;
                    font-weight: 700;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 0.5px;
                    white-space: nowrap;
                    text-shadow: 0 0 40px rgba(255, 107, 107, 0.1);
                }

                .nav-links {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-link {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 10px 18px;
                    color: #A8B2D1;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.95rem;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .nav-link .nav-icon {
                    font-size: 1.1rem;
                }

                .nav-link:hover {
                    color: #FF6B6B;
                    background: rgba(255, 107, 107, 0.08);
                    transform: translateY(-2px);
                    box-shadow: 0 4px 15px rgba(255, 107, 107, 0.05);
                }

                .nav-link.active {
                    color: #FFD93D;
                    background: rgba(255, 217, 61, 0.08);
                    box-shadow: 0 2px 15px rgba(255, 217, 61, 0.08);
                    border: 1px solid rgba(255, 217, 61, 0.08);
                }

                .nav-link.active::after {
                    content: '';
                    position: absolute;
                    bottom: 4px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 20px;
                    height: 3px;
                    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77);
                    border-radius: 3px;
                    box-shadow: 0 0 10px rgba(255, 107, 107, 0.3);
                }

                /* Toggle Container */
                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 4px;
                    background: rgba(77, 150, 255, 0.04);
                    border-radius: 14px;
                    border: 1px solid rgba(77, 150, 255, 0.08);
                }

                .toggle-link {
                    padding: 8px 14px;
                    border-radius: 10px;
                }

                .toggle-divider {
                    color: rgba(77, 150, 255, 0.2);
                    font-weight: 300;
                }

                /* Admin Link */
                .admin-link {
                    background: rgba(255, 217, 61, 0.04);
                    border: 1px solid rgba(255, 217, 61, 0.08);
                }

                .admin-link:hover {
                    background: rgba(255, 217, 61, 0.1);
                    border-color: #FFD93D;
                    color: #FFD93D;
                    box-shadow: 0 4px 20px rgba(255, 217, 61, 0.1);
                }

                .admin-link.active {
                    background: rgba(255, 217, 61, 0.12);
                    border-color: #FFD93D;
                    color: #FFD93D;
                    box-shadow: 0 4px 20px rgba(255, 217, 61, 0.15);
                }

                /* Auth Links */
                .auth-links {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    margin-left: 4px;
                }

                .login-link {
                    color: #4D96FF;
                }

                .login-link:hover {
                    color: #4D96FF;
                    background: rgba(77, 150, 255, 0.08);
                    box-shadow: 0 4px 15px rgba(77, 150, 255, 0.08);
                }

                .login-link.active {
                    color: #4D96FF;
                    background: rgba(77, 150, 255, 0.12);
                    border: 1px solid rgba(77, 150, 255, 0.15);
                    box-shadow: 0 2px 15px rgba(77, 150, 255, 0.1);
                }

                .signup-link {
                    color: #6BCB77;
                }

                .signup-link:hover {
                    color: #6BCB77;
                    background: rgba(107, 203, 119, 0.08);
                    box-shadow: 0 4px 15px rgba(107, 203, 119, 0.08);
                }

                .signup-link.active {
                    color: #6BCB77;
                    background: rgba(107, 203, 119, 0.12);
                    border: 1px solid rgba(107, 203, 119, 0.15);
                    box-shadow: 0 2px 15px rgba(107, 203, 119, 0.1);
                }

                /* User Section */
                .user-section {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-left: 4px;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;
                    font-weight: 600;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    cursor: default;
                    box-shadow: 0 2px 12px rgba(255, 107, 107, 0.25);
                    transition: all 0.3s ease;
                }

                .user-avatar:hover {
                    transform: scale(1.08);
                    box-shadow: 0 4px 25px rgba(255, 107, 107, 0.35);
                }

                .logout-btn {
                    padding: 8px 20px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 10px;
                    font-weight: 600;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 12px rgba(255, 107, 107, 0.2);
                }

                .logout-btn:hover {
                    transform: translateY(-2px) scale(1.03);
                    box-shadow: 0 4px 25px rgba(255, 107, 107, 0.3);
                }

                /* Mobile Menu Button */
                .mobile-menu-btn {
                    display: none;
                    flex-direction: column;
                    gap: 5px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                }

                .mobile-menu-btn:hover {
                    background: rgba(255, 107, 107, 0.06);
                }

                .hamburger {
                    width: 28px;
                    height: 3px;
                    background: linear-gradient(90deg, #FF6B6B, #FFD93D);
                    border-radius: 3px;
                    transition: all 0.3s ease;
                }

                .mobile-menu-btn.active .hamburger:nth-child(1) {
                    transform: rotate(45deg) translate(5px, 5px);
                    background: linear-gradient(90deg, #FF6B6B, #FF6BD6);
                }

                .mobile-menu-btn.active .hamburger:nth-child(2) {
                    opacity: 0;
                }

                .mobile-menu-btn.active .hamburger:nth-child(3) {
                    transform: rotate(-45deg) translate(5px, -5px);
                    background: linear-gradient(90deg, #FF6B6B, #FF6BD6);
                }

                /* ============================================
                   RESPONSIVE DESIGN
                   ============================================ */
                @media (max-width: 1024px) {
                    .brand-name {
                        font-size: 1rem;
                    }
                    .nav-link {
                        padding: 8px 14px;
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 768px) {
                    .navbar {
                        padding: 0 20px;
                        height: 70px;
                        background: #0A0E27;
                    }

                    .brand-name {
                        font-size: 0.9rem;
                    }

                    .brand-logo {
                        height: 35px;
                    }

                    .mobile-menu-btn {
                        display: flex;
                    }

                    .nav-links {
                        position: fixed;
                        top: 70px;
                        left: 0;
                        right: 0;
                        background: #0A0E27;
                        backdrop-filter: blur(10px);
                        flex-direction: column;
                        align-items: stretch;
                        padding: 20px;
                        gap: 6px;
                        border-bottom: 2px solid rgba(255, 107, 107, 0.1);
                        transform: translateY(-120%);
                        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.08);
                        max-height: calc(100vh - 70px);
                        overflow-y: auto;
                    }

                    .nav-links.active {
                        transform: translateY(0);
                    }

                    .nav-link {
                        padding: 12px 18px;
                        font-size: 1rem;
                        border-radius: 10px;
                        justify-content: center;
                        color: #A8B2D1;
                    }

                    .nav-link.active {
                        color: #FFD93D;
                        background: rgba(255, 217, 61, 0.06);
                        border-color: rgba(255, 217, 61, 0.1);
                    }

                    .nav-link.active::after {
                        bottom: 6px;
                    }

                    .toggle-container {
                        flex-direction: row;
                        padding: 6px;
                        background: rgba(77, 150, 255, 0.04);
                        border-radius: 12px;
                        justify-content: center;
                        border: 1px solid rgba(77, 150, 255, 0.06);
                    }

                    .toggle-link {
                        flex: 1;
                        justify-content: center;
                        color: #A8B2D1;
                    }

                    .toggle-link.active {
                        color: #4D96FF;
                        background: rgba(77, 150, 255, 0.08);
                    }

                    .auth-links {
                        flex-direction: row;
                        justify-content: center;
                        margin-left: 0;
                        gap: 8px;
                    }

                    .auth-links .nav-link {
                        flex: 1;
                        justify-content: center;
                    }

                    .login-link {
                        color: #4D96FF;
                    }
                    
                    .login-link.active {
                        color: #4D96FF;
                        background: rgba(77, 150, 255, 0.1);
                    }

                    .signup-link {
                        color: #6BCB77;
                    }
                    
                    .signup-link.active {
                        color: #6BCB77;
                        background: rgba(107, 203, 119, 0.1);
                    }

                    .user-section {
                        justify-content: center;
                        padding: 8px 0;
                        flex-wrap: wrap;
                    }

                    .user-avatar {
                        width: 44px;
                        height: 44px;
                        font-size: 1.2rem;
                    }

                    .logout-btn {
                        padding: 10px 24px;
                        background: linear-gradient(135deg, #FF6B6B 0%, #FF6BD6 100%);
                        color: #0A0E27;
                    }

                    .admin-link {
                        justify-content: center;
                        background: rgba(255, 217, 61, 0.04);
                    }
                    
                    .admin-link.active {
                        background: rgba(255, 217, 61, 0.08);
                        color: #FFD93D;
                    }
                }

                @media (max-width: 480px) {
                    .navbar {
                        padding: 0 15px;
                        height: 60px;
                        background: #0A0E27;
                    }

                    .nav-links {
                        top: 60px;
                        padding: 15px;
                        max-height: calc(100vh - 60px);
                        background: #0A0E27;
                    }

                    .brand-name {
                        font-size: 0.75rem;
                    }

                    .brand-logo {
                        height: 30px;
                    }

                    .nav-link {
                        padding: 10px 14px;
                        font-size: 0.9rem;
                        color: #A8B2D1;
                    }

                    .nav-link.active {
                        color: #FFD93D;
                    }

                    .toggle-container {
                        flex-direction: row;
                        gap: 2px;
                        padding: 4px;
                        background: rgba(77, 150, 255, 0.04);
                    }

                    .toggle-link {
                        padding: 8px 12px;
                        font-size: 0.85rem;
                    }

                    .toggle-divider {
                        display: none;
                    }

                    .auth-links {
                        flex-direction: column;
                        gap: 4px;
                    }

                    .auth-links .nav-link {
                        padding: 10px;
                    }

                    .user-section {
                        flex-direction: column;
                        gap: 8px;
                    }

                    .user-avatar {
                        width: 50px;
                        height: 50px;
                        font-size: 1.3rem;
                    }

                    .logout-btn {
                        width: 100%;
                        justify-content: center;
                        background: linear-gradient(135deg, #FF6B6B 0%, #FF6BD6 100%);
                        color: #0A0E27;
                    }

                    .admin-link {
                        background: rgba(255, 217, 61, 0.04);
                    }
                    
                    .admin-link.active {
                        background: rgba(255, 217, 61, 0.08);
                        color: #FFD93D;
                    }
                }
            `}</style>

            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-brand">
                    <NavLink to="/" className="brand-link" onClick={closeMenu}>
                        <img src={logo} alt="Syntax SaaS Technology" className="brand-logo" />
                        <span className="brand-name">Syntax SaaS Technology</span>
                    </NavLink>
                </div>

                <div className={`nav-links ${isMobile ? 'active' : ''}`}>
                    <NavLink
                        to="/home"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="nav-icon">🏠</span>
                        Home
                    </NavLink>
                    <NavLink
                        to="/service"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="nav-icon">⚜️</span>
                        Service
                    </NavLink>
                    <NavLink
                        to="/history"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        onClick={closeMenu}
                    >
                        <span className="nav-icon">📜</span>
                        History
                    </NavLink>

                    {/* Client/Calendar Toggle */}
                    <div className="toggle-container">
                        <NavLink
                            to="/client"
                            className={({ isActive }) => `nav-link toggle-link ${isActive ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            <span className="nav-icon">👥</span>
                            Client
                        </NavLink>
                        <span className="toggle-divider">|</span>
                        <NavLink
                            to="/calendar"
                            className={({ isActive }) => `nav-link toggle-link ${isActive ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            <span className="nav-icon">📅</span>
                            Calendar
                        </NavLink>
                    </div>

                    {/* Admin button - only visible when admin is logged in */}
                    {isAdmin && user && (
                        <NavLink
                            to="/admin"
                            className={({ isActive }) => `nav-link admin-link ${isActive ? 'active' : ''}`}
                            onClick={closeMenu}
                        >
                            <span className="nav-icon">👑</span>
                            Admin
                        </NavLink>
                    )}

                    {user ? (
                        <div className="user-section">
                            <div className="user-avatar" title={userName}>
                                {getInitial()}
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                                🚪 Logout
                            </button>
                        </div>
                    ) : (
                        <div className="auth-links">
                            <NavLink
                                to="/login"
                                className={({ isActive }) => `nav-link login-link ${isActive ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <span className="nav-icon">🔑</span>
                                Login
                            </NavLink>
                            <NavLink
                                to="/signup"
                                className={({ isActive }) => `nav-link signup-link ${isActive ? 'active' : ''}`}
                                onClick={closeMenu}
                            >
                                <span className="nav-icon">✨</span>
                                Signup
                            </NavLink>
                        </div>
                    )}
                </div>

                <button 
                    className={`mobile-menu-btn ${isMobile ? 'active' : ''}`} 
                    onClick={toggleMobileMenu} 
                    aria-label="Toggle menu"
                >
                    <span className="hamburger"></span>
                    <span className="hamburger"></span>
                    <span className="hamburger"></span>
                </button>
            </nav>
        </>
    );
}

export default Navbar;