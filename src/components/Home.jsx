
import React, { useState, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';

import { db, collection, onSnapshot, query, orderBy } from '../firebase/config';


// ============================================

// ADVANCED ANIMATED NETWORK BACKGROUND

// With new vibrant color scheme

// ============================================

function NetworkCanvas() {

    const canvasRef = useRef(null);


    useEffect(() => {

        const canvas = canvasRef.current;

        if (!canvas) return;

        const ctx = canvas.getContext('2d');


        let width = 0;

        let height = 0;

        let particles = [];

        let animationId = null;

        let startTime = null;

        const mouse = { x: null, y: null };


        const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF6BD6', '#FF9F43'];

        const CONNECT_DISTANCE = 130;

        const MOUSE_DISTANCE = 170;

        const STAGGER_MS = 35;


        const getParticleCount = () => (width < 600 ? 36 : width < 1000 ? 55 : 80);


        function resize() {

            const dpr = window.devicePixelRatio || 1;

            width = canvas.offsetWidth;

            height = canvas.offsetHeight;

            canvas.width = Math.floor(width * dpr);

            canvas.height = Math.floor(height * dpr);

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        }


        function createParticles() {

            const count = getParticleCount();

            particles = Array.from({ length: count }, (_, i) => ({

                x: Math.random() * width,

                y: Math.random() * height,

                vx: (Math.random() - 0.5) * 0.35,

                vy: (Math.random() - 0.5) * 0.35,

                radius: Math.random() * 1.8 + 1.3,

                color: COLORS[i % COLORS.length],

                opacity: 0,

                targetOpacity: Math.random() * 0.4 + 0.6,

                delay: i * STAGGER_MS + Math.random() * 200

            }));

        }


        function step(timestamp) {

            if (!startTime) startTime = timestamp;

            const elapsed = timestamp - startTime;


            ctx.clearRect(0, 0, width, height);


            for (const p of particles) {

                if (elapsed > p.delay && p.opacity < p.targetOpacity) {

                    p.opacity = Math.min(p.targetOpacity, p.opacity + 0.015);

                }


                p.x += p.vx;

                p.y += p.vy;


                if (p.x <= 0 || p.x >= width) p.vx *= -1;

                if (p.y <= 0 || p.y >= height) p.vy *= -1;

                p.x = Math.max(0, Math.min(width, p.x));

                p.y = Math.max(0, Math.min(height, p.y));


                if (mouse.x !== null && p.opacity > 0) {

                    const dx = p.x - mouse.x;

                    const dy = p.y - mouse.y;

                    const dist = Math.sqrt(dx * dx + dy * dy) || 1;

                    if (dist < MOUSE_DISTANCE) {

                        const force = (MOUSE_DISTANCE - dist) / MOUSE_DISTANCE;

                        p.x += (dx / dist) * force * 1.4;

                        p.y += (dy / dist) * force * 1.4;

                    }

                }

            }


            for (let i = 0; i < particles.length; i++) {

                const a = particles[i];

                if (a.opacity <= 0) continue;

                for (let j = i + 1; j < particles.length; j++) {

                    const b = particles[j];

                    if (b.opacity <= 0) continue;

                    const dx = a.x - b.x;

                    const dy = a.y - b.y;

                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONNECT_DISTANCE) {

                        const lineOpacity = (1 - dist / CONNECT_DISTANCE) * 0.4 * Math.min(a.opacity, b.opacity);

                        ctx.strokeStyle = `rgba(255, 107, 107, ${lineOpacity})`;

                        ctx.lineWidth = 1;

                        ctx.beginPath();

                        ctx.moveTo(a.x, a.y);

                        ctx.lineTo(b.x, b.y);

                        ctx.stroke();

                    }

                }


                if (mouse.x !== null) {

                    const dx = a.x - mouse.x;

                    const dy = a.y - mouse.y;

                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < MOUSE_DISTANCE) {

                        const lineOpacity = (1 - dist / MOUSE_DISTANCE) * 0.5 * a.opacity;

                        ctx.strokeStyle = `rgba(255, 217, 61, ${lineOpacity})`;

                        ctx.lineWidth = 1;

                        ctx.beginPath();

                        ctx.moveTo(a.x, a.y);

                        ctx.lineTo(mouse.x, mouse.y);

                        ctx.stroke();

                    }

                }

            }


            for (const p of particles) {

                if (p.opacity <= 0) continue;

                ctx.save();

                ctx.globalAlpha = p.opacity;

                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius * 5);

                glow.addColorStop(0, p.color);

                glow.addColorStop(1, 'transparent');

                ctx.fillStyle = glow;

                ctx.beginPath();

                ctx.arc(p.x, p.y, p.radius * 5, 0, Math.PI * 2);

                ctx.fill();


                ctx.fillStyle = p.color;

                ctx.beginPath();

                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

                ctx.fill();

                ctx.restore();

            }


            animationId = requestAnimationFrame(step);

        }


        function handleMouseMove(e) {

            const rect = canvas.getBoundingClientRect();

            mouse.x = e.clientX - rect.left;

            mouse.y = e.clientY - rect.top;

        }


        function handleMouseOut() {

            mouse.x = null;

            mouse.y = null;

        }


        function handleResize() {

            resize();

            startTime = null;

            createParticles();

        }


        resize();

        createParticles();

        animationId = requestAnimationFrame(step);


        window.addEventListener('resize', handleResize);

        window.addEventListener('mousemove', handleMouseMove);

        window.addEventListener('mouseout', handleMouseOut);


        return () => {

            cancelAnimationFrame(animationId);

            window.removeEventListener('resize', handleResize);

            window.removeEventListener('mousemove', handleMouseMove);

            window.removeEventListener('mouseout', handleMouseOut);

        };

    }, []);


    return <canvas ref={canvasRef} className="network-canvas" aria-hidden="true" />;

}


// ============================================

// FEATURE CARD - "Why Choose Us"

// ============================================

function FeatureCard({ icon, title, description, badge, index }) {

    const cardRef = useRef(null);

    const [visible, setVisible] = useState(false);

    const [spot, setSpot] = useState({ x: 50, y: 50 });


    useEffect(() => {

        const el = cardRef.current;

        if (!el) return;

        const observer = new IntersectionObserver(

            ([entry]) => {

                if (entry.isIntersecting) {

                    setVisible(true);

                    observer.unobserve(el);

                }

            },

            { threshold: 0.15 }

        );

        observer.observe(el);

        return () => observer.disconnect();

    }, []);


    const handleMouseMove = (e) => {

        const rect = cardRef.current.getBoundingClientRect();

        setSpot({

            x: ((e.clientX - rect.left) / rect.width) * 100,

            y: ((e.clientY - rect.top) / rect.height) * 100

        });

    };


    return (

        <div

            ref={cardRef}

            className={`feature-card ${visible ? 'visible' : ''}`}

            style={{

                transitionDelay: visible ? '0ms' : `${index * 90}ms`,

                '--x': `${spot.x}%`,

                '--y': `${spot.y}%`

            }}

            onMouseMove={handleMouseMove}

        >

            <div className="feature-icon">{icon}</div>

            <h3>{title}</h3>

            <p>{description}</p>

            <span className="feature-badge">{badge}</span>

        </div>

    );

}


function Home() {

    const navigate = useNavigate();

    const [counters, setCounters] = useState({

        clients: 0,

        projects: 0,

        countries: 0,

        satisfaction: 0

    });

    const [isChatOpen, setIsChatOpen] = useState(false);

    const [chatInput, setChatInput] = useState('');

    const [chatMessages, setChatMessages] = useState([

        { type: 'ai', text: '👋 Hello! I\'m Syntax SaaS AI Assistant. How can I help you today?' }

    ]);

    const [isLoading, setIsLoading] = useState(false);

    const [offers, setOffers] = useState([]);

    const [loadingOffers, setLoadingOffers] = useState(true);

    const [selectedOffer, setSelectedOffer] = useState(null);


    // Fetch offers from Firebase

    useEffect(() => {

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

                    setLoadingOffers(false);

                } catch (error) {

                    console.error('Error processing offers:', error);

                    setLoadingOffers(false);

                }

            });


            return () => unsubscribe();

        } catch (error) {

            console.error('Error setting up offers listener:', error);

            setLoadingOffers(false);

        }

    }, []);


    // Counter Animation

    useEffect(() => {

        const targetValues = {

            clients: 12,

            projects: 15,

            countries: 2,

            satisfaction: 100

        };


        const duration = 2000;

        const steps = 60;

        const interval = duration / steps;


        let currentStep = 0;


        const timer = setInterval(() => {

            currentStep++;

            const progress = currentStep / steps;


            setCounters({

                clients: Math.floor(progress * targetValues.clients),

                projects: Math.floor(progress * targetValues.projects),

                countries: Math.floor(progress * targetValues.countries),

                satisfaction: Math.floor(progress * targetValues.satisfaction)

            });


            if (currentStep >= steps) {

                clearInterval(timer);

            }

        }, interval);


        return () => clearInterval(timer);

    }, []);


    // AI Chat Functions

    const getAIResponse = (userInput) => {

        const inputLower = userInput.toLowerCase();


        if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('hey')) {

            return "👋 Hello! Welcome to Syntax SaaS AI Assistant. How can I help you today?";

        }

        if (inputLower.includes('service') || inputLower.includes('services')) {

            return "💎 We offer various services including:\n• Web Development (React, Next.js, TypeScript)\n• Mobile Development (React Native, Flutter)\n• Cloud Solutions (AWS, Firebase, MongoDB)\n• AI & Automation (Machine Learning, NLP)\n• UI/UX Design\n• DevOps & Tools";

        }

        if (inputLower.includes('price') || inputLower.includes('cost') || inputLower.includes('affordable')) {

            return "💰 Syntax SaaS offers very affordable pricing! We believe in making technology accessible to everyone. Contact us for a custom quote.";

        }

        if (inputLower.includes('tech') || inputLower.includes('technology') || inputLower.includes('stack')) {

            return "🛠️ Our tech stack includes:\n• Frontend: HTML5, CSS3, JavaScript, React.js, TypeScript, Tailwind CSS, Bootstrap\n• Backend: Node.js, Express.js\n• Database: MongoDB, PostgreSQL, MySQL, Firebase, Cloudinary\n• Mobile: React Native, Flutter\n• AI: Machine Learning, Deep Learning, NLP\n• Tools: Git, GitHub, VS Code, Figma, Canva";

        }

        if (inputLower.includes('remote') || inputLower.includes('work from home')) {

            return "🌐 We are a remote-first company! Our team works from anywhere in the world, providing services 24/7 to our global clients.";

        }

        if (inputLower.includes('support') || inputLower.includes('help') || inputLower.includes('assist')) {

            return "🤝 We provide 24/7 dedicated support! Contact us at info@srisaas.com or through our contact page.";

        }

        if (inputLower.includes('webinar') || inputLower.includes('training') || inputLower.includes('learn')) {

            return "🎓 We conduct regular webinars and training sessions! Check our website for upcoming schedules.";

        }

        if (inputLower.includes('project') || inputLower.includes('timeline') || inputLower.includes('delivery')) {

            return "📅 We handle year-round projects with consistent quality and timely delivery.";

        }

        if (inputLower.includes('satisfaction') || inputLower.includes('happy') || inputLower.includes('review')) {

            return "⭐ Customer satisfaction is our top priority! We maintain a 100% satisfaction rate.";

        }

        if (inputLower.includes('about') || inputLower.includes('company')) {

            return "🏢 Syntax SaaS Technology is a premium SaaS solutions provider, empowering businesses since 2021.";

        }

        if (inputLower.includes('contact') || inputLower.includes('email') || inputLower.includes('phone')) {

            return "📞 You can reach us at:\n• Email: info@srisaas.com\n• Phone: +91 6381072875\n• Or visit our Contact page.";

        }

        if (inputLower.includes('offer') || inputLower.includes('deal') || inputLower.includes('discount') || inputLower.includes('promo')) {

            const activeOffers = offers.filter(o => o.active);

            if (activeOffers.length > 0) {

                return `🎉 We have exciting offers for you!\n\n${activeOffers.map(o => `• ${o.icon || '🎯'} ${o.title}: ${o.discount || 'Special Deal'} ${o.code ? `\n  📋 Use code: ${o.code}` : ''}`).join('\n\n')}`;

            }

            return "🎯 We currently don't have any active offers. Stay tuned for exciting deals!";

        }

        return "🤔 I'm not sure about that. Please ask me about:\n• Services\n• Pricing\n• Tech Stack\n• Remote Work\n• Support\n• Webinars\n• Projects\n• Satisfaction\n• About Us\n• Contact Information\n• Offers & Discounts";

    };


    const handleChatSubmit = (e) => {

        e.preventDefault();

        if (!chatInput.trim()) return;


        const userMessage = chatInput;

        setChatMessages(prev => [...prev, { type: 'user', text: userMessage }]);

        setChatInput('');

        setIsLoading(true);


        setTimeout(() => {

            const response = getAIResponse(userMessage);

            setChatMessages(prev => [...prev, { type: 'ai', text: response }]);

            setIsLoading(false);

        }, 500);

    };


    // Why Choose Us - feature cards data

    const features = [

        {

            icon: '💰',

            title: 'Very Affordable',

            description: 'Premium quality solutions at budget-friendly prices. We believe in making technology accessible to everyone.',

            badge: 'Best Value'

        },

        {

            icon: '🌐',

            title: 'Remote-First',

            description: 'Our team works remotely to serve clients worldwide. We can provide services from anywhere, at any time.',

            badge: 'Global Reach'

        },

        {

            icon: '⭐',

            title: 'Customer Satisfaction',

            description: 'Your success is our priority. We ensure 100% customer satisfaction with our dedicated support team.',

            badge: 'Top Rated'

        },

        {

            icon: '📅',

            title: 'Year-Round Projects',

            description: 'We handle projects throughout the year with consistent quality and timely delivery.',

            badge: 'Reliable'

        },

        {

            icon: '🎓',

            title: 'Expert Webinars',

            description: 'Regular webinars and training sessions to keep you updated with the latest technologies and trends.',

            badge: 'Continuous Learning'

        },

        {

            icon: '🏆',

            title: 'Next-Gen Solutions',

            description: 'We focus on cutting-edge technologies to provide you with the best solutions for your business growth.',

            badge: 'Innovation'

        }

    ];


    const techCategories = [

        {

            name: '🌐 Web Development',

            icon: '🌐',

            technologies: [

                { name: 'HTML5', icon: '📄' },

                { name: 'CSS3', icon: '🎨' },

                { name: 'JavaScript', icon: '⚡' },

                { name: 'React.js', icon: '⚛️' },

                { name: 'TypeScript', icon: '📘' },

                { name: 'Tailwind CSS', icon: '🎨' },

                { name: 'Bootstrap', icon: '🟣' },

            ]

        },

        {

            name: '⚙️ Backend Development',

            icon: '⚙️',

            technologies: [

                { name: 'Node.js', icon: '🟢' },

                { name: 'Express.js', icon: '🚀' },

            ]

        },

        {

            name: '🗄️ Database & Cloud',

            icon: '🗄️',

            technologies: [

                { name: 'MongoDB', icon: '🍃' },

                { name: 'PostgreSQL', icon: '🐘' },

                { name: 'MySQL', icon: '🐬' },

                { name: 'Firebase', icon: '🔥' },

                { name: 'Cloudinary', icon: '☁️' },

            ]

        },

        {

            name: '📱 Mobile Development',

            icon: '📱',

            technologies: [

                { name: 'React Native', icon: '⚡' },

                { name: 'Flutter', icon: '📱' },

            ]

        },

        {

            name: '🤖 AI & Automation',

            icon: '🤖',

            technologies: [

                { name: 'Machine Learning', icon: '🧠' },

                { name: 'Deep Learning', icon: '🧬' },

                { name: 'NLP', icon: '💬' },

            ]

        },

        {

            name: '🛠️ DevOps & Tools',

            icon: '🛠️',

            technologies: [

                { name: 'Git', icon: '📊' },

                { name: 'GitHub', icon: '🐙' },

                { name: 'VS Code', icon: '💻' },

                { name: 'Figma', icon: '🎨' },

                { name: 'Canva', icon: '🎨' },

            ]

        }

    ];


    return (

        <>

            <style>{`

                /* ============================================

                   HOME PAGE STYLES - VIBRANT NEW COLORS

                   ============================================ */

                .home-container {

                    animation: fadeInUp 0.8s ease;

                    min-height: 100vh;

                    padding-top: 80px;

                    background: #0a0e27;

                }


                .hero-section {

                    position: relative;

                    text-align: center;

                    padding: 120px 40px 100px;

                    background: radial-gradient(ellipse at center, rgba(255, 107, 107, 0.08) 0%, transparent 70%),

                                radial-gradient(ellipse at left, rgba(255, 217, 61, 0.05) 0%, transparent 50%),

                                radial-gradient(ellipse at right, rgba(107, 203, 119, 0.05) 0%, transparent 50%);

                    border-bottom: 1px solid rgba(255, 107, 107, 0.25);

                    overflow: hidden;

                }


                .network-canvas {

                    position: absolute;

                    inset: 0;

                    width: 100%;

                    height: 100%;

                    display: block;

                    pointer-events: none;

                    z-index: 0;

                }


                .hero-title,

                .hero-subtitle,

                .hero-tagline,

                .hero-buttons {

                    position: relative;

                    z-index: 1;

                }


                .hero-section::before {

                    content: '';

                    position: absolute;

                    top: -50%;

                    left: -50%;

                    width: 200%;

                    height: 200%;

                    background: radial-gradient(circle at center, rgba(255, 107, 107, 0.03) 0%, transparent 70%);

                    animation: rotate 20s linear infinite;

                }


                .hero-section::after {

                    content: '';

                    position: absolute;

                    bottom: 0;

                    left: 0;

                    right: 0;

                    height: 2px;

                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, #6BCB77, transparent);

                    animation: shimmerLine 3s ease-in-out infinite;

                }


                @keyframes shimmerLine {

                    0%, 100% { opacity: 0.3; }

                    50% { opacity: 1; }

                }


                @keyframes rotate {

                    from { transform: rotate(0deg); }

                    to { transform: rotate(360deg); }

                }


                .hero-title {

                    font-size: 4.8rem;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    -webkit-background-clip: text;

                    -webkit-text-fill-color: transparent;

                    background-clip: text;

                    margin-bottom: 15px;

                    position: relative;

                    animation: shimmer 4s ease-in-out infinite;

                    text-shadow: 0 0 60px rgba(255, 107, 107, 0.08);

                }


                @keyframes shimmer {

                    0%, 100% { background-position: 0% 50%; }

                    50% { background-position: 100% 50%; }

                }


                .hero-subtitle {

                    font-size: 1.5rem;

                    color: #a8b2d1;

                    margin-bottom: 10px;

                    letter-spacing: 4px;

                    position: relative;

                    font-weight: 300;

                }


                .hero-tagline {

                    font-size: 1.2rem;

                    color: #FFD93D;

                    margin-bottom: 40px;

                    letter-spacing: 2px;

                    position: relative;

                    font-style: italic;

                    text-shadow: 0 0 30px rgba(255, 217, 61, 0.18);

                }


                .hero-tagline span {

                    display: inline-block;

                    margin: 0 15px;

                    padding: 5px 15px;

                    border: 1px solid rgba(255, 217, 61, 0.18);

                    border-radius: 20px;

                    background: rgba(255, 217, 61, 0.04);

                    transition: all 0.3s ease;

                }


                .hero-tagline span:hover {

                    border-color: #FFD93D;

                    background: rgba(255, 217, 61, 0.08);

                    transform: scale(1.05);

                }


                .hero-buttons {

                    display: flex;

                    gap: 25px;

                    justify-content: center;

                    flex-wrap: wrap;

                    position: relative;

                }


                .btn-primary, .btn-secondary {

                    padding: 16px 50px;

                    border: none;

                    border-radius: 50px;

                    font-size: 1.1rem;

                    cursor: pointer;

                    transition: all 0.4s ease;

                    letter-spacing: 2px;

                    font-weight: bold;

                    position: relative;

                    overflow: hidden;

                }


                .btn-primary {

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    color: #0a0e27;

                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);

                }


                .btn-primary::before {

                    content: '';

                    position: absolute;

                    top: -50%;

                    left: -50%;

                    width: 200%;

                    height: 200%;

                    background: linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent);

                    transform: rotate(45deg);

                    transition: all 0.6s ease;

                }


                .btn-primary:hover::before {

                    left: 100%;

                }


                .btn-primary:hover {

                    transform: translateY(-5px) scale(1.05);

                    box-shadow: 0 15px 50px rgba(255, 107, 107, 0.5);

                }


                .btn-secondary {

                    background: transparent;

                    color: #FF6B6B;

                    border: 2px solid #FF6B6B;

                }


                .btn-secondary:hover {

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    color: #0a0e27;

                    transform: translateY(-5px) scale(1.05);

                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);

                }


                /* Offers Section Styles */

                .offers-wrapper {

                    padding: 16px 40px;

                    max-width: 1200px;

                    margin: 0 auto;

                    display: flex;

                    justify-content: center;

                }


                /* Small rectangular Special Offer trigger */

                .special-offer-card {

                    width: min(360px, 100%);

                    min-height: 72px;

                    padding: 12px 16px;

                    display: flex;

                    align-items: center;

                    gap: 12px;

                    border: 1px solid rgba(255, 217, 61, 0.35);

                    border-radius: 14px;

                    background: linear-gradient(

                        135deg,

                        rgba(255, 217, 61, 0.12),

                        rgba(255, 107, 107, 0.08)

                    );

                    color: #ffffff;

                    cursor: pointer;

                    text-align: left;

                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.18);

                    transition: transform 0.25s ease, border-color 0.25s ease,

                                box-shadow 0.25s ease, background 0.25s ease;

                }


                .special-offer-card:hover {

                    transform: translateY(-3px);

                    border-color: #FFD93D;

                    background: linear-gradient(

                        135deg,

                        rgba(255, 217, 61, 0.18),

                        rgba(255, 107, 107, 0.12)

                    );

                    box-shadow: 0 12px 32px rgba(255, 217, 61, 0.16);

                }


                .special-offer-icon {

                    width: 42px;

                    height: 42px;

                    flex: 0 0 42px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 11px;

                    background: rgba(255, 217, 61, 0.14);

                    font-size: 1.45rem;

                }


                .special-offer-content {

                    min-width: 0;

                    flex: 1;

                    display: flex;

                    flex-direction: column;

                    gap: 3px;

                }


                .special-offer-content strong {

                    color: #FFD93D;

                    font-size: 0.95rem;

                    letter-spacing: 0.5px;

                }


                .special-offer-content small {

                    color: #a8b2d1;

                    font-size: 0.75rem;

                }


                .special-offer-arrow {

                    color: #FFD93D;

                    font-size: 1.7rem;

                    line-height: 1;

                    transition: transform 0.25s ease;

                }


                .special-offer-card:hover .special-offer-arrow {

                    transform: translateX(4px);

                }


                /* Offer popup */

                .offer-modal-backdrop {

                    position: fixed;

                    inset: 0;

                    z-index: 10000;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    padding: 20px;

                    background: rgba(3, 5, 18, 0.78);

                    backdrop-filter: blur(7px);

                    animation: offerBackdropIn 0.2s ease;

                }


                .offer-modal {

                    position: relative;

                    width: min(430px, 100%);

                    max-height: calc(100vh - 40px);

                    overflow-y: auto;

                    padding: 30px 26px 26px;

                    border: 1px solid rgba(255, 217, 61, 0.35);

                    border-radius: 22px;

                    background: #1a1e37;

                    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.65);

                    text-align: center;

                    animation: offerModalIn 0.25s ease;

                }


                .offer-modal-close {

                    position: absolute;

                    top: 12px;

                    right: 12px;

                    width: 34px;

                    height: 34px;

                    border: 1px solid rgba(255, 255, 255, 0.1);

                    border-radius: 50%;

                    background: rgba(255, 255, 255, 0.05);

                    color: #e0e0e0;

                    cursor: pointer;

                    font-size: 0.95rem;

                    transition: all 0.2s ease;

                }


                .offer-modal-close:hover {

                    color: #FFD93D;

                    border-color: #FFD93D;

                    transform: rotate(90deg);

                }


                .offer-modal-icon {

                    width: 68px;

                    height: 68px;

                    margin: 0 auto 12px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    border-radius: 18px;

                    background: linear-gradient(

                        135deg,

                        rgba(255, 107, 107, 0.14),

                        rgba(255, 217, 61, 0.14)

                    );

                    font-size: 2.2rem;

                }


                .offer-modal-label {

                    display: inline-block;

                    margin-bottom: 8px;

                    color: #FFD93D;

                    font-size: 0.7rem;

                    font-weight: 800;

                    letter-spacing: 2px;

                }


                .offer-modal h3 {

                    margin: 0 30px 10px;

                    color: #ffffff;

                    font-size: 1.55rem;

                }


                .offer-modal-description {

                    margin: 0 auto 16px;

                    color: #a8b2d1;

                    font-size: 0.9rem;

                    line-height: 1.6;

                }


                .offer-modal-discount {

                    display: inline-block;

                    margin: 8px 0 18px;

                    padding: 8px 16px;

                    border: 1px solid rgba(107, 203, 119, 0.3);

                    border-radius: 999px;

                    background: rgba(107, 203, 119, 0.1);

                    color: #6BCB77;

                    font-size: 1.05rem;

                    font-weight: 800;

                }


                .offer-code-box {

                    margin: 0 auto 12px;

                    padding: 12px 16px;

                    border: 1px dashed rgba(255, 217, 61, 0.4);

                    border-radius: 12px;

                    background: rgba(255, 217, 61, 0.06);

                }


                .offer-code-box span {

                    display: block;

                    margin-bottom: 4px;

                    color: #a8b2d1;

                    font-size: 0.7rem;

                    text-transform: uppercase;

                    letter-spacing: 1px;

                }


                .offer-code-box strong {

                    color: #FFD93D;

                    font-size: 1.15rem;

                    letter-spacing: 1.5px;

                }


                .offer-expiry {

                    margin: 10px 0 18px;

                    color: #a8b2d1;

                    font-size: 0.78rem;

                }


                .offer-modal-button {

                    width: 100%;

                    padding: 12px 18px;

                    border: none;

                    border-radius: 11px;

                    background: linear-gradient(

                        135deg,

                        #FF6B6B 0%,

                        #FFD93D 35%,

                        #6BCB77 65%,

                        #4D96FF 100%

                    );

                    color: #0a0e27;

                    font-weight: 800;

                    cursor: pointer;

                    transition: transform 0.2s ease, box-shadow 0.2s ease;

                }


                .offer-modal-button:hover {

                    transform: translateY(-2px);

                    box-shadow: 0 8px 25px rgba(255, 217, 61, 0.22);

                }


                @keyframes offerBackdropIn {

                    from { opacity: 0; }

                    to { opacity: 1; }

                }


                @keyframes offerModalIn {

                    from { opacity: 0; transform: translateY(12px) scale(0.96); }

                    to { opacity: 1; transform: translateY(0) scale(1); }

                }


                /* Stats Section */

                .stats-section {

                    display: grid;

                    grid-template-columns: repeat(4, 1fr);

                    gap: 30px;

                    padding: 60px 40px;

                    background: radial-gradient(ellipse at center, rgba(255, 107, 107, 0.03) 0%, transparent 70%);

                    border-bottom: 1px solid rgba(255, 107, 107, 0.08);

                }


                .stat-card {

                    text-align: center;

                    padding: 30px 20px;

                    background: rgba(26, 30, 55, 0.8);

                    border-radius: 20px;

                    border: 1px solid rgba(255, 107, 107, 0.15);

                    transition: all 0.4s ease;

                    backdrop-filter: blur(10px);

                }


                .stat-card:hover {

                    transform: translateY(-10px) scale(1.02);

                    border-color: #FFD93D;

                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.15);

                }


                .stat-number {

                    font-size: 3.5rem;

                    font-weight: bold;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    -webkit-background-clip: text;

                    -webkit-text-fill-color: transparent;

                    background-clip: text;

                    font-family: 'Georgia', serif;

                }


                .stat-label {

                    color: #a8b2d1;

                    margin-top: 8px;

                    font-size: 1rem;

                    letter-spacing: 1px;

                }


                .stat-icon {

                    font-size: 2.5rem;

                    margin-bottom: 10px;

                    display: block;

                }


                /* Features Section */

                .features-section {

                    padding: 80px 40px;

                    text-align: center;

                    background: radial-gradient(ellipse at bottom, rgba(107, 203, 119, 0.03) 0%, transparent 70%);

                }


                .features-section h2 {

                    font-size: 3rem;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    -webkit-background-clip: text;

                    -webkit-text-fill-color: transparent;

                    background-clip: text;

                    margin-bottom: 15px;

                    letter-spacing: 2px;

                }


                .features-subtitle {

                    color: #a8b2d1;

                    font-size: 1.1rem;

                    margin-bottom: 50px;

                    letter-spacing: 1px;

                }


                .features-grid {

                    display: grid;

                    grid-template-columns: repeat(3, 1fr);

                    gap: 30px;

                    max-width: 1200px;

                    margin: 0 auto;

                }


                .feature-card {

                    background: #1a1e37;

                    padding: 35px 25px;

                    border-radius: 20px;

                    border: 1px solid rgba(255, 107, 107, 0.15);

                    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),

                                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1),

                                border-color 0.4s ease,

                                box-shadow 0.4s ease;

                    position: relative;

                    overflow: hidden;

                    cursor: pointer;

                    opacity: 0;

                    transform: translateY(50px) scale(0.95);

                }


                .feature-card.visible {

                    opacity: 1;

                    transform: translateY(0) scale(1);

                }


                .feature-card::before {

                    content: '';

                    position: absolute;

                    top: 0;

                    left: 0;

                    right: 0;

                    bottom: 0;

                    background: radial-gradient(280px circle at var(--x, 50%) var(--y, 50%), rgba(255, 107, 107, 0.18), transparent 65%);

                    opacity: 0;

                    transition: opacity 0.4s ease;

                    pointer-events: none;

                }


                .feature-card::after {

                    content: '';

                    position: absolute;

                    bottom: 0;

                    left: 0;

                    right: 0;

                    height: 3px;

                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, transparent);

                    transform: scaleX(0);

                    transition: all 0.5s ease;

                }


                .feature-card:hover::before {

                    opacity: 1;

                }


                .feature-card:hover::after {

                    transform: scaleX(1);

                }


                .feature-card.visible:hover {

                    transform: translateY(-15px) scale(1.02);

                    border-color: #FFD93D;

                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.18);

                }


                .feature-icon {

                    font-size: 3.5rem;

                    margin-bottom: 15px;

                    display: inline-block;

                    animation: float 3s ease-in-out infinite;

                }


                @keyframes float {

                    0%, 100% { transform: translateY(0); }

                    50% { transform: translateY(-10px); }

                }


                .feature-card h3 {

                    color: #FFD93D;

                    margin-bottom: 10px;

                    font-size: 1.3rem;

                }


                .feature-card p {

                    color: #a8b2d1;

                    line-height: 1.6;

                    font-size: 0.95rem;

                }


                .feature-badge {

                    display: inline-block;

                    margin-top: 12px;

                    padding: 4px 15px;

                    background: rgba(255, 217, 61, 0.08);

                    border: 1px solid rgba(255, 217, 61, 0.18);

                    border-radius: 20px;

                    color: #FFD93D;

                    font-size: 0.8rem;

                    font-weight: bold;

                    letter-spacing: 0.5px;

                }


                /* Tech Stack Section */

                .tech-stack-section {

                    padding: 80px 40px;

                    text-align: center;

                    background: radial-gradient(ellipse at top, rgba(77, 150, 255, 0.03) 0%, transparent 70%);

                    border-top: 1px solid rgba(77, 150, 255, 0.08);

                    border-bottom: 1px solid rgba(77, 150, 255, 0.08);

                }


                .tech-stack-section h2 {

                    font-size: 2.8rem;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    -webkit-background-clip: text;

                    -webkit-text-fill-color: transparent;

                    background-clip: text;

                    margin-bottom: 10px;

                    letter-spacing: 2px;

                }


                .tech-stack-subtitle {

                    color: #a8b2d1;

                    font-size: 1.1rem;

                    margin-bottom: 50px;

                    letter-spacing: 1px;

                }


                .tech-category {

                    margin-bottom: 50px;

                }


                .tech-category:last-child {

                    margin-bottom: 0;

                }


                .tech-category-title {

                    font-size: 1.8rem;

                    color: #4D96FF;

                    margin-bottom: 25px;

                    letter-spacing: 1px;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    gap: 15px;

                }


                .tech-category-title::before,

                .tech-category-title::after {

                    content: '';

                    flex: 1;

                    height: 1px;

                    max-width: 100px;

                    background: linear-gradient(90deg, transparent, #4D96FF, transparent);

                }


                .tech-grid {

                    display: grid;

                    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));

                    gap: 15px;

                    max-width: 1200px;

                    margin: 0 auto;

                }


                .tech-item {

                    background: #1a1e37;

                    padding: 18px 12px;

                    border-radius: 14px;

                    border: 1px solid rgba(77, 150, 255, 0.12);

                    transition: all 0.4s ease;

                    position: relative;

                    overflow: hidden;

                    cursor: pointer;

                    text-align: center;

                }


                .tech-item::before {

                    content: '';

                    position: absolute;

                    top: 0;

                    left: 0;

                    right: 0;

                    bottom: 0;

                    background: linear-gradient(135deg, rgba(77, 150, 255, 0.04), transparent);

                    opacity: 0;

                    transition: all 0.4s ease;

                }


                .tech-item:hover::before {

                    opacity: 1;

                }


                .tech-item:hover {

                    transform: translateY(-6px) scale(1.04);

                    border-color: #6BCB77;

                    box-shadow: 0 8px 30px rgba(107, 203, 119, 0.15);

                }


                .tech-item .tech-icon {

                    display: block;

                    font-size: 2.2rem;

                    margin-bottom: 6px;

                    transition: all 0.4s ease;

                }


                .tech-item:hover .tech-icon {

                    transform: scale(1.2) rotate(5deg);

                }


                .tech-item .tech-name {

                    display: block;

                    font-size: 0.8rem;

                    color: #e0e0e0;

                    font-weight: 400;

                    letter-spacing: 0.3px;

                }


                /* Contact Section */

                .contact-footer {

                    padding: 60px 40px;

                    background: radial-gradient(ellipse at center, rgba(255, 107, 214, 0.03) 0%, transparent 70%);

                    border-top: 1px solid rgba(255, 107, 214, 0.08);

                    text-align: center;

                }


                .contact-footer h2 {

                    font-size: 2.8rem;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    -webkit-background-clip: text;

                    -webkit-text-fill-color: transparent;

                    background-clip: text;

                    margin-bottom: 15px;

                    letter-spacing: 2px;

                }


                .contact-footer .subtitle {

                    color: #a8b2d1;

                    font-size: 1.1rem;

                    margin-bottom: 40px;

                    letter-spacing: 1px;

                }


                .contact-grid-footer {

                    display: grid;

                    grid-template-columns: repeat(4, 1fr);

                    gap: 30px;

                    max-width: 1000px;

                    margin: 0 auto;

                    text-align: left;

                }


                .contact-item {

                    background: #1a1e37;

                    padding: 25px;

                    border-radius: 16px;

                    border: 1px solid rgba(255, 107, 107, 0.15);

                    transition: all 0.3s ease;

                }


                .contact-item:hover {

                    transform: translateY(-5px);

                    border-color: #FF6BD6;

                    box-shadow: 0 10px 40px rgba(255, 107, 214, 0.15);

                }


                .contact-item .item-icon {

                    font-size: 2rem;

                    display: block;

                    margin-bottom: 10px;

                }


                .contact-item h4 {

                    color: #FF6BD6;

                    font-size: 1rem;

                    margin-bottom: 5px;

                }


                .contact-item p {

                    color: #a8b2d1;

                    font-size: 0.9rem;

                    line-height: 1.5;

                }


                .contact-item .contact-link {

                    color: #6BCB77;

                    text-decoration: none;

                    transition: all 0.3s ease;

                }


                .contact-item .contact-link:hover {

                    text-decoration: underline;

                    text-shadow: 0 0 20px rgba(107, 203, 119, 0.25);

                }


                .contact-footer .footer-btn {

                    margin-top: 40px;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    color: #0a0e27;

                    border: none;

                    border-radius: 50px;

                    padding: 14px 40px;

                    font-size: 1rem;

                    font-weight: bold;

                    cursor: pointer;

                    transition: all 0.3s ease;

                    display: inline-flex;

                    align-items: center;

                    gap: 10px;

                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.25);

                }


                .contact-footer .footer-btn:hover {

                    transform: scale(1.05);

                    box-shadow: 0 15px 50px rgba(255, 107, 107, 0.4);

                }


                /* Floating AI Chatbot Styles */

                .ai-chatbot-container {

                    position: fixed;

                    bottom: 30px;

                    right: 30px;

                    z-index: 9999;

                }


                .ai-chatbot-button {

                    width: 70px;

                    height: 70px;

                    border-radius: 50%;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    border: none;

                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.4);

                    cursor: pointer;

                    transition: all 0.3s ease;

                    display: flex;

                    align-items: center;

                    justify-content: center;

                    font-size: 2.5rem;

                    color: #0a0e27;

                    animation: pulse 2s infinite;

                }


                .ai-chatbot-button:hover {

                    transform: scale(1.1);

                    box-shadow: 0 15px 50px rgba(255, 107, 107, 0.5);

                }


                .ai-chatbot-button .notification-dot {

                    position: absolute;

                    top: 5px;

                    right: 5px;

                    width: 15px;

                    height: 15px;

                    background: #FF6B6B;

                    border-radius: 50%;

                    border: 2px solid #0a0e27;

                    animation: blink 1s infinite;

                }


                @keyframes pulse {

                    0%, 100% { transform: scale(1); }

                    50% { transform: scale(1.05); }

                }


                @keyframes blink {

                    0%, 100% { opacity: 1; }

                    50% { opacity: 0.3; }

                }


                .ai-chatbot-window {

                    position: fixed;

                    bottom: 110px;

                    right: 30px;

                    width: 400px;

                    height: 550px;

                    background: #1a1e37;

                    border-radius: 20px;

                    border: 1px solid rgba(255, 107, 107, 0.25);

                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);

                    display: flex;

                    flex-direction: column;

                    overflow: hidden;

                    animation: slideUp 0.3s ease;

                }

                /* ============================================ */
/* SOCIAL MEDIA SECTION */
/* ============================================ */

.social-section {
    margin-top: 50px;
    padding-top: 40px;
    border-top: 1px solid rgba(255, 107, 214, 0.1);
}

.social-title {
    font-size: 1.6rem;
    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 10px;
    letter-spacing: 1px;
}

.social-subtitle {
    color: #A8B2D1;
    font-size: 0.95rem;
    margin-bottom: 30px;
    letter-spacing: 0.5px;
}

.social-links {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 20px;
}

.social-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 110px;
    height: 110px;
    border-radius: 20px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.85rem;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    background: #1A1E37;
    border: 2px solid rgba(255, 107, 107, 0.15);
}

.social-link::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent);
    opacity: 0;
    transition: opacity 0.4s ease;
}

.social-link:hover::before {
    opacity: 1;
}

.social-link .social-icon {
    font-size: 2.2rem;
    transition: transform 0.4s ease;
    position: relative;
    z-index: 1;
}

.social-link .social-label {
    color: #E0E0E0;
    font-size: 0.8rem;
    position: relative;
    z-index: 1;
    letter-spacing: 0.3px;
}

.social-link:hover {
    transform: translateY(-8px) scale(1.05);
}

.social-link:hover .social-icon {
    transform: scale(1.2) rotate(5deg);
}

/* ---------- Instagram ---------- */
.social-link.instagram {
    border-color: rgba(225, 48, 108, 0.3);
}

.social-link.instagram .social-icon {
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.social-link.instagram:hover {
    border-color: #e1306c;
    box-shadow: 0 15px 50px rgba(225, 48, 108, 0.35);
    background: linear-gradient(135deg, rgba(240, 148, 51, 0.08), rgba(188, 24, 136, 0.08));
}

/* ---------- X (Twitter) ---------- */
.social-link.x-twitter {
    border-color: rgba(255, 255, 255, 0.15);
}

.social-link.x-twitter .social-icon {
    color: #FFFFFF;
    font-weight: bold;
}

.social-link.x-twitter:hover {
    border-color: #FFFFFF;
    box-shadow: 0 15px 50px rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);
}

/* ---------- LinkedIn ---------- */
.social-link.linkedin {
    border-color: rgba(0, 119, 181, 0.3);
}

.social-link.linkedin .social-icon {
    color: #0A66C2;
}

.social-link.linkedin:hover {
    border-color: #0A66C2;
    box-shadow: 0 15px 50px rgba(0, 119, 181, 0.35);
    background: rgba(0, 119, 181, 0.08);
}

/* ---------- WhatsApp ---------- */
.social-link.whatsapp {
    border-color: rgba(37, 211, 102, 0.3);
}

.social-link.whatsapp .social-icon {
    color: #25D366;
}

.social-link.whatsapp:hover {
    border-color: #25D366;
    box-shadow: 0 15px 50px rgba(37, 211, 102, 0.35);
    background: rgba(37, 211, 102, 0.08);
}

/* ---------- Social Links Responsive ---------- */
@media (max-width: 768px) {
    .social-links {
        gap: 15px;
    }

    .social-link {
        width: 95px;
        height: 95px;
    }

    .social-link .social-icon {
        font-size: 1.8rem;
    }

    .social-link .social-label {
        font-size: 0.7rem;
    }

    .social-title {
        font-size: 1.4rem;
    }
}

@media (max-width: 480px) {
    .social-section {
        margin-top: 35px;
        padding-top: 25px;
    }

    .social-links {
        gap: 10px;
    }

    .social-link {
        width: 80px;
        height: 80px;
        border-radius: 15px;
    }

    .social-link .social-icon {
        font-size: 1.5rem;
    }

    .social-link .social-label {
        font-size: 0.65rem;
    }

    .social-title {
        font-size: 1.2rem;
    }

    .social-subtitle {
        font-size: 0.85rem;
    }
}


                @keyframes slideUp {

                    from { opacity: 0; transform: translateY(20px) scale(0.9); }

                    to { opacity: 1; transform: translateY(0) scale(1); }

                }


                .ai-chatbot-header {

                    padding: 15px 20px;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    display: flex;

                    justify-content: space-between;

                    align-items: center;

                }


                .ai-chatbot-header h3 {

                    color: #0a0e27;

                    font-size: 1.1rem;

                    margin: 0;

                    display: flex;

                    align-items: center;

                    gap: 10px;

                }


                .ai-chatbot-header .close-btn {

                    background: none;

                    border: none;

                    color: #0a0e27;

                    font-size: 1.5rem;

                    cursor: pointer;

                    transition: all 0.3s ease;

                }


                .ai-chatbot-header .close-btn:hover {

                    transform: rotate(90deg);

                }


                .ai-chatbot-messages {

                    flex: 1;

                    padding: 15px 20px;

                    overflow-y: auto;

                    background: #0a0e27;

                }


                .ai-chatbot-messages::-webkit-scrollbar {

                    width: 5px;

                }


                .ai-chatbot-messages::-webkit-scrollbar-track {

                    background: #0a0e27;

                }


                .ai-chatbot-messages::-webkit-scrollbar-thumb {

                    background: #FF6B6B;

                    border-radius: 3px;

                }


                .chat-message {

                    margin-bottom: 12px;

                    padding: 10px 15px;

                    border-radius: 12px;

                    max-width: 85%;

                    animation: fadeInUp 0.3s ease;

                    font-size: 0.9rem;

                    white-space: pre-line;

                }


                .chat-message.user {

                    background: rgba(77, 150, 255, 0.15);

                    border: 1px solid rgba(77, 150, 255, 0.18);

                    margin-left: auto;

                    color: #e0e0e0;

                }


                .chat-message.ai {

                    background: #1a1e37;

                    border: 1px solid rgba(255, 217, 61, 0.08);

                    margin-right: auto;

                    color: #FFD93D;

                }


                .chat-loading {

                    display: flex;

                    gap: 5px;

                    padding: 10px 0;

                }


                .chat-loading span {

                    width: 8px;

                    height: 8px;

                    background: #FF6B6B;

                    border-radius: 50%;

                    animation: typing 1.4s infinite;

                }


                .chat-loading span:nth-child(2) { animation-delay: 0.2s; }

                .chat-loading span:nth-child(3) { animation-delay: 0.4s; }


                @keyframes typing {

                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }

                    30% { transform: translateY(-10px); opacity: 1; }

                }


                .ai-chatbot-input {

                    padding: 15px 20px;

                    border-top: 1px solid rgba(255, 107, 107, 0.15);

                    display: flex;

                    gap: 10px;

                    background: #1a1e37;

                }


                .ai-chatbot-input input {

                    flex: 1;

                    padding: 10px 15px;

                    background: rgba(255, 255, 255, 0.05);

                    border: 1px solid rgba(255, 107, 107, 0.18);

                    border-radius: 10px;

                    color: #e0e0e0;

                    font-size: 0.95rem;

                    outline: none;

                    transition: all 0.3s ease;

                }


                .ai-chatbot-input input:focus {

                    border-color: #FF6B6B;

                    box-shadow: 0 0 20px rgba(255, 107, 107, 0.08);

                }


                .ai-chatbot-input button {

                    padding: 10px 20px;

                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);

                    color: #0a0e27;

                    border: none;

                    border-radius: 10px;

                    font-weight: bold;

                    cursor: pointer;

                    transition: all 0.3s ease;

                }


                .ai-chatbot-input button:hover {

                    transform: scale(1.05);

                }


                .ai-chatbot-input button:disabled {

                    opacity: 0.5;

                    cursor: not-allowed;

                    transform: none;

                }


                /* Responsive */

                @media (max-width: 1200px) {

                    .features-grid {

                        grid-template-columns: repeat(2, 1fr);

                    }

                }


                @media (max-width: 992px) {

                    .stats-section {

                        grid-template-columns: repeat(2, 1fr);

                    }

                    .hero-title {

                        font-size: 3.5rem;

                    }

                    .contact-grid-footer {

                        grid-template-columns: repeat(2, 1fr);

                    }

                }


                @media (max-width: 768px) {

                    .hero-title {

                        font-size: 2.8rem;

                    }

                    .hero-subtitle {

                        font-size: 1.1rem;

                    }

                    .hero-tagline {

                        font-size: 0.9rem;

                    }

                    .hero-tagline span {

                        display: inline-block;

                        margin: 5px 8px;

                        padding: 3px 10px;

                    }

                    .hero-section {

                        padding: 80px 20px 60px;

                    }

                    .features-section {

                        padding: 60px 20px;

                    }

                    .features-section h2 {

                        font-size: 2.2rem;

                    }

                    .features-grid {

                        grid-template-columns: 1fr;

                        gap: 20px;

                    }

                    .tech-stack-section {

                        padding: 60px 20px;

                    }

                    .tech-stack-section h2 {

                        font-size: 2rem;

                    }

                    .tech-grid {

                        grid-template-columns: repeat(3, 1fr);

                        gap: 12px;

                    }

                    .tech-item {

                        padding: 14px 10px;

                    }

                    .tech-item .tech-icon {

                        font-size: 1.8rem;

                    }

                    .tech-item .tech-name {

                        font-size: 0.7rem;

                    }

                    .tech-category-title {

                        font-size: 1.4rem;

                    }

                    .stats-section {

                        grid-template-columns: repeat(2, 1fr);

                        padding: 40px 20px;

                        gap: 15px;

                    }

                    .stat-number {

                        font-size: 2.5rem;

                    }

                    .contact-footer {

                        padding: 40px 20px;

                    }

                    .contact-footer h2 {

                        font-size: 2rem;

                    }

                    .contact-grid-footer {

                        grid-template-columns: 1fr 1fr;

                        gap: 15px;

                    }

                    .contact-item {

                        padding: 20px;

                    }

                    .btn-primary, .btn-secondary {

                        padding: 14px 35px;

                        font-size: 0.95rem;

                    }

                    .offers-wrapper {

                        padding: 12px 20px;

                    }


                    .special-offer-card {

                        width: min(340px, 100%);

                        min-height: 66px;

                    }


                    .ai-chatbot-window {

                        width: 90%;

                        right: 5%;

                        bottom: 100px;

                        height: 450px;

                    }


                    .ai-chatbot-button {

                        width: 60px;

                        height: 60px;

                        font-size: 2rem;

                    }

                }


                @media (max-width: 480px) {

                    .hero-title {

                        font-size: 2.2rem;

                    }

                    .hero-subtitle {

                        font-size: 0.95rem;

                        letter-spacing: 2px;

                    }

                    .hero-tagline {

                        font-size: 0.8rem;

                    }

                    .hero-tagline span {

                        display: block;

                        margin: 5px 0;

                    }

                    .btn-primary, .btn-secondary {

                        padding: 12px 25px;

                        font-size: 0.85rem;

                    }

                    .features-grid {

                        gap: 15px;

                    }

                    .tech-grid {

                        grid-template-columns: repeat(2, 1fr);

                        gap: 10px;

                    }

                    .tech-item {

                        padding: 12px 8px;

                    }

                    .tech-item .tech-icon {

                        font-size: 1.5rem;

                    }

                    .tech-item .tech-name {

                        font-size: 0.65rem;

                    }

                    .tech-category-title {

                        font-size: 1.2rem;

                    }

                    .tech-category-title::before,

                    .tech-category-title::after {

                        max-width: 30px;

                    }

                    .stats-section {

                        grid-template-columns: 1fr 1fr;

                        gap: 10px;

                    }

                    .stat-card {

                        padding: 20px 15px;

                    }

                    .stat-number {

                        font-size: 2rem;

                    }

                    .stat-icon {

                        font-size: 1.8rem;

                    }

                    .contact-footer h2 {

                        font-size: 1.6rem;

                    }

                    .contact-grid-footer {

                        grid-template-columns: 1fr;

                    }

                    .contact-footer .footer-btn {

                        padding: 12px 25px;

                        font-size: 0.9rem;

                    }

                    .offers-wrapper {

                        padding: 10px 15px;

                    }


                    .special-offer-card {

                        width: 100%;

                        min-height: 62px;

                        padding: 10px 12px;

                    }


                    .special-offer-icon {

                        width: 38px;

                        height: 38px;

                        flex-basis: 38px;

                        font-size: 1.25rem;

                    }


                    .special-offer-content strong {

                        font-size: 0.88rem;

                    }


                    .special-offer-content small {

                        font-size: 0.7rem;

                    }


                    .offer-modal {

                        padding: 26px 20px 20px;

                    }


                    .offer-modal h3 {

                        font-size: 1.3rem;

                    }


                    .ai-chatbot-window {

                        height: 400px;

                        bottom: 90px;

                    }

                }

            `}</style>


            <div className="home-container">

                {/* Hero Section */}

                <div className="hero-section">

                    <NetworkCanvas />

                    <h1 className="hero-title">Welcome to Syntax SaaS Technology</h1>

                    <p className="hero-subtitle">🚀 Empowering Businesses with Premium SaaS Solutions</p>

                    <p className="hero-tagline">

                        <span>💰 Very Affordable</span>

                        <span>🌐 Remote-First</span>

                        <span>⭐ 100% Satisfaction</span>

                        <span>📅 Year-Round Projects</span>

                    </p>

                    <div className="hero-buttons">

                        <button className="btn-primary" onClick={() => window.location.href = '/client'}>

                            🚀 Get Started

                        </button>

                        <button className="btn-secondary" onClick={() => window.location.href = '/service'}>

                            👑 Our Services

                        </button>

                    </div>

                </div>


                {/* Stats Section */}

                <div className="stats-section">

                    <div className="stat-card">

                        <span className="stat-icon">👥</span>

                        <div className="stat-number">{counters.clients}+</div>

                        <div className="stat-label">Happy Clients</div>

                    </div>

                    <div className="stat-card">

                        <span className="stat-icon">🚀</span>

                        <div className="stat-number">{counters.projects}+</div>

                        <div className="stat-label">Projects Completed</div>

                    </div>

                    <div className="stat-card">

                        <span className="stat-icon">🌍</span>

                        <div className="stat-number">{counters.countries}+</div>

                        <div className="stat-label">Countries Served</div>

                    </div>

                    <div className="stat-card">

                        <span className="stat-icon">⭐</span>

                        <div className="stat-number">{counters.satisfaction}%</div>

                        <div className="stat-label">Satisfaction Rate</div>

                    </div>

                </div>


                {/* Compact Special Offer Section */}

                {!loadingOffers && offers.some((offer) => offer.active) && (

                    <div className="offers-wrapper">

                        <button

                            type="button"

                            className="special-offer-card"

                            onClick={() => {

                                const firstActiveOffer = offers.find((offer) => offer.active);

                                if (firstActiveOffer) setSelectedOffer(firstActiveOffer);

                            }}

                            aria-label="View special offers"

                        >

                            <span className="special-offer-icon">🎁</span>

                            <span className="special-offer-content">

                                <strong>Special Offer</strong>

                                <small>Tap to view today's deal</small>

                            </span>

                            <span className="special-offer-arrow">›</span>

                        </button>

                    </div>

                )}


                {/* Special Offer Popup */}

                {selectedOffer && (

                    <div

                        className="offer-modal-backdrop"

                        onClick={() => setSelectedOffer(null)}

                        role="presentation"

                    >

                        <div

                            className="offer-modal"

                            role="dialog"

                            aria-modal="true"

                            aria-labelledby="offer-modal-title"

                            onClick={(e) => e.stopPropagation()}

                        >

                            <button

                                type="button"

                                className="offer-modal-close"

                                onClick={() => setSelectedOffer(null)}

                                aria-label="Close offer"

                            >

                                ✕

                            </button>


                            <div className="offer-modal-icon">

                                {selectedOffer.icon || '🎯'}

                            </div>


                            <span className="offer-modal-label">SPECIAL OFFER</span>


                            <h3 id="offer-modal-title">

                                {selectedOffer.title || 'Special Deal'}

                            </h3>


                            {selectedOffer.description && (

                                <p className="offer-modal-description">

                                    {selectedOffer.description}

                                </p>

                            )}


                            <div className="offer-modal-discount">

                                {selectedOffer.discount || 'Special Deal'}

                            </div>


                            {selectedOffer.code && (

                                <div className="offer-code-box">

                                    <span>Use Code</span>

                                    <strong>{selectedOffer.code}</strong>

                                </div>

                            )}


                            {selectedOffer.expiryDate && (

                                <p className="offer-expiry">

                                    ⏰ Valid until {selectedOffer.expiryDate}

                                </p>

                            )}


                            <button

                                type="button"

                                className="offer-modal-button"

                                onClick={() => setSelectedOffer(null)}

                            >

                                Got It

                            </button>

                        </div>

                    </div>

                )}


                {/* Why Choose Us Section */}

                <div className="features-section">

                    <h2>Why Choose Syntech SaaS?</h2>

                    <p className="features-subtitle">Your Trusted Partner for Digital Transformation</p>

                    <div className="features-grid">

                        {features.map((feature, index) => (

                            <FeatureCard

                                key={feature.title}

                                index={index}

                                icon={feature.icon}

                                title={feature.title}

                                description={feature.description}

                                badge={feature.badge}

                            />

                        ))}

                    </div>

                </div>


                {/* Tech Stack Section */}

                <div className="tech-stack-section">

                    <h2>🛠️ Our Tech Stack</h2>

                    <p className="tech-stack-subtitle">We specialize in modern technologies to deliver the best solutions</p>


                    {techCategories.map((category, catIndex) => (

                        <div key={catIndex} className="tech-category">

                            <div className="tech-category-title">

                                {category.icon} {category.name}

                            </div>

                            <div className="tech-grid">

                                {category.technologies.map((tech, techIndex) => (

                                    <div key={techIndex} className="tech-item">

                                        <span className="tech-icon">{tech.icon}</span>

                                        <span className="tech-name">{tech.name}</span>

                                    </div>

                                ))}

                            </div>

                        </div>

                    ))}

                </div>


                {/* Contact Footer Section */}
<div className="contact-footer">
    <h2>📩 Get in Touch</h2>
    <p className="subtitle">Have questions? We'd love to hear from you!</p>

    <div className="contact-grid-footer">
        <div className="contact-item">
            <span className="item-icon">📍</span>
            <h4>Address</h4>
            <p>
                16, Meenathi Pet,<br />
                Thondamanatham,<br />
                Puducherry - 605502<br />
                India
            </p>
        </div>

        <div className="contact-item">
            <span className="item-icon">📧</span>
            <h4>Email</h4>
            <p>
                <a href="mailto:srisaastechnology@gmail.com" className="contact-link">
                    srisaastechnology@gmail.com
                </a>
            </p>
        </div>

        <div className="contact-item">
            <span className="item-icon">📞</span>
            <h4>Phone</h4>
            <p>
                <a href="tel:+916381072875" className="contact-link">
                    +91 6381072875
                </a>
            </p>
        </div>

        <div className="contact-item">
            <span className="item-icon">🌐</span>
            <h4>Website</h4>
            <p>
                <a href="https://srisaastech.vercel.app/" target="_blank" rel="noopener noreferrer" className="contact-link">
                    https://srisaastech.vercel.app/
                </a>
            </p>
        </div>
    </div>

    {/* ============ SOCIAL MEDIA SECTION ============ */}
    <div className="social-section">
        <h3 className="social-title">🌐 Connect With Us</h3>
        <p className="social-subtitle">Follow us on social media for updates, tips, and more!</p>
        
        <div className="social-links">
            {/* Instagram */}
            <a 
                href="https://www.instagram.com/syntax_saas_official/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link instagram"
                aria-label="Instagram"
            >
                <span className="social-icon">📷</span>
                <span className="social-label">Instagram</span>
            </a>

            {/* X (Twitter) */}
            <a 
                href="https://x.com/Syntech_SaaS" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link x-twitter"
                aria-label="X (Twitter)"
            >
                <span className="social-icon">𝕏</span>
                <span className="social-label">X (Twitter)</span>
            </a>

            {/* LinkedIn */}
            <a 
                href="https://www.linkedin.com/in/sri-saas-technology/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link linkedin"
                aria-label="LinkedIn"
            >
                <span className="social-icon">💼</span>
                <span className="social-label">LinkedIn</span>
            </a>

            {/* WhatsApp */}
            <a 
                href="https://wa.me/916381072875?text=Hi%20Syntax%20SaaS%20Team%2C%20I%27d%20like%20to%20know%20more%20about%20your%20services" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="social-link whatsapp"
                aria-label="WhatsApp"
            >
                <span className="social-icon">💬</span>
                <span className="social-label">WhatsApp</span>
            </a>
        </div>
    </div>

    <button
        className="footer-btn"
        onClick={() => navigate('/contact')}
    >
        📞 Visit Contact Page
    </button>
</div>

            </div>


            {/* Floating AI Chatbot */}

            <div className="ai-chatbot-container">

                {!isChatOpen ? (

                    <button className="ai-chatbot-button" onClick={() => setIsChatOpen(true)}>

                        🤖

                        <span className="notification-dot"></span>

                    </button>

                ) : (

                    <div className="ai-chatbot-window">

                        <div className="ai-chatbot-header">

                            <h3>🤖 AI Assistant</h3>

                            <button className="close-btn" onClick={() => setIsChatOpen(false)}>✕</button>

                        </div>

                        <div className="ai-chatbot-messages">

                            {chatMessages.map((msg, index) => (

                                <div key={index} className={`chat-message ${msg.type}`}>

                                    {msg.text}

                                </div>

                            ))}

                            {isLoading && (

                                <div className="chat-loading">

                                    <span></span>

                                    <span></span>

                                    <span></span>

                                </div>

                            )}

                        </div>

                        <form className="ai-chatbot-input" onSubmit={handleChatSubmit}>

                            <input

                                type="text"

                                value={chatInput}

                                onChange={(e) => setChatInput(e.target.value)}

                                placeholder="Ask me anything..."

                                disabled={isLoading}

                            />

                            <button type="submit" disabled={isLoading}>

                                {isLoading ? '⏳' : 'Send'}

                            </button>

                        </form>

                    </div>

                )}

            </div>

        </>

    );

}


export default Home;
