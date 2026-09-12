// src/pages/History.js - COMPLETE FILE + fires from Firestore
import React, { useEffect, useRef, useState } from 'react';
import { db, collection, onSnapshot, query, orderBy } from '../firebase/config';

function History() {
    const [visibleItems, setVisibleItems] = useState([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const itemRefs = useRef([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

    // ============ FIRESTORE HISTORY STATE ============
    const [timeline, setTimeline] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    // ============ FETCH HISTORY FROM FIRESTORE (REAL-TIME) ============
    useEffect(() => {
        try {
            const historyQuery = query(
                collection(db, 'history'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(historyQuery, (snapshot) => {
                try {
                    const items = [];
                    snapshot.forEach((docSnap) => {
                        const data = { id: docSnap.id, ...docSnap.data() };
                        items.push(data);
                    });

                    // Map Firestore items to timeline format expected by JSX
                    const mapped = items.map((item, index) => ({
                        year: item.year || '',
                        title: item.title || '',
                        description: item.description || '',
                        icon: item.icon || '🚀',
                        effect: item.effect || 'neon-pulse',
                        badge: item.badge || '',
                        imageUrl: item.imageUrl || '',
                        color: '#FF6B6B',
                        gradient: 'from-red-400 to-yellow-500'
                    }));

                    setTimeline(mapped);
                    setLoadingHistory(false);
                } catch (error) {
                    console.error('Error processing history items:', error);
                    setLoadingHistory(false);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up history listener:', error);
            setLoadingHistory(false);
        }
    }, []);

    // Mouse tracking for parallax
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePosition({
                x: (e.clientX / window.innerWidth) * 2 - 1,
                y: (e.clientY / window.innerHeight) * 2 - 1
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Intersection Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        setVisibleItems((prev) => [...new Set([...prev, index])]);
                    }
                });
            },
            { threshold: 0.2, rootMargin: '50px' }
        );

        itemRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [timeline]);

    // Get badge text from item or by index fallback
    const getBadge = (item, index) => {
        if (item.badge) return item.badge;
        if (index === 0) return '🚀 Latest';
        if (index === 1) return '🌍 Global';
        return '💼 Enterprise';
    };

    return (
        <>
            <style>{`
                /* ============================================
                   HISTORY PAGE - VIBRANT COLOR SCHEME
                   ============================================ */
                .history-wrapper {
                    min-height: 100vh;
                    padding: 60px 20px;
                    background: #0A0E27;
                    position: relative;
                    overflow: hidden;
                }

                /* Animated Background Particles */
                .history-wrapper::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: 
                        radial-gradient(circle at 30% 40%, rgba(255, 107, 107, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 70% 60%, rgba(255, 217, 61, 0.03) 0%, transparent 50%),
                        radial-gradient(circle at 50% 80%, rgba(107, 203, 119, 0.03) 0%, transparent 50%);
                    animation: bgFloat 15s ease-in-out infinite;
                    pointer-events: none;
                }

                @keyframes bgFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-20px, 20px) scale(1.05); }
                    66% { transform: translate(20px, -20px) scale(0.95); }
                }

                /* Floating Orbs */
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.08;
                    pointer-events: none;
                    animation: orbFloat 20s ease-in-out infinite;
                }

                .orb-1 { width: 400px; height: 400px; background: #FF6B6B; top: -100px; right: -100px; animation-delay: 0s; }
                .orb-2 { width: 300px; height: 300px; background: #FFD93D; bottom: -50px; left: -50px; animation-delay: -7s; }
                .orb-3 { width: 200px; height: 200px; background: #6BCB77; top: 50%; left: 50%; animation-delay: -14s; }
                .orb-4 { width: 250px; height: 250px; background: #4D96FF; top: 20%; right: 20%; animation-delay: -5s; }
                .orb-5 { width: 180px; height: 180px; background: #FF6BD6; bottom: 30%; right: 10%; animation-delay: -10s; }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(80px, -40px) scale(1.1); }
                    50% { transform: translate(-40px, 60px) scale(0.9); }
                    75% { transform: translate(50px, 30px) scale(1.05); }
                }

                /* Header */
                .history-header {
                    text-align: center;
                    margin-bottom: 70px;
                    position: relative;
                    z-index: 1;
                }

                .page-title {
                    font-size: 4.5rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 4s ease-in-out infinite;
                    margin-bottom: 15px;
                    letter-spacing: 5px;
                    position: relative;
                    display: inline-block;
                    text-shadow: 0 0 60px rgba(255, 107, 107, 0.15);
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .page-title::after {
                    content: '';
                    position: absolute;
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, transparent);
                    animation: titleLine 1.5s ease-out forwards;
                }

                @keyframes titleLine {
                    to { width: 70%; }
                }

                .history-subtitle {
                    color: rgba(168, 178, 209, 0.7);
                    font-size: 1.4rem;
                    letter-spacing: 8px;
                    animation: subtitleReveal 1s ease-out 0.3s forwards;
                    opacity: 0;
                }

                @keyframes subtitleReveal {
                    to { opacity: 1; transform: translateY(0); }
                    from { opacity: 0; transform: translateY(30px); }
                }

                /* Timeline Base */
                .timeline {
                    position: relative;
                    padding: 40px 0;
                    max-width: 1100px;
                    margin: 0 auto;
                    z-index: 1;
                }

                /* Animated Timeline Line */
                .timeline::before {
                    content: '';
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 3px;
                    height: 100%;
                    background: linear-gradient(180deg, 
                        transparent 0%, 
                        #FF6B6B 15%, 
                        #FFD93D 35%, 
                        #6BCB77 50%, 
                        #4D96FF 70%, 
                        #FF6BD6 85%, 
                        transparent 100%
                    );
                    box-shadow: 0 0 40px rgba(255, 107, 107, 0.3);
                    animation: linePulse 3s ease-in-out infinite;
                }

                @keyframes linePulse {
                    0%, 100% { opacity: 0.5; transform: translateX(-50%) scaleY(1); }
                    50% { opacity: 1; transform: translateX(-50%) scaleY(1.05); }
                }

                .timeline::after {
                    content: '';
                    position: absolute;
                    left: 50%;
                    top: 0;
                    transform: translateX(-50%);
                    width: 12px;
                    height: 12px;
                    background: #FF6B6B;
                    border-radius: 50%;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.6);
                    animation: dotMove 8s ease-in-out infinite;
                }

                @keyframes dotMove {
                    0%, 100% { top: 0; }
                    50% { top: 100%; }
                }

                /* Timeline Items */
                .timeline-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 80px;
                    position: relative;
                    opacity: 0;
                    transform: translateY(60px) scale(0.95);
                    transition: all 0.8s cubic-bezier(0.23, 1, 0.32, 1);
                }

                .timeline-item.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }

                .timeline-item:nth-child(odd) { flex-direction: row; }
                .timeline-item:nth-child(even) { flex-direction: row-reverse; }

                .timeline-icon {
                    width: 80px;
                    height: 80px;
                    background: #1A1E37;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2.8rem;
                    position: absolute;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 2;
                    border: 2px solid rgba(255, 107, 107, 0.3);
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.15);
                    overflow: hidden;
                }

                .timeline-icon img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }

                .timeline-item:hover .timeline-icon {
                    transform: translateX(-50%) scale(1.2) rotate(10deg);
                    border-color: #FFD93D;
                    box-shadow: 0 0 60px rgba(255, 217, 61, 0.3);
                }

                .timeline-icon::before {
                    content: '';
                    position: absolute;
                    top: -5px;
                    left: -5px;
                    right: -5px;
                    bottom: -5px;
                    border-radius: 50%;
                    border: 2px solid rgba(255, 107, 107, 0.2);
                    animation: iconPulse 2s ease-out infinite;
                }

                @keyframes iconPulse {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.5); opacity: 0; }
                }

                .timeline-content {
                    width: 42%;
                    padding: 35px 30px;
                    background: rgba(26, 30, 55, 0.9);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    border-radius: 25px;
                    border: 1px solid rgba(255, 107, 107, 0.1);
                    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                }

                .timeline-item:nth-child(odd) .timeline-content { margin-right: auto; }
                .timeline-item:nth-child(even) .timeline-content { margin-left: auto; }

                .timeline-content::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.05), transparent);
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }

                .timeline-content:hover::before { opacity: 1; }

                /* Effect 1: NEON PULSE */
                .timeline-item.effect-neon-pulse .timeline-content { border-color: rgba(255, 107, 107, 0.2); }
                .timeline-item.effect-neon-pulse .timeline-content:hover {
                    border-color: #FF6B6B;
                    box-shadow: 0 0 40px rgba(255, 107, 107, 0.2), inset 0 0 40px rgba(255, 107, 107, 0.05);
                    transform: translateY(-10px) scale(1.02);
                }

                /* Effect 2: GLOBE SPIN */
                .timeline-item.effect-globe-spin .timeline-icon {
                    animation: globeSpin 10s linear infinite;
                }

                @keyframes globeSpin {
                    0% { transform: translateX(-50%) rotate(0deg); }
                    100% { transform: translateX(-50%) rotate(360deg); }
                }

                .timeline-item.effect-globe-spin .timeline-content:hover {
                    transform: translateY(-10px) scale(1.02) rotate(1deg);
                    border-color: #4D96FF;
                    box-shadow: 0 0 40px rgba(77, 150, 255, 0.2);
                }

                /* Effect 3: DATA WAVE */
                .timeline-item.effect-data-wave .timeline-content { border-color: rgba(107, 203, 119, 0.2); }
                .timeline-item.effect-data-wave .timeline-content:hover {
                    border-color: #6BCB77;
                    box-shadow: 0 0 40px rgba(107, 203, 119, 0.2);
                    animation: dataWave 1s ease-in-out;
                }

                @keyframes dataWave {
                    0%, 100% { transform: translateY(0); }
                    25% { transform: translateY(-5px) rotate(-0.5deg); }
                    75% { transform: translateY(5px) rotate(0.5deg); }
                }

                .data-wave-bg {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }

                .timeline-item.effect-data-wave .timeline-content:hover .data-wave-bg { opacity: 0.3; }

                .wave-line {
                    position: absolute;
                    width: 200%;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #6BCB77, transparent);
                    animation: waveLine 3s ease-in-out infinite;
                }

                @keyframes waveLine {
                    0% { transform: translateX(-50%) translateY(0); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translateX(50%) translateY(20px); opacity: 0; }
                }

                .timeline-year {
                    font-size: 2.2rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: yearShift 3s ease-in-out infinite;
                    display: inline-block;
                }

                @keyframes yearShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .timeline-content h3 {
                    color: #FFFFFF;
                    margin: 12px 0 10px;
                    font-size: 1.4rem;
                    font-weight: 700;
                    position: relative;
                    z-index: 1;
                    transition: all 0.4s ease;
                }

                .timeline-content:hover h3 {
                    color: #FFD93D;
                    transform: translateX(5px);
                }

                .timeline-content p {
                    color: rgba(168, 178, 209, 0.8);
                    line-height: 1.8;
                    font-size: 1rem;
                    position: relative;
                    z-index: 1;
                    transition: all 0.4s ease;
                }

                .timeline-content:hover p { color: rgba(168, 178, 209, 1); }

                .timeline-badge {
                    display: inline-block;
                    padding: 4px 16px;
                    border-radius: 20px;
                    font-size: 0.7rem;
                    font-weight: 600;
                    letter-spacing: 1px;
                    text-transform: uppercase;
                    background: rgba(255, 107, 107, 0.1);
                    color: #FFD93D;
                    border: 1px solid rgba(255, 107, 107, 0.2);
                    margin-top: 10px;
                    transition: all 0.4s ease;
                    position: relative;
                    z-index: 1;
                }

                .timeline-content:hover .timeline-badge {
                    background: rgba(255, 107, 107, 0.2);
                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.1);
                    color: #FFFFFF;
                }

                /* Empty state */
                .history-empty {
                    text-align: center;
                    padding: 80px 20px;
                    color: #A8B2D1;
                    position: relative;
                    z-index: 1;
                }

                .history-empty .empty-icon {
                    font-size: 5rem;
                    display: block;
                    margin-bottom: 20px;
                    opacity: 0.6;
                }

                .history-empty h3 {
                    color: #FFD93D;
                    font-size: 1.5rem;
                    margin-bottom: 10px;
                }

                .history-empty p {
                    font-size: 1rem;
                    color: #888;
                }

                .history-loading {
                    text-align: center;
                    padding: 80px 20px;
                    color: #A8B2D1;
                    position: relative;
                    z-index: 1;
                }

                .history-loading .loading-spinner {
                    font-size: 3rem;
                    display: block;
                    margin-bottom: 15px;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* Rainbow Scrollbar */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #0A0E27; }
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
                    border-radius: 3px;
                }
                ::-webkit-scrollbar-thumb:hover { background: #FF6B6B; }

                /* Responsive */
                @media (max-width: 992px) {
                    .page-title { font-size: 3.5rem; }
                    .history-subtitle { font-size: 1.2rem; }
                }

                @media (max-width: 768px) {
                    .history-wrapper { padding: 40px 15px; }
                    .page-title { font-size: 2.8rem; letter-spacing: 3px; }
                    .history-subtitle { font-size: 1rem; letter-spacing: 4px; }

                    .timeline::before { left: 20px; }
                    .timeline::after { left: 20px; width: 10px; height: 10px; }

                    .timeline-item {
                        flex-direction: column !important;
                        align-items: flex-start;
                        padding-left: 60px;
                        margin-bottom: 50px;
                        transform: translateX(-20px);
                    }

                    .timeline-item.visible { transform: translateX(0); }

                    .timeline-icon {
                        left: 20px;
                        transform: none;
                        width: 55px;
                        height: 55px;
                        font-size: 2rem;
                    }

                    .timeline-item:hover .timeline-icon { transform: scale(1.1); }

                    .timeline-content { width: 100%; padding: 25px 20px; }

                    .timeline-item:nth-child(odd) .timeline-content,
                    .timeline-item:nth-child(even) .timeline-content { margin: 0; }

                    .timeline-year { font-size: 1.8rem; }
                    .timeline-content h3 { font-size: 1.2rem; }
                    .timeline-content p { font-size: 0.95rem; }
                    .timeline-icon::before { display: none; }
                }

                @media (max-width: 480px) {
                    .page-title { font-size: 2rem; letter-spacing: 2px; }
                    .history-subtitle { font-size: 0.85rem; letter-spacing: 3px; }
                    .timeline-item { padding-left: 50px; margin-bottom: 40px; }
                    .timeline-icon { width: 45px; height: 45px; font-size: 1.6rem; left: 15px; }
                    .timeline-content { padding: 20px 15px; }
                    .timeline-year { font-size: 1.4rem; }
                    .timeline-content h3 { font-size: 1rem; }
                    .timeline-content p { font-size: 0.85rem; }
                    .timeline-badge { font-size: 0.6rem; padding: 3px 12px; }
                }
            `}</style>

            <div className="history-wrapper">
                {/* Floating Orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
                <div className="orb orb-5"></div>

                {/* Header */}
                <div className="history-header">
                    <h1 className="page-title">✦ Our Journey ✦</h1>
                    <p className="history-subtitle">✨ Building the Future, One Milestone at a Time ✨</p>
                </div>

                {/* Loading */}
                {loadingHistory ? (
                    <div className="history-loading">
                        <span className="loading-spinner">⏳</span>
                        <p>Loading our journey...</p>
                    </div>
                ) : timeline.length === 0 ? (
                    /* Empty state */
                    <div className="history-empty">
                        <span className="empty-icon">📜</span>
                        <h3>No milestones yet</h3>
                        <p>Our journey is just beginning. Check back soon for updates!</p>
                    </div>
                ) : (
                    /* Timeline */
                    <div className="timeline">
                        {timeline.map((item, index) => (
                            <div
                                key={item.id || index}
                                ref={(el) => (itemRefs.current[index] = el)}
                                data-index={index}
                                className={`timeline-item effect-${item.effect} ${visibleItems.includes(index) ? 'visible' : ''}`}
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                <div className="timeline-icon">
                                    {item.imageUrl ? (
                                        <img src={item.imageUrl} alt={item.title} />
                                    ) : (
                                        item.icon
                                    )}
                                </div>

                                <div className="timeline-content">
                                    {/* Effect-specific elements */}
                                    {item.effect === 'data-wave' && (
                                        <div className="data-wave-bg">
                                            {Array.from({ length: 3 }, (_, i) => (
                                                <div
                                                    key={i}
                                                    className="wave-line"
                                                    style={{
                                                        top: `${i * 30 + 10}%`,
                                                        animationDelay: `${i * 0.5}s`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="timeline-year">{item.year}</div>
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>
                                    <span className="timeline-badge">
                                        {getBadge(item, index)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

export default History;