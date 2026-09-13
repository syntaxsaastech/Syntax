// src/pages/Home.js - Complete FULL working file
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, collection, onSnapshot, query, orderBy } from '../firebase/config';

// ============================================
// ADVANCED ANIMATED NETWORK BACKGROUND
// ============================================
// ============================================
// ULTRA HD INTERACTIVE NETWORK BACKGROUND
// ============================================
function NetworkCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: true });

        let width = 0;
        let height = 0;
        let particles = [];
        let animationId = null;
        let startTime = null;
        const mouse = { x: null, y: null, vx: 0, vy: 0, lastX: null, lastY: null };

        // Premium harmonized palette — coral, gold, teal, violet, sky
        const PALETTE = [
            { hex: '#FF6B6B', rgb: [255, 107, 107] },   // Coral
            { hex: '#FFC857', rgb: [255, 200, 87] },    // Gold
            { hex: '#4ECDC4', rgb: [78, 205, 196] },    // Teal
            { hex: '#9B7EFF', rgb: [155, 126, 255] },   // Violet
            { hex: '#5DA9FF', rgb: [93, 169, 255] },    // Sky
            { hex: '#FF7EB6', rgb: [255, 126, 182] },   // Rose
        ];

        const CONNECT_DISTANCE = 140;
        const CONNECT_DISTANCE_SQ = CONNECT_DISTANCE * CONNECT_DISTANCE;
        const MOUSE_RADIUS = 190;
        const MOUSE_RADIUS_SQ = MOUSE_RADIUS * MOUSE_RADIUS;
        const TRAIL_LENGTH = 6;

        const getParticleCount = () =>
            width < 600 ? 42 : width < 1000 ? 68 : 96;

        function resize() {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = Math.floor(width * dpr);
            canvas.height = Math.floor(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        function createParticles() {
            const count = getParticleCount();
            particles = Array.from({ length: count }, (_, i) => {
                const colorIndex = i % PALETTE.length;
                const color = PALETTE[colorIndex];
                const depth = Math.random(); // 0 = far, 1 = near
                return {
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5,
                    radius: 1.2 + depth * 2.4,
                    color,
                    depth,
                    opacity: 0,
                    targetOpacity: 0.55 + depth * 0.4,
                    delay: i * 22 + Math.random() * 280,
                    trail: [],
                    pulsePhase: Math.random() * Math.PI * 2,
                    pulseSpeed: 0.015 + Math.random() * 0.02,
                };
            });
        }

        function drawCursorAura() {
            if (mouse.x === null) return;

            // Outer soft aura
            const aura = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, MOUSE_RADIUS * 0.9
            );
            aura.addColorStop(0, 'rgba(255, 107, 107, 0.14)');
            aura.addColorStop(0.4, 'rgba(255, 200, 87, 0.07)');
            aura.addColorStop(0.75, 'rgba(78, 205, 196, 0.04)');
            aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * 0.9, 0, Math.PI * 2);
            ctx.fill();

            // Pulsing inner ring
            const t = performance.now() * 0.002;
            const ringRadius = 32 + Math.sin(t) * 4;
            ctx.strokeStyle = `rgba(255, 200, 87, ${0.35 + Math.sin(t) * 0.15})`;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, ringRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Bright center dot
            const center = ctx.createRadialGradient(
                mouse.x, mouse.y, 0,
                mouse.x, mouse.y, 6
            );
            center.addColorStop(0, 'rgba(255, 255, 255, 1)');
            center.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = center;
            ctx.beginPath();
            ctx.arc(mouse.x, mouse.y, 6, 0, Math.PI * 2);
            ctx.fill();
        }

        function drawLinks() {
            for (let i = 0; i < particles.length; i++) {
                const a = particles[i];
                if (a.opacity <= 0.05) continue;

                // Particle-to-particle links
                for (let j = i + 1; j < particles.length; j++) {
                    const b = particles[j];
                    if (b.opacity <= 0.05) continue;

                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < CONNECT_DISTANCE_SQ) {
                        const dist = Math.sqrt(distSq);
                        const t = 1 - dist / CONNECT_DISTANCE;
                        const alpha = t * 0.55 * Math.min(a.opacity, b.opacity);

                        // Blend colors between particles
                        const r = Math.round((a.color.rgb[0] + b.color.rgb[0]) / 2);
                        const g = Math.round((a.color.rgb[1] + b.color.rgb[1]) / 2);
                        const bl = Math.round((a.color.rgb[2] + b.color.rgb[2]) / 2);

                        ctx.strokeStyle = `rgba(${r}, ${g}, ${bl}, ${alpha})`;
                        ctx.lineWidth = 0.6 + t * 0.9;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }

                // Particle-to-mouse links with brighter gradient
                if (mouse.x !== null) {
                    const dx = a.x - mouse.x;
                    const dy = a.y - mouse.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < MOUSE_RADIUS_SQ) {
                        const dist = Math.sqrt(distSq);
                        const t = 1 - dist / MOUSE_RADIUS;
                        const alpha = t * 0.75 * a.opacity;

                        const grad = ctx.createLinearGradient(
                            a.x, a.y, mouse.x, mouse.y
                        );
                        const c = a.color.rgb;
                        grad.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${alpha})`);
                        grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.5})`);

                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 0.8 + t * 1.4;
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }
        }

        function drawParticles(timestamp) {
            for (const p of particles) {
                if (p.opacity <= 0.02) continue;

                // Pulse
                p.pulsePhase += p.pulseSpeed;
                const pulse = 1 + Math.sin(p.pulsePhase) * 0.15;
                const r = p.radius * pulse;

                // Outer glow
                const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 8);
                const c = p.color.rgb;
                glow.addColorStop(0, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.opacity * 0.85})`);
                glow.addColorStop(0.35, `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.opacity * 0.28})`);
                glow.addColorStop(1, `rgba(${c[0]}, ${c[1]}, ${c[2]}, 0)`);
                ctx.fillStyle = glow;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r * 8, 0, Math.PI * 2);
                ctx.fill();

                // Solid core
                ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${p.opacity})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();

                // White highlight for near particles
                if (p.depth > 0.6) {
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.7})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, r * 0.45, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        function step(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            ctx.clearRect(0, 0, width, height);

            // ---- Update ----
            for (const p of particles) {
                if (elapsed > p.delay && p.opacity < p.targetOpacity) {
                    p.opacity = Math.min(p.targetOpacity, p.opacity + 0.018);
                }

                p.x += p.vx;
                p.y += p.vy;

                // Bounce
                if (p.x <= 0 || p.x >= width) p.vx *= -1;
                if (p.y <= 0 || p.y >= height) p.vy *= -1;
                p.x = Math.max(0, Math.min(width, p.x));
                p.y = Math.max(0, Math.min(height, p.y));

                // Mouse repulsion with velocity injection
                if (mouse.x !== null && p.opacity > 0) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq < MOUSE_RADIUS_SQ && distSq > 0.01) {
                        const dist = Math.sqrt(distSq);
                        const force = (1 - dist / MOUSE_RADIUS) ** 2;
                        const fx = (dx / dist) * force * 1.6;
                        const fy = (dy / dist) * force * 1.6;
                        p.x += fx;
                        p.y += fy;
                        // Fling slightly faster based on cursor speed
                        p.vx += (mouse.vx || 0) * 0.004 * force;
                        p.vy += (mouse.vy || 0) * 0.004 * force;
                    }
                }

                // Clamp velocity
                const speed = Math.hypot(p.vx, p.vy);
                const maxSpeed = 1.4;
                if (speed > maxSpeed) {
                    p.vx = (p.vx / speed) * maxSpeed;
                    p.vy = (p.vy / speed) * maxSpeed;
                }
            }

            // ---- Draw ---- (order matters for depth)
            drawCursorAura();
            drawLinks();
            drawParticles(timestamp);

            // Fade cursor velocity
            mouse.vx *= 0.85;
            mouse.vy *= 0.85;

            animationId = requestAnimationFrame(step);
        }

        function handleMouseMove(e) {
            const rect = canvas.getBoundingClientRect();
            const nx = e.clientX - rect.left;
            const ny = e.clientY - rect.top;
            if (mouse.lastX !== null) {
                mouse.vx = nx - mouse.lastX;
                mouse.vy = ny - mouse.lastY;
            }
            mouse.x = nx;
            mouse.y = ny;
            mouse.lastX = nx;
            mouse.lastY = ny;
        }

        function handleMouseLeave() {
            mouse.x = null;
            mouse.y = null;
            mouse.lastX = null;
            mouse.lastY = null;
            mouse.vx = 0;
            mouse.vy = 0;
        }

        function handleResize() {
            resize();
            createParticles();
        }

        resize();
        createParticles();
        animationId = requestAnimationFrame(step);

        window.addEventListener('resize', handleResize);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', handleResize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return <canvas ref={canvasRef} className="network-canvas" aria-hidden="true" />;
}

// ============================================
// FEATURE CARD
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

// ============================================
// PROCESS STEP CARD (1 PLAN → 5 MAINTAIN)
// ============================================
function ProcessStep({ number, icon, title, description, index }) {
    const stepRef = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = stepRef.current;
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

    return (
        <div
            ref={stepRef}
            className={`process-step ${visible ? 'visible' : ''}`}
            style={{ transitionDelay: visible ? '0ms' : `${index * 130}ms` }}
        >
            <div className="process-step-number">{number}</div>
            <div className="process-step-icon">{icon}</div>
            <h3 className="process-step-title">{title}</h3>
            <p className="process-step-description">{description}</p>
            <div className="process-step-glow"></div>
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
    const [showOfferPopup, setShowOfferPopup] = useState(false);

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
        if (inputLower.includes('plan') || inputLower.includes('process') || inputLower.includes('step')) {
            return "🔄 Our workflow:\n1️⃣ PLAN — Requirements & strategy\n2️⃣ DEVELOP — Coding & building\n3️⃣ DEPLOY — Ship to production\n4️⃣ TEST — Quality assurance\n5️⃣ MAINTAIN — Ongoing support";
        }

        return "🤔 I'm not sure about that. Please ask me about:\n• Services\n• Pricing\n• Tech Stack\n• Remote Work\n• Support\n• Webinars\n• Projects\n• Satisfaction\n• About Us\n• Contact Information\n• Offers & Discounts\n• Our Process";
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

    // Process steps data (1 PLAN → 5 MAINTAIN)
    const processSteps = [
        {
            number: '1',
            icon: '🧭',
            title: 'PLAN',
            description: 'We gather your requirements, define goals, and craft a clear roadmap before any code is written.'
        },
        {
            number: '2',
            icon: '⚙️',
            title: 'DEVELOP',
            description: 'Our team builds your solution using modern frameworks, clean code, and best practices.'
        },
        {
            number: '3',
            icon: '🚀',
            title: 'DEPLOY',
            description: 'We ship your product to production with CI/CD pipelines, ensuring zero-downtime releases.'
        },
        {
            number: '4',
            icon: '🧪',
            title: 'TEST',
            description: 'Rigorous QA testing across devices, browsers, and edge cases to guarantee quality.'
        },
        {
            number: '5',
            icon: '🛡️',
            title: 'MAINTAIN',
            description: 'Ongoing support, monitoring, updates, and improvements to keep your product thriving.'
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

    // Get first active offer for the floating side button
    const activeOffer = offers.find((o) => o.active);

    return (
        <>
          <style>{`
/* ============================================
   HOME — "MIDNIGHT EDITORIAL" THEME
   Fonts: Space Grotesk (display) + IBM Plex Sans (body)
   Palette: Deep navy → electric lime → soft lavender
   ============================================ */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&display=swap');

.home-container {
    min-height: 100vh;
    padding-top: 80px;
    background: #0B1020;
    font-family: 'IBM Plex Sans', -apple-system, sans-serif;
    color: #E8EAF2;
    position: relative;
    overflow-x: hidden;
    animation: pageIn 0.9s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes pageIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

/* Aurora gradient backdrop */
.home-container::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
        radial-gradient(circle at 12% 8%, rgba(163, 255, 51, 0.09) 0%, transparent 38%),
        radial-gradient(circle at 88% 18%, rgba(140, 122, 255, 0.14) 0%, transparent 42%),
        radial-gradient(circle at 50% 92%, rgba(90, 240, 220, 0.07) 0%, transparent 45%),
        radial-gradient(circle at 70% 60%, rgba(255, 100, 200, 0.05) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
    animation: auroraShift 24s ease-in-out infinite;
}

@keyframes auroraShift {
    0%, 100% { transform: translate(0, 0) scale(1); opacity: 1; }
    33% { transform: translate(-20px, 15px) scale(1.04); opacity: 0.85; }
    66% { transform: translate(25px, -10px) scale(0.98); opacity: 0.95; }
}

.home-container > * { position: relative; z-index: 1; }

/* ============================================
   HERO — left-offset with grid overlay
   ============================================ */
.hero-section {
    position: relative;
    padding: 110px 60px 130px;
    text-align: center;
    background: transparent;
    border-bottom: 1px solid rgba(163, 255, 51, 0.14);
    overflow: hidden;
}

.hero-section::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
        linear-gradient(rgba(163, 255, 51, 0.055) 1px, transparent 1px),
        linear-gradient(90deg, rgba(163, 255, 51, 0.055) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse at center, black 40%, transparent 78%);
    -webkit-mask-image: radial-gradient(ellipse at center, black 40%, transparent 78%);
    pointer-events: none;
}

.network-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    pointer-events: none;
    z-index: 0;
    opacity: 0.85;
}

.hero-title,
.hero-subtitle,
.hero-tagline,
.hero-buttons {
    position: relative;
    z-index: 1;
}

.hero-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 4.5rem;
    font-weight: 700;
    letter-spacing: -0.045em;
    line-height: 1.02;
    margin: 0 0 24px 0;
    color: #FFFFFF;
    background: linear-gradient(120deg, #FFFFFF 0%, #A3FF33 45%, #8C7AFF 85%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: titleFlow 8s ease-in-out infinite;
}

@keyframes titleFlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

.hero-subtitle {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 1.0625rem;
    font-weight: 400;
    color: #8A90A8;
    max-width: 640px;
    margin: 0 auto 22px auto;
    line-height: 1.7;
    letter-spacing: 0.005em;
}

.hero-tagline {
    font-size: 0.875rem;
    color: #8A90A8;
    margin-bottom: 44px;
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    font-style: normal;
}

.hero-tagline span {
    display: inline-flex;
    align-items: center;
    padding: 7px 14px;
    border: 1px solid rgba(163, 255, 51, 0.2);
    border-radius: 100px;
    background: rgba(163, 255, 51, 0.04);
    color: #C6FF7A;
    font-size: 0.75rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
}

.hero-tagline span::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(120deg, transparent, rgba(163, 255, 51, 0.18), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
}

.hero-tagline span:hover::before { transform: translateX(100%); }

.hero-tagline span:hover {
    border-color: #A3FF33;
    background: rgba(163, 255, 51, 0.1);
    color: #A3FF33;
    transform: translateY(-1px);
    box-shadow: 0 0 24px rgba(163, 255, 51, 0.25);
}

.hero-buttons {
    display: flex;
    gap: 14px;
    justify-content: center;
    flex-wrap: wrap;
}

.btn-primary,
.btn-secondary {
    padding: 14px 32px;
    border-radius: 100px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    letter-spacing: -0.005em;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    border: none;
}

.btn-primary::before { display: none; }

.btn-primary {
    background: #A3FF33;
    color: #0B1020;
    box-shadow: 0 0 0 0 rgba(163, 255, 51, 0.5);
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow:
        0 0 0 1px rgba(163, 255, 51, 0.4),
        0 12px 32px rgba(163, 255, 51, 0.35),
        0 0 60px rgba(163, 255, 51, 0.2);
    background: #B4FF55;
}

.btn-secondary {
    background: transparent;
    color: #E8EAF2;
    border: 1px solid rgba(232, 234, 242, 0.18);
}

.btn-secondary:hover {
    background: rgba(140, 122, 255, 0.1);
    border-color: #8C7AFF;
    color: #C6BAFF;
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(140, 122, 255, 0.25);
}

/* ============================================
   STATS — glassy tiles with gradient numbers
   ============================================ */
.stats-section {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    padding: 70px 60px;
    background: transparent;
    border-bottom: 1px solid rgba(140, 122, 255, 0.1);
    max-width: 1300px;
    margin: 0 auto;
}

.stat-card {
    text-align: left;
    padding: 30px 26px;
    background: linear-gradient(155deg, rgba(140, 122, 255, 0.06), rgba(163, 255, 51, 0.02));
    border-radius: 20px;
    border: 1px solid rgba(140, 122, 255, 0.14);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(14px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.stat-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 40%;
    height: 2px;
    background: linear-gradient(90deg, transparent, #A3FF33, transparent);
    opacity: 0;
    transition: all 0.5s ease;
}

.stat-card:hover {
    transform: translateY(-6px);
    border-color: rgba(163, 255, 51, 0.4);
    background: linear-gradient(155deg, rgba(163, 255, 51, 0.08), rgba(140, 122, 255, 0.05));
    box-shadow: 0 20px 50px rgba(163, 255, 51, 0.15);
}

.stat-card:hover::after {
    opacity: 1;
    width: 100%;
}

.stat-icon {
    font-size: 1.5rem;
    margin-bottom: 14px;
    display: block;
    filter: drop-shadow(0 0 12px rgba(163, 255, 51, 0.3));
}

.stat-number {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1;
    background: linear-gradient(135deg, #FFFFFF 0%, #A3FF33 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.stat-label {
    color: #8A90A8;
    margin-top: 10px;
    font-size: 0.75rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-weight: 500;
}

/* ============================================
   PROCESS — vertical rail with gradient nodes
   ============================================ */
.process-section {
    padding: 110px 60px;
    background: transparent;
    text-align: center;
    position: relative;
}

.process-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 12px 0;
    background: linear-gradient(120deg, #FFFFFF 0%, #8C7AFF 50%, #A3FF33 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: titleFlow 8s ease-in-out infinite;
}

.process-subtitle {
    color: #8A90A8;
    font-size: 0.875rem;
    margin: 0 0 70px 0;
    letter-spacing: 0.04em;
    font-weight: 400;
}

.process-timeline {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 18px;
    max-width: 1300px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
}

.process-timeline::before {
    content: '';
    position: absolute;
    top: 42px;
    left: 8%;
    right: 8%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent,
        rgba(163, 255, 51, 0.5),
        rgba(140, 122, 255, 0.5),
        rgba(90, 240, 220, 0.5),
        transparent
    );
    background-size: 200% 100%;
    animation: railFlow 6s linear infinite;
    z-index: 0;
}

@keyframes railFlow {
    0% { background-position: 0% 50%; }
    100% { background-position: 200% 50%; }
}

.process-step {
    position: relative;
    padding: 30px 22px 28px;
    background: rgba(15, 20, 38, 0.7);
    border-radius: 18px;
    border: 1px solid rgba(140, 122, 255, 0.14);
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    text-align: center;
    opacity: 0;
    transform: translateY(40px) scale(0.96);
    overflow: hidden;
    z-index: 1;
    cursor: pointer;
    backdrop-filter: blur(12px);
}

.process-step.visible {
    opacity: 1;
    transform: translateY(0) scale(1);
}

.process-step:hover {
    transform: translateY(-10px) scale(1.03);
    border-color: rgba(163, 255, 51, 0.5);
    background: rgba(20, 28, 50, 0.9);
    box-shadow:
        0 20px 50px rgba(163, 255, 51, 0.12),
        0 0 0 1px rgba(163, 255, 51, 0.15) inset;
}

.process-step-number {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: linear-gradient(135deg, #A3FF33, #5AF0DC);
    color: #0B1020;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 3px solid #0B1020;
    z-index: 3;
    box-shadow: 0 0 24px rgba(163, 255, 51, 0.5);
    animation: nodePulse 2.4s ease-in-out infinite;
}

@keyframes nodePulse {
    0%, 100% { box-shadow: 0 0 24px rgba(163, 255, 51, 0.5); }
    50% { box-shadow: 0 0 40px rgba(140, 122, 255, 0.7); }
}

.process-step:nth-child(1) .process-step-number { background: linear-gradient(135deg, #A3FF33, #7ED321); }
.process-step:nth-child(2) .process-step-number { background: linear-gradient(135deg, #5AF0DC, #4ECDC4); }
.process-step:nth-child(3) .process-step-number { background: linear-gradient(135deg, #8C7AFF, #6A5AFF); }
.process-step:nth-child(4) .process-step-number { background: linear-gradient(135deg, #FF7EB6, #FF6B9D); }
.process-step:nth-child(5) .process-step-number { background: linear-gradient(135deg, #FFC857, #FFB020); }

.process-step-icon {
    font-size: 2.5rem;
    margin: 16px 0 12px;
    display: inline-block;
    animation: iconBob 3.5s ease-in-out infinite;
    filter: drop-shadow(0 0 20px rgba(163, 255, 51, 0.2));
}

@keyframes iconBob {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(3deg); }
}

.process-step-title {
    font-family: 'Space Grotesk', sans-serif;
    color: #FFFFFF;
    font-size: 0.9375rem;
    letter-spacing: 0.1em;
    margin: 6px 0 10px;
    font-weight: 700;
    text-transform: uppercase;
}

.process-step-description {
    color: #8A90A8;
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0;
}

.process-step-glow { display: none; }

/* ============================================
   FEATURES — bold glass cards with corner glow
   ============================================ */
.features-section {
    padding: 110px 60px;
    text-align: center;
    background: transparent;
    border-top: 1px solid rgba(140, 122, 255, 0.1);
    border-bottom: 1px solid rgba(140, 122, 255, 0.1);
}

.features-section h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 12px 0;
    background: linear-gradient(120deg, #FFFFFF 0%, #A3FF33 50%, #8C7AFF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: titleFlow 8s ease-in-out infinite;
}

.features-subtitle {
    color: #8A90A8;
    font-size: 0.875rem;
    margin: 0 0 60px 0;
    letter-spacing: 0.04em;
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    max-width: 1200px;
    margin: 0 auto;
}

.feature-card {
    background: linear-gradient(155deg, rgba(20, 28, 50, 0.75), rgba(11, 16, 32, 0.6));
    padding: 32px 26px;
    border-radius: 20px;
    border: 1px solid rgba(140, 122, 255, 0.15);
    transition: all 0.45s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    opacity: 0;
    transform: translateY(40px);
    backdrop-filter: blur(14px);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
    text-align: left;
}

.feature-card.visible {
    opacity: 1;
    transform: translateY(0);
}

.feature-card::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle at var(--x, 50%) var(--y, 50%),
        rgba(163, 255, 51, 0.15) 0%, transparent 40%);
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
    height: 2px;
    background: linear-gradient(90deg, transparent, #A3FF33, #8C7AFF, transparent);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.5s cubic-bezier(0.65, 0, 0.35, 1);
}

.feature-card:hover::before { opacity: 1; }
.feature-card:hover::after { transform: scaleX(1); }

.feature-card.visible:hover {
    transform: translateY(-10px);
    border-color: rgba(163, 255, 51, 0.45);
    box-shadow:
        0 24px 60px rgba(163, 255, 51, 0.12),
        0 0 0 1px rgba(163, 255, 51, 0.15) inset;
}

.feature-icon {
    font-size: 2.25rem;
    margin-bottom: 16px;
    display: inline-block;
    animation: iconBob 3s ease-in-out infinite;
    filter: drop-shadow(0 0 14px rgba(163, 255, 51, 0.25));
}

.feature-card h3 {
    font-family: 'Space Grotesk', sans-serif;
    color: #FFFFFF;
    margin: 0 0 10px 0;
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
}

.feature-card p {
    color: #8A90A8;
    line-height: 1.65;
    font-size: 0.8125rem;
    margin: 0;
}

.feature-badge {
    display: inline-block;
    margin-top: 16px;
    padding: 4px 12px;
    background: rgba(163, 255, 51, 0.08);
    border: 1px solid rgba(163, 255, 51, 0.25);
    border-radius: 100px;
    color: #C6FF7A;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

/* ============================================
   TECH STACK — pill grid with subtle glow
   ============================================ */
.tech-stack-section {
    padding: 110px 60px;
    text-align: center;
    background: transparent;
}

.tech-stack-section h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 12px 0;
    background: linear-gradient(120deg, #FFFFFF 0%, #5AF0DC 50%, #8C7AFF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: titleFlow 8s ease-in-out infinite;
}

.tech-stack-subtitle {
    color: #8A90A8;
    font-size: 0.875rem;
    margin: 0 0 60px 0;
    letter-spacing: 0.04em;
}

.tech-category { margin-bottom: 50px; }
.tech-category:last-child { margin-bottom: 0; }

.tech-category-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.8125rem;
    color: #A3FF33;
    margin: 0 auto 22px auto;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    max-width: 800px;
}

.tech-category-title::before,
.tech-category-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(163, 255, 51, 0.35), transparent);
}

.tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 12px;
    max-width: 1200px;
    margin: 0 auto;
}

.tech-item {
    background: rgba(20, 28, 50, 0.6);
    padding: 20px 14px;
    border-radius: 14px;
    border: 1px solid rgba(140, 122, 255, 0.12);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    cursor: pointer;
    text-align: center;
    backdrop-filter: blur(10px);
}

.tech-item::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(163, 255, 51, 0.12) 0%, transparent 60%);
    opacity: 0;
    transition: opacity 0.35s ease;
}

.tech-item:hover::before { opacity: 1; }

.tech-item:hover {
    transform: translateY(-6px) scale(1.03);
    border-color: rgba(163, 255, 51, 0.45);
    box-shadow:
        0 15px 40px rgba(163, 255, 51, 0.12),
        inset 0 0 20px rgba(163, 255, 51, 0.05);
}

.tech-item .tech-icon {
    display: block;
    font-size: 1.75rem;
    margin-bottom: 8px;
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    filter: drop-shadow(0 0 8px rgba(163, 255, 51, 0.2));
}

.tech-item:hover .tech-icon {
    transform: scale(1.25) rotate(-6deg);
}

.tech-item .tech-name {
    display: block;
    font-size: 0.75rem;
    color: #C8CEE0;
    font-weight: 500;
    letter-spacing: 0.02em;
    transition: color 0.3s ease;
}

.tech-item:hover .tech-name { color: #A3FF33; }

/* ============================================
   CONTACT — glass panel with gradient border
   ============================================ */
.contact-footer {
    padding: 90px 60px 70px;
    background: transparent;
    border-top: 1px solid rgba(140, 122, 255, 0.1);
    text-align: center;
}

.contact-footer h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    margin: 0 0 12px 0;
    background: linear-gradient(120deg, #FFFFFF 0%, #A3FF33 50%, #8C7AFF 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    background-size: 200% 200%;
    animation: titleFlow 8s ease-in-out infinite;
}

.contact-footer .subtitle {
    color: #8A90A8;
    font-size: 0.875rem;
    margin: 0 0 60px 0;
    letter-spacing: 0.04em;
}

.contact-grid-footer {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 18px;
    max-width: 1100px;
    margin: 0 auto;
    text-align: left;
}

.contact-item {
    background: linear-gradient(155deg, rgba(20, 28, 50, 0.7), rgba(11, 16, 32, 0.5));
    padding: 26px 22px;
    border-radius: 16px;
    border: 1px solid rgba(140, 122, 255, 0.14);
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    backdrop-filter: blur(12px);
    position: relative;
    overflow: hidden;
}

.contact-item:hover {
    transform: translateY(-6px);
    border-color: rgba(163, 255, 51, 0.4);
    box-shadow: 0 20px 50px rgba(163, 255, 51, 0.1);
}

.contact-item .item-icon {
    font-size: 1.5rem;
    display: block;
    margin-bottom: 14px;
    filter: drop-shadow(0 0 10px rgba(163, 255, 51, 0.25));
}

.contact-item h4 {
    font-family: 'Space Grotesk', sans-serif;
    color: #A3FF33;
    font-size: 0.75rem;
    font-weight: 600;
    margin: 0 0 8px 0;
    letter-spacing: 0.15em;
    text-transform: uppercase;
}

.contact-item p {
    color: #C8CEE0;
    font-size: 0.8125rem;
    line-height: 1.65;
    margin: 0;
}

.contact-item .contact-link {
    color: #8C7AFF;
    text-decoration: none;
    transition: color 0.2s ease;
    font-weight: 500;
    border-bottom: 1px solid transparent;
}

.contact-item .contact-link:hover {
    color: #A3FF33;
    border-bottom-color: #A3FF33;
}

.contact-footer .footer-btn {
    margin-top: 44px;
    background: linear-gradient(135deg, #A3FF33, #5AF0DC);
    color: #0B1020;
    border: none;
    border-radius: 100px;
    padding: 14px 36px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.9375rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: inline-flex;
    align-items: center;
    gap: 10px;
    box-shadow: 0 10px 30px rgba(163, 255, 51, 0.25);
}

.contact-footer .footer-btn:hover {
    transform: translateY(-3px) scale(1.03);
    box-shadow: 0 20px 50px rgba(163, 255, 51, 0.4);
}

/* ============================================
   SOCIAL — glass tiles with brand glow
   ============================================ */
.social-section {
    margin-top: 60px;
    padding-top: 50px;
    border-top: 1px solid rgba(140, 122, 255, 0.1);
}

.social-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 600;
    color: #FFFFFF;
    margin: 0 0 10px 0;
    letter-spacing: -0.02em;
}

.social-subtitle {
    color: #8A90A8;
    font-size: 0.8125rem;
    margin: 0 0 32px 0;
    letter-spacing: 0.04em;
}

.social-links {
    display: flex;
    justify-content: center;
    gap: 14px;
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
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.75rem;
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    overflow: hidden;
    background: rgba(20, 28, 50, 0.65);
    border: 1px solid rgba(140, 122, 255, 0.15);
    backdrop-filter: blur(12px);
}

.social-link::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at 50% 100%, rgba(163, 255, 51, 0.15) 0%, transparent 65%);
    opacity: 0;
    transition: opacity 0.4s ease;
}

.social-link:hover::before { opacity: 1; }

.social-link .social-icon {
    font-size: 1.75rem;
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 0 12px rgba(163, 255, 51, 0.25));
}

.social-link .social-label {
    color: #C8CEE0;
    font-size: 0.75rem;
    position: relative;
    z-index: 1;
    letter-spacing: 0.02em;
    transition: color 0.3s ease;
}

.social-link:hover {
    transform: translateY(-8px) scale(1.05);
    border-color: rgba(163, 255, 51, 0.45);
    box-shadow: 0 20px 50px rgba(163, 255, 51, 0.15);
}

.social-link:hover .social-icon { transform: scale(1.25) rotate(6deg); }
.social-link:hover .social-label { color: #A3FF33; }

/* Brand accent colors */
.social-link.instagram .social-icon {
    background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    filter: none;
}
.social-link.x-twitter .social-icon { color: #FFFFFF; }
.social-link.linkedin .social-icon { color: #4EA3FF; }
.social-link.whatsapp .social-icon { color: #25D366; }

/* ============================================
   FLOATING OFFER + AI CHATBOT
   ============================================ */
.floating-actions-container {
    position: fixed;
    bottom: 30px;
    right: 30px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 14px;
}

.floating-offer-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 20px;
    border-radius: 100px;
    border: 1px solid rgba(163, 255, 51, 0.4);
    background: linear-gradient(135deg, rgba(163, 255, 51, 0.15), rgba(140, 122, 255, 0.1));
    color: #FFFFFF;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    box-shadow: 0 10px 35px rgba(163, 255, 51, 0.2);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    animation: offerFloat 3s ease-in-out infinite;
    backdrop-filter: blur(14px);
}

.floating-offer-btn:hover {
    transform: translateY(-4px) scale(1.05);
    border-color: #A3FF33;
    background: linear-gradient(135deg, rgba(163, 255, 51, 0.25), rgba(140, 122, 255, 0.18));
    box-shadow: 0 18px 50px rgba(163, 255, 51, 0.35);
    animation-play-state: paused;
}

.floating-offer-btn .offer-btn-icon {
    font-size: 1.0625rem;
    animation: giftWiggle 2.4s ease-in-out infinite;
}

@keyframes offerFloat {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
}

@keyframes giftWiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-12deg); }
    75% { transform: rotate(12deg); }
}

.floating-offer-btn .offer-btn-badge {
    background: linear-gradient(135deg, #A3FF33, #5AF0DC);
    color: #0B1020;
    padding: 2px 8px;
    border-radius: 100px;
    font-size: 0.625rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    animation: pulse 1.8s infinite;
}

@keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.08); }
}

.ai-chatbot-button {
    width: 68px;
    height: 68px;
    border-radius: 50%;
    background: linear-gradient(135deg, #A3FF33, #5AF0DC 60%, #8C7AFF);
    border: none;
    box-shadow: 0 10px 40px rgba(163, 255, 51, 0.4);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    color: #0B1020;
    animation: pulse 2s infinite;
    position: relative;
}

.ai-chatbot-button:hover {
    transform: scale(1.1) rotate(6deg);
    box-shadow: 0 18px 60px rgba(163, 255, 51, 0.55);
}

.ai-chatbot-button .notification-dot {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 14px;
    height: 14px;
    background: #FF6B9D;
    border-radius: 50%;
    border: 2px solid #0B1020;
    animation: blink 1s infinite;
}

@keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.ai-chatbot-window {
    position: fixed;
    bottom: 112px;
    right: 30px;
    width: 400px;
    height: 550px;
    background: #0F1426;
    border-radius: 22px;
    border: 1px solid rgba(163, 255, 51, 0.25);
    box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(163, 255, 51, 0.08) inset;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    animation: chatPop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    z-index: 9999;
    backdrop-filter: blur(20px);
}

@keyframes chatPop {
    from { opacity: 0; transform: translateY(24px) scale(0.94); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

.ai-chatbot-header {
    padding: 16px 22px;
    background: linear-gradient(135deg, rgba(163, 255, 51, 0.12), rgba(140, 122, 255, 0.12));
    border-bottom: 1px solid rgba(163, 255, 51, 0.15);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.ai-chatbot-header h3 {
    font-family: 'Space Grotesk', sans-serif;
    color: #FFFFFF;
    font-size: 0.9375rem;
    font-weight: 600;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    letter-spacing: -0.005em;
}

.ai-chatbot-header .close-btn {
    background: none;
    border: none;
    color: #8A90A8;
    font-size: 1.25rem;
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 4px 8px;
    border-radius: 8px;
    line-height: 1;
}

.ai-chatbot-header .close-btn:hover {
    color: #A3FF33;
    background: rgba(163, 255, 51, 0.1);
    transform: rotate(90deg);
}

.ai-chatbot-messages {
    flex: 1;
    padding: 18px 22px;
    overflow-y: auto;
    background: #0B1020;
}

.ai-chatbot-messages::-webkit-scrollbar { width: 5px; }
.ai-chatbot-messages::-webkit-scrollbar-track { background: #0B1020; }
.ai-chatbot-messages::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #A3FF33, #8C7AFF);
    border-radius: 3px;
}

.chat-message {
    margin-bottom: 12px;
    padding: 11px 16px;
    border-radius: 14px;
    max-width: 85%;
    animation: msgIn 0.3s ease;
    font-size: 0.8125rem;
    white-space: pre-line;
    line-height: 1.55;
    font-family: 'IBM Plex Sans', sans-serif;
}

@keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.chat-message.user {
    background: linear-gradient(135deg, rgba(140, 122, 255, 0.2), rgba(140, 122, 255, 0.08));
    border: 1px solid rgba(140, 122, 255, 0.3);
    margin-left: auto;
    color: #C6BAFF;
}

.chat-message.ai {
    background: linear-gradient(135deg, rgba(163, 255, 51, 0.1), rgba(163, 255, 51, 0.03));
    border: 1px solid rgba(163, 255, 51, 0.2);
    margin-right: auto;
    color: #C6FF7A;
}

.chat-loading {
    display: flex;
    gap: 5px;
    padding: 10px 0;
}

.chat-loading span {
    width: 7px;
    height: 7px;
    background: #A3FF33;
    border-radius: 50%;
    animation: typing 1.4s infinite;
    box-shadow: 0 0 8px rgba(163, 255, 51, 0.5);
}

.chat-loading span:nth-child(2) { animation-delay: 0.2s; }
.chat-loading span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
    30% { transform: translateY(-8px); opacity: 1; }
}

.ai-chatbot-input {
    padding: 14px 18px;
    border-top: 1px solid rgba(163, 255, 51, 0.15);
    display: flex;
    gap: 10px;
    background: #0F1426;
}

.ai-chatbot-input input {
    flex: 1;
    padding: 10px 16px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(140, 122, 255, 0.2);
    border-radius: 100px;
    color: #E8EAF2;
    font-size: 0.8125rem;
    outline: none;
    transition: all 0.25s ease;
    font-family: 'IBM Plex Sans', sans-serif;
}

.ai-chatbot-input input::placeholder { color: #5A6180; }

.ai-chatbot-input input:focus {
    border-color: #A3FF33;
    background: rgba(163, 255, 51, 0.05);
    box-shadow: 0 0 20px rgba(163, 255, 51, 0.15);
}

.ai-chatbot-input button {
    padding: 10px 22px;
    background: linear-gradient(135deg, #A3FF33, #5AF0DC);
    color: #0B1020;
    border: none;
    border-radius: 100px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.8125rem;
    cursor: pointer;
    transition: all 0.25s ease;
}

.ai-chatbot-input button:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(163, 255, 51, 0.35);
}

.ai-chatbot-input button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* ============================================
   OFFER POPUP MODAL
   ============================================ */
.offer-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(11, 16, 32, 0.85);
    backdrop-filter: blur(14px);
    animation: fadeInModal 0.25s ease;
}

.offer-modal {
    position: relative;
    width: min(440px, 100%);
    max-height: calc(100vh - 40px);
    overflow-y: auto;
    padding: 36px 30px 28px;
    border: 1px solid rgba(163, 255, 51, 0.3);
    border-radius: 22px;
    background: linear-gradient(155deg, #141A2E, #0F1426);
    box-shadow:
        0 30px 80px rgba(0, 0, 0, 0.6),
        0 0 0 1px rgba(163, 255, 51, 0.08) inset;
    text-align: center;
    animation: offerModalIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.offer-modal-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 34px;
    height: 34px;
    border: 1px solid rgba(140, 122, 255, 0.2);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.04);
    color: #8A90A8;
    cursor: pointer;
    font-size: 0.875rem;
    transition: all 0.2s ease;
    line-height: 1;
}

.offer-modal-close:hover {
    color: #A3FF33;
    border-color: #A3FF33;
    background: rgba(163, 255, 51, 0.1);
    transform: rotate(90deg);
}

.offer-modal-icon {
    width: 72px;
    height: 72px;
    margin: 0 auto 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    background: linear-gradient(135deg, rgba(163, 255, 51, 0.15), rgba(140, 122, 255, 0.12));
    border: 1px solid rgba(163, 255, 51, 0.25);
    font-size: 2.25rem;
    box-shadow: 0 0 40px rgba(163, 255, 51, 0.2);
}

.offer-modal-label {
    display: inline-block;
    margin-bottom: 10px;
    color: #A3FF33;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.6875rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    text-transform: uppercase;
}

.offer-modal h3 {
    margin: 0 30px 12px;
    color: #FFFFFF;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    letter-spacing: -0.02em;
}

.offer-modal-description {
    margin: 0 auto 20px;
    color: #8A90A8;
    font-size: 0.875rem;
    line-height: 1.65;
}

.offer-modal-discount {
    display: inline-block;
    margin: 6px 0 20px;
    padding: 9px 20px;
    border: 1px solid rgba(163, 255, 51, 0.35);
    border-radius: 100px;
    background: rgba(163, 255, 51, 0.08);
    color: #C6FF7A;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.0625rem;
    font-weight: 700;
}

.offer-code-box {
    margin: 0 auto 18px;
    padding: 14px 18px;
    border: 1px dashed rgba(163, 255, 51, 0.35);
    border-radius: 14px;
    background: rgba(163, 255, 51, 0.04);
}

.offer-code-box span {
    display: block;
    margin-bottom: 6px;
    color: #8A90A8;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    font-weight: 600;
}

.offer-code-box strong {
    color: #A3FF33;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.25rem;
    letter-spacing: 0.1em;
    font-weight: 700;
}

.offer-modal-button {
    width: 100%;
    padding: 13px 20px;
    border: none;
    border-radius: 100px;
    background: linear-gradient(135deg, #A3FF33, #5AF0DC);
    color: #0B1020;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    box-shadow: 0 10px 30px rgba(163, 255, 51, 0.25);
}

.offer-modal-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 18px 50px rgba(163, 255, 51, 0.4);
}

@keyframes fadeInModal {
    from { opacity: 0; }
    to { opacity: 1; }
}

@keyframes offerModalIn {
    from { opacity: 0; transform: translateY(16px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
}

/* ============================================
   SCROLLBAR
   ============================================ */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #0B1020; }
::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #A3FF33, #8C7AFF);
    border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #B4FF55, #A393FF);
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1200px) {
    .features-grid { grid-template-columns: repeat(2, 1fr); }
    .process-timeline { grid-template-columns: repeat(3, 1fr); gap: 16px; }
    .process-timeline::before { display: none; }
}

@media (max-width: 992px) {
    .stats-section { grid-template-columns: repeat(2, 1fr); padding: 50px 30px; }
    .hero-title { font-size: 3.5rem; }
    .contact-grid-footer { grid-template-columns: repeat(2, 1fr); }
    .process-timeline { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .hero-section { padding: 80px 24px 90px; }
    .hero-title { font-size: 2.5rem; }
    .hero-subtitle { font-size: 0.9375rem; }
    .hero-tagline { font-size: 0.8125rem; gap: 8px; }
    .hero-tagline span { padding: 6px 12px; font-size: 0.6875rem; }
    .btn-primary, .btn-secondary { padding: 12px 24px; font-size: 0.875rem; }

    .stats-section { padding: 40px 24px; gap: 12px; }
    .stat-card { padding: 22px 18px; }
    .stat-number { font-size: 2.25rem; }
    .stat-label { font-size: 0.6875rem; }

    .features-section { padding: 70px 24px; }
    .features-section h2 { font-size: 2rem; }
    .features-grid { grid-template-columns: 1fr; gap: 16px; }

    .tech-stack-section { padding: 70px 24px; }
    .tech-stack-section h2 { font-size: 2rem; }
    .tech-grid { grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .tech-item { padding: 16px 10px; }
    .tech-item .tech-icon { font-size: 1.375rem; }
    .tech-item .tech-name { font-size: 0.6875rem; }
    .tech-category-title { font-size: 0.75rem; }

    .contact-footer { padding: 70px 24px 50px; }
    .contact-footer h2 { font-size: 2rem; }
    .contact-grid-footer { grid-template-columns: 1fr 1fr; gap: 14px; }
    .contact-item { padding: 20px 18px; }

    .process-section { padding: 70px 24px; }
    .process-title { font-size: 2rem; }
    .process-timeline { grid-template-columns: 1fr; gap: 20px; }
    .process-step { padding: 28px 22px; }
    .process-step-icon { font-size: 2rem; }

    .social-link { width: 90px; height: 90px; }
    .social-link .social-icon { font-size: 1.5rem; }

    .ai-chatbot-window { width: 92%; right: 4%; bottom: 100px; height: 460px; }
    .ai-chatbot-button { width: 58px; height: 58px; font-size: 1.625rem; }
    .floating-actions-container { bottom: 20px; right: 20px; gap: 12px; }
    .floating-offer-btn { padding: 10px 16px; font-size: 0.75rem; }
}

@media (max-width: 480px) {
    .hero-section { padding: 60px 18px 70px; }
    .hero-title { font-size: 1.875rem; }
    .hero-subtitle { font-size: 0.875rem; }
    .hero-tagline span { display: block; margin: 4px 0; }
    .btn-primary, .btn-secondary { padding: 11px 20px; font-size: 0.8125rem; }

    .features-section { padding: 60px 18px; }
    .features-section h2 { font-size: 1.75rem; }
    .features-subtitle { font-size: 0.75rem; }
    .feature-card h3 { font-size: 1rem; }

    .tech-grid { grid-template-columns: repeat(2, 1fr); }
    .tech-item { padding: 14px 8px; }
    .tech-item .tech-icon { font-size: 1.25rem; }
    .tech-item .tech-name { font-size: 0.625rem; }
    .tech-category-title::before,
    .tech-category-title::after { max-width: 20px; }

    .stats-section { grid-template-columns: 1fr 1fr; gap: 10px; }
    .stat-card { padding: 18px 14px; }
    .stat-number { font-size: 1.75rem; }
    .stat-icon { font-size: 1.25rem; }

    .contact-footer h2 { font-size: 1.75rem; }
    .contact-grid-footer { grid-template-columns: 1fr; }
    .contact-footer .footer-btn { padding: 12px 24px; font-size: 0.8125rem; }

    .process-title { font-size: 1.75rem; }
    .process-subtitle { font-size: 0.75rem; }
    .process-step-number { width: 32px; height: 32px; font-size: 0.75rem; }

    .offer-modal { padding: 30px 22px 22px; }
    .offer-modal h3 { font-size: 1.25rem; }
    .offer-modal-icon { width: 60px; height: 60px; font-size: 1.875rem; }

    .ai-chatbot-window { height: 420px; bottom: 88px; }
    .floating-actions-container { bottom: 15px; right: 15px; }
    .floating-offer-btn { padding: 9px 12px; font-size: 0.6875rem; }
    .floating-offer-btn .offer-btn-label { display: none; }
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
                        <button
    type="button"
    className="btn-primary"
    onClick={() => navigate('/client')}
>
    🚀 Get Started
</button>

<button
    type="button"
    className="btn-secondary"
    onClick={() => navigate('/service')}
>
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

                {/* ============================================
                    PROCESS SECTION — 1 PLAN → 5 MAINTAIN
                    ============================================ */}
                <div className="process-section">
                    <h2 className="process-title">🔄 How We Work</h2>
                    <p className="process-subtitle">
                        From Concept to Completion — Our 5-Step Proven Process
                    </p>

                    <div className="process-timeline">
                        {processSteps.map((step, index) => (
                            <ProcessStep
                                key={step.number}
                                number={step.number}
                                icon={step.icon}
                                title={step.title}
                                description={step.description}
                                index={index}
                            />
                        ))}
                    </div>
                </div>

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

                    {/* SOCIAL MEDIA SECTION */}
                    <div className="social-section">
                        <h3 className="social-title">🌐 Connect With Us</h3>
                        <p className="social-subtitle">Follow us on social media for updates, tips, and more!</p>

                        <div className="social-links">
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

            {/* ============================================
                FLOATING ACTIONS — Special Offer + AI Chatbot
                (bottom-right corner)
                ============================================ */}
            <div className="floating-actions-container">
                {/* Floating Special Offer Button — only shows if there is an active offer */}
                {!loadingOffers && activeOffer && (
                    <button
                        type="button"
                        className="floating-offer-btn"
                        onClick={() => {
                            setSelectedOffer(activeOffer);
                            setShowOfferPopup(true);
                        }}
                        aria-label="View special offer"
                    >
                        <span className="offer-btn-icon">🎁</span>
                        <span className="offer-btn-label">Special Offer</span>
                        <span className="offer-btn-badge">LIVE</span>
                    </button>
                )}

                {/* AI Chatbot */}
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

            {/* Special Offer Popup */}
            {showOfferPopup && selectedOffer && (
                <div
                    className="offer-modal-backdrop"
                    onClick={() => {
                        setShowOfferPopup(false);
                        setSelectedOffer(null);
                    }}
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
                            onClick={() => {
                                setShowOfferPopup(false);
                                setSelectedOffer(null);
                            }}
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

                        <button
                            type="button"
                            className="offer-modal-button"
                            onClick={() => {
                                setShowOfferPopup(false);
                                setSelectedOffer(null);
                            }}
                        >
                            Got It
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Home;