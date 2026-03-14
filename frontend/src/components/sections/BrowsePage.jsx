import { useState, useEffect } from "react";
import { SlidersHorizontal, Check, Flame, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { getNotes, handleDownload } from "../../services/notesService";
import { supabase } from "../../lib/supabaseClient";
import NotesList from "../NotesList";

const trendingTags = ["Computer Science", "Database Systems", "Discrete Math", "Quantum Physics", "Macroeconomics"];

const subjects = [
    { id: 'cs', label: 'Computer Science' },
    { id: 'math', label: 'Mathematics' },
    { id: 'physics', label: 'Physics' },
    { id: 'business', label: 'Business & Econ' },
    { id: 'bio', label: 'Biology' }
];

const fileTypes = [
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'docx', label: 'Word Files' },
    { id: 'ppt', label: 'Presentations' }
];

const semesters = [
    { id: 's1', label: 'Semester 1' },
    { id: 's2', label: 'Semester 2' },
    { id: 's3', label: 'Semester 3' },
    { id: 's4+', label: 'Semester 4+' }
];

export default function BrowsePage({ searchQuery = "", user }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSort, setSelectedSort] = useState("Trending");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedSemesters, setSelectedSemesters] = useState([]);

    useEffect(() => {
        fetchNotes();

        const channel = supabase
            .channel('public:notes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotes(prev => [payload.new, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
                } else if (payload.eventType === 'DELETE') {
                    setNotes(prev => prev.filter(n => n.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [searchQuery]); // Refetch when search query changes


    const fetchNotes = async () => {
        try {
            setLoading(true);
            const data = await getNotes(searchQuery);
            setNotes(data || []);
        } catch (error) {
            console.error("Error fetching notes:", error);
            if (window.showToast) window.showToast("Failed to load notes", "error");
        } finally {
            setLoading(false);
        }
    };

    const onDownloadNote = async (note) => {
        try {
            if (window.showToast) window.showToast("Starting download...", "info");
            
            // Extract the original extension from the file_url
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

    const toggleFilter = (list, setList, item) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item));
        } else {
            setList([...list, item]);
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Secondary Filter Sidebar */}
            <aside className="w-[220px] border-r border-border bg-surface/30 px-6 py-8 overflow-y-auto shrink-0 hidden lg:block custom-scrollbar">
                <div className="flex items-center gap-2 mb-8">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-bold text-text-main font-sora uppercase tracking-wider">Filters</h3>
                </div>

                {/* Sort By */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">Sort By</h4>
                    <div className="space-y-3">
                        {["Trending", "Newest", "Most Downloaded"].map(option => (
                            <label key={option} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                                    selectedSort === option ? "border-primary bg-primary/10" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedSort === option && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                </div>
                                <input
                                    type="radio"
                                    className="hidden"
                                    name="sort"
                                    checked={selectedSort === option}
                                    onChange={() => setSelectedSort(option)}
                                />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    selectedSort === option ? "text-text-main font-bold" : "text-text-muted group-hover:text-text-main"
                                )}>{option}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Subjects */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">Subject</h4>
                    <div className="space-y-3">
                        {subjects.map(subj => (
                            <label key={subj.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                    selectedSubjects.includes(subj.id) ? "border-primary bg-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedSubjects.includes(subj.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    onChange={() => toggleFilter(selectedSubjects, setSelectedSubjects, subj.id)}
                                />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    selectedSubjects.includes(subj.id) ? "text-text-main font-bold" : "text-text-muted group-hover:text-text-main"
                                )}>{subj.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* File Types */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">File Type</h4>
                    <div className="space-y-3">
                        {fileTypes.map(type => (
                            <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                    selectedTypes.includes(type.id) ? "border-primary bg-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedTypes.includes(type.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    onChange={() => toggleFilter(selectedTypes, setSelectedTypes, type.id)}
                                />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    selectedTypes.includes(type.id) ? "text-text-main font-bold" : "text-text-muted group-hover:text-text-main"
                                )}>{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Semesters */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">Semester</h4>
                    <div className="space-y-3">
                        {semesters.map(sem => (
                            <label key={sem.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className={cn(
                                    "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                                    selectedSemesters.includes(sem.id) ? "border-primary bg-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedSemesters.includes(sem.id) && <Check className="w-3 h-3 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    onChange={() => toggleFilter(selectedSemesters, setSelectedSemesters, sem.id)}
                                />
                                <span className={cn(
                                    "text-sm font-medium transition-colors",
                                    selectedSemesters.includes(sem.id) ? "text-text-main font-bold" : "text-text-muted group-hover:text-text-main"
                                )}>{sem.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content Grid */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-7xl mx-auto">
                    {/* Trending Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-2xl border border-primary/20">
                            <Flame className="w-5 h-5 text-primary fill-primary/20" />
                            <span className="text-sm font-extrabold text-primary font-sora">
                                {searchQuery ? `Search Results for "${searchQuery}"` : "Trending in Education"}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                                {loading ? "Loading..." : `Showing ${notes.length} notes`}
                            </span>
                        </div>
                    </div>

                    {/* Tags */}
                    {!searchQuery && (
                        <div className="flex flex-wrap gap-2 mb-10">
                            {trendingTags.map((tag, idx) => (
                                <button key={idx} className="px-4 py-2 rounded-xl bg-surface-2 border border-border text-xs font-bold text-text-muted hover:border-primary hover:text-primary transition-all">
                                    {tag}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grid/Loading/Empty State */}
                    <NotesList notes={notes} loading={loading} onDownloadNote={onDownloadNote} userId={user?.id} />


                    {/* Pagination */}
                    {notes.length > 0 && (
                        <div className="mt-16 flex items-center justify-center">
                            <button className="px-8 py-3 rounded-2xl bg-surface-2 border border-border text-sm font-bold text-text-main hover:border-primary transition-all">
                                Load More Results
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
