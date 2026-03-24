import { useState, useEffect, useMemo } from "react";
import { SlidersHorizontal, Check, Flame, Loader2, SortAsc, Clock, DownloadCloud, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { getNotes, handleDownload } from "../../services/notesService";
import { supabase } from "../../lib/supabaseClient";
import NotesList from "../NotesList";
import EditNoteModal from "../EditNoteModal";
import RatingModal from "../ui/RatingModal";

const trendingTags = ["Computer Science", "Database Systems", "Discrete Math", "Quantum Physics", "Macroeconomics", "English Literature"];

const subjects = [
    { id: 'Computer Science', label: 'Computer Science' },
    { id: 'Mathematics', label: 'Mathematics' },
    { id: 'Physics', label: 'Physics' },
    { id: 'Business', label: 'Business & Econ' },
    { id: 'Biology', label: 'Biology' },
    { id: 'English Literature', label: 'English Literature' }
];

const fileTypes = [
    { id: 'pdf', label: 'PDF Documents' },
    { id: 'docx', label: 'Word Files' },
    { id: 'pptx', label: 'Presentations' }
];

const semesters = [
    { id: '1', label: 'Semester 1' },
    { id: '2', label: 'Semester 2' },
    { id: '3', label: 'Semester 3' },
    { id: '4', label: 'Semester 4+' }
];

const sortOptions = [
    { id: 'Trending', label: 'Trending', icon: Flame },
    { id: 'Newest', label: 'Newest', icon: Clock },
    { id: 'Most Downloaded', label: 'Most Downloaded', icon: DownloadCloud }
];

export default function BrowsePage({ user }) {
    const [searchQuery, setSearchQuery] = useState("");
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSort, setSelectedSort] = useState("Trending");
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedTypes, setSelectedTypes] = useState([]);
    const [selectedSemesters, setSelectedSemesters] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [ratingNote, setRatingNote] = useState(null);

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
    }, [searchQuery]);


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

    const filteredAndSortedNotes = useMemo(() => {
        let result = [...notes];

        // 1. Filtering
        if (selectedSubjects.length > 0) {
            result = result.filter(n => 
                n.subject && selectedSubjects.some(s => s.toLowerCase() === n.subject.toLowerCase())
            );
        }
        
        if (selectedTypes.length > 0) {
            result = result.filter(n => {
                const ext = n.file_url?.split('.').pop()?.toLowerCase();
                // Match common extensions
                if (selectedTypes.includes('pptx') && (ext === 'ppt' || ext === 'pptx')) return true;
                if (selectedTypes.includes('docx') && (ext === 'doc' || ext === 'docx')) return true;
                return selectedTypes.includes(ext);
            });
        }

        if (selectedSemesters.length > 0) {
            result = result.filter(n => {
                if (!n.semester) return false;
                const semValue = String(n.semester).toLowerCase();
                return selectedSemesters.some(id => 
                    semValue === id.toLowerCase() || 
                    semValue.includes(id) ||
                    (id === '4' && parseInt(semValue.replace(/\D/g, '')) >= 4)
                );
            });
        }

        // 2. Sorting
        if (selectedSort === "Newest") {
            result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } else if (selectedSort === "Most Downloaded") {
            result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        } else if (selectedSort === "Trending") {
            // Mix of downloads and rating
            result.sort((a, b) => {
                const scoreA = (a.downloads || 0) * 2 + (a.rating || 0) * 10;
                const scoreB = (b.downloads || 0) * 2 + (b.rating || 0) * 10;
                return scoreB - scoreA;
            });
        }

        return result.map(n => ({ ...n, isOwner: user?.id && n.user_id === user.id }));
    }, [notes, selectedSort, selectedSubjects, selectedTypes, selectedSemesters, user?.id]);

    const onDownloadNote = async (note) => {
        try {
            if (window.showToast) window.showToast("Starting download...", "info");
            
            const urlParts = note.file_url.split('.');
            const extension = urlParts.length > 1 ? urlParts.pop() : 'pdf';
            const fileName = `${note.title || 'note'}.${extension}`;
            
            await handleDownload(note.file_url, note.id, fileName);
            if (window.showToast) window.showToast("Download complete!", "success");

            // Prompt user to rate after download
            setRatingNote(note);
        } catch (error) {
            console.error("Download failed:", error);
            if (window.showToast) window.showToast("Download failed", "error");
        }
    };

    // Update the note's rating in local state after user submits a rating
    const handleRated = (noteId, newAvgRating) => {
        if (newAvgRating === undefined) return;
        setNotes(prev =>
            prev.map(n => n.id === noteId ? { ...n, rating: newAvgRating } : n)
        );
    };
    
    const handleEditNote = (note) => {
        setEditingNote(note);
    };

    const handleNoteUpdated = (updatedNote) => {
        setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    };

    const handleNoteDeleted = (deletedNoteId) => {
        setNotes(prev => prev.filter(n => n.id !== deletedNoteId));
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
                    <div className="space-y-2">
                        {sortOptions.map(option => (
                            <button 
                                key={option.id}
                                onClick={() => setSelectedSort(option.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 border group",
                                    selectedSort === option.id 
                                        ? "bg-primary/10 border-primary/20 text-text-main" 
                                        : "bg-transparent border-transparent text-text-muted hover:bg-surface-2"
                                )}
                            >
                                <option.icon className={cn(
                                    "w-4 h-4 transition-colors",
                                    selectedSort === option.id ? "text-primary" : "text-text-muted group-hover:text-text-main"
                                )} />
                                <span className={cn(
                                    "text-sm font-semibold",
                                    selectedSort === option.id ? "text-text-main" : "text-text-muted group-hover:text-text-main"
                                )}>{option.label}</span>
                                {selectedSort === option.id && (
                                    <div className="ml-auto w-1 h-1 rounded-full bg-primary shadow-[0_0_8px_white]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Subjects */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">Subject</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {subjects.map(subj => (
                            <button 
                                key={subj.id}
                                onClick={() => toggleFilter(selectedSubjects, setSelectedSubjects, subj.id)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                                    selectedSubjects.includes(subj.id) ? "bg-primary/5 text-primary" : "text-text-muted hover:bg-surface-2"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    selectedSubjects.includes(subj.id) ? "bg-primary border-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedSubjects.includes(subj.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{subj.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* File Types */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">File Type</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {fileTypes.map(type => (
                            <button 
                                key={type.id}
                                onClick={() => toggleFilter(selectedTypes, setSelectedTypes, type.id)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                                    selectedTypes.includes(type.id) ? "bg-primary/5 text-primary" : "text-text-muted hover:bg-surface-2"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    selectedTypes.includes(type.id) ? "bg-primary border-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedTypes.includes(type.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{type.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* Semesters */}
                <div className="mb-10">
                    <h4 className="text-[11px] font-bold text-text-muted/60 uppercase tracking-[0.2em] mb-4">Semester</h4>
                    <div className="grid grid-cols-1 gap-1">
                        {semesters.map(sem => (
                            <button 
                                key={sem.id}
                                onClick={() => toggleFilter(selectedSemesters, setSelectedSemesters, sem.id)}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                                    selectedSemesters.includes(sem.id) ? "bg-primary/5 text-primary" : "text-text-muted hover:bg-surface-2"
                                )}
                            >
                                <div className={cn(
                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                    selectedSemesters.includes(sem.id) ? "bg-primary border-primary" : "border-border group-hover:border-text-muted"
                                )}>
                                    {selectedSemesters.includes(sem.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="text-sm font-medium">{sem.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* Main Content Grid */}
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-background/50">
                <div className="max-w-7xl mx-auto">
                    {/* Search & Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                        <div className="flex-1 max-w-2xl relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by topic, course, or subject..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface border border-border rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex items-center gap-3 bg-surface-2 px-5 py-2.5 rounded-2xl border border-border shadow-sm">
                            <Flame className="w-5 h-5 text-primary fill-primary/20" />
                            <div>
                                <h2 className="text-sm font-black text-text-main font-sora leading-none mb-1">
                                    Browse Library
                                </h2>
                                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                                    {filteredAndSortedNotes.length} resources found
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tags */}
                    {!searchQuery && (
                        <div className="flex flex-wrap gap-2 mb-10">
                            {trendingTags.map((tag, idx) => (
                                <button key={idx} className="px-4 py-2 rounded-xl bg-surface border border-border text-xs font-black text-text-muted hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm">
                                    #{tag.replace(/\s+/g, '').toLowerCase()}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Grid/Loading/Empty State */}
                    <NotesList 
                        notes={filteredAndSortedNotes} 
                        loading={loading} 
                        onDownloadNote={onDownloadNote} 
                        onEditNote={handleEditNote}
                        userId={user?.id} 
                    />

                    <EditNoteModal 
                        isOpen={!!editingNote} 
                        note={editingNote} 
                        onClose={() => setEditingNote(null)} 
                        onUpdate={handleNoteUpdated}
                        onDelete={handleNoteDeleted}
                    />

                    <RatingModal
                        isOpen={!!ratingNote}
                        note={ratingNote}
                        userId={user?.id}
                        onClose={() => setRatingNote(null)}
                        onRated={handleRated}
                    />

                    {/* Empty State */}
                    {!loading && filteredAndSortedNotes.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 rounded-3xl bg-surface-2 border border-border flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-text-muted/20" />
                            </div>
                            <h3 className="text-xl font-black text-text-main mb-2">No results found</h3>
                            <p className="text-text-muted max-w-xs mx-auto">
                                We couldn't find any notes matching your current filters or search query.
                            </p>
                            <button 
                                onClick={() => {
                                    setSelectedSubjects([]);
                                    setSelectedTypes([]);
                                    setSelectedSort("Trending");
                                }}
                                className="mt-8 text-sm font-bold text-primary hover:underline"
                            >
                                Clear all filters
                            </button>
                        </div>
                    )}

                    {/* Pagination */}
                    {filteredAndSortedNotes.length > 0 && (
                        <div className="mt-16 flex items-center justify-center">
                            <button className="group flex items-center gap-3 px-10 py-4 rounded-2xl bg-surface border border-border text-sm font-black text-text-main hover:border-primary transition-all shadow-sm">
                                <span>Discover More</span>
                                <SortAsc className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
