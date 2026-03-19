import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { updateNote, deleteNote } from "../services/notesService";

const subjects = ["Computer Science", "Physics", "Mathematics", "Biology", "Economics", "History", "English Literature"];

export default function EditNoteModal({ note, isOpen, onClose, onUpdate, onDelete }) {
    const [title, setTitle] = useState(note?.title || "");
    const [subject, setSubject] = useState(note?.subject || "");
    const [semester, setSemester] = useState(note?.semester || "");
    const [description, setDescription] = useState(note?.description || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (note) {
            setTitle(note.title || "");
            setSubject(note.subject || "");
            setSemester(note.semester || "");
            setDescription(note.description || "");
        }
    }, [note]);

    if (!isOpen) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        if (!title || !subject) return alert("Title and Subject are required.");

        setIsSaving(true);
        try {
            const updated = await updateNote(note.id, {
                title,
                subject,
                description,
                semester
            });
            if (window.showToast) window.showToast("Note updated successfully", "success");
            onUpdate(updated);
            onClose();
        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast("Failed to update note", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteNote(note.id, note.file_url);
            if (window.showToast) window.showToast("Note deleted successfully", "success");
            onDelete(note.id);
            onClose();
        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast("Failed to delete note", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-xl bg-surface border border-border rounded-3xl overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Save className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white font-sora">Edit Note</h2>
                                <p className="text-xs text-text-muted">Update your resource details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl hover:bg-surface-2 text-text-muted hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSave} className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-text-main mb-1.5">Note Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g. Artificial Intelligence Basics"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-1.5">Subject</label>
                                    <select
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        className="input-field cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select subject</option>
                                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-1.5">Semester</label>
                                    <input
                                        type="text"
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                        className="input-field"
                                        placeholder="e.g. 4th Sem"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-text-main mb-1.5">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="input-field min-h-[120px] resize-none"
                                    placeholder="What's this note about?"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-6 border-t border-border">
                            {!showDeleteConfirm ? (
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="flex items-center gap-2 text-danger hover:text-red-400 font-bold text-sm transition-colors py-2 px-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete Note</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Are you sure?
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-danger text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-red-600 transition-colors flex items-center gap-2"
                                    >
                                        {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Confirm"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        className="text-text-muted hover:text-white text-xs font-bold"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn btn-ghost"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="btn btn-primary min-w-[120px] flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
