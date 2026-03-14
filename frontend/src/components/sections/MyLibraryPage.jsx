import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Trash2, FileUp, Loader2, Bookmark } from "lucide-react";
import { getBookmarkedNotes, getNotes, handleDownload } from "../../services/notesService";
import NotesList from "../NotesList";

export default function MyLibraryPage({ user }) {
    const [activeTab, setActiveTab] = useState("Bookmarks");
    const [searchQuery, setSearchQuery] = useState("");
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = ["Bookmarks", "My Uploads"];

    useEffect(() => {
        if (user) {
            fetchLibraryData();
        }
    }, [activeTab, user]);

    const fetchLibraryData = async () => {
        try {
            setLoading(true);
            let data = [];
            if (activeTab === "Bookmarks") {
                data = await getBookmarkedNotes(user.id);
            } else {
                // For simplicity, let's just fetch all notes and filter logic-wise 
                // In a real app, we'd filter by user_id in the service
                const allNotes = await getNotes();
                data = allNotes.filter(n => n.user_id === user.id);
            }
            setNotes(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
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
    return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {/* Header */}
            <div className="p-6 md:p-8 border-b border-border bg-surface shrink-0">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-white tracking-tight">My Library</h1>
                        <p className="text-text-muted mt-1">Manage your saved materials and uploads.</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input
                                type="text"
                                placeholder="Search library..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-field pl-10 h-10 py-1 w-full"
                            />
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-border/50">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 font-semibold text-sm transition-colors relative ${activeTab === tab ? "text-primary" : "text-text-muted hover:text-text-main"}`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="library-tab"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary shadow-[0_0_8px_rgba(108,99,255,0.8)]"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 shrink-0 pb-20">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                ) : (
                    <NotesList notes={notes} loading={loading} onDownloadNote={onDownloadNote} userId={user?.id} />
                )}

                {!loading && notes.length === 0 && activeTab === "My Uploads" && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-80 mt-16 pb-20">
                        <div className="w-24 h-24 mb-6 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                            <div className="text-7xl relative z-10 drop-shadow-2xl">📂</div>
                        </div>
                        <h3 className="text-2xl font-heading font-bold text-white mb-2">You haven't uploaded anything yet</h3>
                        <p className="text-text-muted max-w-md mb-8">
                            Share your study materials to help others and build your academic profile.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
