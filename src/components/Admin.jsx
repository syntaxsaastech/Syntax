// src/pages/Admin.js - COMPLETE FILE with History + Prices + PIN Management
import React, { useState, useEffect, useRef } from 'react';
import { 
    auth, 
    db, 
    collection, 
    onSnapshot, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    addDoc, 
    serverTimestamp, 
    setDoc,
    getDocs,
    where
} from '../firebase/config';

function Admin() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminUser, setAdminUser] = useState(null);
    const [email, setEmail] = useState('loki@gmail.com');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [allRequests, setAllRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, rejected: 0 });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [monthlyData, setMonthlyData] = useState([]);
    const [developers, setDevelopers] = useState([]);
    const [showDeveloperModal, setShowDeveloperModal] = useState(false);
    const [editingDeveloper, setEditingDeveloper] = useState(null);
    const [developerFormData, setDeveloperFormData] = useState({
        name: '',
        role: '',
        photo: '',
        email: '',
        github: '',
        linkedin: '',
    });
    const [isSubmittingDeveloper, setIsSubmittingDeveloper] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [showDevelopers, setShowDevelopers] = useState(true);
    const [activeUsers, setActiveUsers] = useState([]);
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedRequestForAssign, setSelectedRequestForAssign] = useState(null);
    const [selectedDeveloperIds, setSelectedDeveloperIds] = useState([]);
    const [assigningDeveloper, setAssigningDeveloper] = useState(false);
    const [showRemoveDeveloperModal, setShowRemoveDeveloperModal] = useState(false);
    const [selectedRequestForRemove, setSelectedRequestForRemove] = useState(null);
    const [selectedDeveloperToRemove, setSelectedDeveloperToRemove] = useState('');
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const [offers, setOffers] = useState([]);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [showOffers, setShowOffers] = useState(true);
    const [offerFormData, setOfferFormData] = useState({
        title: '',
        description: '',
        discount: '',
        code: '',
        icon: '🎉',
        active: true
    });
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

    const [meetings, setMeetings] = useState([]);
    const [showMeetings, setShowMeetings] = useState(true);
    const [filterMeetingStatus, setFilterMeetingStatus] = useState('all');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showMeetingDetail, setShowMeetingDetail] = useState(false);

    const [historyItems, setHistoryItems] = useState([]);
    const [showHistorySection, setShowHistorySection] = useState(true);
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [editingHistory, setEditingHistory] = useState(null);
    const [historyFormData, setHistoryFormData] = useState({
        year: new Date().getFullYear().toString(),
        title: '',
        description: '',
        icon: '🚀',
        effect: 'neon-pulse',
        badge: ''
    });
    const [isSubmittingHistory, setIsSubmittingHistory] = useState(false);
    const [historyUploadingImage, setHistoryUploadingImage] = useState(false);
    const [historyImageUrl, setHistoryImageUrl] = useState('');
    const [historyUploadError, setHistoryUploadError] = useState('');
    const [historyUploadProgress, setHistoryUploadProgress] = useState(0);
    const historyFileInputRef = useRef(null);

    const [prices, setPrices] = useState([]);
    const [showPriceSection, setShowPriceSection] = useState(true);
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    const [isSubmittingPrice, setIsSubmittingPrice] = useState(false);
    const [featureInput, setFeatureInput] = useState('');
    const [priceFormData, setPriceFormData] = useState({
        title: '',
        category: 'web-development',
        price: '',
        priceUnit: '',
        description: '',
        icon: '💎',
        features: [],
        deliveryTime: '',
        popular: false,
        active: true
    });

    // ============ ADMIN PASSWORD STATE (for login) ============
    const [adminPassword, setAdminPassword] = useState('');
    const [passwordDocId, setPasswordDocId] = useState(null);
    const [isLoadingPassword, setIsLoadingPassword] = useState(true);

    // ============ PRICELIST PIN STATE ============
    const [pricelistPin, setPricelistPin] = useState('');
    const [pricelistPinDocId, setPricelistPinDocId] = useState(null);
    const [isLoadingPin, setIsLoadingPin] = useState(true);
    const [showPinModal, setShowPinModal] = useState(false);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinChangeError, setPinChangeError] = useState('');
    const [pinChangeSuccess, setPinChangeSuccess] = useState('');
    const [isChangingPin, setIsChangingPin] = useState(false);

    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const seenMeetingIdsRef = useRef(new Set());
    const seenRequestIdsRef = useRef(new Set());
    const hasLoadedSeenIdsRef = useRef(false);
    const notificationRef = useRef(null);

    const [editFormData, setEditFormData] = useState({
        serviceType: '',
        description: '',
        scheduleDate: '',
        scheduleTime: '',
        deadline: '',
        budget: '',
        priority: 'Medium',
        status: 'pending',
        additionalNotes: ''
    });

    const CLOUDINARY_CLOUD_NAME = 'zw7pcks3';
    const CLOUDINARY_UPLOAD_PRESET = 'developer_photos';

    const serviceTypes = {
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

    const historyEffectOptions = [
        { value: 'neon-pulse', label: '🔴 Neon Pulse (Red glow)' },
        { value: 'globe-spin', label: '🔵 Globe Spin (Blue rotating)' },
        { value: 'data-wave', label: '🟢 Data Wave (Green flowing)' }
    ];

    // ============ INJECT GOOGLE FONTS + GLOBAL RESET ============
    useEffect(() => {
        const fontId = 'admin-global-fonts';
        if (!document.getElementById(fontId)) {
            const link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap';
            document.head.appendChild(link);
        }

        const styleId = 'admin-global-reset';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                html, body { background: #070B19 !important; margin: 0; padding: 0; }
                body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
            `;
            document.head.appendChild(style);
        }
    }, []);

    useEffect(() => {
        const loadAdminPassword = async () => {
            try {
                const passwordQuery = query(collection(db, 'adminSettings'));
                const snapshot = await getDocs(passwordQuery);

                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    setAdminPassword(docData.data().password || 'admin123');
                    setPasswordDocId(docData.id);
                } else {
                    const defaultPassword = 'admin123';
                    const docRef = await addDoc(collection(db, 'adminSettings'), {
                        password: defaultPassword,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    setAdminPassword(defaultPassword);
                    setPasswordDocId(docRef.id);
                }
            } catch (error) {
                console.error('Error loading admin password:', error);
                setAdminPassword('admin123');
            }
            setIsLoadingPassword(false);
        };

        loadAdminPassword();
    }, []);

    // ============ LOAD PRICELIST PIN ============
    useEffect(() => {
        const loadPricelistPin = async () => {
            try {
                const pinQuery = query(collection(db, 'pricelistSettings'));
                const snapshot = await getDocs(pinQuery);

                if (!snapshot.empty) {
                    const docData = snapshot.docs[0];
                    setPricelistPin(docData.data().pin || '1234');
                    setPricelistPinDocId(docData.id);
                } else {
                    const defaultPin = '1234';
                    const docRef = await addDoc(collection(db, 'pricelistSettings'), {
                        pin: defaultPin,
                        createdAt: serverTimestamp(),
                        updatedAt: serverTimestamp()
                    });
                    setPricelistPin(defaultPin);
                    setPricelistPinDocId(docRef.id);
                }
            } catch (error) {
                console.error('Error loading pricelist PIN:', error);
                setPricelistPin('1234');
            }
            setIsLoadingPin(false);
        };

        loadPricelistPin();
    }, []);

    useEffect(() => {
        try {
            const storedMeetings = localStorage.getItem('admin_seen_meetings');
            if (storedMeetings) {
                seenMeetingIdsRef.current = new Set(JSON.parse(storedMeetings));
            }
            const storedRequests = localStorage.getItem('admin_seen_requests');
            if (storedRequests) {
                seenRequestIdsRef.current = new Set(JSON.parse(storedRequests));
            }
        } catch (e) {
            console.error('Error loading seen IDs:', e);
        }
        hasLoadedSeenIdsRef.current = true;
    }, []);

    useEffect(() => {
        try {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                try {
                    if (user) {
                        setAdminUser(user);
                        setIsAuthenticated(true);
                        updateActiveUser(user.uid, user.email, user.displayName);
                    } else {
                        setAdminUser(null);
                        setIsAuthenticated(false);
                    }
                } catch (error) {
                    console.error('Auth state error:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Auth setup error:', error);
        }
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const updateActiveUser = async (uid, email, displayName) => {
        try {
            const userRef = doc(db, 'activeUsers', uid);
            await updateDoc(userRef, {
                email: email,
                displayName: displayName || email,
                lastActive: serverTimestamp(),
                isActive: true
            }).catch(async () => {
                await setDoc(userRef, {
                    email: email,
                    displayName: displayName || email,
                    lastActive: serverTimestamp(),
                    isActive: true,
                    createdAt: serverTimestamp()
                });
            });
        } catch (error) {
            console.error('Error updating active user:', error);
        }
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const activeUsersQuery = query(collection(db, 'activeUsers'), orderBy('lastActive', 'desc'));
            const unsubscribe = onSnapshot(activeUsersQuery, (snapshot) => {
                try {
                    const users = [];
                    const now = new Date();
                    snapshot.forEach((doc) => {
                        const data = { id: doc.id, ...doc.data() };
                        if (data.lastActive) {
                            const lastActive = data.lastActive.toDate ? data.lastActive.toDate() : new Date(data.lastActive);
                            const diffMinutes = (now - lastActive) / (1000 * 60);
                            data.isActive = diffMinutes < 5;
                        }
                        users.push(data);
                    });
                    setActiveUsers(users);
                } catch (error) {
                    console.error('Error processing active users:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up active users listener:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const offersQuery = query(collection(db, 'offers'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(offersQuery, (snapshot) => {
                try {
                    const offerData = [];
                    snapshot.forEach((doc) => {
                        offerData.push({ id: doc.id, ...doc.data() });
                    });
                    setOffers(offerData);
                } catch (error) {
                    console.error('Error processing offers:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up offers listener:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const historyQuery = query(collection(db, 'history'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
                try {
                    const items = [];
                    snapshot.forEach((doc) => {
                        items.push({ id: doc.id, ...doc.data() });
                    });
                    setHistoryItems(items);
                } catch (error) {
                    console.error('Error processing history items:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up history listener:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const pricesQuery = query(collection(db, 'prices'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(pricesQuery, (snapshot) => {
                try {
                    const priceData = [];
                    snapshot.forEach((doc) => {
                        priceData.push({ id: doc.id, ...doc.data() });
                    });
                    setPrices(priceData);
                } catch (error) {
                    console.error('Error processing prices:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up prices listener:', error);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!hasLoadedSeenIdsRef.current) return;
        try {
            const meetingsQuery = query(collection(db, 'meetings'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(meetingsQuery, (snapshot) => {
                try {
                    const meetingData = [];
                    const newNotifications = [];
                    let changed = false;
                    snapshot.forEach((doc) => {
                        const data = { id: doc.id, ...doc.data() };
                        meetingData.push(data);
                        if (!seenMeetingIdsRef.current.has(data.id)) {
                            if ((data.status || 'pending') === 'pending') {
                                newNotifications.push({
                                    id: `meeting-${data.id}`,
                                    type: 'meeting',
                                    meetingId: data.id,
                                    title: data.subject || 'Meeting Request',
                                    message: `📅 New meeting request from ${data.name || 'a client'}`,
                                    clientName: data.name,
                                    clientEmail: data.email,
                                    meetingDate: data.meetingDate,
                                    meetingTime: data.meetingTime,
                                    status: data.status || 'pending',
                                    timestamp: data.createdAt?.toDate?.() || new Date(),
                                    read: false
                                });
                            }
                            seenMeetingIdsRef.current.add(data.id);
                            changed = true;
                        }
                    });
                    setMeetings(meetingData);
                    if (changed) {
                        try {
                            localStorage.setItem('admin_seen_meetings', JSON.stringify([...seenMeetingIdsRef.current]));
                        } catch (e) {
                            console.error('localStorage error:', e);
                        }
                    }
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
                } catch (error) {
                    console.error('Error processing meetings:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up meetings listener:', error);
        }
    }, [isAuthenticated]);

    const isDeveloperActive = (developerEmail) => {
        try {
            const activeUser = activeUsers.find(u =>
                u.email && developerEmail && u.email.toLowerCase() === developerEmail.toLowerCase()
            );
            return activeUser ? activeUser.isActive : false;
        } catch (error) {
            return false;
        }
    };

    const getDeveloperStatus = (developerEmail) => {
        try {
            const activeUser = activeUsers.find(u =>
                u.email && developerEmail && u.email.toLowerCase() === developerEmail.toLowerCase()
            );
            if (activeUser) {
                return { isActive: activeUser.isActive, lastActive: activeUser.lastActive };
            }
            return { isActive: false, lastActive: null };
        } catch (error) {
            return { isActive: false, lastActive: null };
        }
    };

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

        if (password !== adminPassword) {
            setLoginError('❌ Incorrect admin password.');
            setIsLoading(false);
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setAdminUser(userCredential.user);
            setIsAuthenticated(true);
            setLoginError('');
        } catch (error) {
            console.error('Login Error:', error);
            if (error.code === 'auth/user-not-found') {
                setLoginError('❌ Admin account not found.');
            } else if (error.code === 'auth/wrong-password') {
                setLoginError('❌ Incorrect Firebase password. If you changed the admin password here, you must also update the Firebase Auth password.');
            } else {
                setLoginError('❌ Login failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    const handleAdminLogout = async () => {
        try {
            if (adminUser) {
                const userRef = doc(db, 'activeUsers', adminUser.uid);
                await updateDoc(userRef, {
                    isActive: false,
                    lastActive: serverTimestamp()
                }).catch(() => { });
            }
            await signOut(auth);
            setIsAuthenticated(false);
            setAdminUser(null);
            setNotifications([]);
            setUnreadCount(0);
            alert('✅ Logged out successfully!');
        } catch (error) {
            console.error('Logout Error:', error);
            alert('❌ Error logging out.');
        }
    };

    // ============ CHANGE PRICELIST PIN ============
    const handleChangePin = async (e) => {
        e.preventDefault();
        setPinChangeError('');
        setPinChangeSuccess('');

        if (!newPin || !confirmPin) {
            setPinChangeError('❌ Please fill in both PIN fields.');
            return;
        }
        if (!/^\d{4}$/.test(newPin)) {
            setPinChangeError('❌ PIN must be exactly 4 digits (0-9).');
            return;
        }
        if (newPin !== confirmPin) {
            setPinChangeError('❌ PINs do not match.');
            return;
        }

        setIsChangingPin(true);
        try {
            if (pricelistPinDocId) {
                const docRef = doc(db, 'pricelistSettings', pricelistPinDocId);
                await updateDoc(docRef, {
                    pin: newPin,
                    updatedAt: serverTimestamp()
                });
            } else {
                const docRef = await addDoc(collection(db, 'pricelistSettings'), {
                    pin: newPin,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
                setPricelistPinDocId(docRef.id);
            }
            setPricelistPin(newPin);
            setPinChangeSuccess('✅ Pricelist PIN updated successfully!');
            setNewPin('');
            setConfirmPin('');
            setTimeout(() => {
                setShowPinModal(false);
                setPinChangeSuccess('');
            }, 1500);
        } catch (error) {
            console.error('Error changing PIN:', error);
            setPinChangeError('❌ Error updating PIN: ' + error.message);
        }
        setIsChangingPin(false);
    };

    useEffect(() => {
        if (!isAuthenticated) return;
        if (!hasLoadedSeenIdsRef.current) return;
        try {
            const q = query(collection(db, 'clientRequests'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                try {
                    const requests = [];
                    let pendingCount = 0, inProgressCount = 0, completedCount = 0, rejectedCount = 0;
                    const monthlyStats = {};
                    const newNotifications = [];
                    let changed = false;
                    snapshot.forEach((doc) => {
                        const data = { id: doc.id, ...doc.data() };
                        if (!data.assignedDevelopers) data.assignedDevelopers = [];
                        requests.push(data);
                        if (!seenRequestIdsRef.current.has(data.id)) {
                            if ((data.status || 'pending') === 'pending') {
                                newNotifications.push({
                                    id: `request-${data.id}`,
                                    type: 'request',
                                    requestId: data.id,
                                    title: serviceTypes[data.serviceType] || 'Service Request',
                                    message: `📋 New service request from ${data.clientName || 'a client'}`,
                                    clientName: data.clientName,
                                    clientEmail: data.email,
                                    serviceType: data.serviceType,
                                    status: data.status || 'pending',
                                    timestamp: data.createdAt?.toDate?.() || new Date(),
                                    read: false
                                });
                            }
                            seenRequestIdsRef.current.add(data.id);
                            changed = true;
                        }
                        switch (data.status) {
                            case 'pending': pendingCount++; break;
                            case 'in-progress': inProgressCount++; break;
                            case 'completed': completedCount++; break;
                            case 'rejected': rejectedCount++; break;
                            default: break;
                        }
                        if (data.createdAt) {
                            try {
                                const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                                const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                                if (!monthlyStats[monthKey]) monthlyStats[monthKey] = { total: 0, completed: 0, pending: 0 };
                                monthlyStats[monthKey].total++;
                                if (data.status === 'completed') monthlyStats[monthKey].completed++;
                                if (data.status === 'pending') monthlyStats[monthKey].pending++;
                            } catch (error) {
                                console.error('Error processing date:', error);
                            }
                        }
                    });
                    const monthlyArray = Object.entries(monthlyStats).map(([month, data]) => ({ month, ...data })).slice(-6);
                    setMonthlyData(monthlyArray);
                    setAllRequests(requests);
                    setStats({
                        total: requests.length,
                        pending: pendingCount,
                        inProgress: inProgressCount,
                        completed: completedCount,
                        rejected: rejectedCount
                    });
                    setLoading(false);
                    if (changed) {
                        try {
                            localStorage.setItem('admin_seen_requests', JSON.stringify([...seenRequestIdsRef.current]));
                        } catch (e) {
                            console.error('localStorage error:', e);
                        }
                    }
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
                } catch (error) {
                    console.error('Error processing requests:', error);
                    setLoading(false);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up requests listener:', error);
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated) return;
        try {
            const developersQuery = query(collection(db, 'developers'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(developersQuery, (snapshot) => {
                try {
                    const devs = [];
                    snapshot.forEach((doc) => {
                        devs.push({ id: doc.id, ...doc.data() });
                    });
                    setDevelopers(devs);
                } catch (error) {
                    console.error('Error processing developers:', error);
                }
            });
            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up developers listener:', error);
        }
    }, [isAuthenticated]);

    const handleNotificationClick = (notification) => {
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (notification.type === 'meeting') {
            setShowMeetings(true);
            setFilterMeetingStatus('all');
            setTimeout(() => {
                const el = document.getElementById('meetings-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        } else if (notification.type === 'request') {
            setFilterStatus('all');
            setTimeout(() => {
                const el = document.getElementById('requests-section');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
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

    const getNotificationIcon = (type) => {
        if (type === 'meeting') return '📅';
        if (type === 'request') return '📋';
        return '📢';
    };

    const formatNotificationTime = (timestamp) => {
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

    const filteredRequests = allRequests.filter(request => {
        try {
            const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
            const matchesSearch =
                request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                request.description?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        } catch (error) {
            return true;
        }
    });

    const getServiceDistribution = () => {
        try {
            const distribution = {};
            allRequests.forEach(req => {
                const service = req.serviceType || 'other';
                distribution[service] = (distribution[service] || 0) + 1;
            });
            return Object.entries(distribution).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);
        } catch (error) {
            return [];
        }
    };

    const getPriorityDistribution = () => {
        try {
            const distribution = { High: 0, Medium: 0, Low: 0 };
            allRequests.forEach(req => {
                if (req.priority) distribution[req.priority] = (distribution[req.priority] || 0) + 1;
            });
            return Object.entries(distribution).map(([name, value]) => ({ name, value }));
        } catch (error) {
            return [];
        }
    };

    const getStatusDistribution = () => {
        try {
            const distribution = { pending: 0, approved: 0, 'in-progress': 0, completed: 0, rejected: 0 };
            allRequests.forEach(req => {
                if (req.status) distribution[req.status] = (distribution[req.status] || 0) + 1;
            });
            return Object.entries(distribution).map(([name, value]) => ({ name, value }));
        } catch (error) {
            return [];
        }
    };

    const handleDeveloperChange = (e) => {
        const { name, value } = e.target;
        setDeveloperFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOfferChange = (e) => {
        const { name, value, type, checked } = e.target;
        setOfferFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleHistoryChange = (e) => {
        const { name, value } = e.target;
        setHistoryFormData(prev => ({ ...prev, [name]: value }));
    };

    const openAddHistory = () => {
        setEditingHistory(null);
        setHistoryFormData({
            year: new Date().getFullYear().toString(),
            title: '',
            description: '',
            icon: '🚀',
            effect: 'neon-pulse',
            badge: ''
        });
        setHistoryImageUrl('');
        setHistoryUploadError('');
        setHistoryUploadProgress(0);
        setShowHistoryModal(true);
    };

    const openEditHistory = (item) => {
        setEditingHistory(item);
        setHistoryFormData({
            year: item.year || '',
            title: item.title || '',
            description: item.description || '',
            icon: item.icon || '🚀',
            effect: item.effect || 'neon-pulse',
            badge: item.badge || ''
        });
        setHistoryImageUrl(item.imageUrl || '');
        setHistoryUploadError('');
        setHistoryUploadProgress(0);
        setShowHistoryModal(true);
    };

    const handleHistoryImageUpload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setHistoryUploadError('⚠️ Please select an image file (JPG, PNG, GIF, etc.)');
            if (historyFileInputRef.current) historyFileInputRef.current.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setHistoryUploadError('⚠️ File is too large. Maximum size is 10MB.');
            if (historyFileInputRef.current) historyFileInputRef.current.value = '';
            return;
        }
        setHistoryUploadError('');
        setHistoryUploadProgress(0);
        setHistoryUploadingImage(true);
        setHistoryUploadProgress(10);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            setHistoryUploadProgress(70);
            const data = await response.json();
            if (response.ok && data.secure_url) {
                setHistoryImageUrl(data.secure_url);
                setHistoryUploadProgress(100);
                alert('✅ Image uploaded successfully!');
                setHistoryUploadError('');
            } else {
                let errorMsg = 'Failed to upload image. ';
                if (data.error && data.error.message) errorMsg += data.error.message;
                setHistoryUploadError('❌ ' + errorMsg);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setHistoryUploadError('❌ Error uploading image: ' + error.message);
        }
        setHistoryUploadingImage(false);
        setHistoryUploadProgress(0);
        if (historyFileInputRef.current) historyFileInputRef.current.value = '';
    };

    const saveHistory = async (e) => {
        e.preventDefault();
        setIsSubmittingHistory(true);
        try {
            const historyData = {
                year: historyFormData.year,
                title: historyFormData.title,
                description: historyFormData.description,
                icon: historyFormData.icon,
                effect: historyFormData.effect,
                badge: historyFormData.badge,
                imageUrl: historyImageUrl || '',
                updatedAt: serverTimestamp()
            };
            if (editingHistory) {
                const historyRef = doc(db, 'history', editingHistory.id);
                await updateDoc(historyRef, historyData);
                alert('✅ History item updated successfully!');
            } else {
                historyData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'history'), historyData);
                alert('✅ History item added successfully!');
            }
            setShowHistoryModal(false);
            setEditingHistory(null);
            setHistoryFormData({
                year: new Date().getFullYear().toString(),
                title: '',
                description: '',
                icon: '🚀',
                effect: 'neon-pulse',
                badge: ''
            });
            setHistoryImageUrl('');
        } catch (error) {
            console.error('Error saving history:', error);
            alert('❌ Error saving history: ' + error.message);
        }
        setIsSubmittingHistory(false);
    };

    const deleteHistory = async (historyId) => {
        if (window.confirm('Are you sure you want to delete this history item?')) {
            try {
                await deleteDoc(doc(db, 'history', historyId));
                alert('✅ History item deleted successfully!');
            } catch (error) {
                console.error('Error deleting history:', error);
                alert('❌ Error deleting history.');
            }
        }
    };

    const handlePriceChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPriceFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const openAddPrice = () => {
        setEditingPrice(null);
        setPriceFormData({
            title: '',
            category: 'web-development',
            price: '',
            priceUnit: '',
            description: '',
            icon: '💎',
            features: [],
            deliveryTime: '',
            popular: false,
            active: true
        });
        setFeatureInput('');
        setShowPriceModal(true);
    };

    const openEditPrice = (price) => {
        setEditingPrice(price);
        setPriceFormData({
            title: price.title || '',
            category: price.category || 'web-development',
            price: price.price || '',
            priceUnit: price.priceUnit || '',
            description: price.description || '',
            icon: price.icon || '💎',
            features: price.features || [],
            deliveryTime: price.deliveryTime || '',
            popular: price.popular || false,
            active: price.active !== undefined ? price.active : true
        });
        setFeatureInput('');
        setShowPriceModal(true);
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setPriceFormData(prev => ({
                ...prev,
                features: [...prev.features, featureInput.trim()]
            }));
            setFeatureInput('');
        }
    };

    const removeFeature = (index) => {
        setPriceFormData(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }));
    };

    const savePrice = async (e) => {
        e.preventDefault();
        setIsSubmittingPrice(true);
        try {
            const priceData = {
                title: priceFormData.title,
                category: priceFormData.category,
                price: priceFormData.price,
                priceUnit: priceFormData.priceUnit,
                description: priceFormData.description,
                icon: priceFormData.icon,
                features: priceFormData.features,
                deliveryTime: priceFormData.deliveryTime,
                popular: priceFormData.popular,
                active: priceFormData.active,
                updatedAt: serverTimestamp()
            };
            if (editingPrice) {
                const priceRef = doc(db, 'prices', editingPrice.id);
                await updateDoc(priceRef, priceData);
                alert('✅ Price updated successfully!');
            } else {
                priceData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'prices'), priceData);
                alert('✅ Price added successfully!');
            }
            setShowPriceModal(false);
            setEditingPrice(null);
            setPriceFormData({
                title: '',
                category: 'web-development',
                price: '',
                priceUnit: '',
                description: '',
                icon: '💎',
                features: [],
                deliveryTime: '',
                popular: false,
                active: true
            });
        } catch (error) {
            console.error('Error saving price:', error);
            alert('❌ Error saving price: ' + error.message);
        }
        setIsSubmittingPrice(false);
    };

    const deletePrice = async (priceId) => {
        if (window.confirm('Are you sure you want to delete this price?')) {
            try {
                await deleteDoc(doc(db, 'prices', priceId));
                alert('✅ Price deleted successfully!');
            } catch (error) {
                console.error('Error deleting price:', error);
                alert('❌ Error deleting price.');
            }
        }
    };

    const togglePriceStatus = async (priceId, currentStatus) => {
        try {
            const priceRef = doc(db, 'prices', priceId);
            await updateDoc(priceRef, {
                active: !currentStatus,
                updatedAt: serverTimestamp()
            });
            alert(`✅ Price ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
            console.error('Error toggling price status:', error);
            alert('❌ Error updating price status.');
        }
    };

    const handleImageUpload = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setUploadError('⚠️ Please select an image file (JPG, PNG, GIF, etc.)');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            setUploadError('⚠️ File is too large. Maximum size is 10MB.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setUploadError('');
        setUploadProgress(0);
        setUploadingImage(true);
        setUploadProgress(10);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            setUploadProgress(70);
            const data = await response.json();
            if (response.ok && data.secure_url) {
                setDeveloperFormData(prev => ({ ...prev, photo: data.secure_url }));
                setUploadProgress(100);
                alert('✅ Image uploaded successfully!');
                setUploadError('');
            } else {
                let errorMsg = 'Failed to upload image. ';
                if (data.error && data.error.message) errorMsg += data.error.message;
                setUploadError('❌ ' + errorMsg);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            setUploadError('❌ Error uploading image: ' + error.message);
        }
        setUploadingImage(false);
        setUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const openAddDeveloper = () => {
        setEditingDeveloper(null);
        setDeveloperFormData({
            name: '', role: '', photo: '', email: '', github: '', linkedin: '',
        });
        setUploadError('');
        setUploadProgress(0);
        setShowDeveloperModal(true);
    };

    const openEditDeveloper = (developer) => {
        setEditingDeveloper(developer);
        setDeveloperFormData({
            name: developer.name || '',
            role: developer.role || '',
            photo: developer.photo || '',
            email: developer.email || '',
            github: developer.github || '',
            linkedin: developer.linkedin || '',
        });
        setUploadError('');
        setUploadProgress(0);
        setShowDeveloperModal(true);
    };

    const saveDeveloper = async (e) => {
        e.preventDefault();
        setIsSubmittingDeveloper(true);
        try {
            const developerData = {
                name: developerFormData.name,
                role: developerFormData.role,
                photo: developerFormData.photo,
                email: developerFormData.email,
                github: developerFormData.github,
                linkedin: developerFormData.linkedin,
                updatedAt: serverTimestamp()
            };
            if (editingDeveloper) {
                const devRef = doc(db, 'developers', editingDeveloper.id);
                await updateDoc(devRef, developerData);
                alert('✅ Developer updated successfully!');
            } else {
                developerData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'developers'), developerData);
                alert('✅ Developer added successfully!');
            }
            setShowDeveloperModal(false);
            setEditingDeveloper(null);
            setDeveloperFormData({
                name: '', role: '', photo: '', email: '', github: '', linkedin: '',
            });
        } catch (error) {
            console.error('Error saving developer:', error);
            alert('❌ Error saving developer: ' + error.message);
        }
        setIsSubmittingDeveloper(false);
    };

    const deleteDeveloper = async (developerId) => {
        if (window.confirm('Are you sure you want to delete this developer?')) {
            try {
                await deleteDoc(doc(db, 'developers', developerId));
                alert('✅ Developer deleted successfully!');
            } catch (error) {
                console.error('Error deleting developer:', error);
                alert('❌ Error deleting developer.');
            }
        }
    };

    const openAssignModal = (request) => {
        setSelectedRequestForAssign(request);
        const currentAssignedIds = request.assignedDevelopers ? request.assignedDevelopers.map(d => d.id) : [];
        setSelectedDeveloperIds(currentAssignedIds);
        setShowAssignModal(true);
    };

    const toggleDeveloperSelection = (developerId) => {
        setSelectedDeveloperIds(prev => {
            if (prev.includes(developerId)) return prev.filter(id => id !== developerId);
            return [...prev, developerId];
        });
    };

    const assignDevelopersToRequest = async () => {
        if (selectedDeveloperIds.length === 0) {
            alert('⚠️ Please select at least one developer.');
            return;
        }
        setAssigningDeveloper(true);
        try {
            const selectedDevelopers = developers.filter(d => selectedDeveloperIds.includes(d.id));
            const assignedDevelopersData = selectedDevelopers.map(dev => ({
                id: dev.id,
                name: dev.name || 'Unknown',
                email: dev.email || '',
                photo: dev.photo || '',
                role: dev.role || ''
            }));
            const requestRef = doc(db, 'clientRequests', selectedRequestForAssign.id);
            await updateDoc(requestRef, {
                assignedDevelopers: assignedDevelopersData,
                status: 'in-progress',
                updatedAt: serverTimestamp()
            });
            alert(`✅ ${selectedDevelopers.length} developer(s) assigned successfully!`);
            setShowAssignModal(false);
            setSelectedRequestForAssign(null);
            setSelectedDeveloperIds([]);
        } catch (error) {
            console.error('Error assigning developers:', error);
            alert('❌ Error assigning developers: ' + error.message);
        }
        setAssigningDeveloper(false);
    };

    const openRemoveDeveloperModal = (request) => {
        setSelectedRequestForRemove(request);
        setSelectedDeveloperToRemove('');
        setShowRemoveDeveloperModal(true);
    };

    const removeDeveloperFromRequest = async () => {
        if (!selectedDeveloperToRemove) {
            alert('⚠️ Please select a developer to remove.');
            return;
        }
        try {
            const requestRef = doc(db, 'clientRequests', selectedRequestForRemove.id);
            const request = allRequests.find(r => r.id === selectedRequestForRemove.id);
            const updatedDevelopers = request.assignedDevelopers.filter(d => d.id !== selectedDeveloperToRemove);
            await updateDoc(requestRef, {
                assignedDevelopers: updatedDevelopers,
                updatedAt: serverTimestamp()
            });
            alert('✅ Developer removed successfully!');
            setShowRemoveDeveloperModal(false);
            setSelectedRequestForRemove(null);
            setSelectedDeveloperToRemove('');
        } catch (error) {
            console.error('Error removing developer:', error);
            alert('❌ Error removing developer: ' + error.message);
        }
    };

    const openAddOffer = () => {
        setEditingOffer(null);
        setOfferFormData({
            title: '', description: '', discount: '', code: '', icon: '🎉', active: true
        });
        setShowOfferModal(true);
    };

    const openEditOffer = (offer) => {
        setEditingOffer(offer);
        setOfferFormData({
            title: offer.title || '',
            description: offer.description || '',
            discount: offer.discount || '',
            code: offer.code || '',
            icon: offer.icon || '🎉',
            active: offer.active !== undefined ? offer.active : true
        });
        setShowOfferModal(true);
    };

    const saveOffer = async (e) => {
        e.preventDefault();
        setIsSubmittingOffer(true);
        try {
            const offerData = {
                title: offerFormData.title,
                description: offerFormData.description,
                discount: offerFormData.discount,
                code: offerFormData.code,
                icon: offerFormData.icon,
                active: offerFormData.active,
                updatedAt: serverTimestamp()
            };
            if (editingOffer) {
                const offerRef = doc(db, 'offers', editingOffer.id);
                await updateDoc(offerRef, offerData);
                alert('✅ Offer updated successfully!');
            } else {
                offerData.createdAt = serverTimestamp();
                await addDoc(collection(db, 'offers'), offerData);
                alert('✅ Offer added successfully!');
            }
            setShowOfferModal(false);
            setEditingOffer(null);
            setOfferFormData({
                title: '', description: '', discount: '', code: '', icon: '🎉', active: true
            });
        } catch (error) {
            console.error('Error saving offer:', error);
            alert('❌ Error saving offer: ' + error.message);
        }
        setIsSubmittingOffer(false);
    };

    const deleteOffer = async (offerId) => {
        if (window.confirm('Are you sure you want to delete this offer?')) {
            try {
                await deleteDoc(doc(db, 'offers', offerId));
                alert('✅ Offer deleted successfully!');
            } catch (error) {
                console.error('Error deleting offer:', error);
                alert('❌ Error deleting offer.');
            }
        }
    };

    const toggleOfferStatus = async (offerId, currentStatus) => {
        try {
            const offerRef = doc(db, 'offers', offerId);
            await updateDoc(offerRef, {
                active: !currentStatus,
                updatedAt: serverTimestamp()
            });
            alert(`✅ Offer ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        } catch (error) {
            console.error('Error toggling offer status:', error);
            alert('❌ Error updating offer status.');
        }
    };

    const handleMeetingStatusChange = async (meetingId, newStatus) => {
        try {
            const meetingRef = doc(db, 'meetings', meetingId);
            await updateDoc(meetingRef, {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            alert(`✅ Meeting ${newStatus}!`);
        } catch (error) {
            console.error('Error updating meeting status:', error);
            alert('❌ Error updating meeting status.');
        }
    };

    const deleteMeeting = async (meetingId) => {
        if (window.confirm('Are you sure you want to delete this meeting request?')) {
            try {
                await deleteDoc(doc(db, 'meetings', meetingId));
                alert('✅ Meeting request deleted successfully!');
            } catch (error) {
                console.error('Error deleting meeting:', error);
                alert('❌ Error deleting meeting.');
            }
        }
    };

    const openMeetingDetail = (meeting) => {
        setSelectedMeeting(meeting);
        setShowMeetingDetail(true);
    };

    const getMeetingStatusBadge = (status) => {
        const statusMap = {
            'pending': { color: '#FFD93D', label: '⏳ Pending', bg: 'rgba(255, 217, 61, 0.15)' },
            'confirmed': { color: '#6BCB77', label: '✅ Confirmed', bg: 'rgba(107, 203, 119, 0.15)' },
            'completed': { color: '#4D96FF', label: '🎉 Completed', bg: 'rgba(77, 150, 255, 0.15)' },
            'cancelled': { color: '#FF6B6B', label: '❌ Cancelled', bg: 'rgba(255, 107, 107, 0.15)' }
        };
        return statusMap[status] || statusMap['pending'];
    };

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            const requestRef = doc(db, 'clientRequests', requestId);
            await updateDoc(requestRef, {
                status: newStatus,
                updatedAt: new Date()
            });
            alert(`✅ Status updated to ${newStatus}!`);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Error updating status.');
        }
    };

    const handleEdit = (request) => {
        setSelectedRequest(request);
        setEditFormData({
            serviceType: request.serviceType || '',
            description: request.description || '',
            scheduleDate: request.scheduleDate || '',
            scheduleTime: request.scheduleTime || '',
            deadline: request.deadline || '',
            budget: request.budget || '',
            priority: request.priority || 'Medium',
            status: request.status || 'pending',
            additionalNotes: request.additionalNotes || ''
        });
        setShowEditModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const requestRef = doc(db, 'clientRequests', selectedRequest.id);
            await updateDoc(requestRef, {
                ...editFormData,
                updatedAt: new Date()
            });
            alert('✅ Request updated successfully!');
            setShowEditModal(false);
            setSelectedRequest(null);
        } catch (error) {
            console.error('Error updating request:', error);
            alert('❌ Error updating request.');
        }
        setLoading(false);
    };

    const handleDelete = async (requestId) => {
        if (window.confirm('Are you sure you want to delete this request?')) {
            try {
                await deleteDoc(doc(db, 'clientRequests', requestId));
                alert('✅ Request deleted successfully!');
            } catch (error) {
                console.error('Error deleting request:', error);
                alert('❌ Error deleting request.');
            }
        }
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { color: '#FFD93D', label: '⏳ Pending', bg: 'rgba(255, 217, 61, 0.15)' },
            'approved': { color: '#6BCB77', label: '✅ Approved', bg: 'rgba(107, 203, 119, 0.15)' },
            'in-progress': { color: '#4D96FF', label: '🔄 In Progress', bg: 'rgba(77, 150, 255, 0.15)' },
            'completed': { color: '#6BCB77', label: '🎉 Completed', bg: 'rgba(107, 203, 119, 0.15)' },
            'rejected': { color: '#FF6B6B', label: '❌ Rejected', bg: 'rgba(255, 107, 107, 0.15)' }
        };
        return statusMap[status] || statusMap['pending'];
    };

    const getPriorityBadge = (priority) => {
        const priorityMap = {
            'High': { color: '#FF6B6B', label: '🔴 High' },
            'Medium': { color: '#FFD93D', label: '🟡 Medium' },
            'Low': { color: '#6BCB77', label: '🟢 Low' }
        };
        return priorityMap[priority] || priorityMap['Medium'];
    };

    const serviceData = getServiceDistribution();
    const priorityData = getPriorityDistribution();
    const statusData = getStatusDistribution();

    const statusColors = {
        pending: '#FFD93D',
        approved: '#6BCB77',
        'in-progress': '#4D96FF',
        completed: '#6BCB77',
        rejected: '#FF6B6B'
    };

    const filteredDevelopers = developers.filter(dev => {
        if (showOnlyActive) return isDeveloperActive(dev.email);
        return true;
    });

    const activeDeveloperCount = developers.filter(dev => isDeveloperActive(dev.email)).length;

    // Shared styles
    const sharedStyles = `
        .admin-page, .admin-login-page {
            min-height: 100vh;
            background: #070B19;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #F1F5F9;
            position: relative;
            overflow-x: hidden;
        }

        .admin-page::before, .admin-login-page::before {
            content: '';
            position: fixed;
            inset: 0;
            background:
                radial-gradient(circle at 12% 10%, rgba(99, 102, 241, 0.10) 0%, transparent 40%),
                radial-gradient(circle at 88% 15%, rgba(236, 72, 153, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 50% 100%, rgba(77, 150, 255, 0.09) 0%, transparent 45%),
                radial-gradient(circle at 20% 80%, rgba(107, 203, 119, 0.07) 0%, transparent 40%);
            pointer-events: none;
            z-index: 0;
        }

        .admin-page > *, .admin-login-page > * { position: relative; z-index: 1; }

        .admin-page {
            padding: 30px 24px 60px;
            margin-top: 80px;
            max-width: 1500px;
            margin-left: auto;
            margin-right: auto;
        }

        .admin-login-card {
            background: linear-gradient(155deg, rgba(15, 23, 48, 0.92), rgba(10, 16, 36, 0.96));
            padding: 48px 40px;
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.10);
            width: 100%;
            max-width: 440px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.5);
            position: relative;
            overflow: hidden;
        }

        .admin-login-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
            background-size: 200% 100%;
            animation: adminRainbowFlow 8s ease-in-out infinite;
        }

        @keyframes adminRainbowFlow {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
        }

        .admin-login-icon {
            font-size: 3rem;
            display: block;
            text-align: center;
            margin-bottom: 12px;
            filter: drop-shadow(0 0 24px rgba(255, 217, 61, 0.4));
        }

        .admin-login-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            text-align: center;
            margin: 0 0 10px 0;
            background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 55%, #4D96FF 78%, #FF6BD6 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: adminRainbowFlow 10s ease-in-out infinite;
        }

        .admin-login-subtitle {
            color: #94A3B8;
            text-align: center;
            margin: 0 0 32px 0;
            font-size: 0.875rem;
        }

        .admin-error {
            color: #FCA5A5;
            font-size: 0.8125rem;
            padding: 12px 16px;
            background: rgba(220, 38, 38, 0.12);
            border-radius: 10px;
            border: 1px solid rgba(220, 38, 38, 0.28);
            margin-bottom: 20px;
            text-align: center;
        }

        .admin-success {
            color: #86EFAC;
            font-size: 0.8125rem;
            padding: 12px 16px;
            background: rgba(107, 203, 119, 0.12);
            border-radius: 10px;
            border: 1px solid rgba(107, 203, 119, 0.3);
            margin-bottom: 16px;
        }

        .admin-form-group { margin-bottom: 20px; }

        .admin-label {
            display: block;
            margin-bottom: 8px;
            color: #F1F5F9;
            font-size: 0.8125rem;
            font-weight: 600;
        }

        .admin-input {
            width: 100%;
            padding: 13px 16px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 12px;
            color: #F1F5F9;
            font-size: 0.9375rem;
            font-family: inherit;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
            box-sizing: border-box;
        }

        .admin-input::placeholder { color: #64748B; }

        .admin-input:focus {
            outline: none;
            border-color: #4D96FF;
            background: rgba(77, 150, 255, 0.06);
            box-shadow: 0 0 0 4px rgba(77, 150, 255, 0.15);
        }

        .admin-login-btn {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
            background-size: 200% 200%;
            color: #FFFFFF;
            border: none;
            border-radius: 12px;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-position 0.4s ease;
            margin-top: 8px;
            box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
        }

        .admin-login-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            background-position: 100% 50%;
            box-shadow: 0 14px 40px rgba(139, 92, 246, 0.45);
        }

        .admin-login-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        .admin-login-footer {
            text-align: center;
            margin-top: 24px;
            color: #64748B;
            font-size: 0.8125rem;
        }

        .admin-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 32px;
            flex-wrap: wrap;
            gap: 20px;
        }

        .admin-header-left h1 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: -0.04em;
            line-height: 1.05;
            margin: 0 0 8px 0;
            background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 55%, #4D96FF 78%, #FF6BD6 100%);
            background-size: 200% 200%;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: adminRainbowFlow 12s ease-in-out infinite;
        }

        .admin-header-left p {
            color: #94A3B8;
            margin: 0;
            font-size: 0.875rem;
        }

        .admin-header-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        .admin-btn {
            padding: 10px 16px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            background: rgba(255, 255, 255, 0.04);
            color: #F1F5F9;
            font-family: 'Inter', sans-serif;
            font-size: 0.8125rem;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            white-space: nowrap;
        }

        .admin-btn:hover {
            background: rgba(255, 255, 255, 0.08);
            transform: translateY(-1px);
        }

        .admin-btn--analytics { color: #4D96FF; border-color: rgba(77, 150, 255, 0.35); background: rgba(77, 150, 255, 0.08); }
        .admin-btn--analytics:hover { background: rgba(77, 150, 255, 0.16); border-color: #4D96FF; }
        .admin-btn--history { color: #FF6BD6; border-color: rgba(255, 107, 214, 0.35); background: rgba(255, 107, 214, 0.08); }
        .admin-btn--history:hover { background: rgba(255, 107, 214, 0.16); border-color: #FF6BD6; }
        .admin-btn--price { color: #6BCB77; border-color: rgba(107, 203, 119, 0.35); background: rgba(107, 203, 119, 0.08); }
        .admin-btn--price:hover { background: rgba(107, 203, 119, 0.16); border-color: #6BCB77; }
        .admin-btn--dev { color: #5AF0DC; border-color: rgba(90, 240, 220, 0.35); background: rgba(90, 240, 220, 0.08); }
        .admin-btn--dev:hover { background: rgba(90, 240, 220, 0.16); border-color: #5AF0DC; }
        .admin-btn--offer { color: #FFD93D; border-color: rgba(255, 217, 61, 0.35); background: rgba(255, 217, 61, 0.08); }
        .admin-btn--offer:hover { background: rgba(255, 217, 61, 0.16); border-color: #FFD93D; }
        .admin-btn--pin { color: #5AF0DC; border-color: rgba(90, 240, 220, 0.35); background: rgba(90, 240, 220, 0.08); }
        .admin-btn--pin:hover { background: rgba(90, 240, 220, 0.16); border-color: #5AF0DC; }
        .admin-btn--logout { color: #FF6B6B; border-color: rgba(255, 107, 107, 0.35); background: rgba(255, 107, 107, 0.08); }
        .admin-btn--logout:hover { background: rgba(255, 107, 107, 0.16); border-color: #FF6B6B; }

        .admin-btn--bell { color: #94A3B8; position: relative; }
        .admin-btn--bell.has-unread {
            color: #FF6B6B;
            border-color: rgba(255, 107, 107, 0.45);
            background: rgba(255, 107, 107, 0.10);
        }

        .admin-badge-count {
            background: linear-gradient(135deg, #FF6B6B, #FF6BD6);
            color: #FFFFFF;
            border-radius: 999px;
            padding: 2px 8px;
            font-size: 0.6875rem;
            font-weight: 700;
            min-width: 20px;
            text-align: center;
            margin-left: 4px;
        }

        .admin-notif-wrap { position: relative; }

        .admin-notif-dropdown {
            position: absolute;
            top: 52px;
            right: 0;
            background: #0F1730;
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 16px;
            width: 400px;
            max-height: 500px;
            overflow-y: auto;
            z-index: 9999;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
            overflow-x: hidden;
        }

        .admin-notif-dropdown::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
            background-size: 200% 100%;
            animation: adminRainbowFlow 8s ease-in-out infinite;
            z-index: 4;
        }

        .admin-notif-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 16px 20px 14px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
            position: sticky;
            top: 3px;
            background: #0F1730;
            margin-top: 3px;
            z-index: 3;
        }

        .admin-notif-header h3 {
            color: #F1F5F9;
            margin: 0;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.9375rem;
            font-weight: 700;
        }

        .admin-notif-actions { display: flex; gap: 8px; }

        .admin-notif-action-btn {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 4px 8px;
            border-radius: 6px;
            transition: background 0.15s ease;
            font-family: 'Inter', sans-serif;
        }

        .admin-notif-action-btn--mark { color: #4D96FF; }
        .admin-notif-action-btn--mark:hover { background: rgba(77, 150, 255, 0.12); }
        .admin-notif-action-btn--clear { color: #FF6B6B; }
        .admin-notif-action-btn--clear:hover { background: rgba(255, 107, 107, 0.12); }

        .admin-notif-item {
            padding: 14px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            cursor: pointer;
            display: flex;
            gap: 12px;
            transition: background 0.15s ease;
        }

        .admin-notif-item:hover { background: rgba(255, 255, 255, 0.03); }

        .admin-notif-item.unread {
            background: linear-gradient(90deg, rgba(99, 102, 241, 0.08), transparent);
            border-left: 3px solid #4D96FF;
        }

        .admin-notif-item.read { opacity: 0.6; }

        .admin-notif-icon { font-size: 1.35rem; flex-shrink: 0; }

        .admin-notif-content { flex: 1; min-width: 0; }

        .admin-notif-title {
            color: #FFD93D;
            font-size: 0.8125rem;
            font-weight: 600;
            margin: 0 0 4px 0;
        }

        .admin-notif-message {
            color: #F1F5F9;
            font-size: 0.8125rem;
            margin: 0 0 6px 0;
            line-height: 1.4;
        }

        .admin-notif-time {
            color: #64748B;
            font-size: 0.6875rem;
            margin: 0;
        }

        .admin-notif-empty {
            padding: 44px 20px;
            text-align: center;
            color: #64748B;
        }

        .admin-notif-empty span {
            font-size: 2.5rem;
            display: block;
            margin-bottom: 10px;
            opacity: 0.5;
        }

        .admin-notif-empty p { font-size: 0.8125rem; margin: 4px 0; }

        .admin-analytics {
            background: linear-gradient(155deg, rgba(15, 23, 48, 0.85), rgba(10, 16, 36, 0.9));
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.10);
            padding: 28px;
            margin-bottom: 32px;
            position: relative;
            overflow: hidden;
        }

        .admin-analytics::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #4D96FF, #8C7AFF, #FF6BD6);
            background-size: 200% 100%;
            animation: adminRainbowFlow 8s ease-in-out infinite;
        }

        .admin-analytics h2 {
            font-family: 'Space Grotesk', sans-serif;
            color: #4D96FF;
            margin: 0 0 22px 0;
            font-size: 1.375rem;
            font-weight: 700;
            letter-spacing: -0.02em;
        }

        .admin-analytics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 24px;
        }

        .admin-analytics h3 {
            color: #F1F5F9;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.9375rem;
            font-weight: 600;
            margin: 0 0 14px 0;
        }

        .admin-analytics-bar-item { margin-bottom: 10px; }

        .admin-analytics-bar-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .admin-analytics-bar-label {
            color: #94A3B8;
            font-size: 0.8125rem;
        }

        .admin-analytics-bar-value {
            color: #FFD93D;
            font-size: 0.8125rem;
            font-weight: 700;
        }

        .admin-analytics-bar-track {
            background: rgba(255, 255, 255, 0.06);
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
        }

        .admin-analytics-bar-fill {
            height: 100%;
            border-radius: 3px;
            transition: width 0.6s ease;
        }

        .admin-monthly-row {
            display: flex;
            gap: 10px;
            overflow-x: auto;
            padding-bottom: 10px;
            margin-top: 22px;
        }

        .admin-monthly-card {
            min-width: 104px;
            background: rgba(77, 150, 255, 0.06);
            border: 1px solid rgba(77, 150, 255, 0.18);
            border-radius: 12px;
            padding: 14px 12px;
            text-align: center;
            transition: transform 0.2s ease, background 0.2s ease;
        }

        .admin-monthly-card:hover {
            transform: translateY(-2px);
            background: rgba(77, 150, 255, 0.12);
        }

        .admin-monthly-month {
            color: #4D96FF;
            font-size: 0.75rem;
            margin-bottom: 6px;
            font-weight: 600;
        }

        .admin-monthly-total {
            color: #FFD93D;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.375rem;
            font-weight: 700;
        }

        .admin-monthly-meta {
            font-size: 0.6875rem;
            margin-top: 6px;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .admin-monthly-done { color: #6BCB77; }
        .admin-monthly-pending { color: #FFD93D; }

        .admin-stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 16px;
            margin-bottom: 32px;
        }

        .admin-stat-card {
            background: linear-gradient(155deg, rgba(15, 23, 48, 0.75), rgba(10, 16, 36, 0.65));
            padding: 22px 20px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            position: relative;
            overflow: hidden;
            transition: transform 0.2s ease, border-color 0.2s ease;
            isolation: isolate;
        }

        .admin-stat-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
        }

        .admin-stat-card:hover {
            transform: translateY(-3px);
            border-color: rgba(255, 255, 255, 0.14);
        }

        .admin-stat-label {
            margin: 0;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .admin-stat-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.25rem;
            font-weight: 700;
            letter-spacing: -0.03em;
            margin: 8px 0 0 0;
            line-height: 1;
        }

        .admin-stat-card.v-total::before { background: linear-gradient(90deg, #4D96FF, #8C7AFF); }
        .admin-stat-card.v-total .admin-stat-label { color: #4D96FF; }
        .admin-stat-card.v-total .admin-stat-value { color: #F1F5F9; }

        .admin-stat-card.v-pending::before { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
        .admin-stat-card.v-pending .admin-stat-label { color: #FFD93D; }
        .admin-stat-card.v-pending .admin-stat-value { color: #FFD93D; }

        .admin-stat-card.v-progress::before { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
        .admin-stat-card.v-progress .admin-stat-label { color: #4D96FF; }
        .admin-stat-card.v-progress .admin-stat-value { color: #4D96FF; }

        .admin-stat-card.v-done::before { background: linear-gradient(90deg, #6BCB77, #A3FF33); }
        .admin-stat-card.v-done .admin-stat-label { color: #6BCB77; }
        .admin-stat-card.v-done .admin-stat-value { color: #6BCB77; }

        .admin-stat-card.v-reject::before { background: linear-gradient(90deg, #FF6B6B, #FF6BD6); }
        .admin-stat-card.v-reject .admin-stat-label { color: #FF6B6B; }
        .admin-stat-card.v-reject .admin-stat-value { color: #FF6B6B; }

        .admin-stat-card.v-meetings::before { background: linear-gradient(90deg, #4D96FF, #FF6BD6); }
        .admin-stat-card.v-meetings .admin-stat-label { color: #4D96FF; }
        .admin-stat-card.v-meetings .admin-stat-value { color: #4D96FF; }

        .admin-stat-card.v-history::before { background: linear-gradient(90deg, #FF6BD6, #8C7AFF); }
        .admin-stat-card.v-history .admin-stat-label { color: #FF6BD6; }
        .admin-stat-card.v-history .admin-stat-value { color: #FF6BD6; }

        .admin-stat-card.v-prices::before { background: linear-gradient(90deg, #6BCB77, #5AF0DC); }
        .admin-stat-card.v-prices .admin-stat-label { color: #6BCB77; }
        .admin-stat-card.v-prices .admin-stat-value { color: #6BCB77; }

        .admin-panel {
            background: linear-gradient(155deg, rgba(15, 23, 48, 0.75), rgba(10, 16, 36, 0.65));
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 26px;
            margin-bottom: 28px;
            position: relative;
            overflow: hidden;
        }

        .admin-panel::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
        }

        .admin-panel.p-price::before { background: linear-gradient(90deg, #6BCB77, #5AF0DC); }
        .admin-panel.p-history::before { background: linear-gradient(90deg, #FF6BD6, #8C7AFF); }
        .admin-panel.p-meetings::before { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
        .admin-panel.p-offers::before { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
        .admin-panel.p-devs::before { background: linear-gradient(90deg, #8C7AFF, #FF6BD6); }

        .admin-panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 12px;
        }

        .admin-panel-header h2 {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
        }

        .admin-panel-header p {
            color: #94A3B8;
            font-size: 0.8125rem;
            margin: 4px 0 0 0;
        }

        .admin-panel.p-price .admin-panel-header h2 { color: #6BCB77; }
        .admin-panel.p-history .admin-panel-header h2 { color: #FF6BD6; }
        .admin-panel.p-meetings .admin-panel-header h2 { color: #4D96FF; }
        .admin-panel.p-offers .admin-panel-header h2 { color: #FFD93D; }
        .admin-panel.p-devs .admin-panel-header h2 { color: #8C7AFF; }

        .admin-panel-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            align-items: center;
        }

        .admin-mini-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 18px;
        }

        .admin-mini-card {
            background: rgba(255, 255, 255, 0.025);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 20px;
            position: relative;
            transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .admin-mini-card:hover {
            transform: translateY(-2px);
            border-color: rgba(255, 255, 255, 0.16);
        }

        .admin-mini-card.p-price:hover { border-color: rgba(107, 203, 119, 0.4); }
        .admin-mini-card.p-history:hover { border-color: rgba(255, 107, 214, 0.4); }
        .admin-mini-card.p-meetings:hover { border-color: rgba(77, 150, 255, 0.4); }
        .admin-mini-card.p-offers:hover { border-color: rgba(255, 217, 61, 0.4); }
        .admin-mini-card.p-devs:hover { border-color: rgba(140, 122, 255, 0.4); }

        .admin-pill {
            position: absolute;
            top: 12px;
            right: 12px;
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.6875rem;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .admin-pill--green { background: rgba(107, 203, 119, 0.15); color: #6BCB77; border: 1px solid rgba(107, 203, 119, 0.3); }
        .admin-pill--red { background: rgba(255, 107, 107, 0.15); color: #FF6B6B; border: 1px solid rgba(255, 107, 107, 0.3); }
        .admin-pill--yellow { background: rgba(255, 217, 61, 0.15); color: #FFD93D; border: 1px solid rgba(255, 217, 61, 0.3); }
        .admin-pill--sky { background: rgba(77, 150, 255, 0.15); color: #4D96FF; border: 1px solid rgba(77, 150, 255, 0.3); }
        .admin-pill--pink { background: rgba(255, 107, 214, 0.15); color: #FF6BD6; border: 1px solid rgba(255, 107, 214, 0.3); }
        .admin-pill--violet { background: rgba(140, 122, 255, 0.15); color: #8C7AFF; border: 1px solid rgba(140, 122, 255, 0.3); }

        .admin-mini-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .admin-mini-icon {
            width: 52px;
            height: 52px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: hidden;
        }

        .admin-mini-icon img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .admin-mini-title {
            color: #F1F5F9;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
            letter-spacing: -0.01em;
        }

        .admin-mini-sub {
            color: #94A3B8;
            font-size: 0.75rem;
            margin: 4px 0 0 0;
        }

        .admin-mini-price {
            color: #6BCB77;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.125rem;
            font-weight: 700;
        }

        .admin-mini-text {
            color: #94A3B8;
            font-size: 0.8125rem;
            line-height: 1.55;
            margin: 8px 0;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        }

        .admin-mini-footer {
            display: flex;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid rgba(255, 255, 255, 0.06);
            flex-wrap: wrap;
        }

        .admin-mini-action {
            padding: 5px 12px;
            border-radius: 8px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.08);
            color: #94A3B8;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: 500;
            transition: background 0.15s ease, transform 0.15s ease, color 0.15s ease, border-color 0.15s ease;
            font-family: 'Inter', sans-serif;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .admin-mini-action:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #F1F5F9;
            transform: translateY(-1px);
        }

        .admin-mini-action.danger { color: #FF6B6B; border-color: rgba(255, 107, 107, 0.25); }
        .admin-mini-action.danger:hover { background: rgba(255, 107, 107, 0.12); border-color: #FF6B6B; }
        .admin-mini-action.primary { color: #4D96FF; border-color: rgba(77, 150, 255, 0.25); }
        .admin-mini-action.primary:hover { background: rgba(77, 150, 255, 0.12); border-color: #4D96FF; }
        .admin-mini-action.success { color: #6BCB77; border-color: rgba(107, 203, 119, 0.25); }
        .admin-mini-action.success:hover { background: rgba(107, 203, 119, 0.12); border-color: #6BCB77; }
        .admin-mini-action.warn { color: #FFD93D; border-color: rgba(255, 217, 61, 0.25); }
        .admin-mini-action.warn:hover { background: rgba(255, 217, 61, 0.12); border-color: #FFD93D; }

        .admin-mini-footer .spacer { flex: 1; }

        .admin-empty {
            text-align: center;
            padding: 44px 20px;
            color: #64748B;
        }

        .admin-empty span {
            font-size: 3rem;
            display: block;
            margin-bottom: 12px;
            opacity: 0.55;
        }

        .admin-empty p {
            font-size: 0.875rem;
            margin: 4px 0;
        }

        .admin-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 22px;
            padding: 16px;
            background: rgba(15, 23, 48, 0.6);
            border-radius: 14px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .admin-filter-input,
        .admin-filter-select {
            padding: 11px 16px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 10px;
            color: #F1F5F9;
            font-size: 0.875rem;
            font-family: inherit;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
            cursor: pointer;
            outline: none;
        }

        .admin-filter-input { flex: 1; min-width: 200px; cursor: text; }
        .admin-filter-input::placeholder { color: #64748B; }

        .admin-filter-input:focus,
        .admin-filter-select:focus {
            border-color: #4D96FF;
            box-shadow: 0 0 0 4px rgba(77, 150, 255, 0.15);
        }

        .admin-filter-select option { background: #0F1730; color: #F1F5F9; }

        .admin-table-wrap {
            background: rgba(15, 23, 48, 0.6);
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.08);
            overflow: auto;
            position: relative;
        }

        .admin-table-wrap::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 3px;
            background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
            background-size: 200% 100%;
            animation: adminRainbowFlow 8s ease-in-out infinite;
        }

        .admin-table {
            width: 100%;
            border-collapse: collapse;
            min-width: 1000px;
        }

        .admin-table thead tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .admin-table th {
            padding: 16px 18px;
            text-align: left;
            color: #94A3B8;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
        }

        .admin-table tbody tr {
            border-bottom: 1px solid rgba(255, 255, 255, 0.04);
            transition: background 0.15s ease;
        }

        .admin-table tbody tr:hover {
            background: rgba(255, 255, 255, 0.025);
        }

        .admin-table td {
            padding: 14px 18px;
            font-size: 0.8125rem;
            color: #F1F5F9;
            vertical-align: middle;
        }

        .admin-table .cell-name {
            font-weight: 600;
            color: #F1F5F9;
            margin-bottom: 3px;
        }

        .admin-table .cell-sub {
            color: #64748B;
            font-size: 0.75rem;
        }

        .admin-status-pill {
            padding: 4px 12px;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 600;
            display: inline-block;
        }

        .admin-status-pill.st-pending { background: rgba(255, 217, 61, 0.15); color: #FFD93D; border: 1px solid rgba(255, 217, 61, 0.3); }
        .admin-status-pill.st-approved { background: rgba(107, 203, 119, 0.15); color: #6BCB77; border: 1px solid rgba(107, 203, 119, 0.3); }
        .admin-status-pill.st-progress { background: rgba(77, 150, 255, 0.15); color: #4D96FF; border: 1px solid rgba(77, 150, 255, 0.3); }
        .admin-status-pill.st-done { background: rgba(107, 203, 119, 0.18); color: #6BCB77; border: 1px solid rgba(107, 203, 119, 0.35); }
        .admin-status-pill.st-rejected { background: rgba(255, 107, 107, 0.15); color: #FF6B6B; border: 1px solid rgba(255, 107, 107, 0.3); }

        .admin-priority-pill {
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 600;
        }

        .admin-priority-pill.pr-high { background: rgba(255, 107, 107, 0.15); color: #FF6B6B; }
        .admin-priority-pill.pr-med { background: rgba(255, 217, 61, 0.15); color: #FFD93D; }
        .admin-priority-pill.pr-low { background: rgba(107, 203, 119, 0.15); color: #6BCB77; }

        .admin-dev-chips {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
        }

        .admin-dev-chip {
            display: flex;
            align-items: center;
            gap: 5px;
            background: rgba(255, 255, 255, 0.05);
            padding: 3px 10px 3px 4px;
            border-radius: 999px;
            border: 1px solid rgba(255, 217, 61, 0.18);
            font-size: 0.72rem;
            color: #F1F5F9;
        }

        .admin-dev-chip img {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            object-fit: cover;
        }

        .admin-dev-chip .chip-avatar {
            width: 22px;
            height: 22px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FF6B6B, #FFD93D);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.65rem;
            font-weight: 700;
            color: #0A1024;
        }

        .admin-no-team {
            color: #64748B;
            font-size: 0.8rem;
        }

        .admin-table-actions {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
        }

        .admin-sel {
            padding: 6px 10px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 8px;
            color: #F1F5F9;
            font-size: 0.75rem;
            cursor: pointer;
            font-family: inherit;
            outline: none;
            transition: background 0.15s ease;
        }

        .admin-sel:hover { background: rgba(255, 255, 255, 0.08); }
        .admin-sel option { background: #0F1730; color: #F1F5F9; }

        .admin-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(4, 8, 20, 0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            padding: 20px;
        }

        .admin-modal {
            background: linear-gradient(155deg, #0F1730, #0A1024);
            padding: 32px;
            border-radius: 20px;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow: auto;
            border: 1px solid rgba(255, 255, 255, 0.14);
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
            position: relative;
        }

        .admin-modal::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0;
            height: 4px;
            background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
            background-size: 200% 100%;
            animation: adminRainbowFlow 8s ease-in-out infinite;
            border-radius: 20px 20px 0 0;
        }

        .admin-modal.p-price::before { background: linear-gradient(90deg, #6BCB77, #5AF0DC); animation: none; background-size: 100%; }
        .admin-modal.p-history::before { background: linear-gradient(90deg, #FF6BD6, #8C7AFF); animation: none; background-size: 100%; }
        .admin-modal.p-meetings::before { background: linear-gradient(90deg, #4D96FF, #5AF0DC); animation: none; background-size: 100%; }
        .admin-modal.p-offers::before { background: linear-gradient(90deg, #FFD93D, #FF9F43); animation: none; background-size: 100%; }
        .admin-modal.p-devs::before { background: linear-gradient(90deg, #8C7AFF, #FF6BD6); animation: none; background-size: 100%; }
        .admin-modal.p-pin::before { background: linear-gradient(90deg, #5AF0DC, #4D96FF); animation: none; background-size: 100%; }
        .admin-modal.p-assign::before { background: linear-gradient(90deg, #FFD93D, #FF6B6B); animation: none; background-size: 100%; }
        .admin-modal.p-danger::before { background: linear-gradient(90deg, #FF6B6B, #EC4899); animation: none; background-size: 100%; }

        .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }

        .admin-modal-title {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0;
            color: #F1F5F9;
        }

        .admin-modal.p-price .admin-modal-title { color: #6BCB77; }
        .admin-modal.p-history .admin-modal-title { color: #FF6BD6; }
        .admin-modal.p-meetings .admin-modal-title { color: #4D96FF; }
        .admin-modal.p-offers .admin-modal-title { color: #FFD93D; }
        .admin-modal.p-devs .admin-modal-title { color: #8C7AFF; }
        .admin-modal.p-pin .admin-modal-title { color: #5AF0DC; }
        .admin-modal.p-assign .admin-modal-title { color: #FFD93D; }
        .admin-modal.p-danger .admin-modal-title { color: #FF6B6B; }

        .admin-modal-close {
            background: none;
            border: none;
            color: #64748B;
            font-size: 1.5rem;
            cursor: pointer;
            padding: 4px 10px;
            border-radius: 8px;
            transition: background 0.15s ease, color 0.15s ease;
            line-height: 1;
            font-family: inherit;
        }

        .admin-modal-close:hover {
            color: #F1F5F9;
            background: rgba(255, 255, 255, 0.06);
        }

        .admin-form-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
        }

        .admin-form-row-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 14px;
        }

        .admin-form-group { margin-bottom: 16px; }
        .admin-form-row .admin-form-group,
        .admin-form-row-3 .admin-form-group { margin-bottom: 0; }

        .admin-textarea {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.045);
            border: 1px solid rgba(255, 255, 255, 0.10);
            border-radius: 10px;
            color: #F1F5F9;
            font-size: 0.875rem;
            font-family: inherit;
            min-height: 90px;
            resize: vertical;
            box-sizing: border-box;
            transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .admin-textarea::placeholder { color: #64748B; }

        .admin-textarea:focus {
            outline: none;
            border-color: #4D96FF;
            box-shadow: 0 0 0 4px rgba(77, 150, 255, 0.15);
        }

        .admin-check-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 0;
        }

        .admin-check-row label {
            color: #94A3B8;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
        }

        .admin-check-row input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: #4D96FF;
            cursor: pointer;
        }

        .admin-feature-input-row {
            display: flex;
            gap: 8px;
            margin-bottom: 10px;
        }

        .admin-feature-input-row .admin-input { flex: 1; }

        .admin-feature-chip {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            background: rgba(107, 203, 119, 0.1);
            border: 1px solid rgba(107, 203, 119, 0.25);
            border-radius: 999px;
            font-size: 0.78rem;
            color: #F1F5F9;
            margin: 3px;
        }

        .admin-feature-chip button {
            background: none;
            border: none;
            color: #FF6B6B;
            cursor: pointer;
            font-size: 1rem;
            padding: 0;
            line-height: 1;
            font-family: inherit;
        }

        .admin-features-wrap {
            display: flex;
            flex-wrap: wrap;
            margin-top: 4px;
        }

        .admin-upload-preview {
            margin-top: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .admin-upload-preview img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid rgba(255, 255, 255, 0.14);
        }

        .admin-file-input {
            width: 100%;
            padding: 10px 14px;
            background: rgba(255, 217, 61, 0.05);
            border: 1px solid rgba(255, 217, 61, 0.2);
            border-radius: 10px;
            color: #FFD93D;
            cursor: pointer;
            font-size: 0.85rem;
            font-family: inherit;
        }

        .admin-file-input::-webkit-file-upload-button {
            background: rgba(255, 217, 61, 0.15);
            border: none;
            color: #FFD93D;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
            font-family: 'Inter', sans-serif;
            font-weight: 600;
        }

        .admin-upload-progress {
            color: #FFD93D;
            font-size: 0.8125rem;
            margin-top: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .admin-modal-actions {
            display: flex;
            gap: 12px;
            margin-top: 22px;
        }

        .admin-modal-submit {
            flex: 1;
            padding: 12px 20px;
            background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
            background-size: 200% 200%;
            border: none;
            border-radius: 10px;
            color: #FFFFFF;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.9375rem;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease, background-position 0.4s ease;
            box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }

        .admin-modal-submit:hover:not(:disabled) {
            transform: translateY(-2px);
            background-position: 100% 50%;
            box-shadow: 0 10px 30px rgba(139, 92, 246, 0.45);
        }

        .admin-modal-submit:disabled { opacity: 0.5; cursor: not-allowed; }

        .admin-modal-cancel {
            padding: 12px 22px;
            background: rgba(255, 255, 255, 0.04);
            border: 1px solid rgba(255, 255, 255, 0.12);
            border-radius: 10px;
            color: #94A3B8;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            font-weight: 500;
            font-size: 0.9375rem;
            transition: background 0.15s ease, color 0.15s ease;
        }

        .admin-modal-cancel:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #F1F5F9;
        }

        .admin-note {
            color: #94A3B8;
            font-size: 0.8125rem;
            background: rgba(255, 217, 61, 0.06);
            border: 1px solid rgba(255, 217, 61, 0.2);
            border-radius: 10px;
            padding: 12px 14px;
            margin-bottom: 16px;
            line-height: 1.55;
        }

        .admin-assign-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            max-height: 320px;
            overflow: auto;
            padding-right: 4px;
        }

        .admin-assign-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.15s ease, transform 0.15s ease, border-color 0.15s ease;
        }

        .admin-assign-item:hover {
            background: rgba(255, 255, 255, 0.06);
            transform: translateY(-1px);
        }

        .admin-assign-item.selected {
            background: rgba(255, 217, 61, 0.1);
            border: 2px solid #FFD93D;
        }

        .admin-assign-item img,
        .admin-assign-item .assign-avatar {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            object-fit: cover;
        }

        .admin-assign-item .assign-avatar {
            background: linear-gradient(135deg, #FF6B6B, #FFD93D);
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            color: #0A1024;
            font-size: 0.75rem;
        }

        .admin-assign-item .assign-info { flex: 1; min-width: 0; }
        .admin-assign-item .assign-name { color: #F1F5F9; font-size: 0.85rem; font-weight: 600; }
        .admin-assign-item .assign-role { color: #64748B; font-size: 0.7rem; }
        .admin-assign-item .assign-check { color: #FFD93D; font-size: 1.15rem; }

        .admin-btn-delete {
            flex: 1;
            padding: 12px 20px;
            background: linear-gradient(135deg, #FF6B6B, #EC4899);
            border: none;
            border-radius: 10px;
            color: #FFFFFF;
            font-family: 'Space Grotesk', sans-serif;
            font-weight: 700;
            font-size: 0.9375rem;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.35);
        }

        .admin-btn-delete:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(255, 107, 107, 0.5);
        }

        .admin-detail-row { margin-bottom: 16px; }

        .admin-detail-label {
            color: #FFD93D;
            font-size: 0.75rem;
            font-weight: 600;
            display: block;
            margin-bottom: 6px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
        }

        .admin-detail-value {
            color: #F1F5F9;
            margin: 0;
            font-size: 0.9rem;
            line-height: 1.5;
        }

        .admin-detail-box {
            color: #94A3B8;
            margin: 0;
            line-height: 1.6;
            background: rgba(255, 255, 255, 0.03);
            padding: 14px;
            border-radius: 10px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .admin-section-title {
            font-family: 'Space Grotesk', sans-serif;
            color: #F1F5F9;
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin: 0 0 16px 0;
        }

        .admin-pin-display {
            background: rgba(90, 240, 220, 0.06);
            border: 1px solid rgba(90, 240, 220, 0.2);
            border-radius: 12px;
            padding: 18px;
            text-align: center;
            margin-bottom: 20px;
        }

        .admin-pin-display-label {
            color: #94A3B8;
            font-size: 0.75rem;
            font-weight: 600;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .admin-pin-display-value {
            font-family: 'Space Grotesk', sans-serif;
            font-size: 2.5rem;
            font-weight: 700;
            letter-spacing: 0.3em;
            color: #5AF0DC;
            text-shadow: 0 0 20px rgba(90, 240, 220, 0.4);
        }

        .admin-pin-hint {
            color: #64748B;
            font-size: 0.75rem;
            margin-top: 8px;
        }

        .admin-pin-input {
            text-align: center;
            letter-spacing: 0.5em;
            font-family: 'Space Grotesk', sans-serif;
            font-size: 1.5rem;
            font-weight: 700;
            padding: 16px;
        }

        @media (max-width: 1024px) {
            .admin-page { padding: 90px 20px 40px; }
            .admin-header-left h1 { font-size: 2rem; }
            .admin-stats-grid { grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
            .admin-mini-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        }

        @media (max-width: 768px) {
            .admin-page { padding: 80px 16px 30px; margin-top: 70px; }
            .admin-header { flex-direction: column; align-items: stretch; }
            .admin-header-left h1 { font-size: 1.75rem; }
            .admin-header-actions { justify-content: flex-start; }
            .admin-btn { padding: 9px 14px; font-size: 0.75rem; }
            .admin-stats-grid { grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; }
            .admin-stat-card { padding: 18px 14px; }
            .admin-stat-value { font-size: 1.75rem; }
            .admin-mini-grid { grid-template-columns: 1fr; }
            .admin-modal { padding: 26px 22px; border-radius: 18px; }
            .admin-form-row, .admin-form-row-3 { grid-template-columns: 1fr; }
            .admin-notif-dropdown { width: 340px; right: -20px; }
            .admin-login-card { padding: 36px 26px; }
            .admin-analytics { padding: 22px 18px; }
        }

        @media (max-width: 480px) {
            .admin-page { padding: 76px 12px 24px; }
            .admin-header-left h1 { font-size: 1.5rem; }
            .admin-stats-grid { grid-template-columns: 1fr 1fr; }
            .admin-stat-value { font-size: 1.5rem; }
            .admin-panel, .admin-analytics { padding: 20px 16px; border-radius: 16px; }
            .admin-notif-dropdown { width: 300px; right: -30px; }
            .admin-mini-card { padding: 16px; }
            .admin-modal { padding: 22px 18px; }
            .admin-assign-grid { grid-template-columns: 1fr; }
        }
    `;

    // ============ LOGIN SCREEN ============
    if (!isAuthenticated) {
        return (
            <>
                <style>{sharedStyles}</style>
                <div className="admin-login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px 20px' }}>
                    <div className="admin-login-card">
                        <span className="admin-login-icon">👑</span>
                        <h1 className="admin-login-title">Admin Login</h1>
                        <p className="admin-login-subtitle">Enter your credentials to access the admin panel</p>

                        {loginError && <div className="admin-error">{loginError}</div>}

                        <form onSubmit={handleAdminLogin}>
                            <div className="admin-form-group">
                                <label className="admin-label">📧 Email Address</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="loki@gmail.com"
                                />
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">🔒 Password</label>
                                <input
                                    type="password"
                                    className="admin-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Enter admin password"
                                    disabled={isLoadingPassword}
                                />
                                {isLoadingPassword && (
                                    <p style={{ color: '#94A3B8', fontSize: '0.75rem', marginTop: '6px' }}>
                                        ⏳ Loading admin settings...
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="admin-login-btn"
                                disabled={isLoading || isLoadingPassword}
                            >
                                {isLoading ? '⏳ Logging in...' : '🔑 Login'}
                            </button>
                        </form>

                        <div className="admin-login-footer">
                            <p>🔐 Admin access only</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // ============ DASHBOARD ============
    return (
        <>
            <style>{sharedStyles}</style>
            <div className="admin-page">

                {/* HEADER */}
                <div className="admin-header">
                    <div className="admin-header-left">
                        <h1>👑 Admin Dashboard</h1>
                        <p>Welcome back, {adminUser?.email}!</p>
                    </div>

                    <div className="admin-header-actions">
                        <div ref={notificationRef} className="admin-notif-wrap">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`admin-btn admin-btn--bell ${unreadCount > 0 ? 'has-unread' : ''}`}
                            >
                                🔔 Notifications
                                {unreadCount > 0 && (
                                    <span className="admin-badge-count">{unreadCount > 9 ? '9+' : unreadCount}</span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="admin-notif-dropdown">
                                    <div className="admin-notif-header">
                                        <h3>📬 Notifications</h3>
                                        {notifications.length > 0 && (
                                            <div className="admin-notif-actions">
                                                <button className="admin-notif-action-btn admin-notif-action-btn--mark" onClick={markAllAsRead}>Mark all read</button>
                                                <button className="admin-notif-action-btn admin-notif-action-btn--clear" onClick={clearAllNotifications}>Clear all</button>
                                            </div>
                                        )}
                                    </div>

                                    {notifications.length === 0 ? (
                                        <div className="admin-notif-empty">
                                            <span>🔕</span>
                                            <p>No notifications yet</p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => handleNotificationClick(notification)}
                                                className={`admin-notif-item ${notification.read ? 'read' : 'unread'}`}
                                            >
                                                <span className="admin-notif-icon">{getNotificationIcon(notification.type)}</span>
                                                <div className="admin-notif-content">
                                                    <p className="admin-notif-title">{notification.title}</p>
                                                    <p className="admin-notif-message">{notification.message}</p>
                                                    <p className="admin-notif-time">{formatNotificationTime(notification.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="admin-btn admin-btn--analytics" onClick={() => setShowAnalytics(!showAnalytics)}>
                            📊 {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
                        </button>
                        <button className="admin-btn admin-btn--history" onClick={openAddHistory}>📜 Add History</button>
                        <button className="admin-btn admin-btn--price" onClick={openAddPrice}>💰 Add Price</button>
                        <button className="admin-btn admin-btn--dev" onClick={openAddDeveloper}>👨‍💻 Add Developer</button>
                        <button className="admin-btn admin-btn--offer" onClick={openAddOffer}>🎯 Add Offer</button>
                        <button className="admin-btn admin-btn--pin" onClick={() => setShowPinModal(true)}>🔢 Pricelist PIN</button>
                        <button className="admin-btn admin-btn--logout" onClick={handleAdminLogout}>🚪 Logout</button>
                    </div>
                </div>

                {/* ANALYTICS PANEL */}
                {showAnalytics && (
                    <div className="admin-analytics">
                        <h2>📊 Analytics Overview</h2>
                        <div className="admin-analytics-grid">
                            <div>
                                <h3>🎯 Service Distribution</h3>
                                {serviceData.length === 0 ? <p style={{ color: '#64748B' }}>No data yet</p> : (
                                    serviceData.map((item) => (
                                        <div key={item.name} className="admin-analytics-bar-item">
                                            <div className="admin-analytics-bar-header">
                                                <span className="admin-analytics-bar-label">{serviceTypes[item.name] || item.name}</span>
                                                <span className="admin-analytics-bar-value">{item.value}</span>
                                            </div>
                                            <div className="admin-analytics-bar-track">
                                                <div className="admin-analytics-bar-fill" style={{
                                                    width: `${(item.value / (stats.total || 1)) * 100}%`,
                                                    background: 'linear-gradient(90deg, #FF6B6B, #FFD93D)'
                                                }} />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div>
                                <h3>⚡ Priority Distribution</h3>
                                {priorityData.map((item) => (
                                    <div key={item.name} className="admin-analytics-bar-item">
                                        <div className="admin-analytics-bar-header">
                                            <span className="admin-analytics-bar-label">{getPriorityBadge(item.name).label}</span>
                                            <span className="admin-analytics-bar-value">{item.value}</span>
                                        </div>
                                        <div className="admin-analytics-bar-track">
                                            <div className="admin-analytics-bar-fill" style={{
                                                width: `${(item.value / (stats.total || 1)) * 100}%`,
                                                background: 'linear-gradient(90deg, #6BCB77, #4D96FF)'
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <h3>📈 Status Distribution</h3>
                                {statusData.map((item) => (
                                    <div key={item.name} className="admin-analytics-bar-item">
                                        <div className="admin-analytics-bar-header">
                                            <span className="admin-analytics-bar-label">{getStatusBadge(item.name).label}</span>
                                            <span className="admin-analytics-bar-value">{item.value}</span>
                                        </div>
                                        <div className="admin-analytics-bar-track">
                                            <div className="admin-analytics-bar-fill" style={{
                                                width: `${(item.value / (stats.total || 1)) * 100}%`,
                                                background: `linear-gradient(90deg, ${statusColors[item.name] || '#FF6B6B'}, #FFD93D)`
                                            }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {monthlyData.length > 0 && (
                            <>
                                <h3 style={{ color: '#F1F5F9', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.9375rem', marginTop: '24px', marginBottom: '12px' }}>📅 Monthly Trend</h3>
                                <div className="admin-monthly-row">
                                    {monthlyData.map((m) => (
                                        <div key={m.month} className="admin-monthly-card">
                                            <div className="admin-monthly-month">{m.month}</div>
                                            <div className="admin-monthly-total">{m.total}</div>
                                            <div className="admin-monthly-meta">
                                                <span className="admin-monthly-done">✅ {m.completed}</span>
                                                <span className="admin-monthly-pending">⏳ {m.pending}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* STATS CARDS */}
                <div className="admin-stats-grid">
                    <div className="admin-stat-card v-total">
                        <p className="admin-stat-label">📊 Total</p>
                        <h2 className="admin-stat-value">{stats.total}</h2>
                    </div>
                    <div className="admin-stat-card v-pending">
                        <p className="admin-stat-label">⏳ Pending</p>
                        <h2 className="admin-stat-value">{stats.pending}</h2>
                    </div>
                    <div className="admin-stat-card v-progress">
                        <p className="admin-stat-label">🔄 In Progress</p>
                        <h2 className="admin-stat-value">{stats.inProgress}</h2>
                    </div>
                    <div className="admin-stat-card v-done">
                        <p className="admin-stat-label">✅ Completed</p>
                        <h2 className="admin-stat-value">{stats.completed}</h2>
                    </div>
                    <div className="admin-stat-card v-reject">
                        <p className="admin-stat-label">❌ Rejected</p>
                        <h2 className="admin-stat-value">{stats.rejected}</h2>
                    </div>
                    <div className="admin-stat-card v-meetings">
                        <p className="admin-stat-label">📅 Meetings</p>
                        <h2 className="admin-stat-value">{meetings.filter(m => m.status === 'pending').length}</h2>
                    </div>
                    <div className="admin-stat-card v-history">
                        <p className="admin-stat-label">📜 History</p>
                        <h2 className="admin-stat-value">{historyItems.length}</h2>
                    </div>
                    <div className="admin-stat-card v-prices">
                        <p className="admin-stat-label">💰 Prices</p>
                        <h2 className="admin-stat-value">{prices.length}</h2>
                    </div>
                </div>

                {/* PRICE MANAGEMENT */}
                <div className="admin-panel p-price">
                    <div className="admin-panel-header">
                        <div>
                            <h2>💰 Price Management</h2>
                            <p>{prices.filter(p => p.active !== false).length} active • {prices.length} total • Shows on Pricelist page</p>
                        </div>
                        <div className="admin-panel-actions">
                            <button className="admin-btn" onClick={() => setShowPriceSection(!showPriceSection)}>
                                {showPriceSection ? '🙈 Hide' : '👁️ Show'}
                            </button>
                            <button className="admin-btn admin-btn--price" onClick={openAddPrice}>➕ Add Price</button>
                        </div>
                    </div>

                    {showPriceSection && (
                        prices.length === 0 ? (
                            <div className="admin-empty">
                                <span>💰</span>
                                <p>No prices added yet. Click "Add Price" to create your first price.</p>
                            </div>
                        ) : (
                            <div className="admin-mini-grid">
                                {prices.map((price) => (
                                    <div key={price.id} className="admin-mini-card p-price">
                                        <div className="admin-pill admin-pill--green">{serviceTypes[price.category] || price.category}</div>
                                        {price.popular && <div className="admin-pill admin-pill--yellow" style={{ top: '42px' }}>🔥 Popular</div>}

                                        <div className="admin-mini-header">
                                            <div className="admin-mini-icon">{price.icon || '💎'}</div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <h3 className="admin-mini-title">{price.title}</h3>
                                                <p className="admin-mini-price">{price.price} {price.priceUnit}</p>
                                            </div>
                                        </div>

                                        <p className="admin-mini-text">{price.description}</p>

                                        <div className="admin-mini-footer">
                                            <button className="admin-mini-action danger" onClick={() => togglePriceStatus(price.id, price.active !== false)}>
                                                {price.active !== false ? '🔴 Deactivate' : '🟢 Activate'}
                                            </button>
                                            <button className="admin-mini-action primary" onClick={() => openEditPrice(price)}>✏️ Edit</button>
                                            <div className="spacer" />
                                            <button className="admin-mini-action danger" onClick={() => deletePrice(price.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* HISTORY MANAGEMENT */}
                <div className="admin-panel p-history">
                    <div className="admin-panel-header">
                        <div>
                            <h2>📜 History / Journey</h2>
                            <p>{historyItems.length} item{historyItems.length !== 1 ? 's' : ''} • Shows on the History page</p>
                        </div>
                        <div className="admin-panel-actions">
                            <button className="admin-btn" onClick={() => setShowHistorySection(!showHistorySection)}>
                                {showHistorySection ? '🙈 Hide' : '👁️ Show'}
                            </button>
                            <button className="admin-btn admin-btn--history" onClick={openAddHistory}>➕ Add History Item</button>
                        </div>
                    </div>

                    {showHistorySection && (
                        historyItems.length === 0 ? (
                            <div className="admin-empty">
                                <span>📜</span>
                                <p>No history items yet.</p>
                            </div>
                        ) : (
                            <div className="admin-mini-grid">
                                {historyItems.map((item) => (
                                    <div key={item.id} className="admin-mini-card p-history">
                                        <div className="admin-pill admin-pill--pink">{item.year}</div>

                                        <div className="admin-mini-header">
                                            <div className="admin-mini-icon" style={{ borderRadius: '50%' }}>
                                                {item.imageUrl ? (
                                                    <img src={item.imageUrl} alt={item.title} style={{ borderRadius: '50%' }} />
                                                ) : (
                                                    <span>{item.icon || '🚀'}</span>
                                                )}
                                            </div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <h3 className="admin-mini-title">{item.title}</h3>
                                                <p className="admin-mini-sub">Effect: {item.effect}</p>
                                            </div>
                                        </div>

                                        <p className="admin-mini-text">{item.description}</p>

                                        <div className="admin-mini-footer">
                                            <button className="admin-mini-action primary" onClick={() => openEditHistory(item)}>✏️ Edit</button>
                                            <div className="spacer" />
                                            <button className="admin-mini-action danger" onClick={() => deleteHistory(item.id)}>🗑️ Delete</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* MEETINGS */}
                <div id="meetings-section" className="admin-panel p-meetings">
                    <div className="admin-panel-header">
                        <div>
                            <h2>📅 Meeting Requests</h2>
                            <p>{meetings.filter(m => m.status === 'pending').length} pending • {meetings.length} total</p>
                        </div>
                        <div className="admin-panel-actions">
                            <button className="admin-btn" onClick={() => setShowMeetings(!showMeetings)}>
                                {showMeetings ? '🙈 Hide' : '👁️ Show'}
                            </button>
                            <select className="admin-filter-select" value={filterMeetingStatus} onChange={(e) => setFilterMeetingStatus(e.target.value)}>
                                <option value="all">📋 All Status</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="confirmed">✅ Confirmed</option>
                                <option value="completed">🎉 Completed</option>
                                <option value="cancelled">❌ Cancelled</option>
                            </select>
                        </div>
                    </div>

                    {showMeetings && (
                        meetings.length === 0 ? (
                            <div className="admin-empty">
                                <span>📅</span>
                                <p>No meeting requests yet.</p>
                            </div>
                        ) : (
                            <div className="admin-mini-grid">
                                {meetings.filter(m => filterMeetingStatus === 'all' || m.status === filterMeetingStatus).map((meeting) => {
                                    const statusInfo = getMeetingStatusBadge(meeting.status);
                                    return (
                                        <div key={meeting.id} className="admin-mini-card p-meetings">
                                            <div className="admin-pill" style={{ background: statusInfo.bg, color: statusInfo.color, border: `1px solid ${statusInfo.color}40` }}>
                                                {statusInfo.label}
                                            </div>

                                            <div className="admin-mini-header">
                                                <div className="admin-mini-icon" style={{ background: 'linear-gradient(135deg, #4D96FF, #FF6BD6)', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, borderRadius: '50%' }}>
                                                    {meeting.name?.charAt(0) || '?'}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <h3 className="admin-mini-title">{meeting.name}</h3>
                                                    <p className="admin-mini-sub">{meeting.email}</p>
                                                </div>
                                            </div>

                                            <div style={{ background: 'rgba(77, 150, 255, 0.06)', border: '1px solid rgba(77, 150, 255, 0.15)', borderRadius: '10px', padding: '12px', margin: '10px 0' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span>📅</span>
                                                    <span style={{ color: '#4D96FF', fontSize: '0.85rem', fontWeight: 600 }}>{meeting.meetingDate}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>⏰</span>
                                                    <span style={{ color: '#FFD93D', fontSize: '0.85rem', fontWeight: 600 }}>{meeting.meetingTime}</span>
                                                </div>
                                            </div>

                                            {meeting.subject && <div style={{ color: '#FFD93D', fontSize: '0.85rem', fontWeight: 500, marginBottom: '8px' }}>📌 {meeting.subject}</div>}

                                            <div className="admin-mini-footer">
                                                {meeting.status === 'pending' && (
                                                    <>
                                                        <button className="admin-mini-action success" onClick={() => handleMeetingStatusChange(meeting.id, 'confirmed')}>✅ Confirm</button>
                                                        <button className="admin-mini-action danger" onClick={() => handleMeetingStatusChange(meeting.id, 'cancelled')}>❌ Cancel</button>
                                                    </>
                                                )}
                                                <button className="admin-mini-action warn" onClick={() => openMeetingDetail(meeting)}>👁️ View</button>
                                                <div className="spacer" />
                                                <button className="admin-mini-action danger" onClick={() => deleteMeeting(meeting.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    )}
                </div>

                {/* OFFERS */}
                <div className="admin-panel p-offers">
                    <div className="admin-panel-header">
                        <div>
                            <h2>🎯 Offers Management</h2>
                            <p>{offers.filter(o => o.active).length} active • {offers.length} total</p>
                        </div>
                        <div className="admin-panel-actions">
                            <button className="admin-btn" onClick={() => setShowOffers(!showOffers)}>
                                {showOffers ? '🙈 Hide' : '👁️ Show'}
                            </button>
                            <button className="admin-btn admin-btn--offer" onClick={openAddOffer}>➕ Add New Offer</button>
                        </div>
                    </div>

                    {showOffers && (
                        offers.length === 0 ? (
                            <div className="admin-empty">
                                <span>🎯</span>
                                <p>No offers added yet.</p>
                            </div>
                        ) : (
                            <div className="admin-mini-grid">
                                {offers.map((offer) => (
                                    <div key={offer.id} className="admin-mini-card p-offers">
                                        <div className={`admin-pill ${offer.active ? 'admin-pill--green' : 'admin-pill--red'}`}>
                                            {offer.active ? 'Active' : 'Inactive'}
                                        </div>

                                        <div className="admin-mini-header">
                                            <div className="admin-mini-icon" style={{ fontSize: '1.75rem' }}>{offer.icon || '🎉'}</div>
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <h3 className="admin-mini-title">{offer.title}</h3>
                                                {offer.discount && <p className="admin-mini-sub" style={{ color: '#FFD93D', fontWeight: 700 }}>{offer.discount}</p>}
                                            </div>
                                        </div>

                                        <p className="admin-mini-text">{offer.description}</p>

                                        <div className="admin-mini-footer">
                                            <button className={`admin-mini-action ${offer.active ? 'danger' : 'success'}`} onClick={() => toggleOfferStatus(offer.id, offer.active)}>
                                                {offer.active ? '🔴 Deactivate' : '🟢 Activate'}
                                            </button>
                                            <button className="admin-mini-action primary" onClick={() => openEditOffer(offer)}>✏️ Edit</button>
                                            <div className="spacer" />
                                            <button className="admin-mini-action danger" onClick={() => deleteOffer(offer.id)}>🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* DEVELOPERS */}
                <div className="admin-panel p-devs">
                    <div className="admin-panel-header">
                        <div>
                            <h2>👨‍💻 Developer Team</h2>
                            <p>{activeDeveloperCount} active • {developers.length} total</p>
                        </div>
                        <div className="admin-panel-actions">
                            <button className="admin-btn" onClick={() => setShowDevelopers(!showDevelopers)}>
                                {showDevelopers ? '🙈 Hide' : '👁️ Show'}
                            </button>
                            <button className="admin-btn" onClick={() => setShowOnlyActive(!showOnlyActive)}>
                                {showOnlyActive ? '🟢 Active Only' : '📋 All'}
                            </button>
                            <button className="admin-btn admin-btn--dev" onClick={openAddDeveloper}>➕ Add Developer</button>
                        </div>
                    </div>

                    {showDevelopers ? (
                        filteredDevelopers.length === 0 ? (
                            <div className="admin-empty">
                                <span>👨‍💻</span>
                                <p>No developers {showOnlyActive ? 'currently active' : 'added yet'}.</p>
                            </div>
                        ) : (
                            <div className="admin-mini-grid">
                                {filteredDevelopers.map((dev) => {
                                    const status = getDeveloperStatus(dev.email);
                                    const isActive = status.isActive;
                                    return (
                                        <div key={dev.id} className="admin-mini-card p-devs">
                                            <div className={`admin-pill ${isActive ? 'admin-pill--green' : 'admin-pill--red'}`}>
                                                {isActive ? '🟢 Active' : '⚪ Inactive'}
                                            </div>

                                            <div className="admin-mini-header">
                                                <div className="admin-mini-icon" style={{ borderRadius: '50%' }}>
                                                    {dev.photo ? (
                                                        <img src={dev.photo} alt={dev.name} style={{ borderRadius: '50%' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #8C7AFF, #FF6BD6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: '1.25rem' }}>
                                                            {dev.name?.charAt(0) || 'D'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ minWidth: 0, flex: 1 }}>
                                                    <h3 className="admin-mini-title">{dev.name}</h3>
                                                    <p className="admin-mini-sub" style={{ color: '#8C7AFF' }}>{dev.role}</p>
                                                </div>
                                            </div>

                                            {dev.email && (
                                                <p className="admin-mini-sub" style={{ marginBottom: '8px' }}>📧 {dev.email}</p>
                                            )}

                                            <div className="admin-mini-footer">
                                                {dev.github && <a href={dev.github} target="_blank" rel="noopener noreferrer" className="admin-mini-action">🐙 GitHub</a>}
                                                {dev.linkedin && <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="admin-mini-action">🔗 LinkedIn</a>}
                                                <div className="spacer" />
                                                <button className="admin-mini-action primary" onClick={() => openEditDeveloper(dev)}>✏️</button>
                                                <button className="admin-mini-action danger" onClick={() => deleteDeveloper(dev.id)}>🗑️</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        <div className="admin-empty">
                            <span>🙈</span>
                            <p>Developers are hidden.</p>
                        </div>
                    )}
                </div>

                {/* CLIENT REQUESTS */}
                <div id="requests-section" style={{ marginBottom: '18px' }}>
                    <h2 className="admin-section-title">📋 Client Service Requests</h2>
                </div>

                <div className="admin-filters">
                    <input type="text" className="admin-filter-input" placeholder="🔍 Search requests..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    <select className="admin-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">📋 All Status</option>
                        <option value="pending">⏳ Pending</option>
                        <option value="approved">✅ Approved</option>
                        <option value="in-progress">🔄 In Progress</option>
                        <option value="completed">🎉 Completed</option>
                        <option value="rejected">❌ Rejected</option>
                    </select>
                </div>

                {loading ? (
                    <div className="admin-empty">⏳ Loading requests...</div>
                ) : filteredRequests.length === 0 ? (
                    <div className="admin-empty"><span>📭</span><p>No requests found</p></div>
                ) : (
                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Client</th>
                                    <th>Service</th>
                                    <th>Priority</th>
                                    <th>Status</th>
                                    <th>Assigned Team</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRequests.map((request) => {
                                    const assignedDevs = request.assignedDevelopers || [];
                                    const statusInfo = getStatusBadge(request.status);
                                    const statusClass = request.status === 'pending' ? 'st-pending'
                                        : request.status === 'approved' ? 'st-approved'
                                        : request.status === 'in-progress' ? 'st-progress'
                                        : request.status === 'completed' ? 'st-done'
                                        : 'st-rejected';

                                    const priorityInfo = getPriorityBadge(request.priority);
                                    const priorityClass = request.priority === 'High' ? 'pr-high'
                                        : request.priority === 'Low' ? 'pr-low' : 'pr-med';

                                    return (
                                        <tr key={request.id}>
                                            <td>
                                                <div className="cell-name">{request.clientName || 'N/A'}</div>
                                                <div className="cell-sub">{request.email || ''}</div>
                                            </td>
                                            <td>
                                                <div>{serviceTypes[request.serviceType] || request.serviceType}</div>
                                                <div className="cell-sub">{request.scheduleDate || 'No date'}</div>
                                            </td>
                                            <td>
                                                <span className={`admin-priority-pill ${priorityClass}`}>{priorityInfo.label}</span>
                                            </td>
                                            <td>
                                                <span className={`admin-status-pill ${statusClass}`}>{statusInfo.label}</span>
                                            </td>
                                            <td>
                                                {assignedDevs.length > 0 ? (
                                                    <div className="admin-dev-chips">
                                                        {assignedDevs.map((dev) => (
                                                            <div key={dev.id} className="admin-dev-chip">
                                                                {dev.photo ? (
                                                                    <img src={dev.photo} alt={dev.name} />
                                                                ) : (
                                                                    <div className="chip-avatar">{dev.name?.charAt(0) || 'D'}</div>
                                                                )}
                                                                <span>{dev.name}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="admin-no-team">No team assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="admin-table-actions">
                                                    <select className="admin-sel" value={request.status} onChange={(e) => handleStatusChange(request.id, e.target.value)}>
                                                        <option value="pending">⏳ Pending</option>
                                                        <option value="approved">✅ Approve</option>
                                                        <option value="in-progress">🔄 In Progress</option>
                                                        <option value="completed">🎉 Complete</option>
                                                        <option value="rejected">❌ Reject</option>
                                                    </select>
                                                    <button className="admin-mini-action primary" onClick={() => handleEdit(request)}>✏️ Edit</button>
                                                    <button className="admin-mini-action warn" onClick={() => openAssignModal(request)}>👨‍💻 Assign</button>
                                                    {assignedDevs.length > 0 && (
                                                        <button className="admin-mini-action danger" onClick={() => openRemoveDeveloperModal(request)}>❌ Remove</button>
                                                    )}
                                                    <button className="admin-mini-action danger" onClick={() => handleDelete(request.id)}>🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PRICE MODAL */}
                {showPriceModal && (
                    <div className="admin-modal-overlay" onClick={() => { setShowPriceModal(false); setEditingPrice(null); }}>
                        <div className="admin-modal p-price" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">{editingPrice ? '✏️ Edit Price' : '💰 Add New Price'}</h2>
                                <button className="admin-modal-close" onClick={() => { setShowPriceModal(false); setEditingPrice(null); }}>✕</button>
                            </div>
                            <form onSubmit={savePrice}>
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Title *</label>
                                        <input className="admin-input" type="text" name="title" value={priceFormData.title} onChange={handlePriceChange} required placeholder="e.g., Basic Website" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Category *</label>
                                        <select className="admin-input" name="category" value={priceFormData.category} onChange={handlePriceChange} style={{ cursor: 'pointer' }}>
                                            {Object.entries(serviceTypes).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Price *</label>
                                        <input className="admin-input" type="text" name="price" value={priceFormData.price} onChange={handlePriceChange} required placeholder="e.g., $299" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Price Unit (optional)</label>
                                        <input className="admin-input" type="text" name="priceUnit" value={priceFormData.priceUnit} onChange={handlePriceChange} placeholder="e.g., /project" />
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Description *</label>
                                    <textarea className="admin-textarea" name="description" value={priceFormData.description} onChange={handlePriceChange} required placeholder="Describe what's included..." />
                                </div>

                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Icon (Emoji)</label>
                                        <input className="admin-input" type="text" name="icon" value={priceFormData.icon} onChange={handlePriceChange} placeholder="💎" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Delivery Time</label>
                                        <input className="admin-input" type="text" name="deliveryTime" value={priceFormData.deliveryTime} onChange={handlePriceChange} placeholder="e.g., 2-3 weeks" />
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Features</label>
                                    <div className="admin-feature-input-row">
                                        <input className="admin-input" type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} placeholder="e.g., Responsive Design" />
                                        <button type="button" className="admin-mini-action success" onClick={addFeature} style={{ padding: '10px 20px' }}>➕ Add</button>
                                    </div>
                                    {priceFormData.features.length > 0 && (
                                        <div className="admin-features-wrap">
                                            {priceFormData.features.map((feature, index) => (
                                                <div key={index} className="admin-feature-chip">
                                                    <span>✓ {feature}</span>
                                                    <button type="button" onClick={() => removeFeature(index)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="admin-check-row">
                                    <input type="checkbox" name="popular" id="pop-chk" checked={priceFormData.popular} onChange={handlePriceChange} />
                                    <label htmlFor="pop-chk">Popular</label>
                                    <input type="checkbox" name="active" id="act-chk" checked={priceFormData.active} onChange={handlePriceChange} style={{ marginLeft: '20px' }} />
                                    <label htmlFor="act-chk">Active</label>
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={isSubmittingPrice}>
                                        {isSubmittingPrice ? '⏳ Saving...' : (editingPrice ? '✅ Update Price' : '➕ Add Price')}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowPriceModal(false); setEditingPrice(null); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* PRICELIST PIN MODAL */}
                {showPinModal && (
                    <div className="admin-modal-overlay" onClick={() => { setShowPinModal(false); setPinChangeError(''); setPinChangeSuccess(''); setNewPin(''); setConfirmPin(''); }}>
                        <div className="admin-modal p-pin" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">🔢 Pricelist PIN Management</h2>
                                <button className="admin-modal-close" onClick={() => { setShowPinModal(false); setPinChangeError(''); setPinChangeSuccess(''); setNewPin(''); setConfirmPin(''); }}>✕</button>
                            </div>

                            <div className="admin-pin-display">
                                <div className="admin-pin-display-label">Current PIN</div>
                                <div className="admin-pin-display-value">
                                    {isLoadingPin ? '----' : (pricelistPin || '----').split('').join(' ')}
                                </div>
                                <div className="admin-pin-hint">
                                    This 4-digit PIN is required to view the Pricelist page
                                </div>
                            </div>

                            <div className="admin-note">
                                🔒 Visitors must enter this 4-digit PIN to access the pricing page. Default PIN is <strong>1234</strong>.
                            </div>

                            {pinChangeError && <div className="admin-error">{pinChangeError}</div>}
                            {pinChangeSuccess && <div className="admin-success">{pinChangeSuccess}</div>}

                            <form onSubmit={handleChangePin}>
                                <div className="admin-form-group">
                                    <label className="admin-label">New 4-Digit PIN</label>
                                    <input
                                        className="admin-input admin-pin-input"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="4"
                                        value={newPin}
                                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="••••"
                                    />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Confirm New PIN</label>
                                    <input
                                        className="admin-input admin-pin-input"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength="4"
                                        value={confirmPin}
                                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        placeholder="••••"
                                    />
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={isChangingPin || isLoadingPin}>
                                        {isChangingPin ? '⏳ Updating...' : '✅ Update PIN'}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowPinModal(false); setPinChangeError(''); setPinChangeSuccess(''); setNewPin(''); setConfirmPin(''); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* HISTORY MODAL */}
                {showHistoryModal && (
                    <div className="admin-modal-overlay" onClick={() => { setShowHistoryModal(false); setEditingHistory(null); setHistoryUploadError(''); setHistoryUploadProgress(0); }}>
                        <div className="admin-modal p-history" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">{editingHistory ? '✏️ Edit History Item' : '📜 Add History Item'}</h2>
                                <button className="admin-modal-close" onClick={() => { setShowHistoryModal(false); setEditingHistory(null); setHistoryUploadError(''); setHistoryUploadProgress(0); }}>✕</button>
                            </div>

                            {historyUploadError && <div className="admin-error">{historyUploadError}</div>}

                            <form onSubmit={saveHistory}>
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Year *</label>
                                        <input className="admin-input" type="text" name="year" value={historyFormData.year} onChange={handleHistoryChange} required placeholder="2026" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Badge (optional)</label>
                                        <input className="admin-input" type="text" name="badge" value={historyFormData.badge} onChange={handleHistoryChange} placeholder="🚀 Latest" />
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Title *</label>
                                    <input className="admin-input" type="text" name="title" value={historyFormData.title} onChange={handleHistoryChange} required placeholder="e.g., Franchise Finder" />
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Description *</label>
                                    <textarea className="admin-textarea" name="description" value={historyFormData.description} onChange={handleHistoryChange} required placeholder="Describe the project/milestone..." />
                                </div>

                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Icon (Emoji)</label>
                                        <input className="admin-input" type="text" name="icon" value={historyFormData.icon} onChange={handleHistoryChange} placeholder="🚀" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Animation Effect *</label>
                                        <select className="admin-input" name="effect" value={historyFormData.effect} onChange={handleHistoryChange} style={{ cursor: 'pointer' }}>
                                            {historyEffectOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="admin-form-group">
                                    <label className="admin-label">Custom Image (optional)</label>
                                    <input type="file" ref={historyFileInputRef} className="admin-file-input" accept="image/*" onChange={handleHistoryImageUpload} disabled={historyUploadingImage} />
                                    {historyUploadingImage && (
                                        <div className="admin-upload-progress">⏳ Uploading... {historyUploadProgress}%</div>
                                    )}
                                    {historyImageUrl && (
                                        <div className="admin-upload-preview">
                                            <img src={historyImageUrl} alt="Preview" />
                                            <button type="button" className="admin-mini-action danger" onClick={() => setHistoryImageUrl('')}>Remove Image</button>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={isSubmittingHistory}>
                                        {isSubmittingHistory ? '⏳ Saving...' : (editingHistory ? '✅ Update History' : '➕ Add History')}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowHistoryModal(false); setEditingHistory(null); setHistoryUploadError(''); setHistoryUploadProgress(0); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MEETING DETAIL MODAL */}
                {showMeetingDetail && selectedMeeting && (
                    <div className="admin-modal-overlay" onClick={() => { setShowMeetingDetail(false); setSelectedMeeting(null); }}>
                        <div className="admin-modal p-meetings" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">📅 Meeting Details</h2>
                                <button className="admin-modal-close" onClick={() => { setShowMeetingDetail(false); setSelectedMeeting(null); }}>✕</button>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px', paddingBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #4D96FF, #FF6BD6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                                    {selectedMeeting.name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontFamily: 'Space Grotesk, sans-serif', fontSize: '1.125rem', fontWeight: 700 }}>{selectedMeeting.name}</h3>
                                    <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>{selectedMeeting.email}</p>
                                </div>
                            </div>

                            <div className="admin-detail-row">
                                <span className="admin-detail-label">📞 Phone</span>
                                <p className="admin-detail-value">{selectedMeeting.phone || 'Not provided'}</p>
                            </div>
                            <div className="admin-detail-row">
                                <span className="admin-detail-label">📌 Subject</span>
                                <p className="admin-detail-value">{selectedMeeting.subject || 'Meeting Request'}</p>
                            </div>
                            <div className="admin-form-row">
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">📅 Date</span>
                                    <p className="admin-detail-value" style={{ color: '#4D96FF', fontWeight: 700 }}>{selectedMeeting.meetingDate}</p>
                                </div>
                                <div className="admin-detail-row">
                                    <span className="admin-detail-label">⏰ Time</span>
                                    <p className="admin-detail-value" style={{ color: '#4D96FF', fontWeight: 700 }}>{selectedMeeting.meetingTime}</p>
                                </div>
                            </div>
                            <div className="admin-detail-row">
                                <span className="admin-detail-label">💬 Message</span>
                                <p className="admin-detail-box">{selectedMeeting.message}</p>
                            </div>

                            <div className="admin-modal-actions">
                                {selectedMeeting.status === 'pending' && (
                                    <>
                                        <button type="button" className="admin-mini-action success" onClick={() => { handleMeetingStatusChange(selectedMeeting.id, 'confirmed'); setShowMeetingDetail(false); }} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>✅ Confirm Meeting</button>
                                        <button type="button" className="admin-mini-action danger" onClick={() => { handleMeetingStatusChange(selectedMeeting.id, 'cancelled'); setShowMeetingDetail(false); }} style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>❌ Cancel</button>
                                    </>
                                )}
                                <button type="button" className="admin-modal-cancel" onClick={() => { setShowMeetingDetail(false); setSelectedMeeting(null); }}>Close</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* DEVELOPER MODAL */}
                {showDeveloperModal && (
                    <div className="admin-modal-overlay" onClick={() => { setShowDeveloperModal(false); setEditingDeveloper(null); setUploadError(''); setUploadProgress(0); }}>
                        <div className="admin-modal p-devs" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">{editingDeveloper ? '✏️ Edit Developer' : '👨‍💻 Add Developer'}</h2>
                                <button className="admin-modal-close" onClick={() => { setShowDeveloperModal(false); setEditingDeveloper(null); setUploadError(''); setUploadProgress(0); }}>✕</button>
                            </div>

                            {uploadError && <div className="admin-error">{uploadError}</div>}

                            <form onSubmit={saveDeveloper}>
                                <div className="admin-form-group">
                                    <label className="admin-label">Full Name *</label>
                                    <input className="admin-input" type="text" name="name" value={developerFormData.name} onChange={handleDeveloperChange} required />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Role *</label>
                                    <input className="admin-input" type="text" name="role" value={developerFormData.role} onChange={handleDeveloperChange} required placeholder="e.g., Full Stack Developer" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Email</label>
                                    <input className="admin-input" type="email" name="email" value={developerFormData.email} onChange={handleDeveloperChange} placeholder="developer@example.com" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">GitHub URL</label>
                                    <input className="admin-input" type="text" name="github" value={developerFormData.github} onChange={handleDeveloperChange} placeholder="https://github.com/username" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">LinkedIn URL</label>
                                    <input className="admin-input" type="text" name="linkedin" value={developerFormData.linkedin} onChange={handleDeveloperChange} placeholder="https://linkedin.com/in/username" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Profile Photo</label>
                                    <input type="file" ref={fileInputRef} className="admin-file-input" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} />
                                    {uploadingImage && <div className="admin-upload-progress">⏳ Uploading... {uploadProgress}%</div>}
                                    {developerFormData.photo && (
                                        <div className="admin-upload-preview">
                                            <img src={developerFormData.photo} alt="Preview" />
                                            <button type="button" className="admin-mini-action danger" onClick={() => setDeveloperFormData(prev => ({ ...prev, photo: '' }))}>Remove Photo</button>
                                        </div>
                                    )}
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={isSubmittingDeveloper}>
                                        {isSubmittingDeveloper ? '⏳ Saving...' : (editingDeveloper ? '✅ Update Developer' : '➕ Add Developer')}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowDeveloperModal(false); setEditingDeveloper(null); setUploadError(''); setUploadProgress(0); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* OFFER MODAL */}
                {showOfferModal && (
                    <div className="admin-modal-overlay" onClick={() => { setShowOfferModal(false); setEditingOffer(null); }}>
                        <div className="admin-modal p-offers" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">{editingOffer ? '✏️ Edit Offer' : '🎯 Add New Offer'}</h2>
                                <button className="admin-modal-close" onClick={() => { setShowOfferModal(false); setEditingOffer(null); }}>✕</button>
                            </div>
                            <form onSubmit={saveOffer}>
                                <div className="admin-form-group">
                                    <label className="admin-label">Offer Title *</label>
                                    <input className="admin-input" type="text" name="title" value={offerFormData.title} onChange={handleOfferChange} required placeholder="e.g., 20% Off Web Development" />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Description *</label>
                                    <textarea className="admin-textarea" name="description" value={offerFormData.description} onChange={handleOfferChange} required placeholder="Describe your offer..." />
                                </div>
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Discount</label>
                                        <input className="admin-input" type="text" name="discount" value={offerFormData.discount} onChange={handleOfferChange} placeholder="e.g., 30% OFF" />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Promo Code</label>
                                        <input className="admin-input" type="text" name="code" value={offerFormData.code} onChange={handleOfferChange} placeholder="e.g., SUMMER2024" style={{ textTransform: 'uppercase' }} />
                                    </div>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Icon (Emoji)</label>
                                    <input className="admin-input" type="text" name="icon" value={offerFormData.icon} onChange={handleOfferChange} placeholder="🎉" />
                                </div>
                                <div className="admin-check-row">
                                    <input type="checkbox" name="active" id="offer-active-chk" checked={offerFormData.active} onChange={handleOfferChange} />
                                    <label htmlFor="offer-active-chk">Active Status</label>
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={isSubmittingOffer}>
                                        {isSubmittingOffer ? '⏳ Saving...' : (editingOffer ? '✅ Update Offer' : '➕ Add Offer')}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowOfferModal(false); setEditingOffer(null); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ASSIGN DEVELOPERS MODAL */}
                {showAssignModal && selectedRequestForAssign && (
                    <div className="admin-modal-overlay" onClick={() => { setShowAssignModal(false); setSelectedRequestForAssign(null); setSelectedDeveloperIds([]); }}>
                        <div className="admin-modal p-assign" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">👨‍💻 Assign Developers</h2>
                                <button className="admin-modal-close" onClick={() => { setShowAssignModal(false); setSelectedRequestForAssign(null); setSelectedDeveloperIds([]); }}>✕</button>
                            </div>

                            <div style={{ marginBottom: '18px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                                <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: '0 0 4px 0' }}>
                                    <strong style={{ color: '#F1F5F9' }}>Project:</strong> {serviceTypes[selectedRequestForAssign.serviceType] || selectedRequestForAssign.serviceType}
                                </p>
                                <p style={{ color: '#94A3B8', fontSize: '0.8125rem', margin: '0 0 4px 0' }}>
                                    <strong style={{ color: '#F1F5F9' }}>Client:</strong> {selectedRequestForAssign.clientName}
                                </p>
                                <p style={{ color: '#FFD93D', fontSize: '0.75rem', margin: 0, fontWeight: 600 }}>
                                    Selected: {selectedDeveloperIds.length} developer{selectedDeveloperIds.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Select Developers (click to toggle)</label>
                                <div className="admin-assign-grid">
                                    {developers.map((dev) => {
                                        const isSelected = selectedDeveloperIds.includes(dev.id);
                                        return (
                                            <div key={dev.id} className={`admin-assign-item ${isSelected ? 'selected' : ''}`} onClick={() => toggleDeveloperSelection(dev.id)}>
                                                {dev.photo ? (
                                                    <img src={dev.photo} alt={dev.name} />
                                                ) : (
                                                    <div className="assign-avatar">{dev.name?.charAt(0) || 'D'}</div>
                                                )}
                                                <div className="assign-info">
                                                    <div className="assign-name">{dev.name}</div>
                                                    <div className="assign-role">{dev.role}</div>
                                                </div>
                                                {isSelected && <span className="assign-check">✅</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="admin-modal-actions">
                                <button type="button" className="admin-modal-submit" disabled={assigningDeveloper || selectedDeveloperIds.length === 0} onClick={assignDevelopersToRequest}>
                                    {assigningDeveloper ? '⏳ Assigning...' : `✅ Assign ${selectedDeveloperIds.length} Developer${selectedDeveloperIds.length !== 1 ? 's' : ''}`}
                                </button>
                                <button type="button" className="admin-modal-cancel" onClick={() => { setShowAssignModal(false); setSelectedRequestForAssign(null); setSelectedDeveloperIds([]); }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* REMOVE DEVELOPER MODAL */}
                {showRemoveDeveloperModal && selectedRequestForRemove && (
                    <div className="admin-modal-overlay" onClick={() => { setShowRemoveDeveloperModal(false); setSelectedRequestForRemove(null); setSelectedDeveloperToRemove(''); }}>
                        <div className="admin-modal p-danger" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">❌ Remove Developer</h2>
                                <button className="admin-modal-close" onClick={() => { setShowRemoveDeveloperModal(false); setSelectedRequestForRemove(null); setSelectedDeveloperToRemove(''); }}>✕</button>
                            </div>

                            <div className="admin-form-group">
                                <label className="admin-label">Select Developer to Remove</label>
                                <select className="admin-input" value={selectedDeveloperToRemove} onChange={(e) => setSelectedDeveloperToRemove(e.target.value)} style={{ cursor: 'pointer' }}>
                                    <option value="">Select a developer...</option>
                                    {(selectedRequestForRemove.assignedDevelopers || []).map((dev) => (
                                        <option key={dev.id} value={dev.id}>{dev.name} - {dev.role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="admin-modal-actions">
                                <button type="button" className="admin-btn-delete" onClick={removeDeveloperFromRequest}>✅ Remove Developer</button>
                                <button type="button" className="admin-modal-cancel" onClick={() => { setShowRemoveDeveloperModal(false); setSelectedRequestForRemove(null); setSelectedDeveloperToRemove(''); }}>Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* EDIT REQUEST MODAL */}
                {showEditModal && selectedRequest && (
                    <div className="admin-modal-overlay" onClick={() => { setShowEditModal(false); setSelectedRequest(null); }}>
                        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="admin-modal-header">
                                <h2 className="admin-modal-title">✏️ Edit Request</h2>
                                <button className="admin-modal-close" onClick={() => { setShowEditModal(false); setSelectedRequest(null); }}>✕</button>
                            </div>

                            <form onSubmit={handleUpdate}>
                                <div className="admin-form-group">
                                    <label className="admin-label">Service Type</label>
                                    <select className="admin-input" value={editFormData.serviceType} onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value })} style={{ cursor: 'pointer' }}>
                                        {Object.entries(serviceTypes).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Description</label>
                                    <textarea className="admin-textarea" value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                                </div>
                                <div className="admin-form-row">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Date</label>
                                        <input className="admin-input" type="date" value={editFormData.scheduleDate} onChange={(e) => setEditFormData({ ...editFormData, scheduleDate: e.target.value })} />
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Time</label>
                                        <input className="admin-input" type="time" value={editFormData.scheduleTime} onChange={(e) => setEditFormData({ ...editFormData, scheduleTime: e.target.value })} />
                                    </div>
                                </div>
                                <div className="admin-form-row-3">
                                    <div className="admin-form-group">
                                        <label className="admin-label">Status</label>
                                        <select className="admin-input" value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} style={{ cursor: 'pointer' }}>
                                            <option value="pending">⏳ Pending</option>
                                            <option value="approved">✅ Approved</option>
                                            <option value="in-progress">🔄 In Progress</option>
                                            <option value="completed">🎉 Completed</option>
                                            <option value="rejected">❌ Rejected</option>
                                        </select>
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Priority</label>
                                        <select className="admin-input" value={editFormData.priority} onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })} style={{ cursor: 'pointer' }}>
                                            <option value="High">🔴 High</option>
                                            <option value="Medium">🟡 Medium</option>
                                            <option value="Low">🟢 Low</option>
                                        </select>
                                    </div>
                                    <div className="admin-form-group">
                                        <label className="admin-label">Budget</label>
                                        <input className="admin-input" type="text" value={editFormData.budget} onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })} placeholder="$500" />
                                    </div>
                                </div>

                                <div className="admin-modal-actions">
                                    <button type="submit" className="admin-modal-submit" disabled={loading}>
                                        {loading ? '⏳ Updating...' : '✅ Update Request'}
                                    </button>
                                    <button type="button" className="admin-modal-cancel" onClick={() => { setShowEditModal(false); setSelectedRequest(null); }}>Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </>
    );
}

export default Admin;