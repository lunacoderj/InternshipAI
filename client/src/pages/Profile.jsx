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
    Send
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

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-12">
            {/* Main Content */}
            <main className="space-y-12 relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-white mb-2">
                            Account Profile
                        </h1>
                        <p className="text-slate-500 font-medium flex items-center gap-2">
                            <Shield size={14} /> Security & Identity
                        </p>
                    </div>
                </header>

                <div className="max-w-2xl space-y-8">
                    {/* User Identity Section */}
                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                                <Mail size={20} />
                            </div>
                            Email & Verification
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Email Address</label>
                                <div className="text-white font-medium bg-white/5 p-4 rounded-xl border border-white/5">
                                    {user?.email}
                                </div>
                            </div>
                            
                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                                <div>
                                    <p className="text-sm font-bold text-white">Verification Status</p>
                                    <p className="text-xs text-slate-400">
                                        {user?.emailVerified ? 'Your email is verified.' : 'Please verify your email address to secure your account.'}
                                    </p>
                                </div>
                                {user?.emailVerified ? (
                                    <div className="text-green-400 flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-lg text-sm font-bold border border-green-500/20">
                                        <CheckCircle2 size={16} /> Verified
                                    </div>
                                ) : (
                                    <button 
                                        onClick={handleVerifyEmail}
                                        disabled={loading}
                                        className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
                                    >
                                        Resend Email
                                    </button>
                                )}
                            </div>

                            <button 
                                onClick={handleSendTestEmail}
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/5 transition-all text-sm font-bold group"
                            >
                                <Send size={16} className="text-blue-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                Send Test Email Report
                            </button>
                        </div>
                    </div>

                    {/* Apify Key Section */}
                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Key size={20} />
                            </div>
                            Apify Configuration
                        </h3>
                        
                        <p className="text-sm text-slate-400 mb-6">Manage your scraper authentication. Updating this will trigger a verification test email.</p>

                        <form onSubmit={handleUpdateApifyKey} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Apify API Key</label>
                                <input 
                                    type="password"
                                    required
                                    className="input-field font-mono text-sm"
                                    placeholder="apify_api_..."
                                    value={apifyKey}
                                    onChange={e => setApifyKey(e.target.value)}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-primary w-full py-3 mt-2 disabled:opacity-50"
                            >
                                Update API Key
                            </button>
                        </form>
                    </div>

                    {/* Password Section */}
                    <div className="glass-card p-8">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-400">
                                <Lock size={20} />
                            </div>
                            {hasPasswordProvider ? 'Change Password' : 'Set Password'}
                        </h3>
                        
                        {hasPasswordProvider ? (
                            <p className="text-sm text-slate-400 mb-6">Update your password to keep your account secure.</p>
                        ) : (
                            <p className="text-sm text-slate-400 mb-6">You signed in with a third-party provider. Set a password to also allow email/password login.</p>
                        )}

                        <form onSubmit={handleSetOrChangePassword} className="space-y-4">
                            {hasPasswordProvider && (
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Old Password</label>
                                    <input 
                                        type="password"
                                        required
                                        className="input-field"
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
                                    className="input-field"
                                    placeholder="New password (min 6 chars)"
                                    value={passwords.new}
                                    onChange={e => setPasswords({...passwords, new: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Re-enter New Password</label>
                                <input 
                                    type="password"
                                    required
                                    className="input-field"
                                    placeholder="Confirm new password"
                                    value={passwords.confirm}
                                    onChange={e => setPasswords({...passwords, confirm: e.target.value})}
                                />
                            </div>
                            
                            <button 
                                type="submit" 
                                disabled={loading}
                                className="btn-secondary w-full py-3 mt-4 disabled:opacity-50"
                            >
                                {hasPasswordProvider ? 'Reset Password' : 'Set Password'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Toast Overlay */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="toast-container"
                        >
                            <div className={`toast ${showToast.type === 'error' ? 'border-red-500/50' : 'border-green-500/50'}`}>
                                <div className={`p-2 rounded-lg ${showToast.type === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {showToast.type === 'error' ? <Zap size={18} /> : <CheckCircle2 size={18} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-white mb-0.5">{showToast.type === 'error' ? 'System Warning' : 'Operation Success'}</p>
                                    <p className="text-xs text-slate-400 font-medium">{showToast.message}</p>
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
