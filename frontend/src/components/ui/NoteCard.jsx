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
            whileHover={{ y: -5 }}
            className="group bg-surface border border-border rounded-3xl overflow-hidden transition-all hover:shadow-2xl hover:shadow-primary/5 flex flex-col h-[420px]"
        >
            {/* Thumbnail Area */}
            <div className="h-40 bg-surface-2 relative flex items-center justify-center overflow-hidden border-b border-border">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:16px_16px]" />

                <div className="relative z-10 w-16 h-20 rounded-lg bg-surface border border-border shadow-xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <FileText className={cn(
                        "w-8 h-8",
                        fileType === "PDF" ? "text-danger" : fileType === "DOCX" ? "text-primary" : "text-warning"
                    )} />
                    <span className="text-[8px] font-black mt-2 tracking-tighter opacity-40 uppercase">{fileType}</span>
                </div>

                <div className="absolute top-4 right-4 z-20 flex gap-2">
                    <button
                        onClick={handleBookmark}
                        className={cn(
                            "p-2 rounded-xl bg-surface/80 backdrop-blur-md border border-border transition-all",
                            isBookmarked ? "text-primary border-primary/50" : "text-text-muted hover:text-primary"
                        )}
                    >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-primary")} />
                    </button>

                    {(note.isOwner || (userId && note.user_id && String(note.user_id) === String(userId))) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit && onEdit(note); }}
                            className="p-2 rounded-xl bg-primary/20 backdrop-blur-md border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all shadow-lg group/edit"
                            title="Edit Note"
                        >
                            <Pencil className="w-4 h-4 group-hover/edit:rotate-12 transition-transform" />
                        </button>
                    )}
                </div>
            </div>

            {/* Content Container */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase tracking-wider">
                        {note.subject || "CS"}
                    </span>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                onClick={(e) => { e.stopPropagation(); handleRate(star); }}
                                className={cn(
                                    "w-3 h-3 cursor-pointer transition-all",
                                    star <= Math.round(rating) ? "text-warning fill-warning" : "text-text-muted/40 hover:text-warning"
                                )}
                            />
                        ))}
                    </div>
                </div>

                <h3 className="text-base font-bold text-text-main font-sora line-clamp-2 leading-tight mb-4 group-hover:text-primary transition-colors">
                    {note.title || "Untitled Document"}
                </h3>

                <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center text-primary font-bold text-xs">
                            {avatarLetter}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-text-main">{authorName}</span>
                            <span className="text-[10px] text-text-muted">{note.created_at ? new Date(note.created_at).toLocaleDateString() : "Just now"}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-text-muted">
                        <div className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            <span className="text-[10px] font-bold">{note.downloads || 0}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hover Action */}
            <div className="p-4 pt-0">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (note.onDownload) note.onDownload(note);
                    }}
                    className="w-full btn btn-primary py-2.5 text-xs flex items-center justify-center gap-2 rounded-xl group/btn transition-all active:scale-95"
                >
                    <Download className="w-4 h-4 group-hover/btn:animate-bounce" />
                    <span>Download Resource</span>
                </button>
            </div>
        </motion.div>
    );
}
