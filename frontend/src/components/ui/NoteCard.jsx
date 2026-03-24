import { motion } from "framer-motion";
import { Download, Star, Bookmark, MoreVertical, FileText, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import { useState } from "react";
import { addBookmark, removeBookmark, rateNote } from "../../services/notesService";

export default function NoteCard({ note, userId, onEdit }) {
    const [isBookmarked, setIsBookmarked] = useState(note.isBookmarked || false);
    const [rating, setRating] = useState(note.rating || 0);
    const authorName = note.author || "Anonymous";
    const avatarLetter = authorName[0]?.toUpperCase() || "S";
    const fileType = (note.format || note.type || "PDF").toUpperCase();

    let badgeClass = "badge-pdf";
    if (fileType === "DOCX") badgeClass = "badge-docx";
    if (fileType === "PPT") badgeClass = "badge-ppt";

    const handleBookmark = async (e) => {
        e.stopPropagation();
        if (!userId) return alert("Please login to bookmark notes");
        try {
            if (isBookmarked) {
                await removeBookmark(userId, note.id);
                setIsBookmarked(false);
            } else {
                await addBookmark(userId, note.id);
                setIsBookmarked(true);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleRate = async (newRating) => {
        if (!userId) return alert("Please login to rate notes");
        try {
            await rateNote(userId, note.id, newRating);
            setRating(newRating);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -8, shadow: "var(--shadow-2xl)" }}
            className="group note-card flex flex-col h-[450px] relative overflow-hidden group"
        >
            {/* Thumbnail Area */}
            <div className="h-44 bg-surface-2 relative flex items-center justify-center overflow-hidden border-b border-border/50">
                <div className="absolute inset-0 opacity-5 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:20px_20px]" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <motion.div 
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    className="relative z-10 w-20 h-24 rounded-2xl bg-surface border border-border shadow-2xl flex flex-col items-center justify-center transition-all duration-500"
                >
                    <FileText className={cn(
                        "w-10 h-10 mb-2",
                        fileType === "PDF" ? "text-danger" : fileType === "DOCX" ? "text-primary" : "text-warning"
                    )} />
                    <span className="text-[10px] font-black tracking-widest opacity-40 uppercase">{fileType}</span>
                </motion.div>

                <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button
                        onClick={handleBookmark}
                        className={cn(
                            "p-2.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border shadow-lg transition-all",
                            isBookmarked ? "text-primary border-primary/30" : "text-text-muted hover:text-primary"
                        )}
                    >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-primary")} />
                    </button>

                    {(note.isOwner || (userId && note.user_id && String(note.user_id) === String(userId))) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(note); }}
                            className="p-2.5 rounded-xl bg-surface/90 backdrop-blur-md border border-border text-text-muted hover:text-primary transition-all shadow-lg"
                            title="Edit Note"
                        >
                            <Pencil className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-[0.1em]">
                        {note.subject || "General"}
                    </span>
                    <div className="flex items-center gap-1.5 bg-surface-2 px-2 py-1 rounded-lg border border-border">
                        <Star className={`w-3 h-3 ${rating > 0 ? "text-warning fill-warning" : "text-border"}`} />
                        <span className="text-[10px] font-black text-text-main">
                            {rating > 0 ? parseFloat(rating).toFixed(1) : "New"}
                        </span>
                    </div>
                </div>

                <h3 className="text-lg font-sora font-extrabold text-text-main line-clamp-2 leading-[1.3] mb-4 group-hover:text-primary transition-colors">
                    {note.title || "Untitled Document"}
                </h3>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border/50">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary p-[1px] shadow-lg">
                            <div className="w-full h-full rounded-xl bg-surface flex items-center justify-center text-primary font-bold text-sm">
                                {avatarLetter}
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black text-text-main uppercase tracking-tight">{authorName}</span>
                            <span className="text-[10px] text-text-muted font-bold opacity-60">{note.created_at ? new Date(note.created_at).toLocaleDateString() : "Active Member"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-text-muted bg-surface-2 px-2.5 py-1 rounded-lg border border-border">
                        <Download className="w-3 h-3" />
                        <span className="text-[10px] font-black">{note.downloads || 0}</span>
                    </div>
                </div>
            </div>

            {/* Action Area */}
            <div className="px-6 pb-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (note.onDownload) note.onDownload(note);
                    }}
                    className="w-full bg-primary text-white py-3.5 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 rounded-[1.25rem] shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all"
                >
                    <Download className="w-4 h-4" />
                    <span>Access Resource</span>
                </motion.button>
            </div>
        </motion.div>
    );
}
