// src/components/Navbar.js - Complete FULL working file with meeting notifications
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    auth,
    onAuthStateChanged,
    signOut,
    db,
    collection,
    query,
    where,
    onSnapshot
} from '../firebase/config';
import logo from '../assets/syntech-logo.png';

function Navbar() {
    const navigate = useNavigate();
    const [isMobile, setIsMobile] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState(null);
    const [userName, setUserName] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Global Notification States
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    // Track seen statuses so we don't spam duplicates
    const seenMeetingStatusesRef = useRef({});
    const seenRequestStatusesRef = useRef({});
    const seenAssignmentsRef = useRef({});

    // ============ LOAD SEEN STATUSES FROM LOCALSTORAGE ONCE ============
    useEffect(() => {
        try {
            seenMeetingStatusesRef.current = JSON.parse(localStorage.getItem('user_seen_meeting_statuses') || '{}');
            seenRequestStatusesRef.current = JSON.parse(localStorage.getItem('user_seen_request_statuses') || '{}');
            seenAssignmentsRef.current = JSON.parse(localStorage.getItem('user_seen_assignments') || '{}');
        } catch (e) {
            console.error('Error loading seen statuses:', e);
        }
    }, []);

    // ============ AUTH + SCROLL + CLICK-OUTSIDE HANDLER ============
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);

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
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => {
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
            unsubscribe();
        };
    }, []);

    // ============ NOTIFICATION LISTENERS (MEETINGS + REQUESTS + ASSIGNMENTS) ============
    useEffect(() => {
        if (!user) return;

        const unsubscribers = [];

        // ---------- MEETINGS: listen by userId (fallback to userEmail) ----------
        const meetingsQuery = query(
            collection(db, 'meetings'),
            where('userId', '==', user.uid)
        );

        const processMeetings = (snapshot) => {
            const newNotifications = [];

            snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };

                // Only notify on confirmed / cancelled / completed
                if (!data.status || !['confirmed', 'cancelled', 'completed'].includes(data.status)) {
                    return;
                }

                const statusKey = `${data.id}_${data.status}`;
                if (seenMeetingStatusesRef.current[statusKey]) return;

                const statusMessages = {
                    'confirmed': `✅ Your meeting has been confirmed!`,
                    'cancelled': `❌ Your meeting has been cancelled.`,
                    'completed': `🎉 Your meeting has been completed!`
                };

                newNotifications.push({
                    id: `meeting-${data.id}-${data.status}`,
                    type: 'meeting',
                    meetingId: data.id,
                    title: data.subject || 'Meeting Request',
                    message: statusMessages[data.status] || `Meeting ${data.status}`,
                    meetingDate: data.meetingDate,
                    meetingTime: data.meetingTime,
                    status: data.status,
                    timestamp: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
                    read: false
                });

                seenMeetingStatusesRef.current[statusKey] = true;
            });

            try {
                localStorage.setItem('user_seen_meeting_statuses', JSON.stringify(seenMeetingStatusesRef.current));
            } catch (e) { /* ignore */ }

            if (newNotifications.length > 0) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
                    if (trulyNew.length > 0) {
                        setUnreadCount(count => count + trulyNew.length);
                        return [...trulyNew, ...prev];
                    }
                    return prev;
                });
            }
        };

        const unsubMeetings = onSnapshot(
            meetingsQuery,
            processMeetings,
            (err) => {
                console.warn('Meetings userId query failed, trying userEmail fallback:', err.message);
                const fallbackQ = query(
                    collection(db, 'meetings'),
                    where('userEmail', '==', user.email)
                );
                const unsubFallback = onSnapshot(fallbackQ, processMeetings);
                unsubscribers.push(unsubFallback);
            }
        );
        unsubscribers.push(unsubMeetings);

        // ---------- CLIENT REQUESTS: status changes + developer assignments ----------
        const requestsQuery = query(
            collection(db, 'clientRequests'),
            where('userId', '==', user.uid)
        );

        const processRequests = (snapshot) => {
            const newNotifications = [];

            snapshot.forEach((docSnap) => {
                const data = { id: docSnap.id, ...docSnap.data() };

                // ---- Status change ----
                if (data.status && ['approved', 'rejected', 'in-progress', 'completed'].includes(data.status)) {
                    const statusKey = `${data.id}_${data.status}`;
                    if (!seenRequestStatusesRef.current[statusKey]) {
                        const statusMessages = {
                            'approved': `✅ Your service request has been approved!`,
                            'rejected': `❌ Your service request has been rejected.`,
                            'in-progress': `🔄 Your service request is now in progress.`,
                            'completed': `🎉 Your service request has been completed!`
                        };
                        newNotifications.push({
                            id: `request-${data.id}-${data.status}`,
                            type: 'request',
                            requestId: data.id,
                            serviceType: data.serviceType,
                            status: data.status,
                            title: getServiceLabel(data.serviceType),
                            message: statusMessages[data.status] || `Status updated to ${data.status}`,
                            timestamp: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
                            read: false
                        });
                        seenRequestStatusesRef.current[statusKey] = true;
                    }
                }

                // ---- Developer assignment ----
                if (data.assignedDevelopers && data.assignedDevelopers.length > 0) {
                    const devIds = data.assignedDevelopers.map(d => d.id).sort().join('_');
                    const assignKey = `${data.id}_${devIds}`;
                    if (!seenAssignmentsRef.current[assignKey]) {
                        const developerNames = data.assignedDevelopers.map(d => d.name).join(', ');
                        newNotifications.push({
                            id: `assign-${data.id}-${devIds}`,
                            type: 'assignment',
                            requestId: data.id,
                            serviceType: data.serviceType,
                            title: getServiceLabel(data.serviceType),
                            message: `👨‍💻 ${developerNames} ${data.assignedDevelopers.length > 1 ? 'have' : 'has'} been assigned to your project!`,
                            developers: data.assignedDevelopers,
                            timestamp: data.updatedAt?.toDate?.() || data.createdAt?.toDate?.() || new Date(),
                            read: false
                        });
                        seenAssignmentsRef.current[assignKey] = true;
                    }
                }
            });

            try {
                localStorage.setItem('user_seen_request_statuses', JSON.stringify(seenRequestStatusesRef.current));
                localStorage.setItem('user_seen_assignments', JSON.stringify(seenAssignmentsRef.current));
            } catch (e) { /* ignore */ }

            if (newNotifications.length > 0) {
                setNotifications(prev => {
                    const existingIds = new Set(prev.map(n => n.id));
                    const trulyNew = newNotifications.filter(n => !existingIds.has(n.id));
                    if (trulyNew.length > 0) {
                        setUnreadCount(count => count + trulyNew.length);
                        return [...trulyNew, ...prev];
                    }
                    return prev;
                });
            }
        };

        const unsubRequests = onSnapshot(requestsQuery, processRequests);
        unsubscribers.push(unsubRequests);

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [user]);

    // ============ HELPER FUNCTIONS ============
    const getServiceLabel = (serviceType) => {
        const services = {
            'web-development': '🌐 Web Development',
            'mobile-app': '📱 Mobile App Development',
            'saas-solution': '☁️ SaaS Solution',
            'ai-automation': '🤖 AI & Automation',
            'ui-ux-design': '🎨 UI/UX Design',
            'cloud-infrastructure': '🏗️ Cloud Infrastructure',
            'backend-api': '🗄️ Backend & API',
            'data-analytics': '📊 Data Analytics',
            'devops-services': '🔧 DevOps & CI/CD',
            'maintenance-support': '🛠️ Maintenance & Support',
            'consultation': '💡 Consultation & Strategy',
            'other': '📌 Other Service'
        };
        return services[serviceType] || serviceType || 'Service';
    };

    const getNotificationIcon = (type, status) => {
        if (type === 'assignment') return '👨‍💻';
        if (type === 'meeting') {
            const icons = { 'confirmed': '✅', 'cancelled': '❌', 'completed': '🎉' };
            return icons[status] || '📅';
        }
        const icons = { 'approved': '✅', 'rejected': '❌', 'in-progress': '🔄', 'completed': '🎉' };
        return icons[status] || '📢';
    };

    const handleNotificationClick = (notification) => {
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (notification.type === 'meeting') {
            navigate('/calendar');
        } else if (notification.type === 'request' || notification.type === 'assignment') {
            navigate('/client');
        }
        setShowNotifications(false);
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const clearAllNotifications = () => {
        setNotifications([]);
        setUnreadCount(0);
    };

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

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    // ============ RENDER ============
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

                /* ============================================
                   NOTIFICATION BELL & DROPDOWN STYLES
                   ============================================ */
                .notification-container {
                    position: relative;
                    display: inline-block;
                }

                .bell-icon {
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 10px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: #A8B2D1;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .bell-icon:hover {
                    transform: scale(1.1);
                    background: rgba(255, 107, 107, 0.1);
                    color: #FFD93D;
                }

                .bell-icon .badge {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    background: linear-gradient(135deg, #FF6B6B, #FF6BD6);
                    color: #fff;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 0.65rem;
                    font-weight: bold;
                    min-width: 18px;
                    height: 18px;
                    text-align: center;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.15); }
                    100% { transform: scale(1); }
                }

                .notification-dropdown {
                    position: absolute;
                    top: 55px;
                    right: 0;
                    background: #1A1E37;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    border-radius: 16px;
                    width: 400px;
                    max-height: 500px;
                    overflow-y: auto;
                    z-index: 9999;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
                    animation: slideDown 0.3s ease;
                }

                @keyframes slideDown {
                    from { opacity: 0; transform: translateY(-10px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                .notification-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 15px 20px;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.1);
                    position: sticky;
                    top: 0;
                    background: #1A1E37;
                    z-index: 1;
                }

                .notification-header h3 {
                    color: #FFD93D;
                    margin: 0;
                    font-size: 1rem;
                }

                .notification-header-actions {
                    display: flex;
                    gap: 8px;
                }

                .notification-header .mark-all-btn {
                    background: none;
                    border: none;
                    color: #4D96FF;
                    cursor: pointer;
                    font-size: 0.75rem;
                    transition: all 0.3s ease;
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .notification-header .mark-all-btn:hover {
                    color: #6BCB77;
                    background: rgba(107, 203, 119, 0.1);
                }

                .notification-header .clear-all-btn {
                    background: none;
                    border: none;
                    color: #FF6B6B;
                    cursor: pointer;
                    font-size: 0.75rem;
                    transition: all 0.3s ease;
                    padding: 4px 8px;
                    border-radius: 6px;
                }

                .notification-header .clear-all-btn:hover {
                    color: #FF6B6B;
                    background: rgba(255, 107, 107, 0.1);
                }

                .notification-item {
                    padding: 14px 20px;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.05);
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                }

                .notification-item:hover {
                    background: rgba(255, 107, 107, 0.05);
                }

                .notification-item.unread {
                    background: rgba(255, 217, 61, 0.03);
                    border-left: 3px solid #FFD93D;
                }

                .notification-item.read {
                    opacity: 0.7;
                }

                .notification-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                    width: 40px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.05);
                }

                .notification-content {
                    flex: 1;
                    min-width: 0;
                }

                .notification-content .notification-title {
                    color: #FFD93D;
                    font-size: 0.85rem;
                    font-weight: 600;
                    margin: 0 0 4px 0;
                }

                .notification-content .message {
                    color: #E0E0E0;
                    font-size: 0.85rem;
                    margin: 0 0 6px 0;
                    line-height: 1.4;
                }

                .notification-content .time {
                    color: #666;
                    font-size: 0.7rem;
                    margin: 0;
                }

                .notification-content .developer-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 4px;
                    margin-top: 6px;
                }

                .notification-content .developer-tag {
                    background: rgba(255, 217, 61, 0.1);
                    color: #FFD93D;
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    border: 1px solid rgba(255, 217, 61, 0.2);
                }

                .notification-empty {
                    padding: 40px 20px;
                    text-align: center;
                    color: #666;
                }

                .notification-empty .empty-icon {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 10px;
                }

                .notification-empty p {
                    margin: 5px 0;
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

                    .notification-dropdown {
                        width: 340px;
                        right: -80px;
                        position: fixed;
                        top: 70px;
                        left: 50%;
                        transform: translateX(-50%);
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

                    .notification-dropdown {
                        width: calc(100vw - 30px);
                        right: 15px;
                        left: 15px;
                        transform: none;
                        position: fixed;
                        top: 60px;
                    }
                }
            `}</style>

            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="navbar-brand">
                    <NavLink to="/" className="brand-link" onClick={closeMenu}>
                        <img src={logo} alt="Syntax SaaS Technology" className="brand-logo" />
                        <span className="brand-name">SYNTECH</span>
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
                            {/* Notification Bell - Only show for logged in users */}
                            <div className="notification-container" ref={notificationRef}>
                                <button 
                                    className="bell-icon" 
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    title="Notifications"
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span className="badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="notification-dropdown">
                                        <div className="notification-header">
                                            <h3>📬 Notifications</h3>
                                            <div className="notification-header-actions">
                                                {notifications.length > 0 && (
                                                    <>
                                                        <button className="mark-all-btn" onClick={markAllAsRead}>
                                                            Mark all read
                                                        </button>
                                                        <button className="clear-all-btn" onClick={clearAllNotifications}>
                                                            Clear all
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                        {notifications.length === 0 ? (
                                            <div className="notification-empty">
                                                <span className="empty-icon">🔕</span>
                                                <p>No notifications yet</p>
                                                <p style={{ fontSize: '0.8rem' }}>
                                                    You'll be notified about request updates, meeting confirmations, and team assignments
                                                </p>
                                            </div>
                                        ) : (
                                            notifications.map((notification) => (
                                                <div 
                                                    key={notification.id} 
                                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                    onClick={() => handleNotificationClick(notification)}
                                                >
                                                    <span className="notification-icon">
                                                        {getNotificationIcon(notification.type, notification.status)}
                                                    </span>
                                                    <div className="notification-content">
                                                        <p className="notification-title">{notification.title}</p>
                                                        <p className="message">{notification.message}</p>

                                                        {/* Show developer list for assignment notifications */}
                                                        {notification.type === 'assignment' && notification.developers && (
                                                            <div className="developer-list">
                                                                {notification.developers.map((dev) => (
                                                                    <span key={dev.id} className="developer-tag">
                                                                        {dev.name}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Show meeting date/time for meeting notifications */}
                                                        {notification.type === 'meeting' && notification.meetingDate && (
                                                            <p className="time" style={{ color: '#4D96FF', fontSize: '0.75rem' }}>
                                                                📅 {notification.meetingDate} at {notification.meetingTime}
                                                            </p>
                                                        )}

                                                        <p className="time">{formatTime(notification.timestamp)}</p>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

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