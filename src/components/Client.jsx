import React, { useState, useEffect } from 'react';
import { auth, db, collection, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, getDoc, doc, updateDoc, getDocs } from '../firebase/config';

function Client() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [clientRequests, setClientRequests] = useState([]);
    const [editingRequest, setEditingRequest] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedRequestForReview, setSelectedRequestForReview] = useState(null);
    const [reviewData, setReviewData] = useState({
        rating: 5,
        reviewText: '',
        reviewTitle: ''
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [showAllReviewsModal, setShowAllReviewsModal] = useState(false);
    const [selectedRequestForAllReviews, setSelectedRequestForAllReviews] = useState(null);
    const [showDeveloperDetailModal, setShowDeveloperDetailModal] = useState(false);
    const [selectedDeveloperForDetail, setSelectedDeveloperForDetail] = useState(null);

    const [formData, setFormData] = useState({
        clientName: '',
        email: '',
        phone: '',
        serviceType: '',
        description: '',
        deadline: '',
        scheduleDate: '',
        scheduleTime: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        budget: '',
        priority: 'Medium',
        additionalNotes: ''
    });

    // Get current user and their data from Firestore
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            setAuthChecked(true);

            if (currentUser) {
                setUser(currentUser);
                console.log('✅ User logged in:', currentUser.uid);
                console.log('📧 Email:', currentUser.email);

                try {
                    const userDocRef = doc(db, 'users', currentUser.uid);
                    const userDoc = await getDoc(userDocRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserData(userData);
                        setFormData(prev => ({
                            ...prev,
                            clientName: userData.name || currentUser.displayName || '',
                            email: userData.email || currentUser.email || ''
                        }));
                    } else {
                        setFormData(prev => ({
                            ...prev,
                            clientName: currentUser.displayName || '',
                            email: currentUser.email || ''
                        }));
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }

                await fetchAllRequests(currentUser.uid);
            } else {
                console.log('❌ No user logged in');
                setUser(null);
                setClientRequests([]);
                setIsFetching(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Fetch all requests and reviews
    const fetchAllRequests = async (userId) => {
        try {
            setIsFetching(true);
            console.log('🔍 Fetching ALL requests...');

            const allQ = query(collection(db, 'clientRequests'), orderBy('createdAt', 'desc'));
            const allSnapshot = await getDocs(allQ);
            const allRequests = [];
            allSnapshot.forEach((doc) => {
                allRequests.push({ id: doc.id, ...doc.data() });
            });
            console.log('📊 ALL requests in collection:', allRequests.length);

            const filteredRequests = allRequests.filter(req => req.userId === userId);
            console.log('🎯 Filtered requests for user:', filteredRequests.length);

            const requestsWithReviews = await Promise.all(filteredRequests.map(async (request) => {
                try {
                    const reviewsQuery = query(
                        collection(db, 'reviews'),
                        where('requestId', '==', request.id),
                        orderBy('createdAt', 'desc')
                    );
                    const reviewsSnapshot = await getDocs(reviewsQuery);
                    const reviews = [];
                    reviewsSnapshot.forEach((doc) => {
                        reviews.push({ id: doc.id, ...doc.data() });
                    });
                    console.log(`📝 Found ${reviews.length} reviews for request ${request.id}`);
                    
                    const avgRating = reviews.length > 0 
                        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                        : 0;
                    return {
                        ...request,
                        reviews: reviews,
                        averageRating: Math.round(avgRating * 10) / 10,
                        reviewCount: reviews.length
                    };
                } catch (error) {
                    console.error('Error fetching reviews for request:', error);
                    return {
                        ...request,
                        reviews: [],
                        averageRating: 0,
                        reviewCount: 0
                    };
                }
            }));

            if (filteredRequests.length > 0) {
                console.log('✅ Found requests with reviews:', requestsWithReviews);
                requestsWithReviews.forEach(req => {
                    console.log(`📝 Request ${req.id} has ${req.reviewCount} reviews from all users`);
                });
                setClientRequests(requestsWithReviews);
            } else {
                console.log('⚠️ No requests found for this user');
                setClientRequests([]);
            }

            setIsFetching(false);

            const q = query(collection(db, 'clientRequests'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                const updatedRequests = [];
                snapshot.forEach((doc) => {
                    updatedRequests.push({ id: doc.id, ...doc.data() });
                });
                console.log('🔄 Real-time update - Total:', updatedRequests.length);
                const userRequests = updatedRequests.filter(req => req.userId === userId);
                console.log('🔄 Real-time update - User requests:', userRequests.length);
                
                userRequests.forEach((request) => {
                    const existingRequest = clientRequests.find(r => r.id === request.id);
                    if (existingRequest && existingRequest.status !== request.status) {
                        const notification = {
                            id: Date.now() + Math.random(),
                            requestId: request.id,
                            serviceType: request.serviceType,
                            oldStatus: existingRequest.status,
                            newStatus: request.status,
                            message: getStatusChangeMessage(existingRequest.status, request.status, request.serviceType),
                            timestamp: new Date(),
                            read: false
                        };
                        setNotifications(prev => [notification, ...prev]);
                        setUnreadCount(prev => prev + 1);
                    }
                });
                
                const requestsWithReviews = await Promise.all(userRequests.map(async (request) => {
                    try {
                        const reviewsQuery = query(
                            collection(db, 'reviews'),
                            where('requestId', '==', request.id),
                            orderBy('createdAt', 'desc')
                        );
                        const reviewsSnapshot = await getDocs(reviewsQuery);
                        const reviews = [];
                        reviewsSnapshot.forEach((doc) => {
                            reviews.push({ id: doc.id, ...doc.data() });
                        });
                        const avgRating = reviews.length > 0 
                            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
                            : 0;
                        return {
                            ...request,
                            reviews: reviews,
                            averageRating: Math.round(avgRating * 10) / 10,
                            reviewCount: reviews.length
                        };
                    } catch (error) {
                        return {
                            ...request,
                            reviews: [],
                            averageRating: 0,
                            reviewCount: 0
                        };
                    }
                }));
                
                setClientRequests(requestsWithReviews);
            }, (error) => {
                console.error('❌ Real-time error:', error);
            });

            return unsubscribe;
        } catch (error) {
            console.error('❌ Error fetching requests:', error);
            setIsFetching(false);
            setErrorMessage('Error loading requests: ' + error.message);
        }
    };

    // Get status change message
    const getStatusChangeMessage = (oldStatus, newStatus, serviceType) => {
        const serviceLabel = serviceTypes.find(s => s.value === serviceType)?.label || 'Your request';
        const messages = {
            'pending-approved': `✅ ${serviceLabel} has been approved!`,
            'pending-rejected': `❌ ${serviceLabel} has been rejected.`,
            'pending-in-progress': `🔄 ${serviceLabel} is now in progress.`,
            'approved-in-progress': `🔄 ${serviceLabel} is now in progress.`,
            'in-progress-completed': `🎉 ${serviceLabel} has been completed!`,
            'approved-completed': `🎉 ${serviceLabel} has been completed!`,
            'pending-completed': `🎉 ${serviceLabel} has been completed!`,
        };
        const key = `${oldStatus}-${newStatus}`;
        return messages[key] || `📢 ${serviceLabel} status updated to ${newStatus}`;
    };

    // Manual refresh
    const refreshData = async () => {
        if (user) {
            setIsFetching(true);
            await fetchAllRequests(user.uid);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setErrorMessage('');
        setSuccessMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        if (!user) {
            setErrorMessage('❌ Please login to submit a request.');
            setLoading(false);
            return;
        }

        if (!formData.serviceType) {
            setErrorMessage('Please select a service type');
            setLoading(false);
            return;
        }
        if (!formData.description) {
            setErrorMessage('Please describe your service need');
            setLoading(false);
            return;
        }
        if (!formData.scheduleDate) {
            setErrorMessage('Please select a schedule date');
            setLoading(false);
            return;
        }

        try {
            const requestData = {
                userId: user.uid,
                userEmail: user.email,
                clientName: formData.clientName || user.displayName || user.email,
                email: formData.email || user.email,
                phone: formData.phone || '',
                serviceType: formData.serviceType,
                description: formData.description,
                deadline: formData.deadline || '',
                scheduleDate: formData.scheduleDate,
                scheduleTime: formData.scheduleTime || '',
                address: formData.address || '',
                city: formData.city || '',
                state: formData.state || '',
                zipCode: formData.zipCode || '',
                budget: formData.budget || '',
                priority: formData.priority,
                additionalNotes: formData.additionalNotes || '',
                status: 'pending',
                assignedDevelopers: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('📤 Submitting request:', requestData);

            const docRef = await addDoc(collection(db, 'clientRequests'), requestData);
            console.log('✅ Document created with ID:', docRef.id);
            setSuccessMessage('✅ Your service request has been submitted successfully!');

            setFormData({
                ...formData,
                serviceType: '',
                description: '',
                deadline: '',
                scheduleDate: '',
                scheduleTime: '',
                address: '',
                city: '',
                state: '',
                zipCode: '',
                budget: '',
                priority: 'Medium',
                additionalNotes: ''
            });

            setTimeout(() => {
                setShowForm(false);
                setEditingRequest(null);
            }, 2000);

            setLoading(false);

        } catch (error) {
            console.error('❌ Error submitting request:', error);
            setErrorMessage('❌ Error submitting request: ' + error.message);
            setLoading(false);
        }
    };

    const handleEdit = (request) => {
        setEditingRequest(request);
        setFormData({
            clientName: request.clientName || '',
            email: request.email || '',
            phone: request.phone || '',
            serviceType: request.serviceType || '',
            description: request.description || '',
            deadline: request.deadline || '',
            scheduleDate: request.scheduleDate || '',
            scheduleTime: request.scheduleTime || '',
            address: request.address || '',
            city: request.city || '',
            state: request.state || '',
            zipCode: request.zipCode || '',
            budget: request.budget || '',
            priority: request.priority || 'Medium',
            additionalNotes: request.additionalNotes || ''
        });
        setShowForm(true);
    };

    const handleNotificationClick = (notificationId) => {
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const getNotificationIcon = (newStatus) => {
        const icons = {
            'approved': '✅',
            'rejected': '❌',
            'in-progress': '🔄',
            'completed': '🎉'
        };
        return icons[newStatus] || '📢';
    };

    // Open review modal
    const openReviewModal = (request) => {
        if (request.status !== 'completed' && request.status !== 'approved') {
            alert('⚠️ You can only review completed or approved requests.');
            return;
        }
        setSelectedRequestForReview(request);
        setReviewData({
            rating: 5,
            reviewText: '',
            reviewTitle: ''
        });
        setShowReviewModal(true);
    };

    // Open all reviews modal
    const openAllReviewsModal = (request) => {
        setSelectedRequestForAllReviews(request);
        setShowAllReviewsModal(true);
    };

    // Open developer detail modal
    const openDeveloperDetail = (developer) => {
        setSelectedDeveloperForDetail(developer);
        setShowDeveloperDetailModal(true);
    };

    // Submit review to Firebase
    const submitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            alert('❌ Please login to submit a review.');
            return;
        }
        if (!reviewData.reviewText.trim()) {
            alert('⚠️ Please write a review.');
            return;
        }
        if (!reviewData.reviewTitle.trim()) {
            alert('⚠️ Please enter a review title.');
            return;
        }

        setSubmittingReview(true);

        try {
            const review = {
                requestId: selectedRequestForReview.id,
                userId: user.uid,
                userEmail: user.email,
                userName: userData?.name || user.displayName || user.email,
                rating: reviewData.rating,
                reviewTitle: reviewData.reviewTitle.trim(),
                reviewText: reviewData.reviewText.trim(),
                serviceType: selectedRequestForReview.serviceType,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('📤 Submitting review:', review);

            const docRef = await addDoc(collection(db, 'reviews'), review);
            console.log('✅ Review submitted with ID:', docRef.id);

            const updatedRequests = clientRequests.map(req => {
                if (req.id === selectedRequestForReview.id) {
                    const updatedReviews = [...(req.reviews || []), { id: docRef.id, ...review }];
                    const avgRating = updatedReviews.length > 0 
                        ? updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length 
                        : 0;
                    return {
                        ...req,
                        reviews: updatedReviews,
                        averageRating: Math.round(avgRating * 10) / 10,
                        reviewCount: updatedReviews.length
                    };
                }
                return req;
            });
            setClientRequests(updatedRequests);

            setShowReviewModal(false);
            setSelectedRequestForReview(null);
            setSuccessMessage('✅ Your review has been submitted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error) {
            console.error('❌ Error submitting review:', error);
            alert('❌ Error submitting review: ' + error.message);
        }

        setSubmittingReview(false);
    };

    // Get status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            'pending': { color: '#FFD93D', label: '⏳ Pending' },
            'approved': { color: '#6BCB77', label: '✅ Approved' },
            'in-progress': { color: '#4D96FF', label: '🔄 In Progress' },
            'completed': { color: '#6BCB77', label: '🎉 Completed' },
            'rejected': { color: '#FF6B6B', label: '❌ Rejected' }
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

    // Render star rating
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const stars = [];
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars.push('⭐');
            } else if (i === fullStars && hasHalfStar) {
                stars.push('🌟');
            } else {
                stars.push('☆');
            }
        }
        return stars.join(' ');
    };

    // Get user initial for avatar
    const getUserInitial = (userName) => {
        if (!userName) return '?';
        return userName.charAt(0).toUpperCase();
    };

    // Get random color for user avatar
    const getUserColor = (userId) => {
        const colors = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BD6', '#FF9F43', '#00D2D3', '#F368E0'];
        const index = userId ? userId.length % colors.length : 0;
        return colors[index];
    };

    const serviceTypes = [
        { value: 'web-development', label: '🌐 Web Development' },
        { value: 'mobile-app', label: '📱 Mobile App Development' },
        { value: 'saas-solution', label: '☁️ SaaS Solution' },
        { value: 'ai-automation', label: '🤖 AI & Automation' },
        { value: 'ui-ux-design', label: '🎨 UI/UX Design' },
        { value: 'cloud-infrastructure', label: '🏗️ Cloud Infrastructure' },
        { value: 'backend-api', label: '🗄️ Backend & API' },
        { value: 'data-analytics', label: '📊 Data Analytics' },
        { value: 'devops-services', label: '🔧 DevOps & CI/CD' },
        { value: 'maintenance-support', label: '🛠️ Maintenance & Support' },
        { value: 'consultation', label: '💡 Consultation & Strategy' },
        { value: 'other', label: '📌 Other Service' }
    ];

    return (
        <>
            <style>{`
                /* ============================================
                   CLIENT PAGE - VIBRANT COLOR SCHEME
                   ============================================ */
                .client-container {
                    animation: fadeInUp 0.8s ease;
                    min-height: 100vh;
                    padding: 100px 40px 40px;
                    max-width: 1400px;
                    margin: 0 auto;
                    background: #0A0E27;
                }

                .client-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 20px;
                }

                .client-header h1 {
                    font-size: 2.5rem;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 2px;
                }

                .client-header p {
                    color: #A8B2D1;
                    font-size: 1rem;
                }

                .welcome-text {
                    color: #FFD93D;
                    font-size: 0.95rem;
                    margin-top: 5px;
                }

                .refresh-btn {
                    padding: 8px 16px;
                    background: rgba(255, 107, 107, 0.08);
                    border: 1px solid rgba(255, 107, 107, 0.18);
                    border-radius: 8px;
                    color: #FF6B6B;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-size: 0.85rem;
                }

                .refresh-btn:hover {
                    background: rgba(255, 107, 107, 0.18);
                    transform: scale(1.05);
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);
                }

                .new-request-btn {
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .new-request-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);
                }

                .request-stats {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .request-stat-card {
                    background: #1A1E37;
                    padding: 25px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    text-align: center;
                    transition: all 0.3s ease;
                }

                .request-stat-card:hover {
                    transform: translateY(-5px);
                    border-color: #FFD93D;
                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.15);
                }

                .request-stat-card .stat-icon {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 5px;
                }

                .request-stat-card .stat-number {
                    font-size: 2rem;
                    font-weight: bold;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .request-stat-card .stat-label {
                    color: #A8B2D1;
                    font-size: 0.9rem;
                    margin-top: 5px;
                }

                .requests-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                    gap: 25px;
                }

                .request-card {
                    background: #1A1E37;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 107, 107, 0.12);
                    padding: 25px;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }

                .request-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, #6BCB77, transparent);
                    transform: scaleX(0);
                    transition: all 0.5s ease;
                }

                .request-card:hover::before {
                    transform: scaleX(1);
                }

                .request-card:hover {
                    transform: translateY(-8px);
                    border-color: #FFD93D;
                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.15);
                }

                .request-card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }

                .request-service {
                    color: #FFD93D;
                    font-size: 1.1rem;
                    font-weight: bold;
                }

                .request-status {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: bold;
                }

                .request-description {
                    color: #A8B2D1;
                    font-size: 0.95rem;
                    line-height: 1.6;
                    margin-bottom: 15px;
                }

                .request-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .request-detail-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #A8B2D1;
                    font-size: 0.85rem;
                }

                .assigned-developer-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: #A8B2D1;
                    font-size: 0.85rem;
                    grid-column: 1 / -1;
                    border-top: 1px solid rgba(255, 107, 107, 0.08);
                    padding-top: 10px;
                    margin-top: 5px;
                    flex-wrap: wrap;
                }

                .assigned-developer-item .developer-name {
                    color: #FFD93D;
                    font-weight: 500;
                }

                .assigned-developer-item .developer-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.05);
                    padding: 4px 12px 4px 6px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 217, 61, 0.15);
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .assigned-developer-item .developer-badge:hover {
                    background: rgba(255, 217, 61, 0.08);
                    transform: scale(1.05);
                    border-color: rgba(255, 217, 61, 0.4);
                    box-shadow: 0 0 20px rgba(255, 217, 61, 0.1);
                }

                .assigned-developer-item .developer-photo {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid rgba(255, 217, 61, 0.3);
                }

                .assigned-developer-item .developer-avatar {
                    width: 28px;
                    height: 28px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.7rem;
                    font-weight: bold;
                    color: #0A0E27;
                    flex-shrink: 0;
                }

                .assigned-developer-item .developer-name-text {
                    color: #E0E0E0;
                    font-size: 0.8rem;
                }

                .request-priority {
                    padding: 3px 12px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-weight: bold;
                }

                .request-card-footer {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 107, 107, 0.08);
                    flex-wrap: wrap;
                    gap: 10px;
                }

                .request-date {
                    color: #666;
                    font-size: 0.8rem;
                }

                .request-actions {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .request-actions button {
                    padding: 4px 12px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 107, 107, 0.18);
                    background: transparent;
                    color: #FF6B6B;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                }

                .request-actions button:hover {
                    background: rgba(255, 107, 107, 0.08);
                    transform: scale(1.05);
                    border-color: #FF6B6B;
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);
                }

                .request-actions .review-btn {
                    border-color: rgba(255, 217, 61, 0.3);
                    color: #FFD93D;
                }

                .request-actions .review-btn:hover {
                    background: rgba(255, 217, 61, 0.1);
                    border-color: #FFD93D;
                    box-shadow: 0 0 20px rgba(255, 217, 61, 0.1);
                }

                .request-actions .view-all-reviews-btn {
                    border-color: rgba(77, 150, 255, 0.3);
                    color: #4D96FF;
                }

                .request-actions .view-all-reviews-btn:hover {
                    background: rgba(77, 150, 255, 0.1);
                    border-color: #4D96FF;
                    box-shadow: 0 0 20px rgba(77, 150, 255, 0.1);
                }

                /* Developer Detail Modal */
                .developer-detail-modal {
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
                    animation: fadeInModal 0.3s ease;
                }

                .developer-detail-modal .modal-content {
                    background: #1A1E37;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    padding: 35px;
                    max-width: 450px;
                    width: 100%;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 0 60px rgba(255, 107, 107, 0.05);
                }

                .developer-detail-modal .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }

                .developer-detail-modal .modal-header h2 {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.3rem;
                    margin: 0;
                }

                .developer-detail-modal .modal-close {
                    background: none;
                    border: none;
                    color: #A8B2D1;
                    font-size: 1.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .developer-detail-modal .modal-close:hover {
                    color: #FF6B6B;
                    transform: rotate(90deg);
                }

                .developer-detail-modal .developer-profile {
                    text-align: center;
                    margin-bottom: 20px;
                }

                .developer-detail-modal .developer-profile .dev-photo {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 3px solid rgba(255, 217, 61, 0.3);
                    margin-bottom: 12px;
                }

                .developer-detail-modal .developer-profile .dev-avatar {
                    width: 100px;
                    height: 100px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.5rem;
                    font-weight: bold;
                    color: #0A0E27;
                    margin: 0 auto 12px auto;
                }

                .developer-detail-modal .developer-profile .dev-name {
                    color: #E0E0E0;
                    font-size: 1.3rem;
                    font-weight: bold;
                    margin: 0;
                }

                .developer-detail-modal .developer-profile .dev-role {
                    color: #FFD93D;
                    font-size: 0.95rem;
                    margin: 4px 0 0 0;
                }

                .developer-detail-modal .developer-info {
                    border-top: 1px solid rgba(255, 107, 107, 0.08);
                    padding-top: 15px;
                }

                .developer-detail-modal .developer-info .info-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 0;
                    color: #A8B2D1;
                    font-size: 0.9rem;
                }

                .developer-detail-modal .developer-info .info-item .info-icon {
                    font-size: 1.1rem;
                    width: 24px;
                    text-align: center;
                }

                .developer-detail-modal .developer-info .info-item .info-value {
                    color: #E0E0E0;
                    word-break: break-all;
                }

                .developer-detail-modal .developer-links {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    justify-content: center;
                }

                .developer-detail-modal .developer-links a {
                    padding: 8px 20px;
                    border-radius: 8px;
                    text-decoration: none;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                }

                .developer-detail-modal .developer-links .github-link {
                    background: rgba(255,255,255,0.05);
                    color: #A8B2D1;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .developer-detail-modal .developer-links .github-link:hover {
                    background: rgba(255,255,255,0.1);
                }

                .developer-detail-modal .developer-links .linkedin-link {
                    background: rgba(0, 119, 181, 0.15);
                    color: #4D96FF;
                    border: 1px solid rgba(77, 150, 255, 0.3);
                }

                .developer-detail-modal .developer-links .linkedin-link:hover {
                    background: rgba(0, 119, 181, 0.25);
                }

                /* Review Section - Enhanced */
                .review-section {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid rgba(255, 107, 107, 0.08);
                }

                .review-section .rating-summary {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 12px;
                    cursor: pointer;
                }

                .review-section .rating-summary:hover {
                    opacity: 0.8;
                }

                .review-section .rating-summary .stars {
                    font-size: 1rem;
                    color: #FFD93D;
                }

                .review-section .rating-summary .rating-text {
                    color: #A8B2D1;
                    font-size: 0.85rem;
                }

                /* Review Item - User Avatar & Styling */
                .review-item {
                    background: rgba(255, 255, 255, 0.03);
                    padding: 12px 14px;
                    border-radius: 10px;
                    margin-bottom: 10px;
                    border-left: 3px solid rgba(255, 217, 61, 0.2);
                    transition: all 0.3s ease;
                    animation: fadeInUp 0.4s ease;
                }

                .review-item:hover {
                    background: rgba(255, 255, 255, 0.06);
                }

                .review-item .review-user {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    margin-bottom: 6px;
                }

                .review-item .review-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                    color: #0A0E27;
                    flex-shrink: 0;
                }

                .review-item .review-user-name {
                    color: #E0E0E0;
                    font-weight: 500;
                    font-size: 0.9rem;
                }

                .review-item .review-user-badge {
                    font-size: 0.7rem;
                    padding: 2px 8px;
                    border-radius: 12px;
                    background: rgba(255, 217, 61, 0.15);
                    color: #FFD93D;
                    border: 1px solid rgba(255, 217, 61, 0.2);
                }

                .review-item .review-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }

                .review-item .review-title {
                    color: #FFD93D;
                    font-size: 0.9rem;
                    font-weight: bold;
                }

                .review-item .review-stars {
                    color: #FFD93D;
                    font-size: 0.85rem;
                }

                .review-item .review-text {
                    color: #A8B2D1;
                    font-size: 0.85rem;
                    margin: 4px 0;
                    line-height: 1.5;
                }

                .review-item .review-date {
                    color: #666;
                    font-size: 0.7rem;
                    margin-top: 4px;
                    display: block;
                }

                .review-section .no-reviews {
                    color: #666;
                    font-size: 0.85rem;
                    text-align: center;
                    padding: 15px 0;
                }

                .review-section .view-all-btn {
                    display: block;
                    width: 100%;
                    padding: 8px;
                    margin-top: 8px;
                    background: rgba(255, 217, 61, 0.05);
                    border: 1px solid rgba(255, 217, 61, 0.15);
                    border-radius: 8px;
                    color: #FFD93D;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                    text-align: center;
                }

                .review-section .view-all-btn:hover {
                    background: rgba(255, 217, 61, 0.1);
                }

                /* Notification Bell Styles */
                .notification-container {
                    position: relative;
                    display: inline-block;
                }

                .bell-icon {
                    font-size: 1.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    padding: 8px;
                    border-radius: 50%;
                    background: transparent;
                    border: none;
                    color: #A8B2D1;
                    position: relative;
                }

                .bell-icon:hover {
                    transform: scale(1.1);
                    background: rgba(255, 107, 107, 0.1);
                    color: #FFD93D;
                }

                .bell-icon .badge {
                    position: absolute;
                    top: 0;
                    right: 0;
                    background: #FF6B6B;
                    color: #fff;
                    border-radius: 50%;
                    padding: 2px 8px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    min-width: 20px;
                    text-align: center;
                    animation: pulse 2s infinite;
                }

                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .notification-dropdown {
                    position: absolute;
                    top: 55px;
                    right: 0;
                    background: #1A1E37;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    border-radius: 16px;
                    width: 380px;
                    max-height: 450px;
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
                }

                .notification-header h3 {
                    color: #FFD93D;
                    margin: 0;
                    font-size: 1rem;
                }

                .notification-header .mark-all-btn {
                    background: none;
                    border: none;
                    color: #4D96FF;
                    cursor: pointer;
                    font-size: 0.8rem;
                    transition: all 0.3s ease;
                }

                .notification-header .mark-all-btn:hover {
                    color: #6BCB77;
                }

                .notification-item {
                    padding: 12px 20px;
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
                    background: rgba(255, 217, 61, 0.05);
                    border-left: 3px solid #FFD93D;
                }

                .notification-item.read {
                    opacity: 0.6;
                }

                .notification-icon {
                    font-size: 1.5rem;
                    flex-shrink: 0;
                }

                .notification-content {
                    flex: 1;
                }

                .notification-content .message {
                    color: #E0E0E0;
                    font-size: 0.9rem;
                    margin: 0 0 4px 0;
                    line-height: 1.4;
                }

                .notification-content .time {
                    color: #666;
                    font-size: 0.7rem;
                    margin: 0;
                }

                .notification-item .status-badge {
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    font-weight: bold;
                    display: inline-block;
                    margin-top: 4px;
                }

                .notification-empty {
                    padding: 30px 20px;
                    text-align: center;
                    color: #666;
                }

                .notification-empty .empty-icon {
                    font-size: 2.5rem;
                    display: block;
                    margin-bottom: 10px;
                }

                /* Modal Styles */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(10, 14, 39, 0.95);
                    backdrop-filter: blur(10px);
                    z-index: 9999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow-y: auto;
                }

                .modal-content {
                    background: #1A1E37;
                    border-radius: 24px;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    padding: 40px;
                    max-width: 700px;
                    width: 100%;
                    max-height: 90vh;
                    overflow-y: auto;
                    animation: slideUp 0.3s ease;
                    box-shadow: 0 0 60px rgba(255, 107, 107, 0.05);
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes fadeInModal {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }

                .modal-header h2 {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 1.5rem;
                }

                .modal-close {
                    background: none;
                    border: none;
                    color: #A8B2D1;
                    font-size: 1.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .modal-close:hover {
                    color: #FF6B6B;
                    transform: rotate(90deg);
                }

                /* Review Modal Specific Styles */
                .review-form .rating-selector {
                    display: flex;
                    gap: 10px;
                    margin: 10px 0 20px 0;
                }

                .review-form .rating-selector button {
                    font-size: 2rem;
                    background: none;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    opacity: 0.3;
                }

                .review-form .rating-selector button.active {
                    opacity: 1;
                    transform: scale(1.1);
                }

                .review-form .rating-selector button:hover {
                    transform: scale(1.2);
                }

                .review-form .form-group {
                    margin-bottom: 18px;
                }

                .review-form label {
                    display: block;
                    margin-bottom: 6px;
                    color: #FFD93D;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .review-form label .required {
                    color: #FF6B6B;
                    margin-left: 3px;
                }

                .review-form input,
                .review-form textarea {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 107, 107, 0.18);
                    border-radius: 10px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .review-form input:focus,
                .review-form textarea:focus {
                    outline: none;
                    border-color: #FFD93D;
                    box-shadow: 0 0 20px rgba(255, 217, 61, 0.08);
                    background: rgba(255, 217, 61, 0.04);
                }

                .review-form textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .review-form .submit-review-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .review-form .submit-review-btn:hover:not(:disabled) {
                    transform: scale(1.02);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);
                }

                .review-form .submit-review-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                /* Request Form Styles */
                .request-form .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .request-form .form-group {
                    margin-bottom: 18px;
                }

                .request-form .form-group.full-width {
                    grid-column: 1 / -1;
                }

                .request-form label {
                    display: block;
                    margin-bottom: 6px;
                    color: #FFD93D;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .request-form label .required {
                    color: #FF6B6B;
                    margin-left: 3px;
                }

                .request-form input,
                .request-form select,
                .request-form textarea {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 107, 107, 0.18);
                    border-radius: 10px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .request-form input:focus,
                .request-form select:focus,
                .request-form textarea:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.08);
                    background: rgba(255, 107, 107, 0.04);
                }

                .request-form textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .submit-btn {
                    width: 100%;
                    padding: 14px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 10px;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: scale(1.02);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .error-message {
                    color: #FF6B6B;
                    padding: 12px;
                    background: rgba(255, 107, 107, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    margin-bottom: 15px;
                }

                .success-message {
                    color: #6BCB77;
                    padding: 12px;
                    background: rgba(107, 203, 119, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(107, 203, 119, 0.2);
                    margin-bottom: 15px;
                }

                .no-requests {
                    text-align: center;
                    padding: 60px 20px;
                    color: #A8B2D1;
                    grid-column: 1 / -1;
                }

                .no-requests .no-icon {
                    font-size: 4rem;
                    display: block;
                    margin-bottom: 15px;
                }

                .no-requests h3 {
                    color: #FFD93D;
                    margin-bottom: 10px;
                }

                .loading-spinner {
                    text-align: center;
                    padding: 60px 20px;
                    color: #A8B2D1;
                    grid-column: 1 / -1;
                }

                .loading-spinner .spinner {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 10px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
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
                @media (max-width: 768px) {
                    .client-container {
                        padding: 80px 20px 20px;
                    }
                    .client-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                    .request-stats {
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }
                    .requests-grid {
                        grid-template-columns: 1fr;
                    }
                    .request-details {
                        grid-template-columns: 1fr;
                    }
                    .request-form .form-row {
                        grid-template-columns: 1fr;
                    }
                    .modal-content {
                        padding: 25px;
                    }
                    .client-header h1 {
                        font-size: 2rem;
                    }
                    .notification-dropdown {
                        width: 320px;
                        right: -50px;
                    }
                    .developer-detail-modal .modal-content {
                        padding: 25px;
                    }
                }

                @media (max-width: 480px) {
                    .client-container {
                        padding: 70px 15px 15px;
                    }
                    .request-stats {
                        grid-template-columns: 1fr 1fr;
                        gap: 10px;
                    }
                    .request-stat-card {
                        padding: 15px;
                    }
                    .request-stat-card .stat-number {
                        font-size: 1.5rem;
                    }
                    .request-card {
                        padding: 18px;
                    }
                    .modal-content {
                        padding: 20px;
                    }
                    .new-request-btn {
                        padding: 10px 20px;
                        font-size: 0.9rem;
                    }
                    .notification-dropdown {
                        width: 290px;
                        right: -60px;
                    }
                    .developer-detail-modal .modal-content {
                        padding: 20px;
                    }
                }
            `}</style>

            <div className="client-container">
                <div className="client-header">
                    <div>
                        <h1>📋 Service Requests</h1>
                        <p>Submit and track your service requests</p>
                        {user && userData && (
                            <div className="welcome-text">
                                👤 Welcome, {userData?.name || user.displayName || user.email}
                            </div>
                        )}
                        {!user && authChecked && (
                            <div className="welcome-text" style={{ color: '#FF6B6B' }}>
                                ⚠️ Please login to submit requests
                            </div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="notification-container">
                            <button 
                                className="bell-icon" 
                                onClick={() => setShowNotifications(!showNotifications)}
                            >
                                🔔
                                {unreadCount > 0 && (
                                    <span className="badge">{unreadCount}</span>
                                )}
                            </button>
                            {showNotifications && (
                                <div className="notification-dropdown">
                                    <div className="notification-header">
                                        <h3>📬 Notifications</h3>
                                        {notifications.length > 0 && (
                                            <button className="mark-all-btn" onClick={markAllAsRead}>
                                                Mark all as read
                                            </button>
                                        )}
                                    </div>
                                    {notifications.length === 0 ? (
                                        <div className="notification-empty">
                                            <span className="empty-icon">🔕</span>
                                            <p>No notifications yet</p>
                                            <p style={{ fontSize: '0.8rem', color: '#666' }}>
                                                You'll be notified when your requests are updated
                                            </p>
                                        </div>
                                    ) : (
                                        notifications.map((notification) => (
                                            <div 
                                                key={notification.id} 
                                                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                                onClick={() => handleNotificationClick(notification.id)}
                                            >
                                                <span className="notification-icon">
                                                    {getNotificationIcon(notification.newStatus)}
                                                </span>
                                                <div className="notification-content">
                                                    <p className="message">{notification.message}</p>
                                                    <p className="time">
                                                        {notification.timestamp.toLocaleString()}
                                                    </p>
                                                    <span 
                                                        className="status-badge"
                                                        style={{
                                                            background: getStatusBadge(notification.newStatus).color + '20',
                                                            color: getStatusBadge(notification.newStatus).color,
                                                            border: `1px solid ${getStatusBadge(notification.newStatus).color}40`
                                                        }}
                                                    >
                                                        {getStatusBadge(notification.newStatus).label}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                        <button className="refresh-btn" onClick={refreshData}>
                            🔄 Refresh
                        </button>
                        <button
                            className="new-request-btn"
                            onClick={() => {
                                if (!user) {
                                    alert('⚠️ Please login to submit a request.');
                                    return;
                                }
                                setEditingRequest(null);
                                setShowForm(true);
                            }}
                            disabled={!user}
                            style={{ opacity: !user ? 0.6 : 1, cursor: !user ? 'not-allowed' : 'pointer' }}
                        >
                            ➕ New Service Request
                        </button>
                    </div>
                </div>

                {successMessage && <div className="success-message">{successMessage}</div>}
                {errorMessage && <div className="error-message">{errorMessage}</div>}

                <div className="request-stats">
                    <div className="request-stat-card">
                        <span className="stat-icon">📋</span>
                        <div className="stat-number">{clientRequests.length}</div>
                        <div className="stat-label">Total Requests</div>
                    </div>
                    <div className="request-stat-card">
                        <span className="stat-icon">⏳</span>
                        <div className="stat-number">
                            {clientRequests.filter(r => r.status === 'pending').length}
                        </div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="request-stat-card">
                        <span className="stat-icon">🔄</span>
                        <div className="stat-number">
                            {clientRequests.filter(r => r.status === 'in-progress').length}
                        </div>
                        <div className="stat-label">In Progress</div>
                    </div>
                    <div className="request-stat-card">
                        <span className="stat-icon">✅</span>
                        <div className="stat-number">
                            {clientRequests.filter(r => r.status === 'completed' || r.status === 'approved').length}
                        </div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>

                <div className="requests-grid">
                    {isFetching ? (
                        <div className="loading-spinner">
                            <span className="spinner">⏳</span>
                            <p>Loading your requests...</p>
                        </div>
                    ) : clientRequests.length > 0 ? (
                        clientRequests.map((request) => {
                            const statusInfo = getStatusBadge(request.status);
                            const priorityInfo = getPriorityBadge(request.priority);
                            const canReview = request.status === 'completed' || request.status === 'approved';
                            const hasReviewed = request.reviews?.some(r => r.userId === user?.uid);
                            const displayReviews = request.reviews || [];
                            const assignedDevs = request.assignedDevelopers || [];
                            
                            return (
                                <div key={request.id} className="request-card">
                                    <div className="request-card-header">
                                        <span className="request-service">
                                            {serviceTypes.find(s => s.value === request.serviceType)?.label || request.serviceType || 'Service'}
                                        </span>
                                        <span className="request-status" style={{
                                            backgroundColor: statusInfo.color + '20',
                                            color: statusInfo.color,
                                            border: `1px solid ${statusInfo.color}40`
                                        }}>
                                            {statusInfo.label}
                                        </span>
                                    </div>

                                    <div className="request-description">{request.description}</div>

                                    <div className="request-details">
                                        <div className="request-detail-item">
                                            <span className="detail-icon">📅</span>
                                            {request.scheduleDate}
                                        </div>
                                        {request.scheduleTime && (
                                            <div className="request-detail-item">
                                                <span className="detail-icon">⏰</span>
                                                {request.scheduleTime}
                                            </div>
                                        )}
                                        {request.deadline && (
                                            <div className="request-detail-item">
                                                <span className="detail-icon">⏳</span>
                                                Deadline: {request.deadline}
                                            </div>
                                        )}
                                        <div className="request-detail-item">
                                            <span className="detail-icon">💰</span>
                                            {request.budget || 'Not specified'}
                                        </div>

                                        {/* Assigned Developers Section - Clickable Developer Badges */}
                                        {assignedDevs.length > 0 && (
                                            <div className="assigned-developer-item">
                                                <span className="detail-icon">👨‍💻</span>
                                                <span className="developer-name">Assigned Team:</span>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginLeft: '8px' }}>
                                                    {assignedDevs.map((dev) => (
                                                        <div 
                                                            key={dev.id}
                                                            className="developer-badge"
                                                            onClick={() => openDeveloperDetail(dev)}
                                                            title="Click to view developer details"
                                                        >
                                                            {dev.photo ? (
                                                                <img
                                                                    src={dev.photo}
                                                                    alt={dev.name}
                                                                    className="developer-photo"
                                                                />
                                                            ) : (
                                                                <div 
                                                                    className="developer-avatar"
                                                                    style={{ 
                                                                        background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)'
                                                                    }}
                                                                >
                                                                    {dev.name?.charAt(0) || 'D'}
                                                                </div>
                                                            )}
                                                            <span className="developer-name-text">
                                                                {dev.name}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="request-card-footer">
                                        <span className="request-priority" style={{
                                            backgroundColor: priorityInfo.color + '20',
                                            color: priorityInfo.color
                                        }}>
                                            {priorityInfo.label}
                                        </span>
                                        <div className="request-actions">
                                            <button onClick={() => handleEdit(request)}>✏️ Edit</button>
                                            {canReview && !hasReviewed && (
                                                <button 
                                                    className="review-btn"
                                                    onClick={() => openReviewModal(request)}
                                                >
                                                    ⭐ Review
                                                </button>
                                            )}
                                            {hasReviewed && (
                                                <button 
                                                    className="review-btn"
                                                    style={{ opacity: 0.6, cursor: 'default' }}
                                                    disabled
                                                >
                                                    ✅ Reviewed
                                                </button>
                                            )}
                                            {displayReviews.length > 0 && (
                                                <button 
                                                    className="view-all-reviews-btn"
                                                    onClick={() => openAllReviewsModal(request)}
                                                >
                                                    👁️ View All ({displayReviews.length})
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Review Section */}
                                    <div className="review-section">
                                        {displayReviews.length > 0 ? (
                                            <>
                                                <div className="rating-summary" onClick={() => openAllReviewsModal(request)}>
                                                    <span className="stars">{renderStars(request.averageRating)}</span>
                                                    <span className="rating-text">
                                                        {request.averageRating} ({request.reviewCount} review{request.reviewCount > 1 ? 's' : ''} from all users)
                                                    </span>
                                                </div>
                                                {displayReviews.slice(0, 3).map((review) => (
                                                    <div key={review.id} className="review-item">
                                                        <div className="review-user">
                                                            <div 
                                                                className="review-avatar"
                                                                style={{ 
                                                                    backgroundColor: getUserColor(review.userId || review.id),
                                                                    color: '#fff'
                                                                }}
                                                            >
                                                                {getUserInitial(review.userName || review.userEmail || 'A')}
                                                            </div>
                                                            <span className="review-user-name">
                                                                {review.userName || review.userEmail || 'Anonymous'}
                                                                {review.userId === user?.uid && (
                                                                    <span className="review-user-badge">You</span>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="review-header">
                                                            <span className="review-title">{review.reviewTitle}</span>
                                                            <span className="review-stars">{renderStars(review.rating)}</span>
                                                        </div>
                                                        <div className="review-text">{review.reviewText}</div>
                                                        <span className="review-date">
                                                            {review.createdAt?.seconds 
                                                                ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                                                                    year: 'numeric', 
                                                                    month: 'short', 
                                                                    day: 'numeric' 
                                                                })
                                                                : 'Recently'
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                                {displayReviews.length > 3 && (
                                                    <button 
                                                        className="view-all-btn"
                                                        onClick={() => openAllReviewsModal(request)}
                                                    >
                                                        View all {displayReviews.length} reviews →
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="no-reviews">
                                                {canReview ? '📝 Be the first to review this service!' : '📝 No reviews yet'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="no-requests">
                            <span className="no-icon">📭</span>
                            <h3>No Service Requests Yet</h3>
                            <p>Click "New Service Request" to submit your first request</p>
                            <p style={{ color: '#666', fontSize: '0.8rem', marginTop: '10px' }}>
                                💡 Your User ID: {user?.uid || 'Not logged in'}
                            </p>
                            <p style={{ color: '#FFD93D', fontSize: '0.8rem', marginTop: '5px' }}>
                                🔍 If you have existing requests, click "Refresh" to load them.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Developer Detail Modal */}
            {showDeveloperDetailModal && selectedDeveloperForDetail && (
                <div className="developer-detail-modal" onClick={() => setShowDeveloperDetailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>👨‍💻 Developer Details</h2>
                            <button className="modal-close" onClick={() => setShowDeveloperDetailModal(false)}>✕</button>
                        </div>

                        <div className="developer-profile">
                            {selectedDeveloperForDetail.photo ? (
                                <img
                                    src={selectedDeveloperForDetail.photo}
                                    alt={selectedDeveloperForDetail.name}
                                    className="dev-photo"
                                />
                            ) : (
                                <div 
                                    className="dev-avatar"
                                    style={{ 
                                        background: `linear-gradient(135deg, ${getUserColor(selectedDeveloperForDetail.id)}, #FFD93D)`
                                    }}
                                >
                                    {selectedDeveloperForDetail.name?.charAt(0) || 'D'}
                                </div>
                            )}
                            <h3 className="dev-name">{selectedDeveloperForDetail.name}</h3>
                            <p className="dev-role">{selectedDeveloperForDetail.role || 'Developer'}</p>
                        </div>

                        <div className="developer-info">
                            {selectedDeveloperForDetail.email && (
                                <div className="info-item">
                                    <span className="info-icon">📧</span>
                                    <span className="info-value">{selectedDeveloperForDetail.email}</span>
                                </div>
                            )}
                            {selectedDeveloperForDetail.frontend && (
                                <div className="info-item">
                                    <span className="info-icon">🖥️</span>
                                    <span className="info-value">Frontend: {selectedDeveloperForDetail.frontend}</span>
                                </div>
                            )}
                            {selectedDeveloperForDetail.backend && (
                                <div className="info-item">
                                    <span className="info-icon">⚙️</span>
                                    <span className="info-value">Backend: {selectedDeveloperForDetail.backend}</span>
                                </div>
                            )}
                            {selectedDeveloperForDetail.expertise && selectedDeveloperForDetail.expertise.length > 0 && (
                                <div className="info-item">
                                    <span className="info-icon">🔧</span>
                                    <span className="info-value">Skills: {selectedDeveloperForDetail.expertise.join(', ')}</span>
                                </div>
                            )}
                        </div>

                        {(selectedDeveloperForDetail.github || selectedDeveloperForDetail.linkedin) && (
                            <div className="developer-links">
                                {selectedDeveloperForDetail.github && (
                                    <a
                                        href={selectedDeveloperForDetail.github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="github-link"
                                    >
                                        🐙 GitHub
                                    </a>
                                )}
                                {selectedDeveloperForDetail.linkedin && (
                                    <a
                                        href={selectedDeveloperForDetail.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="linkedin-link"
                                    >
                                        🔗 LinkedIn
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Review Modal - Write a Review */}
            {showReviewModal && selectedRequestForReview && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⭐ Write a Review</h2>
                            <button className="modal-close" onClick={() => setShowReviewModal(false)}>✕</button>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <p style={{ color: '#A8B2D1', fontSize: '0.9rem' }}>
                                Service: <span style={{ color: '#FFD93D' }}>
                                    {serviceTypes.find(s => s.value === selectedRequestForReview.serviceType)?.label || selectedRequestForReview.serviceType}
                                </span>
                            </p>
                            <p style={{ color: '#666', fontSize: '0.8rem' }}>
                                Your review will be visible to all users
                            </p>
                        </div>

                        <form className="review-form" onSubmit={submitReview}>
                            <div className="form-group">
                                <label>Rating <span className="required">*</span></label>
                                <div className="rating-selector">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className={star <= reviewData.rating ? 'active' : ''}
                                            onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        >
                                            {star <= reviewData.rating ? '⭐' : '☆'}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ color: '#A8B2D1', fontSize: '0.85rem' }}>
                                    {reviewData.rating === 1 && '😞 Terrible'}
                                    {reviewData.rating === 2 && '😕 Poor'}
                                    {reviewData.rating === 3 && '😐 Average'}
                                    {reviewData.rating === 4 && '😊 Good'}
                                    {reviewData.rating === 5 && '🤩 Excellent!'}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Review Title <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={reviewData.reviewTitle}
                                    onChange={(e) => setReviewData({ ...reviewData, reviewTitle: e.target.value })}
                                    placeholder="e.g., Amazing Service!"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Your Review <span className="required">*</span></label>
                                <textarea
                                    value={reviewData.reviewText}
                                    onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                                    placeholder="Share your experience with this service..."
                                    required
                                />
                            </div>

                            <button type="submit" className="submit-review-btn" disabled={submittingReview}>
                                {submittingReview ? '⏳ Submitting...' : '📤 Submit Review'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* All Reviews Modal */}
            {showAllReviewsModal && selectedRequestForAllReviews && (
                <div className="modal-overlay" onClick={() => setShowAllReviewsModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>⭐ All Reviews</h2>
                            <button className="modal-close" onClick={() => setShowAllReviewsModal(false)}>✕</button>
                        </div>

                        <div style={{ 
                            marginBottom: '15px', 
                            padding: '10px 15px', 
                            background: 'rgba(255, 217, 61, 0.05)', 
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 217, 61, 0.1)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '1.2rem' }}>{renderStars(selectedRequestForAllReviews.averageRating)}</span>
                                <span style={{ color: '#FFD93D', fontWeight: 'bold' }}>
                                    {selectedRequestForAllReviews.averageRating} / 5.0
                                </span>
                                <span style={{ color: '#A8B2D1', fontSize: '0.85rem' }}>
                                    ({selectedRequestForAllReviews.reviewCount} reviews from all users)
                                </span>
                            </div>
                            <div style={{ color: '#A8B2D1', fontSize: '0.85rem', marginTop: '5px' }}>
                                Service: {serviceTypes.find(s => s.value === selectedRequestForAllReviews.serviceType)?.label || selectedRequestForAllReviews.serviceType}
                            </div>
                        </div>

                        {selectedRequestForAllReviews.reviews && selectedRequestForAllReviews.reviews.length > 0 ? (
                            selectedRequestForAllReviews.reviews.map((review) => (
                                <div
                                    key={review.id}
                                    className="review-item"
                                    style={{ marginBottom: '12px' }}
                                >
                                    <div className="review-user">
                                        <div 
                                            className="review-avatar"
                                            style={{ 
                                                backgroundColor: getUserColor(review.userId || review.id),
                                                color: '#fff'
                                            }}
                                        >
                                            {getUserInitial(review.userName || review.userEmail || 'A')}
                                        </div>
                                        <span className="review-user-name">
                                            {review.userName || review.userEmail || 'Anonymous'}
                                            {review.userId === user?.uid && (
                                                <span className="review-user-badge">You</span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="review-header">
                                        <span className="review-title">{review.reviewTitle}</span>
                                        <span className="review-stars">{renderStars(review.rating)}</span>
                                    </div>
                                    <div className="review-text">{review.reviewText}</div>
                                    <span className="review-date">
                                        {review.createdAt?.seconds 
                                            ? new Date(review.createdAt.seconds * 1000).toLocaleDateString('en-US', { 
                                                year: 'numeric', 
                                                month: 'short', 
                                                day: 'numeric' 
                                            })
                                            : 'Recently'
                                        }
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#666', padding: '30px 0' }}>
                                No reviews yet
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Request Form Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingRequest ? '✏️ Edit Service Request' : '📝 New Service Request'}</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        <form className="request-form" onSubmit={handleSubmit}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        name="clientName"
                                        value={formData.clientName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="your@email.com"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Service Type <span className="required">*</span></label>
                                    <select
                                        name="serviceType"
                                        value={formData.serviceType}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select a service...</option>
                                        {serviceTypes.map((service) => (
                                            <option key={service.value} value={service.value}>
                                                {service.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group full-width">
                                <label>Service Description <span className="required">*</span></label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    required
                                    placeholder="Describe your service needs in detail..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Schedule Date <span className="required">*</span></label>
                                    <input
                                        type="date"
                                        name="scheduleDate"
                                        value={formData.scheduleDate}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Schedule Time</label>
                                    <input
                                        type="time"
                                        name="scheduleTime"
                                        value={formData.scheduleTime}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Project Deadline</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        value={formData.deadline}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Budget Range</label>
                                    <input
                                        type="text"
                                        name="budget"
                                        value={formData.budget}
                                        onChange={handleChange}
                                        placeholder="e.g., $1,000 - $5,000"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleChange}
                                    >
                                        <option value="Low">🟢 Low</option>
                                        <option value="Medium">🟡 Medium</option>
                                        <option value="High">🔴 High</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Address</label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Street address"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleChange}
                                        placeholder="City"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>State</label>
                                    <input
                                        type="text"
                                        name="state"
                                        value={formData.state}
                                        onChange={handleChange}
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Zip Code</label>
                                    <input
                                        type="text"
                                        name="zipCode"
                                        value={formData.zipCode}
                                        onChange={handleChange}
                                        placeholder="Zip code"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Additional Notes</label>
                                    <input
                                        type="text"
                                        name="additionalNotes"
                                        value={formData.additionalNotes}
                                        onChange={handleChange}
                                        placeholder="Any additional information"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? '⏳ Submitting...' : '📤 Submit Request'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

export default Client;