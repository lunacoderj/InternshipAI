import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    CheckCircle2, 
    Zap, 
    Shield, 
    Clock, 
    Globe, 
    Briefcase, 
    X,
    Mail,
    BellOff,
    ChevronDown,
    ArrowRight,
    Search,
    Loader2,
    AlertCircle
} from 'lucide-react';
import api from '../services/api';
import { ROLES, WORK_PREFERENCES, COUNTRIES, TIME_INTERVALS, LOOKBACK_OPTIONS } from '../constants/options';

const MultiSelect = ({ options, selected, onChange, placeholder, icon: Icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const toggle = (opt) => {
        if (selected.includes(opt)) {
            onChange(selected.filter(i => i !== opt));
        } else {
            onChange([...selected, opt]);
        }
    };

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative">
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className="input-field cursor-pointer flex items-center justify-between min-h-[56px] flex-wrap gap-2 transition-all hover:border-blue-500/30"
            >
                <div className="flex items-center gap-3 overflow-hidden flex-1">
                    {Icon && <Icon size={18} className="text-blue-500 shrink-0" />}
                    <div className="flex flex-wrap gap-1.5 overflow-hidden">
                        {selected.length > 0 ? (
                            selected.slice(0, 3).map(item => (
                                <span key={item} className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-500/20 truncate">
                                    {item}
                                </span>
                            ))
                        ) : (
                            <span className="text-slate-600 font-medium">{placeholder}</span>
                        )}
                        {selected.length > 3 && <span className="text-[10px] font-bold text-blue-500">+{selected.length - 3} more</span>}
                    </div>
                </div>
                <ChevronDown size={16} className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute top-full left-0 right-0 mt-2 p-2 glass-panel !rounded-2xl z-50 max-h-[300px] overflow-hidden flex flex-col border-white/5 active-select-dropdown"
                        >
                            <div className="p-2 border-b border-slate-200 dark:border-white/5 flex items-center gap-2">
                                <Search size={14} className="text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="Search options..."
                                    className="bg-transparent border-none text-xs text-slate-800 dark:text-white focus:ring-0 w-full outline-none"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
                                {filteredOptions.length > 0 ? (
                                    filteredOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => toggle(opt)}
                                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left mb-1 ${
                                                selected.includes(opt) 
                                                ? 'bg-blue-600 text-white' 
                                                : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                                            }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(opt) ? 'border-white bg-white/20' : 'border-slate-300 dark:border-slate-700'}`}>
                                                {selected.includes(opt) && <CheckCircle2 size={10} />}
                                            </div>
                                            {opt}
                                        </button>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-slate-600 text-xs font-bold">No matches found</div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

const Onboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // ID of row being edited

    const [rows, setRows] = useState([]);
    const [apifyKey, setApifyKey] = useState('');
    const [resumeText, setResumeText] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchExistingData = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const response = await api.get('/user/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.preferences?.preferenceSets) {
                    setRows(response.data.preferences.preferenceSets);
                }
                if (response.data && response.data.apifyKey) {
                    setApifyKey(response.data.apifyKey);
                }
                if (response.data && response.data.preferences?.resumeText) {
                    setResumeText(response.data.preferences.resumeText);
                }
            } catch (err) {
                console.error('Failed to pre-populate onboarding data:', err);
            }
        };
        fetchExistingData();
    }, [user]);

    const [currentRow, setCurrentRow] = useState({
        roles: [],
        workTypes: [],
        locations: [],
        interval: '12hr',
        lookback: '7 days',
        enabled: true
    });

    const addOrUpdateRow = () => {
        setError('');
        setSuccess('');

        // Validation
        if (!currentRow.roles?.length) {
            setError('Please select at least one role');
            return;
        }
        if (!currentRow.locations?.length) {
            setError('Please select at least one location');
            return;
        }

        // Check for duplicates (excluding the version we're currently editing)
        const isDuplicate = rows.some(r => 
            r.id !== isEditing &&
            JSON.stringify([...r.roles].sort()) === JSON.stringify([...currentRow.roles].sort()) &&
            JSON.stringify([...r.locations].sort()) === JSON.stringify([...currentRow.locations].sort())
        );

        if (isDuplicate) {
            setError('This search configuration already exists in your list.');
            return;
        }
        
        if (isEditing) {
            setRows(rows.map(r => r.id === isEditing ? { ...currentRow, id: isEditing } : r));
            setIsEditing(null);
            setSuccess('Configuration updated successfully!');
        } else {
            setRows([...rows, { ...currentRow, id: Date.now().toString() }]);
            setSuccess('Configuration added to your list!');
        }

        // Reset
        setCurrentRow({
            roles: [],
            workTypes: [],
            locations: [],
            interval: '12hr',
            lookback: '7 days',
            enabled: true
        });

        setTimeout(() => setSuccess(''), 3000);
    };

    const editRow = (row) => {
        setCurrentRow(row);
        setIsEditing(row.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const deleteRow = (id) => setRows(rows.filter(r => r.id !== id));
    
    const toggleRowEnabled = (id) => {
        setRows(rows.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
    };

    const handleSyncConfig = async () => {
        setError('');
        setSuccess('');
        
        if (!apifyKey?.trim()) {
            setError('Apify API Key is required to power the search engine.');
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await api.post('/user/preferences', {
                apifyKey: apifyKey.trim(),
                preferences: { 
                    preferenceSets: rows,
                    resumeText: resumeText.trim()
                },
                onboardingRequired: false,
                isEnabled: true
            }, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                }
            });

            if (response.status === 200) {
                setSuccess('Mission control: Configuration synchronized successfully.');
                setTimeout(() => setSuccess(''), 3000);
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (err) {
            console.error('Sync error:', err);
            let msg = 'Sync failure: Could not update configuration.';
            if (err.response?.data?.error) {
                msg += ` ${err.response.data.error}`;
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleComplete = async () => {
        setError('');
        let finalRows = [...rows];
        
        // Auto-add current row if it's valid but was not added to the list
        if (currentRow.roles.length > 0 && currentRow.locations.length > 0) {
            const isAlreadyAdded = rows.some(r => 
                JSON.stringify([...r.roles].sort()) === JSON.stringify([...currentRow.roles].sort()) && 
                JSON.stringify([...r.locations].sort()) === JSON.stringify([...currentRow.locations].sort())
            );
            if (!isAlreadyAdded) {
                finalRows.push({ ...currentRow, id: Date.now().toString() });
            }
        }

        if (finalRows.length === 0) {
             setError('Please add at least one search configuration to your radar.');
             return;
        }

        if (!apifyKey?.trim()) {
            setError('Apify API Key is required to power the search engine.');
            return;
        }

        setLoading(true);
        try {
            const token = await user.getIdToken();
            const response = await api.post('/user/preferences', {
                apifyKey: apifyKey.trim(),
                preferences: { 
                    preferenceSets: finalRows,
                    resumeText: resumeText.trim()
                },
                onboardingRequired: false,
                isEnabled: true
            }, {
                headers: { 
                    Authorization: `Bearer ${token}` 
                },
                timeout: 30000 // 30 second timeout as suggested by Claude
            });

            if (response.status === 200) {
                navigate('/dashboard');
            } else {
                throw new Error('Unexpected response from server');
            }
        } catch (err) {
            console.error('Onboarding error:', err);
            let msg = 'Mission failure: Could not activate satellite feed.';
            if (err.response?.data?.error) {
                msg += ` ${err.response.data.error}`;
            } else if (err.code === 'ECONNABORTED') {
                msg += ' Connection timed out. Please try again.';
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-6 pb-20">
            <div className="w-full space-y-12 relative z-10">
                <header className="text-center space-y-4">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-cyan-400 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/20 mb-8"
                    >
                        <Zap size={40} className="text-white" fill="white" />
                    </motion.div>
                    <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter transition-colors">Radar <span className="text-blue-500">Configuration</span></h1>
                    <p className="text-slate-500 text-lg font-medium max-w-xl mx-auto">
                        Define your target internship parameters. Each set creates a distinct search pattern.
                    </p>
                </header>

                <AnimatePresence>
                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4"
                        >
                            <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
                            <p className="text-red-200 font-medium">{error}</p>
                        </motion.div>
                    )}
                    {success && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-start gap-4"
                        >
                            <CheckCircle2 size={24} className="text-green-500 shrink-0 mt-0.5" />
                            <p className="text-green-200 font-medium">{success}</p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Master Config */}
                <div className="glass-panel p-10 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 relative transition-colors shadow-xl dark:shadow-none">
                    <div className="space-y-8">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 transition-colors">
                            <Shield className="text-blue-500" />
                            Master Configuration
                        </h2>
                        
                        <form onSubmit={(e) => { e.preventDefault(); handleSyncConfig(); }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Accessibility: Password forms should have a username field */}
                            <input 
                                type="text" 
                                name="username" 
                                autoComplete="username" 
                                value={user?.email || ''} 
                                readOnly 
                                className="hidden" 
                            />
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Apify API Key</label>
                                <div className="relative">
                                    <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                    <input 
                                        type="password"
                                        placeholder="apify_api_..."
                                        className="input-field pl-12 h-[56px] font-bold"
                                        value={apifyKey}
                                        onChange={(e) => setApifyKey(e.target.value)}
                                        autoComplete="current-password"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-600 pl-2">Required for the search pulse engine.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Filtering Keywords (Resume)</label>
                                <div className="relative">
                                    <Edit3 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                    <input 
                                        type="text"
                                        placeholder="Python, React, AWS..."
                                        className="input-field pl-12 h-[56px] font-bold"
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                    />
                                </div>
                                <p className="text-[9px] text-slate-600 pl-2">Helps focus the radar results.</p>
                            </div>

                            <div className="md:col-span-2 flex justify-end pt-4 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 h-12 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded-xl text-blue-400 text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all disabled:opacity-50"
                                >
                                    {loading ? 'Syncing...' : (
                                        <>
                                            <Zap size={14} className="fill-blue-400" />
                                            Sync Satellite Configuration
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="glass-panel p-10 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5 relative transition-colors shadow-xl dark:shadow-none">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 transition-colors">
                                {isEditing ? <Edit3 className="text-blue-500" /> : <Plus className="text-blue-500" />}
                                {isEditing ? 'Editing Preference Set' : 'Define New Preference Set'}
                            </h2>
                            {isEditing && (
                                <button 
                                    onClick={() => {
                                        setIsEditing(null);
                                        setCurrentRow({ roles: [], workTypes: [], locations: [], interval: '12hr', lookback: '7 days', enabled: true });
                                    }}
                                    className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2"
                                >
                                    Cancel Edit <X size={14} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Internship Roles</label>
                                <MultiSelect 
                                    options={ROLES} 
                                    selected={currentRow.roles}
                                    onChange={(v) => setCurrentRow({...currentRow, roles: v})}
                                    placeholder="Select Roles"
                                    icon={Briefcase}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Work Preference</label>
                                <MultiSelect 
                                    options={WORK_PREFERENCES} 
                                    selected={currentRow.workTypes}
                                    onChange={(v) => setCurrentRow({...currentRow, workTypes: v})}
                                    placeholder="Remote, On-site..."
                                    icon={Globe}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Locations</label>
                            <MultiSelect 
                                options={COUNTRIES} 
                                selected={currentRow.locations}
                                onChange={(v) => setCurrentRow({...currentRow, locations: v})}
                                placeholder="Global, India, or specific countries"
                                icon={Search}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Time Interval</label>
                                <div className="relative">
                                    <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                    <select 
                                        className="input-field pl-12 appearance-none h-[56px] font-bold cursor-pointer transition-all hover:border-blue-500/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                        value={currentRow.interval}
                                        onChange={(e) => setCurrentRow({...currentRow, interval: e.target.value})}
                                    >
                                        {TIME_INTERVALS.map(t => <option key={t} value={t}>{t} Scan Rate</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-2">Scrape History (Lookback)</label>
                                <div className="relative">
                                    <Shield size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500" />
                                    <select 
                                        className="input-field pl-12 appearance-none h-[56px] font-bold cursor-pointer transition-all hover:border-blue-500/30 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                                        value={currentRow.lookback}
                                        onChange={(e) => setCurrentRow({...currentRow, lookback: e.target.value})}
                                    >
                                        {LOOKBACK_OPTIONS.map(l => <option key={l} value={l}>Last {l}</option>)}
                                    </select>
                                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={addOrUpdateRow}
                            disabled={currentRow.roles.length === 0 || currentRow.locations.length === 0}
                            className="w-full btn-primary py-5 rounded-2xl flex items-center justify-center gap-3 shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed group transition-all"
                        >
                            <Plus size={20} className={isEditing ? 'rotate-90' : 'group-hover:rotate-90 transition-transform'} />
                            <span className="font-black uppercase tracking-widest text-xs">
                                {isEditing ? 'Update Configuration' : 'Add Preference Row'}
                            </span>
                        </button>
                    </div>

                    <AnimatePresence>
                        {rows.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="mt-12 pt-12 border-t border-white/5 space-y-4"
                            >
                                <h3 className="text-sm font-black text-slate-600 uppercase tracking-[0.2em] mb-6">Your Search Patterns</h3>
                                {rows.map((row) => (
                                    <motion.div 
                                        key={row.id}
                                        className={`flex flex-col md:flex-row items-center gap-6 p-6 rounded-3xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] transition-all ${row.enabled ? 'border-blue-500/20' : 'opacity-60 grayscale'}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {row.roles.map(r => <span key={r} className="text-[9px] font-black text-white bg-blue-600/20 px-2 py-0.5 rounded border border-blue-500/20 uppercase">{r}</span>)}
                                            </div>
                                            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">
                                                {row.locations.slice(0, 3).join(', ')}{row.locations.length > 3 && ` +${row.locations.length - 3} more`}
                                            </p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                                                {row.workTypes.join(' • ')}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-right pr-4 border-r border-slate-200 dark:border-white/5 hidden md:block">
                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Interval</p>
                                                <p className="text-slate-900 dark:text-white font-black text-xs transition-colors">{row.interval}</p>
                                            </div>
                                            <button 
                                                onClick={() => editRow(row)}
                                                className="p-3 bg-slate-200 dark:bg-white/5 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-300 dark:hover:bg-white/10 transition-all"
                                                title="Edit Row"
                                            >
                                                <Edit3 size={18} />
                                            </button>
                                            <button 
                                                onClick={() => toggleRowEnabled(row.id)}
                                                className={`p-3 rounded-xl transition-all ${row.enabled ? 'bg-blue-600/10 text-blue-400' : 'bg-slate-800 text-slate-500'}`}
                                                title={row.enabled ? "Enable State (Receiving Mails)" : "Disable State (Mails Muted)"}
                                            >
                                                {row.enabled ? <Mail size={18} /> : <BellOff size={18} />}
                                            </button>
                                            <button 
                                                onClick={() => deleteRow(row.id)}
                                                className="p-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center justify-end">
                    <button 
                        onClick={handleComplete}
                        disabled={loading}
                        className="btn-primary px-12 py-5 rounded-2xl flex items-center gap-3 hover:scale-105 transition-all shadow-blue-500/40 disabled:opacity-50 disabled:grayscale"
                    >
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Shield size={20} />}
                        <span className="font-black uppercase tracking-widest text-sm">
                            {loading ? 'Transmitting...' : 'Activate Satellite Feed'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
