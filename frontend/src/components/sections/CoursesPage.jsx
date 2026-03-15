import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap, BookOpen, Clock, CheckCircle2, Lock, Play, ArrowLeft,
    Star, Video, FileText, PenLine, HelpCircle, ChevronLeft, ChevronRight,
    Menu, X, Award
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
                                        className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-lg"
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
    const courseKey = category.id + "_" + course.id;
    const lessonStates = progress[courseKey] || {};
    const completedCount = Object.values(lessonStates).filter(Boolean).length;
    const pct = Math.round((completedCount / course.lessons.length) * 100);
    const started = completedCount > 0;

    return (
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary text-sm font-semibold mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back to Courses
            </button>

            {/* Hero */}
            <div className={`rounded-3xl p-8 mb-6 bg-gradient-to-br ${category.gradient} relative overflow-hidden`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="relative z-10">
                    <span className={cn("text-xs font-bold px-3 py-1 rounded-full border mb-3 inline-block", LEVEL_COLOR[course.level])}>{course.level}</span>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-white mb-2">{course.title}</h1>
                    <p className="text-white/80 text-sm mb-5 max-w-lg">{course.desc}</p>
                    <div className="flex flex-wrap items-center gap-5 text-white/70 text-sm">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" /> {course.lessons.length} Lessons</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {course.hours}</span>
                        <span className="flex items-center gap-1.5"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 4.8 (2.4k reviews)</span>
                    </div>
                </div>
            </div>

            {/* Progress + CTA */}
            <div className="bg-surface border border-border rounded-2xl p-5 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-sm">{started ? "Your Progress" : "Ready to start?"}</span>
                        <span className="font-bold text-sm" style={{ color: category.color }}>{pct}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-surface-2 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.8 }}
                            className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${category.color}, #a78bfa)` }} />
                    </div>
                    <p className="text-text-muted text-xs mt-1.5">{completedCount} of {course.lessons.length} lessons completed</p>
                </div>
                <button onClick={onStartLesson}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${category.color}, #a78bfa)`, boxShadow: `0 4px 20px ${category.color}50` }}>
                    <Play className="w-4 h-4" />
                    {started ? "Continue Learning" : "Start Course"}
                </button>
                {pct === 100 && (
                    <button
                        onClick={() => generateCertificate({
                            userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
                            userEmail: user?.email,
                            courseName: course.title,
                            category: category.lang,
                            level: course.level,
                            totalLessons: course.lessons.length,
                            hours: course.hours,
                        })}
                        className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm whitespace-nowrap transition-all hover:scale-105 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #d4af37, #f0c040)', color: '#1a1200', boxShadow: '0 4px 18px rgba(212,175,55,0.5)' }}
                    >
                        <Award className="w-4 h-4" /> 🎓 Download Certificate
                    </button>
                )}
            </div>

            {/* Curriculum Preview */}
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h2 className="font-heading font-bold text-lg">Course Curriculum</h2>
                    <span className="text-xs text-text-muted">{course.lessons.length} lessons · {course.hours}</span>
                </div>
                <div className="divide-y divide-border">
                    {course.lessons.map((l, idx) => {
                        const done = !!lessonStates[l.id];
                        const m = TYPE_META[l.type] || TYPE_META.video;
                        const LIcon = m.icon;
                        return (
                            <button key={l.id} onClick={() => onStartLesson(idx)}
                                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 transition-colors text-left group">
                                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 border text-xs transition-all",
                                    done ? "bg-primary/20 border-primary text-primary" : "bg-surface-2 border-border text-text-muted group-hover:border-primary/50"
                                )}>
                                    {done ? <CheckCircle2 className="w-4 h-4" /> : <LIcon className="w-3.5 h-3.5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-semibold group-hover:text-primary transition-colors", done ? "line-through text-text-muted" : "text-text-main")}>
                                        {idx + 1}. {l.title}
                                    </p>
                                </div>
                                <span className={cn("hidden sm:flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0", m.color)}>
                                    <LIcon className="w-2.5 h-2.5" /> {m.label}
                                </span>
                                <span className="text-xs text-text-muted shrink-0">{l.duration}</span>
                            </button>
                        );
                    })}
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

    const category = COURSES_DATA.find(c => c.id === activeCategory);

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
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {COURSES_DATA.map(cat => (
                        <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                            className={cn("flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all whitespace-nowrap border",
                                activeCategory === cat.id ? `${cat.bg} ${cat.border}` : "bg-surface-2 border-border text-text-muted hover:text-text-main"
                            )}
                            style={activeCategory === cat.id ? { color: cat.color } : {}}>
                            <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                                style={{ background: cat.color + "25", color: cat.color }}>{cat.icon}</span>
                            {cat.lang}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category Banner */}
            <div className="shrink-0 mx-6 md:mx-8 mt-6">
                <AnimatePresence mode="wait">
                    <motion.div key={category.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        className={`rounded-2xl p-6 bg-gradient-to-r ${category.gradient} relative overflow-hidden`}>
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(white_1px,transparent_1px)] [background-size:18px_18px]" />
                        <div className="relative z-10 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-heading font-bold text-white mb-1">{category.lang}</h2>
                                <p className="text-white/80 text-sm">{category.description}</p>
                                <div className="flex items-center gap-4 mt-3 text-white/70 text-xs font-semibold">
                                    <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {category.courses.length} Courses</span>
                                    <span className="flex items-center gap-1"><GraduationCap className="w-3.5 h-3.5" /> Beginner → Advanced</span>
                                </div>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-xl font-black text-white shrink-0">
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
                            const finished = pct === 100;
                            return (
                                <motion.div key={course.id}
                                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }}
                                    whileHover={{ y: -4, boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
                                    onClick={() => setSelectedCourse(course)}
                                    className="bg-surface border border-border rounded-2xl overflow-hidden flex flex-col cursor-pointer group transition-all">
                                    <div className={`h-1.5 bg-gradient-to-r ${category.gradient}`} />
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", LEVEL_COLOR[course.level])}>{course.level}</span>
                                            {finished && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-400/10 border border-green-400/20 text-green-400">COMPLETED ✓</span>}
                                        </div>
                                        <h3 className="font-heading font-bold text-base text-text-main mb-1.5 group-hover:text-primary transition-colors leading-snug">{course.title}</h3>
                                        <p className="text-text-muted text-xs mb-4 line-clamp-2 flex-1">{course.desc}</p>
                                        <div className="flex items-center gap-4 text-text-muted text-xs mb-4">
                                            <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.lessons.length} lessons</span>
                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.hours}</span>
                                        </div>
                                        <div className="mb-4">
                                            <div className="flex justify-between text-[10px] font-semibold text-text-muted mb-1">
                                                <span>{started ? `${done}/${course.lessons.length} completed` : "Not started"}</span>
                                                <span style={{ color: category.color }}>{pct}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{ width: pct + "%", background: `linear-gradient(90deg, ${category.color}, #a78bfa)` }} />
                                            </div>
                                        </div>
                                        <button className="w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                            style={started
                                                ? { background: category.color + "20", color: category.color, border: `1px solid ${category.color}40` }
                                                : { background: category.color, color: "#fff", boxShadow: `0 4px 14px ${category.color}50` }}>
                                            {finished ? <><CheckCircle2 className="w-3.5 h-3.5" /> Review Course</> :
                                             started   ? <><Play className="w-3.5 h-3.5" /> Continue Course</> :
                                                         <><Play className="w-3.5 h-3.5" /> Start Learning</>}
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
