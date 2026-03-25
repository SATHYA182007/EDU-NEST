import { useState, useRef, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, BookOpen, Clock, CheckCircle2, Lock, Play, ArrowLeft,
    Star, Video, FileText, PenLine, HelpCircle, ChevronLeft, ChevronRight,
    Menu, X, Award, Loader2, AlertTriangle, RefreshCw, AlertCircle
} from "lucide-react";
import { cn } from "../../lib/utils";
import { COURSES_DATA } from "../../data/coursesData";
import { getLessonContent } from "../../data/lessonContent";
import { generateCertificate } from "../../utils/generateCertificate";

const STORAGE_KEY = "edunest_course_progress";
function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } }
function saveProgress(p) { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); }

const LEVEL_COLOR = {
    Beginner:     "text-green-400 bg-green-400/10 border-green-400/20",
    Intermediate: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    Advanced:     "text-red-400 bg-red-400/10 border-red-400/20",
};
const TYPE_META = {
    video:    { icon: Video,       label: "Video",    color: "text-blue-400 bg-blue-400/10" },
    reading:  { icon: FileText,    label: "Reading",  color: "text-green-400 bg-green-400/10" },
    exercise: { icon: PenLine,     label: "Exercise", color: "text-orange-400 bg-orange-400/10" },
    quiz:     { icon: HelpCircle,  label: "Quiz",     color: "text-purple-400 bg-purple-400/10" },
};

// ─── Markdown-lite renderer ──────────────────────────────────────────────────
function renderBody(text) {
    if (!text) return null;
    const lines = text.split("\n");
    const elements = [];
    let codeBuffer = [];
    let inCode = false;
    let tableBuffer = [];
    let inTable = false;
    let key = 0;

    const flush = () => {
        if (codeBuffer.length) {
            elements.push(
                <pre key={key++} className="bg-surface-2 border border-border rounded-xl p-4 text-xs font-mono overflow-x-auto text-green-300 my-3">
                    <code>{codeBuffer.join("\n")}</code>
                </pre>
            );
            codeBuffer = [];
        }
        if (tableBuffer.length) {
            const rows = tableBuffer.filter(r => !r.match(/^\|[\s-|]+\|$/));
            const cols = rows[0]?.split("|").filter(Boolean).map(c => c.trim()) || [];
            elements.push(
                <div key={key++} className="overflow-x-auto my-3">
                    <table className="w-full text-xs border-collapse">
                        <thead>
                            <tr>{cols.map((c, i) => <th key={i} className="border border-border bg-surface-2 px-3 py-2 text-left font-bold text-text-muted">{c}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows.slice(1).map((row, ri) => (
                                <tr key={ri} className="even:bg-surface-2/40">
                                    {row.split("|").filter(Boolean).map((c, ci) => (
                                        <td key={ci} className="border border-border px-3 py-2 text-text-main">{c.trim()}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
            tableBuffer = [];
        }
    };

    lines.forEach(line => {
        if (line.startsWith("```")) {
            if (inCode) { flush(); inCode = false; }
            else { flush(); inCode = true; }
            return;
        }
        if (inCode) { codeBuffer.push(line); return; }

        if (line.startsWith("|")) { inTable = true; tableBuffer.push(line); return; }
        if (inTable) { flush(); inTable = false; }

        // Inline bold/code
        const parseInline = (s) => {
            const parts = s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
            return parts.map((p, i) => {
                if (p.startsWith("**") && p.endsWith("**")) return <strong key={i} className="text-text-main">{p.slice(2, -2)}</strong>;
                if (p.startsWith("`") && p.endsWith("`")) return <code key={i} className="text-green-300 bg-surface-2 px-1 rounded text-xs">{p.slice(1, -1)}</code>;
                return p;
            });
        };

        if (line.startsWith("> ")) {
            flush();
            elements.push(<blockquote key={key++} className="border-l-4 border-primary pl-4 my-2 text-text-muted text-sm italic">{parseInline(line.slice(2))}</blockquote>);
        } else if (line.startsWith("- ") || line.startsWith("• ")) {
            flush();
            elements.push(<li key={key++} className="flex items-start gap-2 text-sm text-text-main ml-2 my-0.5"><span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-primary shrink-0" /><span>{parseInline(line.replace(/^[-•] /, ""))}</span></li>);
        } else if (line.match(/^\d+\. /)) {
            flush();
            const num = line.match(/^(\d+)\./)[1];
            elements.push(<li key={key++} className="flex items-start gap-2 text-sm text-text-main ml-2 my-0.5"><span className="text-primary font-bold shrink-0 w-5">{num}.</span><span>{parseInline(line.replace(/^\d+\. /, ""))}</span></li>);
        } else if (line.trim() === "") {
            flush();
            elements.push(<div key={key++} className="h-2" />);
        } else {
            flush();
            elements.push(<p key={key++} className="text-sm text-text-main leading-relaxed">{parseInline(line)}</p>);
        }
    });
    flush();
    return elements;
}

// ─── Lesson Reader (Coursera-style split pane) ───────────────────────────────
function LessonReader({ course, category, onBack }) {
    const [activeIdx, setActiveIdx] = useState(0);
    const [progress, setProgress] = useState(() => loadProgress());
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const contentRef = useRef(null);

    const courseKey = category.id + "_" + course.id;
    const lessonStates = progress[courseKey] || {};
    const completedCount = Object.values(lessonStates).filter(Boolean).length;
    const pct = Math.round((completedCount / course.lessons.length) * 100);

    const lesson = course.lessons[activeIdx];
    const content = getLessonContent(lesson, course.title, category.lang);
    const meta = TYPE_META[lesson.type] || TYPE_META.video;
    const TypeIcon = meta.icon;
    const isDone = !!lessonStates[lesson.id];

    const markComplete = () => {
        const updated = { ...progress, [courseKey]: { ...lessonStates, [lesson.id]: true } };
        setProgress(updated);
        saveProgress(updated);
        if (activeIdx < course.lessons.length - 1) {
            setTimeout(() => { setActiveIdx(activeIdx + 1); contentRef.current?.scrollTo(0, 0); }, 400);
        }
    };

    useEffect(() => { contentRef.current?.scrollTo(0, 0); }, [activeIdx]);

    return (
        <div className="flex flex-1 overflow-hidden h-full">

            {/* ── Left Sidebar – Curriculum ─────────────────────────── */}
            <AnimatePresence>
                {sidebarOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 300, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        className="shrink-0 h-full border-r border-border bg-surface flex flex-col overflow-hidden"
                        style={{ minWidth: 0 }}
                    >
                        {/* Sidebar header */}
                        <div className="p-4 border-b border-border shrink-0">
                            <button onClick={onBack} className="flex items-center gap-1.5 text-text-muted hover:text-primary text-xs font-semibold mb-3 transition-colors">
                                <ArrowLeft className="w-3.5 h-3.5" /> All Courses
                            </button>
                            <h2 className="font-heading font-bold text-sm text-text-main leading-snug">{course.title}</h2>
                            <div className="mt-2">
                                <div className="flex justify-between text-[10px] text-text-muted mb-1">
                                    <span>{completedCount}/{course.lessons.length} completed</span>
                                    <span style={{ color: category.color }}>{pct}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500"
                                        style={{ width: pct + "%", background: `linear-gradient(90deg, ${category.color}, #a78bfa)` }} />
                                </div>
                            </div>
                        </div>

                        {/* Lesson list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {course.lessons.map((l, idx) => {
                                const done = !!lessonStates[l.id];
                                const active = idx === activeIdx;
                                const unlocked = idx <= completedCount;
                                const m = TYPE_META[l.type] || TYPE_META.video;
                                const LIcon = m.icon;
                                return (
                                    <button
                                        key={l.id}
                                        onClick={() => unlocked && setActiveIdx(idx)}
                                        className={cn(
                                            "w-full text-left px-4 py-3 border-b border-border/50 flex items-start gap-3 transition-all",
                                            active ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-surface-2",
                                            !unlocked && "opacity-40 cursor-not-allowed"
                                        )}
                                    >
                                        <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 border text-xs",
                                            done ? "bg-primary/20 border-primary text-primary" :
                                                active ? "bg-primary/10 border-primary/50 text-primary" :
                                                    "bg-surface-2 border-border text-text-muted"
                                        )}>
                                            {done ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                             unlocked ? <LIcon className="w-3 h-3" /> :
                                             <Lock className="w-3 h-3" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-xs font-semibold leading-snug", active ? "text-primary" : done ? "text-text-muted line-through" : "text-text-main")}>
                                                {idx + 1}. {l.title}
                                            </p>
                                            <span className={cn("text-[10px] font-medium", m.color.split(" ")[0])}>{m.label} · {l.duration}</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Main Content Panel ────────────────────────────────── */}
            <div ref={contentRef} className="flex-1 overflow-y-auto custom-scrollbar h-full">

                {/* Topbar */}
                <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-border px-6 py-3 flex items-center gap-3">
                    <button onClick={() => setSidebarOpen(v => !v)}
                        className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-main transition-colors">
                        {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                    </button>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted font-medium truncate">{course.title}</p>
                        <p className="text-sm font-bold text-text-main truncate">{lesson.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={activeIdx === 0}
                            onClick={() => { setActiveIdx(activeIdx - 1); contentRef.current?.scrollTo(0, 0); }}
                            className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-main disabled:opacity-30 transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs text-text-muted">{activeIdx + 1}/{course.lessons.length}</span>
                        <button disabled={activeIdx === course.lessons.length - 1}
                            onClick={() => { setActiveIdx(activeIdx + 1); contentRef.current?.scrollTo(0, 0); }}
                            className="p-1.5 rounded-lg hover:bg-surface-2 text-text-muted hover:text-text-main disabled:opacity-30 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Lesson Content */}
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <AnimatePresence mode="wait">
                        <motion.div key={lesson.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                        >
                            {/* Lesson header */}
                            <div className="flex items-center gap-3 mb-4">
                                <span className={cn("flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full", meta.color)}>
                                    <TypeIcon className="w-3 h-3" /> {meta.label}
                                </span>
                                <span className="text-xs text-text-muted">{lesson.duration}</span>
                                {isDone && (
                                    <span className="flex items-center gap-1 text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                                        <CheckCircle2 className="w-3 h-3" /> Completed
                                    </span>
                                )}
                            </div>

                            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-main mb-4">{lesson.title}</h1>

                            {/* Intro */}
                            <p className="text-base text-text-muted leading-relaxed mb-6 border-l-4 pl-4" style={{ borderColor: category.color }}>
                                {content.intro}
                            </p>

                            {/* Sections */}
                            {content.sections.map((sec, i) => (
                                <div key={i} className="mb-8">
                                    <h2 className="text-lg font-heading font-bold text-text-main mb-3 flex items-center gap-2">
                                        <span className="w-1.5 h-5 rounded-full shrink-0" style={{ background: category.color }} />
                                        {sec.heading}
                                    </h2>
                                    <div className="space-y-1.5">
                                        {renderBody(sec.body)}
                                    </div>
                                </div>
                            ))}

                            {/* Takeaway */}
                            <div className="rounded-2xl p-5 mb-8 border" style={{ background: category.color + "12", borderColor: category.color + "35" }}>
                                <p className="text-xs font-bold mb-1" style={{ color: category.color }}>🎯 KEY TAKEAWAY</p>
                                <p className="text-sm text-text-main">{content.takeaway}</p>
                            </div>

                            {/* Mark Complete */}
                            <div className="flex items-center gap-4 pt-4 border-t border-border">
                                {isDone ? (
                                    <div className="flex items-center gap-2 text-green-400 font-bold">
                                        <CheckCircle2 className="w-5 h-5" /> Lesson completed!
                                    </div>
                                ) : (
                                    <button onClick={markComplete}
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-text-main font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
                                        style={{ background: `linear-gradient(135deg, ${category.color}, #a78bfa)`, boxShadow: `0 4px 20px ${category.color}50` }}>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Mark as Complete & Continue
                                    </button>
                                )}
                                {activeIdx < course.lessons.length - 1 && (
                                    <button onClick={() => { setActiveIdx(activeIdx + 1); contentRef.current?.scrollTo(0, 0); }}
                                        className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-border hover:border-primary/50 text-text-muted hover:text-text-main font-semibold text-sm transition-all">
                                        Next Lesson <ChevronRight className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

// ─── Course Detail (overview before entering lessons) ────────────────────────
function CourseDetail({ course, category, onBack, onStartLesson, user }) {
    const [progress] = useState(() => loadProgress());
    
    // Defensive check to prevent crash if data is missing
    if (!course || !category) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <AlertCircle className="w-12 h-12 text-danger mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-text-main mb-2">Interface sync error</h3>
                <p className="text-text-muted mb-6">We couldn't load this module's metadata. Please try again.</p>
                <button onClick={onBack} className="btn-primary px-6 py-2 rounded-xl text-sm font-bold">Return to Library</button>
            </div>
        );
    }

    const courseKey = (category.id || "default") + "_" + course.id;
    const lessonStates = progress[courseKey] || {};
    const completedCount = Object.values(lessonStates).filter(Boolean).length;
    const totalLessons = (course.lessons || []).length;
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    const started = completedCount > 0;
    
    const [assessment, setAssessment] = useState(null);
    const [lastAttempt, setLastAttempt] = useState(null);
    const [loadingAssessment, setLoadingAssessment] = useState(false);

    useEffect(() => {
        async function fetchAssessmentStatus() {
            if (!user) return;
            setLoadingAssessment(true);
            try {
                // 1. Find if this course has an assessment
                // We use course ID (now a flexible text column) or title as match criteria
                const { data: assess } = await supabase
                    .from("assessments")
                    .select("*")
                    .or(`course_id.eq.${course.id},title.ilike.%${course.title}%`)
                    .maybeSingle();

                if (assess) {
                    setAssessment(assess);
                    // 2. Check for user's best passing attempt
                    const { data: attempt } = await supabase
                        .from("user_assessment_attempts")
                        .select("*")
                        .eq("user_id", user.id)
                        .eq("assessment_id", assess.id)
                        .order("percentage", { ascending: false })
                        .limit(1)
                        .maybeSingle();
                    
                    setLastAttempt(attempt);
                }
            } catch (err) {
                console.error("CourseDetail assessment fetch error:", err);
            } finally {
                setLoadingAssessment(false);
            }
        }
        fetchAssessmentStatus();
    }, [course.id, user]);

    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar bg-background">
            <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary text-sm font-semibold mb-6 transition-colors group">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Courses
            </button>

            {/* Hero Section */}
            <div className={`rounded-[2.5rem] p-8 md:p-12 mb-8 bg-gradient-to-br ${category.gradient} relative overflow-hidden shadow-2xl`}>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <span className={cn("text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest", LEVEL_COLOR[course.level])}>
                            {course.level}
                        </span>
                        <span className="text-[10px] font-black px-3 py-1.5 rounded-xl bg-white/20 text-text-main uppercase tracking-widest backdrop-blur-md">
                            {category.lang}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-sora font-extrabold text-text-main mb-4 leading-tight">{course.title}</h1>
                    <p className="text-text-main/80 text-base md:text-lg mb-8 max-w-2xl font-medium leading-relaxed">{course.desc}</p>
                    
                    <div className="flex flex-wrap items-center gap-6 text-text-main text-sm font-bold">
                        <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <BookOpen className="w-4 h-4 text-primary-light" /> {course.lessons.length} Modules
                        </span>
                        <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <Clock className="w-4 h-4 text-primary-light" /> {course.hours}
                        </span>
                        <span className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> 4.9 Rating
                        </span>
                    </div>
                </div>
            </div>

            {/* Assessment & Progress Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-12">
                <div className="lg:col-span-2 card-premium p-8 bg-surface border-border flex flex-col justify-between overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
                        <Play className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h3 className="text-sm font-black text-text-muted uppercase tracking-widest mb-1">Your Journey</h3>
                                <p className="text-3xl font-black text-text-main">{pct}% Complete</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-text-muted">{completedCount} / {course.lessons.length} Lessons</p>
                            </div>
                        </div>
                        <div className="w-full h-4 bg-surface-2 rounded-2xl overflow-hidden mb-8 border border-border/50">
                            <motion.div initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full rounded-2xl" style={{ background: `linear-gradient(90deg, ${category.color}, #a78bfa)` }} />
                        </div>
                        <button onClick={onStartLesson}
                            className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-text-main font-black text-sm uppercase tracking-widest transition-all hover:shadow-2xl active:scale-95 group"
                            style={{ background: `linear-gradient(135deg, ${category.color}, #a78bfa)`, boxShadow: `0 10px 40px ${category.color}40` }}>
                            {started ? <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" /> : <Play className="w-4 h-4" />}
                            {started ? "Continue Module" : "Begin Learning"}
                        </button>
                    </div>
                </div>

                <div className="card-premium p-8 bg-surface-2 border-border flex flex-col items-center text-center justify-center group">
                    <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110", 
                        lastAttempt?.is_passed ? "bg-success/10 text-success shadow-[0_0_30px_rgba(34,197,94,0.2)]" : "bg-surface-3 text-text-muted"
                    )}>
                        <Award className="w-8 h-8" />
                    </div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Assessment</h3>
                    <p className={cn("text-xl font-black", lastAttempt?.is_passed ? "text-success" : "text-text-main")}>
                        {lastAttempt?.is_passed ? "MASTERED" : lastAttempt ? "RE-ATTEMPT" : "LOCKED"}
                    </p>
                    <p className="text-[10px] font-bold text-text-muted mt-2 uppercase">Required: 80%</p>
                </div>

                <div className="card-premium p-8 bg-surface-2 border-border flex flex-col items-center text-center justify-center group">
                    <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110", 
                        pct === 100 ? "bg-primary/10 text-primary shadow-[0_0_30px_rgba(167,139,250,0.2)]" : "bg-surface-3 text-text-muted"
                    )}>
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-1">Certificate</h3>
                    <p className="text-xl font-black text-text-main">{lastAttempt?.is_passed ? "ISSUED" : "PENDING"}</p>
                    <p className="text-[10px] font-bold text-text-muted mt-2 uppercase">Valid Forever</p>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Curriculum Roadmap */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <h2 className="text-xl font-sora font-black text-text-main uppercase tracking-tight">Curriculum Roadmap</h2>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-primary" />
                            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Active Path</span>
                        </div>
                    </div>

                    <div className="card-premium bg-surface border-border overflow-hidden divide-y divide-border/50">
                        {course.lessons.map((l, idx) => {
                            const done = !!lessonStates[l.id];
                            const m = TYPE_META[l.type] || TYPE_META.video;
                            const LIcon = m.icon;
                            return (
                                <button key={l.id} onClick={() => onStartLesson(idx)}
                                    className="w-full flex items-center gap-4 px-6 py-5 hover:bg-surface-2 transition-all text-left group">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 transition-all group-hover:scale-110",
                                        done ? "bg-success/10 border-success/50 text-success" : "bg-surface-2 border-border text-text-muted group-hover:border-primary/50"
                                    )}>
                                        {done ? <CheckCircle2 className="w-5 h-5" /> : <LIcon className="w-4 h-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-bold transition-all", done ? "text-text-muted/60" : "text-text-main group-hover:text-primary")}>
                                            {idx + 1}. {l.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={cn("text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md", m.color || "bg-surface-3 text-text-muted")}>
                                                {m.label}
                                            </span>
                                            <span className="text-[10px] font-bold text-text-muted bg-surface-3 px-2 py-0.5 rounded-md">{l.duration}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1", done ? "text-success" : "text-primary")} />
                                </button>
                            );
                        })}

                        {/* FINAL MASTERY ASSESSMENT ROW */}
                        <button 
                            onClick={() => {
                                if (pct < 100) {
                                    if (window.showToast) window.showToast("Complete all lessons to unlock the Final Assessment!", "error");
                                    return;
                                }
                                window.startAssessment && window.startAssessment(assessment?.id || "fallback_" + course.id, {
                                    title: course.title,
                                    category: category.lang,
                                    level: course.level,
                                    lessonsCount: course.lessons.length,
                                    duration: course.hours
                                });
                            }}
                            className={cn("w-full flex items-center gap-5 px-8 py-8 transition-all text-left relative overflow-hidden group border-t-2 border-dashed border-primary/20",
                                pct === 100 ? "hover:bg-primary/5 cursor-pointer" : "opacity-60 cursor-not-allowed bg-surface-2/30"
                            )}
                        >
                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl transition-all duration-500",
                                lastAttempt?.is_passed ? "bg-success text-text-main rotate-6" :
                                pct === 100 ? "bg-primary text-text-main group-hover:scale-110 group-hover:-rotate-3" : "bg-surface-3 text-text-muted"
                            )}>
                                {lastAttempt?.is_passed ? <Award className="w-10 h-10" /> : 
                                 pct === 100 ? <Play className="w-8 h-8" /> : <Lock className="w-7 h-7" />}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className={cn("text-xl font-sora font-black tracking-tight", pct === 100 ? "text-text-main" : "text-text-muted")}>
                                        FINAL MASTERY EXAM
                                    </h3>
                                    {lastAttempt?.is_passed && (
                                        <span className="bg-success text-text-main text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-success/20 uppercase tracking-widest">
                                            Passed
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-text-muted font-medium max-w-md">
                                    {pct === 100 
                                        ? "Congratulations! You've reached the final stage. Launch the assessment to earn your diploma."
                                        : `Exam locked. Current Progress: ${pct}%. Finish everything else to proceed.`
                                    }
                                </p>
                            </div>

                            <div className="hidden md:flex flex-col items-end gap-3 shrink-0">
                                {pct === 100 ? (
                                    <div className="flex items-center gap-2 group-hover:gap-4 transition-all text-primary font-black text-xs uppercase tracking-widest bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 shadow-xl">
                                        {lastAttempt?.is_passed ? "View Result" : "Launch Exam"} <ChevronRight className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-[10px] font-black text-text-muted uppercase tracking-widest bg-surface-3 px-4 py-2 rounded-xl">
                                        <Lock className="w-3 h-3" /> Locked
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Right Side: Rewards & Actions */}
                <div className="space-y-6">
                    <div className="card-premium p-8 bg-surface border-border relative overflow-hidden group">
                        <div className="absolute -bottom-8 -right-8 opacity-10 group-hover:scale-125 transition-transform duration-1000">
                            <Award className="w-48 h-48" />
                        </div>
                        <h2 className="text-lg font-sora font-black text-text-main mb-6 uppercase tracking-tight">Earn Rewards</h2>
                        
                        <div className="space-y-6 relative z-10">
                            {/* Certificate Section */}
                            <div className="p-6 rounded-[2rem] bg-surface-2 border border-border flex flex-col items-center text-center">
                                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-4", 
                                    lastAttempt?.is_passed ? "bg-yellow-400/10 text-yellow-500 shadow-xl" : "bg-surface-3 text-text-muted"
                                )}>
                                    <Award className="w-8 h-8" />
                                </div>
                                <p className="text-sm font-black text-text-main mb-1">Professional Diploma</p>
                                <p className="text-[10px] text-text-muted mb-6 uppercase font-bold tracking-widest">Digital Accreditation</p>
                                
                                {lastAttempt?.is_passed ? (
                                    <button 
                                        onClick={() => {
                                            const doc = generateCertificate({
                                                userName: user?.user_metadata?.full_name || user?.email?.split('@')[0],
                                                userEmail: user?.email,
                                                courseName: course.title,
                                                category: category.lang,
                                                level: course.level,
                                                totalLessons: course.lessons.length,
                                                hours: course.hours
                                            });
                                            doc.save(`EduNest_Certificate_${course.title.replace(/\s+/g, "_")}.pdf`);
                                        }}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-yellow-600 text-text-main font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all"
                                    >
                                        Download Now
                                    </button>
                                ) : (
                                    <div className="w-full py-4 rounded-2xl bg-surface-3 text-text-muted font-black text-[10px] uppercase tracking-widest border border-dashed border-border/50">
                                        Complete Assessment to Unlock
                                    </div>
                                )}
                            </div>

                            {/* Skills Badge */}
                            <div className="p-6 rounded-[2rem] bg-primary/5 border border-primary/10 flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary text-text-main flex items-center justify-center shadow-lg">
                                    <Star className="w-5 h-5 fill-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Skill Badge</p>
                                    <p className="text-sm font-bold text-text-main">{category.lang} Mastery</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Support Block */}
                    <div className="card-premium p-6 bg-surface-2 border-border text-center">
                        <HelpCircle className="w-8 h-8 text-primary mx-auto mb-3" />
                        <h4 className="text-sm font-black text-text-main mb-1 uppercase tracking-tight">Need Help?</h4>
                        <p className="text-xs text-text-muted mb-4 font-medium">Stuck on a lesson or assessment? Join our community discussion.</p>
                        <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Open Forum</button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ─── Main Courses Page ────────────────────────────────────────────────────────
export default function CoursesPage({ user }) {
    const [activeCategory, setActiveCategory] = useState(COURSES_DATA[0].id);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [readerOpen, setReaderOpen] = useState(false);
    const [startLessonIdx, setStartLessonIdx] = useState(0);
    const [progress, setProgress] = useState(() => loadProgress());
    // Set of course IDs/titles where the user has passed the final assessment
    const [passedAssessments, setPassedAssessments] = useState(new Set());

    // Fetch which assessments the user has actually passed (≥80%)
    useEffect(() => {
        if (!user) return;
        supabase
            .from('user_assessment_attempts')
            .select('assessment_id, is_passed, assessments(title, course_id)')
            .eq('user_id', user.id)
            .eq('is_passed', true)
            .then(({ data }) => {
                if (data) {
                    const passed = new Set();
                    data.forEach(row => {
                        // Store both assessment course_id and title for flexible matching
                        if (row.assessments?.course_id) passed.add(String(row.assessments.course_id));
                        if (row.assessments?.title) passed.add(row.assessments.title.toLowerCase());
                    });
                    setPassedAssessments(passed);
                }
            });
    }, [user]);

    const category = COURSES_DATA.find(c => c.id === activeCategory) || COURSES_DATA[0];

    const openReader = (course, lessonIdx = 0) => {
        setSelectedCourse(course);
        setStartLessonIdx(lessonIdx);
        setReaderOpen(true);
    };

    const closeReader = () => { setReaderOpen(false); setProgress(loadProgress()); };
    const closeCourse = () => { setSelectedCourse(null); setProgress(loadProgress()); };

    const getCourseProgress = (catId, courseId) => {
        const key = catId + "_" + courseId;
        return Object.values(progress[key] || {}).filter(Boolean).length;
    };

    // Returns true only if the user passed the final assessment for this course
    const isCourseAssessmentPassed = (course) => {
        return passedAssessments.has(String(course.id)) ||
               passedAssessments.has(course.title.toLowerCase());
    };

    // ── Lesson Reader (full screen) ──────────────────────────────────────────
    if (readerOpen && selectedCourse) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <LessonReader
                    course={{ ...selectedCourse, _startIdx: startLessonIdx }}
                    category={category}
                    onBack={closeReader}
                />
            </div>
        );
    }

    // ── Course Detail ────────────────────────────────────────────────────────
    if (selectedCourse) {
        return (
            <div className="flex-1 flex flex-col overflow-hidden">
                <AnimatePresence mode="wait">
                    <CourseDetail
                        key={selectedCourse.id}
                        course={selectedCourse}
                        category={category}
                        onBack={closeCourse}
                        user={user}
                        onStartLesson={(idx = 0) => openReader(selectedCourse, idx)}
                    />
                </AnimatePresence>
            </div>
        );
    }

    // ── Courses Listing ──────────────────────────────────────────────────────
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-border bg-surface shrink-0">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-heading font-extrabold text-text-main">Courses</h1>
                        <p className="text-text-muted text-sm">Structured programming learning paths — Beginner to Advanced</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                    {COURSES_DATA.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                            className={cn("flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all whitespace-nowrap border shadow-sm",
                                activeCategory === cat.id 
                                ? "bg-surface border-primary text-primary shadow-lg ring-1 ring-primary/20" 
                                : "bg-surface-2 border-border text-text-muted hover:text-text-main hover:border-primary/30"
                            )}>
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                                style={{ background: cat.color + "20", color: cat.color }}>{cat.icon}</span>
                            {cat.lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Banner */}
            <div className="shrink-0 mx-6 md:mx-8 mt-8">
                <AnimatePresence mode="wait">
                    <motion.div key={category.id} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
                        className={`rounded-[2.5rem] p-8 bg-gradient-to-br ${category.gradient} relative overflow-hidden shadow-2xl shadow-primary/10`}>
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-text-main text-[10px] font-black uppercase tracking-wider mb-4 border border-white/30">
                                    Learning Path
                                </div>
                                <h2 className="text-3xl md:text-4xl font-sora font-extrabold text-text-main mb-2 leading-tight">{category.lang}</h2>
                                <p className="text-text-main/90 text-sm md:text-base font-medium max-w-xl">{category.description}</p>
                                <div className="flex flex-wrap items-center gap-6 mt-6 text-text-main/80 text-xs font-bold uppercase tracking-widest">
                                    <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl"><BookOpen className="w-3.5 h-3.5" /> {category.courses.length} Modules</span>
                                    <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-xl"><GraduationCap className="w-3.5 h-3.5" /> Core Curriculum</span>
                                </div>
                            </div>
                            <div className="w-20 h-20 rounded-[2rem] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center text-4xl font-black text-text-main shrink-0 shadow-2xl transform rotate-3">
                                {category.icon}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Courses Grid */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <AnimatePresence mode="wait">
                    <motion.div key={category.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {category.courses.map((course, idx) => {
                            const done = getCourseProgress(category.id, course.id);
                            const pct = Math.round((done / course.lessons.length) * 100);
                            const started = done > 0;
                            const lessonsFinished = pct === 100;
                            const assessmentPassed = isCourseAssessmentPassed(course);
                            // True completion = all lessons done AND assessment passed
                            const fullyPassed = lessonsFinished && assessmentPassed;
                            return (
                                <motion.div key={course.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -6 }}
                                    onClick={() => setSelectedCourse(course)}
                                    className="bg-surface border border-border rounded-[2rem] overflow-hidden flex flex-col cursor-pointer group transition-all hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] hover:border-primary/50 relative">
                                    
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between gap-2 mb-4">
                                            <span className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border", LEVEL_COLOR[course.level])}>{course.level}</span>
                                            {fullyPassed && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">PASSED ✓</span>
                                            )}
                                            {lessonsFinished && !assessmentPassed && (
                                                <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-400">IN REVIEW</span>
                                            )}
                                        </div>
                                        
                                        <h3 className="text-xl font-sora font-extrabold text-text-main mb-2 transition-colors group-hover:text-primary leading-tight">{course.title}</h3>
                                        <p className="text-text-muted text-sm mb-6 line-clamp-2 flex-1 font-medium leading-relaxed">{course.desc}</p>
                                        
                                        <div className="flex items-center gap-5 text-text-muted text-xs font-bold mb-6">
                                            <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4 text-primary/60" /> {course.lessons.length}</span>
                                            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary/60" /> {course.hours}</span>
                                        </div>
                                        
                                        <div className="mb-6 bg-surface-2 p-4 rounded-2xl border border-border/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-black text-text-muted uppercase tracking-wider">{started ? "Ongoing Progress" : "Availability"}</span>
                                                <span className="text-[10px] font-black uppercase" style={{ color: category.color }}>{started ? `${pct}%` : "Enroll Now"}</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: (started ? pct : 0) + "%", background: `linear-gradient(90deg, ${category.color}, #a78bfa)` }} />
                                            </div>
                                        </div>
                                        
                                        <button className="w-full py-4 rounded-[1.25rem] text-sm font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                                            style={started
                                                ? { background: 'var(--color-surface-2)', color: 'var(--color-text-main)', border: `1px solid var(--color-border)` }
                                                : { background: category.color, color: "#fff", boxShadow: `0 8px 20px ${category.color}40` }}>
                                            {fullyPassed  ? <><CheckCircle2 className="w-4 h-4" /> Review Path</> :
                                             lessonsFinished ? <><Award className="w-4 h-4" /> Take Assessment</> :
                                             started        ? <><Play className="w-4 h-4" /> Resume Now</> :
                                                             <><Play className="w-4 h-4" /> Begin Path</>}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
