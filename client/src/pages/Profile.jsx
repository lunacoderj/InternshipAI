import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutDashboard, 
    Settings, 
    LogOut,
    CheckCircle2,
    Zap,
    ChevronRight,
    User,
    Mail,
    Shield,
    Lock,
    Key,
    Send,
    Trash2,
    ExternalLink,
    Briefcase
} from 'lucide-react';
import { sendEmailVerification, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import api from '../services/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [showToast, setShowToast] = useState(null);
    const [apifyKey, setApifyKey] = useState('');
    const [profileData, setProfileData] = useState(null);
    
    const [passwords, setPasswords] = useState({
        old: '',
        new: '',
        confirm: ''
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = await user.getIdToken();
            const res = await api.get('/user/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileData(res.data);
            setApifyKey(res.data.apifyKey || '');
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setFetching(false);
        }
    };

    const triggerToast = (type, message) => {
        setShowToast({ type, message });
        setTimeout(() => setShowToast(null), 4000);
    };

    const handleSendTestEmail = async () => {
        setLoading(true);
        try {
            const token = await user.getIdToken();
            // We use the preferences endpoint with current data to trigger a test email
            await api.post('/user/preferences', {
                apifyKey: apifyKey,
                preferences: profileData?.preferences
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            triggerToast('success', 'Test email sent! Please check your inbox.');
        } catch (error) {
            triggerToast('error', 'Failed to send test email. Check your Apify key.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateApifyKey = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await user.getIdToken();
            await api.post('/user/preferences', {
                apifyKey: apifyKey,
                preferences: profileData?.preferences
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            triggerToast('success', 'Apify API Key updated and test email sent!');
            fetchProfile();
        } catch (error) {
            triggerToast('error', error.response?.data?.error || 'Failed to update API key.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        setLoading(true);
        try {
            await sendEmailVerification(user);
            triggerToast('success', 'Verification email sent. Please check your inbox.');
        } catch (error) {
            triggerToast('error', error.message || 'Failed to send verification email.');
        } finally {
            setLoading(false);
        }
    };

    const hasPasswordProvider = user?.providerData?.some(p => p.providerId === 'password');

    const handleSetOrChangePassword = async (e) => {
        e.preventDefault();
        
        if (passwords.new !== passwords.confirm) {
            triggerToast('error', 'New passwords do not match.');
            return;
        }

        if (passwords.new.length < 6) {
            triggerToast('error', 'Password must be at least 6 characters.');
            return;
        }

        setLoading(true);
        try {
            if (hasPasswordProvider) {
                // Must re-authenticate first
                const credential = EmailAuthProvider.credential(user.email, passwords.old);
                await reauthenticateWithCredential(user, credential);
            }
            // Update to new password
            await updatePassword(user, passwords.new);
            await user.reload(); // Refresh user state to update providerData
            triggerToast('success', 'Password updated successfully! A test email has been triggered.');
            setPasswords({ old: '', new: '', confirm: '' });
            
            // Send test email as requested after "verification"/update
            handleSendTestEmail();
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                triggerToast('error', 'Old password is incorrect.');
            } else if (error.code === 'auth/requires-recent-login') {
                triggerToast('error', 'Security limit reached. Please log out and log back in to change your password.');
            } else {
                triggerToast('error', error.message || 'Failed to update password.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteApplied = async (jobId) => {
        try {
            const token = await user.getIdToken();
            await api.delete(`/user/applied/${jobId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update local state
            setProfileData(prev => ({
                ...prev,
                preferences: {
                    ...prev.preferences,
                    appliedJobs: (prev.preferences?.appliedJobs || []).filter(j => j.id !== jobId)
                }
            }));
            triggerToast('success', 'Removed from applied history.');
        } catch (error) {
            triggerToast('error', 'Failed to remove applied job.');
        }
    };

    const appliedJobs = profileData?.preferences?.appliedJobs || [];

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            {/* Main Content */}
            <main className="space-y-12 relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2 transition-colors">
                            Account Profile
                        </h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Shield size={14} /> Security & Identity
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-start">
                    {/* User Identity Section */}
                    <div className="glass-card p-6 h-full flex flex-col bg-white dark:bg-transparent shadow-xl dark:shadow-none transition-colors border-slate-200 dark:border-white/5">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3 transition-colors">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Mail size={20} />
                            </div>
                            Email & Verification
                        </h3>
                        
                        <div className="space-y-4 flex-1">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                                <div className="text-slate-700 dark:text-white font-medium bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
                                    {user?.email}
                                </div>
                            </div>
                            
                            <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-slate-800 dark:text-white transition-colors">Verification Status</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 transition-colors">
                                        {user?.emailVerified ? 'Your email is verified.' : 'Please verify your email.'}
                                    </p>
                                </div>
                                {user?.emailVerified ? (
                                    <div className="text-green-600 dark:text-green-400 flex items-center gap-2 bg-green-100 dark:bg-green-500/10 px-4 py-2 rounded-lg text-sm font-bold border border-green-200 dark:border-green-500/20 whitespace-nowrap transition-colors">
                                        <CheckCircle2 size={16} /> Verified
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleVerifyEmail}
                                        disabled={loading}
                                        className="btn-primary px-6 py-2 text-sm disabled:opacity-50 whitespace-nowrap"
                                    >
                                        Resend Email
                                    </button>
                                )}
                            </div>

                            <div className="mt-auto pt-4">
                                <button 
                                    onClick={handleSendTestEmail}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-xl border border-slate-200 dark:border-white/5 transition-all text-sm font-bold group"
                                >
                                    <Send size={16} className="text-blue-500 dark:text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    Send Test Email Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Apify Key Section */}
                    <div className="glass-card p-6 h-full flex flex-col bg-white dark:bg-transparent shadow-xl dark:shadow-none transition-colors border-slate-200 dark:border-white/5">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3 transition-colors">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-600 dark:text-purple-400 transition-colors">
                                <Key size={20} />
                            </div>
                            Apify Configuration
                        </h3>
                        
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">Manage your scraper authentication. Updating this will trigger a verification test email.</p>

                        <form onSubmit={handleUpdateApifyKey} className="space-y-4 flex-1 flex flex-col">
                            <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly className="hidden" />
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Apify API Key</label>
                                <input 
                                    type="password"
                                    required
                                    className="input-field font-mono text-sm bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 transition-colors"
                                    placeholder="apify_api_..."
                                    value={apifyKey}
                                    onChange={e => setApifyKey(e.target.value)}
                                />
                            </div>
                            
                            <div className="mt-auto pt-4">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="btn-primary w-full py-3 disabled:opacity-50"
                                >
                                    Update API Key
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="glass-card p-6 h-full flex flex-col bg-white dark:bg-transparent shadow-xl dark:shadow-none transition-colors border-slate-200 dark:border-white/5">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3 transition-colors">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-600 dark:text-cyan-400 transition-colors">
                                <Lock size={20} />
                            </div>
                            {hasPasswordProvider ? 'Change Password' : 'Set Password'}
                        </h3>
                        
                        {hasPasswordProvider ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">Update your password to keep your account secure.</p>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">You signed in with a provider. Set a password to allow email login.</p>
                        )}

                        <form onSubmit={handleSetOrChangePassword} className="space-y-4 flex-1 flex flex-col">
                            <input type="text" name="username" autoComplete="username" value={user?.email || ''} readOnly className="hidden" />
                            {hasPasswordProvider && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Old Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="input-field bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 transition-colors"
                                        placeholder="Current password"
                                        value={passwords.old}
                                        onChange={e => setPasswords({...passwords, old: e.target.value})}
                                    />
                                </div>
                            )}
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">New Password</label>
                                <input 
                                    type="password"
                                    required
                                    className="input-field bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 transition-colors"
                                    placeholder="New password"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Confirm Password</label>
                                <input 
                                    type="password"
                                    required
                                    className="input-field bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 transition-colors"
                                    placeholder="Confirm new password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                />
                            </div>
                            
                            <div className="mt-auto pt-4">
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="btn-secondary w-full py-3 disabled:opacity-50 text-slate-800 dark:text-white border-slate-200 dark:border-white/10 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 transition-colors"
                                >
                                    {hasPasswordProvider ? 'Reset Password' : 'Set Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Applied Internships History */}
                    <div className="glass-card p-6 h-full flex flex-col bg-white dark:bg-transparent shadow-xl dark:shadow-none transition-colors border-slate-200 dark:border-white/5 xl:col-span-3">
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-3 transition-colors">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400 transition-colors">
                                <Briefcase size={20} />
                            </div>
                            Applied Internships
                        </h3>
                        
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 transition-colors">Track the internships you've applied to. They'll be saved here so you can refer back to them.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {appliedJobs.length === 0 ? (
                                <div className="p-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-center md:col-span-2 lg:col-span-3 transition-colors">
                                    <p className="text-sm text-slate-500 font-bold">No applied internships yet.</p>
                                </div>
                            ) : (
                                appliedJobs.map((job) => (
                                    <div key={job.id} className="flex flex-col p-4 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl border border-slate-200 dark:border-white/5 transition-colors group">
                                        <div className="mb-4">
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm truncate transition-colors">{job.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1 transition-colors">
                                                {job.company} • Applied {new Date(job.appliedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-auto pt-2 border-t border-slate-200 dark:border-white/5">
                                            <a 
                                                href={job.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="flex-1 flex items-center justify-center gap-2 p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-500/20 rounded-lg transition-colors text-xs font-bold uppercase tracking-wider"
                                            >
                                                <ExternalLink size={14} /> Open
                                            </a>
                                            <button 
                                                onClick={() => handleDeleteApplied(job.id)}
                                                className="p-2 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
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
                            <div className={`flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-3xl border ${showToast.type === 'error' ? 'border-red-500/30 shadow-red-500/10' : 'border-green-500/30 shadow-green-500/10'} shadow-2xl backdrop-blur-3xl min-w-[320px] transition-colors`}>
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${showToast.type === 'error' ? 'bg-red-500/10 text-red-500 dark:text-red-400' : 'bg-green-500/10 text-green-500 dark:text-green-400'}`}>
                                    {showToast.type === 'error' ? <Zap size={20} /> : <CheckCircle2 size={20} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight transition-colors">{showToast.message}</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Profile;
