import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, AlertTriangle, Upload, CheckCircle2, X, Search, Loader2, Laptop, Clock, Lock, ShieldCheck, Download, Eye, GraduationCap, Link2, Palette, Globe, Smartphone, Monitor } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function SettingsPage({ user, onProfileUpdate, setUser }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [theme, setTheme] = useState(document.documentElement.classList.contains("light") ? "light" : "dark");
    const fileInputRef = useRef(null);
    
    // Theme effect
    useEffect(() => {
        if (theme === "light") {
            document.documentElement.classList.add("light");
        } else {
            document.documentElement.classList.remove("light");
        }
    }, [theme]);

    // Profile State
    const [formData, setFormData] = useState({
        id: user?.id || "",
        full_name: user?.user_metadata?.full_name || "",
        university: user?.user_metadata?.university || "",
        course: user?.user_metadata?.course || "",
        bio: user?.user_metadata?.bio || "",
        avatar_url: user?.user_metadata?.avatar_url || ""
    });

    useEffect(() => {
        // Only update local form if NOT actively editing 
        // We also check if we have a user and if the IDs match
        const hasData = user?.id === formData.id; // Check if we are already synced with this user
        
        if (user && (!isEditing || !hasData)) {
            setFormData({
                id: user.id,
                full_name: user.user_metadata?.full_name || "",
                university: user.user_metadata?.university || "",
                course: user.user_metadata?.course || "",
                bio: user.user_metadata?.bio || "",
                avatar_url: user.user_metadata?.avatar_url || ""
            });
            // If ID changed, we are not editing the new user yet
            if (user.id !== formData.id) setIsEditing(false);
        }
    }, [user, isEditing, formData.id]);

    const debounceRef = useRef(null);
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setIsEditing(true);
        setFormData(prev => ({ ...prev, [name]: value }));

        // Real-time preview (debounced to prevent lag)
        if (setUser && user) {
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                setUser(prev => ({
                    ...prev,
                    user_metadata: {
                        ...prev.user_metadata,
                        [name]: value
                    }
                }));
            }, 300); // 300ms debounce
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            const isTempUrl = formData.avatar_url?.startsWith('blob:');
            const finalAvatarUrl = isTempUrl ? (user.user_metadata?.avatar_url || "") : formData.avatar_url;

            console.log("Saving Profile Data:", { ...formData, avatar_url: finalAvatarUrl });

            // 1. Update Database (Source of Truth)
            const { error: dbError } = await supabase
                .from('profiles')
                .update({
                    full_name: formData.full_name,
                    university: formData.university,
                    course: formData.course,
                    bio: formData.bio,
                    avatar_url: finalAvatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (dbError) throw dbError;

            // 2. Clear editing lock and trigger local success early
            setIsEditing(false);
            if (window.showToast) window.showToast("Changes saved successfully!");

            // 3. Background Auth update (don't block UI)
            supabase.auth.updateUser({
                data: {
                    full_name: formData.full_name,
                    university: formData.university,
                    course: formData.course,
                    bio: formData.bio,
                    avatar_url: finalAvatarUrl
                }
            }).then(({ error }) => {
                if (error) console.error("Auth metadata update failed:", error);
            });

            if (onProfileUpdate) onProfileUpdate();
        } catch (error) {
            console.error("Critical Save Error:", error);
            if (window.showToast) window.showToast(error.message || "Failed to save data. Please check connection.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        // 1. Instant Preview (Optimistic UI)
        const localUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, avatar_url: localUrl }));
        if (setUser) {
            setUser(prev => ({
                ...prev,
                user_metadata: { ...prev.user_metadata, avatar_url: localUrl }
            }));
        }

        setIsUploadingAvatar(true);
        try {
            // 2. Optimization: Client-side resize (Target: 256x256)
            // Even if the file is 61kb, we normalize it for maximum speed
            const optimizedBlob = await new Promise((resolve) => {
                const img = new Image();
                img.src = localUrl;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const size = 256;
                    canvas.width = size;
                    canvas.height = size;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, size, size);
                    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85);
                };
            });

            const fileName = `${user.id}_${Date.now()}.jpg`;
            const filePath = fileName;

            // 3. Background Upload
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, optimizedBlob);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 4. Parallelize Profile & Auth Update
            const profilePromise = supabase
                .from('profiles')
                .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
                .eq('id', user.id);

            const authPromise = supabase.auth.updateUser({
                data: { avatar_url: publicUrl }
            });

            await Promise.all([profilePromise, authPromise]);

            // 5. Finalize UI State
            setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
            if (setUser) {
                setUser(prev => ({
                    ...prev,
                    user_metadata: { ...prev.user_metadata, avatar_url: publicUrl }
                }));
            }

            if (window.showToast) window.showToast("Avatar updated instantly!");
        } catch (error) {
            console.error("Avatar optimization/upload failed:", error);
            if (window.showToast) window.showToast("Speed-up upload failed, reverting...", "error");
            if (onProfileUpdate) onProfileUpdate(); 
        } finally {
            setIsUploadingAvatar(false);
            URL.revokeObjectURL(localUrl);
        }
    };

    const displayName = formData.full_name || user?.email?.split("@")[0] || "Scholar";
    const avatarLetter = displayName[0]?.toUpperCase() || "U";

    const tabGroups = [
        {
            title: "Personal",
            tabs: [
                { id: "profile", label: "Profile Information", icon: User },
                { id: "academic", label: "Study Preferences", icon: GraduationCap },
            ]
        },
        {
            title: "Security & Access",
            tabs: [
                { id: "account", label: "Password & Security", icon: Shield },
                { id: "privacy", label: "Privacy & Visibility", icon: Eye },
                { id: "integrations", label: "Linked Accounts", icon: Link2 },
            ]
        },
        {
            title: "Preferences",
            tabs: [
                { id: "notifications", label: "Notification Settings", icon: Bell },
                { id: "appearance", label: "Interface & Display", icon: Palette },
                { id: "language", label: "Language & Region", icon: Globe },
            ]
        },
        {
            title: "Account Actions",
            tabs: [
                { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
            ]
        }
    ];

    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={onChange}
            className={`w-12 h-6 rounded-full p-1 transition-colors relative ${checked ? 'bg-primary' : 'bg-surface-2 border border-border'}`}
        >
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    );

    return (
        <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-background relative z-10">
            {/* Header/Title hidden on desktop since sidebar covers it conceptually */}
            <div className="md:hidden p-6 border-b border-border bg-surface shrink-0">
                <h1 className="text-2xl font-heading font-extrabold text-text-main">Settings</h1>
            </div>

            {/* Left Tabs Menu */}
            <div className="w-full md:w-72 border-r border-border bg-surface shrink-0 p-6 overflow-y-auto">
                <h2 className="hidden md:block text-2xl font-heading font-extrabold text-text-main mb-8 tracking-tight">Settings</h2>
                
                <div className="relative mb-6 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors pointer-events-none" />
                    <input 
                        id="unrelated-search-input"
                        name="random-search-id"
                        type="text"
                        autoComplete="off"
                        readOnly={true}
                        onFocus={(e) => e.target.readOnly = false}
                        placeholder="Search settings..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-2 border border-border rounded-xl py-2.5 pl-10 pr-4 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                    />
                </div>

                <nav className="space-y-6 flex flex-col pb-4 md:pb-0 scroll-smooth">
                    {tabGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-2">
                            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-widest pl-4 mb-2">{group.title}</h3>
                            <div className="space-y-1">
                                {group.tabs
                                    .filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map(tab => {
                                        const Icon = tab.icon;
                                        const isActive = activeTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${isActive
                                                    ? tab.danger ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(108,99,255,0.05)]'
                                                    : 'text-text-muted hover:bg-surface-2 hover:text-text-main border border-transparent'
                                                    }`}
                                            >
                                                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-primary' : ''}`} />
                                                <span>{tab.label}</span>
                                            </button>
                                        )
                                    })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 shrink-0 relative bg-background pb-20">
                <div className="max-w-3xl">
                    <AnimatePresence mode="wait">

                        {/* PROFILE TAB */}
                        {activeTab === "profile" && (
                            <motion.div
                                key="profile"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Public Profile</h3>
                                    <p className="text-text-muted text-sm">Manage how others see you on the platform.</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-4 border-surface shadow-[0_0_20px_rgba(108,99,255,0.3)] overflow-hidden">
                                            {user?.user_metadata?.avatar_url || formData.avatar_url ? (
                                                <img src={formData.avatar_url || user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                avatarLetter
                                            )}
                                        </div>
                                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                                            <Upload className="w-6 h-6" />
                                            <input 
                                                ref={fileInputRef}
                                                type="file" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleAvatarUpload}
                                                disabled={isSaving}
                                            />
                                        </label>
                                    </div>
                                    <div className="space-y-3">
                                        <button 
                                            className="btn btn-primary gap-2 text-sm px-4 py-2 relative overflow-hidden"
                                            disabled={isUploadingAvatar}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            {isUploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                            {isUploadingAvatar ? "Uploading..." : "Change Avatar"}
                                        </button>
                                        <p className="text-xs text-text-muted">JPG, GIF or PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Display Name</label>
                                        <input 
                                            name="full_name"
                                            type="text" 
                                            className="input-field" 
                                            value={formData.full_name} 
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">University / School</label>
                                        <input 
                                            name="university"
                                            type="text" 
                                            className="input-field" 
                                            placeholder="e.g. Stanford University" 
                                            value={formData.university}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-text-main">Course / Major</label>
                                        <input 
                                            name="course"
                                            type="text" 
                                            className="input-field" 
                                            placeholder="e.g. B.S. Computer Science" 
                                            value={formData.course}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-text-main">Bio</label>
                                        <textarea 
                                            name="bio"
                                            className="input-field min-h-24 resize-y" 
                                            placeholder="Tell us a little about your studies and interests..." 
                                            value={formData.bio}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <button 
                                        className="btn btn-primary px-6 gap-2" 
                                        onClick={handleSaveProfile}
                                        disabled={isSaving || isUploadingAvatar}
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {isSaving ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ACCOUNT TAB */}
                        {activeTab === "account" && (
                            <motion.div
                                key="account"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Account Security</h3>
                                    <p className="text-text-muted text-sm">Manage your login credentials and security settings.</p>
                                </div>

                                <div className="card-premium p-6 border-border bg-surface-2 flex justify-between items-center">
                                    <div>
                                        <p className="text-sm font-bold text-text-main mb-1">Email Address</p>
                                        <p className="text-sm text-text-muted">{user?.email || "user@example.com"}</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-success/10 text-success px-3 py-1 rounded-full border border-success/20">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-xs font-bold">Verified</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                                    {/* PASSWORD CHANGE */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Lock className="w-5 h-5 text-primary" />
                                            <h4 className="font-heading font-bold text-lg">Change Password</h4>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-text-main">Current Password</label>
                                                <input 
                                                    type="password" 
                                                    className="input-field" 
                                                    placeholder="••••••••" 
                                                    name="current-password"
                                                    autoComplete="current-password"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-text-main">New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="input-field" 
                                                    placeholder="••••••••" 
                                                    name="new-password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-bold text-text-main">Confirm New Password</label>
                                                <input 
                                                    type="password" 
                                                    className="input-field" 
                                                    placeholder="••••••••" 
                                                    name="confirm-password"
                                                    autoComplete="new-password"
                                                />
                                            </div>
                                            <button className="btn btn-outline border-primary text-primary hover:bg-primary/10 w-full font-semibold transition-all">Update Password</button>
                                        </div>
                                    </div>

                                    {/* TWO-FACTOR AUTH */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck className="w-5 h-5 text-success" />
                                            <h4 className="font-heading font-bold text-lg">Verification</h4>
                                        </div>
                                        <div className="card-premium p-6 border-border bg-surface-2 flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-bold text-text-main mb-1">Two-Factor Authentication (2FA)</p>
                                                <p className="text-xs text-text-muted">Add an extra layer of security to your account by requiring a code during login.</p>
                                            </div>
                                            <ToggleSwitch checked={false} onChange={() => { }} />
                                        </div>

                                        <div className="card-premium p-6 border-border bg-surface-2">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Download className="w-4 h-4 text-primary" />
                                                <p className="text-sm font-bold text-text-main">Data Export</p>
                                            </div>
                                            <p className="text-xs text-text-muted mb-4">Export your personal data and notes history for archival purposes.</p>
                                            <button className="text-xs font-bold text-primary hover:underline">Download all my data (JSON/CSV)</button>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTIVE SESSIONS */}
                                <div className="mt-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Laptop className="w-5 h-5 text-text-main" />
                                        <h4 className="font-heading font-bold text-lg text-text-main">Active Sessions</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            { device: "MacBook Pro (Chrome)", location: "Chennai, TN", status: "Current session", icon: Laptop },
                                            { device: "iPhone 15 Pro (App)", location: "Chennai, TN", status: "Active 2h ago", icon: Laptop }
                                        ].map((session, i) => (
                                            <div key={i} className="flex items-center justify-between p-4 border border-border rounded-xl hover:bg-surface-2 transition-all group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center border border-border group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                                                        <session.icon className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-text-main">{session.device}</p>
                                                        <p className="text-xs text-text-muted">{session.location}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-bold px-2 py-1 rounded-full ${i === 0 ? 'bg-success/10 text-success border border-success/20' : 'bg-surface border border-border text-text-muted'}`}>
                                                        {session.status}
                                                    </p>
                                                    {i !== 0 && <button className="text-[10px] font-bold text-danger hover:underline mt-1">Revoke Access</button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* LOGIN HISTORY */}
                                <div className="mt-8 space-y-6">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-5 h-5 text-text-main" />
                                        <h4 className="font-heading font-bold text-lg text-text-main">Security Log</h4>
                                    </div>
                                    <div className="overflow-hidden border border-border rounded-xl">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-surface-2 border-b border-border text-text-main uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-3">Event</th>
                                                    <th className="px-4 py-3">Date</th>
                                                    <th className="px-4 py-3">IP Address</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border text-text-muted">
                                                <tr>
                                                    <td className="px-4 py-3 text-text-main font-medium">Logged in</td>
                                                    <td className="px-4 py-3">Mar 18, 2026, 11:15 AM</td>
                                                    <td className="px-4 py-3">122.164.xx.xxx</td>
                                                </tr>
                                                <tr>
                                                    <td className="px-4 py-3 text-text-main font-medium">Profile updated</td>
                                                    <td className="px-4 py-3">Mar 17, 2026, 05:40 PM</td>
                                                    <td className="px-4 py-3">122.164.xx.xxx</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === "notifications" && (
                            <motion.div
                                key="notifications"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Notification Preferences</h3>
                                    <p className="text-text-muted text-sm">Control how and when you want to be notified.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-text-main mb-1">Important Account Alerts</h4>
                                            <p className="text-sm text-text-muted">Security updates, terms changes. Cannot be disabled.</p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-text-main mb-1">Download Notifications</h4>
                                            <p className="text-sm text-text-muted">Get alerted when someone downloads your notes.</p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-text-main mb-1">Weekly Digest</h4>
                                            <p className="text-sm text-text-muted">An email summary of your account's weekly performance.</p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-text-main mb-1">New Features & Promotions</h4>
                                            <p className="text-sm text-text-muted">Updates about new platform features.</p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => { }} />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <button className="btn btn-primary px-6">Save Preferences</button>
                                </div>
                            </motion.div>
                        )}

                        {/* ACADEMIC PREFERENCES */}
                        {activeTab === "academic" && (
                            <motion.div key="academic" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Study Preferences</h3>
                                    <p className="text-text-muted text-sm">Tailor your learning journey on the platform.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Study Goal</label>
                                        <select className="input-field cursor-pointer">
                                            <option>Grade Improvement</option>
                                            <option>Exam Prep (Entrance)</option>
                                            <option>Portfolio Building</option>
                                            <option>General Learning</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Study Frequency</label>
                                        <select className="input-field cursor-pointer">
                                            <option>Every Day</option>
                                            <option>Weekends Only</option>
                                            <option>Intense Period</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-4">
                                        <p className="text-sm font-bold text-text-main">Subjects of Interest</p>
                                        <div className="flex flex-wrap gap-2">
                                            {["Physics", "Computer Science", "Engineering Math", "Data Structures", "Mechanical Design", "AI & ML"].map(tag => (
                                                <button key={tag} className="px-3 py-1.5 rounded-full border border-border text-xs bg-surface-2 hover:border-primary hover:text-primary transition-all font-semibold">
                                                    {tag}
                                                </button>
                                            ))}
                                            <button className="px-3 py-1.5 rounded-full border border-dashed border-border text-xs text-primary hover:bg-primary/5 transition-all font-bold">+ Add Subject</button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* PRIVACY */}
                        {activeTab === "privacy" && (
                            <motion.div key="privacy" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Privacy & Visibility</h3>
                                    <p className="text-text-muted text-sm">Decide who can see your profile and academic content.</p>
                                </div>
                                <div className="space-y-4">
                                    <div className="p-4 border border-border rounded-xl flex items-center justify-between hover:bg-surface-2 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-text-main">Public Profile</p>
                                            <p className="text-xs text-text-muted">Make your study history and stats visible to other students.</p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => { }} />
                                    </div>
                                    <div className="p-4 border border-border rounded-xl flex items-center justify-between hover:bg-surface-2 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-text-main">Search Engine Indexing</p>
                                            <p className="text-xs text-text-muted">Let Google index your public collections and profile.</p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => { }} />
                                    </div>
                                    <div className="p-4 border border-border rounded-xl flex items-center justify-between hover:bg-surface-2 transition-all">
                                        <div>
                                            <p className="text-sm font-bold text-text-main">Anonymous Mode</p>
                                            <p className="text-xs text-text-muted">Hide your name when browsing forum discussions.</p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => { }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* INTEGRATIONS */}
                        {activeTab === "integrations" && (
                            <motion.div key="integrations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Linked Accounts</h3>
                                    <p className="text-text-muted text-sm">Connect external platforms for seamless login and professional visibility.</p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { app: "Google Cloud", desc: "Used for login and document sync", connected: true },
                                        { app: "GitHub", desc: "Sync your coding projects for academic showcase", connected: false },
                                        { app: "LinkedIn", desc: "Share certificates and course completion stats", connected: false },
                                    ].map((app, i) => (
                                        <div key={i} className="p-4 border border-border rounded-xl flex items-center justify-between bg-surface shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
                                                    <Link2 className="w-5 h-5 text-text-main" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-text-main">{app.app}</p>
                                                    <p className="text-xs text-text-muted">{app.desc}</p>
                                                </div>
                                            </div>
                                            <button className={`text-xs font-bold px-4 py-1.5 rounded-lg border transition-all ${app.connected ? 'border-primary text-primary hover:bg-primary/10' : 'bg-primary text-white hover:bg-primary-hover shadow-lg'}`}>
                                                {app.connected ? "Disconnect" : "Connect"}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* APPEARANCE */}
                        {activeTab === "appearance" && (
                            <motion.div key="appearance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Interface & Display</h3>
                                    <p className="text-text-muted text-sm">Customize how EduNest looks on your device.</p>
                                </div>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-border-hover'}`} onClick={() => setTheme('dark')}>
                                            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center">
                                                <Monitor className="w-5 h-5 text-text-main" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-text-main">Dark Mode</p>
                                                <p className="text-xs text-text-muted">Easy on the eyes</p>
                                            </div>
                                        </button>
                                        <button className={`p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border bg-surface hover:border-border-hover'}`} onClick={() => setTheme('light')}>
                                            <div className="w-8 h-8 rounded-lg bg-white border border-border-hover flex items-center justify-center">
                                                <Smartphone className="w-5 h-5 text-black" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold text-text-main">Light Mode</p>
                                                <p className="text-xs text-text-muted">High contrast</p>
                                            </div>
                                        </button>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm font-bold text-text-main">Sidebar Density</p>
                                        <div className="flex gap-2 p-1 bg-surface-2 rounded-lg border border-border w-fit">
                                            {["Default", "Compact"].map(d => (
                                                <button key={d} className={`px-4 py-1 text-xs font-bold rounded-md transition-all ${d === 'Default' ? 'bg-surface text-primary shadow-sm' : 'text-text-muted hover:text-text-main'}`}>{d}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* LANGUAGE */}
                        {activeTab === "language" && (
                            <motion.div key="language" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="border-b border-border pb-6">
                                    <h3 className="text-xl font-heading font-bold text-text-main mb-2">Language & Region</h3>
                                    <p className="text-text-muted text-sm">Set your preferred locale and timezone.</p>
                                </div>
                                <div className="space-y-4 max-w-sm">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Preferred Language</label>
                                        <select className="input-field cursor-pointer">
                                            <option>English (United States)</option>
                                            <option>English (India)</option>
                                            <option>Spanish (ES)</option>
                                            <option>Hindustani (भारत)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Timezone</label>
                                        <select className="input-field cursor-pointer">
                                            <option>(UTC+05:30) Chennai, Kolkata</option>
                                            <option>(UTC+00:00) London, UTC</option>
                                            <option>(UTC-08:00) Pacific Time</option>
                                        </select>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* DANGER ZONE TAB */}
                        {activeTab === "danger" && (
                            <motion.div
                                key="danger"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="space-y-8"
                            >
                                <div className="border-b border-danger/30 pb-6">
                                    <h3 className="text-xl font-heading font-bold text-danger flex items-center gap-2 mb-2">
                                        <AlertTriangle className="w-5 h-5" /> Danger Zone
                                    </h3>
                                    <p className="text-text-muted text-sm border border-danger/20 bg-danger/5 p-3 rounded-lg text-danger">Proceed with caution. The actions below cannot be easily reversed.</p>
                                </div>

                                <div className="border border-border p-6 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-danger/50 transition-colors bg-surface-2">
                                    <div>
                                        <h4 className="font-bold text-text-main mb-1">Delete Account</h4>
                                        <p className="text-sm text-text-muted">Permanently erase your account, uploaded notes, and all data.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsDeleteModalOpen(true)}
                                        className="btn btn-danger font-semibold shrink-0"
                                    >
                                        Delete Account
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full relative shadow-2xl"
                        >
                            <button className="absolute top-4 right-4 text-text-muted hover:text-text-main" onClick={() => setIsDeleteModalOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4 border border-danger/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-heading font-bold text-text-main mb-2">Delete Account?</h3>
                            <p className="text-text-muted text-sm mb-6">
                                Are you absolutely sure? This action cannot be undone. This will permanently delete your account and remove your study materials from our servers.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button className="btn btn-ghost flex-1 justify-center" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                                <button className="btn btn-danger flex-1 justify-center bg-danger text-white hover:bg-red-600" onClick={() => { setIsDeleteModalOpen(false); window.showToast && window.showToast("Account deleted! (Mock)", "error"); }}>Yes, delete</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
