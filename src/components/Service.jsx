import React, { useEffect, useRef, useState } from 'react';

function Service() {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [visibleCards, setVisibleCards] = useState([]);
    const cardRefs = useRef([]);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const services = [
        {
            icon: '💻',
            title: 'Software & Web Development',
            description: 'Custom software solutions and web applications tailored to your business needs',
            features: ['React', 'Next.js', 'TypeScript', 'Node.js', 'Tailwind CSS'],
            effect: 'neon-glow',
            color: '#FF6B6B'
        },
        {
            icon: '📱',
            title: 'Mobile App Development',
            description: 'Native and cross-platform mobile applications with stunning UI/UX',
            features: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift'],
            effect: 'particle-rain',
            color: '#FF6BD6'
        },
        {
            icon: '☁️',
            title: 'Cloud & SaaS Solutions',
            description: 'Scalable cloud infrastructure and Software-as-a-Service platforms',
            features: ['AWS', 'Firebase', 'MongoDB', 'Docker', 'Kubernetes'],
            effect: 'wave-distortion',
            color: '#4D96FF'
        },
        {
            icon: '🤖',
            title: 'AI & Automation',
            description: 'Intelligent automation and AI-powered solutions for modern businesses',
            features: ['Machine Learning', 'NLP', 'RPA', 'Chatbots', 'Deep Learning'],
            effect: 'cyber-grid',
            color: '#6BCB77'
        },
        {
            icon: '🎨',
            title: 'UI/UX Design',
            description: 'Beautiful, intuitive, and user-centered design experiences',
            features: ['Figma', 'Adobe XD', 'Prototyping', 'User Testing', 'Canva'],
            effect: 'floating-shapes',
            color: '#FFD93D'
        },
        {
            icon: '🗄️',
            title: 'Backend & Database',
            description: 'Robust backend architecture and database management solutions',
            features: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'GraphQL'],
            effect: 'data-stream',
            color: '#FF9F43'
        },
        {
            icon: '🏢',
            title: 'Business Solutions',
            description: 'Enterprise-grade business solutions for operational excellence',
            features: ['ERP', 'CRM', 'HRMS', 'Analytics', 'Dashboard'],
            effect: 'holographic',
            color: '#FF6B6B'
        },
        {
            icon: '🛠️',
            title: 'Maintenance & Support',
            description: '24/7 maintenance, support, and continuous improvement services',
            features: ['Monitoring', 'DevOps', 'Security', 'Updates', '24/7 Support'],
            effect: 'pulse-ring',
            color: '#FFD93D'
        }
    ];

    // Mouse tracking for parallax
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setMousePosition({
                    x: ((e.clientX - rect.left) / rect.width) * 2 - 1,
                    y: ((e.clientY - rect.top) / rect.height) * 2 - 1
                });
            }
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

    // Generate random particles for particle effect
    const generateParticles = (count) => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            duration: Math.random() * 3 + 2,
            delay: Math.random() * 2
        }));
    };

    return (
        <>
            <style>{`
                /* ============================================
                   SERVICE PAGE - VIBRANT COLOR SCHEME
                   ============================================ */
                .service-wrapper {
                    min-height: 100vh;
                    padding: 60px 20px;
                    background: #0A0E27;
                    position: relative;
                    overflow: hidden;
                }

                /* Animated Gradient Background */
                .service-wrapper::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: 
                        radial-gradient(circle at 20% 50%, rgba(255, 107, 107, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 217, 61, 0.05) 0%, transparent 50%),
                        radial-gradient(circle at 50% 80%, rgba(107, 203, 119, 0.03) 0%, transparent 50%);
                    animation: backgroundRotate 20s linear infinite;
                    pointer-events: none;
                }

                @keyframes backgroundRotate {
                    0% { transform: rotate(0deg) scale(1); }
                    50% { transform: rotate(180deg) scale(1.1); }
                    100% { transform: rotate(360deg) scale(1); }
                }

                /* Floating Orbs */
                .orb {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(100px);
                    opacity: 0.06;
                    pointer-events: none;
                    animation: orbFloat 20s ease-in-out infinite;
                }

                .orb-1 {
                    width: 400px;
                    height: 400px;
                    background: #FF6B6B;
                    top: -100px;
                    right: -100px;
                    animation-delay: 0s;
                }

                .orb-2 {
                    width: 300px;
                    height: 300px;
                    background: #FFD93D;
                    bottom: -50px;
                    left: -50px;
                    animation-delay: -7s;
                }

                .orb-3 {
                    width: 350px;
                    height: 350px;
                    background: #4D96FF;
                    top: 50%;
                    right: 10%;
                    animation-delay: -14s;
                }

                .orb-4 {
                    width: 250px;
                    height: 250px;
                    background: #6BCB77;
                    bottom: 30%;
                    left: 20%;
                    animation-delay: -5s;
                }

                .orb-5 {
                    width: 200px;
                    height: 200px;
                    background: #FF6BD6;
                    top: 20%;
                    left: 30%;
                    animation-delay: -10s;
                }

                @keyframes orbFloat {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    25% { transform: translate(80px, -40px) scale(1.1); }
                    50% { transform: translate(-40px, 60px) scale(0.9); }
                    75% { transform: translate(50px, 30px) scale(1.05); }
                }

                /* Matrix Rain Effect Background */
                .matrix-bg {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    overflow: hidden;
                    opacity: 0.02;
                    pointer-events: none;
                    font-family: monospace;
                    font-size: 14px;
                    color: #FF6B6B;
                }

                .matrix-bg span {
                    position: absolute;
                    animation: matrixFall linear infinite;
                }

                @keyframes matrixFall {
                    0% { transform: translateY(-100vh) rotate(0deg); opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }

                /* ============================================
                   HEADER
                   ============================================ */
                .service-header {
                    text-align: center;
                    margin-bottom: 60px;
                    position: relative;
                    z-index: 2;
                }

                .service-title {
                    font-size: 4.5rem;
                    font-weight: 900;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    background-size: 300% 300%;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    animation: gradientShift 3s ease-in-out infinite;
                    margin-bottom: 15px;
                    letter-spacing: 5px;
                    position: relative;
                    display: inline-block;
                    text-shadow: 0 0 40px rgba(255, 107, 107, 0.3);
                }

                @keyframes gradientShift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                .service-title::after {
                    content: '';
                    position: absolute;
                    bottom: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, transparent);
                    animation: titleUnderline 1.5s ease-out forwards;
                }

                @keyframes titleUnderline {
                    to { width: 80%; }
                }

                .service-subtitle {
                    color: rgba(168, 178, 209, 0.6);
                    font-size: 1.4rem;
                    letter-spacing: 6px;
                    animation: subtitleFade 1s ease-out 0.3s forwards;
                    opacity: 0;
                }

                @keyframes subtitleFade {
                    to { opacity: 1; transform: translateY(0); }
                    from { opacity: 0; transform: translateY(30px); }
                }

                /* ============================================
                   GRID & CARDS
                   ============================================ */
                .services-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 30px;
                    max-width: 1400px;
                    margin: 0 auto;
                    position: relative;
                    z-index: 2;
                }

                .service-card {
                    background: rgba(26, 30, 55, 0.85);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    padding: 35px 25px;
                    border-radius: 25px;
                    border: 1px solid rgba(255, 107, 107, 0.1);
                    text-align: center;
                    transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                    position: relative;
                    overflow: hidden;
                    cursor: pointer;
                    opacity: 0;
                    transform: translateY(60px) scale(0.95) rotateX(10deg);
                    transform-origin: center;
                    perspective: 1000px;
                }

                .service-card.visible {
                    opacity: 1;
                    transform: translateY(0) scale(1) rotateX(0);
                }

                /* Staggered delays */
                .service-card:nth-child(1) { transition-delay: 0.05s; }
                .service-card:nth-child(2) { transition-delay: 0.1s; }
                .service-card:nth-child(3) { transition-delay: 0.15s; }
                .service-card:nth-child(4) { transition-delay: 0.2s; }
                .service-card:nth-child(5) { transition-delay: 0.25s; }
                .service-card:nth-child(6) { transition-delay: 0.3s; }
                .service-card:nth-child(7) { transition-delay: 0.35s; }
                .service-card:nth-child(8) { transition-delay: 0.4s; }

                /* ============================================
                   CARD EFFECT 1: NEON GLOW
                   ============================================ */
                .service-card.effect-neon-glow::before {
                    content: '';
                    position: absolute;
                    top: -2px;
                    left: -2px;
                    right: -2px;
                    bottom: -2px;
                    border-radius: 27px;
                    background: linear-gradient(45deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
                    background-size: 400% 400%;
                    opacity: 0;
                    z-index: -1;
                    transition: opacity 0.6s ease, transform 0.6s ease;
                    animation: borderRotate 3s linear infinite;
                }

                .service-card.effect-neon-glow:hover::before {
                    opacity: 1;
                }

                .service-card.effect-neon-glow:hover {
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.3), 0 0 60px rgba(255, 217, 61, 0.2);
                }

                /* ============================================
                   CARD EFFECT 2: PARTICLE RAIN
                   ============================================ */
                .particle-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                    opacity: 0;
                    transition: opacity 0.8s ease;
                }

                .service-card.effect-particle-rain:hover .particle-container {
                    opacity: 1;
                }

                .particle {
                    position: absolute;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(255, 107, 107, 0.8), rgba(255, 217, 61, 0.3));
                    animation: particleFloat linear infinite;
                }

                @keyframes particleFloat {
                    0% { transform: translateY(100%) scale(0); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-100%) scale(1); opacity: 0; }
                }

                /* ============================================
                   CARD EFFECT 3: WAVE DISTORTION
                   ============================================ */
                .service-card.effect-wave-distortion:hover {
                    animation: waveDistort 0.5s ease-in-out;
                }

                @keyframes waveDistort {
                    0%, 100% { transform: scale(1) rotate(0deg); }
                    25% { transform: scale(1.02) rotate(1deg); }
                    75% { transform: scale(0.98) rotate(-1deg); }
                }

                /* ============================================
                   CARD EFFECT 4: CYBER GRID
                   ============================================ */
                .cyber-grid-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-image: 
                        linear-gradient(rgba(255, 107, 107, 0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255, 107, 107, 0.03) 1px, transparent 1px);
                    background-size: 20px 20px;
                    opacity: 0;
                    transition: opacity 0.6s ease;
                    pointer-events: none;
                }

                .service-card.effect-cyber-grid:hover .cyber-grid-overlay {
                    opacity: 1;
                    animation: gridScan 2s linear infinite;
                }

                @keyframes gridScan {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(20px); }
                }

                /* ============================================
                   CARD EFFECT 5: FLOATING SHAPES
                   ============================================ */
                .shape-container {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                    opacity: 0;
                    transition: opacity 0.8s ease;
                }

                .service-card.effect-floating-shapes:hover .shape-container {
                    opacity: 0.6;
                }

                .shape {
                    position: absolute;
                    border: 2px solid rgba(255, 217, 61, 0.3);
                    animation: shapeFloat ease-in-out infinite;
                }

                .shape.square {
                    border-radius: 4px;
                }

                .shape.circle {
                    border-radius: 50%;
                }

                .shape.triangle {
                    width: 0 !important;
                    height: 0 !important;
                    border-left: 15px solid transparent;
                    border-right: 15px solid transparent;
                    border-bottom: 26px solid rgba(255, 217, 61, 0.2);
                    background: transparent !important;
                }

                @keyframes shapeFloat {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(180deg); }
                }

                /* ============================================
                   CARD EFFECT 6: DATA STREAM
                   ============================================ */
                .data-stream {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    overflow: hidden;
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }

                .service-card.effect-data-stream:hover .data-stream {
                    opacity: 0.5;
                }

                .data-bit {
                    position: absolute;
                    color: #FF6BD6;
                    font-family: monospace;
                    font-size: 12px;
                    animation: dataFlow linear infinite;
                }

                @keyframes dataFlow {
                    0% { transform: translateY(-100%) opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { transform: translateY(100%) opacity: 0; }
                }

                /* ============================================
                   CARD EFFECT 7: HOLOGRAPHIC
                   ============================================ */
                .service-card.effect-holographic:hover {
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.1), rgba(255, 217, 61, 0.1));
                    border-color: rgba(255, 107, 107, 0.4);
                    box-shadow: 0 0 40px rgba(255, 107, 107, 0.2), inset 0 0 40px rgba(255, 107, 107, 0.05);
                }

                .service-card.effect-holographic .holographic-shimmer {
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent 30%, rgba(255, 107, 107, 0.1) 50%, transparent 70%);
                    transform: rotate(45deg);
                    transition: transform 0.8s ease;
                    pointer-events: none;
                }

                .service-card.effect-holographic:hover .holographic-shimmer {
                    transform: rotate(45deg) translateX(100%);
                }

                /* ============================================
                   CARD EFFECT 8: PULSE RING
                   ============================================ */
                .pulse-ring {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 0;
                    height: 0;
                    border-radius: 50%;
                    border: 1px solid rgba(255, 217, 61, 0.3);
                    pointer-events: none;
                    opacity: 0;
                }

                .service-card.effect-pulse-ring:hover .pulse-ring {
                    animation: pulseExpand 1.5s ease-out infinite;
                }

                @keyframes pulseExpand {
                    0% { width: 0; height: 0; opacity: 1; }
                    100% { width: 400px; height: 400px; opacity: 0; }
                }

                /* ============================================
                   COMMON CARD ELEMENTS
                   ============================================ */
                .service-icon {
                    font-size: 4rem;
                    margin-bottom: 20px;
                    display: inline-block;
                    position: relative;
                    z-index: 1;
                    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .service-card:hover .service-icon {
                    transform: scale(1.3) rotate(10deg);
                    animation: iconFloat 2s ease-in-out infinite;
                }

                @keyframes iconFloat {
                    0%, 100% { transform: translateY(0) scale(1.3) rotate(10deg); }
                    50% { transform: translateY(-10px) scale(1.4) rotate(15deg); }
                }

                .service-card h3 {
                    color: #FFD93D;
                    margin-bottom: 12px;
                    font-size: 1.4rem;
                    position: relative;
                    z-index: 1;
                    transition: all 0.4s ease;
                }

                .service-card:hover h3 {
                    background: linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    transform: scale(1.05);
                }

                .service-card p {
                    color: rgba(168, 178, 209, 0.7);
                    margin-bottom: 20px;
                    line-height: 1.7;
                    font-size: 0.95rem;
                    position: relative;
                    z-index: 1;
                    transition: all 0.4s ease;
                }

                .service-card:hover p {
                    color: rgba(168, 178, 209, 0.95);
                }

                .service-features {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    justify-content: center;
                    margin-bottom: 25px;
                    position: relative;
                    z-index: 1;
                }

                .feature-tag {
                    background: rgba(255, 107, 107, 0.06);
                    padding: 6px 16px;
                    border-radius: 20px;
                    font-size: 0.8rem;
                    color: rgba(255, 217, 61, 0.8);
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    cursor: default;
                    position: relative;
                }

                .feature-tag:hover {
                    background: rgba(255, 107, 107, 0.15);
                    transform: translateY(-3px) scale(1.05) rotateX(10deg);
                    border-color: #FF6B6B;
                    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.2);
                    color: #FFFFFF;
                }

                .service-btn {
                    padding: 12px 35px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 30px;
                    font-size: 0.95rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-weight: bold;
                    letter-spacing: 1px;
                    position: relative;
                    z-index: 1;
                    overflow: hidden;
                }

                .service-btn::before {
                    content: '';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    width: 0;
                    height: 0;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    transition: width 0.6s, height 0.6s;
                }

                .service-btn:hover::before {
                    width: 300px;
                    height: 300px;
                }

                .service-btn:hover {
                    transform: scale(1.08) translateY(-3px);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);
                }

                .service-btn:active {
                    transform: scale(0.95);
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

                /* ============================================
                   RESPONSIVE
                   ============================================ */
                @media (max-width: 1200px) {
                    .services-grid { grid-template-columns: repeat(3, 1fr); }
                }

                @media (max-width: 992px) {
                    .services-grid { grid-template-columns: repeat(2, 1fr); }
                    .service-title { font-size: 3rem; }
                }

                @media (max-width: 768px) {
                    .service-wrapper { padding: 40px 15px; }
                    .service-title { font-size: 2.5rem; }
                    .service-subtitle { font-size: 1rem; }
                    .services-grid { gap: 20px; }
                    .orb-1, .orb-2, .orb-3, .orb-4, .orb-5 { 
                        width: 150px; 
                        height: 150px; 
                    }
                }

                @media (max-width: 600px) {
                    .services-grid { grid-template-columns: 1fr; max-width: 400px; }
                    .service-title { font-size: 2rem; }
                    .service-card { padding: 30px 20px; }
                }
            `}</style>

            <div className="service-wrapper" ref={containerRef}>
                {/* Floating Orbs */}
                <div className="orb orb-1"></div>
                <div className="orb orb-2"></div>
                <div className="orb orb-3"></div>
                <div className="orb orb-4"></div>
                <div className="orb orb-5"></div>

                {/* Matrix Rain Background */}
                <div className="matrix-bg">
                    {Array.from({ length: 30 }, (_, i) => (
                        <span
                            key={i}
                            style={{
                                left: `${Math.random() * 100}%`,
                                animationDuration: `${Math.random() * 10 + 8}s`,
                                animationDelay: `${Math.random() * 5}s`,
                                fontSize: `${Math.random() * 10 + 10}px`
                            }}
                        >
                            {String.fromCharCode(0x30A0 + Math.random() * 96)}
                        </span>
                    ))}
                </div>

                {/* Header */}
                <div className="service-header">
                    <h1 className="service-title">✦ Premium Services ✦</h1>
                    <p className="service-subtitle">✨ Where Innovation Meets Excellence ✨</p>
                </div>

                {/* Cards Grid */}
                <div className="services-grid">
                    {services.map((service, index) => (
                        <div
                            key={index}
                            ref={(el) => (cardRefs.current[index] = el)}
                            data-index={index}
                            className={`service-card effect-${service.effect} ${visibleCards.includes(index) ? 'visible' : ''}`}
                            onMouseEnter={() => setHoveredIndex(index)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {/* Effect-specific elements */}
                            {service.effect === 'particle-rain' && (
                                <div className="particle-container">
                                    {generateParticles(15).map((p) => (
                                        <div
                                            key={p.id}
                                            className="particle"
                                            style={{
                                                left: `${p.x}%`,
                                                top: `${p.y}%`,
                                                width: `${p.size}px`,
                                                height: `${p.size}px`,
                                                animationDuration: `${p.duration}s`,
                                                animationDelay: `${p.delay}s`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {service.effect === 'cyber-grid' && (
                                <div className="cyber-grid-overlay" />
                            )}

                            {service.effect === 'floating-shapes' && (
                                <div className="shape-container">
                                    {['square', 'circle', 'triangle', 'square', 'circle'].map((shape, i) => (
                                        <div
                                            key={i}
                                            className={`shape ${shape}`}
                                            style={{
                                                width: shape === 'triangle' ? 0 : `${Math.random() * 30 + 10}px`,
                                                height: shape === 'triangle' ? 0 : `${Math.random() * 30 + 10}px`,
                                                left: `${Math.random() * 80 + 10}%`,
                                                top: `${Math.random() * 80 + 10}%`,
                                                animationDuration: `${Math.random() * 3 + 2}s`,
                                                animationDelay: `${Math.random() * 2}s`,
                                                transform: `rotate(${Math.random() * 360}deg)`
                                            }}
                                        />
                                    ))}
                                </div>
                            )}

                            {service.effect === 'data-stream' && (
                                <div className="data-stream">
                                    {Array.from({ length: 20 }, (_, i) => (
                                        <span
                                            key={i}
                                            className="data-bit"
                                            style={{
                                                left: `${Math.random() * 100}%`,
                                                animationDuration: `${Math.random() * 3 + 2}s`,
                                                animationDelay: `${Math.random() * 2}s`
                                            }}
                                        >
                                            {Math.random() > 0.5 ? '1' : '0'}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {service.effect === 'holographic' && (
                                <div className="holographic-shimmer" />
                            )}

                            {service.effect === 'pulse-ring' && (
                                <div className="pulse-ring" />
                            )}

                            {/* Card Content */}
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
                    ))}
                </div>
            </div>
        </>
    );
}

export default Service;