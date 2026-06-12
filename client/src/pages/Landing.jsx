import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, Zap, Shield, ArrowRight, LayoutDashboard, Brain, Bot, Search, FileText, Bell, CheckCircle } from 'lucide-react';

const Landing = () => {
    const navigate = useNavigate();

    const fadeIn = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
    };

    return (
        <div className="min-h-screen text-slate-900 dark:text-slate-200 overflow-x-hidden relative transition-colors">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-transparent">
                <div className="absolute inset-0 bg-mesh opacity-50" />
                <motion.div 
                    animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full" 
                />
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                    className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-cyan-600/20 blur-[150px] rounded-full" 
                />
            </div>

            {/* Navbar */}
            <nav className="relative z-20 flex items-center justify-between p-6 max-w-7xl mx-auto">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="InternAlert" className="h-10 w-auto object-contain" />
                    <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white transition-colors">InternAlert</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/auth?mode=login')} className="text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors px-4 py-2">
                        Log In
                    </button>
                    <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary px-6 py-2 text-sm rounded-full shadow-lg shadow-blue-500/25">
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
                <motion.div 
                    initial="hidden"
                    animate="visible"
                    variants={staggerContainer}
                    className="text-center max-w-3xl mx-auto"
                >
                    <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase mb-8">
                        <Rocket size={14} /> The Future of Job Searching
                    </motion.div>
                    
                    <motion.div variants={fadeIn}>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-slate-900 via-slate-800 to-slate-500 dark:from-white dark:via-white dark:to-slate-400 leading-tight transition-colors">
                            Automate Your <br /> Career Trajectory
                        </h1>
                    </motion.div>
                    
                    <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto transition-colors">
                        Stop manual searching. InternAlert uses AI and intelligent scrapers to find 
                        perfect internship matches while you sleep. Focus on preparing, we'll handle the hunting.
                    </motion.p>
                    
                    <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary py-4 px-10 text-lg w-full sm:w-auto rounded-full font-bold shadow-xl shadow-blue-500/30 flex items-center justify-center gap-2 group">
                            Sign Up Now 
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                        </button>
                    </motion.div>
                </motion.div>
            </main>

            {/* Workflow Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">How It Works</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors">A seamless workflow designed for ambitious students.</p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8">
                    {[
                        { icon: <Target />, title: "1. Define Target", desc: "Upload your resume and set preferences. We analyze your skills to ensure highly accurate matches." },
                        { icon: <Zap />, title: "2. Radar Scan", desc: "Our engine continuously scrapes top job boards and company sites based on your parameters." },
                        { icon: <LayoutDashboard />, title: "3. Curated Feed", desc: "Log in to a professional dashboard or check your email for the latest high-match opportunities." }
                    ].map((step, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: idx * 0.2 }}
                            className="glass-card p-8 rounded-3xl group hover:border-blue-500/30 transition-all duration-500"
                        >
                            <div className="w-14 h-14 bg-white dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-white/10 shadow-sm rounded-2xl flex items-center justify-center mb-6 text-blue-500 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                {React.cloneElement(step.icon, { size: 28 })}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 transition-colors">{step.title}</h3>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed transition-colors">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Architecture Diagram */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-white/5">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 transition-colors">System Architecture</h2>
                    <p className="text-slate-600 dark:text-slate-400 text-lg transition-colors">Under the hood of our automated internship engine.</p>
                </div>
                
                <div className="relative max-w-5xl mx-auto">
                    {/* Horizontal line connecting nodes (desktop) */}
                    <div className="hidden md:block absolute top-[40px] left-12 right-12 h-1 bg-gradient-to-r from-blue-500/20 via-cyan-500/50 to-green-500/20 z-0" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 relative z-10">
                        {/* Node 1 */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500 shadow-xl shadow-blue-500/20 flex items-center justify-center mb-6 relative">
                                <FileText className="text-blue-500" size={32} />
                                {/* Pulsing dot */}
                                <motion.div animate={{ left: "100%", opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 hidden md:block" style={{ left: "calc(100% + 4px)" }} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 text-center transition-colors">User Profile</h4>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400 transition-colors">Resume & Preferences</p>
                        </motion.div>
                        
                        {/* Node 2 */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-cyan-500 shadow-xl shadow-cyan-500/20 flex items-center justify-center mb-6 relative">
                                <Bot className="text-cyan-500" size={32} />
                                <motion.div animate={{ left: "100%", opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-500 hidden md:block" style={{ left: "calc(100% + 4px)" }} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 text-center transition-colors">Scraping Engine</h4>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400 transition-colors">Continuous Web Search</p>
                        </motion.div>

                        {/* Node 3 */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.5 }} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-purple-500 shadow-xl shadow-purple-500/20 flex items-center justify-center mb-6 relative">
                                <Brain className="text-purple-500" size={32} />
                                <motion.div animate={{ left: "100%", opacity: [0, 1, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 1 }} className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-purple-500 hidden md:block" style={{ left: "calc(100% + 4px)" }} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 text-center transition-colors">AI Matcher</h4>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400 transition-colors">Gemini Scoring</p>
                        </motion.div>

                        {/* Node 4 */}
                        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-900 border-2 border-green-500 shadow-xl shadow-green-500/20 flex items-center justify-center mb-6">
                                <Bell className="text-green-500" size={32} />
                            </div>
                            <h4 className="font-bold text-lg text-slate-900 dark:text-white mb-2 text-center transition-colors">Delivery</h4>
                            <p className="text-sm text-center text-slate-600 dark:text-slate-400 transition-colors">Dashboard & Email Alert</p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features & Tutorial */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 py-24 border-t border-slate-200/50 dark:border-white/5">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
                        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">Setup in 3 Simple Steps</h2>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed transition-colors">
                            InternAlert takes the manual labor out of job hunting. Set it up once and let our automated engine work for you 24/7.
                        </p>
                        
                        <div className="space-y-6">
                            {[
                                { title: "1. Configure API Keys", desc: "Add your Gemini API key in settings to power the AI matcher and resume analysis." },
                                { title: "2. Set Preferences", desc: "Input your ideal roles, keywords, and upload your resume via the Onboarding page." },
                                { title: "3. Scan & Automate", desc: "Click 'Radar Scan' to scrape instantly, or rely on our background auto-scanner that runs on a timer to find fresh matches." },
                            ].map((item, idx) => (
                                <motion.div 
                                    key={idx} 
                                    initial={{ opacity: 0, y: 10 }} 
                                    whileInView={{ opacity: 1, y: 0 }} 
                                    transition={{ delay: idx * 0.1 }}
                                    viewport={{ once: true }}
                                    className="flex gap-4"
                                >
                                    <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white transition-colors">{item.title}</h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 transition-colors mt-1">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative mt-12 md:mt-0">
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-purple-500/20 rounded-3xl transform rotate-3 scale-105 transition-colors" />
                        <div className="glass-card rounded-3xl p-6 relative z-10 border border-slate-200/50 dark:border-white/10 shadow-2xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl transition-colors overflow-hidden">
                            {/* Dashboard Header Bar */}
                            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="text-blue-500" size={20} />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white transition-colors">Radar Dashboard</h3>
                                </div>
                                <button className="btn-primary px-4 py-1.5 rounded-full text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1">
                                    <Zap size={12} /> Scan Now
                                </button>
                            </div>

                            {/* Stat Cards Mock */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 font-medium mb-1">Total Scraped</p>
                                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">1,248</h4>
                                </div>
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                                    <p className="text-xs text-slate-500 font-medium mb-1">High Matches</p>
                                    <h4 className="text-2xl font-black text-green-500">24</h4>
                                </div>
                            </div>
                            
                            {/* Mock Dashboard UI List */}
                            <div className="space-y-3">
                                {[
                                    { score: 98, name: "Frontend Engineer Intern", company: "Vercel", time: "2m ago" },
                                    { score: 92, name: "Software Engineering Intern", company: "Google", time: "1h ago" }
                                ].map((mock, i) => (
                                    <motion.div 
                                        key={i} 
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        whileInView={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 + (i * 0.2) }}
                                        viewport={{ once: true }}
                                        className="bg-white dark:bg-slate-800/80 rounded-2xl p-4 flex justify-between items-center border border-slate-100 dark:border-slate-700 shadow-sm transition-colors hover:border-blue-500/30 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            {/* Fake Logo */}
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 font-bold border border-slate-200 dark:border-slate-700">
                                                {mock.company[0]}
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm mb-0.5 group-hover:text-blue-500 transition-colors">{mock.name}</div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                                    <span className="font-medium">{mock.company}</span>
                                                    <span>•</span>
                                                    <span>{mock.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center justify-center">
                                            <span className="text-xs font-bold text-green-500">{mock.score}%</span>
                                            <span className="text-[9px] uppercase tracking-wider text-slate-400">Match</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-slate-200 dark:border-white/5 py-12 text-center text-slate-500 transition-colors">
                <p>&copy; 2026 InternAlert. Built for the ambitious.</p>
            </footer>
        </div>
    );
};

export default Landing;
