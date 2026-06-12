import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Zap, 
    LayoutDashboard, 
    Settings, 
    User, 
    LogOut, 
    History, 
    PlusCircle,
    ChevronDown,
    Sun,
    Moon
} from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [theme, setTheme] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved ? saved : 'dark';
    });

    React.useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    if (!user) return null;

    const navItems = [
        { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Onboarding', path: '/onboarding', icon: Settings },
        { name: 'Profile', path: '/profile', icon: User },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-[100] px-6 md:px-12 transition-colors">
            <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
                {/* Logo Section */}
                <Link to="/dashboard" className="flex items-center gap-3 group">
                    <img src="/logo.png" alt="InternAlert" className="h-10 w-auto object-contain" />
                    <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white hidden sm:block transition-colors">InternAlert</span>
                </Link>

                {/* Primary Nav */}
                <div className="flex items-center gap-1 md:gap-4 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/5 transition-colors">
                    {navItems.map((item) => (
                        <Link 
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                isActive(item.path) 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/5'
                            }`}
                        >
                            <item.icon size={18} />
                            <span className="hidden md:block">{item.name}</span>
                        </Link>
                    ))}
                </div>

                {/* Right Section (Theme & Profile) */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 rounded-xl transition-all border border-slate-200 dark:border-white/5"
                        title="Toggle theme"
                    >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    {/* Profile Section */}
                    <div className="relative">
                    <button 
                        onClick={() => setIsProfileOpen(!isProfileOpen)}
                        className="flex items-center gap-3 pl-2 pr-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 rounded-2xl border border-slate-200 dark:border-white/5 transition-all group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-500/10">
                            {user.displayName?.[0] || user.email?.[0].toUpperCase() || <User size={18} />}
                        </div>
                        <div className="hidden sm:block text-left">
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight transition-colors">{user.displayName || 'Developer'}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold transition-colors">Radar Active</p>
                        </div>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                        {isProfileOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-full right-0 mt-4 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-3xl z-[110] transition-colors"
                            >
                                <div className="p-6 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 transition-colors">
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Identity</p>
                                    <p className="text-slate-900 dark:text-white font-bold truncate transition-colors">{user.email}</p>
                                </div>
                                <div className="p-3 space-y-1">
                                    <button 
                                        onClick={() => { navigate('/profile'); setIsProfileOpen(false); }}
                                        className="flex items-center gap-4 w-full p-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-sm"
                                    >
                                        <User size={18} className="text-blue-500" /> Account Settings
                                    </button>
                                    <button 
                                        onClick={() => { navigate('/onboarding'); setIsProfileOpen(false); }}
                                        className="flex items-center gap-4 w-full p-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-sm"
                                    >
                                        <PlusCircle size={18} className="text-cyan-500 dark:text-cyan-400" /> New Preference
                                    </button>
                                    <button 
                                        onClick={() => { navigate('/dashboard'); setIsProfileOpen(false); }}
                                        className="flex items-center gap-4 w-full p-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all font-bold text-sm"
                                    >
                                        <History size={18} className="text-indigo-500 dark:text-indigo-400" /> Past Signals
                                    </button>
                                </div>
                                <div className="p-3 bg-red-500/5 mt-1">
                                    <button 
                                        onClick={logout}
                                        className="flex items-center gap-4 w-full p-4 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-sm"
                                    >
                                        <LogOut size={18} /> Sign Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                </div>
            </div>
            
            {/* Click away listener */}
            {isProfileOpen && (
                <div 
                    className="fixed inset-0 z-[105]" 
                    onClick={() => setIsProfileOpen(false)}
                />
            )}
        </nav>
    );
};

export default Navbar;
