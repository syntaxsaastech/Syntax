import React, { useState, useEffect } from 'react';
import { auth, db, collection, addDoc, serverTimestamp, query, onSnapshot, orderBy, getDoc, doc, updateDoc, deleteDoc } from '../firebase/config';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [showEventDetails, setShowEventDetails] = useState(null);
    const [showHolidayModal, setShowHolidayModal] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [eventForm, setEventForm] = useState({
        projectName: '',
        clientName: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'scheduled',
        priority: 'Medium',
        location: '',
        notes: '',
        isHoliday: false
    });

    const [holidayForm, setHolidayForm] = useState({
        name: '',
        startDate: '',
        endDate: '',
        description: '',
        type: 'public'
    });

    // Status options
    const statusOptions = ['scheduled', 'in-progress', 'completed', 'cancelled'];
    const priorityOptions = ['Low', 'Medium', 'High'];
    const holidayTypes = ['public', 'company', 'optional', 'religious'];

    // Admin email
    const ADMIN_EMAIL = 'loki@gmail.com';

    // Check if user is admin
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                console.log('User email:', currentUser.email);

                if (currentUser.email === ADMIN_EMAIL) {
                    setIsAdmin(true);
                    console.log('✅ Admin user detected!');
                } else {
                    setIsAdmin(false);
                    console.log('❌ Regular user');
                }
            } else {
                setUser(null);
                setIsAdmin(false);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Fetch events from Firestore
    useEffect(() => {
        try {
            const q = query(
                collection(db, 'calendarEvents'),
                orderBy('startDate', 'asc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const eventsData = [];
                const holidaysData = [];
                snapshot.forEach((doc) => {
                    const data = { id: doc.id, ...doc.data() };
                    if (data.isHoliday) {
                        holidaysData.push(data);
                    } else {
                        eventsData.push(data);
                    }
                });
                setEvents(eventsData);
                setHolidays(holidaysData);
                setError('');
            }, (error) => {
                console.error('Error fetching events:', error);
                setEvents([]);
                setHolidays([]);
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up listener:', error);
            setEvents([]);
            setHolidays([]);
        }
    }, []);

    // Get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        return { daysInMonth, firstDayOfMonth };
    };

    // Navigate months
    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if date has events
    const getEventsForDate = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayEvents = events.filter(event => {
            return event.startDate <= dateStr && event.endDate >= dateStr;
        });
        const dayHolidays = holidays.filter(holiday => {
            return holiday.startDate <= dateStr && holiday.endDate >= dateStr;
        });
        return { events: dayEvents, holidays: dayHolidays };
    };

    // Handle date click
    const handleDateClick = (day) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const { events: dayEvents, holidays: dayHolidays } = getEventsForDate(day);
        const allItems = [...dayEvents, ...dayHolidays];

        if (allItems.length > 0) {
            setShowEventDetails(allItems);
        } else if (isAdmin) {
            setSelectedDate(dateStr);
            setEventForm(prev => ({
                ...prev,
                startDate: dateStr,
                endDate: dateStr,
                projectName: '',
                clientName: '',
                description: '',
                status: 'scheduled',
                priority: 'Medium',
                location: '',
                notes: '',
                isHoliday: false
            }));
            setShowEventModal(true);
        }
    };

    // Handle event form submit
    const handleEventSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        // Validate required fields
        if (!eventForm.projectName || !eventForm.projectName.trim()) {
            setError('❌ Please enter a project name');
            setLoading(false);
            return;
        }
        if (!eventForm.startDate) {
            setError('❌ Please select a start date');
            setLoading(false);
            return;
        }
        if (!eventForm.endDate) {
            setError('❌ Please select an end date');
            setLoading(false);
            return;
        }
        if (eventForm.startDate > eventForm.endDate) {
            setError('❌ Start date cannot be after end date');
            setLoading(false);
            return;
        }

        try {
            const data = {
                projectName: eventForm.projectName.trim(),
                clientName: eventForm.clientName || '',
                description: eventForm.description || '',
                startDate: eventForm.startDate,
                endDate: eventForm.endDate,
                status: eventForm.status || 'scheduled',
                priority: eventForm.priority || 'Medium',
                location: eventForm.location || '',
                notes: eventForm.notes || '',
                isHoliday: false,
                createdBy: user?.uid || 'admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('Saving event:', data);

            const docRef = await addDoc(collection(db, 'calendarEvents'), data);
            console.log('Event saved with ID:', docRef.id);

            setSuccess('✅ Event scheduled successfully!');
            setTimeout(() => {
                setShowEventModal(false);
                resetForms();
                setSuccess('');
            }, 1500);
        } catch (error) {
            console.error('Error adding event:', error);
            setError('❌ Error: ' + error.message);
        }
        setLoading(false);
    };

    // Handle holiday submit
    const handleHolidaySubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        if (!holidayForm.name || !holidayForm.name.trim()) {
            setError('❌ Please enter a holiday name');
            setLoading(false);
            return;
        }
        if (!holidayForm.startDate) {
            setError('❌ Please select a start date');
            setLoading(false);
            return;
        }
        if (!holidayForm.endDate) {
            setError('❌ Please select an end date');
            setLoading(false);
            return;
        }
        if (holidayForm.startDate > holidayForm.endDate) {
            setError('❌ Start date cannot be after end date');
            setLoading(false);
            return;
        }

        try {
            const data = {
                name: holidayForm.name.trim(),
                startDate: holidayForm.startDate,
                endDate: holidayForm.endDate,
                description: holidayForm.description || '',
                type: holidayForm.type || 'public',
                isHoliday: true,
                createdBy: user?.uid || 'admin',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            console.log('Saving holiday:', data);

            const docRef = await addDoc(collection(db, 'calendarEvents'), data);
            console.log('Holiday saved with ID:', docRef.id);

            setSuccess('✅ Holiday added successfully!');
            setTimeout(() => {
                setShowHolidayModal(false);
                setHolidayForm({
                    name: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                    type: 'public'
                });
                setSuccess('');
            }, 1500);
        } catch (error) {
            console.error('Error adding holiday:', error);
            setError('❌ Error: ' + error.message);
        }
        setLoading(false);
    };

    // Handle event delete
    const handleEventDelete = async (eventId) => {
        if (window.confirm('Are you sure you want to delete this?')) {
            try {
                await deleteDoc(doc(db, 'calendarEvents', eventId));
                alert('✅ Deleted successfully!');
                setShowEventDetails(null);
            } catch (error) {
                console.error('Error deleting:', error);
                alert('❌ Error deleting.');
            }
        }
    };

    // Handle event status update
    const handleStatusUpdate = async (eventId, newStatus) => {
        try {
            await updateDoc(doc(db, 'calendarEvents', eventId), {
                status: newStatus,
                updatedAt: serverTimestamp()
            });
            alert(`✅ Status updated to ${newStatus}!`);
            setShowEventDetails(null);
        } catch (error) {
            console.error('Error updating status:', error);
            alert('❌ Error updating status.');
        }
    };

    const resetForms = () => {
        setEventForm({
            projectName: '',
            clientName: '',
            description: '',
            startDate: '',
            endDate: '',
            status: 'scheduled',
            priority: 'Medium',
            location: '',
            notes: '',
            isHoliday: false
        });
        setError('');
        setSuccess('');
    };

    const { daysInMonth, firstDayOfMonth } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('default', { month: 'long' });
    const year = currentDate.getFullYear();

    // Check if date is today
    const isToday = (day) => {
        const today = new Date();
        return day === today.getDate() &&
            currentDate.getMonth() === today.getMonth() &&
            currentDate.getFullYear() === today.getFullYear();
    };

    // Get status color - VIBRANT THEME
    const getStatusColor = (status) => {
        const colors = {
            'scheduled': '#4D96FF',
            'in-progress': '#FFD93D',
            'completed': '#6BCB77',
            'cancelled': '#FF6B6B'
        };
        return colors[status] || '#A8B2D1';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'scheduled': '⏳ Scheduled',
            'in-progress': '🔄 In Progress',
            'completed': '✅ Completed',
            'cancelled': '❌ Cancelled'
        };
        return labels[status] || status;
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 'calc(100vh - 80px)',
                color: '#A8B2D1',
                fontSize: '1.2rem',
                background: '#0A0E27'
            }}>
                ⏳ Loading Calendar...
            </div>
        );
    }

    return (
        <>
            <style>{`
                /* ============================================
                   VIBRANT CALENDAR STYLES
                   ============================================ */
                
                /* Rainbow Gradient */
                .rainbow-gradient {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .calendar-container {
                    animation: fadeInUp 0.8s ease;
                    padding: 20px;
                    max-width: 1200px;
                    margin: 0 auto;
                    background: #0A0E27;
                    min-height: calc(100vh - 80px);
                }

                .calendar-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                    gap: 15px;
                }

                .calendar-header h1 {
                    font-size: 2rem;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 2px;
                    text-shadow: 0 0 40px rgba(255, 107, 107, 0.15);
                }

                .calendar-nav {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    flex-wrap: wrap;
                }

                .calendar-nav button {
                    padding: 8px 20px;
                    background: #1A1E37;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    border-radius: 8px;
                    color: #FFD93D;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .calendar-nav button:hover {
                    background: rgba(255, 107, 107, 0.08);
                    transform: scale(1.05);
                    border-color: #FF6B6B;
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);
                }

                .calendar-nav .month-label {
                    font-size: 1.3rem;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    min-width: 150px;
                    text-align: center;
                    font-weight: bold;
                }

                .admin-actions {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                }

                .admin-actions button {
                    padding: 8px 16px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .admin-actions button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 5px 30px rgba(255, 107, 107, 0.3);
                }

                .admin-badge {
                    background: rgba(255, 107, 107, 0.15);
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 107, 107, 0.25);
                    color: #FF6B6B;
                    font-size: 0.8rem;
                    letter-spacing: 0.5px;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 5px;
                    background: #1A1E37;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    padding: 15px;
                    box-shadow: 0 0 40px rgba(255, 107, 107, 0.03);
                }

                .calendar-day-header {
                    padding: 10px;
                    text-align: center;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-weight: bold;
                    font-size: 0.9rem;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.08);
                }

                .calendar-day-header.weekend {
                    background: linear-gradient(135deg, #FF6BD6 0%, #FF6B6B 30%, #FF6BD6 60%, #FFD93D 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .calendar-day {
                    min-height: 100px;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    border: 1px solid transparent;
                }

                .calendar-day:hover {
                    background: rgba(255, 107, 107, 0.04);
                    transform: scale(1.02);
                    border-color: rgba(255, 107, 107, 0.1);
                }

                .calendar-day.empty {
                    cursor: default;
                    background: transparent;
                    border-color: transparent;
                }

                .calendar-day.empty:hover {
                    transform: none;
                    background: transparent;
                    border-color: transparent;
                }

                .calendar-day .day-number {
                    font-size: 1rem;
                    color: #A8B2D1;
                    margin-bottom: 5px;
                }

                .calendar-day .day-number.today {
                    color: #FFD93D;
                    font-weight: bold;
                    text-shadow: 0 0 20px rgba(255, 217, 61, 0.3);
                }

                .calendar-day .day-number.weekend {
                    color: #FF6BD6;
                }

                .calendar-day .day-events {
                    display: flex;
                    flex-direction: column;
                    gap: 3px;
                    margin-top: 5px;
                }

                .calendar-day .day-event {
                    padding: 3px 6px;
                    border-radius: 4px;
                    font-size: 0.7rem;
                    color: #0A0E27;
                    font-weight: bold;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .calendar-day .day-event:hover {
                    transform: scale(1.05);
                    opacity: 0.9;
                }

                .calendar-day .day-event.holiday {
                    background: repeating-linear-gradient(
                        45deg,
                        #FF6B6B,
                        #FF6B6B 5px,
                        #FFD93D 5px,
                        #FFD93D 10px
                    );
                    color: #0A0E27;
                }

                .calendar-day .day-event.event {
                    border-left: 3px solid #4D96FF;
                }

                .calendar-day .add-event-hint {
                    position: absolute;
                    bottom: 5px;
                    right: 5px;
                    font-size: 1.2rem;
                    opacity: 0;
                    transition: all 0.3s ease;
                }

                .calendar-day:hover .add-event-hint {
                    opacity: 1;
                }

                .calendar-day .holiday-indicator {
                    position: absolute;
                    top: 5px;
                    right: 5px;
                    font-size: 0.8rem;
                    color: #FF6B6B;
                }

                .error-message {
                    color: #FF6B6B;
                    padding: 10px;
                    background: rgba(255, 107, 107, 0.1);
                    border-radius: 8px;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    margin-bottom: 15px;
                }

                .success-message {
                    color: #6BCB77;
                    padding: 10px;
                    background: rgba(107, 203, 119, 0.08);
                    border-radius: 8px;
                    border: 1px solid rgba(107, 203, 119, 0.2);
                    margin-bottom: 15px;
                }

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
                    max-width: 600px;
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

                .event-form .form-group {
                    margin-bottom: 18px;
                }

                .event-form label {
                    display: block;
                    margin-bottom: 6px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .event-form input,
                .event-form select,
                .event-form textarea {
                    width: 100%;
                    padding: 10px 14px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 107, 107, 0.18);
                    border-radius: 10px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .event-form input:focus,
                .event-form select:focus,
                .event-form textarea:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                }

                .event-form textarea {
                    resize: vertical;
                    min-height: 80px;
                }

                .event-form .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
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
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .event-details {
                    color: #E0E0E0;
                }

                .event-details .detail-item {
                    padding: 8px 0;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.05);
                }

                .event-details .detail-item strong {
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    display: inline-block;
                    min-width: 120px;
                }

                .event-details .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    display: inline-block;
                }

                .event-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                    flex-wrap: wrap;
                }

                .event-actions button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }

                .event-actions .delete-btn {
                    background: rgba(255, 107, 107, 0.15);
                    color: #FF6B6B;
                    border: 1px solid rgba(255, 107, 107, 0.3);
                }

                .event-actions .delete-btn:hover {
                    background: rgba(255, 107, 107, 0.25);
                    transform: scale(1.05);
                }

                .event-actions .status-btn {
                    background: rgba(77, 150, 255, 0.15);
                    color: #4D96FF;
                    border: 1px solid rgba(77, 150, 255, 0.3);
                }

                .event-actions .status-btn:hover {
                    background: rgba(77, 150, 255, 0.25);
                    transform: scale(1.05);
                }

                /* Rainbow scrollbar */
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
                    .calendar-container { padding: 10px; }
                    .calendar-grid { padding: 10px; gap: 3px; }
                    .calendar-day { min-height: 70px; padding: 5px; }
                    .calendar-day .day-number { font-size: 0.8rem; }
                    .calendar-day .day-event { font-size: 0.6rem; padding: 2px 4px; }
                    .event-form .form-row { grid-template-columns: 1fr; }
                    .modal-content { padding: 25px; }
                    .calendar-nav .month-label { font-size: 1rem; min-width: 100px; }
                    .calendar-header h1 { font-size: 1.5rem; }
                }

                @media (max-width: 480px) {
                    .calendar-day { min-height: 60px; padding: 3px; }
                    .calendar-day .day-number { font-size: 0.7rem; }
                    .calendar-grid { padding: 5px; gap: 2px; }
                    .calendar-day-header { font-size: 0.7rem; padding: 5px; }
                    .modal-content { padding: 20px; }
                }
            `}</style>

            <div className="calendar-container">
                <div className="calendar-header">
                    <h1>📅 Project Calendar</h1>
                    <div className="calendar-nav">
                        <button onClick={prevMonth}>◀</button>
                        <span className="month-label">{monthName} {year}</span>
                        <button onClick={nextMonth}>▶</button>
                        <button onClick={goToToday} style={{ background: 'rgba(255, 107, 107, 0.08)', borderColor: 'rgba(255, 107, 107, 0.3)' }}>Today</button>
                        {isAdmin ? (
                            <div className="admin-actions">
                                <button onClick={() => setShowHolidayModal(true)}>🎉 Add Holiday</button>
                                <span className="admin-badge">🔐 Admin</span>
                            </div>
                        ) : (
                            <span style={{ color: '#A8B2D1', fontSize: '0.85rem' }}>👤 View Only</span>
                        )}
                    </div>
                </div>

                <div className="calendar-grid">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                        <div key={index} className={`calendar-day-header ${index === 0 || index === 6 ? 'weekend' : ''}`}>
                            {day}
                        </div>
                    ))}

                    {Array.from({ length: firstDayOfMonth }).map((_, index) => (
                        <div key={`empty-${index}`} className="calendar-day empty"></div>
                    ))}

                    {Array.from({ length: daysInMonth }).map((_, index) => {
                        const day = index + 1;
                        const { events: dayEvents, holidays: dayHolidays } = getEventsForDate(day);
                        const isTodayDate = isToday(day);
                        const dateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                        const hasHoliday = dayHolidays.length > 0;

                        return (
                            <div key={day} className="calendar-day" onClick={() => handleDateClick(day)}>
                                <div className={`day-number ${isTodayDate ? 'today' : ''} ${isWeekend ? 'weekend' : ''}`}>
                                    {day}
                                    {hasHoliday && <span className="holiday-indicator">🎉</span>}
                                </div>
                                <div className="day-events">
                                    {dayHolidays.slice(0, 2).map((holiday, idx) => (
                                        <div
                                            key={idx}
                                            className="day-event holiday"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowEventDetails([holiday]);
                                            }}
                                            title={holiday.name}
                                        >
                                            🎉 {holiday.name}
                                        </div>
                                    ))}
                                    {dayEvents.slice(0, 3 - dayHolidays.length).map((event, idx) => (
                                        <div
                                            key={idx}
                                            className="day-event event"
                                            style={{ backgroundColor: getStatusColor(event.status) }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowEventDetails([event]);
                                            }}
                                            title={event.projectName}
                                        >
                                            {event.projectName}
                                        </div>
                                    ))}
                                    {(dayEvents.length + dayHolidays.length) > 3 && (
                                        <div style={{ fontSize: '0.6rem', color: '#666' }}>
                                            +{dayEvents.length + dayHolidays.length - 3} more
                                        </div>
                                    )}
                                </div>
                                {isAdmin && !hasHoliday && (
                                    <div className="add-event-hint">➕</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Event Form Modal */}
            {showEventModal && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 Schedule Project</h2>
                            <button className="modal-close" onClick={() => setShowEventModal(false)}>✕</button>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="event-form" onSubmit={handleEventSubmit}>
                            <div className="form-group">
                                <label>Project Name <span style={{ color: '#FF6B6B' }}>*</span></label>
                                <input
                                    type="text"
                                    value={eventForm.projectName}
                                    onChange={(e) => setEventForm({ ...eventForm, projectName: e.target.value })}
                                    required
                                    placeholder="Enter project name"
                                />
                            </div>

                            <div className="form-group">
                                <label>Client Name</label>
                                <input
                                    type="text"
                                    value={eventForm.clientName}
                                    onChange={(e) => setEventForm({ ...eventForm, clientName: e.target.value })}
                                    placeholder="Client name"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={eventForm.startDate}
                                        onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={eventForm.endDate}
                                        onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Status</label>
                                    <select
                                        value={eventForm.status}
                                        onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                                    >
                                        {statusOptions.map((status) => (
                                            <option key={status} value={status}>{getStatusLabel(status)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={eventForm.priority}
                                        onChange={(e) => setEventForm({ ...eventForm, priority: e.target.value })}
                                    >
                                        {priorityOptions.map((priority) => (
                                            <option key={priority} value={priority}>{priority}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Location</label>
                                <input
                                    type="text"
                                    value={eventForm.location}
                                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                                    placeholder="Location"
                                />
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    value={eventForm.description}
                                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                                    placeholder="Project description"
                                />
                            </div>

                            <div className="form-group">
                                <label>Additional Notes</label>
                                <textarea
                                    value={eventForm.notes}
                                    onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                                    placeholder="Any additional notes"
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? '⏳ Scheduling...' : '📅 Schedule Project'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Holiday Form Modal */}
            {showHolidayModal && isAdmin && (
                <div className="modal-overlay" onClick={() => setShowHolidayModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎉 Add Holiday</h2>
                            <button className="modal-close" onClick={() => setShowHolidayModal(false)}>✕</button>
                        </div>

                        {error && <div className="error-message">{error}</div>}
                        {success && <div className="success-message">{success}</div>}

                        <form className="event-form" onSubmit={handleHolidaySubmit}>
                            <div className="form-group">
                                <label>Holiday Name <span style={{ color: '#FF6B6B' }}>*</span></label>
                                <input
                                    type="text"
                                    value={holidayForm.name}
                                    onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                                    required
                                    placeholder="e.g., New Year's Day"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={holidayForm.startDate}
                                        onChange={(e) => setHolidayForm({ ...holidayForm, startDate: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="date"
                                        value={holidayForm.endDate}
                                        onChange={(e) => setHolidayForm({ ...holidayForm, endDate: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Holiday Type</label>
                                    <select
                                        value={holidayForm.type}
                                        onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value })}
                                    >
                                        {holidayTypes.map((type) => (
                                            <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <input
                                        type="text"
                                        value={holidayForm.description}
                                        onChange={(e) => setHolidayForm({ ...holidayForm, description: e.target.value })}
                                        placeholder="Brief description"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? '⏳ Adding...' : '🎉 Add Holiday'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Details Modal */}
            {showEventDetails && (
                <div className="modal-overlay" onClick={() => setShowEventDetails(null)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📋 Details</h2>
                            <button className="modal-close" onClick={() => setShowEventDetails(null)}>✕</button>
                        </div>

                        {showEventDetails.map((item, index) => (
                            <div key={index} className="event-details">
                                {item.isHoliday ? (
                                    <>
                                        <div className="detail-item">
                                            <strong>🎉 Holiday:</strong> {item.name}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Start Date:</strong> {item.startDate}
                                        </div>
                                        <div className="detail-item">
                                            <strong>End Date:</strong> {item.endDate}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Type:</strong> {item.type || 'Public'}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Description:</strong> {item.description || 'N/A'}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Added:</strong> {item.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                        </div>
                                        {isAdmin && (
                                            <div className="event-actions">
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleEventDelete(item.id)}
                                                >
                                                    🗑️ Delete Holiday
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="detail-item">
                                            <strong>Project:</strong> {item.projectName}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Client:</strong> {item.clientName || 'N/A'}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Start Date:</strong> {item.startDate}
                                        </div>
                                        <div className="detail-item">
                                            <strong>End Date:</strong> {item.endDate}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Priority:</strong> {item.priority}
                                        </div>
                                        <div className="detail-item">
                                            <strong>Status:</strong>{' '}
                                            <span className="status-badge" style={{
                                                backgroundColor: getStatusColor(item.status) + '20',
                                                color: getStatusColor(item.status),
                                                border: `1px solid ${getStatusColor(item.status)}40`
                                            }}>
                                                {getStatusLabel(item.status)}
                                            </span>
                                        </div>
                                        {item.location && (
                                            <div className="detail-item">
                                                <strong>Location:</strong> {item.location}
                                            </div>
                                        )}
                                        {item.description && (
                                            <div className="detail-item">
                                                <strong>Description:</strong> {item.description}
                                            </div>
                                        )}
                                        {item.notes && (
                                            <div className="detail-item">
                                                <strong>Notes:</strong> {item.notes}
                                            </div>
                                        )}
                                        <div className="detail-item">
                                            <strong>Scheduled:</strong> {item.createdAt?.toDate?.()?.toLocaleString() || 'N/A'}
                                        </div>

                                        {isAdmin && (
                                            <div className="event-actions">
                                                <button
                                                    className="status-btn"
                                                    onClick={() => {
                                                        const statuses = ['scheduled', 'in-progress', 'completed', 'cancelled'];
                                                        const currentIndex = statuses.indexOf(item.status);
                                                        const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                                                        handleStatusUpdate(item.id, nextStatus);
                                                    }}
                                                >
                                                    🔄 Change Status
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleEventDelete(item.id)}
                                                >
                                                    🗑️ Delete Event
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

export default Calendar;