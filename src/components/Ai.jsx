import React, { useState } from 'react';

function AI() {
    const [input, setInput] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatHistory, setChatHistory] = useState([]);
    const [activeFeature, setActiveFeature] = useState('chat');

    // Quick keywords with their responses - DIRECT MATCHING
    const quickKeywords = [
        { id: 'services', label: '💎 Services', keyword: 'services', response: 'services' },
        { id: 'pricing', label: '💰 Pricing', keyword: 'pricing', response: 'pricing' },
        { id: 'tech', label: '🛠️ Tech Stack', keyword: 'tech stack', response: 'tech stack' },
        { id: 'remote', label: '🌐 Remote Work', keyword: 'remote work', response: 'remote work' },
        { id: 'support', label: '🤝 Support', keyword: 'support', response: 'support' },
        { id: 'webinars', label: '🎓 Webinars', keyword: 'webinars', response: 'webinars' },
        { id: 'projects', label: '📅 Projects', keyword: 'projects', response: 'projects' },
        { id: 'satisfaction', label: '⭐ Satisfaction', keyword: 'satisfaction', response: 'satisfaction' },
        { id: 'about', label: '🏢 About Us', keyword: 'about', response: 'about' },
        { id: 'contact', label: '📞 Contact', keyword: 'contact', response: 'contact' },
    ];

    // Service data for unique display
    const servicesData = [
        {
            icon: '💻',
            name: 'Web Development',
            desc: 'Custom websites & web applications',
            tech: 'React, Next.js, TypeScript',
            color: '#FF6B6B'
        },
        {
            icon: '📱',
            name: 'Mobile Development',
            desc: 'Native & cross-platform apps',
            tech: 'React Native, Flutter',
            color: '#FF6BD6'
        },
        {
            icon: '☁️',
            name: 'Cloud Solutions',
            desc: 'Scalable cloud infrastructure',
            tech: 'AWS, Firebase, MongoDB',
            color: '#4D96FF'
        },
        {
            icon: '🤖',
            name: 'AI & Automation',
            desc: 'Intelligent automation solutions',
            tech: 'ML, NLP, RPA',
            color: '#6BCB77'
        },
        {
            icon: '🎨',
            name: 'UI/UX Design',
            desc: 'Beautiful & intuitive designs',
            tech: 'Figma, Adobe XD',
            color: '#FFD93D'
        },
        {
            icon: '🛠️',
            name: 'DevOps & Tools',
            desc: 'Streamlined development operations',
            tech: 'Docker, Kubernetes, Git',
            color: '#FF9F43'
        },
    ];

    // UNIQUE RESPONSE FUNCTIONS - Each topic has unique, detailed response
    const getServicesResponse = () => {
        return `💎 **Our Premium Services**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${servicesData.map(service =>
            `🟣 ${service.icon}  ${service.name}
   📝 ${service.desc}
   ⚡ ${service.tech}`
        ).join('\n\n')}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ **Why Choose Our Services?**
• 💰 Very Affordable - Premium quality at budget-friendly prices
• 🌐 Remote-First - Global team working 24/7
• ⭐ 100% Satisfaction Guaranteed - Your success is our priority
• 📅 Year-Round Support - Consistent quality throughout the year
• 🏆 Expert Team - Skilled professionals with years of experience

🚀 Ready to transform your business? Contact us today!
📞 +91 6381072875 | 📧 info@srisaas.com`;
    };

    const getPricingResponse = () => {
        return `💰 **Syntax SaaS Pricing - Affordable Excellence**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 Web Development
   Starting from $499
   • Custom websites & web apps
   • Responsive design
   • SEO optimized

📱 Mobile Development
   Starting from $599
   • Native & cross-platform apps
   • App store deployment
   • Push notifications

☁️ Cloud Solutions
   Starting from $299
   • Scalable infrastructure
   • Cloud migration
   • 24/7 monitoring

🤖 AI & Automation
   Starting from $799
   • Machine learning models
   • NLP solutions
   • Process automation

🎨 UI/UX Design
   Starting from $199
   • Beautiful designs
   • User research
   • Prototyping

🛠️ DevOps & Tools
   Starting from $399
   • CI/CD pipelines
   • Containerization
   • Monitoring tools
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 **Custom Packages Available**
• Discounts for long-term projects
• Flexible payment plans
• Free consultation call

📞 Get your personalized quote today!
Call: +91 6381072875
Email: info@srisaas.com`;
    };

    const getTechStackResponse = () => {
        return `🛠️ **Our Comprehensive Tech Stack**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖥️ **Frontend Development**
   • HTML5 & CSS3 - Modern markup & styling
   • JavaScript (ES6+) - Dynamic functionality
   • React.js & Next.js - Component-based UI
   • TypeScript - Type-safe development
   • Tailwind CSS & Bootstrap - Responsive design

⚙️ **Backend Development**
   • Node.js - JavaScript runtime
   • Express.js - Web framework
   • RESTful APIs - Scalable services

🗄️ **Database & Cloud**
   • MongoDB - NoSQL database
   • PostgreSQL - Relational database
   • MySQL - Structured data
   • Firebase - Realtime database
   • Cloudinary - Cloud storage

📱 **Mobile Development**
   • React Native - Cross-platform apps
   • Flutter - UI framework

🤖 **AI & Automation**
   • Machine Learning - Predictive models
   • Deep Learning - Neural networks
   • NLP - Natural language processing

🛠️ **DevOps & Tools**
   • Git & GitHub - Version control
   • VS Code - Development environment
   • Figma & Canva - Design tools
   • Docker & Kubernetes - Containerization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 **Why Our Tech Stack?**
• Cutting-edge technologies
• Scalable solutions
• Future-proof development

💡 We use the latest tools for best results!`;
    };

    const getRemoteWorkResponse = () => {
        return `🌐 **Remote-First Company Culture**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 **Global Team**
   • Team members from around the world
   • Diverse expertise and perspectives
   • Cultural exchange and learning

⏰ **24/7 Availability**
   • Services available round the clock
   • Multiple timezone coverage
   • Quick response times

💻 **Remote Culture**
   • Modern collaboration tools
   • Agile development practices
   • Flexible work hours

🎯 **Client Focus**
   • Dedicated support teams
   • Regular progress updates
   • Transparent communication

🛡️ **Benefits**
   • Lower operational costs
   • Faster project delivery
   • Better work-life balance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💪 **Join Our Remote Team!**
• Work from anywhere
• Flexible schedules
• Growth opportunities

🌐 Ready to collaborate remotely? Contact us!`;
    };

    const getSupportResponse = () => {
        return `🤝 **24/7 Dedicated Support**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 **Email Support**
   • info@srisaas.com
   • Response within 2 hours
   • 24/7 monitoring

📞 **Phone Support**
   • +91 6381072875
   • Available 24/7
   • Emergency assistance

💬 **Live Chat**
   • Instant responses
   • AI-powered assistance
   • Human support backup

📋 **Support Services**
   • Technical troubleshooting
   • Bug fixes and updates
   • Consultation and guidance

⭐ **Satisfaction Guarantee**
   • 100% customer satisfaction
   • Money-back guarantee
   • Free rework if needed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 **Our Support Promise**
• Quick resolution
• Expert assistance
• Friendly service

💪 We're here to help you succeed!`;
    };

    const getWebinarsResponse = () => {
        return `🎓 **Expert Webinars & Training**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 **Regular Webinars**
   • Monthly technical sessions
   • Latest technology trends
   • Industry insights

🎯 **Topics Covered**
   • Web Development (React, Next.js)
   • Mobile Apps (React Native, Flutter)
   • AI & Automation (ML, NLP)
   • Cloud Computing (AWS, Firebase)
   • UI/UX Design (Figma, Adobe XD)
   • DevOps (Docker, Kubernetes)

🏆 **Expert Trainers**
   • Industry professionals
   • Real-world experience
   • Interactive sessions

📅 **Schedule**
   • Every 2nd Saturday
   • 10:00 AM - 12:00 PM (IST)
   • Recorded sessions available

💡 **Benefits**
   • Hands-on learning
   • Q&A sessions
   • Certificate of participation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📢 **Upcoming Webinars**
• "Mastering React Hooks" - Next Saturday
• "AI for Beginners" - Coming soon
• "Cloud Architecture 101" - Next month

📝 Register now and level up your skills!`;
    };

    const getProjectsResponse = () => {
        return `📅 **Year-Round Project Management**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 **Project Types**
   • Web Development Projects
   • Mobile App Development
   • AI & Automation Solutions
   • Cloud Infrastructure
   • UI/UX Design Projects
   • DevOps Implementation

⏱️ **Project Timeline**
   • Small Projects: 2-4 weeks
   • Medium Projects: 1-3 months
   • Large Projects: 3-6 months
   • Enterprise: 6+ months

🔄 **Development Process**
   • Agile Methodology
   • Sprint-based development
   • Regular client reviews
   • Continuous integration

📊 **Project Management Tools**
   • Jira for task tracking
   • GitHub for version control
   • Slack for communication
   • Trello for planning

✅ **Quality Assurance**
   • Rigorous testing
   • Code reviews
   • Performance optimization
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 **Project Success Rate**
• 98% on-time delivery
• 100% client satisfaction
• Repeat business rate: 85%

💪 Your project is in safe hands!`;
    };

    const getSatisfactionResponse = () => {
        return `⭐ **Customer Satisfaction - Our Priority**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 **100% Satisfaction Rate**
   • No compromise on quality
   • Exceeding expectations
   • Client-first approach

💬 **Client Testimonials**
   • "Best team I've worked with!" - John D.
   • "Amazing results!" - Sarah K.
   • "Highly recommended!" - Mike R.

⭐ **5-Star Reviews**
   • Google Reviews: 4.9/5
   • Clutch: 5.0/5
   • Trustpilot: 4.8/5

🔄 **Repeat Business**
   • 85% client retention rate
   • Long-term partnerships
   • Referral programs

🎯 **Client-First Philosophy**
   • Your success is our success
   • Personalized solutions
   • Transparent communication
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💪 **Our Commitment**
• Quality delivery
• Timely completion
• Dedicated support

🌟 Join our happy clients family!`;
    };

    const getAboutResponse = () => {
        return `🏢 **About Syntax SaaS Technology**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 **Company Overview**
   • Founded: 2021
   • Premium SaaS provider
   • Empowering businesses globally

💰 **Our Philosophy**
   • Very Affordable - Quality at budget prices
   • Remote-First - Global team, 24/7
   • 100% Satisfaction - Client success is mission

🌐 **Global Presence**
   • India (Headquarters)
   • USA (Sales Office)
   • UK (European Operations)
   • UAE (Middle East)

🏆 **Achievements**
   • 12+ happy clients
   • 15+ successful projects
   • 2+ countries served
   • 100% satisfaction rate

🚀 **Our Mission**
   • Make technology accessible
   • Drive digital transformation
   • Build innovative solutions

💡 **Core Values**
   • Integrity
   • Innovation
   • Excellence
   • Customer-centricity
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌟 We build the future, one project at a time!

📞 Contact us to start your journey!`;
    };

    const getContactResponse = () => {
        return `📞 **Contact Syntax SaaS Technology**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 **Email**
   • info@srisaas.com
   • support@srisaas.com
   • sales@srisaas.com

📞 **Phone**
   • +91 6381072875
   • +91 8939245586
   • Available 24/7

📍 **Address**
   16, Meenathi Pet,
   Thondamanatham,
   Puducherry - 605502
   India

🌐 **Website**
   • srisaas.web.app
   • srisaastech.vercel.app

💬 **Live Chat**
   • Available 24/7
   • Instant responses
   • AI-powered assistance

📱 **Social Media**
   • LinkedIn: @syntaxsaas
   • Twitter: @syntaxsaas
   • Instagram: @syntaxsaas

⏰ **Business Hours**
   • Monday - Saturday: 9 AM - 9 PM (IST)
   • Sunday: Emergency support only
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📨 **We'd love to hear from you!**

💬 Don't hesitate to reach out for:
• Project inquiries
• Support requests
• Partnership opportunities
• Any questions you have

🚀 Let's build something amazing together!`;
    };

    const getDefaultResponse = () => {
        return `🤔 **I'm not sure about that.**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 **You can ask me about:**

💰 **Services & Pricing**
   • 💎 Services offered
   • 💰 Pricing details
   • 🛠️ Tech Stack

🌐 **Company & Culture**
   • 🌐 Remote Work
   • 🏢 About Us
   • 📞 Contact Info

🎯 **Support & Learning**
   • 🤝 Support
   • 🎓 Webinars
   • 📅 Projects

⭐ **Success Metrics**
   • ⭐ Satisfaction
   • 📊 Statistics
   • 🏆 Achievements
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💬 **Quick Tip:** Click any keyword above or type:
"services", "pricing", "tech stack", "remote work",
"support", "webinars", "projects", "satisfaction",
"about", "contact" - I'll give you detailed info!

🤖 I'm here to help! What would you like to know?`;
    };

    // Rule-based AI responses - DIRECT MAPPING
    const getAIResponse = (userInput) => {
        const inputLower = userInput.toLowerCase();

        // EXACT MATCH - Check if input matches any keyword exactly
        const exactMatch = quickKeywords.find(k =>
            inputLower === k.keyword ||
            inputLower.includes(k.keyword)
        );

        if (exactMatch) {
            switch (exactMatch.id) {
                case 'services': return getServicesResponse();
                case 'pricing': return getPricingResponse();
                case 'tech': return getTechStackResponse();
                case 'remote': return getRemoteWorkResponse();
                case 'support': return getSupportResponse();
                case 'webinars': return getWebinarsResponse();
                case 'projects': return getProjectsResponse();
                case 'satisfaction': return getSatisfactionResponse();
                case 'about': return getAboutResponse();
                case 'contact': return getContactResponse();
                default: return getDefaultResponse();
            }
        }

        // Greeting responses
        if (inputLower.includes('hello') || inputLower.includes('hi') || inputLower.includes('hey')) {
            return "👋 **Hello! Welcome to Syntax SaaS AI Assistant!**\n\nI'm here to help you with any questions about our services, pricing, technology, and more. Click any topic above or type your question!\n\n💡 **Quick Tip:** Try asking about 'services', 'pricing', or 'tech stack' to get started!";
        }

        // Check for partial matches
        if (inputLower.includes('service') || inputLower.includes('services')) {
            return getServicesResponse();
        }
        if (inputLower.includes('price') || inputLower.includes('cost') || inputLower.includes('affordable')) {
            return getPricingResponse();
        }
        if (inputLower.includes('tech') || inputLower.includes('technology') || inputLower.includes('stack')) {
            return getTechStackResponse();
        }
        if (inputLower.includes('remote') || inputLower.includes('work from home') || inputLower.includes('location')) {
            return getRemoteWorkResponse();
        }
        if (inputLower.includes('support') || inputLower.includes('help') || inputLower.includes('assist')) {
            return getSupportResponse();
        }
        if (inputLower.includes('webinar') || inputLower.includes('training') || inputLower.includes('learn')) {
            return getWebinarsResponse();
        }
        if (inputLower.includes('project') || inputLower.includes('timeline') || inputLower.includes('delivery')) {
            return getProjectsResponse();
        }
        if (inputLower.includes('satisfaction') || inputLower.includes('happy') || inputLower.includes('review')) {
            return getSatisfactionResponse();
        }
        if (inputLower.includes('about') || inputLower.includes('company') || inputLower.includes('who')) {
            return getAboutResponse();
        }
        if (inputLower.includes('contact') || inputLower.includes('email') || inputLower.includes('phone')) {
            return getContactResponse();
        }

        // Default response
        return getDefaultResponse();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        sendMessage(input);
    };

    const sendMessage = (message) => {
        setLoading(true);
        const userMessage = message;
        setInput('');

        // Simulate AI thinking
        setTimeout(() => {
            const aiResponse = getAIResponse(userMessage);
            setResponse(aiResponse);
            setChatHistory(prev => [
                ...prev,
                { user: userMessage, ai: aiResponse }
            ]);
            setLoading(false);
        }, 500);
    };

    const handleKeywordClick = (keyword) => {
        // Directly send the keyword to get exact response
        sendMessage(keyword);
    };

    const features = [
        { id: 'chat', icon: '💬', name: 'AI Chat', desc: 'Chat with our rule-based AI assistant' },
        { id: 'analyze', icon: '📊', name: 'Text Analyzer', desc: 'Analyze text sentiment and keywords' },
        { id: 'summarize', icon: '📝', name: 'Summarizer', desc: 'Summarize long text content' },
        { id: 'translate', icon: '🌍', name: 'Translator', desc: 'Translate text to different languages' },
    ];

    const handleAnalyze = () => {
        if (!input.trim()) return;
        const text = input;
        const wordCount = text.split(/\s+/).length;
        const charCount = text.length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
        const keywords = text.split(/\s+/).filter(word => word.length > 4);

        const analysisResult = `📊 **Text Analysis Results**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 **Word Count:** ${wordCount}
📏 **Character Count:** ${charCount}
📄 **Sentences:** ${sentences}
🔑 **Keywords:** ${keywords.slice(0, 5).join(', ') || 'None'}
💬 **Sentiment:** ${wordCount > 10 ? '😊 Positive' : '😐 Neutral'}
📊 **Readability:** ${wordCount > 20 ? '📖 Easy' : '📚 Moderate'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **Analysis complete!**`;
        setResponse(analysisResult);
        setChatHistory(prev => [
            ...prev,
            { user: `📊 Analyze: ${text}`, ai: analysisResult }
        ]);
    };

    const handleSummarize = () => {
        if (!input.trim()) return;
        const text = input;
        const words = text.split(/\s+/);
        const summary = words.slice(0, 20).join(' ') + (words.length > 20 ? '...' : '');

        const summaryResult = `📝 **Text Summary**

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 **Original Length:** ${words.length} words
📝 **Summary:** ${summary}
⏱️ **Reduction:** ${words.length > 20 ? `${Math.round((words.length - 20) / words.length * 100)}% shorter` : 'Full text'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **Summary generated successfully!**

💡 Key points extracted for quick understanding.`;
        setResponse(summaryResult);
        setChatHistory(prev => [
            ...prev,
            { user: `📝 Summarize: ${text}`, ai: summaryResult }
        ]);
    };

    return (
        <>
            <style>{`
                /* ============================================
                   AI PAGE STYLES - VIBRANT COLOR SCHEME
                   ============================================ */
                .ai-container {
                    animation: fadeInUp 0.8s ease;
                    min-height: 100vh;
                    padding: 100px 40px 40px;
                    max-width: 1200px;
                    margin: 0 auto;
                    background: #0A0E27;
                }

                .ai-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .ai-header h1 {
                    font-size: 3rem;
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

                .ai-header p {
                    color: #A8B2D1;
                    font-size: 1.1rem;
                    margin-top: 10px;
                    letter-spacing: 1px;
                }

                /* Quick Keywords */
                .quick-keywords {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    justify-content: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #1A1E37;
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    border: 1px solid rgba(255, 107, 107, 0.15);
                }

                .keyword-btn {
                    padding: 10px 22px;
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.08), rgba(255, 217, 61, 0.08));
                    border: 1px solid rgba(255, 107, 107, 0.15);
                    border-radius: 25px;
                    color: #FFD93D;
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    font-weight: 500;
                    position: relative;
                    overflow: hidden;
                }

                .keyword-btn::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 217, 61, 0.2));
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .keyword-btn:hover {
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.2), rgba(255, 217, 61, 0.2));
                    transform: translateY(-4px) scale(1.05);
                    box-shadow: 
                        0 8px 30px rgba(255, 107, 107, 0.25),
                        0 0 60px rgba(255, 107, 107, 0.1);
                    border-color: #FF6B6B;
                }

                .keyword-btn:hover::before {
                    opacity: 1;
                }

                .keyword-btn:active {
                    transform: scale(0.95);
                }

                .keyword-btn.active-topic {
                    background: linear-gradient(135deg, rgba(255, 107, 107, 0.25), rgba(255, 217, 61, 0.25));
                    border-color: #FF6B6B;
                    box-shadow: 0 0 30px rgba(255, 107, 107, 0.2);
                    transform: scale(1.05);
                }

                /* AI Feature Cards */
                .ai-features-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .ai-feature-card {
                    background: #1A1E37;
                    padding: 25px 20px;
                    border-radius: 16px;
                    border: 1px solid rgba(255, 107, 107, 0.12);
                    text-align: center;
                    cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    position: relative;
                    overflow: hidden;
                }

                .ai-feature-card::before {
                    content: '';
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255, 107, 107, 0.05), transparent 70%);
                    opacity: 0;
                    transition: opacity 0.6s ease;
                }

                .ai-feature-card::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, transparent, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, transparent);
                    transform: scaleX(0);
                    transition: transform 0.5s ease;
                }

                .ai-feature-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    border-color: #FF6B6B;
                    box-shadow: 
                        0 15px 50px rgba(255, 107, 107, 0.15),
                        0 0 80px rgba(255, 107, 107, 0.05);
                }

                .ai-feature-card:hover::before {
                    opacity: 1;
                }

                .ai-feature-card:hover::after {
                    transform: scaleX(1);
                }

                .ai-feature-card.active {
                    border-color: #FF6B6B;
                    background: rgba(255, 107, 107, 0.06);
                    box-shadow: 0 0 40px rgba(255, 107, 107, 0.1);
                }

                .ai-feature-card .feature-icon {
                    font-size: 2.8rem;
                    display: block;
                    margin-bottom: 12px;
                    transition: all 0.4s ease;
                }

                .ai-feature-card:hover .feature-icon {
                    transform: scale(1.2) rotate(5deg);
                }

                .ai-feature-card h3 {
                    color: #FFD93D;
                    font-size: 1.1rem;
                    margin-bottom: 5px;
                }

                .ai-feature-card p {
                    color: #A8B2D1;
                    font-size: 0.85rem;
                }

                /* Chat Container */
                .ai-chat-container {
                    background: #1A1E37;
                    border-radius: 20px;
                    border: 1px solid rgba(255, 107, 107, 0.12);
                    overflow: hidden;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                }

                .ai-chat-messages {
                    height: 400px;
                    overflow-y: auto;
                    padding: 20px;
                    background: rgba(10, 14, 39, 0.6);
                }

                .ai-chat-messages::-webkit-scrollbar {
                    width: 6px;
                }

                .ai-chat-messages::-webkit-scrollbar-track {
                    background: #0A0E27;
                }

                .ai-chat-messages::-webkit-scrollbar-thumb {
                    background: linear-gradient(180deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF);
                    border-radius: 3px;
                }

                .ai-chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #FF6B6B;
                }

                .message {
                    margin-bottom: 15px;
                    padding: 14px 20px;
                    border-radius: 12px;
                    max-width: 85%;
                    animation: fadeInUp 0.3s ease;
                    position: relative;
                    white-space: pre-line;
                    line-height: 1.6;
                    font-size: 0.95rem;
                }

                .message.user {
                    background: linear-gradient(135deg, rgba(77, 150, 255, 0.15), rgba(255, 107, 214, 0.1));
                    border: 1px solid rgba(77, 150, 255, 0.18);
                    margin-left: auto;
                    color: #E0E0E0;
                    box-shadow: 0 5px 20px rgba(77, 150, 255, 0.05);
                }

                .message.ai {
                    background: linear-gradient(135deg, rgba(0, 0, 0, 0.6), #1A1E37);
                    border: 1px solid rgba(255, 107, 107, 0.08);
                    margin-right: auto;
                    color: #A8B2D1;
                    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                }

                .message.ai strong {
                    color: #FFD93D;
                    display: block;
                    font-size: 1.1rem;
                    margin-bottom: 8px;
                }

                .message .message-time {
                    font-size: 0.65rem;
                    color: #666;
                    margin-top: 6px;
                    display: block;
                    font-style: italic;
                }

                .message.ai .message-time {
                    color: #4D96FF;
                }

                .message.user .message-time {
                    color: #FF6BD6;
                }

                /* Input Area */
                .ai-input-area {
                    display: flex;
                    gap: 12px;
                    padding: 20px;
                    border-top: 1px solid rgba(255, 107, 107, 0.08);
                    flex-wrap: wrap;
                    background: rgba(10, 14, 39, 0.4);
                }

                .ai-input-area input {
                    flex: 1;
                    padding: 14px 22px;
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #E0E0E0;
                    font-size: 1rem;
                    min-width: 200px;
                    transition: all 0.4s ease;
                }

                .ai-input-area input::placeholder {
                    color: #666;
                }

                .ai-input-area input:focus {
                    outline: none;
                    border-color: #FF6B6B;
                    box-shadow: 
                        0 0 30px rgba(255, 107, 107, 0.08),
                        inset 0 0 30px rgba(255, 107, 107, 0.02);
                    background: rgba(255, 255, 255, 0.08);
                }

                .ai-input-area button {
                    padding: 14px 35px;
                    background: linear-gradient(135deg, #FF6B6B 0%, #FFD93D 30%, #6BCB77 50%, #4D96FF 70%, #FF6BD6 100%);
                    color: #0A0E27;
                    border: none;
                    border-radius: 12px;
                    font-size: 1rem;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }

                .ai-input-area button::before {
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

                .ai-input-area button:hover::before {
                    left: 100%;
                }

                .ai-input-area button:hover {
                    transform: translateY(-3px) scale(1.03);
                    box-shadow: 
                        0 10px 40px rgba(255, 107, 107, 0.3),
                        0 0 80px rgba(255, 107, 107, 0.1);
                }

                .ai-input-area button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    transform: none;
                    box-shadow: none;
                }

                .ai-input-area .action-buttons {
                    display: flex;
                    gap: 10px;
                }

                .ai-input-area .action-btn {
                    padding: 14px 22px;
                    background: rgba(26, 30, 55, 0.8);
                    border: 2px solid rgba(255, 107, 107, 0.12);
                    border-radius: 12px;
                    color: #FFD93D;
                    cursor: pointer;
                    transition: all 0.4s ease;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .ai-input-area .action-btn:hover {
                    background: rgba(255, 107, 107, 0.08);
                    border-color: #FF6B6B;
                    transform: translateY(-2px) scale(1.05);
                    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.15);
                }

                .ai-input-area .action-btn:active {
                    transform: scale(0.95);
                }

                .typing-indicator {
                    display: flex;
                    gap: 6px;
                    padding: 10px 0;
                }

                .typing-indicator span {
                    width: 10px;
                    height: 10px;
                    background: linear-gradient(135deg, #FF6B6B, #FFD93D);
                    border-radius: 50%;
                    animation: typing 1.4s infinite;
                }

                .typing-indicator span:nth-child(2) {
                    animation-delay: 0.2s;
                    background: linear-gradient(135deg, #6BCB77, #4D96FF);
                }

                .typing-indicator span:nth-child(3) {
                    animation-delay: 0.4s;
                    background: linear-gradient(135deg, #FF6BD6, #FF9F43);
                }

                @keyframes typing {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-12px); opacity: 1; }
                }

                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Responsive */
                @media (max-width: 992px) {
                    .ai-features-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 768px) {
                    .ai-container {
                        padding: 80px 20px 20px;
                    }

                    .ai-header h1 {
                        font-size: 2.2rem;
                    }

                    .quick-keywords {
                        gap: 8px;
                        padding: 15px;
                    }

                    .keyword-btn {
                        padding: 8px 16px;
                        font-size: 0.8rem;
                    }

                    .ai-features-grid {
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                    }

                    .ai-feature-card {
                        padding: 20px 15px;
                    }

                    .ai-feature-card .feature-icon {
                        font-size: 2.2rem;
                    }

                    .ai-chat-messages {
                        height: 300px;
                        padding: 15px;
                    }

                    .message {
                        max-width: 90%;
                        font-size: 0.9rem;
                        padding: 12px 16px;
                    }

                    .ai-input-area {
                        flex-direction: column;
                        padding: 15px;
                    }

                    .ai-input-area input {
                        width: 100%;
                    }

                    .ai-input-area .action-buttons {
                        flex-wrap: wrap;
                    }

                    .ai-input-area button {
                        flex: 1;
                        padding: 12px 20px;
                    }

                    .ai-input-area .action-btn {
                        padding: 12px 18px;
                        font-size: 0.85rem;
                    }
                }

                @media (max-width: 480px) {
                    .ai-features-grid {
                        grid-template-columns: 1fr;
                    }

                    .ai-header h1 {
                        font-size: 1.8rem;
                    }

                    .quick-keywords {
                        gap: 6px;
                        padding: 12px;
                    }

                    .keyword-btn {
                        padding: 6px 12px;
                        font-size: 0.75rem;
                    }

                    .ai-chat-messages {
                        height: 250px;
                        padding: 12px;
                    }

                    .message {
                        max-width: 95%;
                        font-size: 0.85rem;
                        padding: 10px 14px;
                    }

                    .ai-input-area input {
                        padding: 12px 16px;
                        font-size: 0.9rem;
                    }

                    .ai-input-area button {
                        padding: 12px 20px;
                        font-size: 0.9rem;
                    }

                    .ai-input-area .action-btn {
                        padding: 10px 14px;
                        font-size: 0.8rem;
                    }
                }
            `}</style>

            <div className="ai-container">
                <div className="ai-header">
                    <h1>🤖 Syntax SaaS AI Assistant</h1>
                    <p>Click any topic below for instant, detailed information</p>
                </div>

                {/* Quick Keywords - DIRECT NAVIGATION */}
                <div className="quick-keywords">
                    {quickKeywords.map((item) => (
                        <button
                            key={item.id}
                            className="keyword-btn"
                            onClick={() => handleKeywordClick(item.keyword)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* AI Features Grid */}
                <div className="ai-features-grid">
                    {features.map((feature) => (
                        <div
                            key={feature.id}
                            className={`ai-feature-card ${activeFeature === feature.id ? 'active' : ''}`}
                            onClick={() => setActiveFeature(feature.id)}
                        >
                            <span className="feature-icon">{feature.icon}</span>
                            <h3>{feature.name}</h3>
                            <p>{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Chat Container */}
                <div className="ai-chat-container">
                    <div className="ai-chat-messages" id="chatMessages">
                        {chatHistory.length === 0 && (
                            <div className="message ai" style={{ maxWidth: '100%', textAlign: 'center', border: 'none' }}>
                                <p style={{ fontSize: '1.1rem', color: '#FFD93D' }}>👋 Hello! I'm Syntax SaaS AI Assistant.</p>
                                <p style={{ marginTop: '10px', color: '#A8B2D1', fontSize: '0.95rem' }}>
                                    Click a topic above or type your question below!
                                </p>
                                <p style={{ marginTop: '5px', color: '#666', fontSize: '0.85rem' }}>
                                    💡 Try: "services", "pricing", "tech stack", "remote work"
                                </p>
                            </div>
                        )}

                        {chatHistory.map((chat, index) => (
                            <div key={index}>
                                <div className="message user">
                                    {chat.user}
                                    <span className="message-time">You</span>
                                </div>
                                <div className="message ai">
                                    {chat.ai}
                                    <span className="message-time">AI Assistant</span>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        )}
                    </div>

                    {/* Input Area */}
                    <div className="ai-input-area">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Type your message here..."
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                        />
                        <div className="action-buttons">
                            {activeFeature === 'analyze' && (
                                <button className="action-btn" onClick={handleAnalyze}>📊 Analyze</button>
                            )}
                            {activeFeature === 'summarize' && (
                                <button className="action-btn" onClick={handleSummarize}>📝 Summarize</button>
                            )}
                            <button onClick={handleSubmit} disabled={loading}>
                                {loading ? '⏳ Thinking...' : '🚀 Send'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default AI;