import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, CheckCircle2 } from "lucide-react";
import { rateNote } from "../../services/notesService";

export default function RatingModal({ isOpen, note, userId, onClose, onRated }) {
    const [hovered, setHovered] = useState(0);
    const [selected, setSelected] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const labels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

    const handleSubmit = async () => {
        if (!selected || !userId || !note?.id) return;
        setSubmitting(true);
        try {
            const newAvg = await rateNote(userId, note.id, selected);
            setSubmitted(true);
            if (onRated) onRated(note.id, newAvg);
            setTimeout(() => {
                setSubmitted(false);
                setSelected(0);
                setHovered(0);
                onClose();
            }, 1500);
        } catch (err) {
            console.error(err);
            if (window.showToast) window.showToast("Failed to submit rating", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelected(0);
        setHovered(0);
        setSubmitted(false);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
                    onClick={handleClose}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.85, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.85, y: 30 }}
                        transition={{ type: "spring", damping: 20, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface border border-border rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
                    >
                        {/* Glow */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-warning/10 rounded-full blur-3xl pointer-events-none" />

                        {/* Close */}
                        <button
                            onClick={handleClose}
                            className="absolute top-4 right-4 p-2 rounded-xl text-text-muted hover:text-text-main hover:bg-surface-2 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {submitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center py-4 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-success" />
                                </div>
                                <h3 className="text-xl font-bold text-text-main mb-1">Thank you!</h3>
                                <p className="text-text-muted text-sm">Your rating has been submitted.</p>
                            </motion.div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="mb-6">
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Rate this resource</p>
                                    <h3 className="text-xl font-bold text-text-main leading-snug line-clamp-2">
                                        {note?.title || "Untitled Note"}
                                    </h3>
                                    <p className="text-sm text-text-muted mt-1">{note?.subject}</p>
                                </div>

                                {/* Overall Rating Display */}
                                {(note?.rating > 0) && (
                                    <div className="flex items-center gap-3 bg-surface-2 border border-border rounded-2xl px-4 py-3 mb-6">
                                        <div className="flex items-center gap-1">
                                            {[1,2,3,4,5].map(i => (
                                                <Star
                                                    key={i}
                                                    className={`w-4 h-4 ${i <= Math.round(note.rating) ? "text-warning fill-warning" : "text-border"}`}
                                                />
                                            ))}
                                        </div>
                                        <div>
                                            <span className="text-sm font-black text-text-main">{parseFloat(note.rating).toFixed(1)}</span>
                                            <span className="text-xs text-text-muted ml-1">overall rating</span>
                                        </div>
                                    </div>
                                )}

                                {/* Star Selector */}
                                <div className="flex flex-col items-center mb-8">
                                    <div className="flex gap-2 mb-3">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <motion.button
                                                key={star}
                                                whileHover={{ scale: 1.2 }}
                                                whileTap={{ scale: 0.9 }}
                                                onMouseEnter={() => setHovered(star)}
                                                onMouseLeave={() => setHovered(0)}
                                                onClick={() => setSelected(star)}
                                                className="p-1 transition-all"
                                            >
                                                <Star
                                                    className={`w-9 h-9 transition-all duration-150 ${
                                                        star <= (hovered || selected)
                                                            ? "text-warning fill-warning drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]"
                                                            : "text-border"
                                                    }`}
                                                />
                                            </motion.button>
                                        ))}
                                    </div>
                                    <AnimatePresence mode="wait">
                                        <motion.p
                                            key={hovered || selected}
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -5 }}
                                            className="text-sm font-bold text-text-muted h-5"
                                        >
                                            {labels[hovered || selected] || "Select a rating"}
                                        </motion.p>
                                    </AnimatePresence>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleClose}
                                        className="btn btn-ghost flex-1"
                                    >
                                        Skip
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={!selected || submitting}
                                        className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />
                                        ) : (
                                            "Submit Rating"
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
