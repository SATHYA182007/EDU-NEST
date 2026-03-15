import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileUp, Download, Eye, Flame, Activity, Calendar, CheckSquare, Clock, Users, BookOpen, Star, Trophy } from "lucide-react";
import { cn } from "../../lib/utils";
import NoteCard from "../ui/NoteCard";
import { handleDownload } from "../../services/notesService";
import { supabase } from "../../lib/supabaseClient";
import { COURSES_DATA } from "../../data/coursesData";

const STORAGE_KEY = "edunest_course_progress";
function loadProgress() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; } }

// Custom hook for animated counter
function useAnimatedCounter(end, duration = 2000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime = null;
        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const progress = currentTime - startTime;
            const percentage = Math.min(progress / duration, 1);

            // Ease out quad
            const easeOut = percentage * (2 - percentage);
            setCount(Math.floor(easeOut * end));

            if (percentage < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [end, duration]);

    return count;
}

const StatCard = ({ icon: Icon, label, value, delay }) => {
    const displayValue = useAnimatedCounter(typeof value === 'number' ? value : parseInt(value.replace(/,/g, '')));
    const suffix = typeof value === 'string' && value.includes('k') ? 'k' : '';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="stat-card p-6 flex flex-col justify-between h-32"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-semibold text-text-muted mb-1">{label}</p>
                    <h3 className="text-3xl font-heading font-bold text-text-main">
                        {displayValue.toLocaleString()}{suffix}
                    </h3>
                </div>
                <div className="p-3 rounded-xl bg-surface-2 border border-border">
                    <Icon className="w-5 h-5 text-primary" />
                </div>
            </div>
        </motion.div>
    );
};

// Vanilla SVG Bar Chart
const ActivityChart = ({ data = [0, 0, 0, 0, 0, 0, 0] }) => {
    const max = Math.max(...data, 5); 
    const labels = [];
    const today = new Date();
    
    // Generate labels for last 7 days including today
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    return (
        <div className="card-premium p-6 flex flex-col h-full min-h-[300px]">
            <h3 className="text-lg font-heading font-bold mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Upload Activity (Last 7 Days)
            </h3>
            
            <div className="flex-1 flex items-end justify-between gap-3 relative mt-4">
                {/* Horizontal Grid Lines */}
                <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none">
                    <div className="w-full border-t border-border/30 h-0"></div>
                    <div className="w-full border-t border-border/30 h-0"></div>
                    <div className="w-full border-t border-border/30 h-0"></div>
                    <div className="w-full border-b border-border/50 h-0"></div>
                </div>

                {/* Bars */}
                {data.map((val, idx) => {
                    const heightPercent = (val / max) * 100;
                    return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full z-10 group relative">
                            {/* Bar Container */}
                            <div className="w-full max-w-[32px] bg-primary/5 rounded-t-lg relative flex items-end justify-center h-full overflow-hidden">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${Math.max(heightPercent, val > 0 ? 5 : 0)}%` }}
                                    transition={{ 
                                        type: "spring",
                                        damping: 20,
                                        stiffness: 100,
                                        delay: idx * 0.1 
                                    }}
                                    className="w-full bg-gradient-to-t from-primary to-primary-light rounded-t-lg relative cursor-pointer shadow-[0_0_15px_rgba(108,99,255,0.3)] group-hover:brightness-125 transition-all"
                                >
                                    {/* Tooltip on hover */}
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-border text-[10px] font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-20 pointer-events-none">
                                        {val} uploads
                                    </div>
                                </motion.div>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted mt-3 group-hover:text-primary transition-colors uppercase tracking-tight">
                                {labels[idx]}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default function Dashboard({ user }) {
    const [stats, setStats] = useState({ downloads: 0, uploads: 0, views: 892, streak: 14 });
    const [recentNotes, setRecentNotes] = useState([]);
    const [uploadActivity, setUploadActivity] = useState([0, 0, 0, 0, 0, 0, 0]);
    const [loading, setLoading] = useState(true);
    const [activeCourses, setActiveCourses] = useState([]);

    const onDownloadNote = async (note) => {
        try {
            if (window.showToast) window.showToast("Starting download...", "info");
            const urlParts = note.file_url.split('.');
            const extension = urlParts.length > 1 ? urlParts.pop() : 'pdf';
            const fileName = `${note.title || 'note'}.${extension}`;
            await handleDownload(note.file_url, note.id, fileName);
            if (window.showToast) window.showToast("Download started!", "success");
        } catch (error) {
            console.error("Download failed:", error);
            if (window.showToast) window.showToast("Download failed", "error");
        }
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                // Fetch stats
                const { data: notesData, error: notesError } = await supabase
                    .from('notes')
                    .select('id, downloads');

                if (notesError) throw notesError;

                const totalUploads = notesData.length;
                const totalDownloads = notesData.reduce((acc, curr) => acc + (curr.downloads || 0), 0);

                setStats(prev => ({ ...prev, uploads: totalUploads, downloads: totalDownloads }));

                // Fetch recent notes
                const { data: recent, error: recentError } = await supabase
                    .from('notes')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (recentError) throw recentError;
                setRecentNotes(recent || []);

                // Fetch upload activity for last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                
                const { data: activityData, error: activityError } = await supabase
                    .from('notes')
                    .select('created_at')
                    .gte('created_at', sevenDaysAgo.toISOString());

                if (activityError) throw activityError;

                const counts = new Array(7).fill(0);
                const now = new Date();
                activityData.forEach(item => {
                    const createdDate = new Date(item.created_at);
                    const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
                    if (diffDays >= 0 && diffDays < 7) {
                        counts[6 - diffDays]++;
                    }
                });
                setUploadActivity(counts);

                // Load course progress
                const progressData = loadProgress();
                const ongoing = [];
                for (const cat of COURSES_DATA) {
                    for (const course of cat.courses) {
                        const key = cat.id + "_" + course.id;
                        const states = progressData[key] || {};
                        const completedCount = Object.values(states).filter(Boolean).length;
                        if (completedCount > 0) {
                            ongoing.push({
                                ...course,
                                categoryName: cat.lang,
                                catColor: cat.color,
                                completedCount,
                                totalLessons: course.lessons.length,
                                pct: Math.round((completedCount / course.lessons.length) * 100)
                            });
                        }
                    }
                }
                // Sort by most recently interacted or highest progress (we'll just sort by pct desc)
                setActiveCourses(ongoing.sort((a,b) => b.pct - a.pct));

            } catch (error) {
                console.error("Dashboard fetch error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Scholar";

    const currentDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    const trendingSubjects = [
        { name: "Computer Science", count: 1240 },
        { name: "Mathematics", count: 980 },
        { name: "Physics", count: 850 },
        { name: "Biology", count: 640 },
        { name: "Business", count: 420 }
    ];

    const deadlines = [
        { id: 1, title: "Calculus Assignment", date: "Tomorrow", priority: "high" },
        { id: 2, title: "Physics Group Quiz", date: "Mar 18, 2026", priority: "med" },
        { id: 3, title: "Submit Lab Reports", date: "Mar 20, 2026", priority: "low" },
    ];

    const tasks = [
        { id: 1, text: "Review Lecture 4 Videos", completed: false },
        { id: 2, text: "Download DS PDF", completed: true },
        { id: 3, text: "Check Community Forum", completed: false },
    ];

    const communityStats = [
        { label: "Active Students", value: "12,402", icon: Users },
        { label: "Verified Resources", value: "85k+", icon: CheckSquare },
    ];

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-sora font-extrabold text-text-main tracking-tighter">
                        Welcome back, <span className="text-primary">{displayName}</span> 👋
                    </h1>
                    <p className="text-text-muted font-medium">{currentDate} • Computer Science</p>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard icon={FileUp} label="Total Uploads" value={stats.uploads} delay={0.1} />
                    <StatCard icon={Download} label="Total Downloads" value={stats.downloads} delay={0.2} />
                    <StatCard icon={Eye} label="Views This Week" value={stats.views} delay={0.3} />
                    <StatCard icon={Flame} label="Streak Days" value={stats.streak} delay={0.4} />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* SVG Bar Chart */}
                    <div className="xl:col-span-2">
                        <ActivityChart data={uploadActivity} />
                    </div>

                    {/* Course Progress */}
                    {activeCourses.length > 0 ? (
                        <div className="card-premium p-6 flex flex-col max-h-[400px]">
                            <div className="flex items-center justify-between mb-5 shrink-0">
                                <h3 className="text-lg font-heading font-bold flex items-center gap-2 text-white line-clamp-1">
                                    <BookOpen className="w-5 h-5 text-primary shrink-0" />
                                    Course Progress
                                </h3>
                            </div>
                            <div className="flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-1">
                                {activeCourses.map(c => (
                                    <div key={c.id} className="p-4 rounded-2xl border border-border bg-surface hover:border-primary/50 transition-colors group cursor-pointer">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md border text-text-muted">
                                                {c.categoryName}
                                            </span>
                                            {c.pct === 100 && <span className="text-[10px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">Done</span>}
                                        </div>
                                        <h4 className="text-sm font-bold text-text-main group-hover:text-primary transition-colors leading-tight mb-3 line-clamp-2">{c.title}</h4>
                                        <div className="flex justify-between text-[10px] font-semibold text-text-muted mb-1.5">
                                            <span>{c.completedCount}/{c.totalLessons}</span>
                                            <span style={{ color: c.catColor }}>{c.pct}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-surface-2 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000"
                                                 style={{ width: c.pct + "%", background: `linear-gradient(90deg, ${c.catColor}, #a78bfa)` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="card-premium p-6 flex flex-col items-center justify-center text-center max-h-[400px]">
                            <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
                                <BookOpen className="w-8 h-8 text-text-muted" />
                            </div>
                            <h3 className="text-lg font-heading font-bold text-text-main mb-2">No Active Courses</h3>
                            <p className="text-sm text-text-muted mb-6">Start learning to see your progress here.</p>
                            <a href="/dashboard" className="px-5 py-2.5 bg-primary/10 text-primary font-bold rounded-xl hover:bg-primary/20 transition-colors text-sm">
                                Browse Courses
                            </a>
                        </div>
                    )}
                </div>

                {/* Recently Uploaded Row */}
                <div className="space-y-4">
                    <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-text-main">
                        Recently Uploaded
                    </h2>
                    <div className="flex gap-6 overflow-x-auto pb-6 snap-x snap-mandatory hide-scrollbars">
                        {recentNotes.map((note) => (
                            <div key={note.id} className="min-w-[280px] snap-start">
                                <NoteCard note={{ ...note, onDownload: onDownloadNote }} userId={user?.id} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Sidebar: Academic Planner & Insights */}
            <div className="hidden lg:flex w-80 border-l border-border bg-surface flex-col overflow-hidden">
                <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                    
                    {/* Academic Calendar / Deadlines */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-text-main font-sora uppercase tracking-widest flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" />
                                Planner
                            </h3>
                            <button className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">View All</button>
                        </div>
                        <div className="space-y-3">
                            {deadlines.map((item) => (
                                <div key={item.id} className="p-4 rounded-2xl bg-surface-2 border border-border group hover:border-primary/50 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={cn(
                                            "text-[9px] font-black uppercase px-2 py-0.5 rounded-full border",
                                            item.priority === 'high' ? "bg-danger/10 text-danger border-danger/20" : 
                                            item.priority === 'med' ? "bg-warning/10 text-warning border-warning/20" : 
                                            "bg-success/10 text-success border-success/20"
                                        )}>
                                            {item.priority} Priority
                                        </span>
                                        <Clock className="w-3 h-3 text-text-muted group-hover:text-primary transition-colors" />
                                    </div>
                                    <h4 className="text-xs font-bold text-text-main line-clamp-1">{item.title}</h4>
                                    <p className="text-[10px] text-text-muted mt-1 font-medium italic">{item.date}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Quick To-Do List */}
                    <section>
                        <h3 className="text-sm font-black text-text-main font-sora uppercase tracking-widest flex items-center gap-2 mb-4">
                            <CheckSquare className="w-4 h-4 text-secondary" />
                            Study Tasks
                        </h3>
                        <div className="space-y-2">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-2 transition-colors cursor-pointer group">
                                    <div className={cn(
                                        "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                                        task.completed ? "bg-success border-success" : "border-border bg-surface group-hover:border-primary"
                                    )}>
                                        {task.completed && <Activity className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className={cn(
                                        "text-xs font-medium transition-all",
                                        task.completed ? "text-text-muted line-through" : "text-text-main group-hover:text-primary"
                                    )}>
                                        {task.text}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Community Insights */}
                    <div className="p-5 rounded-3xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all" />
                        <h4 className="text-xs font-black text-primary font-sora uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            Global Pulse
                        </h4>
                        <div className="grid grid-cols-1 gap-4">
                            {communityStats.map((stat, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-surface border border-border shadow-sm">
                                        <stat.icon className="w-4 h-4 text-text-muted" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider leading-none mb-1">{stat.label}</p>
                                        <p className="text-sm font-bold text-text-main font-sora">{stat.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Goal */}
                    <div className="card-premium p-6 border-warning/20 bg-warning/5 group">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-2xl bg-warning/20 flex items-center justify-center">
                                <Trophy className="w-6 h-6 text-warning" />
                            </div>
                            <div>
                                <h4 className="text-xs font-black text-warning uppercase tracking-widest leading-none mb-1">Weekly Goal</h4>
                                <p className="text-sm font-bold text-text-main">80% Mastery</p>
                            </div>
                        </div>
                        <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                            <div className="h-full bg-warning w-[65%] group-hover:w-[75%] transition-all duration-700 shadow-[0_0_10px_rgba(255,171,0,0.4)]" />
                        </div>
                        <p className="text-[10px] text-text-muted mt-3 font-medium">Keep it up! You're almost at your target.</p>
                    </div>

                </div>
            </div>
        </div>
    );
}
