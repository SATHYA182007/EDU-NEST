import { motion } from "framer-motion";
import {
    LayoutDashboard,
    Upload,
    Library,
    Settings,
    LogOut,
    Search,
    BookOpen,
    Video,
    CheckCircle2,
    MessageSquare
} from "lucide-react";
import { cn } from "../../lib/utils";
import { supabase } from "../../lib/supabaseClient";

const menuSections = [
    {
        label: "MAIN",
        items: [
            { icon: LayoutDashboard, label: "Dashboard", id: "dashboard" },
            { icon: Search, label: "Browse", id: "browse" },
        ]
    },
    {
        label: "LEARNING",
        items: [
            { icon: Video, label: "Video Lectures", id: "videos" },
            { icon: CheckCircle2, label: "Quizzes", id: "quizzes" },
            { icon: MessageSquare, label: "Community", id: "forum" },
        ]
    },
    {
        label: "LIBRARY",
        items: [
            { icon: Library, label: "My Library", id: "library" },
            { icon: Upload, label: "Upload", id: "upload", highlight: true },
        ]
    },
    {
        label: "ACCOUNT",
        items: [
            { icon: Settings, label: "Settings", id: "settings" },
        ]
    }
];


export default function Sidebar({ activeTab, setActiveTab, user }) {
    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            window.location.reload();
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";
    const avatarLetter = displayName[0]?.toUpperCase() || "U";

    return (
        <aside className="w-[240px] h-screen border-r border-border bg-surface flex flex-col p-6 sticky top-0 shadow-sm z-50 shrink-0">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg text-white">
                    <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-2xl logo-edunest tracking-tight">
                    <span className="logo-edu">Edu</span>
                    <span className="logo-nest">Nest</span>
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar">
                {menuSections.map((section) => (
                    <div key={section.label}>
                        <h4 className="text-[11px] font-bold text-text-muted/60 tracking-[0.2em] pl-2 mb-4">
                            {section.label}
                        </h4>
                        <div className="space-y-1.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "sidebar-item group py-2.5",
                                            isActive && "sidebar-item-active",
                                            item.highlight && !isActive && "text-primary/80"
                                        )}
                                    >
                                        <Icon className={cn(
                                            "w-5 h-5 transition-colors",
                                            isActive ? "text-primary" : "text-text-muted group-hover:text-text-main"
                                        )} />
                                        <span className={cn(
                                            "font-medium",
                                            isActive && "font-bold"
                                        )}>{item.label}</span>
                                        {item.id === 'upload' && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile */}
            <div className="mt-8 pt-6 border-t border-border space-y-4">
                <div className="px-3 py-4 rounded-2xl bg-surface-2/50 backdrop-blur-sm border border-border flex items-center gap-3">
                    <div className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg shadow-sm">
                        S
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-[13px] font-extrabold text-text-main truncate font-sora">Sathya M</p>
                        <p className="text-[11px] text-text-muted font-medium truncate">Computer Science</p>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-text-muted hover:text-danger hover:bg-danger/5 transition-all rounded-xl font-semibold text-sm"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
