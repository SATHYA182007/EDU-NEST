import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Upload, LogIn, Sparkles } from "lucide-react";

export default function Hero({ onBrowse, onUpload, onLogin }) {
    return (
        <section className="relative min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
            {/* Top Navigation */}
            <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center max-w-7xl mx-auto z-20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-sora font-extrabold tracking-tight">
                        <span className="text-text-main">Edu</span>
                        <span className="text-primary">Nest</span>
                    </span>
                </div>
                <button
                    onClick={onLogin}
                    className="flex items-center gap-2 text-text-muted font-bold hover:text-primary transition-all px-6 py-2 rounded-xl bg-surface-2 border border-border"
                >
                    <LogIn className="w-4 h-4" />
                    Sign In
                </button>
            </nav>

            {/* Hero Content */}
            <div className="max-w-5xl mx-auto text-center z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8">
                        <Sparkles className="w-4 h-4 fill-primary/20" />
                        <span>Empowering Student Collaboration</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-sora font-extrabold text-text-main leading-tight mb-8 tracking-tighter">
                        Your Academic <br />
                        <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent italic">Library</span> Redefined
                    </h1>

                    <p className="text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        Join thousands of students sharing high-quality study materials,
                        lecture notes, and exam cheat sheets.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={onBrowse}
                            className="btn btn-primary text-base px-10 py-5 group"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Browse Library</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>

                        <button
                            onClick={onUpload}
                            className="btn btn-ghost text-base px-10 py-5 bg-surface-2 border-border"
                        >
                            <Upload className="w-5 h-5" />
                            <span>Upload Notes</span>
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border/50 pt-12">
                        {[
                            { label: "Active Users", value: "10k+" },
                            { label: "Study Resources", value: "50k+" },
                            { label: "Universities", value: "200+" },
                            { label: "Daily Downloads", value: "5k+" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col">
                                <span className="text-3xl font-sora font-black text-text-main mb-1">{stat.value}</span>
                                <span className="text-xs font-bold text-text-muted uppercase tracking-widest">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-secondary/10 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-border flex justify-center p-1"
            >
                <div className="w-1 h-2 bg-text-muted rounded-full" />
            </motion.div>
        </section>
    );
}
