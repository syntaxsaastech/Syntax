// src/pages/Service.jsx - Unique grid background per card
import React, { useEffect, useRef, useState } from 'react';

function Service() {
    const [visibleCards, setVisibleCards] = useState([]);
    const cardRefs = useRef([]);
    const containerRef = useRef(null);

    const services = [
        {
            icon: '💻',
            title: 'Software & Web Development',
            description: 'Custom software solutions and web applications tailored to your business needs',
            features: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS'],
            grid: 'grid-diamond',
            color: '#FF6B6B',
            glow: 'rgba(255, 107, 107, 0.35)'
        },
        {
            icon: '📱',
            title: 'Mobile App Development',
            description: 'Native and cross-platform mobile applications with stunning UI/UX',
            features: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift'],
            grid: 'grid-dots',
            color: '#FF6BD6',
            glow: 'rgba(255, 107, 214, 0.35)'
        },
        {
            icon: '☁️',
            title: 'Cloud & SaaS Solutions',
            description: 'Scalable cloud infrastructure and Software-as-a-Service platforms',
            features: ['AWS', 'Firebase', 'MongoDB', 'Docker', 'Kubernetes'],
            grid: 'grid-hex',
            color: '#4D96FF',
            glow: 'rgba(77, 150, 255, 0.35)'
        },
        {
            icon: '🤖',
            title: 'AI & Automation',
            description: 'Intelligent automation and AI-powered solutions for modern businesses',
            features: ['Machine Learning', 'NLP', 'RPA', 'Chatbots', 'Deep Learning'],
            grid: 'grid-triangle',
            color: '#6BCB77',
            glow: 'rgba(107, 203, 119, 0.35)'
        },
        {
            icon: '🎨',
            title: 'UI/UX Design',
            description: 'Beautiful, intuitive, and user-centered design experiences',
            features: ['Figma', 'Adobe XD', 'Prototyping', 'User Testing', 'Canva'],
            grid: 'grid-wave',
            color: '#FFD93D',
            glow: 'rgba(255, 217, 61, 0.35)'
        },
        {
            icon: '🗄️',
            title: 'Backend & Database',
            description: 'Robust backend architecture and database management solutions',
            features: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'GraphQL'],
            grid: 'grid-data',
            color: '#FF9F43',
            glow: 'rgba(255, 159, 67, 0.35)'
        },
        {
            icon: '🏢',
            title: 'Business Solutions',
            description: 'Enterprise-grade business solutions for operational excellence',
            features: ['ERP', 'CRM', 'HRMS', 'Analytics', 'Dashboard'],
            grid: 'grid-isometric',
            color: '#FF6B6B',
            glow: 'rgba(255, 107, 107, 0.35)'
        },
        {
            icon: '🛠️',
            title: 'Maintenance & Support',
            description: '24/7 maintenance, support, and continuous improvement services',
            features: ['Monitoring', 'DevOps', 'Security', 'Updates', '24/7 Support'],
            grid: 'grid-circuit',
            color: '#FFD93D',
            glow: 'rgba(255, 217, 61, 0.35)'
        }
    ];

    // Intersection Observer for staggered card reveal
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const index = parseInt(entry.target.dataset.index);
                        setVisibleCards((prev) => [...new Set([...prev, index])]);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '50px' }
        );

        cardRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, []);

    // Generate random elements per grid type
    const genDots = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
    }));

    const genHexes = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 20,
        delay: Math.random() * 4
    }));

    const genTriangles = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 20 + 12,
        delay: Math.random() * 3
    }));

    const genWaveDots = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
    }));

    const genDataBits = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        char: Math.random() > 0.5 ? '1' : '0',
        duration: Math.random() * 4 + 3,
        delay: Math.random() * 3
    }));

    const genIsoBlocks = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 30 + 20,
        delay: Math.random() * 4
    }));

    const genCircuitNodes = (n) => Array.from({ length: n }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3
    }));

    return (
        <>
           <style>{`
/* =========================================================
   SYNTECH SERVICES — Multi-Color Premium Design
   Fonts: Space Grotesk (headings) + Inter (body)
   ========================================================= */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

/* =========================
   MAIN PAGE — soft multi-color aura
   ========================= */
.service-wrapper {
    min-height: 100vh;
    padding: 80px 24px;
    background: #FAFBFF;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    color: #0F172A;
    position: relative;
    overflow: hidden;
}

.service-wrapper::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 8% 6%, rgba(255, 107, 107, 0.12) 0%, transparent 42%),
        radial-gradient(circle at 92% 12%, rgba(255, 107, 214, 0.10) 0%, transparent 42%),
        radial-gradient(circle at 50% 98%, rgba(77, 150, 255, 0.10) 0%, transparent 45%),
        radial-gradient(circle at 15% 75%, rgba(107, 203, 119, 0.08) 0%, transparent 42%),
        radial-gradient(circle at 85% 80%, rgba(255, 217, 61, 0.08) 0%, transparent 42%);
    pointer-events: none;
    z-index: 0;
    animation: auraBreathe 14s ease-in-out infinite;
}

@keyframes auraBreathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.03); opacity: 0.85; }
}

/* =========================
   HEADER — multi-color gradient title
   ========================= */
.service-header {
    text-align: center;
    margin-bottom: 72px;
    position: relative;
    z-index: 2;
}

.service-title {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.1;
    background: linear-gradient(
        120deg,
        #FF6B6B 0%,
        #FFD93D 22%,
        #6BCB77 42%,
        #4D96FF 62%,
        #FF6BD6 82%,
        #FF6B6B 100%
    );
    background-size: 220% 220%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: titleFlow 10s ease-in-out infinite;
    text-shadow: none;
}

@keyframes titleFlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

.service-subtitle {
    margin: 20px auto 0;
    max-width: 620px;
    font-family: 'Inter', sans-serif;
    font-size: 1rem;
    line-height: 1.65;
    color: #64748B;
    font-weight: 400;
    letter-spacing: 0.005em;
}

/* Rainbow underline */
.service-title::after {
    content: '';
    display: block;
    width: 88px;
    height: 3px;
    margin: 20px auto 0;
    border-radius: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: titleFlow 6s ease-in-out infinite;
}

/* =========================
   SERVICES GRID
   ========================= */
.services-grid {
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
    position: relative;
    z-index: 2;
}

/* =========================
   SERVICE CARD — multi-color variants
   ========================= */
.service-card {
    position: relative;
    min-height: 460px;
    padding: 32px;
    border-radius: 22px;
    overflow: hidden;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    transition:
        transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
        border-color 0.3s ease;
    display: flex;
    flex-direction: column;
    isolation: isolate;
    opacity: 0;
    transform: translateY(30px);
}

.service-card.visible {
    opacity: 1;
    transform: translateY(0);
}

.service-card:hover {
    transform: translateY(-8px) scale(1.005);
    border-color: #CBD5E1;
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.05),
        0 28px 56px rgba(15, 23, 42, 0.12);
}

/* Colored accent strip on top */
.service-card::after {
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

.service-card:hover::after { transform: scaleX(1); }

/* Colored glow behind each card (dynamic via nth-child) */
.service-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: blur(20px);
}

.service-card:hover::before { opacity: 0.35; }

/* ---- Color 1: Coral (Software) ---- */
.service-card:nth-child(1)::after { background: linear-gradient(90deg, #FF6B6B, #FF9F43); }
.service-card:nth-child(1)::before { background: radial-gradient(circle, #FF6B6B, transparent 70%); }

/* ---- Color 2: Pink (Mobile) ---- */
.service-card:nth-child(2)::after { background: linear-gradient(90deg, #FF6BD6, #FF6B9D); }
.service-card:nth-child(2)::before { background: radial-gradient(circle, #FF6BD6, transparent 70%); }

/* ---- Color 3: Blue (Cloud) ---- */
.service-card:nth-child(3)::after { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
.service-card:nth-child(3)::before { background: radial-gradient(circle, #4D96FF, transparent 70%); }

/* ---- Color 4: Green (AI) ---- */
.service-card:nth-child(4)::after { background: linear-gradient(90deg, #6BCB77, #A3FF33); }
.service-card:nth-child(4)::before { background: radial-gradient(circle, #6BCB77, transparent 70%); }

/* ---- Color 5: Yellow (UI/UX) ---- */
.service-card:nth-child(5)::after { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
.service-card:nth-child(5)::before { background: radial-gradient(circle, #FFD93D, transparent 70%); }

/* ---- Color 6: Orange (Backend) ---- */
.service-card:nth-child(6)::after { background: linear-gradient(90deg, #FF9F43, #FF6B6B); }
.service-card:nth-child(6)::before { background: radial-gradient(circle, #FF9F43, transparent 70%); }

/* ---- Color 7: Violet (Business) ---- */
.service-card:nth-child(7)::after { background: linear-gradient(90deg, #8C7AFF, #FF6BD6); }
.service-card:nth-child(7)::before { background: radial-gradient(circle, #8C7AFF, transparent 70%); }

/* ---- Color 8: Teal (Maintenance) ---- */
.service-card:nth-child(8)::after { background: linear-gradient(90deg, #5AF0DC, #4D96FF); }
.service-card:nth-child(8)::before { background: radial-gradient(circle, #5AF0DC, transparent 70%); }

/* =========================
   CARD BACKGROUND LAYER
   ========================= */
.card-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
    opacity: 0.8;
    transition: opacity 0.4s ease;
}

.service-card:hover .card-bg { opacity: 1; }

/* Frosted glass panel over the pattern for readability */
.card-bg::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
        180deg,
        rgba(255, 255, 255, 0.55) 0%,
        rgba(255, 255, 255, 0.85) 55%,
        rgba(255, 255, 255, 0.95) 100%
    );
    pointer-events: none;
}

/* =========================================================
   1) DIAMOND GRID — coral diagonal crosshatch
   ========================================================= */
.grid-diamond {
    background:
        repeating-linear-gradient(45deg, transparent 0, transparent 22px,
            rgba(255, 107, 107, 0.18) 22px, rgba(255, 107, 107, 0.18) 23px),
        repeating-linear-gradient(-45deg, transparent 0, transparent 22px,
            rgba(255, 107, 107, 0.18) 22px, rgba(255, 107, 107, 0.18) 23px);
    animation: diamondShift 24s linear infinite;
}

@keyframes diamondShift {
    from { background-position: 0 0, 0 0; }
    to { background-position: 46px 46px, 46px 46px; }
}

/* =========================================================
   2) DOT GRID — pink halftone dots
   ========================================================= */
.grid-dots {
    background-image: radial-gradient(circle at center, rgba(255, 107, 214, 0.4) 1.4px, transparent 2px);
    background-size: 22px 22px;
    animation: dotDrift 30s linear infinite;
}

@keyframes dotDrift {
    from { background-position: 0 0; }
    to { background-position: 22px 22px; }
}

/* =========================================================
   3) HEX GRID — blue honeycomb
   ========================================================= */
.grid-hex {
    background-image:
        radial-gradient(circle at 50% 50%, rgba(77, 150, 255, 0.22) 1px, transparent 1.6px),
        linear-gradient(30deg, rgba(77, 150, 255, 0.14) 12%, transparent 12.5%, transparent 87%, rgba(77, 150, 255, 0.14) 87.5%),
        linear-gradient(150deg, rgba(77, 150, 255, 0.14) 12%, transparent 12.5%, transparent 87%, rgba(77, 150, 255, 0.14) 87.5%),
        linear-gradient(30deg, rgba(77, 150, 255, 0.14) 12%, transparent 12.5%, transparent 87%, rgba(77, 150, 255, 0.14) 87.5%),
        linear-gradient(150deg, rgba(77, 150, 255, 0.14) 12%, transparent 12.5%, transparent 87%, rgba(77, 150, 255, 0.14) 87.5%),
        linear-gradient(60deg, rgba(77, 150, 255, 0.18) 25%, transparent 25.5%, transparent 75%, rgba(77, 150, 255, 0.18) 75%),
        linear-gradient(60deg, rgba(77, 150, 255, 0.18) 25%, transparent 25.5%, transparent 75%, rgba(77, 150, 255, 0.18) 75%);
    background-size: 40px 70px;
    background-position: 0 0, 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px;
    animation: hexShift 40s linear infinite;
}

@keyframes hexShift {
    from { background-position: 0 0, 0 0, 0 0, 20px 35px, 20px 35px, 0 0, 20px 35px; }
    to { background-position: 40px 70px, 40px 70px, 40px 70px, 60px 105px, 60px 105px, 40px 70px, 60px 105px; }
}

/* =========================================================
   4) TRIANGLE GRID — mint triangles
   ========================================================= */
.grid-triangle {
    background-image:
        linear-gradient(45deg, rgba(107, 203, 119, 0.24) 25%, transparent 25.5%),
        linear-gradient(-45deg, rgba(107, 203, 119, 0.24) 25%, transparent 25.5%),
        linear-gradient(45deg, transparent 75%, rgba(163, 255, 51, 0.16) 75.5%),
        linear-gradient(-45deg, transparent 75%, rgba(163, 255, 51, 0.16) 75.5%);
    background-size: 28px 28px;
    background-position: 0 0, 0 14px, 14px -14px, -14px 0;
    animation: triShift 20s linear infinite;
}

@keyframes triShift {
    from { background-position: 0 0, 0 14px, 14px -14px, -14px 0; }
    to { background-position: 28px 28px, 28px 42px, 42px 14px, 14px 28px; }
}

/* =========================================================
   5) WAVE GRID — gold horizontal waves
   ========================================================= */
.grid-wave {
    background-image: repeating-linear-gradient(
        0deg, transparent 0, transparent 14px,
        rgba(255, 217, 61, 0.35) 14px, rgba(255, 217, 61, 0.35) 16px);
    position: relative;
}

.grid-wave::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 80% 40% at 50% 50%, transparent 40%, rgba(255, 217, 61, 0.25) 100%);
    animation: waveSlide 12s ease-in-out infinite;
}

@keyframes waveSlide {
    0%, 100% { transform: translateX(0) translateY(0); opacity: 0.8; }
    50% { transform: translateX(20px) translateY(-4px); opacity: 1; }
}

/* =========================================================
   6) DATA GRID — orange grid + streaming bits
   ========================================================= */
.grid-data {
    background:
        linear-gradient(rgba(255, 159, 67, 0.20) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 159, 67, 0.20) 1px, transparent 1px);
    background-size: 28px 28px;
    position: relative;
}

.matrix-bit {
    position: absolute;
    top: -20px;
    font-family: 'Space Grotesk', 'Courier New', monospace;
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(255, 159, 67, 0.85);
    letter-spacing: 0.05em;
    animation: bitFall linear infinite;
    pointer-events: none;
    text-shadow: 0 0 8px rgba(255, 159, 67, 0.4);
}

@keyframes bitFall {
    0% { transform: translateY(-20px); opacity: 0; }
    10% { opacity: 1; }
    85% { opacity: 1; }
    100% { transform: translateY(500px); opacity: 0; }
}

/* =========================================================
   7) ISOMETRIC GRID — violet 3D blocks
   ========================================================= */
.grid-isometric {
    background:
        linear-gradient(30deg, rgba(140, 122, 255, 0.18) 12%, transparent 12.5%, transparent 87%, rgba(140, 122, 255, 0.18) 87.5%),
        linear-gradient(150deg, rgba(140, 122, 255, 0.18) 12%, transparent 12.5%, transparent 87%, rgba(140, 122, 255, 0.18) 87.5%);
    background-size: 30px 30px;
    background-position: 0 0, 15px 15px;
    animation: isoShift 35s linear infinite;
}

@keyframes isoShift {
    from { background-position: 0 0, 15px 15px; }
    to { background-position: 30px 30px, 45px 45px; }
}

.iso-block {
    position: absolute;
    background: linear-gradient(135deg, rgba(140, 122, 255, 0.32), rgba(255, 107, 214, 0.16));
    border: 1px solid rgba(140, 122, 255, 0.4);
    transform: rotate(45deg);
    border-radius: 4px;
    animation: isoFloat 8s ease-in-out infinite;
    pointer-events: none;
}

@keyframes isoFloat {
    0%, 100% { transform: rotate(45deg) translateY(0) scale(1); opacity: 0.55; }
    50% { transform: rotate(45deg) translateY(-6px) scale(1.05); opacity: 0.9; }
}

/* =========================================================
   8) CIRCUIT GRID — teal PCB traces + pulsing nodes
   ========================================================= */
.grid-circuit {
    background:
        linear-gradient(rgba(90, 240, 220, 0.18) 1px, transparent 1px),
        linear-gradient(90deg, rgba(90, 240, 220, 0.18) 1px, transparent 1px);
    background-size: 32px 32px;
    position: relative;
}

.grid-circuit::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(90deg, transparent 48%, rgba(90, 240, 220, 0.3) 48%, rgba(90, 240, 220, 0.3) 52%, transparent 52%),
        linear-gradient(0deg, transparent 48%, rgba(90, 240, 220, 0.3) 48%, rgba(90, 240, 220, 0.3) 52%, transparent 52%);
    background-size: 128px 128px;
    animation: circuitPulse 6s ease-in-out infinite;
    pointer-events: none;
}

@keyframes circuitPulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
}

.circuit-node {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: rgba(90, 240, 220, 0.9);
    box-shadow:
        0 0 10px rgba(90, 240, 220, 0.85),
        0 0 20px rgba(90, 240, 220, 0.5);
    animation: nodeBlink 3s ease-in-out infinite;
    pointer-events: none;
}

@keyframes nodeBlink {
    0%, 100% { transform: scale(0.6); opacity: 0.4; }
    50% { transform: scale(1.5); opacity: 1; }
}

/* =========================================================
   CARD CONTENT
   ========================================================= */
.card-content {
    position: relative;
    z-index: 2;
    height: 100%;
    display: flex;
    flex-direction: column;
}

/* =========================
   SERVICE ICON — multi-color gradients
   ========================= */
.service-icon {
    width: 68px;
    height: 68px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 18px;
    font-size: 1.875rem;
    color: #FFFFFF;
    box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.10),
        0 8px 24px rgba(15, 23, 42, 0.06);
    transition:
        transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
        box-shadow 0.35s ease;
    position: relative;
}

/* Icon gradient backgrounds (matching card colors) */
.service-card:nth-child(1) .service-icon { background: linear-gradient(135deg, #FF6B6B, #FF9F43); }
.service-card:nth-child(2) .service-icon { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); }
.service-card:nth-child(3) .service-icon { background: linear-gradient(135deg, #4D96FF, #5AF0DC); }
.service-card:nth-child(4) .service-icon { background: linear-gradient(135deg, #6BCB77, #A3FF33); }
.service-card:nth-child(5) .service-icon { background: linear-gradient(135deg, #FFD93D, #FF9F43); }
.service-card:nth-child(6) .service-icon { background: linear-gradient(135deg, #FF9F43, #FF6B6B); }
.service-card:nth-child(7) .service-icon { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); }
.service-card:nth-child(8) .service-icon { background: linear-gradient(135deg, #5AF0DC, #4D96FF); }

.service-card:hover .service-icon {
    transform: scale(1.1) rotate(-6deg);
    box-shadow:
        0 8px 20px rgba(15, 23, 42, 0.15),
        0 16px 40px rgba(15, 23, 42, 0.10);
}

/* =========================
   CARD TITLE — color-shifts on hover
   ========================= */
.service-card h3 {
    margin: 0 0 12px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.375rem;
    line-height: 1.3;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #0F172A;
    transition: color 0.3s ease, transform 0.3s ease;
}

/* Each card title hovers to its unique color */
.service-card:nth-child(1):hover h3 { color: #FF6B6B; }
.service-card:nth-child(2):hover h3 { color: #FF6BD6; }
.service-card:nth-child(3):hover h3 { color: #4D96FF; }
.service-card:nth-child(4):hover h3 { color: #6BCB77; }
.service-card:nth-child(5):hover h3 { color: #F59E0B; }
.service-card:nth-child(6):hover h3 { color: #FF9F43; }
.service-card:nth-child(7):hover h3 { color: #8C7AFF; }
.service-card:nth-child(8):hover h3 { color: #14B8A6; }

.service-card:hover h3 { transform: translateX(3px); }

/* =========================
   CARD DESCRIPTION
   ========================= */
.service-card p {
    margin: 0 0 22px;
    color: #64748B;
    font-size: 0.9375rem;
    line-height: 1.65;
    font-family: 'Inter', sans-serif;
    font-weight: 400;
}

/* =========================
   FEATURE TAGS — color-tinted
   ========================= */
.service-features,
.feature-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 26px;
}

.feature-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 6px 12px;
    border-radius: 8px;
    background: #F1F5F9;
    border: 1px solid transparent;
    color: #475569;
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}

/* Colored tags per card */
.service-card:nth-child(1) .feature-tag { background: rgba(255, 107, 107, 0.10); color: #C53030; }
.service-card:nth-child(2) .feature-tag { background: rgba(255, 107, 214, 0.10); color: #C026A0; }
.service-card:nth-child(3) .feature-tag { background: rgba(77, 150, 255, 0.10); color: #1E5FCC; }
.service-card:nth-child(4) .feature-tag { background: rgba(107, 203, 119, 0.12); color: #2F855A; }
.service-card:nth-child(5) .feature-tag { background: rgba(255, 217, 61, 0.14); color: #B7791F; }
.service-card:nth-child(6) .feature-tag { background: rgba(255, 159, 67, 0.12); color: #C05621; }
.service-card:nth-child(7) .feature-tag { background: rgba(140, 122, 255, 0.12); color: #6A5ACD; }
.service-card:nth-child(8) .feature-tag { background: rgba(90, 240, 220, 0.14); color: #0E7490; }

.feature-tag:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

/* =========================
   SERVICE BUTTON — multi-color gradient
   ========================= */
.service-btn {
    margin-top: auto;
    width: 100%;
    min-height: 48px;
    border: none;
    border-radius: 12px;
    padding: 12px 20px;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.005em;
    color: #FFFFFF;
    background: #0F172A;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
    transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s ease,
        background 0.3s ease;
    position: relative;
    overflow: hidden;
}

/* Each button matches its card color */
.service-card:nth-child(1) .service-btn { background: linear-gradient(135deg, #FF6B6B, #FF9F43); }
.service-card:nth-child(2) .service-btn { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); }
.service-card:nth-child(3) .service-btn { background: linear-gradient(135deg, #4D96FF, #5AF0DC); }
.service-card:nth-child(4) .service-btn { background: linear-gradient(135deg, #6BCB77, #A3FF33); color: #0F172A; }
.service-card:nth-child(5) .service-btn { background: linear-gradient(135deg, #FFD93D, #FF9F43); color: #0F172A; }
.service-card:nth-child(6) .service-btn { background: linear-gradient(135deg, #FF9F43, #FF6B6B); }
.service-card:nth-child(7) .service-btn { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); }
.service-card:nth-child(8) .service-btn { background: linear-gradient(135deg, #5AF0DC, #4D96FF); }

.service-btn:hover {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow:
        0 8px 20px rgba(15, 23, 42, 0.15),
        0 16px 36px rgba(15, 23, 42, 0.10);
}

.service-btn:active { transform: translateY(0); }

.service-btn:focus-visible {
    outline: 3px solid rgba(99, 102, 241, 0.35);
    outline-offset: 3px;
}

/* =========================================================
   SCROLLBAR — multi-color
   ========================================================= */
.service-wrapper::-webkit-scrollbar { width: 8px; }
.service-wrapper::-webkit-scrollbar-track { background: #F1F5F9; }
.service-wrapper::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
}
.service-wrapper::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #4D96FF, #FF6BD6);
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 1024px) {
    .service-wrapper { padding: 70px 20px; }
    .service-title { font-size: 2.75rem; }
    .services-grid {
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }
}

@media (max-width: 768px) {
    .service-wrapper { padding: 60px 18px; }
    .service-header { margin-bottom: 48px; }
    .service-title { font-size: 2.25rem; }
    .service-subtitle { font-size: 0.9375rem; }
    .services-grid { grid-template-columns: 1fr; gap: 18px; }
    .service-card {
        min-height: auto;
        padding: 28px;
        border-radius: 18px;
    }
    .service-icon {
        width: 58px; height: 58px;
        font-size: 1.625rem;
        margin-bottom: 20px;
    }
    .service-card h3 { font-size: 1.25rem; }
    .service-card p { font-size: 0.9rem; }
}

@media (max-width: 480px) {
    .service-wrapper { padding: 50px 14px; }
    .service-title { font-size: 1.875rem; }
    .service-subtitle { font-size: 0.875rem; line-height: 1.55; }
    .service-card { padding: 24px; border-radius: 16px; }
    .service-icon { width: 52px; height: 52px; font-size: 1.375rem; }
    .service-card h3 { font-size: 1.125rem; }
    .feature-tag { font-size: 0.7rem; padding: 5px 10px; }
    .service-btn { min-height: 44px; font-size: 0.875rem; }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */
@media (prefers-reduced-motion: reduce) {
    .service-wrapper::before,
    .grid-diamond, .grid-dots, .grid-hex, .grid-triangle,
    .grid-wave, .grid-wave::before, .grid-data, .grid-isometric,
    .grid-circuit, .grid-circuit::before,
    .matrix-bit, .iso-block, .circuit-node,
    .service-title, .service-title::after {
        animation: none !important;
    }
    .service-card, .service-icon, .service-btn, .feature-tag,
    .service-card h3, .service-card::after, .service-card::before {
        transition: none !important;
    }
}
`}</style>

            <div className="service-wrapper" ref={containerRef}>
                {/* Header */}
                <div className="service-header">
                    <h1 className="service-title">✦ Premium Services ✦</h1>
                    <p className="service-subtitle">Where Innovation Meets Excellence</p>
                </div>

                {/* Cards Grid */}
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            ref={(el) => (cardRefs.current[index] = el)}
                            data-index={index}
                            className={`service-card ${visibleCards.includes(index) ? 'visible' : ''}`}
                        >
                            {/* ============ UNIQUE GRID BACKGROUND ============ */}

                            {/* 1) DIAMOND GRID */}
                            {service.grid === 'grid-diamond' && (
                                <div className="card-bg grid-diamond" />
                            )}

                            {/* 2) DOT GRID */}
                            {service.grid === 'grid-dots' && (
                                <div className="card-bg grid-dots" />
                            )}

                            {/* 3) HEX GRID */}
                            {service.grid === 'grid-hex' && (
                                <div className="card-bg grid-hex" />
                            )}

                            {/* 4) TRIANGLE GRID */}
                            {service.grid === 'grid-triangle' && (
                                <div className="card-bg grid-triangle" />
                            )}

                            {/* 5) WAVE GRID */}
                            {service.grid === 'grid-wave' && (
                                <div className="card-bg grid-wave" />
                            )}

                            {/* 6) DATA GRID + MATRIX BITS */}
                            {service.grid === 'grid-data' && (
                                <div className="card-bg grid-data">
                                    {genDataBits(15).map((m) => (
                                        <div
                                            key={m.id}
                                            className="matrix-bit"
                                            style={{
                                                left: `${m.left}%`,
                                                animationDuration: `${m.duration}s`,
                                                animationDelay: `${m.delay}s`
                                            }}
                                        >
                                            {m.char}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 7) ISOMETRIC GRID + BLOCKS */}
                            {service.grid === 'grid-isometric' && (
                                <div className="card-bg grid-isometric">
                                    {genIsoBlocks(6).map((b) => (
                                        <div
                                            key={b.id}
                                            className="iso-block"
                                            style={{
                                                left: `${b.x}%`,
                                                top: `${b.y}%`,
                                                width: `${b.size}px`,
                                                height: `${b.size}px`,
                                                animationDelay: `${b.delay}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* 8) CIRCUIT GRID + NODES */}
                            {service.grid === 'grid-circuit' && (
                                <div className="card-bg grid-circuit">
                                    {genCircuitNodes(10).map((n) => (
                                        <div
                                            key={n.id}
                                            className="circuit-node"
                                            style={{
                                                left: `${n.x}%`,
                                                top: `${n.y}%`,
                                                animationDelay: `${n.delay}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* ============ CARD CONTENT ============ */}
                            <div className="card-content">
                                <div className="service-icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                                <div className="service-features">
                                    {service.features.map((feature, idx) => (
                                        <span key={idx} className="feature-tag">
                                            {feature}
                                        </span>
                                    ))}
                                </div>
                                <button className="service-btn">
                                    Explore ⚡
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default Service;