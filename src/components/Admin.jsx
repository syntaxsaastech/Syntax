import React, { useState, useEffect, useRef } from 'react';
import { auth, db, collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, signInWithEmailAndPassword, onAuthStateChanged, signOut, getDocs, where, addDoc, serverTimestamp } from '../firebase/config';

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
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0
    });
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [timeFrame, setTimeFrame] = useState('all');
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
    const [fadeIn, setFadeIn] = useState(true);
    const [showDevelopers, setShowDevelopers] = useState(true);
    const [activeUsers, setActiveUsers] = useState([]);
    const [showOnlyActive, setShowOnlyActive] = useState(false);
    const fileInputRef = useRef(null);

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

    // Cloudinary configuration
    const CLOUDINARY_CLOUD_NAME = 'zw7pcks3';
    const CLOUDINARY_UPLOAD_PRESET = 'developer_photos';

    // Check auth state on mount
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setAdminUser(user);
                setIsAuthenticated(true);
                // Track active user
                updateActiveUser(user.uid, user.email, user.displayName);
            } else {
                setAdminUser(null);
                setIsAuthenticated(false);
            }
        });
        return () => unsubscribe();
    }, []);

    // Track active users in Firestore
    const updateActiveUser = async (uid, email, displayName) => {
        try {
            const userRef = doc(db, 'activeUsers', uid);
            await updateDoc(userRef, {
                email: email,
                displayName: displayName || email,
                lastActive: serverTimestamp(),
                isActive: true
            }).catch(async () => {
                // If document doesn't exist, create it
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

    // Listen for active users
    useEffect(() => {
        if (!isAuthenticated) return;

        const activeUsersQuery = query(
            collection(db, 'activeUsers'),
            orderBy('lastActive', 'desc')
        );

        const unsubscribe = onSnapshot(activeUsersQuery, (snapshot) => {
            const users = [];
            const now = new Date();
            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                // Check if user was active in last 5 minutes
                if (data.lastActive) {
                    const lastActive = data.lastActive.toDate ? data.lastActive.toDate() : new Date(data.lastActive);
                    const diffMinutes = (now - lastActive) / (1000 * 60);
                    data.isActive = diffMinutes < 5; // Consider active if within last 5 minutes
                }
                users.push(data);
            });
            setActiveUsers(users);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Check if a developer is currently active
    const isDeveloperActive = (developerEmail) => {
        const activeUser = activeUsers.find(u => 
            u.email && developerEmail && u.email.toLowerCase() === developerEmail.toLowerCase()
        );
        return activeUser ? activeUser.isActive : false;
    };

    // Get active status for developer
    const getDeveloperStatus = (developerEmail) => {
        const activeUser = activeUsers.find(u => 
            u.email && developerEmail && u.email.toLowerCase() === developerEmail.toLowerCase()
        );
        if (activeUser) {
            return {
                isActive: activeUser.isActive,
                lastActive: activeUser.lastActive
            };
        }
        return {
            isActive: false,
            lastActive: null
        };
    };

    // Handle admin login
    const handleAdminLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setLoginError('');

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
                setLoginError('❌ Incorrect password.');
            } else {
                setLoginError('❌ Login failed. Please try again.');
            }
        }
        setIsLoading(false);
    };

    // Handle admin logout
    const handleAdminLogout = async () => {
        try {
            // Mark user as inactive
            if (adminUser) {
                const userRef = doc(db, 'activeUsers', adminUser.uid);
                await updateDoc(userRef, {
                    isActive: false,
                    lastActive: serverTimestamp()
                }).catch(() => {});
            }
            await signOut(auth);
            setIsAuthenticated(false);
            setAdminUser(null);
            alert('✅ Logged out successfully!');
        } catch (error) {
            console.error('Logout Error:', error);
            alert('❌ Error logging out.');
        }
    };

    // Fetch all client requests from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

        const q = query(
            collection(db, 'clientRequests'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests = [];
            let pendingCount = 0;
            let inProgressCount = 0;
            let completedCount = 0;
            let rejectedCount = 0;
            const monthlyStats = {};

            snapshot.forEach((doc) => {
                const data = { id: doc.id, ...doc.data() };
                requests.push(data);

                switch (data.status) {
                    case 'pending': pendingCount++; break;
                    case 'in-progress': inProgressCount++; break;
                    case 'completed': completedCount++; break;
                    case 'rejected': rejectedCount++; break;
                    default: break;
                }

                if (data.createdAt) {
                    const date = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
                    if (!monthlyStats[monthKey]) {
                        monthlyStats[monthKey] = { total: 0, completed: 0, pending: 0 };
                    }
                    monthlyStats[monthKey].total++;
                    if (data.status === 'completed') monthlyStats[monthKey].completed++;
                    if (data.status === 'pending') monthlyStats[monthKey].pending++;
                }
            });

            const monthlyArray = Object.entries(monthlyStats).map(([month, data]) => ({
                month,
                ...data
            })).slice(-6);

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
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Fetch developers from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

        const developersQuery = query(
            collection(db, 'developers'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(developersQuery, (snapshot) => {
            const devs = [];
            snapshot.forEach((doc) => {
                devs.push({ id: doc.id, ...doc.data() });
            });
            setDevelopers(devs);
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    // Filter requests
    const filteredRequests = allRequests.filter(request => {
        const matchesStatus = filterStatus === 'all' || request.status === filterStatus;
        const matchesSearch =
            request.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.serviceType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            request.description?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    // Calculate service type distribution
    const getServiceDistribution = () => {
        const distribution = {};
        allRequests.forEach(req => {
            const service = req.serviceType || 'other';
            distribution[service] = (distribution[service] || 0) + 1;
        });
        return Object.entries(distribution)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8);
    };

    // Calculate priority distribution
    const getPriorityDistribution = () => {
        const distribution = { High: 0, Medium: 0, Low: 0 };
        allRequests.forEach(req => {
            if (req.priority) distribution[req.priority] = (distribution[req.priority] || 0) + 1;
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    };

    // Calculate status distribution
    const getStatusDistribution = () => {
        const distribution = { pending: 0, approved: 0, 'in-progress': 0, completed: 0, rejected: 0 };
        allRequests.forEach(req => {
            if (req.status) distribution[req.status] = (distribution[req.status] || 0) + 1;
        });
        return Object.entries(distribution).map(([name, value]) => ({ name, value }));
    };

    // Handle developer form change
    const handleDeveloperChange = (e) => {
        const { name, value } = e.target;
        setDeveloperFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Upload image to Cloudinary
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingImage(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            const data = await response.json();
            
            if (data.secure_url) {
                setDeveloperFormData(prev => ({
                    ...prev,
                    photo: data.secure_url
                }));
                alert('✅ Image uploaded successfully!');
            } else {
                alert('❌ Failed to upload image. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('❌ Error uploading image: ' + error.message);
        }

        setUploadingImage(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Open add developer modal
    const openAddDeveloper = () => {
        setEditingDeveloper(null);
        setDeveloperFormData({
            name: '',
            role: '',
            photo: '',
            email: '',
            github: '',
            linkedin: '',
        });
        setShowDeveloperModal(true);
        setFadeIn(true);
    };

    // Open edit developer modal
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
        setShowDeveloperModal(true);
        setFadeIn(true);
    };

    // Save developer to Firestore
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
                name: '',
                role: '',
                photo: '',
                email: '',
                github: '',
                linkedin: '',
            });
        } catch (error) {
            console.error('Error saving developer:', error);
            alert('❌ Error saving developer: ' + error.message);
        }

        setIsSubmittingDeveloper(false);
    };

    // Delete developer with fade out animation
    const deleteDeveloper = async (developerId) => {
        if (window.confirm('Are you sure you want to delete this developer?')) {
            const devElement = document.getElementById(`developer-${developerId}`);
            if (devElement) {
                devElement.style.opacity = '0';
                devElement.style.transform = 'scale(0.8)';
            }

            try {
                await deleteDoc(doc(db, 'developers', developerId));
                alert('✅ Developer deleted successfully!');
            } catch (error) {
                console.error('Error deleting developer:', error);
                alert('❌ Error deleting developer.');
                if (devElement) {
                    devElement.style.opacity = '1';
                    devElement.style.transform = 'scale(1)';
                }
            }
        }
    };

    // Handle edit
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

    // Handle update
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

    // Handle delete
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

    // Handle status change
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

    // If not authenticated, show login screen
    if (!isAuthenticated) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                padding: '40px 20px',
                background: '#0A0E27'
            }}>
                <div style={{
                    background: '#1A1E37',
                    padding: '50px',
                    borderRadius: '30px',
                    border: '1px solid rgba(255, 107, 107, 0.25)',
                    width: '100%',
                    maxWidth: '420px',
                    boxShadow: '0 10px 40px rgba(255, 107, 107, 0.15)'
                }}>
                    <span style={{ fontSize: '3rem', display: 'block', textAlign: 'center', marginBottom: '10px' }}>👑</span>
                    <h1 style={{
                        fontSize: '2rem',
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textAlign: 'center',
                        marginBottom: '8px'
                    }}>
                        Admin Login
                    </h1>
                    <p style={{ color: '#A8B2D1', textAlign: 'center', marginBottom: '30px', letterSpacing: '1px', fontSize: '0.9rem' }}>
                        Enter your credentials to access the admin panel
                    </p>

                    {loginError && (
                        <div style={{
                            color: '#FF6B6B',
                            fontSize: '0.85rem',
                            padding: '10px',
                            background: 'rgba(255, 107, 107, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            marginBottom: '15px',
                            textAlign: 'center'
                        }}>
                            {loginError}
                        </div>
                    )}

                    <form onSubmit={handleAdminLogin}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#FFD93D', fontWeight: '500', fontSize: '0.9rem' }}>
                                📧 Email Address
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="loki@gmail.com"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 107, 107, 0.18)',
                                    borderRadius: '12px',
                                    color: '#E0E0E0',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '6px', color: '#FFD93D', fontWeight: '500', fontSize: '0.9rem' }}>
                                🔒 Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 107, 107, 0.18)',
                                    borderRadius: '12px',
                                    color: '#E0E0E0',
                                    fontSize: '1rem',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                                color: '#0A0E27',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                transition: 'all 0.4s ease',
                                letterSpacing: '1px',
                                marginTop: '10px'
                            }}
                        >
                            {isLoading ? '⏳ Logging in...' : '🔑 Login'}
                        </button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: '20px', color: '#666', fontSize: '0.85rem' }}>
                        <p>🔐 Admin access only</p>
                    </div>
                </div>
            </div>
        );
    }

    // Service distribution data
    const serviceData = getServiceDistribution();
    const priorityData = getPriorityDistribution();
    const statusData = getStatusDistribution();

    // Colors for charts
    const chartColors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BD6', '#FF9F43', '#FFD93D', '#6BCB77'];
    const statusColors = {
        pending: '#FFD93D',
        approved: '#6BCB77',
        'in-progress': '#4D96FF',
        completed: '#6BCB77',
        rejected: '#FF6B6B'
    };

    // Filter developers based on active status
    const filteredDevelopers = developers.filter(dev => {
        if (showOnlyActive) {
            return isDeveloperActive(dev.email);
        }
        return true;
    });

    // Count active developers
    const activeDeveloperCount = developers.filter(dev => isDeveloperActive(dev.email)).length;

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0A0E27',
            padding: '30px',
            color: '#E0E0E0',
            marginTop: '80px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '30px',
                flexWrap: 'wrap',
                gap: '15px'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2.2rem',
                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        margin: 0
                    }}>
                        👑 Admin Dashboard
                    </h1>
                    <p style={{ color: '#A8B2D1', margin: '5px 0 0 0' }}>
                        Welcome back, {adminUser?.email}!
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setShowAnalytics(!showAnalytics)}
                        style={{
                            padding: '10px 24px',
                            background: showAnalytics ? 'rgba(77, 150, 255, 0.2)' : 'rgba(77, 150, 255, 0.1)',
                            border: '1px solid rgba(77, 150, 255, 0.3)',
                            borderRadius: '10px',
                            color: '#4D96FF',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        📊 {showAnalytics ? 'Hide Analytics' : 'View Analytics'}
                    </button>
                    <button
                        onClick={openAddDeveloper}
                        style={{
                            padding: '10px 24px',
                            background: 'rgba(107, 203, 119, 0.15)',
                            border: '1px solid rgba(107, 203, 119, 0.3)',
                            borderRadius: '10px',
                            color: '#6BCB77',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        👨‍💻 Add Developer
                    </button>
                    <button
                        onClick={handleAdminLogout}
                        style={{
                            padding: '10px 24px',
                            background: 'rgba(255, 107, 107, 0.15)',
                            border: '1px solid rgba(255, 107, 107, 0.3)',
                            borderRadius: '10px',
                            color: '#FF6B6B',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.95rem',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '20px',
                marginBottom: '30px'
            }}>
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 107, 107, 0.1)' }}>
                    <p style={{ color: '#A8B2D1', margin: 0, fontSize: '0.9rem' }}>📊 Total</p>
                    <h2 style={{ color: '#FFD93D', margin: '5px 0 0 0' }}>{stats.total}</h2>
                </div>
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 107, 107, 0.1)' }}>
                    <p style={{ color: '#FFD93D', margin: 0, fontSize: '0.9rem' }}>⏳ Pending</p>
                    <h2 style={{ color: '#FFD93D', margin: '5px 0 0 0' }}>{stats.pending}</h2>
                </div>
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 107, 107, 0.1)' }}>
                    <p style={{ color: '#4D96FF', margin: 0, fontSize: '0.9rem' }}>🔄 In Progress</p>
                    <h2 style={{ color: '#4D96FF', margin: '5px 0 0 0' }}>{stats.inProgress}</h2>
                </div>
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 107, 107, 0.1)' }}>
                    <p style={{ color: '#6BCB77', margin: 0, fontSize: '0.9rem' }}>✅ Completed</p>
                    <h2 style={{ color: '#6BCB77', margin: '5px 0 0 0' }}>{stats.completed}</h2>
                </div>
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(255, 107, 107, 0.1)' }}>
                    <p style={{ color: '#FF6B6B', margin: 0, fontSize: '0.9rem' }}>❌ Rejected</p>
                    <h2 style={{ color: '#FF6B6B', margin: '5px 0 0 0' }}>{stats.rejected}</h2>
                </div>
            </div>

            {/* Analytics Section */}
            {showAnalytics && (
                <div style={{
                    marginBottom: '30px',
                    background: '#1A1E37',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 107, 107, 0.1)',
                    padding: '25px'
                }}>
                    <h2 style={{ color: '#FFD93D', marginBottom: '20px' }}>📊 Analytics Dashboard</h2>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '25px'
                    }}>
                        {/* Status Distribution */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 107, 107, 0.05)'
                        }}>
                            <h3 style={{ color: '#A8B2D1', fontSize: '1rem', marginBottom: '15px' }}>📊 Status Distribution</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {statusData.map((item) => {
                                    const total = statusData.reduce((sum, d) => sum + d.value, 0);
                                    const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                                    const color = statusColors[item.name] || '#A8B2D1';
                                    const label = item.name === 'pending' ? '⏳ Pending' :
                                        item.name === 'approved' ? '✅ Approved' :
                                        item.name === 'in-progress' ? '🔄 In Progress' :
                                        item.name === 'completed' ? '🎉 Completed' :
                                        item.name === 'rejected' ? '❌ Rejected' : item.name;
                                    return (
                                        <div key={item.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '3px' }}>
                                                <span style={{ color: '#A8B2D1' }}>{label}</span>
                                                <span style={{ color: color, fontWeight: 'bold' }}>{item.value} ({percentage}%)</span>
                                            </div>
                                            <div style={{
                                                height: '8px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: color,
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Priority Distribution */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 107, 107, 0.05)'
                        }}>
                            <h3 style={{ color: '#A8B2D1', fontSize: '1rem', marginBottom: '15px' }}>📊 Priority Distribution</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {priorityData.map((item) => {
                                    const maxValue = Math.max(...priorityData.map(d => d.value), 1);
                                    const percentage = Math.round((item.value / maxValue) * 100);
                                    const color = item.name === 'High' ? '#FF6B6B' :
                                        item.name === 'Medium' ? '#FFD93D' : '#6BCB77';
                                    return (
                                        <div key={item.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '3px' }}>
                                                <span style={{ color: '#A8B2D1' }}>
                                                    {item.name === 'High' ? '🔴 High' :
                                                        item.name === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                                                </span>
                                                <span style={{ color: color, fontWeight: 'bold' }}>{item.value}</span>
                                            </div>
                                            <div style={{
                                                height: '30px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '6px',
                                                overflow: 'hidden',
                                                position: 'relative'
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(90deg, ${color}, ${color}88)`,
                                                    borderRadius: '6px',
                                                    transition: 'width 0.5s ease',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    paddingLeft: '10px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 'bold',
                                                    color: '#0A0E27',
                                                    minWidth: '40px'
                                                }}>
                                                    {percentage > 15 && `${percentage}%`}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Service Distribution */}
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.02)',
                            padding: '20px',
                            borderRadius: '12px',
                            border: '1px solid rgba(255, 107, 107, 0.05)'
                        }}>
                            <h3 style={{ color: '#A8B2D1', fontSize: '1rem', marginBottom: '15px' }}>📊 Service Distribution</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {serviceData.slice(0, 6).map((item, index) => {
                                    const maxValue = Math.max(...serviceData.map(d => d.value), 1);
                                    const percentage = Math.round((item.value / maxValue) * 100);
                                    const color = chartColors[index % chartColors.length];
                                    const label = serviceTypes[item.name] || item.name;
                                    return (
                                        <div key={item.name}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '2px' }}>
                                                <span style={{ color: '#A8B2D1', fontSize: '0.75rem' }}>{label}</span>
                                                <span style={{ color: color, fontWeight: 'bold', fontSize: '0.75rem' }}>{item.value}</span>
                                            </div>
                                            <div style={{
                                                height: '20px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${percentage}%`,
                                                    height: '100%',
                                                    background: color,
                                                    borderRadius: '4px',
                                                    transition: 'width 0.5s ease'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Monthly Trend */}
                        {monthlyData.length > 0 && (
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 107, 107, 0.05)',
                                gridColumn: '1 / -1'
                            }}>
                                <h3 style={{ color: '#A8B2D1', fontSize: '1rem', marginBottom: '15px' }}>📈 Monthly Request Trend</h3>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '150px', paddingTop: '10px' }}>
                                    {monthlyData.map((item, index) => {
                                        const maxTotal = Math.max(...monthlyData.map(d => d.total), 1);
                                        const height = Math.round((item.total / maxTotal) * 100);
                                        return (
                                            <div key={index} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                <div style={{
                                                    width: '100%',
                                                    height: `${height}%`,
                                                    minHeight: '10px',
                                                    background: `linear-gradient(180deg, #FFD93D, #FFD93D88)`,
                                                    borderRadius: '4px 4px 0 0',
                                                    position: 'relative',
                                                    transition: 'height 0.5s ease'
                                                }}>
                                                    <div style={{
                                                        position: 'absolute',
                                                        bottom: '100%',
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        fontSize: '0.7rem',
                                                        color: '#FFD93D',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {item.total}
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: '0.6rem',
                                                    color: '#A8B2D1',
                                                    marginTop: '5px',
                                                    textAlign: 'center'
                                                }}>
                                                    {item.month}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '10px' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#A8B2D1' }}>
                                        <span style={{ color: '#FFD93D' }}>⬤</span> Total Requests
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Key Metrics */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px',
                        marginTop: '20px',
                        paddingTop: '20px',
                        borderTop: '1px solid rgba(255, 107, 107, 0.05)'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#FFD93D' }}>{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>Completion Rate</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#6BCB77' }}>{stats.completed}</div>
                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>Completed</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#FFD93D' }}>{stats.pending}</div>
                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>Pending</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#4D96FF' }}>{stats.inProgress}</div>
                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>In Progress</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', color: '#FF6B6B' }}>{stats.rejected}</div>
                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>Rejected</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Developers Section */}
            <div style={{
                marginBottom: '30px',
                background: '#1A1E37',
                borderRadius: '15px',
                border: '1px solid rgba(255, 107, 107, 0.1)',
                padding: '25px'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                    flexWrap: 'wrap',
                    gap: '10px'
                }}>
                    <div>
                        <h2 style={{ color: '#FFD93D', margin: 0 }}>👨‍💻 Developer Team</h2>
                        <p style={{ color: '#A8B2D1', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                            {activeDeveloperCount} active • {developers.length} total
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={() => {
                                setShowDevelopers(!showDevelopers);
                            }}
                            style={{
                                padding: '8px 16px',
                                background: showDevelopers ? 'rgba(255, 107, 107, 0.15)' : 'rgba(107, 203, 119, 0.15)',
                                border: `1px solid ${showDevelopers ? 'rgba(255, 107, 107, 0.3)' : 'rgba(107, 203, 119, 0.3)'}`,
                                borderRadius: '8px',
                                color: showDevelopers ? '#FF6B6B' : '#6BCB77',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {showDevelopers ? '🙈 Hide Developers' : '👁️ Show Developers'}
                        </button>
                        <button
                            onClick={() => setShowOnlyActive(!showOnlyActive)}
                            style={{
                                padding: '8px 16px',
                                background: showOnlyActive ? 'rgba(107, 203, 119, 0.15)' : 'rgba(255,255,255,0.05)',
                                border: `1px solid ${showOnlyActive ? 'rgba(107, 203, 119, 0.3)' : 'rgba(255,255,255,0.1)'}`,
                                borderRadius: '8px',
                                color: showOnlyActive ? '#6BCB77' : '#A8B2D1',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {showOnlyActive ? '🟢 Active Only' : '📋 All'}
                        </button>
                        <button
                            onClick={openAddDeveloper}
                            style={{
                                padding: '8px 20px',
                                background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                                color: '#0A0E27',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            ➕ Add Developer
                        </button>
                    </div>
                </div>

                {showDevelopers ? (
                    filteredDevelopers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>👨‍💻</span>
                            <p>No developers {showOnlyActive ? 'currently active' : 'added yet'}.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '20px'
                        }}>
                            {filteredDevelopers.map((dev, index) => {
                                const status = getDeveloperStatus(dev.email);
                                const isActive = status.isActive;
                                const lastActive = status.lastActive;
                                
                                return (
                                    <div
                                        key={dev.id}
                                        id={`developer-${dev.id}`}
                                        style={{
                                            background: isActive ? 'rgba(107, 203, 119, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            border: isActive ? '1px solid rgba(107, 203, 119, 0.2)' : '1px solid rgba(255, 107, 107, 0.08)',
                                            padding: '20px',
                                            transition: 'all 0.5s ease',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            opacity: 1,
                                            transform: 'scale(1)',
                                            animation: `fadeInUp 0.5s ease ${index * 0.1}s both`
                                        }}
                                    >
                                        <style>{`
                                            @keyframes fadeInUp {
                                                from {
                                                    opacity: 0;
                                                    transform: translateY(20px) scale(0.95);
                                                }
                                                to {
                                                    opacity: 1;
                                                    transform: translateY(0) scale(1);
                                                }
                                            }
                                        `}</style>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            height: '3px',
                                            background: isActive 
                                                ? 'linear-gradient(90deg, #6BCB77, #FFD93D)'
                                                : 'linear-gradient(90deg, #666, #888)'
                                        }} />
                                        
                                        {/* Status Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: isActive 
                                                ? 'rgba(107, 203, 119, 0.2)' 
                                                : 'rgba(255, 107, 107, 0.2)',
                                            color: isActive ? '#6BCB77' : '#FF6B6B',
                                            border: isActive 
                                                ? '1px solid rgba(107, 203, 119, 0.3)' 
                                                : '1px solid rgba(255, 107, 107, 0.3)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}>
                                            <span style={{
                                                display: 'inline-block',
                                                width: '8px',
                                                height: '8px',
                                                borderRadius: '50%',
                                                background: isActive ? '#6BCB77' : '#FF6B6B',
                                                animation: isActive ? 'pulse 2s infinite' : 'none'
                                            }} />
                                            {isActive ? '🟢 Active' : '⚪ Inactive'}
                                        </div>

                                        <style>{`
                                            @keyframes pulse {
                                                0% { opacity: 1; transform: scale(1); }
                                                50% { opacity: 0.5; transform: scale(0.8); }
                                                100% { opacity: 1; transform: scale(1); }
                                            }
                                        `}</style>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px' }}>
                                            {dev.photo ? (
                                                <img
                                                    src={dev.photo}
                                                    alt={dev.name}
                                                    style={{
                                                        width: '60px',
                                                        height: '60px',
                                                        borderRadius: '50%',
                                                        objectFit: 'cover',
                                                        border: isActive 
                                                            ? '2px solid rgba(107, 203, 119, 0.5)' 
                                                            : '2px solid rgba(255, 255, 255, 0.1)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = `
                                                            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#FF6B6B,#FFD93D);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;color:#0A0E27;flex-shrink:0;">
                                                                ${dev.name?.charAt(0) || 'D'}
                                                            </div>
                                                        `;
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '60px',
                                                    height: '60px',
                                                    borderRadius: '50%',
                                                    background: isActive 
                                                        ? 'linear-gradient(135deg, #6BCB77, #FFD93D)'
                                                        : 'linear-gradient(135deg, #666, #888)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    fontWeight: 'bold',
                                                    color: '#0A0E27',
                                                    flexShrink: 0
                                                }}>
                                                    {dev.name?.charAt(0) || 'D'}
                                                </div>
                                            )}
                                            <div>
                                                <h3 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.1rem' }}>{dev.name}</h3>
                                                <p style={{ color: '#FFD93D', margin: '2px 0 0 0', fontSize: '0.85rem' }}>{dev.role}</p>
                                            </div>
                                        </div>

                                        {dev.email && (
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                marginBottom: '8px',
                                                color: '#A8B2D1',
                                                fontSize: '0.85rem'
                                            }}>
                                                <span>📧</span>
                                                <span>{dev.email}</span>
                                            </div>
                                        )}

                                        {lastActive && (
                                            <div style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px', 
                                                marginBottom: '8px',
                                                color: '#666',
                                                fontSize: '0.75rem'
                                            }}>
                                                <span>🕐</span>
                                                <span>Last active: {new Date(lastActive.seconds * 1000).toLocaleString()}</span>
                                            </div>
                                        )}

                                        <div style={{
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '12px',
                                            paddingTop: '12px',
                                            borderTop: '1px solid rgba(255, 107, 107, 0.05)',
                                            flexWrap: 'wrap'
                                        }}>
                                            {dev.github && (
                                                <a
                                                    href={dev.github}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#A8B2D1',
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem',
                                                        padding: '4px 12px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    🐙 GitHub
                                                </a>
                                            )}
                                            {dev.linkedin && (
                                                <a
                                                    href={dev.linkedin}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        color: '#A8B2D1',
                                                        textDecoration: 'none',
                                                        fontSize: '0.8rem',
                                                        padding: '4px 12px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        borderRadius: '6px',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    🔗 LinkedIn
                                                </a>
                                            )}
                                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px' }}>
                                                <button
                                                    onClick={() => openEditDeveloper(dev)}
                                                    style={{
                                                        padding: '4px 12px',
                                                        background: 'rgba(77, 150, 255, 0.15)',
                                                        border: '1px solid rgba(77, 150, 255, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#4D96FF',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => deleteDeveloper(dev.id)}
                                                    style={{
                                                        padding: '4px 12px',
                                                        background: 'rgba(255, 107, 107, 0.15)',
                                                        border: '1px solid rgba(255, 107, 107, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#FF6B6B',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🙈</span>
                        <p>Developers are hidden. Click "Show Developers" to view them.</p>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '15px',
                marginBottom: '25px',
                background: '#1A1E37',
                padding: '20px',
                borderRadius: '15px',
                border: '1px solid rgba(255, 107, 107, 0.1)'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: '1',
                        minWidth: '200px',
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255, 107, 107, 0.1)',
                        borderRadius: '10px',
                        color: '#E0E0E0',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s ease'
                    }}
                />
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{
                        padding: '10px 16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255, 107, 107, 0.1)',
                        borderRadius: '10px',
                        color: '#E0E0E0',
                        fontSize: '0.95rem',
                        cursor: 'pointer'
                    }}
                >
                    <option value="all">📋 All Status</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="approved">✅ Approved</option>
                    <option value="in-progress">🔄 In Progress</option>
                    <option value="completed">🎉 Completed</option>
                    <option value="rejected">❌ Rejected</option>
                </select>
            </div>

            {/* Requests Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#A8B2D1' }}>
                    ⏳ Loading requests...
                </div>
            ) : filteredRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#A8B2D1' }}>
                    📭 No requests found
                </div>
            ) : (
                <div style={{
                    background: '#1A1E37',
                    borderRadius: '15px',
                    border: '1px solid rgba(255, 107, 107, 0.1)',
                    overflow: 'auto'
                }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        minWidth: '800px'
                    }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 107, 107, 0.1)' }}>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Client</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Service</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Priority</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Status</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((request) => (
                                <tr key={request.id} style={{ borderBottom: '1px solid rgba(255, 107, 107, 0.05)' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ fontWeight: '500', color: '#E0E0E0' }}>{request.clientName || 'N/A'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>{request.email || ''}</div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ color: '#E0E0E0' }}>{serviceTypes[request.serviceType] || request.serviceType}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            {request.scheduleDate || 'No date'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            color: getPriorityBadge(request.priority).color,
                                            fontWeight: '500'
                                        }}>
                                            {getPriorityBadge(request.priority).label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            background: getStatusBadge(request.status).bg,
                                            color: getStatusBadge(request.status).color,
                                            display: 'inline-block'
                                        }}>
                                            {getStatusBadge(request.status).label}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                            <select
                                                value={request.status}
                                                onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                style={{
                                                    padding: '4px 8px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255, 107, 107, 0.1)',
                                                    borderRadius: '6px',
                                                    color: '#E0E0E0',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                <option value="pending">⏳ Pending</option>
                                                <option value="approved">✅ Approve</option>
                                                <option value="in-progress">🔄 In Progress</option>
                                                <option value="completed">🎉 Complete</option>
                                                <option value="rejected">❌ Reject</option>
                                            </select>
                                            <button
                                                onClick={() => handleEdit(request)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: 'rgba(77, 150, 255, 0.15)',
                                                    border: '1px solid rgba(77, 150, 255, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#4D96FF',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(request.id)}
                                                style={{
                                                    padding: '4px 12px',
                                                    background: 'rgba(255, 107, 107, 0.15)',
                                                    border: '1px solid rgba(255, 107, 107, 0.3)',
                                                    borderRadius: '6px',
                                                    color: '#FF6B6B',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Developer Modal - Add/Edit Developer */}
            {showDeveloperModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(10, 14, 39, 0.95)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1A1E37',
                        padding: '30px',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid rgba(255, 107, 107, 0.25)',
                        animation: 'fadeInModal 0.3s ease'
                    }}>
                        <style>{`
                            @keyframes fadeInModal {
                                from { opacity: 0; transform: scale(0.9) translateY(20px); }
                                to { opacity: 1; transform: scale(1) translateY(0); }
                            }
                        `}</style>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2 style={{ color: '#FFD93D', margin: 0 }}>
                                {editingDeveloper ? '✏️ Edit Developer' : '👨‍💻 Add Developer'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowDeveloperModal(false);
                                    setEditingDeveloper(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#A8B2D1',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={saveDeveloper}>
                            {/* Name */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Full Name *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={developerFormData.name}
                                    onChange={handleDeveloperChange}
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                />
                            </div>

                            {/* Role */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Role *</label>
                                <input
                                    type="text"
                                    name="role"
                                    value={developerFormData.role}
                                    onChange={handleDeveloperChange}
                                    required
                                    placeholder="e.g., Full Stack Developer, Frontend Lead"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                />
                            </div>

                            {/* Email */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={developerFormData.email}
                                    onChange={handleDeveloperChange}
                                    placeholder="developer@example.com"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                />
                            </div>

                            {/* GitHub */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>GitHub URL</label>
                                <input
                                    type="text"
                                    name="github"
                                    value={developerFormData.github}
                                    onChange={handleDeveloperChange}
                                    placeholder="https://github.com/username"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                />
                            </div>

                            {/* LinkedIn */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>LinkedIn URL</label>
                                <input
                                    type="text"
                                    name="linkedin"
                                    value={developerFormData.linkedin}
                                    onChange={handleDeveloperChange}
                                    placeholder="https://linkedin.com/in/username"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                />
                            </div>

                            {/* Photo Upload */}
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Profile Photo</label>
                                <div style={{
                                    display: 'flex',
                                    gap: '10px',
                                    alignItems: 'center',
                                    flexWrap: 'wrap'
                                }}>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploadingImage}
                                        style={{
                                            flex: 1,
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    {uploadingImage && (
                                        <span style={{ color: '#FFD93D' }}>⏳ Uploading...</span>
                                    )}
                                </div>
                                {developerFormData.photo && (
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img
                                            src={developerFormData.photo}
                                            alt="Preview"
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                border: '2px solid rgba(255, 217, 61, 0.3)'
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setDeveloperFormData(prev => ({ ...prev, photo: '' }))}
                                            style={{
                                                padding: '4px 12px',
                                                background: 'rgba(255, 107, 107, 0.15)',
                                                border: '1px solid rgba(255, 107, 107, 0.3)',
                                                borderRadius: '6px',
                                                color: '#FF6B6B',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                                <div style={{ marginTop: '5px', color: '#666', fontSize: '0.75rem' }}>
                                    Upload a profile photo (JPG, PNG, GIF)
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    disabled={isSubmittingDeveloper}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: '#0A0E27',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {isSubmittingDeveloper ? '⏳ Saving...' : (editingDeveloper ? '✅ Update Developer' : '➕ Add Developer')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDeveloperModal(false);
                                        setEditingDeveloper(null);
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#A8B2D1',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(10, 14, 39, 0.95)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        background: '#1A1E37',
                        padding: '30px',
                        borderRadius: '20px',
                        maxWidth: '600px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid rgba(255, 107, 107, 0.25)'
                    }}>
                        <h2 style={{ color: '#FFD93D', marginBottom: '20px' }}>✏️ Edit Request</h2>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Service Type</label>
                                <select
                                    value={editFormData.serviceType}
                                    onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0'
                                    }}
                                >
                                    {Object.entries(serviceTypes).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Description</label>
                                <textarea
                                    value={editFormData.description}
                                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#E0E0E0',
                                        minHeight: '80px'
                                    }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Date</label>
                                    <input
                                        type="date"
                                        value={editFormData.scheduleDate}
                                        onChange={(e) => setEditFormData({ ...editFormData, scheduleDate: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Time</label>
                                    <input
                                        type="time"
                                        value={editFormData.scheduleTime}
                                        onChange={(e) => setEditFormData({ ...editFormData, scheduleTime: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0'
                                        }}
                                    >
                                        <option value="pending">⏳ Pending</option>
                                        <option value="approved">✅ Approved</option>
                                        <option value="in-progress">🔄 In Progress</option>
                                        <option value="completed">🎉 Completed</option>
                                        <option value="rejected">❌ Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Priority</label>
                                    <select
                                        value={editFormData.priority}
                                        onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0'
                                        }}
                                    >
                                        <option value="High">🔴 High</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="Low">🟢 Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Budget</label>
                                    <input
                                        type="text"
                                        value={editFormData.budget}
                                        onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })}
                                        placeholder="e.g., $500"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255, 107, 107, 0.1)',
                                            borderRadius: '10px',
                                            color: '#E0E0E0'
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                                        border: 'none',
                                        borderRadius: '10px',
                                        color: '#0A0E27',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {loading ? '⏳ Updating...' : '✅ Update Request'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedRequest(null);
                                    }}
                                    style={{
                                        padding: '12px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255, 107, 107, 0.1)',
                                        borderRadius: '10px',
                                        color: '#A8B2D1',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Admin;