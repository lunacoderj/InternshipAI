import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Rocket, Target, Zap, Shield, ArrowRight, LayoutDashboard } from 'lucide-react';

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
        <div className="min-h-screen text-slate-200 overflow-x-hidden relative">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 bg-slate-950">
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
                    <span className="text-xl font-black tracking-tight text-white">InternAlert</span>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => navigate('/auth?mode=login')} className="text-sm font-bold text-slate-300 hover:text-white transition-colors px-4 py-2">
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
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-slate-400 leading-tight">
                            Automate Your <br /> Career Trajectory
                        </h1>
                    </motion.div>
                    
                    <motion.p variants={fadeIn} className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
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
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">How It Works</h2>
                    <p className="text-slate-400 text-lg">A seamless workflow designed for ambitious students.</p>
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
                            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                                {React.cloneElement(step.icon, { size: 28 })}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                            <p className="text-slate-400 leading-relaxed">
                                {step.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-12 text-center text-slate-500">
                <p>&copy; 2026 InternAlert. Built for the ambitious.</p>
            </footer>
        </div>
    );
};

export default Landing;
