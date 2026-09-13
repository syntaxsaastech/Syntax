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
/* =========================================================
   CLIENT PAGE — Multi-Color Premium Design
   Fonts: Space Grotesk (headings) + Inter (body)
   ========================================================= */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

/* =========================================================
   PAGE
   ========================================================= */
.client-container {
    animation: clientFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    min-height: 100vh;
    padding: 100px 40px 60px;
    max-width: 1400px;
    margin: 0 auto;
    background: #FAFBFF;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    position: relative;
    overflow: hidden;
}

@keyframes clientFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Multi-color aura backdrop */
.client-container::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
        radial-gradient(circle at 8% 6%, rgba(255, 107, 107, 0.09) 0%, transparent 42%),
        radial-gradient(circle at 92% 12%, rgba(255, 107, 214, 0.08) 0%, transparent 42%),
        radial-gradient(circle at 50% 98%, rgba(77, 150, 255, 0.09) 0%, transparent 45%),
        radial-gradient(circle at 15% 75%, rgba(107, 203, 119, 0.07) 0%, transparent 42%),
        radial-gradient(circle at 85% 80%, rgba(255, 217, 61, 0.07) 0%, transparent 42%);
    pointer-events: none;
    z-index: 0;
    animation: clientAuraBreathe 16s ease-in-out infinite;
}

@keyframes clientAuraBreathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.03); opacity: 0.85; }
}

.client-container > * { position: relative; z-index: 1; }

/* =========================================================
   HEADER
   ========================================================= */
.client-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 36px;
    flex-wrap: wrap;
    gap: 20px;
}

.client-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin: 0 0 8px 0;
    background: linear-gradient(
        120deg,
        #FF6B6B 0%,
        #FFD93D 25%,
        #6BCB77 50%,
        #4D96FF 75%,
        #FF6BD6 100%
    );
    background-size: 220% 220%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: clientTitleFlow 10s ease-in-out infinite;
}

@keyframes clientTitleFlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

.client-header p {
    color: #64748B;
    font-size: 0.9375rem;
    margin: 0;
    font-family: 'Inter', sans-serif;
}

.welcome-text {
    color: #4B5563;
    font-size: 0.8125rem;
    margin-top: 10px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    background: rgba(99, 102, 241, 0.06);
    border: 1px solid rgba(99, 102, 241, 0.15);
    border-radius: 999px;
    font-weight: 500;
}

/* =========================================================
   HEADER ACTION BUTTONS
   ========================================================= */
.refresh-btn {
    padding: 10px 18px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    color: #334155;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.refresh-btn:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.new-request-btn {
    padding: 11px 22px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
    background-size: 200% 200%;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Grotesk', sans-serif;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.new-request-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    background-position: 100% 50%;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.new-request-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =========================================================
   STATS — multi-color accent cards
   ========================================================= */
.request-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    margin-bottom: 36px;
}

.request-stat-card {
    background: #FFFFFF;
    padding: 26px 22px;
    border-radius: 18px;
    border: 1px solid #E2E8F0;
    text-align: left;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    position: relative;
    overflow: hidden;
    isolation: isolate;
}

/* Colored top strip per stat card */
.request-stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.request-stat-card:hover::after {
    transform: scaleX(1);
}

/* Colored glow behind card */
.request-stat-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 18px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: blur(18px);
}

.request-stat-card:hover::before { opacity: 0.28; }

/* Card 1 — Total (coral) */
.request-stat-card:nth-child(1)::after { background: linear-gradient(90deg, #FF6B6B, #FF9F43); }
.request-stat-card:nth-child(1)::before { background: radial-gradient(circle, #FF6B6B, transparent 70%); }

/* Card 2 — Pending (yellow) */
.request-stat-card:nth-child(2)::after { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
.request-stat-card:nth-child(2)::before { background: radial-gradient(circle, #FFD93D, transparent 70%); }

/* Card 3 — In Progress (blue) */
.request-stat-card:nth-child(3)::after { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
.request-stat-card:nth-child(3)::before { background: radial-gradient(circle, #4D96FF, transparent 70%); }

/* Card 4 — Completed (green) */
.request-stat-card:nth-child(4)::after { background: linear-gradient(90deg, #6BCB77, #A3FF33); }
.request-stat-card:nth-child(4)::before { background: radial-gradient(circle, #6BCB77, transparent 70%); }

.request-stat-card:hover {
    border-color: #CBD5E1;
    transform: translateY(-6px);
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 24px 48px rgba(15, 23, 42, 0.10);
}

.request-stat-card .stat-icon {
    font-size: 1.875rem;
    display: block;
    margin-bottom: 10px;
}

.request-stat-card .stat-number {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    background: linear-gradient(135deg, #0F172A, #334155);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

/* Colored numbers per card */
.request-stat-card:nth-child(1) .stat-number { background: linear-gradient(135deg, #FF6B6B, #FF9F43); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.request-stat-card:nth-child(2) .stat-number { background: linear-gradient(135deg, #F59E0B, #FF9F43); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.request-stat-card:nth-child(3) .stat-number { background: linear-gradient(135deg, #4D96FF, #5AF0DC); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.request-stat-card:nth-child(4) .stat-number { background: linear-gradient(135deg, #6BCB77, #A3FF33); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.request-stat-card .stat-label {
    color: #64748B;
    font-size: 0.75rem;
    margin-top: 6px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 500;
}

/* =========================================================
   REQUESTS GRID
   ========================================================= */
.requests-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
    gap: 22px;
}

/* =========================================================
   REQUEST CARD — colored accent
   ========================================================= */
.request-card {
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    padding: 24px;
    transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    isolation: isolate;
}

/* Colored top strip on hover */
.request-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    z-index: 3;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.request-card:hover::after { transform: scaleX(1); }

/* Colored glow */
.request-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 20px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: blur(20px);
}

.request-card:hover::before { opacity: 0.25; }

/* Colored accents by position */
.request-card:nth-child(1)::after { background: linear-gradient(90deg, #FF6B6B, #FF9F43); }
.request-card:nth-child(1)::before { background: radial-gradient(circle, #FF6B6B, transparent 70%); }
.request-card:nth-child(2)::after { background: linear-gradient(90deg, #FF6BD6, #FF6B9D); }
.request-card:nth-child(2)::before { background: radial-gradient(circle, #FF6BD6, transparent 70%); }
.request-card:nth-child(3)::after { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
.request-card:nth-child(3)::before { background: radial-gradient(circle, #4D96FF, transparent 70%); }
.request-card:nth-child(4)::after { background: linear-gradient(90deg, #6BCB77, #A3FF33); }
.request-card:nth-child(4)::before { background: radial-gradient(circle, #6BCB77, transparent 70%); }
.request-card:nth-child(5)::after { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
.request-card:nth-child(5)::before { background: radial-gradient(circle, #FFD93D, transparent 70%); }
.request-card:nth-child(6)::after { background: linear-gradient(90deg, #FF9F43, #FF6B6B); }
.request-card:nth-child(6)::before { background: radial-gradient(circle, #FF9F43, transparent 70%); }
.request-card:nth-child(7)::after { background: linear-gradient(90deg, #8C7AFF, #FF6BD6); }
.request-card:nth-child(7)::before { background: radial-gradient(circle, #8C7AFF, transparent 70%); }
.request-card:nth-child(8)::after { background: linear-gradient(90deg, #5AF0DC, #4D96FF); }
.request-card:nth-child(8)::before { background: radial-gradient(circle, #5AF0DC, transparent 70%); }

.request-card:hover {
    transform: translateY(-6px);
    border-color: #CBD5E1;
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 24px 48px rgba(15, 23, 42, 0.10);
}

.request-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
    gap: 10px;
}

.request-service {
    color: #0F172A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.0625rem;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.request-status {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    white-space: nowrap;
    font-family: 'Inter', sans-serif;
}

.request-description {
    color: #64748B;
    font-size: 0.8125rem;
    line-height: 1.65;
    margin-bottom: 16px;
    font-family: 'Inter', sans-serif;
}

.request-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-bottom: 16px;
}

.request-detail-item {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #475569;
    font-size: 0.75rem;
    font-family: 'Inter', sans-serif;
}

/* =========================================================
   ASSIGNED DEVELOPERS
   ========================================================= */
.assigned-developer-item {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #475569;
    font-size: 0.75rem;
    grid-column: 1 / -1;
    border-top: 1px solid #F1F5F9;
    padding-top: 12px;
    margin-top: 4px;
    flex-wrap: wrap;
}

.assigned-developer-item .developer-name {
    color: #0F172A;
    font-weight: 600;
}

.assigned-developer-item .developer-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #F8FAFC;
    padding: 4px 12px 4px 4px;
    border-radius: 999px;
    border: 1px solid #E2E8F0;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.assigned-developer-item .developer-badge:hover {
    background: #FFFFFF;
    border-color: #6366F1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.assigned-developer-item .developer-photo {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid #E2E8F0;
}

.assigned-developer-item .developer-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 600;
    color: #FFFFFF;
    flex-shrink: 0;
}

.assigned-developer-item .developer-name-text {
    color: #334155;
    font-size: 0.75rem;
    font-weight: 500;
}

/* =========================================================
   CARD FOOTER + ACTIONS
   ========================================================= */
.request-priority {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.request-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #F1F5F9;
    flex-wrap: wrap;
    gap: 10px;
}

.request-date {
    color: #94A3B8;
    font-size: 0.75rem;
}

.request-actions {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
}

.request-actions button {
    padding: 6px 14px;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
    background: #FFFFFF;
    color: #334155;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.request-actions button:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.12);
}

.request-actions .review-btn {
    border-color: #FDE68A;
    background: #FFFBEB;
    color: #B45309;
}

.request-actions .review-btn:hover {
    background: #FEF3C7;
    border-color: #F59E0B;
    color: #92400E;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}

.request-actions .view-all-reviews-btn {
    border-color: #BFDBFE;
    background: #EFF6FF;
    color: #1D4ED8;
}

.request-actions .view-all-reviews-btn:hover {
    background: #DBEAFE;
    border-color: #3B82F6;
    color: #1E40AF;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

/* =========================================================
   REVIEW SECTION
   ========================================================= */
.review-section {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid #F1F5F9;
}

.review-section .rating-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: opacity 0.2s ease;
}

.review-section .rating-summary:hover { opacity: 0.75; }

.review-section .rating-summary .stars {
    font-size: 0.9375rem;
    color: #F59E0B;
}

.review-section .rating-summary .rating-text {
    color: #64748B;
    font-size: 0.75rem;
}

.review-item {
    background: #F8FAFC;
    padding: 14px 16px;
    border-radius: 12px;
    margin-bottom: 10px;
    border: 1px solid #F1F5F9;
    transition: all 0.25s ease;
    animation: reviewIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes reviewIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.review-item:hover {
    border-color: #E2E8F0;
    background: #FFFFFF;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
}

.review-item .review-user {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
}

.review-item .review-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.75rem;
    color: #FFFFFF;
    flex-shrink: 0;
    font-family: 'Space Grotesk', sans-serif;
}

.review-item .review-user-name {
    color: #0F172A;
    font-weight: 600;
    font-size: 0.8125rem;
    display: flex;
    align-items: center;
    gap: 6px;
}

.review-item .review-user-badge {
    font-size: 0.65rem;
    padding: 2px 8px;
    border-radius: 999px;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    color: #FFFFFF;
    font-weight: 600;
    letter-spacing: 0.02em;
}

.review-item .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
    gap: 8px;
}

.review-item .review-title {
    color: #0F172A;
    font-size: 0.8125rem;
    font-weight: 700;
    font-family: 'Space Grotesk', sans-serif;
}

.review-item .review-stars {
    color: #F59E0B;
    font-size: 0.75rem;
    white-space: nowrap;
}

.review-item .review-text {
    color: #475569;
    font-size: 0.75rem;
    margin: 6px 0 0 0;
    line-height: 1.6;
}

.review-item .review-date {
    color: #94A3B8;
    font-size: 0.6875rem;
    margin-top: 6px;
    display: block;
}

.review-section .no-reviews {
    color: #94A3B8;
    font-size: 0.75rem;
    text-align: center;
    padding: 14px 0;
}

.review-section .view-all-btn {
    display: block;
    width: 100%;
    padding: 9px;
    margin-top: 10px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    color: #334155;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.2s ease;
    text-align: center;
    font-family: 'Inter', sans-serif;
}

.review-section .view-all-btn:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
}

/* =========================================================
   NOTIFICATION BELL
   ========================================================= */
.notification-container {
    position: relative;
    display: inline-block;
}

.bell-icon {
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.25s ease;
    padding: 10px 12px;
    border-radius: 10px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    color: #334155;
    position: relative;
    font-family: inherit;
    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.bell-icon:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.bell-icon .badge {
    position: absolute;
    top: -6px;
    right: -6px;
    background: linear-gradient(135deg, #FF6B6B, #FF6BD6);
    color: #FFFFFF;
    border-radius: 999px;
    padding: 2px 7px;
    font-size: 0.65rem;
    font-weight: 700;
    min-width: 20px;
    text-align: center;
    border: 2px solid #FAFBFF;
    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.4);
    animation: bellBadgePulse 1.8s ease-in-out infinite;
}

@keyframes bellBadgePulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.1); }
}

.notification-dropdown {
    position: absolute;
    top: 56px;
    right: 0;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 16px;
    width: 380px;
    max-height: 460px;
    overflow-y: auto;
    z-index: 9999;
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 20px 48px rgba(15, 23, 42, 0.14);
    animation: notificationSlideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    overflow-x: hidden;
}

/* Rainbow strip on top of dropdown */
.notification-dropdown::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: clientTitleFlow 8s ease-in-out infinite;
    z-index: 4;
}

@keyframes notificationSlideDown {
    from { opacity: 0; transform: translateY(-10px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px 14px;
    border-bottom: 1px solid #F1F5F9;
    margin-top: 3px;
}

.notification-header h3 {
    color: #0F172A;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.notification-header .mark-all-btn {
    background: none;
    border: none;
    color: #6366F1;
    cursor: pointer;
    font-size: 0.75rem;
    font-weight: 500;
    transition: color 0.2s ease;
    font-family: 'Inter', sans-serif;
}

.notification-header .mark-all-btn:hover {
    color: #4F46E5;
    text-decoration: underline;
}

.notification-item {
    padding: 14px 20px;
    border-bottom: 1px solid #F8FAFC;
    cursor: pointer;
    transition: background 0.2s ease;
    display: flex;
    align-items: flex-start;
    gap: 12px;
}

.notification-item:hover { background: #F8FAFC; }

.notification-item.unread {
    background: linear-gradient(90deg, rgba(99, 102, 241, 0.04), transparent);
    border-left: 3px solid #6366F1;
}

.notification-item.read { opacity: 0.65; }

.notification-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
}

.notification-content { flex: 1; }

.notification-content .message {
    color: #0F172A;
    font-size: 0.8125rem;
    margin: 0 0 6px 0;
    line-height: 1.45;
    font-weight: 500;
}

.notification-content .time {
    color: #94A3B8;
    font-size: 0.6875rem;
    margin: 0;
}

.notification-item .status-badge {
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 600;
    display: inline-block;
    margin-top: 8px;
    letter-spacing: 0.02em;
}

.notification-empty {
    padding: 40px 24px;
    text-align: center;
    color: #94A3B8;
}

.notification-empty .empty-icon {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 12px;
    opacity: 0.6;
}

.notification-empty p {
    font-size: 0.8125rem;
    margin: 4px 0;
}

/* =========================================================
   MODALS
   ========================================================= */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    overflow-y: auto;
    animation: modalFadeIn 0.25s ease;
}

@keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.modal-content {
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    padding: 36px;
    max-width: 720px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 30px 60px rgba(15, 23, 42, 0.18);
    position: relative;
}

.modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: clientTitleFlow 8s ease-in-out infinite;
    border-radius: 20px 20px 0 0;
}

@keyframes modalSlideUp {
    from { opacity: 0; transform: translateY(24px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
}

.modal-header h2 {
    color: #0F172A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
}

.modal-close {
    background: none;
    border: none;
    color: #64748B;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.2s ease;
    line-height: 1;
}

.modal-close:hover {
    color: #0F172A;
    background: #F1F5F9;
    transform: rotate(90deg);
}

/* =========================================================
   REVIEW FORM
   ========================================================= */
.review-form .rating-selector {
    display: flex;
    gap: 8px;
    margin: 10px 0 18px 0;
}

.review-form .rating-selector button {
    font-size: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease;
    opacity: 0.35;
    line-height: 1;
}

.review-form .rating-selector button.active {
    opacity: 1;
    transform: scale(1.08);
}

.review-form .rating-selector button:hover { transform: scale(1.15); }

.review-form .form-group { margin-bottom: 18px; }

.review-form label {
    display: block;
    margin-bottom: 8px;
    color: #0F172A;
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
}

.review-form label .required {
    color: #DC2626;
    margin-left: 2px;
}

.review-form input,
.review-form textarea {
    width: 100%;
    padding: 12px 16px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    color: #0F172A;
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.review-form input::placeholder,
.review-form textarea::placeholder { color: #94A3B8; }

.review-form input:focus,
.review-form textarea:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.review-form textarea {
    resize: vertical;
    min-height: 110px;
}

.review-form .submit-review-btn {
    width: 100%;
    padding: 12px 20px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
    background-size: 200% 200%;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 10px;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.review-form .submit-review-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    background-position: 100% 50%;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.review-form .submit-review-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =========================================================
   REQUEST FORM
   ========================================================= */
.request-form .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
}

.request-form .form-group { margin-bottom: 18px; }
.request-form .form-group.full-width { grid-column: 1 / -1; }

.request-form label {
    display: block;
    margin-bottom: 8px;
    color: #0F172A;
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
}

.request-form label .required {
    color: #DC2626;
    margin-left: 2px;
}

.request-form input,
.request-form select,
.request-form textarea {
    width: 100%;
    padding: 12px 16px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    color: #0F172A;
    font-size: 0.875rem;
    font-family: 'Inter', sans-serif;
    transition: all 0.2s ease;
    box-sizing: border-box;
}

.request-form input::placeholder,
.request-form textarea::placeholder { color: #94A3B8; }

.request-form input:focus,
.request-form select:focus,
.request-form textarea:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.request-form textarea {
    resize: vertical;
    min-height: 110px;
}

.submit-btn {
    width: 100%;
    padding: 12px 20px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
    background-size: 200% 200%;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    margin-top: 10px;
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    background-position: 100% 50%;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.submit-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* =========================================================
   MESSAGES
   ========================================================= */
.error-message {
    color: #B91C1C;
    padding: 12px 16px;
    background: #FEF2F2;
    border-radius: 10px;
    border: 1px solid #FECACA;
    margin-bottom: 18px;
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    animation: messageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.success-message {
    color: #047857;
    padding: 12px 16px;
    background: #ECFDF5;
    border-radius: 10px;
    border: 1px solid #A7F3D0;
    margin-bottom: 18px;
    font-size: 0.8125rem;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    animation: messageIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes messageIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}

/* =========================================================
   EMPTY / LOADING
   ========================================================= */
.no-requests {
    text-align: center;
    padding: 80px 24px;
    color: #64748B;
    grid-column: 1 / -1;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 20px;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    position: relative;
    overflow: hidden;
    animation: clientFadeIn 0.7s ease;
}

.no-requests::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: clientTitleFlow 8s ease-in-out infinite;
}

.no-requests .no-icon {
    font-size: 3.5rem;
    display: block;
    margin-bottom: 16px;
    opacity: 0.7;
    animation: noIconBob 3.5s ease-in-out infinite;
}

@keyframes noIconBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.no-requests h3 {
    color: #0F172A;
    margin-bottom: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.01em;
}

.no-requests p {
    font-size: 0.8125rem;
    margin: 6px 0;
    font-family: 'Inter', sans-serif;
}

.loading-spinner {
    text-align: center;
    padding: 60px 20px;
    color: #64748B;
    grid-column: 1 / -1;
}

.loading-spinner .spinner {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 12px;
    animation: spin 1.2s linear infinite;
    filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.25));
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* =========================================================
   DEVELOPER DETAIL MODAL
   ========================================================= */
.developer-detail-modal {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: modalFadeIn 0.25s ease;
}

.developer-detail-modal .modal-content {
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    padding: 36px;
    max-width: 460px;
    width: 100%;
    animation: modalSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 30px 60px rgba(15, 23, 42, 0.18);
}

.developer-detail-modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 22px;
}

.developer-detail-modal .modal-header h2 {
    color: #0F172A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0;
}

.developer-detail-modal .modal-close {
    background: none;
    border: none;
    color: #64748B;
    font-size: 1.25rem;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 8px;
    transition: all 0.2s ease;
    line-height: 1;
}

.developer-detail-modal .modal-close:hover {
    color: #0F172A;
    background: #F1F5F9;
    transform: rotate(90deg);
}

.developer-detail-modal .developer-profile {
    text-align: center;
    margin-bottom: 22px;
}

.developer-detail-modal .developer-profile .dev-photo {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #FFFFFF;
    margin-bottom: 14px;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.15);
}

.developer-detail-modal .developer-profile .dev-avatar {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    color: #FFFFFF;
    margin: 0 auto 14px auto;
    border: 3px solid #FFFFFF;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.15);
}

.developer-detail-modal .developer-profile .dev-name {
    color: #0F172A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: -0.02em;
}

.developer-detail-modal .developer-profile .dev-role {
    color: #6366F1;
    font-size: 0.8125rem;
    margin: 6px 0 0 0;
    font-weight: 500;
    letter-spacing: 0.02em;
}

.developer-detail-modal .developer-info {
    border-top: 1px solid #F1F5F9;
    padding-top: 16px;
}

.developer-detail-modal .developer-info .info-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    color: #334155;
    font-size: 0.8125rem;
    font-family: 'Inter', sans-serif;
}

.developer-detail-modal .developer-info .info-item .info-icon {
    font-size: 1rem;
    width: 24px;
    text-align: center;
}

.developer-detail-modal .developer-info .info-item .info-value {
    color: #0F172A;
    word-break: break-all;
    font-weight: 500;
}

.developer-detail-modal .developer-links {
    display: flex;
    gap: 10px;
    margin-top: 18px;
    justify-content: center;
}

.developer-detail-modal .developer-links a {
    padding: 9px 20px;
    border-radius: 10px;
    text-decoration: none;
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    border: 1px solid #E2E8F0;
    background: #FFFFFF;
    color: #334155;
}

.developer-detail-modal .developer-links a:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.15);
}

/* =========================================================
   SCROLLBAR
   ========================================================= */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #F1F5F9; }
::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #4D96FF, #FF6BD6);
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 992px) {
    .client-container { padding: 90px 24px 40px; }
    .request-stats { grid-template-columns: repeat(2, 1fr); }
    .requests-grid { grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); }
}

@media (max-width: 768px) {
    .client-container { padding: 80px 20px 30px; }
    .client-header { flex-direction: column; align-items: flex-start; }
    .client-header h1 { font-size: 1.875rem; }
    .request-stats { grid-template-columns: 1fr 1fr; gap: 14px; }
    .request-stat-card { padding: 20px 16px; }
    .request-stat-card .stat-number { font-size: 1.75rem; }
    .requests-grid { grid-template-columns: 1fr; }
    .request-details { grid-template-columns: 1fr; }
    .request-form .form-row { grid-template-columns: 1fr; }
    .modal-content { padding: 26px; border-radius: 18px; }
    .notification-dropdown { width: 340px; right: -40px; }
    .developer-detail-modal .modal-content { padding: 26px; }
}

@media (max-width: 480px) {
    .client-container { padding: 70px 16px 20px; }
    .client-header h1 { font-size: 1.5rem; }
    .request-stats { grid-template-columns: 1fr 1fr; gap: 10px; }
    .request-stat-card { padding: 16px 12px; border-radius: 14px; }
    .request-stat-card .stat-number { font-size: 1.5rem; }
    .request-stat-card .stat-icon { font-size: 1.5rem; }
    .request-card { padding: 18px; border-radius: 16px; }
    .modal-content { padding: 22px; border-radius: 16px; }
    .new-request-btn { padding: 10px 16px; font-size: 0.8125rem; }
    .refresh-btn { padding: 9px 14px; font-size: 0.75rem; }
    .notification-dropdown { width: 300px; right: -50px; }
    .developer-detail-modal .modal-content { padding: 22px; }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */
@media (prefers-reduced-motion: reduce) {
    .client-container,
    .client-container::before,
    .client-header h1,
    .bell-icon .badge,
    .no-requests .no-icon,
    .loading-spinner .spinner,
    .review-item {
        animation: none !important;
    }
    .request-card,
    .request-stat-card,
    .request-actions button,
    .refresh-btn,
    .new-request-btn,
    .modal-content,
    .notification-dropdown,
    .developer-detail-modal .modal-content {
        transition: none !important;
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