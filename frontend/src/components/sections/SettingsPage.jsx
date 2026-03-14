import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Shield, Bell, AlertTriangle, Upload, CheckCircle2, X } from "lucide-react";

export default function SettingsPage({ user }) {
    const [activeTab, setActiveTab] = useState("profile");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
    const avatarLetter = displayName[0]?.toUpperCase() || "U";

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "account", label: "Account", icon: Shield },
        { id: "notifications", label: "Notifications", icon: Bell },
        { id: "danger", label: "Danger Zone", icon: AlertTriangle, danger: true },
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
                <h1 className="text-2xl font-heading font-extrabold text-white">Settings</h1>
            </div>

            {/* Left Tabs Menu */}
            <div className="w-full md:w-64 border-r border-border bg-surface shrink-0 p-6 overflow-y-auto">
                <h2 className="hidden md:block text-2xl font-heading font-extrabold text-white mb-8 tracking-tight">Settings</h2>
                <nav className="space-y-2 flex flex-row md:flex-col overflow-x-auto md:overflow-visible pb-4 md:pb-0 scroll-smooth">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${isActive
                                    ? tab.danger ? 'bg-danger/10 text-danger border border-danger/20' : 'bg-primary/10 text-primary border border-primary/20 shadow-[0_0_10px_rgba(108,99,255,0.1)]'
                                    : 'text-text-muted hover:bg-surface-2 hover:text-white border border-transparent'
                                    }`}
                            >
                                <Icon className="w-5 h-5 shrink-0" />
                                <span>{tab.label}</span>
                            </button>
                        )
                    })}
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
                                    <h3 className="text-xl font-heading font-bold text-white mb-2">Public Profile</h3>
                                    <p className="text-text-muted text-sm">Manage how others see you on the platform.</p>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold border-4 border-surface shadow-[0_0_20px_rgba(108,99,255,0.3)]">
                                        {avatarLetter}
                                    </div>
                                    <div className="space-y-3">
                                        <button className="btn btn-primary gap-2 text-sm px-4 py-2">
                                            <Upload className="w-4 h-4" /> Change Avatar
                                        </button>
                                        <p className="text-xs text-text-muted">JPG, GIF or PNG. 1MB max.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">Display Name</label>
                                        <input type="text" className="input-field" defaultValue={displayName} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-main">University / School</label>
                                        <input type="text" className="input-field" placeholder="e.g. Stanford University" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-text-main">Course / Major</label>
                                        <input type="text" className="input-field" placeholder="e.g. B.S. Computer Science" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-bold text-text-main">Bio</label>
                                        <textarea className="input-field min-h-24 resize-y" placeholder="Tell us a little about your studies and interests..." />
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border flex justify-end">
                                    <button className="btn btn-primary px-6" onClick={() => window.showToast && window.showToast("Profile updated successfully")}>Save Changes</button>
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
                                    <h3 className="text-xl font-heading font-bold text-white mb-2">Account Security</h3>
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

                                <div className="space-y-6">
                                    <h4 className="font-heading font-bold text-lg">Change Password</h4>
                                    <div className="space-y-4 max-w-sm">
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-main">Current Password</label>
                                            <input type="password" className="input-field" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-main">New Password</label>
                                            <input type="password" className="input-field" placeholder="••••••••" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-text-main">Confirm New Password</label>
                                            <input type="password" className="input-field" placeholder="••••••••" />
                                        </div>
                                        <button className="btn btn-outline border-primary text-primary hover:bg-primary/10 w-full font-semibold">Update Password</button>
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
                                    <h3 className="text-xl font-heading font-bold text-white mb-2">Notification Preferences</h3>
                                    <p className="text-text-muted text-sm">Control how and when you want to be notified.</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Important Account Alerts</h4>
                                            <p className="text-sm text-text-muted">Security updates, terms changes. Cannot be disabled.</p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Download Notifications</h4>
                                            <p className="text-sm text-text-muted">Get alerted when someone downloads your notes.</p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">Weekly Digest</h4>
                                            <p className="text-sm text-text-muted">An email summary of your account's weekly performance.</p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => { }} />
                                    </div>

                                    <div className="flex items-start justify-between gap-4 p-4 border border-border rounded-xl hover:bg-surface-2 transition-colors">
                                        <div>
                                            <h4 className="font-bold text-white mb-1">New Features & Promotions</h4>
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
                                        <h4 className="font-bold text-white mb-1">Delete Account</h4>
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
                            <button className="absolute top-4 right-4 text-text-muted hover:text-white" onClick={() => setIsDeleteModalOpen(false)}>
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-4 border border-danger/20">
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <h3 className="text-xl font-heading font-bold text-white mb-2">Delete Account?</h3>
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
