// src/pages/Admin.js - Complete updated file with Meeting Management
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
    setDoc 
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

    // Offer Management States
    const [offers, setOffers] = useState([]);
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [editingOffer, setEditingOffer] = useState(null);
    const [offerFormData, setOfferFormData] = useState({
        title: '',
        description: '',
        discount: '',
        code: '',
        icon: '🎉',
        active: true
    });
    const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

    // Meeting Management States
    const [meetings, setMeetings] = useState([]);
    const [showMeetings, setShowMeetings] = useState(true);
    const [filterMeetingStatus, setFilterMeetingStatus] = useState('all');
    const [selectedMeeting, setSelectedMeeting] = useState(null);
    const [showMeetingDetail, setShowMeetingDetail] = useState(false);

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

    // Service Types
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

    // Check auth state on mount
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

        try {
            const activeUsersQuery = query(
                collection(db, 'activeUsers'),
                orderBy('lastActive', 'desc')
            );

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

    // Fetch offers from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

        try {
            const offersQuery = query(
                collection(db, 'offers'),
                orderBy('createdAt', 'desc')
            );

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

    // Fetch meetings from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

        try {
            const meetingsQuery = query(
                collection(db, 'meetings'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(meetingsQuery, (snapshot) => {
                try {
                    const meetingData = [];
                    snapshot.forEach((doc) => {
                        meetingData.push({ id: doc.id, ...doc.data() });
                    });
                    setMeetings(meetingData);
                } catch (error) {
                    console.error('Error processing meetings:', error);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up meetings listener:', error);
        }
    }, [isAuthenticated]);

    // Check if a developer is currently active
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

    // Get active status for developer
    const getDeveloperStatus = (developerEmail) => {
        try {
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
        } catch (error) {
            return { isActive: false, lastActive: null };
        }
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

        try {
            const q = query(
                collection(db, 'clientRequests'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                try {
                    const requests = [];
                    let pendingCount = 0;
                    let inProgressCount = 0;
                    let completedCount = 0;
                    let rejectedCount = 0;
                    const monthlyStats = {};

                    snapshot.forEach((doc) => {
                        const data = { id: doc.id, ...doc.data() };
                        if (!data.assignedDevelopers) {
                            data.assignedDevelopers = [];
                        }
                        requests.push(data);

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
                                if (!monthlyStats[monthKey]) {
                                    monthlyStats[monthKey] = { total: 0, completed: 0, pending: 0 };
                                }
                                monthlyStats[monthKey].total++;
                                if (data.status === 'completed') monthlyStats[monthKey].completed++;
                                if (data.status === 'pending') monthlyStats[monthKey].pending++;
                            } catch (error) {
                                console.error('Error processing date:', error);
                            }
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

    // Fetch developers from Firestore
    useEffect(() => {
        if (!isAuthenticated) return;

        try {
            const developersQuery = query(
                collection(db, 'developers'),
                orderBy('createdAt', 'desc')
            );

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

    // Filter requests
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

    // Calculate service type distribution
    const getServiceDistribution = () => {
        try {
            const distribution = {};
            allRequests.forEach(req => {
                const service = req.serviceType || 'other';
                distribution[service] = (distribution[service] || 0) + 1;
            });
            return Object.entries(distribution)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 8);
        } catch (error) {
            return [];
        }
    };

    // Calculate priority distribution
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

    // Calculate status distribution
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

    // Handle developer form change
    const handleDeveloperChange = (e) => {
        const { name, value } = e.target;
        setDeveloperFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Handle offer form change
    const handleOfferChange = (e) => {
        const { name, value, type, checked } = e.target;
        setOfferFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Upload image to Cloudinary
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

            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            setUploadProgress(70);
            const data = await response.json();

            if (response.ok && data.secure_url) {
                setDeveloperFormData(prev => ({
                    ...prev,
                    photo: data.secure_url
                }));
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
        setUploadError('');
        setUploadProgress(0);
        setShowDeveloperModal(true);
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
        setUploadError('');
        setUploadProgress(0);
        setShowDeveloperModal(true);
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

    // Delete developer
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

    // Open assign developer modal
    const openAssignModal = (request) => {
        setSelectedRequestForAssign(request);
        const currentAssignedIds = request.assignedDevelopers ? request.assignedDevelopers.map(d => d.id) : [];
        setSelectedDeveloperIds(currentAssignedIds);
        setShowAssignModal(true);
    };

    // Toggle developer selection for assignment
    const toggleDeveloperSelection = (developerId) => {
        setSelectedDeveloperIds(prev => {
            if (prev.includes(developerId)) {
                return prev.filter(id => id !== developerId);
            } else {
                return [...prev, developerId];
            }
        });
    };

    // Assign developers to request
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

    // Open remove developer modal
    const openRemoveDeveloperModal = (request) => {
        setSelectedRequestForRemove(request);
        setSelectedDeveloperToRemove('');
        setShowRemoveDeveloperModal(true);
    };

    // Remove developer from request
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

    // ----- Offer Management Functions -----
    const openAddOffer = () => {
        setEditingOffer(null);
        setOfferFormData({
            title: '',
            description: '',
            discount: '',
            code: '',
            icon: '🎉',
            active: true
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
                title: '',
                description: '',
                discount: '',
                code: '',
                icon: '🎉',
                active: true
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

    // ----- Meeting Management Functions -----
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
                                    fontSize: '1rem'
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
                                    fontSize: '1rem'
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

    // Render Admin Dashboard
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
                            fontSize: '0.95rem'
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
                            fontSize: '0.95rem'
                        }}
                    >
                        👨‍💻 Add Developer
                    </button>
                    <button
                        onClick={openAddOffer}
                        style={{
                            padding: '10px 24px',
                            background: 'rgba(255, 217, 61, 0.15)',
                            border: '1px solid rgba(255, 217, 61, 0.3)',
                            borderRadius: '10px',
                            color: '#FFD93D',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.95rem'
                        }}
                    >
                        🎯 Add Offer
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
                            fontSize: '0.95rem'
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
                <div style={{ background: '#1A1E37', padding: '20px', borderRadius: '15px', border: '1px solid rgba(77, 150, 255, 0.15)' }}>
                    <p style={{ color: '#4D96FF', margin: 0, fontSize: '0.9rem' }}>📅 Meetings</p>
                    <h2 style={{ color: '#4D96FF', margin: '5px 0 0 0' }}>
                        {meetings.filter(m => m.status === 'pending').length}
                    </h2>
                </div>
            </div>

            {/* ============ MEETING REQUESTS SECTION ============ */}
            <div style={{
                marginBottom: '30px',
                background: '#1A1E37',
                borderRadius: '15px',
                border: '1px solid rgba(77, 150, 255, 0.2)',
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
                        <h2 style={{ color: '#4D96FF', margin: 0 }}>📅 Meeting Requests</h2>
                        <p style={{ color: '#A8B2D1', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                            {meetings.filter(m => m.status === 'pending').length} pending • {meetings.length} total
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <button
                            onClick={() => setShowMeetings(!showMeetings)}
                            style={{
                                padding: '8px 16px',
                                background: showMeetings ? 'rgba(255, 107, 107, 0.15)' : 'rgba(77, 150, 255, 0.15)',
                                border: `1px solid ${showMeetings ? 'rgba(255, 107, 107, 0.3)' : 'rgba(77, 150, 255, 0.3)'}`,
                                borderRadius: '8px',
                                color: showMeetings ? '#FF6B6B' : '#4D96FF',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.85rem'
                            }}
                        >
                            {showMeetings ? '🙈 Hide Meetings' : '👁️ Show Meetings'}
                        </button>
                        <select
                            value={filterMeetingStatus}
                            onChange={(e) => setFilterMeetingStatus(e.target.value)}
                            style={{
                                padding: '8px 16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(77, 150, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#E0E0E0',
                                fontSize: '0.85rem',
                                cursor: 'pointer'
                            }}
                        >
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
                        <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>📅</span>
                            <p>No meeting requests yet.</p>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                            gap: '20px'
                        }}>
                            {meetings
                                .filter(m => filterMeetingStatus === 'all' || m.status === filterMeetingStatus)
                                .map((meeting) => {
                                    const statusInfo = getMeetingStatusBadge(meeting.status);
                                    return (
                                        <div
                                            key={meeting.id}
                                            style={{
                                                background: 'rgba(77, 150, 255, 0.03)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(77, 150, 255, 0.15)',
                                                padding: '20px',
                                                position: 'relative'
                                            }}
                                        >
                                            <div style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                padding: '3px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.7rem',
                                                fontWeight: 'bold',
                                                background: statusInfo.bg,
                                                color: statusInfo.color,
                                                border: `1px solid ${statusInfo.color}40`
                                            }}>
                                                {statusInfo.label}
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <div style={{
                                                    width: '45px',
                                                    height: '45px',
                                                    borderRadius: '50%',
                                                    background: 'linear-gradient(135deg, #4D96FF, #FF6BD6)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem',
                                                    fontWeight: 'bold',
                                                    color: '#fff',
                                                    flexShrink: 0
                                                }}>
                                                    {meeting.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h3 style={{ color: '#E0E0E0', margin: 0, fontSize: '1rem' }}>{meeting.name}</h3>
                                                    <p style={{ color: '#A8B2D1', margin: '2px 0 0 0', fontSize: '0.8rem' }}>{meeting.email}</p>
                                                </div>
                                            </div>

                                            <div style={{
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                borderRadius: '8px',
                                                padding: '12px',
                                                marginBottom: '12px'
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                    <span>📅</span>
                                                    <span style={{ color: '#4D96FF', fontSize: '0.9rem', fontWeight: '500' }}>
                                                        {meeting.meetingDate}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span>⏰</span>
                                                    <span style={{ color: '#FFD93D', fontSize: '0.9rem', fontWeight: '500' }}>
                                                        {meeting.meetingTime}
                                                    </span>
                                                </div>
                                            </div>

                                            {meeting.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                                    <span>📞</span>
                                                    <span style={{ color: '#A8B2D1', fontSize: '0.85rem' }}>{meeting.phone}</span>
                                                </div>
                                            )}

                                            {meeting.subject && (
                                                <div style={{ 
                                                    color: '#FFD93D', 
                                                    fontSize: '0.85rem', 
                                                    fontWeight: '500',
                                                    marginBottom: '8px'
                                                }}>
                                                    📌 {meeting.subject}
                                                </div>
                                            )}

                                            <p style={{
                                                color: '#A8B2D1',
                                                fontSize: '0.85rem',
                                                lineHeight: '1.5',
                                                margin: '8px 0',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 3,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {meeting.message}
                                            </p>

                                            <div style={{
                                                display: 'flex',
                                                gap: '8px',
                                                paddingTop: '12px',
                                                borderTop: '1px solid rgba(77, 150, 255, 0.1)',
                                                flexWrap: 'wrap'
                                            }}>
                                                {meeting.status === 'pending' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleMeetingStatusChange(meeting.id, 'confirmed')}
                                                            style={{
                                                                padding: '4px 12px',
                                                                background: 'rgba(107, 203, 119, 0.15)',
                                                                border: '1px solid rgba(107, 203, 119, 0.3)',
                                                                borderRadius: '6px',
                                                                color: '#6BCB77',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            ✅ Confirm
                                                        </button>
                                                        <button
                                                            onClick={() => handleMeetingStatusChange(meeting.id, 'cancelled')}
                                                            style={{
                                                                padding: '4px 12px',
                                                                background: 'rgba(255, 107, 107, 0.15)',
                                                                border: '1px solid rgba(255, 107, 107, 0.3)',
                                                                borderRadius: '6px',
                                                                color: '#FF6B6B',
                                                                cursor: 'pointer',
                                                                fontSize: '0.75rem'
                                                            }}
                                                        >
                                                            ❌ Cancel
                                                        </button>
                                                    </>
                                                )}
                                                {meeting.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleMeetingStatusChange(meeting.id, 'completed')}
                                                        style={{
                                                            padding: '4px 12px',
                                                            background: 'rgba(77, 150, 255, 0.15)',
                                                            border: '1px solid rgba(77, 150, 255, 0.3)',
                                                            borderRadius: '6px',
                                                            color: '#4D96FF',
                                                            cursor: 'pointer',
                                                            fontSize: '0.75rem'
                                                        }}
                                                    >
                                                        🎉 Mark Complete
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => openMeetingDetail(meeting)}
                                                    style={{
                                                        padding: '4px 12px',
                                                        background: 'rgba(255, 217, 61, 0.15)',
                                                        border: '1px solid rgba(255, 217, 61, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#FFD93D',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    👁️ View
                                                </button>
                                                <button
                                                    onClick={() => deleteMeeting(meeting.id)}
                                                    style={{
                                                        padding: '4px 12px',
                                                        background: 'rgba(255, 107, 107, 0.15)',
                                                        border: '1px solid rgba(255, 107, 107, 0.3)',
                                                        borderRadius: '6px',
                                                        color: '#FF6B6B',
                                                        cursor: 'pointer',
                                                        fontSize: '0.75rem',
                                                        marginLeft: 'auto'
                                                    }}
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    )
                )}
            </div>

            {/* ============ OFFERS SECTION ============ */}
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
                        <h2 style={{ color: '#FFD93D', margin: 0 }}>🎯 Offers Management</h2>
                        <p style={{ color: '#A8B2D1', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                            {offers.filter(o => o.active).length} active • {offers.length} total
                        </p>
                    </div>
                    <button
                        onClick={openAddOffer}
                        style={{
                            padding: '8px 20px',
                            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)',
                            color: '#0A0E27',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                    >
                        ➕ Add New Offer
                    </button>
                </div>

                {offers.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>
                        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🎯</span>
                        <p>No offers added yet. Click "Add New Offer" to create your first offer.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '20px'
                    }}>
                        {offers.map((offer) => (
                            <div
                                key={offer.id}
                                style={{
                                    background: offer.active ? 'rgba(107, 203, 119, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '12px',
                                    border: offer.active 
                                        ? '1px solid rgba(107, 203, 119, 0.2)' 
                                        : '1px solid rgba(255, 107, 107, 0.08)',
                                    padding: '20px',
                                    position: 'relative'
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    padding: '2px 12px',
                                    background: offer.active ? 'rgba(107, 203, 119, 0.15)' : 'rgba(255, 107, 107, 0.15)',
                                    borderRadius: '12px',
                                    color: offer.active ? '#6BCB77' : '#FF6B6B',
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold'
                                }}>
                                    {offer.active ? 'Active' : 'Inactive'}
                                </div>
                                
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{ fontSize: '2.5rem' }}>{offer.icon || '🎉'}</div>
                                    <div>
                                        <h3 style={{ color: '#E0E0E0', margin: 0, fontSize: '1.1rem' }}>{offer.title}</h3>
                                        {offer.discount && (
                                            <span style={{ color: '#FFD93D', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                                {offer.discount}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p style={{ color: '#A8B2D1', fontSize: '0.85rem', margin: '8px 0', lineHeight: '1.4' }}>
                                    {offer.description}
                                </p>

                                {offer.code && (
                                    <div style={{
                                        padding: '4px 12px',
                                        background: 'rgba(255, 217, 61, 0.08)',
                                        border: '1px dashed rgba(255, 217, 61, 0.2)',
                                        borderRadius: '6px',
                                        color: '#FFD93D',
                                        fontSize: '0.8rem',
                                        display: 'inline-block',
                                        marginBottom: '10px',
                                        fontFamily: 'monospace'
                                    }}>
                                        Code: {offer.code}
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
                                    <button
                                        onClick={() => toggleOfferStatus(offer.id, offer.active)}
                                        style={{
                                            padding: '4px 12px',
                                            background: offer.active ? 'rgba(255, 107, 107, 0.15)' : 'rgba(107, 203, 119, 0.15)',
                                            border: offer.active ? '1px solid rgba(255, 107, 107, 0.3)' : '1px solid rgba(107, 203, 119, 0.3)',
                                            borderRadius: '6px',
                                            color: offer.active ? '#FF6B6B' : '#6BCB77',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        {offer.active ? '🔴 Deactivate' : '🟢 Activate'}
                                    </button>
                                    <button
                                        onClick={() => openEditOffer(offer)}
                                        style={{
                                            padding: '4px 12px',
                                            background: 'rgba(77, 150, 255, 0.15)',
                                            border: '1px solid rgba(77, 150, 255, 0.3)',
                                            borderRadius: '6px',
                                            color: '#4D96FF',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        ✏️ Edit
                                    </button>
                                    <button
                                        onClick={() => deleteOffer(offer.id)}
                                        style={{
                                            padding: '4px 12px',
                                            background: 'rgba(255, 107, 107, 0.15)',
                                            border: '1px solid rgba(255, 107, 107, 0.3)',
                                            borderRadius: '6px',
                                            color: '#FF6B6B',
                                            cursor: 'pointer',
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ============ DEVELOPERS SECTION ============ */}
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
                            onClick={() => setShowDevelopers(!showDevelopers)}
                            style={{
                                padding: '8px 16px',
                                background: showDevelopers ? 'rgba(255, 107, 107, 0.15)' : 'rgba(107, 203, 119, 0.15)',
                                border: `1px solid ${showDevelopers ? 'rgba(255, 107, 107, 0.3)' : 'rgba(107, 203, 119, 0.3)'}`,
                                borderRadius: '8px',
                                color: showDevelopers ? '#FF6B6B' : '#6BCB77',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.85rem'
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
                                fontSize: '0.85rem'
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
                                fontSize: '0.9rem'
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
                            {filteredDevelopers.map((dev) => {
                                const status = getDeveloperStatus(dev.email);
                                const isActive = status.isActive;
                                const lastActive = status.lastActive;
                                
                                return (
                                    <div
                                        key={dev.id}
                                        style={{
                                            background: isActive ? 'rgba(107, 203, 119, 0.05)' : 'rgba(255, 255, 255, 0.03)',
                                            borderRadius: '12px',
                                            border: isActive ? '1px solid rgba(107, 203, 119, 0.2)' : '1px solid rgba(255, 107, 107, 0.08)',
                                            padding: '20px',
                                            position: 'relative'
                                        }}
                                    >
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.7rem',
                                            fontWeight: 'bold',
                                            background: isActive ? 'rgba(107, 203, 119, 0.2)' : 'rgba(255, 107, 107, 0.2)',
                                            color: isActive ? '#6BCB77' : '#FF6B6B'
                                        }}>
                                            {isActive ? '🟢 Active' : '⚪ Inactive'}
                                        </div>

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
                                                        border: isActive ? '2px solid rgba(107, 203, 119, 0.5)' : '2px solid rgba(255, 255, 255, 0.1)'
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = `
                                                            <div style="width:60px;height:60px;border-radius:50%;background:linear-gradient(135deg,#FF6B6B,#FFD93D);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:bold;color:#0A0E27;">
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
                                                    background: isActive ? 'linear-gradient(135deg, #6BCB77, #FFD93D)' : 'linear-gradient(135deg, #666, #888)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '1.5rem',
                                                    fontWeight: 'bold',
                                                    color: '#0A0E27'
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
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#A8B2D1', fontSize: '0.85rem' }}>
                                                <span>📧</span>
                                                <span>{dev.email}</span>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 107, 107, 0.05)', flexWrap: 'wrap' }}>
                                            {dev.github && (
                                                <a href={dev.github} target="_blank" rel="noopener noreferrer" style={{ color: '#A8B2D1', textDecoration: 'none', fontSize: '0.8rem', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
                                                    🐙 GitHub
                                                </a>
                                            )}
                                            {dev.linkedin && (
                                                <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: '#A8B2D1', textDecoration: 'none', fontSize: '0.8rem', padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
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
                                                        fontSize: '0.75rem'
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
                                                        fontSize: '0.75rem'
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

            {/* ============ CLIENT REQUESTS SECTION ============ */}
            <div style={{ marginBottom: '25px' }}>
                <h2 style={{ color: '#FFD93D', marginBottom: '15px' }}>📋 Client Service Requests</h2>
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
                        fontSize: '0.95rem'
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255, 107, 107, 0.1)' }}>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Client</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Service</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Priority</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Status</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Assigned Team</th>
                                <th style={{ padding: '15px 16px', textAlign: 'left', color: '#FFD93D', fontWeight: '500' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRequests.map((request) => {
                                const assignedDevs = request.assignedDevelopers || [];
                                return (
                                    <tr key={request.id} style={{ borderBottom: '1px solid rgba(255, 107, 107, 0.05)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ fontWeight: '500', color: '#E0E0E0' }}>{request.clientName || 'N/A'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#A8B2D1' }}>{request.email || ''}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ color: '#E0E0E0' }}>{serviceTypes[request.serviceType] || request.serviceType}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{request.scheduleDate || 'No date'}</div>
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{ color: getPriorityBadge(request.priority).color, fontWeight: '500' }}>
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
                                            {assignedDevs.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {assignedDevs.map((dev) => (
                                                        <div key={dev.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px 8px 2px 4px', borderRadius: '20px', border: '1px solid rgba(255, 217, 61, 0.15)' }}>
                                                            {dev.photo ? (
                                                                <img src={dev.photo} alt={dev.name} style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold', color: '#0A0E27' }}>
                                                                    {dev.name?.charAt(0) || 'D'}
                                                                </div>
                                                            )}
                                                            <span style={{ color: '#E0E0E0', fontSize: '0.75rem' }}>{dev.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ color: '#666', fontSize: '0.85rem' }}>No team assigned</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <select
                                                    value={request.status}
                                                    onChange={(e) => handleStatusChange(request.id, e.target.value)}
                                                    style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '6px', color: '#E0E0E0', fontSize: '0.8rem' }}
                                                >
                                                    <option value="pending">⏳ Pending</option>
                                                    <option value="approved">✅ Approve</option>
                                                    <option value="in-progress">🔄 In Progress</option>
                                                    <option value="completed">🎉 Complete</option>
                                                    <option value="rejected">❌ Reject</option>
                                                </select>
                                                <button onClick={() => handleEdit(request)} style={{ padding: '4px 12px', background: 'rgba(77, 150, 255, 0.15)', border: '1px solid rgba(77, 150, 255, 0.3)', borderRadius: '6px', color: '#4D96FF', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    ✏️ Edit
                                                </button>
                                                <button onClick={() => openAssignModal(request)} style={{ padding: '4px 12px', background: 'rgba(255, 217, 61, 0.15)', border: '1px solid rgba(255, 217, 61, 0.3)', borderRadius: '6px', color: '#FFD93D', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    👨‍💻 Assign
                                                </button>
                                                {assignedDevs.length > 0 && (
                                                    <button onClick={() => openRemoveDeveloperModal(request)} style={{ padding: '4px 12px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '6px', color: '#FF6B6B', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                        ❌ Remove
                                                    </button>
                                                )}
                                                <button onClick={() => handleDelete(request.id)} style={{ padding: '4px 12px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '6px', color: '#FF6B6B', cursor: 'pointer', fontSize: '0.8rem' }}>
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ============ MEETING DETAIL MODAL ============ */}
            {showMeetingDetail && selectedMeeting && (
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
                        padding: '35px',
                        borderRadius: '20px',
                        maxWidth: '550px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid rgba(77, 150, 255, 0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ color: '#4D96FF', margin: 0 }}>📅 Meeting Details</h2>
                            <button
                                onClick={() => { setShowMeetingDetail(false); setSelectedMeeting(null); }}
                                style={{ background: 'none', border: 'none', color: '#A8B2D1', fontSize: '1.5rem', cursor: 'pointer' }}
                            >
                                ✕
                            </button>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(77, 150, 255, 0.1)' }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #4D96FF, #FF6BD6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.5rem',
                                fontWeight: 'bold',
                                color: '#fff'
                            }}>
                                {selectedMeeting.name?.charAt(0) || '?'}
                            </div>
                            <div>
                                <h3 style={{ color: '#E0E0E0', margin: 0 }}>{selectedMeeting.name}</h3>
                                <p style={{ color: '#A8B2D1', margin: '4px 0 0 0' }}>{selectedMeeting.email}</p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>📞 Phone</label>
                                <p style={{ color: '#E0E0E0', margin: 0 }}>{selectedMeeting.phone || 'Not provided'}</p>
                            </div>

                            <div>
                                <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>📌 Subject</label>
                                <p style={{ color: '#E0E0E0', margin: 0 }}>{selectedMeeting.subject || 'Meeting Request'}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>📅 Meeting Date</label>
                                    <p style={{ color: '#4D96FF', margin: 0, fontWeight: 'bold' }}>{selectedMeeting.meetingDate}</p>
                                </div>
                                <div>
                                    <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>⏰ Meeting Time</label>
                                    <p style={{ color: '#4D96FF', margin: 0, fontWeight: 'bold' }}>{selectedMeeting.meetingTime}</p>
                                </div>
                            </div>

                            <div>
                                <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>💬 Message</label>
                                <p style={{ color: '#A8B2D1', margin: 0, lineHeight: '1.6', background: 'rgba(255, 255, 255, 0.03)', padding: '12px', borderRadius: '8px' }}>
                                    {selectedMeeting.message}
                                </p>
                            </div>

                            <div>
                                <label style={{ color: '#FFD93D', fontSize: '0.85rem', display: 'block', marginBottom: '5px' }}>📊 Status</label>
                                <span style={{
                                    padding: '4px 14px',
                                    borderRadius: '20px',
                                    fontSize: '0.8rem',
                                    fontWeight: 'bold',
                                    background: getMeetingStatusBadge(selectedMeeting.status).bg,
                                    color: getMeetingStatusBadge(selectedMeeting.status).color
                                }}>
                                    {getMeetingStatusBadge(selectedMeeting.status).label}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
                            {selectedMeeting.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => { handleMeetingStatusChange(selectedMeeting.id, 'confirmed'); setShowMeetingDetail(false); }}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(107, 203, 119, 0.15)', border: '1px solid rgba(107, 203, 119, 0.3)', borderRadius: '10px', color: '#6BCB77', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        ✅ Confirm Meeting
                                    </button>
                                    <button
                                        onClick={() => { handleMeetingStatusChange(selectedMeeting.id, 'cancelled'); setShowMeetingDetail(false); }}
                                        style={{ flex: 1, padding: '12px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '10px', color: '#FF6B6B', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        ❌ Cancel
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => { setShowMeetingDetail(false); setSelectedMeeting(null); }}
                                style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(77, 150, 255, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ DEVELOPER MODAL ============ */}
            {showDeveloperModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 39, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1A1E37', padding: '30px', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#FFD93D', margin: 0 }}>
                                {editingDeveloper ? '✏️ Edit Developer' : '👨‍💻 Add Developer'}
                            </h2>
                            <button onClick={() => { setShowDeveloperModal(false); setEditingDeveloper(null); setUploadError(''); setUploadProgress(0); }} style={{ background: 'none', border: 'none', color: '#A8B2D1', fontSize: '1.5rem', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>

                        {uploadError && (
                            <div style={{ color: '#FF6B6B', fontSize: '0.85rem', padding: '10px', background: 'rgba(255, 107, 107, 0.1)', borderRadius: '8px', border: '1px solid rgba(255, 107, 107, 0.2)', marginBottom: '15px' }}>
                                {uploadError}
                            </div>
                        )}

                        <form onSubmit={saveDeveloper}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Full Name *</label>
                                <input type="text" name="name" value={developerFormData.name} onChange={handleDeveloperChange} required style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Role *</label>
                                <input type="text" name="role" value={developerFormData.role} onChange={handleDeveloperChange} required placeholder="e.g., Full Stack Developer" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Email</label>
                                <input type="email" name="email" value={developerFormData.email} onChange={handleDeveloperChange} placeholder="developer@example.com" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>GitHub URL</label>
                                <input type="text" name="github" value={developerFormData.github} onChange={handleDeveloperChange} placeholder="https://github.com/username" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>LinkedIn URL</label>
                                <input type="text" name="linkedin" value={developerFormData.linkedin} onChange={handleDeveloperChange} placeholder="https://linkedin.com/in/username" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Profile Photo</label>
                                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,217,61,0.05)', border: '1px solid rgba(255,217,61,0.2)', borderRadius: '10px', color: '#FFD93D', cursor: 'pointer', fontSize: '0.9rem' }} />
                                {uploadingImage && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFD93D', marginTop: '8px' }}>
                                        <span>⏳ Uploading... {uploadProgress}%</span>
                                    </div>
                                )}
                                {developerFormData.photo && (
                                    <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <img src={developerFormData.photo} alt="Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255, 217, 61, 0.3)' }} />
                                        <button type="button" onClick={() => setDeveloperFormData(prev => ({ ...prev, photo: '' }))} style={{ padding: '4px 12px', background: 'rgba(255, 107, 107, 0.15)', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '6px', color: '#FF6B6B', cursor: 'pointer', fontSize: '0.8rem' }}>
                                            Remove Photo
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button type="submit" disabled={isSubmittingDeveloper} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)', border: 'none', borderRadius: '10px', color: '#0A0E27', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                    {isSubmittingDeveloper ? '⏳ Saving...' : (editingDeveloper ? '✅ Update Developer' : '➕ Add Developer')}
                                </button>
                                <button type="button" onClick={() => { setShowDeveloperModal(false); setEditingDeveloper(null); setUploadError(''); setUploadProgress(0); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ OFFER MODAL ============ */}
            {showOfferModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 39, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1A1E37', padding: '30px', borderRadius: '20px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#FFD93D', margin: 0 }}>
                                {editingOffer ? '✏️ Edit Offer' : '🎯 Add New Offer'}
                            </h2>
                            <button onClick={() => { setShowOfferModal(false); setEditingOffer(null); }} style={{ background: 'none', border: 'none', color: '#A8B2D1', fontSize: '1.5rem', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={saveOffer}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Offer Title *</label>
                                <input type="text" name="title" value={offerFormData.title} onChange={handleOfferChange} required placeholder="e.g., 20% Off Web Development" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Description *</label>
                                <textarea name="description" value={offerFormData.description} onChange={handleOfferChange} required placeholder="Describe your offer..." style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0', minHeight: '80px', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Discount</label>
                                    <input type="text" name="discount" value={offerFormData.discount} onChange={handleOfferChange} placeholder="e.g., 30% OFF" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                                </div>
                                <div style={{ marginBottom: '15px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Promo Code</label>
                                    <input type="text" name="code" value={offerFormData.code} onChange={handleOfferChange} placeholder="e.g., SUMMER2024" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0', textTransform: 'uppercase' }} />
                                </div>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Icon (Emoji)</label>
                                <input type="text" name="icon" value={offerFormData.icon} onChange={handleOfferChange} placeholder="e.g., 🎉, 🔥, ⭐" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                            </div>
                            <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ color: '#A8B2D1' }}>Active Status</label>
                                <input type="checkbox" name="active" checked={offerFormData.active} onChange={handleOfferChange} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button type="submit" disabled={isSubmittingOffer} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)', border: 'none', borderRadius: '10px', color: '#0A0E27', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                    {isSubmittingOffer ? '⏳ Saving...' : (editingOffer ? '✅ Update Offer' : '➕ Add Offer')}
                                </button>
                                <button type="button" onClick={() => { setShowOfferModal(false); setEditingOffer(null); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============ ASSIGN DEVELOPERS MODAL ============ */}
            {showAssignModal && selectedRequestForAssign && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 39, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1A1E37', padding: '30px', borderRadius: '20px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#FFD93D', margin: 0 }}>👨‍💻 Assign Developers</h2>
                            <button onClick={() => { setShowAssignModal(false); setSelectedRequestForAssign(null); setSelectedDeveloperIds([]); }} style={{ background: 'none', border: 'none', color: '#A8B2D1', fontSize: '1.5rem', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ color: '#A8B2D1' }}>
                                <strong>Project:</strong> {serviceTypes[selectedRequestForAssign.serviceType] || selectedRequestForAssign.serviceType}
                            </p>
                            <p style={{ color: '#A8B2D1' }}>
                                <strong>Client:</strong> {selectedRequestForAssign.clientName}
                            </p>
                            <p style={{ color: '#A8B2D1', fontSize: '0.85rem' }}>
                                <strong>Selected:</strong> {selectedDeveloperIds.length} developer{selectedDeveloperIds.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#FFD93D' }}>
                                Select Developers (click to toggle)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '300px', overflow: 'auto' }}>
                                {developers.map((dev) => {
                                    const isSelected = selectedDeveloperIds.includes(dev.id);
                                    return (
                                        <div key={dev.id} onClick={() => toggleDeveloperSelection(dev.id)} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: isSelected ? 'rgba(255, 217, 61, 0.1)' : 'rgba(255,255,255,0.03)', border: isSelected ? '2px solid #FFD93D' : '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', cursor: 'pointer' }}>
                                            {dev.photo ? (
                                                <img src={dev.photo} alt={dev.name} style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold', color: '#0A0E27' }}>
                                                    {dev.name?.charAt(0) || 'D'}
                                                </div>
                                            )}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: '#E0E0E0', fontSize: '0.85rem', fontWeight: '500' }}>{dev.name}</div>
                                                <div style={{ color: '#A8B2D1', fontSize: '0.7rem' }}>{dev.role}</div>
                                            </div>
                                            {isSelected && <span style={{ color: '#FFD93D', fontSize: '1.2rem' }}>✅</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={assignDevelopersToRequest} disabled={assigningDeveloper || selectedDeveloperIds.length === 0} style={{ flex: 1, padding: '12px', background: selectedDeveloperIds.length > 0 ? 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)' : '#333', border: 'none', borderRadius: '10px', color: selectedDeveloperIds.length > 0 ? '#0A0E27' : '#666', fontWeight: 'bold', cursor: selectedDeveloperIds.length > 0 ? 'pointer' : 'not-allowed', fontSize: '1rem' }}>
                                {assigningDeveloper ? '⏳ Assigning...' : `✅ Assign ${selectedDeveloperIds.length} Developer${selectedDeveloperIds.length !== 1 ? 's' : ''}`}
                            </button>
                            <button type="button" onClick={() => { setShowAssignModal(false); setSelectedRequestForAssign(null); setSelectedDeveloperIds([]); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ REMOVE DEVELOPER MODAL ============ */}
            {showRemoveDeveloperModal && selectedRequestForRemove && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 39, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1A1E37', padding: '30px', borderRadius: '20px', maxWidth: '500px', width: '100%', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ color: '#FF6B6B', margin: 0 }}>❌ Remove Developer</h2>
                            <button onClick={() => { setShowRemoveDeveloperModal(false); setSelectedRequestForRemove(null); setSelectedDeveloperToRemove(''); }} style={{ background: 'none', border: 'none', color: '#A8B2D1', fontSize: '1.5rem', cursor: 'pointer' }}>
                                ✕
                            </button>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ color: '#A8B2D1' }}>
                                <strong>Project:</strong> {serviceTypes[selectedRequestForRemove.serviceType] || selectedRequestForRemove.serviceType}
                            </p>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#FFD93D' }}>Select Developer to Remove</label>
                            <select value={selectedDeveloperToRemove} onChange={(e) => setSelectedDeveloperToRemove(e.target.value)} style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.18)', borderRadius: '10px', color: '#E0E0E0', fontSize: '1rem' }}>
                                <option value="">Select a developer...</option>
                                {(selectedRequestForRemove.assignedDevelopers || []).map((dev) => (
                                    <option key={dev.id} value={dev.id}>{dev.name} - {dev.role}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                            <button onClick={removeDeveloperFromRequest} style={{ flex: 1, padding: '12px', background: '#FF6B6B', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                ✅ Remove Developer
                            </button>
                            <button type="button" onClick={() => { setShowRemoveDeveloperModal(false); setSelectedRequestForRemove(null); setSelectedDeveloperToRemove(''); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ EDIT REQUEST MODAL ============ */}
            {showEditModal && selectedRequest && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 14, 39, 0.95)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ background: '#1A1E37', padding: '30px', borderRadius: '20px', maxWidth: '600px', width: '100%', maxHeight: '90vh', overflow: 'auto', border: '1px solid rgba(255, 107, 107, 0.25)' }}>
                        <h2 style={{ color: '#FFD93D', marginBottom: '20px' }}>✏️ Edit Request</h2>
                        <form onSubmit={handleUpdate}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Service Type</label>
                                <select value={editFormData.serviceType} onChange={(e) => setEditFormData({ ...editFormData, serviceType: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }}>
                                    {Object.entries(serviceTypes).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Description</label>
                                <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0', minHeight: '80px' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Date</label>
                                    <input type="date" value={editFormData.scheduleDate} onChange={(e) => setEditFormData({ ...editFormData, scheduleDate: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Time</label>
                                    <input type="time" value={editFormData.scheduleTime} onChange={(e) => setEditFormData({ ...editFormData, scheduleTime: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Status</label>
                                    <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }}>
                                        <option value="pending">⏳ Pending</option>
                                        <option value="approved">✅ Approved</option>
                                        <option value="in-progress">🔄 In Progress</option>
                                        <option value="completed">🎉 Completed</option>
                                        <option value="rejected">❌ Rejected</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Priority</label>
                                    <select value={editFormData.priority} onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }}>
                                        <option value="High">🔴 High</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="Low">🟢 Low</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#A8B2D1' }}>Budget</label>
                                    <input type="text" value={editFormData.budget} onChange={(e) => setEditFormData({ ...editFormData, budget: e.target.value })} placeholder="e.g., $500" style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#E0E0E0' }} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                                <button type="submit" disabled={loading} style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%)', border: 'none', borderRadius: '10px', color: '#0A0E27', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                                    {loading ? '⏳ Updating...' : '✅ Update Request'}
                                </button>
                                <button type="button" onClick={() => { setShowEditModal(false); setSelectedRequest(null); }} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255, 107, 107, 0.1)', borderRadius: '10px', color: '#A8B2D1', cursor: 'pointer' }}>
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