import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ArrowRight, Shield, Zap, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';

const Auth = () => {
    const { signInWithGoogle, signupWithEmail, loginWithEmail, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Determine initial mode from URL
    const queryParams = new URLSearchParams(location.search);
    const initialMode = queryParams.get('mode') === 'signup' ? 'signup' : 'login';
    
    const [mode, setMode] = useState(initialMode);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [error, setError] = useState('');
    const [verificationSent, setVerificationSent] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    // If user is already authenticated and verified, redirect to dashboard
    useEffect(() => {
        if (user) {
            // Give preference to dashboard if they are logged in. 
            // If email is not verified, they will just see the dashboard but we could add a banner there.
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleGoogleAuth = async () => {
        setGoogleLoading(true);
        setError('');
        try {
            await signInWithGoogle();
            navigate('/onboarding');
        } catch (err) {
            setError(err.message || 'Failed to authenticate with Google.');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            if (mode === 'signup') {
                await signupWithEmail(formData.email, formData.password);
                setVerificationSent(true);
            } else {
                await loginWithEmail(formData.email, formData.password);
                // AuthContext effect will handle redirect
            }
        } catch (err) {
            let msg = err.message;
            if (err.code === 'auth/email-already-in-use') msg = 'Email already in use.';
            if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
            if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
            setError(msg || 'Authentication failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setError('');
        setVerificationSent(false);
        setMode(prev => prev === 'login' ? 'signup' : 'login');
    };

    if (verificationSent) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-slate-950">
                <div className="bg-mesh opacity-50 absolute inset-0 z-0" />
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="glass-panel max-w-lg w-full p-10 relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-green-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
                        <CheckCircle2 className="text-green-400" size={40} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white mb-4">Verify Your Email</h2>
                    <p className="text-slate-400 mb-8">
                        We've sent a verification link to <span className="text-white font-bold">{formData.email}</span>. 
                        Please check your inbox and click the link to activate your account.
                    </p>
                    <button onClick={() => setVerificationSent(false)} className="btn-secondary px-8 py-3 w-full">
                        Back to Login
                    </button>
                    <p className="text-xs text-slate-500 mt-6">
                        You can close this tab safely. Returning here will allow you to log in after verification.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-transparent">
            {/* Background Decorations */}
            <div className="bg-mesh opacity-30 absolute inset-0 z-0" />
            <motion.div 
                animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.1, 0.3, 0.1],
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-blue-600/30 blur-[150px] rounded-full z-0 pointer-events-none" 
            />
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="glass-panel max-w-lg w-full p-8 md:p-10 relative z-10"
            >
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-500/20"
                    >
                        <Zap className="text-white" size={32} fill="white" />
                    </motion.div>
                    
                    <h1 className="text-3xl font-extrabold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                        {mode === 'login' ? 'Welcome Back' : 'Join InternAlert'}
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">
                        {mode === 'login' ? 'Enter your credentials to access the radar.' : 'Automate your career trajectory today.'}
                    </p>
                </div>

                <div className="space-y-6">
                    <button
                        onClick={handleGoogleAuth}
                        disabled={googleLoading || loading}
                        className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-3 transition-all disabled:opacity-50"
                    >
                        {googleLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            <>
                                <Globe size={20} className="text-blue-600" />
                                Continue with Google
                            </>
                        )}
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <div className="relative flex justify-center text-xs text-slate-500">
                            <span className="bg-[#0b1121] px-4 font-medium">OR CONTINUE WITH EMAIL</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="email" 
                                    className="input-field pl-12"
                                    placeholder="elon@mars.com"
                                    autoComplete="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input 
                                    type="password" 
                                    className="input-field pl-12"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || googleLoading}
                            className={`btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2 mt-4 overflow-hidden relative ${loading ? 'opacity-90 cursor-not-allowed' : ''}`}
                        >
                            {loading && <div className="absolute inset-0 bg-blue-400/20 skeleton" />}
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm text-center font-medium"
                            >
                                {error}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="mt-8 text-center border-t border-white/5 pt-6">
                    <p className="text-slate-400 text-sm">
                        {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                        <button type="button" onClick={toggleMode} className="text-blue-400 font-bold hover:text-blue-300 hover:underline transition-all">
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
