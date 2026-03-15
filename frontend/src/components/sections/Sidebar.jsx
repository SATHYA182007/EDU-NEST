import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    MessageSquare,
    GraduationCap
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
            { icon: GraduationCap, label: "Courses", id: "courses" },
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
    const [isHovered, setIsHovered] = useState(false);

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
        <motion.aside 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{ 
                width: isHovered ? 260 : 80,
            }}
            transition={{ 
                type: "spring", 
                stiffness: 450, 
                damping: 35,
                mass: 0.8
            }}
            className={cn(
                "h-screen border-r border-border bg-surface flex flex-col p-4 sticky top-0 z-50 shrink-0 overflow-hidden transition-colors duration-200",
                isHovered ? "shadow-[10px_0_30px_rgba(0,0,0,0.3)] bg-surface/95 backdrop-blur-xl" : "bg-surface"
            )}
        >
            {/* Logo */}
            <div 
                className={cn(
                    "flex items-center gap-3 mb-10 cursor-pointer overflow-hidden transition-all duration-200",
                    !isHovered ? "justify-center" : "px-2"
                )} 
                onClick={() => setActiveTab('dashboard')}
            >
                <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    className="w-10 h-10 min-w-[40px] rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg text-white shrink-0 relative group"
                >
                    <BookOpen className="w-6 h-6" />
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.div>
                <AnimatePresence>
                    {isHovered && (
                        <motion.span 
                            initial={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: -10, filter: "blur(4px)" }}
                            className="text-2xl font-sora font-extrabold tracking-tight whitespace-nowrap"
                        >
                            <span className="text-text-main">Edu</span>
                            <span className="text-primary">Nest</span>
                        </motion.span>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-8 overflow-y-auto pr-2 custom-scrollbar overflow-x-hidden">
                {menuSections.map((section) => (
                    <div key={section.label} className="space-y-4">
                        <AnimatePresence>
                            {isHovered ? (
                                <motion.h4 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="text-[10px] font-black text-text-muted/40 tracking-[0.3em] pl-3 whitespace-nowrap uppercase"
                                >
                                    {section.label}
                                </motion.h4>
                            ) : (
                                <div className="h-6 flex items-center justify-center">
                                    <div className="w-1 h-1 rounded-full bg-border" />
                                </div> 
                            )}
                        </AnimatePresence>
                        <div className="space-y-1.5">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={cn(
                                            "sidebar-item group py-2.5 transition-all duration-200 relative",
                                            isActive && "sidebar-item-active bg-primary/10",
                                            item.highlight && !isActive && "text-primary/80",
                                            !isHovered && "justify-center px-0 hover:bg-surface-2"
                                        )}
                                        title={!isHovered ? item.label : ""}
                                    >
                                        <motion.div
                                            whileHover={{ scale: 1.15 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 10 }}
                                        >
                                            <Icon className={cn(
                                                "w-5 h-5 transition-colors shrink-0",
                                                isActive ? "text-primary drop-shadow-[0_0_8px_rgba(79,142,247,0.5)]" : "text-text-muted group-hover:text-text-main"
                                            )} />
                                        </motion.div>
                                        
                                        <AnimatePresence>
                                            {isHovered && (
                                                <motion.span 
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -5 }}
                                                    className={cn(
                                                        "font-semibold text-sm whitespace-nowrap ml-3",
                                                        isActive ? "text-primary" : "text-text-muted group-hover:text-text-main"
                                                    )}
                                                >
                                                    {item.label}
                                                </motion.span>
                                            )}
                                        </AnimatePresence>

                                        {isActive && (
                                            <motion.div 
                                                layoutId="active-indicator"
                                                className="absolute left-0 w-1 h-6 bg-primary rounded-r-full shadow-[2px_0_10px_rgba(79,142,247,0.5)]"
                                            />
                                        )}
                                        
                                        {item.id === 'upload' && isHovered && (
                                            <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* User Profile */}
            <div className="mt-auto pt-6 border-t border-border space-y-4">
                <div className={cn(
                    "py-4 rounded-2xl transition-all duration-200 group/profile overflow-hidden",
                    !isHovered ? "px-0 justify-center" : "px-3 bg-surface-2/30 hover:bg-surface-2/60 border border-transparent hover:border-border"
                )}>
                    <div className="flex items-center gap-3 cursor-pointer">
                        <motion.div 
                            whileHover={{ scale: 1.05 }}
                            className="w-10 h-10 min-w-[40px] rounded-full bg-gradient-to-tr from-primary to-secondary p-[1px] shadow-lg shrink-0"
                        >
                            <div className="w-full h-full rounded-full bg-surface-2 border-2 border-surface flex items-center justify-center text-primary font-bold text-lg">
                                {avatarLetter}
                            </div>
                        </motion.div>
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    className="flex-1 overflow-hidden"
                                >
                                    <p className="text-[13px] font-bold text-text-main truncate font-sora">{displayName}</p>
                                    <p className="text-[11px] text-text-muted font-medium truncate">Computer Science</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className={cn(
                        "w-full flex items-center gap-3 py-3 text-text-muted hover:text-danger hover:bg-danger/10 transition-all rounded-xl font-bold text-sm",
                        !isHovered ? "justify-center px-0" : "px-4"
                    )}
                    title={!isHovered ? "Logout" : ""}
                >
                    <LogOut className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                    {isHovered && <span>Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
}
