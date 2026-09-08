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

                // Fetch client requests - DIRECT QUERY
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

    // DIRECT FETCH - Get all requests without where clause first to test
    const fetchAllRequests = async (userId) => {
        try {
            setIsFetching(true);
            console.log('🔍 Fetching ALL requests...');

            // First, get ALL requests to see what's in the collection
            const allQ = query(collection(db, 'clientRequests'), orderBy('createdAt', 'desc'));
            const allSnapshot = await getDocs(allQ);
            const allRequests = [];
            allSnapshot.forEach((doc) => {
                allRequests.push({ id: doc.id, ...doc.data() });
            });
            console.log('📊 ALL requests in collection:', allRequests.length);
            console.log('📋 All request data:', allRequests);

            // Then filter by userId manually
            const filteredRequests = allRequests.filter(req => req.userId === userId);
            console.log('🎯 Filtered requests for user:', filteredRequests.length);

            if (filteredRequests.length > 0) {
                console.log('✅ Found requests:', filteredRequests);
                setClientRequests(filteredRequests);
            } else {
                console.log('⚠️ No requests found for this user');
                setClientRequests([]);
            }

            setIsFetching(false);

            // Also set up real-time listener for future updates
            const q = query(collection(db, 'clientRequests'), orderBy('createdAt', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const updatedRequests = [];
                snapshot.forEach((doc) => {
                    updatedRequests.push({ id: doc.id, ...doc.data() });
                });
                console.log('🔄 Real-time update - Total:', updatedRequests.length);
                // Filter by userId
                const userRequests = updatedRequests.filter(req => req.userId === userId);
                console.log('🔄 Real-time update - User requests:', userRequests.length);
                setClientRequests(userRequests);
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
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                                        </div>
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

            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingRequest ? '✏️ Edit Service Request' : '📝 New Service Request'}</h2>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>

                        {errorMessage && <div className="error-message">{errorMessage}</div>}
                        {successMessage && <div className="success-message">{successMessage}</div>}

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