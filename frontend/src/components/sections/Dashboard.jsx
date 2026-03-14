import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FileUp, Download, Eye, Flame, Activity } from "lucide-react";
import NoteCard from "../ui/NoteCard";
import { handleDownload } from "../../services/notesService";
import { supabase } from "../../lib/supabaseClient";

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

    const activityFeed = [
        { id: 1, text: "You uploaded 'Calculus Midterm Notes'", time: "2 hrs ago", type: "upload" },
        { id: 2, text: "Someone downloaded your 'Data Structures' PDF", time: "4 hrs ago", type: "download" },
        { id: 3, text: "You reached a 5 day streak!", time: "1 day ago", type: "streak" },
        { id: 4, text: "Anna S. commented on your upload", time: "2 days ago", type: "interaction" },
    ];

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <h1 className="text-4xl font-sora font-extrabold text-text-main tracking-tighter">
                        Welcome back, <span className="text-primary">Sathya M</span> 👋
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

                    {/* Trending Subjects */}
                    <div className="card-premium p-6">
                        <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
                            <Flame className="w-5 h-5 text-warning" />
                            Trending Subjects
                        </h3>
                        <div className="flex flex-wrap gap-3">
                            {trendingSubjects.map((sub, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-surface-2 border border-border px-3 py-2 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                                    <span className="text-sm font-semibold text-text-main">{sub.name}</span>
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                                        {sub.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recently Uploaded Row */}
                <div className="space-y-4">
                    <h2 className="text-xl font-heading font-bold flex items-center gap-2 text-white">
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

            {/* Right Sidebar: Activity Feed */}
            <div className="hidden lg:block w-80 border-l border-border bg-surface p-6 overflow-y-auto">
                <h3 className="text-lg font-heading font-bold mb-6">Activity Feed</h3>
                <div className="space-y-6">
                    {activityFeed.map((item) => (
                        <div key={item.id} className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center shrink-0">
                                {item.type === 'upload' && <FileUp className="w-4 h-4 text-primary" />}
                                {item.type === 'download' && <Download className="w-4 h-4 text-success" />}
                                {item.type === 'streak' && <Flame className="w-4 h-4 text-warning" />}
                                {item.type === 'interaction' && <Eye className="w-4 h-4 text-text-muted" />}
                            </div>
                            <div>
                                <p className="text-sm text-text-main leading-snug">{item.text}</p>
                                <p className="text-xs text-text-muted mt-1">{item.time}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
