import NoteCard from "./ui/NoteCard";
import { Loader2, X } from "lucide-react";

export default function NotesList({ notes, loading, onDownloadNote, onEditNote, userId }) {
    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-text-muted animate-pulse font-medium">Fetching latest notes...</p>
            </div>
        );
    }

    if (notes.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 gap-4 border-2 border-dashed border-border rounded-3xl">
                <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center text-text-muted">
                    <X className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-text-main">No notes found</h3>
                <p className="text-text-muted text-center max-w-xs">Be the first to share your knowledge with the student community!</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {notes.map((note) => (
                <NoteCard key={note.id} note={{ ...note, onDownload: onDownloadNote }} userId={userId} onEdit={onEditNote} />
            ))}
        </div>
    );
}

