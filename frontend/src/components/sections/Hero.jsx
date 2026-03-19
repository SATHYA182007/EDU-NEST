import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Upload, LogIn, Sparkles } from "lucide-react";

export default function Hero({ onBrowse, onUpload, onLogin }) {
    return (
        <section className="relative min-h-screen bg-background flex flex-col items-center justify-center py-20 px-4 overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="hero-gradient absolute inset-0" />
                <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-1/4 -left-20 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px] animate-pulse" />
            </div>

            {/* Top Navigation */}
            <nav className="absolute top-0 left-0 w-full p-8 flex justify-between items-center max-w-7xl mx-auto z-20">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.location.reload()}>
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-sora font-extrabold tracking-tighter">
                        <span className="text-text-main">Edu</span>
                        <span className="text-primary">Nest</span>
                    </span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={onLogin}
                        className="px-6 py-2.5 rounded-2xl bg-surface/50 backdrop-blur-md border border-border text-text-main font-bold hover:border-primary/50 hover:bg-surface transition-all flex items-center gap-2 shadow-sm"
                    >
                        <LogIn className="w-4 h-4 text-primary" />
                        Sign In
                    </button>
                    <button
                        onClick={onBrowse}
                        className="hidden md:flex btn btn-primary py-2.5 rounded-2xl shadow-xl"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            {/* Hero Content */}
            <div className="max-w-5xl mx-auto text-center z-10 relative">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm backdrop-blur-sm">
                        <Sparkles className="w-3.5 h-3.5 fill-primary/20" />
                        <span>The Modern Way to Study</span>
                    </div>

                    <h1 className="text-6xl md:text-[5.5rem] font-sora font-extrabold text-text-main leading-[1.1] mb-8 tracking-tightest">
                        Elevate your <br />
                        <span className="text-primary relative inline-block">
                            learning 
                            <svg className="absolute -bottom-2 left-0 w-full h-3 text-secondary/30" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0,5 Q50,10 100,5" stroke="currentColor" strokeWidth="4" fill="none" />
                            </svg>
                        </span>
                        experience.
                    </h1>

                    <p className="text-lg md:text-xl text-text-muted mb-12 max-w-2xl mx-auto leading-relaxed font-medium opacity-90">
                        A collaborative hub for students to <span className="text-text-main font-bold">share notes</span>, 
                        master <span className="text-text-main font-bold">structured courses</span>, 
                        and conquer assessments together.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onBrowse}
                            className="btn btn-primary text-base px-10 py-5 group shadow-2xl shadow-primary/20"
                        >
                            <BookOpen className="w-5 h-5" />
                            <span>Explore Resources</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onUpload}
                            className="px-10 py-5 rounded-2xl bg-surface border border-border text-text-main font-bold hover:border-primary transition-all flex items-center gap-3 shadow-lg"
                        >
                            <Upload className="w-5 h-5 text-primary" />
                            <span>Contribute Material</span>
                        </motion.button>
                    </div>

                    {/* Trust/Stats */}
                    <div className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-10 border-t border-border/30 pt-12 max-w-4xl mx-auto">
                        {[
                            { label: "Community", value: "10k+", color: "primary" },
                            { label: "Study Files", value: "50k+", color: "secondary" },
                            { label: "Colleges", value: "200+", color: "success" },
                            { label: "Downloads", value: "1M+", color: "warning" }
                        ].map((stat, i) => (
                            <div key={i} className="flex flex-col group">
                                <span className="text-3xl font-sora font-black text-text-main mb-1 group-hover:scale-110 transition-transform cursor-default inline-block">{stat.value}</span>
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{stat.label}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 rounded-full border-2 border-border/50 flex justify-center p-1.5 opacity-50"
            >
                <div className="w-1 h-3 bg-primary rounded-full" />
            </motion.div>
        </section>
    );
}
