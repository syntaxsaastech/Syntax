// src/components/Offers.js
import React, { useState, useEffect } from 'react';
import { db, collection, onSnapshot, query, orderBy, doc, deleteDoc } from '../firebase/config';

function Offers() {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const q = query(
            collection(db, 'offers'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const offerData = [];
            snapshot.forEach((doc) => {
                offerData.push({ id: doc.id, ...doc.data() });
            });
            setOffers(offerData);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Auto-rotate offers every 5 seconds
    useEffect(() => {
        if (offers.length <= 1) return;
        
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % offers.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [offers.length]);

    if (loading) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: '#A8B2D1'
            }}>
                ⏳ Loading offers...
            </div>
        );
    }

    if (offers.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                background: '#1A1E37',
                borderRadius: '16px',
                border: '1px solid rgba(255, 107, 107, 0.1)'
            }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '10px' }}>🎯</span>
                <h3 style={{ color: '#FFD93D', marginBottom: '10px' }}>Special Offers Coming Soon!</h3>
                <p style={{ color: '#A8B2D1' }}>Stay tuned for exciting deals and discounts. Subscribe to our newsletter to get notified!</p>
            </div>
        );
    }

    const currentOffer = offers[currentIndex];

    return (
        <div style={{
            background: 'linear-gradient(135deg, #1A1E37, #2A1E3A)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 107, 107, 0.15)',
            padding: '30px 40px',
            marginBottom: '30px',
            position: 'relative',
            overflow: 'hidden',
            animation: 'fadeInUp 0.5s ease'
        }}>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
                .offer-badge {
                    animation: pulse 2s infinite;
                }
            `}</style>

            {/* Decorative background elements */}
            <div style={{
                position: 'absolute',
                top: '-50%',
                right: '-20%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255, 107, 107, 0.08), transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-40%',
                left: '-10%',
                width: '200px',
                height: '200px',
                background: 'radial-gradient(circle, rgba(255, 217, 61, 0.06), transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none'
            }} />

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                flexWrap: 'wrap',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Offer Icon/Badge */}
                <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF6B6B, #FFD93D)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                    boxShadow: '0 0 40px rgba(255, 107, 107, 0.2)'
                }}>
                    {currentOffer.icon || '🎉'}
                </div>

                {/* Offer Content */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap',
                        marginBottom: '5px'
                    }}>
                        <span style={{
                            padding: '3px 12px',
                            background: 'rgba(255, 107, 107, 0.15)',
                            border: '1px solid rgba(255, 107, 107, 0.2)',
                            borderRadius: '20px',
                            color: '#FF6B6B',
                            fontSize: '0.7rem',
                            fontWeight: 'bold',
                            letterSpacing: '1px',
                            textTransform: 'uppercase'
                        }}>
                            🔥 Limited Offer
                        </span>
                        <span style={{
                            padding: '3px 12px',
                            background: 'rgba(255, 217, 61, 0.08)',
                            border: '1px solid rgba(255, 217, 61, 0.15)',
                            borderRadius: '20px',
                            color: '#FFD93D',
                            fontSize: '0.7rem',
                            fontWeight: 'bold'
                        }}>
                            {currentOffer.discount || 'Special Deal'}
                        </span>
                    </div>
                    <h3 style={{
                        color: '#E0E0E0',
                        fontSize: '1.4rem',
                        margin: '5px 0',
                        fontWeight: 'bold'
                    }}>
                        {currentOffer.title}
                    </h3>
                    <p style={{
                        color: '#A8B2D1',
                        fontSize: '0.95rem',
                        margin: '5px 0',
                        lineHeight: '1.5'
                    }}>
                        {currentOffer.description}
                    </p>
                    {currentOffer.code && (
                        <div style={{
                            display: 'inline-block',
                            marginTop: '8px',
                            padding: '6px 20px',
                            background: 'rgba(255, 217, 61, 0.08)',
                            border: '1px dashed rgba(255, 217, 61, 0.3)',
                            borderRadius: '8px',
                            color: '#FFD93D',
                            fontSize: '0.9rem',
                            fontWeight: 'bold',
                            letterSpacing: '2px'
                        }}>
                            📋 Use Code: {currentOffer.code}
                        </div>
                    )}
                </div>

                {/* Offer Navigation Dots */}
                {offers.length > 1 && (
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginTop: '10px',
                        width: '100%',
                        justifyContent: 'center'
                    }}>
                        {offers.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                style={{
                                    width: index === currentIndex ? '24px' : '8px',
                                    height: '8px',
                                    borderRadius: '4px',
                                    border: 'none',
                                    background: index === currentIndex 
                                        ? 'linear-gradient(90deg, #FF6B6B, #FFD93D)'
                                        : 'rgba(255,255,255,0.15)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Offers;