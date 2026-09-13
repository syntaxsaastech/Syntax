// src/components/Pricelist.jsx - Public Price List Page (Clerk-style light theme)
import React, { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot } from '../firebase/config';

function Pricelist() {
    const [prices, setPrices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Service type labels
    const serviceTypes = {
        'web-development': '🌐 Web Development',
        'mobile-app': '📱 Mobile App Development',
        'saas-solution': '☁️ SaaS Solution',
        'ai-automation': '🤖 AI & Automation',
        'ui-ux-design': '🎨 UI/UX Design',
        'cloud-infrastructure': '🏗️ Cloud Infrastructure',
        'backend-api': '🗄️ Backend & API',
        'data-analytics': '📊 Data Analytics',
        'devops-services': '🔧 DevOps & CI/CD',
        'maintenance-support': '🛠️ Maintenance & Support',
        'consultation': '💡 Consultation & Strategy',
        'other': '📌 Other Service'
    };

    // Fetch prices from Firestore
    useEffect(() => {
        try {
            const pricesQuery = query(
                collection(db, 'prices'),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(pricesQuery, (snapshot) => {
                try {
                    const priceData = [];
                    snapshot.forEach((doc) => {
                        priceData.push({ id: doc.id, ...doc.data() });
                    });
                    setPrices(priceData);
                    setLoading(false);
                } catch (error) {
                    console.error('Error processing prices:', error);
                    setLoading(false);
                }
            });

            return () => unsubscribe();
        } catch (error) {
            console.error('Error setting up prices listener:', error);
            setLoading(false);
        }
    }, []);

    // Get all active prices
    const activePrices = prices.filter(p => p.active !== false);

    // Filter prices (by category + search)
    const filteredPrices = activePrices.filter(price => {
        const matchesCategory = selectedCategory === 'all' || price.category === selectedCategory;
        const matchesSearch =
            price.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            price.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            price.category?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    // Group filtered prices by category
    const groupedPrices = () => {
        const grouped = {};
        filteredPrices.forEach(price => {
            const category = price.category || 'other';
            if (!grouped[category]) grouped[category] = [];
            grouped[category].push(price);
        });
        return grouped;
    };

    // Sort categories by defined order
    const categoryOrder = Object.keys(serviceTypes);
    const grouped = groupedPrices();
    const categories = Object.keys(grouped).sort(
        (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );

    // Dropdown options
    const allActiveCategories = Object.keys(
        activePrices.reduce((acc, p) => {
            const cat = p.category || 'other';
            acc[cat] = true;
            return acc;
        }, {})
    ).sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

    return (
        <>
            <style>{`
/* =========================================================
   PRICELIST — Multi-Color Premium Design
   Fonts: Space Grotesk (headings) + Inter (body)
   ========================================================= */
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap');

/* =========================================================
   PAGE
   ========================================================= */
.pricelist-page {
    min-height: 100vh;
    padding: 120px 30px 80px;
    background: #FAFBFF;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: #0F172A;
    position: relative;
    overflow: hidden;
}

/* Multi-color aura backdrop */
.pricelist-page::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
        radial-gradient(circle at 8% 6%, rgba(255, 107, 107, 0.10) 0%, transparent 42%),
        radial-gradient(circle at 92% 12%, rgba(255, 107, 214, 0.09) 0%, transparent 42%),
        radial-gradient(circle at 50% 98%, rgba(77, 150, 255, 0.10) 0%, transparent 45%),
        radial-gradient(circle at 15% 75%, rgba(107, 203, 119, 0.08) 0%, transparent 42%),
        radial-gradient(circle at 85% 80%, rgba(255, 217, 61, 0.08) 0%, transparent 42%);
    pointer-events: none;
    z-index: 0;
    animation: plAuraBreathe 14s ease-in-out infinite;
}

@keyframes plAuraBreathe {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.03); opacity: 0.85; }
}

.pricelist-inner {
    max-width: 1200px;
    margin: 0 auto;
    position: relative;
    z-index: 1;
}

/* =========================================================
   HEADER — multi-color gradient title
   ========================================================= */
.pl-header {
    text-align: center;
    margin-bottom: 56px;
}

.pl-header-icon {
    font-size: 3.5rem;
    display: block;
    margin-bottom: 14px;
    animation: plFloat 3.5s ease-in-out infinite;
    filter: drop-shadow(0 8px 24px rgba(255, 217, 61, 0.35));
}

@keyframes plFloat {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(-4deg); }
}

.pl-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 3.25rem;
    font-weight: 700;
    letter-spacing: -0.04em;
    line-height: 1.1;
    margin: 0 0 16px 0;
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
    animation: plTitleFlow 10s ease-in-out infinite;
}

@keyframes plTitleFlow {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}

/* Rainbow underline */
.pl-title::after {
    content: '';
    display: block;
    width: 88px;
    height: 3px;
    margin: 20px auto 0;
    border-radius: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: plTitleFlow 6s ease-in-out infinite;
}

.pl-subtitle {
    color: #64748B;
    font-size: 1rem;
    max-width: 620px;
    margin: 0 auto;
    line-height: 1.65;
    font-family: 'Inter', sans-serif;
}

/* =========================================================
   FILTERS
   ========================================================= */
.pl-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 48px;
    background: #FFFFFF;
    padding: 16px;
    border-radius: 16px;
    border: 1px solid #E2E8F0;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    position: relative;
    overflow: hidden;
}

/* Rainbow line at top of filters */
.pl-filters::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: plTitleFlow 8s ease-in-out infinite;
}

.pl-search-input {
    flex: 1;
    min-width: 200px;
    padding: 11px 16px;
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 10px;
    color: #0F172A;
    font-size: 0.875rem;
    font-family: inherit;
    outline: none;
    transition: all 0.25s ease;
}

.pl-search-input::placeholder { color: #9CA3AF; }

.pl-search-input:focus {
    border-color: #6366F1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.10);
}

.pl-select {
    padding: 11px 16px;
    background: #FFFFFF;
    border: 1px solid #D1D5DB;
    border-radius: 10px;
    color: #0F172A;
    font-size: 0.875rem;
    font-family: inherit;
    cursor: pointer;
    outline: none;
    transition: all 0.25s ease;
}

.pl-select:focus {
    border-color: #6366F1;
    box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.10);
}

/* =========================================================
   LOADING / EMPTY
   ========================================================= */
.pl-state {
    text-align: center;
    padding: 80px 20px;
    color: #64748B;
}

.pl-state .state-icon {
    font-size: 3rem;
    display: block;
    margin-bottom: 14px;
    opacity: 0.7;
    animation: plFloat 3.5s ease-in-out infinite;
}

.pl-state p {
    font-size: 0.9375rem;
    margin: 6px 0;
}

.pl-state .state-hint {
    font-size: 0.8125rem;
    color: #94A3B8;
}

.pl-loading-spinner {
    font-size: 2.5rem;
    display: block;
    margin-bottom: 12px;
    animation: plSpin 1.2s linear infinite;
    filter: drop-shadow(0 0 12px rgba(99, 102, 241, 0.25));
}

@keyframes plSpin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* =========================================================
   CATEGORY SECTIONS — each gets its own color accent
   ========================================================= */
.pl-category-section {
    margin-bottom: 56px;
    animation: plSectionIn 0.7s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes plSectionIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.pl-category-title {
    font-family: 'Space Grotesk', sans-serif;
    color: #0F172A;
    font-size: 1.375rem;
    font-weight: 700;
    margin: 0 0 22px 0;
    padding-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    letter-spacing: -0.02em;
    position: relative;
    border-bottom: none;
}

/* Gradient underline per category */
.pl-category-title::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    border-radius: 2px;
    animation: plTitleFlow 8s ease-in-out infinite;
    opacity: 0.7;
}

/* Category count pill */
.pl-category-count {
    font-family: 'Inter', sans-serif;
    font-size: 0.75rem;
    color: #FFFFFF;
    background: linear-gradient(135deg, #6366F1, #8B5CF6);
    padding: 4px 12px;
    border-radius: 999px;
    font-weight: 600;
    letter-spacing: 0.02em;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.pl-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
}

/* =========================================================
   PRICE CARD — multi-color per position
   ========================================================= */
.pl-card {
    position: relative;
    background: #FFFFFF;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    padding: 28px;
    transition:
        transform 0.45s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.45s cubic-bezier(0.16, 1, 0.3, 1),
        border-color 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 4px 12px rgba(15, 23, 42, 0.04);
    isolation: isolate;
    overflow: hidden;
}

/* Colored top strip per card */
.pl-card::after {
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

.pl-card:hover::after { transform: scaleX(1); }

/* Glow behind card */
.pl-card::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 20px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.5s ease;
    filter: blur(20px);
}

.pl-card:hover::before { opacity: 0.3; }

/* Colored accents by nth-child */
.pl-card:nth-child(1)::after { background: linear-gradient(90deg, #FF6B6B, #FF9F43); }
.pl-card:nth-child(1)::before { background: radial-gradient(circle, #FF6B6B, transparent 70%); }

.pl-card:nth-child(2)::after { background: linear-gradient(90deg, #FF6BD6, #FF6B9D); }
.pl-card:nth-child(2)::before { background: radial-gradient(circle, #FF6BD6, transparent 70%); }

.pl-card:nth-child(3)::after { background: linear-gradient(90deg, #4D96FF, #5AF0DC); }
.pl-card:nth-child(3)::before { background: radial-gradient(circle, #4D96FF, transparent 70%); }

.pl-card:nth-child(4)::after { background: linear-gradient(90deg, #6BCB77, #A3FF33); }
.pl-card:nth-child(4)::before { background: radial-gradient(circle, #6BCB77, transparent 70%); }

.pl-card:nth-child(5)::after { background: linear-gradient(90deg, #FFD93D, #FF9F43); }
.pl-card:nth-child(5)::before { background: radial-gradient(circle, #FFD93D, transparent 70%); }

.pl-card:nth-child(6)::after { background: linear-gradient(90deg, #FF9F43, #FF6B6B); }
.pl-card:nth-child(6)::before { background: radial-gradient(circle, #FF9F43, transparent 70%); }

.pl-card:nth-child(7)::after { background: linear-gradient(90deg, #8C7AFF, #FF6BD6); }
.pl-card:nth-child(7)::before { background: radial-gradient(circle, #8C7AFF, transparent 70%); }

.pl-card:nth-child(8)::after { background: linear-gradient(90deg, #5AF0DC, #4D96FF); }
.pl-card:nth-child(8)::before { background: radial-gradient(circle, #5AF0DC, transparent 70%); }

.pl-card:hover {
    transform: translateY(-8px);
    border-color: #CBD5E1;
    box-shadow:
        0 6px 12px rgba(15, 23, 42, 0.05),
        0 28px 56px rgba(15, 23, 42, 0.12);
}

/* Popular badge */
.pl-popular-badge {
    position: absolute;
    top: -10px;
    right: 20px;
    padding: 5px 14px;
    background: linear-gradient(135deg, #FF6B6B, #FF9F43);
    border-radius: 999px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 0.65rem;
    font-weight: 700;
    color: #FFFFFF;
    letter-spacing: 0.08em;
    box-shadow: 0 6px 16px rgba(255, 107, 107, 0.35);
    animation: plPulseBadge 2s ease-in-out infinite;
    z-index: 4;
}

@keyframes plPulseBadge {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
}

/* =========================================================
   CARD HEADER
   ========================================================= */
.pl-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 18px;
}

.pl-card-icon {
    width: 52px;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    font-size: 1.5rem;
    flex-shrink: 0;
    box-shadow:
        0 4px 12px rgba(15, 23, 42, 0.08),
        0 2px 4px rgba(15, 23, 42, 0.04);
    transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Colored icon backgrounds */
.pl-card:nth-child(1) .pl-card-icon { background: linear-gradient(135deg, #FF6B6B, #FF9F43); }
.pl-card:nth-child(2) .pl-card-icon { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); }
.pl-card:nth-child(3) .pl-card-icon { background: linear-gradient(135deg, #4D96FF, #5AF0DC); }
.pl-card:nth-child(4) .pl-card-icon { background: linear-gradient(135deg, #6BCB77, #A3FF33); }
.pl-card:nth-child(5) .pl-card-icon { background: linear-gradient(135deg, #FFD93D, #FF9F43); }
.pl-card:nth-child(6) .pl-card-icon { background: linear-gradient(135deg, #FF9F43, #FF6B6B); }
.pl-card:nth-child(7) .pl-card-icon { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); }
.pl-card:nth-child(8) .pl-card-icon { background: linear-gradient(135deg, #5AF0DC, #4D96FF); }

.pl-card:hover .pl-card-icon {
    transform: scale(1.1) rotate(-6deg);
}

.pl-card-title {
    color: #0F172A;
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.0625rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.3;
    transition: color 0.3s ease;
}

/* Title color per card on hover */
.pl-card:nth-child(1):hover .pl-card-title { color: #FF6B6B; }
.pl-card:nth-child(2):hover .pl-card-title { color: #FF6BD6; }
.pl-card:nth-child(3):hover .pl-card-title { color: #4D96FF; }
.pl-card:nth-child(4):hover .pl-card-title { color: #6BCB77; }
.pl-card:nth-child(5):hover .pl-card-title { color: #F59E0B; }
.pl-card:nth-child(6):hover .pl-card-title { color: #FF9F43; }
.pl-card:nth-child(7):hover .pl-card-title { color: #8C7AFF; }
.pl-card:nth-child(8):hover .pl-card-title { color: #14B8A6; }

/* =========================================================
   PRICE
   ========================================================= */
.pl-card-price-row {
    margin-bottom: 16px;
    display: flex;
    align-items: baseline;
    gap: 6px;
}

.pl-card-price {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 2rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    line-height: 1;
    background: linear-gradient(135deg, #0F172A, #334155);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    transition: all 0.3s ease;
}

/* Price gradient per card */
.pl-card:nth-child(1) .pl-card-price { background: linear-gradient(135deg, #FF6B6B, #FF9F43); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(2) .pl-card-price { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(3) .pl-card-price { background: linear-gradient(135deg, #4D96FF, #5AF0DC); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(4) .pl-card-price { background: linear-gradient(135deg, #6BCB77, #A3FF33); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(5) .pl-card-price { background: linear-gradient(135deg, #F59E0B, #FF9F43); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(6) .pl-card-price { background: linear-gradient(135deg, #FF9F43, #FF6B6B); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(7) .pl-card-price { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
.pl-card:nth-child(8) .pl-card-price { background: linear-gradient(135deg, #5AF0DC, #4D96FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

.pl-card-price-unit {
    color: #94A3B8;
    font-family: 'Inter', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
}

/* =========================================================
   DESCRIPTION
   ========================================================= */
.pl-card-description {
    color: #64748B;
    font-size: 0.8125rem;
    line-height: 1.6;
    margin: 0 0 18px 0;
    font-family: 'Inter', sans-serif;
}

/* =========================================================
   FEATURES
   ========================================================= */
.pl-features {
    list-style: none;
    padding: 0;
    margin: 0 0 20px 0;
    flex: 1;
}

.pl-features li {
    color: #334155;
    font-size: 0.8125rem;
    padding: 9px 0;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid #F1F5F9;
    font-family: 'Inter', sans-serif;
    transition: color 0.2s ease;
}

.pl-features li:last-child { border-bottom: none; }

.pl-features .check {
    font-weight: 700;
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    font-size: 0.65rem;
    color: #FFFFFF;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.pl-card:hover .pl-features .check {
    transform: scale(1.15);
}

/* Colored check circles */
.pl-card:nth-child(1) .pl-features .check { background: linear-gradient(135deg, #FF6B6B, #FF9F43); }
.pl-card:nth-child(2) .pl-features .check { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); }
.pl-card:nth-child(3) .pl-features .check { background: linear-gradient(135deg, #4D96FF, #5AF0DC); }
.pl-card:nth-child(4) .pl-features .check { background: linear-gradient(135deg, #6BCB77, #A3FF33); }
.pl-card:nth-child(5) .pl-features .check { background: linear-gradient(135deg, #F59E0B, #FF9F43); }
.pl-card:nth-child(6) .pl-features .check { background: linear-gradient(135deg, #FF9F43, #FF6B6B); }
.pl-card:nth-child(7) .pl-features .check { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); }
.pl-card:nth-child(8) .pl-features .check { background: linear-gradient(135deg, #5AF0DC, #4D96FF); }

/* =========================================================
   DELIVERY PILL
   ========================================================= */
.pl-delivery {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #334155;
    font-size: 0.8125rem;
    font-weight: 500;
    margin-bottom: 16px;
    padding: 10px 14px;
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    font-family: 'Inter', sans-serif;
    transition: all 0.3s ease;
}

/* Colored delivery pill per card */
.pl-card:nth-child(1) .pl-delivery { background: rgba(255, 107, 107, 0.06); border-color: rgba(255, 107, 107, 0.18); color: #C53030; }
.pl-card:nth-child(2) .pl-delivery { background: rgba(255, 107, 214, 0.06); border-color: rgba(255, 107, 214, 0.18); color: #C026A0; }
.pl-card:nth-child(3) .pl-delivery { background: rgba(77, 150, 255, 0.06); border-color: rgba(77, 150, 255, 0.18); color: #1E5FCC; }
.pl-card:nth-child(4) .pl-delivery { background: rgba(107, 203, 119, 0.08); border-color: rgba(107, 203, 119, 0.22); color: #2F855A; }
.pl-card:nth-child(5) .pl-delivery { background: rgba(255, 217, 61, 0.10); border-color: rgba(255, 217, 61, 0.28); color: #B7791F; }
.pl-card:nth-child(6) .pl-delivery { background: rgba(255, 159, 67, 0.08); border-color: rgba(255, 159, 67, 0.22); color: #C05621; }
.pl-card:nth-child(7) .pl-delivery { background: rgba(140, 122, 255, 0.08); border-color: rgba(140, 122, 255, 0.22); color: #6A5ACD; }
.pl-card:nth-child(8) .pl-delivery { background: rgba(90, 240, 220, 0.10); border-color: rgba(90, 240, 220, 0.28); color: #0E7490; }

/* =========================================================
   CTA BUTTON — multi-color per card
   ========================================================= */
.pl-cta {
    display: block;
    text-align: center;
    padding: 12px 20px;
    color: #FFFFFF;
    text-decoration: none;
    border-radius: 12px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.9375rem;
    letter-spacing: -0.005em;
    transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s ease,
        filter 0.3s ease;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
    position: relative;
    overflow: hidden;
}

/* Color per card */
.pl-card:nth-child(1) .pl-cta { background: linear-gradient(135deg, #FF6B6B, #FF9F43); }
.pl-card:nth-child(2) .pl-cta { background: linear-gradient(135deg, #FF6BD6, #FF6B9D); }
.pl-card:nth-child(3) .pl-cta { background: linear-gradient(135deg, #4D96FF, #5AF0DC); }
.pl-card:nth-child(4) .pl-cta { background: linear-gradient(135deg, #6BCB77, #A3FF33); color: #0F172A; }
.pl-card:nth-child(5) .pl-cta { background: linear-gradient(135deg, #FFD93D, #FF9F43); color: #0F172A; }
.pl-card:nth-child(6) .pl-cta { background: linear-gradient(135deg, #FF9F43, #FF6B6B); }
.pl-card:nth-child(7) .pl-cta { background: linear-gradient(135deg, #8C7AFF, #FF6BD6); }
.pl-card:nth-child(8) .pl-cta { background: linear-gradient(135deg, #5AF0DC, #4D96FF); }

.pl-cta:hover {
    transform: translateY(-2px);
    filter: brightness(1.08);
    box-shadow:
        0 8px 20px rgba(15, 23, 42, 0.15),
        0 16px 36px rgba(15, 23, 42, 0.10);
}

/* =========================================================
   BOTTOM CTA SECTION
   ========================================================= */
.pl-cta-section {
    margin-top: 70px;
    text-align: center;
    padding: 56px 32px;
    background: #FFFFFF;
    border-radius: 24px;
    border: 1px solid #E2E8F0;
    box-shadow:
        0 1px 2px rgba(15, 23, 42, 0.04),
        0 8px 24px rgba(15, 23, 42, 0.06);
    position: relative;
    overflow: hidden;
}

/* Rainbow top strip */
.pl-cta-section::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
    background-size: 200% 100%;
    animation: plTitleFlow 8s ease-in-out infinite;
}

.pl-cta-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    letter-spacing: -0.03em;
    margin: 0 0 12px 0;
    background: linear-gradient(
        120deg,
        #FF6B6B 0%,
        #FFD93D 30%,
        #6BCB77 55%,
        #4D96FF 80%,
        #FF6BD6 100%
    );
    background-size: 200% 200%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: plTitleFlow 8s ease-in-out infinite;
}

.pl-cta-text {
    color: #64748B;
    margin: 0 0 28px 0;
    font-size: 0.9375rem;
    line-height: 1.65;
    font-family: 'Inter', sans-serif;
    max-width: 560px;
    margin-left: auto;
    margin-right: auto;
}

.pl-cta-btn {
    display: inline-block;
    padding: 14px 36px;
    background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
    background-size: 200% 200%;
    color: #FFFFFF;
    text-decoration: none;
    border-radius: 12px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: 0.9375rem;
    letter-spacing: -0.005em;
    box-shadow: 0 10px 28px rgba(99, 102, 241, 0.35);
    transition:
        transform 0.3s cubic-bezier(0.16, 1, 0.3, 1),
        box-shadow 0.3s ease,
        background-position 0.6s ease;
}

.pl-cta-btn:hover {
    transform: translateY(-3px);
    background-position: 100% 50%;
    box-shadow: 0 16px 40px rgba(139, 92, 246, 0.45);
}

/* =========================================================
   SCROLLBAR
   ========================================================= */
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: #F1F5F9; }
::-webkit-scrollbar-thumb {
    border-radius: 10px;
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #FF6BD6);
}
::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #4D96FF, #FF6BD6);
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 768px) {
    .pricelist-page { padding: 100px 18px 50px; }
    .pl-title { font-size: 2.25rem; }
    .pl-title::after { width: 60px; margin-top: 16px; }
    .pl-header-icon { font-size: 2.75rem; }
    .pl-subtitle { font-size: 0.9375rem; }
    .pl-grid { grid-template-columns: 1fr; gap: 18px; }
    .pl-category-title { font-size: 1.125rem; }
    .pl-card { padding: 24px; border-radius: 18px; }
    .pl-card-price { font-size: 1.75rem; }
    .pl-card-icon { width: 46px; height: 46px; font-size: 1.25rem; border-radius: 12px; }
    .pl-cta-section { padding: 40px 24px; border-radius: 20px; }
    .pl-cta-title { font-size: 1.5rem; }
}

@media (max-width: 480px) {
    .pricelist-page { padding: 90px 14px 40px; }
    .pl-title { font-size: 1.875rem; }
    .pl-title::after { width: 50px; margin-top: 14px; }
    .pl-subtitle { font-size: 0.875rem; }
    .pl-filters { padding: 14px; }
    .pl-search-input, .pl-select { padding: 10px 14px; }
    .pl-card { padding: 22px; border-radius: 16px; }
    .pl-card-icon { width: 42px; height: 42px; font-size: 1.125rem; border-radius: 11px; }
    .pl-card-title { font-size: 1rem; }
    .pl-card-price { font-size: 1.625rem; }
    .pl-features li { font-size: 0.78rem; padding: 8px 0; }
    .pl-cta-section { padding: 32px 20px; border-radius: 18px; }
    .pl-cta-title { font-size: 1.25rem; }
    .pl-cta-btn { padding: 12px 26px; font-size: 0.875rem; }
}

/* =========================================================
   REDUCED MOTION
   ========================================================= */
@media (prefers-reduced-motion: reduce) {
    .pricelist-page::before,
    .pl-header-icon,
    .pl-title,
    .pl-title::after,
    .pl-filters::before,
    .pl-category-title::after,
    .pl-popular-badge,
    .pl-cta-section::before,
    .pl-cta-title,
    .pl-loading-spinner {
        animation: none !important;
    }
    .pl-card,
    .pl-card-icon,
    .pl-cta,
    .pl-cta-btn,
    .pl-card::after,
    .pl-card::before,
    .pl-features .check {
        transition: none !important;
    }
}
`}</style>

            <div className="pricelist-page">
                <div className="pricelist-inner">
                    {/* Header */}
                    <div className="pl-header">
                        <span className="pl-header-icon">💰</span>
                        <h1 className="pl-title">Our Pricing</h1>
                        <p className="pl-subtitle">
                            Transparent pricing for all our services. Choose the plan that fits your needs.
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="pl-filters">
                        <input
                            type="text"
                            className="pl-search-input"
                            placeholder="🔍 Search prices..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <select
                            className="pl-select"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                        >
                            <option value="all">📋 All Categories</option>
                            {allActiveCategories.map(cat => (
                                <option key={cat} value={cat}>{serviceTypes[cat] || cat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Loading / Empty / Grid */}
                    {loading ? (
                        <div className="pl-state">
                            <span className="pl-loading-spinner">⏳</span>
                            <p>Loading prices...</p>
                        </div>
                    ) : filteredPrices.length === 0 ? (
                        <div className="pl-state">
                            <span className="state-icon">📭</span>
                            <p>No prices available yet.</p>
                            <p className="state-hint">Check back soon for our updated pricing!</p>
                        </div>
                    ) : (
                        <div>
                            {categories.map(category => {
                                const categoryPrices = grouped[category];
                                if (!categoryPrices || categoryPrices.length === 0) return null;

                                return (
                                    <div key={category} className="pl-category-section">
                                        <h2 className="pl-category-title">
                                            {serviceTypes[category] || category}
                                            <span className="pl-category-count">
                                                {categoryPrices.length} plan{categoryPrices.length !== 1 ? 's' : ''}
                                            </span>
                                        </h2>
                                        <div className="pl-grid">
                                            {categoryPrices.map(price => (
                                                <PriceCard key={price.id} price={price} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* CTA Section */}
                    <div className="pl-cta-section">
                        <h2 className="pl-cta-title">Need a Custom Quote?</h2>
                        <p className="pl-cta-text">
                            Every project is unique. Contact us for a personalized quote tailored to your needs.
                        </p>
                        <a href="/client" className="pl-cta-btn">
                            📞 Get in Touch
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}

// ============================================
// Individual Price Card Component
// ============================================
function PriceCard({ price }) {
    return (
        <div className="pl-card">
            {/* Popular Badge */}
            {price.popular && (
                <div className="pl-popular-badge">🔥 POPULAR</div>
            )}

            {/* Icon & Title */}
            <div className="pl-card-header">
                <span className="pl-card-icon">{price.icon || '💎'}</span>
                <h3 className="pl-card-title">{price.title}</h3>
            </div>

            {/* Price */}
            <div className="pl-card-price-row">
                <span className="pl-card-price">{price.price}</span>
                {price.priceUnit && (
                    <span className="pl-card-price-unit">{price.priceUnit}</span>
                )}
            </div>

            {/* Description */}
            {price.description && (
                <p className="pl-card-description">{price.description}</p>
            )}

            {/* Features */}
            {price.features && price.features.length > 0 && (
                <ul className="pl-features">
                    {price.features.map((feature, idx) => (
                        <li key={idx}>
                            <span className="check">✓</span>
                            {feature}
                        </li>
                    ))}
                </ul>
            )}

            {/* Delivery Time */}
            {price.deliveryTime && (
                <div className="pl-delivery">
                    <span>⏱️</span>
                    <span>Delivery: {price.deliveryTime}</span>
                </div>
            )}

            {/* CTA Button */}
            <a href="/client" className="pl-cta">
                🚀 Get Started
            </a>
        </div>
    );
}

export default Pricelist;