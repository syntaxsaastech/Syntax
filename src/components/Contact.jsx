// src/pages/Contact.js - Complete FULL working file
import React, { useState } from 'react';
import { db, collection, addDoc, serverTimestamp, auth } from '../firebase/config';

function Contact() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
        meetingDate: '',
        meetingTime: '',
        subject: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ✅ Require login so we can attach userId for notifications
        if (!auth.currentUser) {
            alert('⚠️ Please login first to book a meeting.');
            return;
        }

        setIsSubmitting(true);

        try {
            const contactData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                subject: formData.subject || 'Meeting Request',
                message: formData.message,
                meetingDate: formData.meetingDate,
                meetingTime: formData.meetingTime,
                type: 'meeting_request',
                status: 'pending',
                read: false,
                userId: auth.currentUser.uid,
                userEmail: auth.currentUser.email,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };

            await addDoc(collection(db, 'meetings'), contactData);

            setSubmitSuccess(true);
            setFormData({ name: '', email: '', phone: '', message: '', meetingDate: '', meetingTime: '', subject: '' });

            setTimeout(() => setSubmitSuccess(false), 5000);

        } catch (error) {
            console.error('Error submitting meeting request:', error);
            alert('❌ Error submitting request. Please try again.');
        }

        setIsSubmitting(false);
    };

    return (
        <>
            <style>{`
                .contact-container {
                    animation: fadeInUp 0.8s ease;
                    min-height: 100vh;
                    padding: 100px 40px 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    background: #0A0E27;
                }

                .page-title {
                    font-size: 3rem;
                    text-align: center;
                    margin-bottom: 40px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    letter-spacing: 2px;
                    animation: shimmer 3s ease-in-out infinite;
                }

                @keyframes shimmer {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(40px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .success-banner {
                    max-width: 1200px;
                    margin: 0 auto 20px;
                    padding: 15px 25px;
                    background: rgba(107, 203, 119, 0.15);
                    border: 1px solid rgba(107, 203, 119, 0.3);
                    border-radius: 12px;
                    color: #6BCB77;
                    text-align: center;
                    animation: fadeInUp 0.5s ease;
                }

                .contact-grid {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 40px;
                    margin-bottom: 40px;
                }

                .contact-info {
                    background: #1A1E37;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    transition: all 0.3s ease;
                }

                .contact-info:hover {
                    border-color: rgba(255, 217, 61, 0.3);
                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.05);
                }

                .contact-info h2 {
                    font-size: 1.8rem;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 25px;
                }

                .info-item {
                    display: flex;
                    align-items: flex-start;
                    gap: 15px;
                    padding: 15px 0;
                    border-bottom: 1px solid rgba(255, 107, 107, 0.06);
                    transition: all 0.3s ease;
                }

                .info-item:last-child { border-bottom: none; }

                .info-item:hover { transform: translateX(5px); }

                .info-icon {
                    font-size: 1.8rem;
                    min-width: 45px;
                    transition: all 0.3s ease;
                }

                .info-item:hover .info-icon { transform: scale(1.2) rotate(5deg); }

                .info-item h4 { color: #FFD93D; font-size: 1rem; margin-bottom: 4px; }
                .info-item p { color: #A8B2D1; font-size: 0.95rem; line-height: 1.6; }

                .contact-form {
                    background: #1A1E37;
                    padding: 40px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    transition: all 0.3s ease;
                }

                .contact-form:hover {
                    border-color: rgba(255, 217, 61, 0.3);
                    box-shadow: 0 10px 40px rgba(255, 217, 61, 0.05);
                }

                .form-section-title {
                    color: #FFD93D;
                    font-size: 1.1rem;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid rgba(255, 217, 61, 0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .form-group { margin-bottom: 20px; }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #FFD93D;
                    font-weight: 500;
                    font-size: 0.95rem;
                }

                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 14px 18px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.15);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    font-family: inherit;
                }

                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.08);
                    background: rgba(255, 107, 107, 0.04);
                }

                .form-group input::placeholder,
                .form-group textarea::placeholder { color: #666; }

                .form-group textarea { resize: vertical; min-height: 120px; }

                .form-row-meeting {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .meeting-section {
                    background: rgba(77, 150, 255, 0.04);
                    padding: 20px;
                    border-radius: 12px;
                    border: 1px solid rgba(77, 150, 255, 0.15);
                    margin-bottom: 20px;
                }

                .submit-btn {
                    width: 100%;
                    padding: 16px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1.1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }

                .submit-btn::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                    transform: rotate(45deg);
                    transition: all 0.6s ease;
                }

                .submit-btn:hover::before { left: 100%; }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 10px 40px rgba(255, 107, 107, 0.3);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }

                .map-section {
                    margin-top: 40px;
                    background: #1A1E37;
                    padding: 30px;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    text-align: center;
                }

                .map-section h3 {
                    font-size: 1.5rem;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    margin-bottom: 20px;
                }

                .map-wrapper {
                    border-radius: 12px;
                    overflow: hidden;
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid rgba(255, 107, 107, 0.1);
                }

                .map-wrapper iframe { width: 100%; height: 300px; border: 0; display: block; }

                @media (max-width: 992px) {
                    .contact-grid { grid-template-columns: 1fr; gap: 30px; }
                }

                @media (max-width: 768px) {
                    .contact-container { padding: 80px 20px 20px; }
                    .page-title { font-size: 2.2rem; }
                    .contact-info, .contact-form { padding: 30px; }
                    .form-row-meeting { grid-template-columns: 1fr; }
                    .map-wrapper iframe { height: 200px; }
                }

                @media (max-width: 480px) {
                    .contact-container { padding: 70px 15px 15px; }
                    .page-title { font-size: 1.8rem; }
                    .contact-info, .contact-form { padding: 20px; }
                }
            `}</style>

            <div className="contact-container">
                <h1 className="page-title">📬 Contact Syntech SaaS</h1>

                {submitSuccess && (
                    <div className="success-banner">
                        ✅ Thank you! Your meeting request has been submitted. Our team will confirm within 24 hours.
                    </div>
                )}

                <div className="contact-grid">
                    {/* Contact Info */}
                    <div className="contact-info">
                        <h2>Get in Touch</h2>

                        <div className="info-item">
                            <span className="info-icon">📍</span>
                            <div>
                                <h4>Address</h4>
                                <p>16, Meenathi Pet,<br />Thondamanatham,<br />Puducherry - 605502<br />India</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">📧</span>
                            <div>
                                <h4>Email</h4>
                                <p>srisaastechnology@gmail.com</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">📞</span>
                            <div>
                                <h4>Phone</h4>
                                <p>+91 6381072875</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">🌐</span>
                            <div>
                                <h4>Website</h4>
                                <p>https://srisaastech.vercel.app/</p>
                            </div>
                        </div>

                        <div className="info-item">
                            <span className="info-icon">🕐</span>
                            <div>
                                <h4>Working Hours</h4>
                                <p>Mon - Sat: 9:00 AM - 6:00 PM</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form with Meeting Schedule */}
                    <form className="contact-form" onSubmit={handleSubmit}>
                        <div className="form-section-title">
                            👤 Your Information
                        </div>

                        <div className="form-group">
                            <label>Full Name <span style={{ color: '#FF6B6B' }}>*</span></label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your Full Name" />
                        </div>

                        <div className="form-row-meeting">
                            <div className="form-group">
                                <label>Email <span style={{ color: '#FF6B6B' }}>*</span></label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="your@email.com" />
                            </div>
                            <div className="form-group">
                                <label>Phone Number</label>
                                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 6381072875" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Subject</label>
                            <input type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="What is this regarding?" />
                        </div>

                        {/* Meeting Schedule Section */}
                        <div className="meeting-section">
                            <div className="form-section-title" style={{ marginBottom: '15px' }}>
                                📅 Schedule a Meeting
                            </div>

                            <div className="form-row-meeting">
                                <div className="form-group">
                                    <label>📅 Preferred Date <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="date"
                                        name="meetingDate"
                                        value={formData.meetingDate}
                                        onChange={handleChange}
                                        required
                                        min={new Date().toISOString().split('T')[0]}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>⏰ Preferred Time <span style={{ color: '#FF6B6B' }}>*</span></label>
                                    <input
                                        type="time"
                                        name="meetingTime"
                                        value={formData.meetingTime}
                                        onChange={handleChange}
                                        required
                                        style={{ colorScheme: 'dark' }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>💬 Message <span style={{ color: '#FF6B6B' }}>*</span></label>
                            <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="Tell us about your SaaS needs or meeting purpose..." />
                        </div>

                        <button type="submit" className="submit-btn" disabled={isSubmitting}>
                            {isSubmitting ? '⏳ Submitting...' : '🚀 Request Meeting'}
                        </button>
                    </form>
                </div>

                {/* Map Section */}
                <div className="map-section">
                    <h3>📍 Find Us</h3>
                    <div className="map-wrapper">
                        <iframe
                            title="Syntax SaaS Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d31282.1094637817!2d79.7716617!3d11.934057!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a5361b6d5eb1b9f%3A0x6c7e9b9a1a5b9c3d!2sPuducherry!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                    <p style={{ color: '#A8B2D1', marginTop: '15px' }}>
                        <strong style={{ color: '#FFD93D' }}>📍</strong> 16, Meenathi Pet, Thondamanatham, Puducherry - 605502, India
                    </p>
                </div>
            </div>
        </>
    );
}

export default Contact;