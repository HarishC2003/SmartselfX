import React, { useState, useEffect, useRef } from 'react';
import { User, Lock, Bell, Settings as SettingsIcon, Building, Save, Eye, EyeOff, Upload, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../services/authService';
import toast from 'react-hot-toast';
import EmptyState from '../../components/ui/EmptyState';

// Format Date Utility
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

// ==========================================
// SECTIONS COMPONENTS
// ==========================================

const SectionProfile = ({ profile, setProfile, onSave, loading }) => {
    return (
        <div className="w-full bg-surface border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><User className="text-indigo-400" /> My Profile</h2>
            
            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-slate-700/50">
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-3xl font-bold text-white uppercase overflow-hidden">
                        {profile?.name ? profile.name.slice(0, 2) : 'U'}
                    </div>
                    <button className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold rounded-full text-white transition-opacity">
                        Change Photo
                    </button>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{profile.name || 'User'}</h3>
                    <span className="inline-block px-2 py-0.5 mt-1 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest">
                        {profile.role || 'GUEST'}
                    </span>
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                        <p>Last Login: {profile.lastLogin ? formatDate(profile.lastLogin) : 'Never'}</p>
                        <p>Account created: {profile.createdAt ? formatDate(profile.createdAt) : 'Unknown'}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full Name *</label>
                    <input type="text" value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Email (Read-only)</label>
                    <div className="relative">
                        <input type="email" value={profile.email || ''} readOnly className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-500 cursor-not-allowed" />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded">Contact admin to change</span>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Phone</label>
                    <input type="text" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Add phone number" />
                </div>
            </div>

            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-slate-700/50">
                <button onClick={onSave} disabled={loading || !profile.name} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors">
                    <Save className="w-4 h-4" /> Save Changes
                </button>
                {profile.isEmailVerified ? (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full"><CheckCircle className="w-3.5 h-3.5" /> Email Verified</span>
                ) : (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-full"><AlertTriangle className="w-3.5 h-3.5" /> Unverified <button className="ml-1 underline">Resend</button></span>
                )}
            </div>
        </div>
    );
};

const SectionPassword = () => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [showObj, setShowObj] = useState({});
    const [loading, setLoading] = useState(false);
    
    // Live validation
    const p = form.newPassword;
    const checks = {
        length: p.length >= 8,
        upper: /[A-Z]/.test(p),
        number: /[0-9]/.test(p),
        special: /[^A-Za-z0-9]/.test(p)
    };

    const handleSave = async () => {
        if (!checks.length || !checks.upper || !checks.number || !checks.special) return toast.error('Password does not meet requirements');
        if (form.newPassword !== form.confirmPassword) return toast.error('Passwords do not match');
        
        setLoading(true);
        try {
            await api.put('/settings/password', form);
            toast.success('Password changed. Please log in again.');
            setTimeout(() => window.location.href = '/login', 2000);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to change password');
        }
        setLoading(false);
    };

    return (
        <div className="w-full bg-surface border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2"><Lock className="text-amber-400" /> Change Password</h2>
            <p className="text-amber-400 text-xs font-medium bg-amber-500/10 px-3 py-2 rounded-lg mb-8 border border-amber-500/20 inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> You will be logged out and need to sign in again after changing your password.
            </p>

            <div className="space-y-5">
                {[
                    { key: 'currentPassword', label: 'Current Password' },
                    { key: 'newPassword', label: 'New Password' },
                    { key: 'confirmPassword', label: 'Confirm New Password' }
                ].map(f => (
                    <div key={f.key}>
                        <label className="block text-sm font-medium text-slate-300 mb-2">{f.label}</label>
                        <div className="relative">
                            <input 
                                type={showObj[f.key] ? 'text' : 'password'} 
                                value={form[f.key]} 
                                onChange={e => setForm({...form, [f.key]: e.target.value})}
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white pr-12 focus:ring-2 focus:ring-amber-500 outline-none" 
                            />
                            <button onClick={() => setShowObj({...showObj, [f.key]: !showObj[f.key]})} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                                {showObj[f.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Password Requirements</p>
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={`w-4 h-4 ${checks.length ? 'text-emerald-500' : 'text-slate-600'}`} /> <span className={checks.length ? 'text-slate-300' : 'text-slate-500'}>At least 8 characters</span></div>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={`w-4 h-4 ${checks.upper ? 'text-emerald-500' : 'text-slate-600'}`} /> <span className={checks.upper ? 'text-slate-300' : 'text-slate-500'}>Uppercase letter</span></div>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={`w-4 h-4 ${checks.number ? 'text-emerald-500' : 'text-slate-600'}`} /> <span className={checks.number ? 'text-slate-300' : 'text-slate-500'}>Number</span></div>
                    <div className="flex items-center gap-2 text-sm"><CheckCircle className={`w-4 h-4 ${checks.special ? 'text-emerald-500' : 'text-slate-600'}`} /> <span className={checks.special ? 'text-slate-300' : 'text-slate-500'}>Special character</span></div>
                </div>
            </div>

            <button onClick={handleSave} disabled={loading} className="mt-8 px-6 py-2.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-500 disabled:opacity-50 transition-colors">
                {loading ? 'Processing...' : 'Change Password'}
            </button>
        </div>
    );
};

const SectionNotifications = ({ profile, setProfile, onSave, loading }) => {
    // Extract preferences deeply
    const prefs = profile.preferences || {};
    const notifs = prefs.notifications || {
        email: { lowStock: true, outOfStock: true, poUpdates: true, weeklyReport: true, dailySummary: false },
        inApp: { allAlerts: true, poUpdates: true, forecastRisk: true },
        alertThreshold: 'ALL'
    };

    const toggleNested = (parent, key) => {
        const updated = { ...profile, preferences: { ...prefs, notifications: { ...notifs, [parent]: { ...notifs[parent], [key]: !notifs[parent][key] } } } };
        setProfile(updated);
    };
    const setThreshold = (val) => {
        const updated = { ...profile, preferences: { ...prefs, notifications: { ...notifs, alertThreshold: val } } };
        setProfile(updated);
    };

    const ToggleRow = ({ label, checked, onChange }) => (
        <div className="flex items-center justify-between p-3 py-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <span className="text-sm font-medium text-slate-300">{label}</span>
            <button onClick={onChange} className={`relative w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-5' : ''}`} />
            </button>
        </div>
    );

    return (
        <div className="w-full bg-surface border border-slate-700/50 rounded-2xl p-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><Bell className="text-emerald-400" /> Notification Preferences</h2>
            
            <div className="space-y-8">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Email Notifications</h3>
                    <div className="space-y-3">
                        <ToggleRow label="Low stock alerts" checked={notifs.email?.lowStock} onChange={() => toggleNested('email', 'lowStock')} />
                        <ToggleRow label="Out of stock alerts" checked={notifs.email?.outOfStock} onChange={() => toggleNested('email', 'outOfStock')} />
                        <ToggleRow label="Purchase order updates" checked={notifs.email?.poUpdates} onChange={() => toggleNested('email', 'poUpdates')} />
                        <ToggleRow label="Weekly inventory report" checked={notifs.email?.weeklyReport} onChange={() => toggleNested('email', 'weeklyReport')} />
                        <ToggleRow label="Daily summary email" checked={notifs.email?.dailySummary} onChange={() => toggleNested('email', 'dailySummary')} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">In-App Notifications</h3>
                    <div className="space-y-3">
                        <ToggleRow label="Alert bell (all configured alerts)" checked={notifs.inApp?.allAlerts} onChange={() => toggleNested('inApp', 'allAlerts')} />
                        <ToggleRow label="PO status changes" checked={notifs.inApp?.poUpdates} onChange={() => toggleNested('inApp', 'poUpdates')} />
                        <ToggleRow label="Forecast risk changes" checked={notifs.inApp?.forecastRisk} onChange={() => toggleNested('inApp', 'forecastRisk')} />
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Alert Threshold</h3>
                    <div className="flex gap-4">
                        {['ALL', 'HIGH_ONLY', 'CRITICAL_ONLY'].map(lvl => (
                            <label key={lvl} className={`flex-1 flex items-center justify-center p-3 border rounded-xl cursor-pointer transition-colors ${notifs.alertThreshold === lvl ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 font-semibold' : 'border-slate-700 text-slate-400 hover:bg-slate-800'}`}>
                                <input type="radio" className="hidden" checked={notifs.alertThreshold === lvl} onChange={() => setThreshold(lvl)} />
                                {lvl.replace('_', ' ')}
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <button onClick={onSave} disabled={loading} className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-500 disabled:opacity-50 transition-colors">
                <Save className="w-4 h-4" /> Save Preferences
            </button>
        </div>
    );
};

const SectionSystemSettings = ({ sysSettings, setSysSettings, onSaveGlobal, loading }) => {
    if(!sysSettings.inventory) return <div className="p-8 text-center text-slate-500">Loading System Configuration...</div>;
    const { inventory, forecast, security } = sysSettings;

    const InputRow = ({ label, desc, parent, fKey, type = 'number', addon }) => (
        <div className="flex items-center justify-between p-4 bg-slate-900/50 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
            <div className="pr-4">
                <span className="block text-sm font-medium text-slate-200 mb-0.5">{label}</span>
                {desc && <span className="block text-xs text-slate-500">{desc}</span>}
            </div>
            {type === 'toggle' ? (
                <button onClick={() => setSysSettings({ ...sysSettings, [parent]: { ...sysSettings[parent], [fKey]: !sysSettings[parent][fKey] }})} className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${sysSettings[parent][fKey] ? 'bg-cyan-500' : 'bg-slate-700'}`}>
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${sysSettings[parent][fKey] ? 'translate-x-6' : ''}`} />
                </button>
            ) : type === 'radio' ? (
                <div className="flex bg-slate-800 rounded-lg p-1 shrink-0 border border-slate-700">
                    <button onClick={() => setSysSettings({ ...sysSettings, [parent]: { ...sysSettings[parent], [fKey]: 'LOW_STOCK' }})} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${sysSettings[parent][fKey] === 'LOW_STOCK' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Low Stock</button>
                    <button onClick={() => setSysSettings({ ...sysSettings, [parent]: { ...sysSettings[parent], [fKey]: 'OUT_OF_STOCK' }})} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${sysSettings[parent][fKey] === 'OUT_OF_STOCK' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}>Out of Stock</button>
                </div>
            ) : type === 'slider' ? (
                <div className="w-48 shrink-0 flex items-center gap-3">
                    <input type="range" min="80" max="99" value={sysSettings[parent][fKey]} onChange={e => setSysSettings({ ...sysSettings, [parent]: { ...sysSettings[parent], [fKey]: Number(e.target.value) }})} className="flex-1 accent-cyan-500" />
                    <span className="text-xs font-bold font-mono text-cyan-400 w-8">{sysSettings[parent][fKey]}%</span>
                </div>
            ) : (
                <div className="relative shrink-0">
                    <input type="number" value={sysSettings[parent][fKey] || ''} onChange={e => setSysSettings({ ...sysSettings, [parent]: { ...sysSettings[parent], [fKey]: Number(e.target.value) }})} className="w-28 text-right bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500" />
                    {addon && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">{addon}</span>}
                </div>
            )}
        </div>
    );

    return (
        <div className="w-full bg-surface border border-slate-700/50 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><SettingsIcon className="text-cyan-400" /> System Settings (Global Config)</h2>
            
            <div className="space-y-8">
                <div className="border border-slate-700/50 md:rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inventory Settings</h3>
                    </div>
                    <InputRow label="Default Lead Time" parent="inventory" fKey="defaultLeadTimeDays" addon="days" />
                    <InputRow label="Default Reorder Buffer" desc="Multiplier for minimum restock calculation (e.g. 1.2 = +20%)" parent="inventory" fKey="defaultReorderBuffer" type="number" />
                    <InputRow label="Auto-Restock" desc="Automatically create Draft POs when stock runs dangerously low" parent="inventory" fKey="autoRestockEnabled" type="toggle" />
                    <InputRow label="Auto-Restock Trigger" parent="inventory" fKey="autoRestockThreshold" type="radio" />
                    <InputRow label="Low Stock Notifications" parent="inventory" fKey="lowStockNotifyEnabled" type="toggle" />
                    <InputRow label="Expiry Alert Days" desc="Alert X days before batch expiration" parent="inventory" fKey="expiryAlertDays" addon="days" />
                </div>

                <div className="border border-slate-700/50 md:rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Forecast Settings</h3>
                    </div>
                    <InputRow label="Default Forecast Horizon" parent="forecast" fKey="defaultForecastDays" addon="days" />
                    <InputRow label="Min Data Points Required" parent="forecast" fKey="minDataPointsRequired" addon="pts" />
                    <InputRow label="Service Level %" desc={`Controls Safety Stock (Z-score: ${Math.abs((forecast.serviceLevelPercent - 50) * 0.05).toFixed(2)})`} parent="forecast" fKey="serviceLevelPercent" type="slider" />
                    <InputRow label="Auto-Forecast on Transaction" desc="Recalculate AI demand immediately after large stock events" parent="forecast" fKey="autoForecastEnabled" type="toggle" />
                </div>

                <div className="border border-slate-700/50 md:rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-slate-800/80 px-4 py-3 border-b border-slate-700 flex flex-col justify-center">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Security Settings</h3>
                    </div>
                    <InputRow label="Session Timeout" parent="security" fKey="sessionTimeoutMinutes" addon="mins" />
                    <InputRow label="Max Login Attempts" desc="Before triggering lockout" parent="security" fKey="maxLoginAttempts" addon="fails" />
                    <InputRow label="Lockout Duration" parent="security" fKey="lockoutDurationMinutes" addon="mins" />
                    <InputRow label="Require Email Verification" parent="security" fKey="requireEmailVerification" type="toggle" />
                    <InputRow label="Allow Vendor Self-Register" parent="security" fKey="allowVendorSelfRegister" type="toggle" />
                    <InputRow label="Audit Log Retention" desc="Logs older than this will be auto-deleted" parent="security" fKey="auditLogRetentionDays" addon="days" />
                </div>
            </div>

            <div className="sticky bottom-4 z-10 mt-8">
                <div className="bg-slate-800/90 backdrop-blur-md rounded-xl p-4 flex items-center justify-between border border-cyan-500/30 shadow-2xl">
                    <span className="text-sm font-medium text-slate-300">Click to apply global configurations securely.</span>
                    <button onClick={onSaveGlobal} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-500 transition-colors">
                        <Save className="w-4 h-4" /> Save All Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

const SectionCompanySettings = ({ sysSettings, setSysSettings, onSaveGlobal, loading }) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);
    
    if(!sysSettings.company) return null;
    const { company, notifications } = sysSettings;

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('logo', file);
        try {
            const { data } = await api.post('/settings/logo', fd);
            setSysSettings({ ...sysSettings, company: { ...company, logo: data.logoUrl } });
            toast.success('Company logo updated securely');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to upload logo');
        }
        setUploading(false);
    };

    return (
        <div className="w-full bg-surface border border-slate-700/50 rounded-2xl p-8 mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-8"><Building className="text-pink-400" /> Company Identity</h2>

            <div className="mb-8 p-6 bg-slate-900 border border-slate-700/50 rounded-2xl flex items-center gap-8">
                <div className="w-24 h-24 bg-background border border-slate-700 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative group">
                    {company.logo ? (
                        <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || ''}${company.logo}`} alt="Logo" className="w-full h-full object-contain p-2" />
                    ) : (
                        <Building className="w-8 h-8 text-slate-600" />
                    )}
                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Upload className="w-5 h-5 text-white mb-1" />
                        <span className="text-[10px] uppercase font-bold text-white tracking-widest">Change</span>
                    </button>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-300 mb-2">Company Logo</h3>
                    <p className="text-xs text-slate-500 mb-4">Upload a high-res (max 1MB). Transparent background PNG prioritized for sidebar display.</p>
                    <div className="flex gap-3">
                        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-4 py-2 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-700 border border-slate-600 transition">Upload Select</button>
                        {company.logo && <button onClick={() => setSysSettings({...sysSettings, company: {...company, logo: null}})} className="px-4 py-2 bg-transparent text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg transition">Remove</button>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".jpg,.jpeg,.png,.webp" onChange={handleLogoUpload} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-8">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company Name</label>
                    <input type="text" value={company.name} onChange={e => setSysSettings({...sysSettings, company: {...company, name: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Currency Code</label>
                    <input type="text" maxLength={3} value={company.currency} onChange={e => setSysSettings({...sysSettings, company: {...company, currency: e.target.value.toUpperCase()}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Currency Symbol</label>
                    <input type="text" value={company.currencySymbol} onChange={e => setSysSettings({...sysSettings, company: {...company, currencySymbol: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">System Timezone</label>
                    <input type="text" value={company.timezone} onChange={e => setSysSettings({...sysSettings, company: {...company, timezone: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" placeholder="e.g. Asia/Kolkata" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date Format</label>
                    <select value={company.dateFormat} onChange={e => setSysSettings({...sysSettings, company: {...company, dateFormat: e.target.value}})} className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500">
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                </div>
            </div>

            <div className="pt-8 border-t border-slate-700/50">
                <h3 className="text-sm font-medium text-slate-300 mb-4">Weekly Report Schedule (Cron Target)</h3>
                <div className="flex gap-4">
                    <select value={notifications.weeklyReportDay} onChange={e => setSysSettings({...sysSettings, notifications: {...notifications, weeklyReportDay: Number(e.target.value)}})} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500">
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                    <input type="time" value={notifications.weeklyReportTime} onChange={e => setSysSettings({...sysSettings, notifications: {...notifications, weeklyReportTime: e.target.value}})} className="w-40 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white outline-none focus:border-pink-500" />
                </div>
            </div>

            <button onClick={onSaveGlobal} disabled={loading} className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-pink-600 text-white rounded-lg font-semibold hover:bg-pink-500 transition-colors">
                <Save className="w-4 h-4" /> Apply Company Configurations
            </button>
        </div>
    );
};

// Removed Audit Log and System Health as they have dedicated pages

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
const SettingsPage = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [globalLoading, setGlobalLoading] = useState(false);

    // Profile State (Holds profile + prefs)
    const [profile, setProfile] = useState({});
    
    // Global System State
    const [sysSettings, setSysSettings] = useState({});

    useEffect(() => {
        fetchProfile();
        if (user?.role === 'ADMIN') {
            fetchSystemSettings();
        }
    }, [user?.role]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/settings/profile');
            setProfile(data.user);
        } catch (e) { toast.error('Failed to load profile'); }
        setLoading(false);
    };

    const fetchSystemSettings = async () => {
        try {
            const { data } = await api.get('/settings');
            setSysSettings(data.settings);
        } catch (e) { toast.error('Failed to load system config'); }
    };

    const handleSaveProfile = async () => {
        setGlobalLoading(true);
        try {
            const payload = { 
                name: profile.name, 
                phone: profile.phone, 
                preferences: profile.preferences 
            };
            await api.put('/settings/profile', payload);
            toast.success('Profile and preferences saved.');
        } catch (e) { toast.error(e.response?.data?.message || 'Save failed'); }
        setGlobalLoading(false);
    };

    const handleSaveGlobal = async () => {
        setGlobalLoading(true);
        try {
            await api.put('/settings', sysSettings);
            toast.success('Global System configurations locked and saved.');
        } catch (e) { toast.error(e.response?.data?.message || 'Global settings save failed.'); }
        setGlobalLoading(false);
    };

    // Construct Menu
    const menuItems = [
        { id: 'profile', label: 'My Profile', icon: User, color: 'text-indigo-400' },
        { id: 'password', label: 'Change Password', icon: Lock, color: 'text-amber-400' },
        { id: 'notifications', label: 'Notification Preferences', icon: Bell, color: 'text-emerald-400' }
    ];
    if (user?.role === 'ADMIN') {
        menuItems.push(
            { id: 'divider1', type: 'divider' },
            { id: 'system', label: 'System Configurations', icon: SettingsIcon, color: 'text-cyan-400' },
            { id: 'company', label: 'Company Profile', icon: Building, color: 'text-pink-400' }
        );
    }

    return (
        <div className="p-6 md:p-8 w-full space-y-6">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a1f3a] via-[#1e2746] to-[#162033] border border-white/[0.06] p-8">
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px'
                }} />
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                <div className="relative">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Settings</h1>
                    <p className="text-slate-400 mt-1.5 text-sm">Manage your account, preferences, and system configuration.</p>
                </div>
            </div>

            {/* ── Horizontal Tab Navigation ── */}
            <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar -mx-1 px-1">
                {menuItems.map(item => {
                    if (item.type === 'divider') return <div key={item.id} className="w-px bg-white/[0.08] mx-1 my-2 shrink-0" />;
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 border ${
                                isActive
                                ? 'bg-white/[0.07] border-white/[0.12] text-white shadow-lg shadow-black/10'
                                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                            }`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? item.color : 'text-slate-500 group-hover:text-slate-400'} transition-colors`} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ── Active Section Content ── */}
            <div key={activeTab} className="animate-in fade-in duration-300">
                {activeTab === 'profile' && <SectionProfile profile={profile} setProfile={setProfile} onSave={handleSaveProfile} loading={globalLoading} />}
                {activeTab === 'password' && <SectionPassword />}
                {activeTab === 'notifications' && <SectionNotifications profile={profile} setProfile={setProfile} onSave={handleSaveProfile} loading={globalLoading} />}
                {activeTab === 'system' && user?.role === 'ADMIN' && <SectionSystemSettings sysSettings={sysSettings} setSysSettings={setSysSettings} onSaveGlobal={handleSaveGlobal} loading={globalLoading} />}
                {activeTab === 'company' && user?.role === 'ADMIN' && <SectionCompanySettings sysSettings={sysSettings} setSysSettings={setSysSettings} onSaveGlobal={handleSaveGlobal} loading={globalLoading} />}
            </div>
        </div>
    );
};

export default SettingsPage;
