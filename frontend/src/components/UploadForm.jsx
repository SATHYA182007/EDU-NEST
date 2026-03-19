import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, ChevronRight, X } from "lucide-react";
import NoteCard from "./ui/NoteCard";
import { uploadNote } from "../services/notesService";

const steps = ["Upload File", "Note Details", "Preview & Publish"];
const subjects = ["Computer Science", "Physics", "Mathematics", "Biology", "Economics", "History", "English Literature"];

export default function UploadForm({ user }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [isUploading, setIsUploading] = useState(false);

    // Form State
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [subject, setSubject] = useState("");
    const [semester, setSemester] = useState("");
    const [description, setDescription] = useState("");

    // Tags logic (just UI per user instructions, but we keep it since it was there)
    const [tags, setTags] = useState([]);
    const [tagInput, setTagInput] = useState("");

    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) validateAndSetFile(selected);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const selected = e.dataTransfer.files[0];
        if (selected) validateAndSetFile(selected);
    };

    const validateAndSetFile = (f) => {
        const validTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"];
        const ext = f.name.split('.').pop().toLowerCase();

        if (validTypes.includes(f.type) || ['pdf', 'docx', 'ppt', 'pptx'].includes(ext)) {
            setFile(f);
            if (!title) setTitle(f.name.replace(/\.[^/.]+$/, ""));
        } else {
            alert("Only PDF, DOCX, or PPT files are allowed.");
        }
    };

    const addTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()]);
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const resetForm = () => {
        setFile(null);
        setTitle("");
        setSubject("");
        setSemester("");
        setDescription("");
        setTags([]);
        setCurrentStep(1);
    }

    const nextStep = () => {
        if (currentStep === 1 && !file) {
            if (window.showToast) window.showToast("Please select a file to upload first!", "error");
            else alert("Please select a file to upload first.");
            return;
        }
        if (currentStep === 2 && (!title || !subject)) {
            if (window.showToast) window.showToast("Please fill out the required title and subject details.", "error");
            else alert("Please fill out the required details.");
            return;
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handlePublish = async () => {
        if (!file || !title || !subject) return;

        setIsUploading(true);
        if (window.showToast) window.showToast("Uploading notice, please wait...", 'info');

        try {
            await uploadNote({
                file,
                title,
                subject,
                description,
                semester,
                userId: user?.id
            });

            if (window.showToast) window.showToast("Note Published Successfully!", 'success');
            resetForm();
        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast(`Upload failed: ${error.message}`, 'error');
            else alert(`Upload failed: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const mockNoteData = {
        title: title || "Untitled Note",
        subject: subject || "General",
        type: file ? file.name.split('.').pop().toUpperCase() : "PDF",
        author: user?.user_metadata?.full_name || "You",
        date: "Just now",
        downloads: 0
    };

    return (
        <div className="w-full max-w-3xl space-y-10 mt-4 hidden-scrollbar relative z-10">
            {/* Header & Progress Indicator */}
            <div className="text-center space-y-8">
                <h1 className="text-4xl font-heading font-extrabold text-text-main tracking-tight">Share Your Knowledge</h1>
                <div className="flex items-center justify-center pt-2">
                    {steps.map((label, idx) => {
                        const stepNum = idx + 1;
                        const active = currentStep === stepNum;
                        const completed = currentStep > stepNum;

                        return (
                            <div key={stepNum} className="flex items-center">
                                <div className={`flex flex-col items-center relative ${active ? 'scale-110 shadow-[0_0_15px_rgba(108,99,255,0.4)] rounded-full' : ''} transition-transform`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 ${active ? 'border-primary bg-primary text-text-main' :
                                        completed ? 'border-success bg-success/10 text-success' :
                                            'border-border bg-surface-2 text-text-muted'
                                        } transition-colors z-10 relative`}>
                                        {completed ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                                    </div>
                                    <span className={`absolute -bottom-6 text-xs font-semibold whitespace-nowrap ${active ? 'text-primary' : 'text-text-muted'}`}>{label}</span>
                                </div>
                                {stepNum < steps.length && (
                                    <div className={`w-16 sm:w-24 md:w-32 h-1 mx-2 rounded-full ${completed ? 'bg-success' : 'bg-surface-2'} transition-colors`} />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Form Wrapper */}
            <div className="card-premium p-8 mt-12 bg-surface border border-border shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full pointer-events-none" />

                <AnimatePresence mode="wait">
                    {/* STEP 1 */}
                    {currentStep === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            <h2 className="text-2xl font-heading font-bold mb-4">Select your file</h2>
                            <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${file ? 'border-success bg-success/5' : 'border-border hover:border-primary/50 hover:bg-surface-2'}`}
                            >
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept=".pdf,.doc,.docx,.ppt,.pptx" />
                                {file ? (
                                    <>
                                        <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-4 text-success">
                                            <FileText className="w-8 h-8" />
                                        </div>
                                        <p className="font-bold text-lg text-text-main mb-1">{file.name}</p>
                                        <p className="text-sm text-text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        <button className="mt-4 text-sm text-primary hover:underline font-semibold" onClick={(e) => { e.stopPropagation(); setFile(null); }}>Remove and select another</button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-surface-2 rounded-full flex items-center justify-center mb-4 text-text-muted"><UploadCloud className="w-8 h-8" /></div>
                                        <p className="font-bold text-lg text-text-main mb-2">Click to upload or drag and drop</p>
                                        <p className="text-sm text-text-muted">PDF, DOCX, or PPT up to 50MB</p>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            <h2 className="text-2xl font-heading font-bold mb-6">Note Details</h2>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-bold text-text-main mb-1.5">Title <span className="text-danger">*</span></label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" placeholder="e.g. Chapter 4: Thermodynamics" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-bold text-text-main mb-1.5">Subject <span className="text-danger">*</span></label><select value={subject} onChange={(e) => setSubject(e.target.value)} className="input-field appearance-none cursor-pointer"><option value="" disabled>Select a subject...</option>{subjects.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                    <div><label className="block text-sm font-bold text-text-main mb-1.5">Semester</label><input type="text" value={semester} onChange={(e) => setSemester(e.target.value)} className="input-field" placeholder="e.g. Fall 2026" /></div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-text-main mb-1.5">Tags</label>
                                    <div className="bg-surface-2 border border-border rounded-lg p-2 min-h-[48px] flex flex-wrap gap-2 items-center focus-within:border-primary focus-within:border-2 transition-colors">
                                        {tags.map(tag => (
                                            <span key={tag} className="flex items-center gap-1 bg-surface py-1 px-2.5 rounded border border-border text-sm font-semibold">{tag}<X className="w-3 h-3 cursor-pointer hover:text-danger" onClick={() => removeTag(tag)} /></span>
                                        ))}
                                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={addTag} className="flex-1 bg-transparent border-none outline-none text-sm text-text-main px-2 py-1 min-w-[120px]" placeholder="Type and press enter..." />
                                    </div>
                                </div>
                                <div><label className="block text-sm font-bold text-text-main mb-1.5">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} className="input-field min-h-[100px] resize-y" placeholder="Add context about these notes..." /></div>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 3 */}
                    {currentStep === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-6">
                            <h2 className="text-2xl font-heading font-bold mb-2">Preview & Publish</h2>
                            <p className="text-text-muted mb-8 text-sm">This is how your note will appear to others in the Browse section.</p>
                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="mx-auto md:w-[320px] shrink-0 pointer-events-none shadow-2xl rounded-2xl border border-border"><NoteCard note={mockNoteData} /></div>
                                <div className="flex-1 space-y-4 w-full">
                                    <div className="p-5 rounded-xl bg-surface-2 border border-border list-none space-y-3">
                                        <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-text-muted text-sm">File Size</span><span className="font-semibold text-sm">{(file?.size / 1024 / 1024).toFixed(2)} MB</span></div>
                                        <div className="flex justify-between border-b border-border/50 pb-2"><span className="text-text-muted text-sm">Visibility</span><span className="font-semibold text-sm text-success">Public</span></div>
                                        <div className="flex justify-between"><span className="text-text-muted text-sm">Tags</span><span className="font-semibold text-sm">{tags.length} added</span></div>
                                    </div>
                                    <p className="text-xs text-text-muted italic text-center md:text-left pt-2 leading-relaxed">By publishing, you confirm that this material does not violate any university honor codes or copyright policies.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="mt-10 flex justify-between pt-6 border-t border-border">
                    <button onClick={prevStep} className={`btn btn-ghost ${currentStep === 1 ? 'invisible' : ''}`} disabled={isUploading}>Back</button>
                    {currentStep < 3 ? (
                        <button onClick={nextStep} className="btn btn-primary">Next Step <ChevronRight className="w-4 h-4" /></button>
                    ) : (
                        <div className="flex gap-3">
                            <button className="btn btn-ghost hover:bg-warning/10 hover:border-warning/30 hover:text-warning" disabled={isUploading} onClick={() => { window.showToast && window.showToast("Saved as Draft", 'success'); resetForm(); }}>Save Draft</button>
                            <button className="btn btn-primary shadow-[0_0_15px_rgba(45,212,160,0.4)] bg-success hover:bg-emerald-500 flex gap-2 items-center" disabled={isUploading} onClick={handlePublish}>
                                {isUploading && <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent" />}
                                {isUploading ? "Publishing..." : "Publish Note"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
