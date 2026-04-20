import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Settings, 
    Bell, 
    Play, 
    Clock, 
    ExternalLink, 
    LogOut,
    CheckCircle2,
    Briefcase,
    Zap,
    Send,
    Search,
    Shield,
    Calendar,
    ChevronRight,
    SearchCode,
    Loader2,
    Globe,
    User,
    Menu,
    X,
    Trash2,
    Plus,
    ArrowRight
} from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon, color, delay, loading }) => (
    <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, duration: 0.5 }}
        className="glass-card p-6 relative overflow-hidden group"
    >
        <div className={`absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${color}`}>
            {React.cloneElement(icon, { size: 120 })}
        </div>
        <div className="flex justify-between items-start mb-6">
            <div className={`p-4 rounded-2xl ${color.replace('text-', 'bg-').replace('500', '500/10')} ${color}`}>
                {React.cloneElement(icon, { size: 28 })}
            </div>
            {!loading && (
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Growth</span>
                    <span className="text-green-400 text-xs font-bold">+12%</span>
                </div>
            )}
        </div>
        {loading ? (
            <div className="h-10 w-24 skeleton mb-2" />
        ) : (
            <motion.h3 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-4xl font-black mb-2 tracking-tight"
            >
                {value}
            </motion.h3>
        )}
        <p className="text-slate-400 text-sm font-medium">{title}</p>
    </motion.div>
);

const SkeletonJob = () => (
    <div className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 opacity-50">
        <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl skeleton" />
            <div className="space-y-2">
                <div className="h-6 w-48 skeleton" />
                <div className="h-4 w-32 skeleton" />
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="h-10 w-24 skeleton rounded-xl" />
            <div className="h-10 w-10 skeleton rounded-full" />
        </div>
    </div>
);

const JobLogo = ({ company, domain }) => {
    const [imgState, setImgState] = useState('clearbit'); // clearbit -> google -> fallback

    const clearbitUrl = `https://logo.clearbit.com/${domain}`;
    const googleUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;

    if (imgState === 'fallback' || !domain || domain === 'web' || domain.includes('google.com')) {
        return (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-black border border-white/5 flex items-center justify-center text-2xl font-black text-slate-700 group-hover:text-blue-500/40 transition-colors">
                {company?.[0] || '?'}
            </div>
        );
    }

    return (
        <div className="w-16 h-16 rounded-2xl bg-white/90 p-2 border border-white/5 flex items-center justify-center overflow-hidden group-hover:border-blue-500/40 transition-colors">
            <img 
                src={imgState === 'clearbit' ? clearbitUrl : googleUrl} 
                alt={company}
                className="w-full h-full object-contain"
                onError={() => {
                    if (imgState === 'clearbit') setImgState('google');
                    else setImgState('fallback');
                }}
            />
        </div>
    );
};

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalScrapes: 0, totalSent: 0 });
    const [results, setResults] = useState([]);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [scrapeProgress, setScrapeProgress] = useState(0);
    const [showToast, setShowToast] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isEditingPrefs, setIsEditingPrefs] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const controller = new AbortController();

        const fetchData = async (isManual = false) => {
            if (!isManual) setLoading(true);
            try {
                const token = await user.getIdToken();
                const response = await api.get('/user/profile', { 
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal
                });

                if (!isMounted) return;

                if (response.data.onboardingRequired) {
                    navigate('/onboarding');
                    return;
                }

                setProfile(response.data);
                setStats({
                    totalScrapes: response.data.stats?.totalScrapes || 0,
                    totalSent: response.data.stats?.totalSent || 0
                });
            } catch (err) {
                if (err.name === 'CanceledError' || err.name === 'AbortError') return;
                console.error('Fetch error:', err);
                triggerToast('error', 'Failed to synchronize data');
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchData();
        loadLocalResults();

        return () => {
            isMounted = false;
            controller.abort();
        };
    }, [user, navigate]);

    const loadLocalResults = () => {
        const saved = localStorage.getItem(`results_${user.uid}`);
        if (saved) {
            setResults(JSON.parse(saved));
        }
    };

    // Redefining fetchData for manual trigger
    const refetchData = async () => {
        try {
            const token = await user.getIdToken();
            const response = await api.get('/user/profile', { 
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(response.data);
            setStats({
                totalScrapes: response.data.stats?.totalScrapes || 0,
                totalSent: response.data.stats?.totalSent || 0
            });
        } catch (err) {
            console.error('Refetch error:', err);
        }
    };

    const triggerToast = (type, message) => {
        setShowToast({ type, message });
        setTimeout(() => setShowToast(null), 4000);
    };

    const handleScrapeNow = async () => {
        if (scraping) return;
        
        setScraping(true);
        setScrapeProgress(10);
        
        const intervalId = setInterval(() => {
            setScrapeProgress(p => p < 95 ? p + 2 : p);
        }, 300);

        try {
            const token = await user.getIdToken();
            const res = await api.post('/user/scrape-now', {}, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 180000 // 3 minute timeout for deep scraping
            });
            
            setScrapeProgress(100);
            clearInterval(intervalId);
            
            // Save to LocalStorage
            if (res.data.results) {
                const newResults = res.data.results;
                setResults(newResults);
                localStorage.setItem(`results_${user.uid}`, JSON.stringify(newResults));
            }

            triggerToast('success', `Scrape complete! Found ${res.data.count} matches.`);
            refetchData();
        } catch (err) {
            clearInterval(intervalId);
            console.error('Manual scrape error:', err);
            const msg = err.response?.data?.error || 'The search radar hit an intercept. Try again.';
            triggerToast('error', msg);
        } finally {
            clearInterval(intervalId);
            setTimeout(() => {
                setScraping(false);
                setScrapeProgress(0);
            }, 800);
        }
    };

    const handleUpdatePrefs = async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            await api.post('/user/preferences', {
                preferences: profile.preferences,
                isEnabled: profile.isEnabled,
                scheduleInterval: profile.scheduleInterval
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            triggerToast('success', 'Preferences updated successfully');
            setIsEditingPrefs(false);
        } catch (err) {
            triggerToast('error', 'Failed to update preferences');
        } finally {
            setLoading(false);
        }
    };

    const removePrefSet = (index) => {
        const newSets = profile.preferences.preferenceSets.filter((_, i) => i !== index);
        setProfile({
            ...profile,
            preferences: { ...profile.preferences, preferenceSets: newSets }
        });
    };

    const addPrefSet = () => {
        setProfile({
            ...profile,
            preferences: { 
                ...profile.preferences, 
                preferenceSets: [...(profile.preferences.preferenceSets || []), { role: 'New Role', location: 'Remote' }] 
            }
        });
    };

    const updatePrefSet = (index, field, value) => {
        const newSets = [...profile.preferences.preferenceSets];
        newSets[index][field] = value;
        setProfile({
            ...profile,
            preferences: { ...profile.preferences, preferenceSets: newSets }
        });
    };

    return (
        <div className="min-h-screen text-slate-200 lg:bg-slate-950 overflow-hidden px-6 lg:px-12">
            <main className="max-w-7xl mx-auto relative pt-12">
                <div className="max-w-6xl mx-auto space-y-12">
                    <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div>
                            <motion.h1 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-5xl font-black tracking-tight text-white mb-2"
                            >
                                Satellite <span className="text-blue-500">Feed</span>
                            </motion.h1>
                            <div className="text-slate-500 font-medium flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Real-time internship synchronization engine
                            </div>
                        </div>
                        
                        <div className="flex gap-4 w-full md:w-auto">
                            <button 
                                onClick={handleScrapeNow}
                                disabled={scraping || loading}
                                className={`btn-primary flex-1 md:flex-initial py-5 px-10 text-sm flex items-center justify-center gap-3 relative overflow-hidden h-16 min-w-[220px] shadow-2xl shadow-blue-500/20`}
                            >
                                {scraping && (
                                    <motion.div 
                                        className="absolute inset-0 bg-blue-400/30"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: `${scrapeProgress - 100}%` }}
                                    />
                                )}
                                {scraping ? (
                                    <>
                                        <Loader2 className="animate-spin" size={18} />
                                        <span className="font-bold">Syncing... {Math.round(scrapeProgress)}%</span>
                                    </>
                                ) : (
                                    <>
                                        <SearchCode size={20} />
                                        <span className="font-bold uppercase tracking-widest text-xs">Run Manual Pulse</span>
                                    </>
                                )}
                            </button>
                            <button onClick={() => setIsEditingPrefs(!isEditingPrefs)} className="btn-secondary p-5 h-16 w-16 flex items-center justify-center">
                                <Settings size={24} />
                            </button>
                        </div>
                    </header>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatCard 
                            title="LocalStorage Cache" 
                            value={results.length} 
                            icon={<Shield className="text-blue-500" />} 
                            color="text-blue-500"
                            delay={0.1}
                            loading={loading}
                        />
                        <StatCard 
                            title="Radar Cycles" 
                            value={stats.totalScrapes} 
                            icon={<Zap className="text-cyan-400" />} 
                            color="text-cyan-400"
                            delay={0.2}
                            loading={loading}
                        />
                        <StatCard 
                            title="Signal Strength" 
                            value="High" 
                            icon={<Send className="text-indigo-400" />} 
                            color="text-indigo-400"
                            delay={0.3}
                            loading={loading}
                        />
                    </div>

                    {/* Preferences Redirect Section */}
                    {isEditingPrefs && (
                        <motion.section 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="glass-panel p-12 text-center space-y-6 border-blue-500/20"
                        >
                            <div className="w-20 h-20 bg-blue-500/10 rounded-3xl mx-auto flex items-center justify-center">
                                <Settings size={40} className="text-blue-500" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-white">Preference Management</h3>
                                <p className="text-slate-500 max-w-md mx-auto font-medium">To manage your multi-set search patterns, please use the dedicated configuration suite.</p>
                            </div>
                            <button 
                                onClick={() => navigate('/onboarding')}
                                className="btn-primary py-4 px-10 rounded-2xl flex items-center justify-center gap-3 mx-auto shadow-blue-500/20"
                            >
                                <span className="font-bold uppercase tracking-widest text-xs">Open Configuration Radar</span>
                                <ArrowRight size={18} />
                            </button>
                        </motion.section>
                    )}

                    {/* Job Flux Feed */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black flex items-center gap-4 text-white">
                                <div className="w-12 h-12 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center">
                                    <Clock size={24} className="text-blue-500" />
                                </div>
                                Flux Feed
                            </h3>
                            <button onClick={() => {
                                localStorage.removeItem(`results_${user.uid}`);
                                setResults([]);
                            }} className="text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-colors">
                                Clear Local Cache
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <AnimatePresence mode="popLayout">
                                {loading ? (
                                    [1, 2, 3, 4].map(i => <SkeletonJob key={i} />)
                                ) : results.length > 0 ? (
                                    results.map((job, idx) => (
                                        <motion.div 
                                            key={job.id || idx}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-blue-500/40 group relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-colors" />
                                            
                                            <div className="flex items-center gap-6">
                                                <JobLogo company={job.company} domain={job.domain} />
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                        <h4 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors">{job.title}</h4>
                                                        <div className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/10 text-blue-500 uppercase tracking-widest border border-blue-500/20">
                                                            {job.source}
                                                        </div>
                                                    </div>
                                                    <p className="text-slate-500 font-bold text-sm flex items-center gap-2">
                                                        <Globe size={14} className="text-blue-500/50" /> {job.company} • Discovered {new Date(job.scrapedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-6">
                                                <div className="text-right hidden md:block border-r border-white/5 pr-6">
                                                    <div className="flex items-center gap-2 justify-end text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1">
                                                        AI Match Score
                                                    </div>
                                                    <div className="flex gap-1 justify-end">
                                                        {[1, 2, 3, 4, 5].map(star => {
                                                            const threshold = (star * 20);
                                                            const isActive = (job.matchScore || 0) >= threshold || (threshold <= 40); // default 2 stars for baseline
                                                            return <div key={star} className={`w-1.5 h-3 rounded-full ${isActive ? 'bg-blue-500' : 'bg-white/10'}`} />;
                                                        })}
                                                    </div>
                                                </div>
                                                <a 
                                                    href={job.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="btn-primary rounded-2xl px-8 py-4 flex items-center justify-center gap-3 shadow-2xl shadow-blue-500/20 hover:scale-105 transition-transform"
                                                >
                                                    <span className="text-xs font-black uppercase tracking-widest">Apply Now</span>
                                                    <ExternalLink size={18} />
                                                </a>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex flex-col items-center justify-center py-40 glass-panel border-dashed border-white/5 bg-slate-900/10"
                                    >
                                        <div className="w-24 h-24 bg-white/[0.03] rounded-3xl flex items-center justify-center mb-8 rotate-12 border border-white/5">
                                            <SearchCode size={48} className="text-slate-800" />
                                        </div>
                                        <h4 className="text-2xl font-black text-white mb-2">No Local Signal</h4>
                                        <p className="text-slate-500 max-w-sm text-center font-medium">Results are now stored locally for privacy. Run a scan to populate your feed.</p>
                                        <button onClick={handleScrapeNow} className="mt-8 text-blue-500 font-bold flex items-center gap-2 hover:gap-4 transition-all">
                                            Run First Pulse <ArrowRight size={18} />
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* Toast Overlay */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
                        >
                            <div className={`flex items-center gap-4 bg-slate-900 p-4 rounded-3xl border ${showToast.type === 'error' ? 'border-red-500/30 shadow-red-500/10' : 'border-blue-500/30 shadow-blue-500/10'} shadow-2xl backdrop-blur-3xl min-w-[320px]`}>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${showToast.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                    {showToast.type === 'error' ? <Zap size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white leading-tight">{showToast.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
