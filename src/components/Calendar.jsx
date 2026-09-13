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
/* =========================================================
   CALENDAR — Multi-Color Premium Design
   Fonts: Space Grotesk (headings) + Inter (body)
   ========================================================= */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.rainbow-gradient { color: #0F172A; }

/* =========================================================
   MAIN CONTAINER
   ========================================================= */
.calendar-container {
    animation: calFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1);
    padding: 90px 24px 60px;
    max-width: 1280px;
    margin: 0 auto;
    background: #FAFBFF;
    min-height: calc(100vh - 80px);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    position: relative;
    overflow: hidden;
}

@keyframes calFadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Multi-color aura backdrop */
.calendar-container::before {
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
    animation: calAuraBreathe 16s ease-in-out infinite;
}

@keyframes calAuraBreathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.03); opacity: 0.85; }
}

.calendar-container > * { position: relative; z-index: 1; }

/* =========================================================
   HEADER
   ========================================================= */
.calendar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
}

.calendar-header h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.25rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin: 0;
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
    animation: calTitleFlow 10s ease-in-out infinite;
}

@keyframes calTitleFlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

.calendar-nav {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.calendar-nav button {
    padding: 9px 15px;
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

.calendar-nav button:hover {
    background: #F8FAFC;
    border-color: #6366F1;
    color: #6366F1;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.calendar-nav .month-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.125rem;
    font-weight: 700;
    color: #0F172A;
    min-width: 160px;
    text-align: center;
    letter-spacing: -0.02em;
    padding: 0 8px;
}

.admin-actions {
    display: flex;
    gap: 8px;
    align-items: center;
}

.admin-actions button {
    padding: 9px 16px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #EC4899 100%);
    background-size: 200% 200%;
    color: #FFFFFF;
    border: none;
    border-radius: 10px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.8125rem;
    letter-spacing: -0.005em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
}

.admin-actions button:hover {
    transform: translateY(-2px);
    background-position: 100% 50%;
    box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
}

.admin-badge {
    background: linear-gradient(135deg, rgba(255, 107, 107, 0.12), rgba(255, 107, 214, 0.12));
    padding: 5px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255, 107, 107, 0.25);
    color: #BE123C;
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.02em;
    font-family: 'Inter', sans-serif;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

/* =========================================================
   CALENDAR GRID
   ========================================================= */
.calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    padding: 18px;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    position: relative;
    overflow: hidden;
}

/* Rainbow top strip */
.calendar-grid::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: calTitleFlow 8s ease-in-out infinite;
}

.calendar-day-header {
    padding: 12px 6px;
    text-align: center;
    color: #64748B;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border-bottom: 1px solid #F1F5F9;
    margin-bottom: 4px;
}

.calendar-day-header.weekend {
    color: #FF6BD6;
}

/* =========================================================
   DAY CELL
   ========================================================= */
.calendar-day {
    min-height: 105px;
    padding: 10px;
    background: #FFFFFF;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    border: 1px solid #F1F5F9;
    overflow: hidden;
}

/* Rainbow bottom strip on hover */
.calendar-day::before {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s cubic-bezier(0.65, 0, 0.35, 1);
    animation: calTitleFlow 6s ease-in-out infinite;
}

.calendar-day:hover::before {
    transform: scaleX(1);
}

.calendar-day:hover {
    background: #F8FAFC;
    border-color: #CBD5E1;
    transform: translateY(-2px);
    box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.06),
        0 8px 24px rgba(15, 23, 42, 0.04);
}

.calendar-day.empty {
    cursor: default;
    background: transparent;
    border-color: transparent;
}

.calendar-day.empty:hover {
    background: transparent;
    border-color: transparent;
    transform: none;
    box-shadow: none;
}

.calendar-day.empty::before { display: none; }

.calendar-day .day-number {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    color: #334155;
    margin-bottom: 6px;
    font-weight: 600;
    letter-spacing: -0.01em;
    display: inline-flex;
    align-items: center;
    gap: 6px;
}

.calendar-day .day-number.today {
    color: #FFFFFF;
    font-weight: 700;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    width: 28px;
    height: 28px;
    border-radius: 50%;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35);
    animation: todayPulse 2.4s ease-in-out infinite;
}

@keyframes todayPulse {
    0%, 100% { box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35); }
    50% { box-shadow: 0 4px 20px rgba(139, 92, 246, 0.55); }
}

.calendar-day .day-number.weekend {
    color: #BE185D;
}

.calendar-day .day-events {
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 6px;
}

.calendar-day .day-event {
    padding: 4px 8px;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    color: #FFFFFF;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.calendar-day .day-event:hover {
    transform: translateX(2px) scale(1.02);
    box-shadow: 0 3px 10px rgba(15, 23, 42, 0.15);
}

/* Holiday stripe — pastel multi-tone */
.calendar-day .day-event.holiday {
    background: repeating-linear-gradient(
        45deg,
        #FFD93D,
        #FFD93D 4px,
        #FF9F43 4px,
        #FF9F43 8px
    );
    color: #78350F;
    border: 1px solid rgba(255, 159, 67, 0.5);
    font-weight: 600;
}

.calendar-day .day-event.holiday:hover {
    box-shadow: 0 3px 12px rgba(255, 159, 67, 0.4);
}

.calendar-day .day-event.event {
    border-left: 3px solid rgba(255, 255, 255, 0.5);
}

.calendar-day .add-event-hint {
    position: absolute;
    bottom: 6px;
    right: 6px;
    font-size: 0.9rem;
    color: #6366F1;
    opacity: 0;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    transform: scale(0.6);
}

.calendar-day:hover .add-event-hint {
    opacity: 1;
    transform: scale(1);
}

.calendar-day .holiday-indicator {
    position: absolute;
    top: 6px;
    right: 6px;
    font-size: 0.75rem;
    filter: drop-shadow(0 2px 4px rgba(255, 159, 67, 0.4));
    animation: holidayBob 3s ease-in-out infinite;
}

@keyframes holidayBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
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
    animation: messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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
    animation: messageSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes messageSlideIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
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
    max-width: 640px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    animation: modalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.06),
        0 30px 60px rgba(15, 23, 42, 0.18);
    position: relative;
}

/* Rainbow strip on top of every modal */
.modal-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: calTitleFlow 8s ease-in-out infinite;
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
    font-family: inherit;
}

.modal-close:hover {
    color: #0F172A;
    background: #F1F5F9;
    transform: rotate(90deg);
}

/* =========================================================
   EVENT / HOLIDAY FORM
   ========================================================= */
.event-form .form-group {
    margin-bottom: 18px;
}

.event-form label {
    display: block;
    margin-bottom: 8px;
    color: #0F172A;
    font-size: 0.8125rem;
    font-weight: 600;
    font-family: 'Inter', sans-serif;
}

.event-form input,
.event-form select,
.event-form textarea {
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

.event-form input::placeholder,
.event-form textarea::placeholder {
    color: #94A3B8;
}

.event-form input:focus,
.event-form select:focus,
.event-form textarea:focus {
    outline: none;
    border-color: #6366F1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
}

.event-form textarea {
    resize: vertical;
    min-height: 90px;
}

.event-form .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
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
    letter-spacing: -0.005em;
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
   EVENT DETAILS
   ========================================================= */
.event-details {
    color: #0F172A;
    padding: 18px 0;
    border-bottom: 1px solid #F1F5F9;
}

.event-details:last-child { border-bottom: none; }

.event-details .detail-item {
    padding: 10px 0;
    border-bottom: 1px solid #F8FAFC;
    font-size: 0.8125rem;
    color: #475569;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.event-details .detail-item:last-child { border-bottom: none; }

.event-details .detail-item strong {
    color: #0F172A;
    font-weight: 700;
    font-family: 'Space Grotesk', sans-serif;
    display: inline-block;
    min-width: 130px;
    letter-spacing: -0.01em;
}

.event-details .status-badge {
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 0.7rem;
    font-weight: 600;
    display: inline-block;
    letter-spacing: 0.02em;
}

.event-actions {
    display: flex;
    gap: 10px;
    margin-top: 22px;
    flex-wrap: wrap;
}

.event-actions button {
    padding: 10px 18px;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-weight: 600;
    font-size: 0.8125rem;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

.event-actions .delete-btn {
    background: #FFFFFF;
    color: #DC2626;
    border: 1px solid #FECACA;
}

.event-actions .delete-btn:hover {
    background: #FEF2F2;
    border-color: #DC2626;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(220, 38, 38, 0.15);
}

.event-actions .status-btn {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1));
    color: #4F46E5;
    border: 1px solid rgba(99, 102, 241, 0.3);
}

.event-actions .status-btn:hover {
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2));
    border-color: #6366F1;
    color: #4338CA;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.2);
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
    .calendar-container { padding: 80px 20px 40px; }
    .calendar-header h1 { font-size: 1.875rem; }
    .calendar-day { min-height: 90px; }
}

@media (max-width: 768px) {
    .calendar-container { padding: 70px 14px 30px; }
    .calendar-grid { padding: 12px; gap: 4px; border-radius: 16px; }
    .calendar-day { min-height: 72px; padding: 6px; border-radius: 10px; }
    .calendar-day .day-number { font-size: 0.75rem; }
    .calendar-day .day-number.today { width: 22px; height: 22px; }
    .calendar-day .day-event { font-size: 0.6rem; padding: 3px 5px; }
    .calendar-day-header { font-size: 0.65rem; padding: 8px 2px; }
    .event-form .form-row { grid-template-columns: 1fr; }
    .modal-content { padding: 26px; border-radius: 18px; }
    .calendar-nav .month-label { font-size: 1rem; min-width: 120px; }
    .calendar-header h1 { font-size: 1.5rem; }
}

@media (max-width: 480px) {
    .calendar-container { padding: 60px 10px 20px; }
    .calendar-grid { padding: 8px; gap: 3px; border-radius: 14px; }
    .calendar-day { min-height: 62px; padding: 4px; border-radius: 8px; }
    .calendar-day .day-number { font-size: 0.6875rem; margin-bottom: 4px; }
    .calendar-day .day-number.today { width: 20px; height: 20px; font-size: 0.65rem; }
    .calendar-day .day-event { font-size: 0.55rem; padding: 2px 4px; border-radius: 4px; }
    .calendar-day-header { font-size: 0.6rem; padding: 6px 1px; }
    .modal-content { padding: 22px; border-radius: 16px; }
    .calendar-header h1 { font-size: 1.25rem; }
    .calendar-header { gap: 12px; }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */
@media (prefers-reduced-motion: reduce) {
    .calendar-container,
    .calendar-container::before,
    .calendar-header h1,
    .calendar-grid::before,
    .calendar-day::before,
    .calendar-day .day-number.today,
    .calendar-day .holiday-indicator,
    .error-message,
    .success-message {
        animation: none !important;
    }
    .calendar-day,
    .calendar-day .day-event,
    .calendar-nav button,
    .admin-actions button,
    .modal-content,
    .submit-btn,
    .event-actions button {
        transition: none !important;
    }
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