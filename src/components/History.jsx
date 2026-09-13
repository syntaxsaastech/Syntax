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
   HISTORY PAGE — CLERK STYLE + PREMIUM ANIMATIONS
   ============================================ */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

.history-wrapper {
    min-height: 100vh;
    padding: 80px 20px;
    background: #FAFAFA;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    position: relative;
    overflow: hidden;
    color: #111827;
}

/* Subtle grid pattern background */
.history-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
}

/* ============================================
   FLOATING ORBS — animated pastel gradients
   ============================================ */
.orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(110px);
    opacity: 0.55;
    pointer-events: none;
    animation: orbFloat 22s ease-in-out infinite;
    z-index: 0;
    will-change: transform;
}

.orb-1 { width: 380px; height: 380px; background: radial-gradient(circle, #C7D2FE 0%, transparent 70%); top: -100px; right: -100px; animation-delay: 0s; }
.orb-2 { width: 320px; height: 320px; background: radial-gradient(circle, #FBCFE8 0%, transparent 70%); bottom: -60px; left: -80px; animation-delay: -6s; }
.orb-3 { width: 260px; height: 260px; background: radial-gradient(circle, #A7F3D0 0%, transparent 70%); top: 45%; left: 40%; animation-delay: -12s; }
.orb-4 { width: 300px; height: 300px; background: radial-gradient(circle, #FED7AA 0%, transparent 70%); top: 15%; right: 10%; animation-delay: -4s; }
.orb-5 { width: 220px; height: 220px; background: radial-gradient(circle, #DDD6FE 0%, transparent 70%); bottom: 20%; right: 15%; animation-delay: -15s; }

@keyframes orbFloat {
    0%, 100% { transform: translate(0, 0) scale(1); }
    25% { transform: translate(60px, -50px) scale(1.12); }
    50% { transform: translate(-50px, 60px) scale(0.9); }
    75% { transform: translate(40px, 30px) scale(1.06); }
}

/* ============================================
   HEADER
   ============================================ */
.history-header {
    text-align: center;
    margin-bottom: 72px;
    position: relative;
    z-index: 1;
}

.page-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2.75rem;
    font-weight: 700;
    color: #000000;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin: 0 0 12px 0;
    position: relative;
    display: inline-block;
    animation: titleFadeIn 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes titleFadeIn {
    from { opacity: 0; transform: translateY(-14px); letter-spacing: 0.05em; }
    to { opacity: 1; transform: translateY(0); letter-spacing: -0.03em; }
}

/* Animated underline that sweeps in */
.page-title::after {
    content: '';
    position: absolute;
    bottom: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #6366F1, #EC4899, transparent);
    border-radius: 2px;
    animation: titleLine 1.4s cubic-bezier(0.65, 0, 0.35, 1) 0.3s forwards;
}

@keyframes titleLine {
    0% { width: 0; opacity: 0; }
    60% { width: 70%; opacity: 1; }
    100% { width: 60%; opacity: 1; }
}

.history-subtitle {
    font-family: 'Inter', sans-serif;
    color: #6B7280;
    font-size: 0.95rem;
    letter-spacing: 0.01em;
    margin: 22px 0 0 0;
    animation: subtitleReveal 1s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
}

@keyframes subtitleReveal {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
}

/* ============================================
   TIMELINE BASE
   ============================================ */
.timeline {
    position: relative;
    padding: 40px 0;
    max-width: 1040px;
    margin: 0 auto;
    z-index: 1;
}

/* Vertical line with animated gradient sweep */
.timeline::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 2px;
    height: 100%;
    background: linear-gradient(180deg,
        transparent 0%,
        #D1D5DB 12%,
        #A5B4FC 50%,
        #D1D5DB 88%,
        transparent 100%
    );
    background-size: 100% 200%;
    animation: linePulse 4s ease-in-out infinite,
               lineFlow 8s linear infinite;
}

@keyframes linePulse {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
}

@keyframes lineFlow {
    0% { background-position: 0 0; }
    100% { background-position: 0 200%; }
}

/* Moving beam dot */
.timeline::after {
    content: '';
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 10px;
    height: 10px;
    background: #6366F1;
    border-radius: 50%;
    box-shadow:
        0 0 12px rgba(99, 102, 241, 0.6),
        0 0 24px rgba(99, 102, 241, 0.35);
    animation: dotMove 9s cubic-bezier(0.65, 0, 0.35, 1) infinite;
    z-index: 3;
}

@keyframes dotMove {
    0%, 100% { top: 0; opacity: 0.8; }
    50% { top: calc(100% - 10px); opacity: 1; }
}

/* ============================================
   TIMELINE ITEMS
   ============================================ */
.timeline-item {
    display: flex;
    align-items: center;
    margin-bottom: 76px;
    position: relative;
    opacity: 0;
    transform: translateY(50px);
    transition: all 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

.timeline-item.visible {
    opacity: 1;
    transform: translateY(0);
}

.timeline-item:nth-child(odd) { flex-direction: row; }
.timeline-item:nth-child(even) { flex-direction: row-reverse; }

/* Stagger reveal */
.timeline-item:nth-child(1).visible { transition-delay: 0.05s; }
.timeline-item:nth-child(2).visible { transition-delay: 0.10s; }
.timeline-item:nth-child(3).visible { transition-delay: 0.15s; }
.timeline-item:nth-child(4).visible { transition-delay: 0.20s; }
.timeline-item:nth-child(5).visible { transition-delay: 0.25s; }
.timeline-item:nth-child(6).visible { transition-delay: 0.30s; }

/* ---------- Timeline Icon ---------- */
.timeline-icon {
    width: 76px;
    height: 76px;
    background: #FFFFFF;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.25rem;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2;
    border: 2px solid #E5E7EB;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.03),
        0 4px 12px rgba(0, 0, 0, 0.05);
    overflow: hidden;
}

.timeline-icon img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
    transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.timeline-item:hover .timeline-icon {
    transform: translateX(-50%) scale(1.12) rotate(-4deg);
    border-color: #6366F1;
    box-shadow:
        0 6px 24px rgba(99, 102, 241, 0.20),
        0 12px 40px rgba(99, 102, 241, 0.12);
}

.timeline-item:hover .timeline-icon img {
    transform: scale(1.08);
}

/* Pulsing ring around icon */
.timeline-icon::before {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 2px solid #E5E7EB;
    animation: iconPulse 3s ease-out infinite;
    pointer-events: none;
}

@keyframes iconPulse {
    0% { transform: scale(1); opacity: 0.7; }
    100% { transform: scale(1.45); opacity: 0; }
}

/* Secondary delayed ring for richer effect */
.timeline-icon::after {
    content: '';
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    border: 1px solid #C7D2FE;
    animation: iconPulse 3s ease-out 1.2s infinite;
    pointer-events: none;
}

/* ---------- Timeline Content Card ---------- */
.timeline-content {
    width: 42%;
    padding: 28px 26px;
    background: #FFFFFF;
    border-radius: 14px;
    border: 1px solid #E5E7EB;
    transition:
        transform 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1),
        border-color 0.3s ease;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.03),
        0 1px 6px rgba(0, 0, 0, 0.04);
}

/* Animated top bar that slides in on hover */
.timeline-content::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #6366F1, #EC4899, #F59E0B);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.6s cubic-bezier(0.65, 0, 0.35, 1);
}

.timeline-content:hover::after {
    transform: scaleX(1);
}

.timeline-item:nth-child(odd) .timeline-content { margin-right: auto; }
.timeline-item:nth-child(even) .timeline-content { margin-left: auto; }

/* Soft light sweep overlay */
.timeline-content::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), transparent 60%);
    opacity: 0;
    transition: opacity 0.5s ease;
    pointer-events: none;
}

.timeline-content:hover::before { opacity: 1; }

/* Effect 1: NEON PULSE */
.timeline-item.effect-neon-pulse .timeline-content:hover {
    border-color: #C7D2FE;
    box-shadow:
        0 4px 24px rgba(99, 102, 241, 0.12),
        0 12px 40px rgba(99, 102, 241, 0.08);
    transform: translateY(-8px);
}

/* Effect 2: GLOBE SPIN */
.timeline-item.effect-globe-spin .timeline-icon {
    animation: globeSpin 14s linear infinite;
}

@keyframes globeSpin {
    0% { transform: translateX(-50%) rotate(0deg); }
    100% { transform: translateX(-50%) rotate(360deg); }
}

.timeline-item.effect-globe-spin:hover .timeline-icon {
    animation-play-state: paused;
    transform: translateX(-50%) scale(1.12);
}

.timeline-item.effect-globe-spin .timeline-content:hover {
    transform: translateY(-8px);
    border-color: #C7D2FE;
    box-shadow:
        0 4px 24px rgba(99, 102, 241, 0.12),
        0 12px 40px rgba(99, 102, 241, 0.08);
}

/* Effect 3: DATA WAVE */
.timeline-item.effect-data-wave .timeline-content:hover {
    border-color: #A7F3D0;
    box-shadow:
        0 4px 24px rgba(16, 185, 129, 0.12),
        0 12px 40px rgba(16, 185, 129, 0.08);
    animation: dataWave 1.2s cubic-bezier(0.65, 0, 0.35, 1);
}

@keyframes dataWave {
    0%, 100% { transform: translateY(-8px); }
    25% { transform: translateY(-11px) rotate(-0.3deg); }
    75% { transform: translateY(-5px) rotate(0.3deg); }
}

.data-wave-bg {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: hidden;
    opacity: 0;
    transition: opacity 0.6s ease;
}

.timeline-item.effect-data-wave .timeline-content:hover .data-wave-bg {
    opacity: 0.6;
}

.wave-line {
    position: absolute;
    width: 200%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #10B981, transparent);
    animation: waveLine 3s ease-in-out infinite;
}

@keyframes waveLine {
    0% { transform: translateX(-50%) translateY(0); opacity: 0; }
    30% { opacity: 1; }
    100% { transform: translateX(50%) translateY(24px); opacity: 0; }
}

/* ---------- Year, Title, Text ---------- */
.timeline-year {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.875rem;
    font-weight: 700;
    color: #000000;
    letter-spacing: -0.02em;
    display: inline-block;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
}

.timeline-item:hover .timeline-year {
    color: #6366F1;
}

/* Small gradient dot before year */
.timeline-year::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366F1, #EC4899);
    margin-right: 10px;
    vertical-align: middle;
    transform: translateY(-3px);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.timeline-item:hover .timeline-year::before {
    transform: translateY(-3px) scale(1.6);
}

.timeline-content h3 {
    font-family: 'Space Grotesk', sans-serif;
    color: #000000;
    margin: 10px 0 8px;
    font-size: 1.1875rem;
    font-weight: 600;
    position: relative;
    z-index: 1;
    transition: color 0.3s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    letter-spacing: -0.015em;
    line-height: 1.35;
}

.timeline-content:hover h3 {
    color: #111827;
    transform: translateX(3px);
}

.timeline-content p {
    color: #6B7280;
    line-height: 1.7;
    font-size: 0.875rem;
    position: relative;
    z-index: 1;
    margin: 0;
    transition: color 0.3s ease;
}

.timeline-content:hover p { color: #4B5563; }

/* ---------- Badge ---------- */
.timeline-badge {
    display: inline-block;
    padding: 5px 12px;
    border-radius: 999px;
    font-family: 'Inter', sans-serif;
    font-size: 0.7rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background: #F3F4F6;
    color: #4B5563;
    border: 1px solid #E5E7EB;
    margin-top: 14px;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    z-index: 1;
}

.timeline-content:hover .timeline-badge {
    background: #111827;
    color: #FFFFFF;
    border-color: #111827;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(17, 24, 39, 0.15);
}

/* ============================================
   EMPTY STATE
   ============================================ */
.history-empty {
    text-align: center;
    padding: 80px 20px;
    color: #6B7280;
    position: relative;
    z-index: 1;
    background: #FFFFFF;
    border: 1px solid #E5E7EB;
    border-radius: 14px;
    max-width: 480px;
    margin: 0 auto;
    box-shadow:
        0 1px 2px rgba(0, 0, 0, 0.03),
        0 1px 6px rgba(0, 0, 0, 0.04);
    animation: emptyEnter 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes emptyEnter {
    from { opacity: 0; transform: translateY(20px) scale(0.96); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.history-empty .empty-icon {
    font-size: 3.5rem;
    display: block;
    margin-bottom: 16px;
    opacity: 0.55;
    animation: emptyBob 3.5s ease-in-out infinite;
}

@keyframes emptyBob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
}

.history-empty h3 {
    font-family: 'Space Grotesk', sans-serif;
    color: #000000;
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: -0.01em;
}

.history-empty p {
    font-size: 0.875rem;
    color: #6B7280;
    line-height: 1.6;
    margin: 0;
}

/* ============================================
   LOADING STATE
   ============================================ */
.history-loading {
    text-align: center;
    padding: 80px 20px;
    color: #6B7280;
    position: relative;
    z-index: 1;
    font-size: 0.875rem;
}

.history-loading .loading-spinner {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 12px;
    animation: spin 1.2s linear infinite;
    filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.2));
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* ============================================
   SCROLLBAR
   ============================================ */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #FAFAFA; }
::-webkit-scrollbar-thumb {
    background: #D1D5DB;
    border-radius: 3px;
    transition: background 0.3s ease;
}
::-webkit-scrollbar-thumb:hover { background: #9CA3AF; }

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 992px) {
    .page-title { font-size: 2.25rem; }
    .history-subtitle { font-size: 0.9rem; }
    .timeline { max-width: 900px; }
}

@media (max-width: 768px) {
    .history-wrapper { padding: 50px 15px; }
    .history-header { margin-bottom: 50px; }
    .page-title { font-size: 1.875rem; }
    .history-subtitle { font-size: 0.85rem; }

    .timeline::before { left: 20px; }
    .timeline::after { left: 20px; width: 8px; height: 8px; }

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
        width: 52px;
        height: 52px;
        font-size: 1.75rem;
    }

    .timeline-item:hover .timeline-icon { transform: scale(1.08); }

    .timeline-content {
        width: 100%;
        padding: 22px 20px;
    }

    .timeline-item:nth-child(odd) .timeline-content,
    .timeline-item:nth-child(even) .timeline-content { margin: 0; }

    .timeline-year { font-size: 1.5rem; }
    .timeline-content h3 { font-size: 1.0625rem; }
    .timeline-content p { font-size: 0.8125rem; }
    .timeline-icon::before,
    .timeline-icon::after { display: none; }
}

@media (max-width: 480px) {
    .history-wrapper { padding: 40px 14px; }
    .page-title { font-size: 1.5rem; }
    .history-subtitle { font-size: 0.75rem; }
    .timeline-item { padding-left: 50px; margin-bottom: 40px; }
    .timeline-icon { width: 44px; height: 44px; font-size: 1.4rem; left: 15px; }
    .timeline-content { padding: 18px 16px; border-radius: 12px; }
    .timeline-year { font-size: 1.25rem; }
    .timeline-content h3 { font-size: 0.9375rem; }
    .timeline-content p { font-size: 0.75rem; }
    .timeline-badge { font-size: 0.6rem; padding: 3px 10px; }
    .history-empty { padding: 50px 16px; }
    .history-empty .empty-icon { font-size: 2.5rem; }
}

/* ============================================
   REDUCED MOTION
   ============================================ */
@media (prefers-reduced-motion: reduce) {
    .orb,
    .timeline::before,
    .timeline::after,
    .timeline-icon,
    .timeline-icon::before,
    .timeline-icon::after,
    .data-wave-bg,
    .wave-line,
    .empty-icon,
    .loading-spinner {
        animation: none !important;
    }
    .timeline-item,
    .timeline-content,
    .timeline-icon,
    .timeline-badge {
        transition: none !important;
    }
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