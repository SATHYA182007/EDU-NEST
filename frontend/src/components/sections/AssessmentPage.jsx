import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    GraduationCap, BookOpen, Clock, CheckCircle2, AlertTriangle, 
    ArrowLeft, Award, ChevronRight, Loader2, Timer, ShieldAlert,
    RefreshCw, Download, Terminal, Cpu
} from "lucide-react";
import { supabase } from "../../lib/supabaseClient";
import { generateCertificate, generateAndUploadCertificate } from "../../utils/generateCertificate";

export default function AssessmentPage({ user, assessmentId, onBack, courseData }) {
    const [assessment, setAssessment] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState("start"); // "start", "quiz", "result"
    const [answers, setAnswers] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [tabSwitches, setTabSwitches] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const timerRef = useRef(null);

    // 1. Fetch Assessment & Questions
    useEffect(() => {
        async function fetchAssessmentData() {
            if (!assessmentId) {
                // Handle case where user reloads on /assessment page without params
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Fallback for courses without manual assessment mapping
                if (assessmentId.startsWith('fallback_')) {
                    const courseId = assessmentId.replace('fallback_', '');
                    
                    // 1. Try to find if we already auto-created this
                    const { data: existing } = await supabase
                        .from("assessments")
                        .select("*")
                        .eq("course_id", courseId)
                        .maybeSingle();

                    if (existing) {
                        setAssessment(existing);
                        setTimeLeft(existing.time_limit_minutes * 60);
                        
                        const { data: qsts } = await supabase
                            .from("assessment_questions")
                            .select("*")
                            .eq("assessment_id", existing.id);
                        
                        if (qsts && qsts.length >= 10) {
                            setQuestions(qsts.sort(() => Math.random() - 0.5));
                            setLoading(false);
                            return;
                        }
                    }

                    // 2. Otherwise create it (or upgrade existing if it has < 10 questions)
                    const { data: newAssess, error: nErr } = await supabase
                        .from("assessments")
                        .upsert({
                            course_id: courseId,
                            title: `${courseData?.title || 'Course'} Professional Mastery`,
                            total_marks: 10,
                            passing_percentage: 80,
                            time_limit_minutes: 30
                        }, { onConflict: 'course_id' })
                        .select()
                        .single();

                    if (nErr) throw nErr;

                    // Clean old questions if upgrading
                    if (existing) {
                        await supabase.from("assessment_questions").delete().eq("assessment_id", existing.id);
                    }

                    const masteryQuestions = [
                        { assessment_id: newAssess.id, question_text: "Which of the following describes the difference between 'char *p' and 'char a[]' in C?", options: ["They are identical in all contexts", "The array is a constant pointer, while the pointer can be reassigned", "The pointer allocates memory on the stack, the array on the heap", "Arrays cannot be indexed using bracket notation"], correct_answer: "The array is a constant pointer, while the pointer can be reassigned", marks: 1, order_index: 0 },
                        { assessment_id: newAssess.id, question_text: "What is the output of 'printf(\"%d\", 5 << 1);'?", options: ["5", "10", "2", "25"], correct_answer: "10", marks: 1, order_index: 1 },
                        { assessment_id: newAssess.id, question_text: "Which function is used to reallocate memory previously allocated by malloc?", options: ["alloc()", "new()", "realloc()", "resize()"], correct_answer: "realloc()", marks: 1, order_index: 2 },
                        { assessment_id: newAssess.id, question_text: "What does the 'static' keyword do when applied to a global variable?", options: ["Makes it constant", "Limits its scope to the file it is declared in", "Prevents it from being used in functions", "Places it in the stack instead of data segment"], correct_answer: "Limits its scope to the file it is declared in", marks: 1, order_index: 3 },
                        { assessment_id: newAssess.id, question_text: "What is a 'dangling pointer' in C?", options: ["A pointer that hasn't been initialized", "A pointer that points to a memory location that has been freed", "A pointer that points to NULL", "A pointer that is too large for the architecture"], correct_answer: "A pointer that points to a memory location that has been freed", marks: 1, order_index: 4 },
                        { assessment_id: newAssess.id, question_text: "Which operator is used to access members of a structure through a pointer?", options: [". (dot)", ":: (double colon)", "-> (arrow)", "* (asterisk)"], correct_answer: "-> (arrow)", marks: 1, order_index: 5 },
                        { assessment_id: newAssess.id, question_text: "What is the purpose of the 'volatile' keyword?", options: ["To speed up execution", "To prevent the compiler from optimizing the variable", "To make the variable thread-safe automatically", "To hide the variable from other files"], correct_answer: "To prevent the compiler from optimizing the variable", marks: 1, order_index: 6 },
                        { assessment_id: newAssess.id, question_text: "In C, what is the size of a pointer on a 64-bit system?", options: ["2 bytes", "4 bytes", "8 bytes", "16 bytes"], correct_answer: "8 bytes", marks: 1, order_index: 7 },
                        { assessment_id: newAssess.id, question_text: "What happens if a program attempts to access memory at a NULL pointer?", options: ["The program returns 0", "Segmentation fault (Crash)", "The value is set to 1", "The computer restarts"], correct_answer: "Segmentation fault (Crash)", marks: 1, order_index: 8 },
                        { assessment_id: newAssess.id, question_text: "Which header file is required to use 'fprintf' and 'fscanf'?", options: ["stdlib.h", "math.h", "stdio.h", "string.h"], correct_answer: "stdio.h", marks: 1, order_index: 9 }
                    ];

                    const { data: newQsts, error: nQErr } = await supabase
                        .from("assessment_questions")
                        .insert(masteryQuestions)
                        .select();

                    if (nQErr) throw nQErr;

                    setAssessment(newAssess);
                    setQuestions(newQsts);
                    setTimeLeft(newAssess.time_limit_minutes * 60);
                    setLoading(false);
                    return;
                }

                // Fetch real assessment details from DB
                const { data: assess, error: aErr } = await supabase
                    .from("assessments")
                    .select("*")
                    .eq("id", assessmentId)
                    .single();

                if (aErr) throw aErr;
                setAssessment(assess);
                setTimeLeft(assess.time_limit_minutes * 60);

                // Fetch real questions
                const { data: qsts, error: qErr } = await supabase
                    .from("assessment_questions")
                    .select("*")
                    .eq("assessment_id", assessmentId)
                    .order("order_index", { ascending: true });

                if (qErr) throw qErr;
                
                // Shuffle questions
                const randomized = [...qsts].sort(() => Math.random() - 0.5);
                setQuestions(randomized.length > 0 ? randomized : []);
            } catch (error) {
                console.error("Error fetching assessment:", error);
                if (window.showToast) window.showToast("Sync Error. Returning to course library.", "error");
                onBack();
            } finally {
                setLoading(false);
            }
        }

        fetchAssessmentData();
    }, [courseData]);

    // 2. Timer Logic
    useEffect(() => {
        if (currentStep === "quiz" && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => clearInterval(timerRef.current);
    }, [currentStep, timeLeft]);

    // 3. Prevent Tab Switching (Simple Warning)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && currentStep === "quiz") {
                setTabSwitches(prev => prev + 1);
                if (window.showToast) window.showToast("Warning: Tab switching is monitored. Please stay on the assessment page.", "error");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [currentStep]);

    // 4. Handle Option Selection
    const handleOptionSelect = (qstId, option) => {
        setAnswers(prev => ({ ...prev, [qstId]: option }));
    };

    // 5. Submit & Evaluate
    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        clearInterval(timerRef.current);

        let score = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                score += q.marks;
            }
        });

        const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
        const percentage = (score / totalMarks) * 100;
        const isPassed = percentage >= (assessment.passing_percentage || 80);

        try {
            // 1. Save attempt directly with correct DB assessment ID
            const { data: attempt, error } = await supabase
                .from("user_assessment_attempts")
                .insert({
                    user_id: user.id,
                    assessment_id: assessment.id, // Use assessment.id, NOT assessmentId prop!
                    score,
                    percentage,
                    is_passed: isPassed,
                    attempt_number: 1, // Simplified for performance; DB can track or we can enhance later
                    answers: answers
                })
                .select()
                .single();

            if (error) throw error;

            setResult(attempt);
            setCurrentStep("result");

            if (isPassed) {
                if (window.showToast) window.showToast("Mastery achieved! Assessment archived. 🏆", "success");
            } else {
                if (window.showToast) window.showToast(`Threshold not met (${Math.round(percentage)}%). Try again.`, "error");
            }

        } catch (error) {
            console.error("Evaluation Error:", error);
            if (window.showToast) window.showToast("Evaluation failed. Please re-submit.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 6. Certificate Generation & Upload
    const handleIssueCertificate = async () => {
        if (!courseData || !assessment) return;
        setIsGenerating(true);
        try {
            await generateAndUploadCertificate({
                userId: user.id,
                userName: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student',
                userEmail: user?.email,
                courseName: courseData?.title || assessment.title,
                category: courseData?.category || "Technology",
                level: courseData?.level || "Professional",
                totalLessons: courseData?.lessonsCount || questions.length,
                hours: courseData?.duration || "Module Mastery",
                assessmentId: assessmentId,
                courseId: assessment.course_id
            }, supabase);

            if (window.showToast) window.showToast("Certificate officially issued and archived! 🎓", "success");
        } catch (error) {
            console.error("Certificate generation/upload failed:", error);
            if (window.showToast) window.showToast("Certificate issuance failed. Please try again.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 animate-pulse text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mb-6 opacity-30" />
                <p className="text-text-muted font-bold text-sm tracking-widest uppercase opacity-40">Synchronizing Assessment Engine...</p>
            </div>
        );
    }

    if (!assessmentId || !assessment) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 rounded-[2rem] bg-surface-2 border border-border flex items-center justify-center mb-8 shadow-2xl">
                    <Terminal className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-sora font-extrabold text-text-main mb-4 uppercase tracking-tighter">Session Expired</h3>
                <p className="text-text-muted mb-8 max-w-md font-bold text-sm leading-relaxed">To start this assessment, please select a course from your library and click the 'Final Assessment' milestone.</p>
                <button 
                    onClick={onBack}
                    className="btn btn-primary px-10 py-4 rounded-2xl font-black text-sm uppercase shadow-xl shadow-primary/20"
                >
                    Return to Library
                </button>
            </div>
        );
    }
    return (
        <div className="flex-1 p-6 md:p-8 flex flex-col items-center bg-background custom-scrollbar">
            <div className="w-full max-w-3xl">
                {/* Header Navbar */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-bold text-sm">
                        <ArrowLeft className="w-4 h-4" /> Exit
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border">
                            <GraduationCap className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-text-main">{assessment.title}</span>
                        </div>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {/* START SCREEN */}
                    {currentStep === "start" && (
                        <motion.div 
                            key="start" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                            className="card-premium p-8 bg-surface-2 border-border text-center flex flex-col items-center"
                        >
                            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6 animate-pulse">
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-sora font-extrabold text-text-main mb-3">Final Mastery Assessment</h2>
                            <p className="text-text-muted text-sm mb-8 max-w-md">
                                This assessment will evaluate your core understanding of the module. You need at least 
                                <span className="text-primary font-bold"> {assessment.passing_percentage}% </span> 
                                to unlock your official certificate.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-1">
                                    <BookOpen className="w-5 h-5 text-text-muted" />
                                    <span className="text-sm font-bold">{questions.length} Questions</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-surface border border-border flex flex-col items-center gap-1">
                                    <Timer className="w-5 h-5 text-text-muted" />
                                    <span className="text-sm font-bold">{assessment.time_limit_minutes} Mins</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => setCurrentStep("quiz")}
                                className="btn-primary px-10 py-4 w-full rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                            >
                                Start Assessment <ChevronRight className="w-5 h-5" />
                            </button>
                        </motion.div>
                    )}

                    {/* QUIZ SCREEN */}
                    {currentStep === "quiz" && (
                        <motion.div 
                            key="quiz" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Sticky Timer */}
                            <div className="sticky top-0 z-20 flex justify-between items-center bg-background/80 backdrop-blur-md py-4 mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-text-muted uppercase">Progress</span>
                                    <div className="flex gap-1 mt-1">
                                        {questions.map((_, i) => (
                                            <div key={i} className={`h-1.5 w-8 rounded-full transition-all ${Object.keys(answers).length > i ? 'bg-primary' : 'bg-surface-2 border border-border'}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${timeLeft < 60 ? 'bg-danger/10 border-danger text-danger animate-pulse' : 'bg-surface-2 border-border text-text-main'}`}>
                                    <Clock className="w-4 h-4" /> {formatTime(timeLeft)}
                                </div>
                            </div>

                            {/* Questions List */}
                            <div className="space-y-12">
                                {questions.map((q, qIdx) => (
                                    <div key={q.id} className="space-y-6">
                                        <div className="flex items-start gap-4">
                                            <span className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-xs font-black text-text-muted">
                                                {qIdx + 1}
                                            </span>
                                            <h3 className="text-lg md:text-xl font-bold text-text-main leading-relaxed">
                                                {q.question_text}
                                            </h3>
                                        </div>

                                        <div className="grid grid-cols-1 gap-3 ml-12">
                                            {q.options.map((opt, oIdx) => (
                                                <button
                                                    key={oIdx}
                                                    onClick={() => handleOptionSelect(q.id, opt)}
                                                    className={`group flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                                                        answers[q.id] === opt 
                                                        ? 'bg-primary/5 border-primary text-primary' 
                                                        : 'bg-surface-2 border-transparent hover:border-border text-text-muted'
                                                    }`}
                                                >
                                                    <span className="text-sm font-semibold">{opt}</span>
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                        answers[q.id] === opt ? 'border-primary bg-primary' : 'border-border'
                                                    }`}>
                                                        {answers[q.id] === opt && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-12 pb-20">
                                <button 
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || Object.keys(answers).length < questions.length}
                                    className="btn-primary w-full py-5 rounded-3xl font-black text-base uppercase tracking-widest shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? <><Loader2 className="w-6 h-6 animate-spin" /> Evaluating...</> : "Finish Assessment"}
                                </button>
                                {Object.keys(answers).length < questions.length && (
                                    <p className="text-center text-text-muted text-[10px] font-bold mt-4 animate-pulse">
                                        * Please answer all questions before submitting
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* RESULT SCREEN */}
                    {currentStep === "result" && result && (
                        <motion.div 
                            key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center text-center space-y-8"
                        >
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-2xl ${
                                result.is_passed ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'
                            }`}>
                                {result.is_passed ? <Award className="w-12 h-12" /> : <AlertTriangle className="w-12 h-12" />}
                            </div>

                            <div>
                                <h2 className="text-3xl font-sora font-extrabold text-text-main mb-2">
                                    {result.is_passed ? "Module Mastered! 🎉" : "Keep Learning!"}
                                </h2>
                                <p className="text-text-muted font-bold text-sm">
                                    {result.is_passed 
                                        ? "You've successfully cleared the professional assessment." 
                                        : "You didn't reach the required threshold this time."}
                                </p>
                            </div>

                            <div className="w-full grid grid-cols-3 gap-4">
                                <div className="p-6 rounded-[2.5rem] bg-surface-2 border border-border">
                                    <p className="text-[10px] font-black text-text-muted uppercase mb-1">Score</p>
                                    <p className="text-2xl font-black text-text-main">{result.score} <span className="text-xs">/{questions.length}</span></p>
                                </div>
                                <div className="p-6 rounded-[2.5rem] bg-surface-2 border border-border">
                                    <p className="text-[10px] font-black text-text-muted uppercase mb-1">Percentage</p>
                                    <p className="text-2xl font-black text-text-main">{Math.round(result.percentage)}%</p>
                                </div>
                                <div className="p-6 rounded-[2.5rem] bg-surface-2 border border-border">
                                    <p className="text-[10px] font-black text-text-muted uppercase mb-1">Status</p>
                                    <p className={`text-sm font-black uppercase ${result.is_passed ? 'text-success' : 'text-danger'}`}>
                                        {result.is_passed ? "Passed" : "Failed"}
                                    </p>
                                </div>
                            </div>

                            {result.is_passed ? (
                                <div className="w-full space-y-4">
                                    <div className="p-6 rounded-3xl bg-success/5 border border-success/20 flex flex-col items-center">
                                        <div className="flex items-center gap-2 mb-2 text-success">
                                            <CheckCircle2 className="w-5 h-5" />
                                            <span className="font-black text-sm uppercase tracking-tighter">Certificate Unlocked</span>
                                        </div>
                                        <p className="text-xs text-text-muted mb-6">Your official certificate is now ready for download.</p>
                                        <button 
                                            onClick={handleIssueCertificate}
                                            disabled={isGenerating}
                                            className="w-full btn-success py-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-black shadow-xl shadow-success/20 bg-green-500 text-white hover:bg-green-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                                            {isGenerating ? "Issuing..." : "Get Certificate"}
                                        </button>
                                    </div>
                                    <button onClick={onBack} className="text-text-muted font-bold text-xs hover:text-primary transition-colors">Return to Dashboard</button>
                                </div>
                            ) : (
                                <div className="w-full space-y-4">
                                    <p className="text-xs text-text-muted italic">
                                        You need {assessment.passing_percentage}% to pass. Don't give up!
                                    </p>
                                    <button 
                                        onClick={() => {
                                            setAnswers({});
                                            setCurrentStep("quiz");
                                            setTimeLeft(assessment.time_limit_minutes * 60);
                                            setResult(null);
                                        }}
                                        className="w-full py-4 rounded-2xl bg-surface-2 border border-border flex items-center justify-center gap-2 text-sm font-black hover:bg-surface-3 transition-all"
                                    >
                                        <RefreshCw className="w-5 h-5" /> Re-attempt Assessment
                                    </button>
                                    <button onClick={onBack} className="text-text-muted font-bold text-xs hover:text-primary transition-colors">Study More first</button>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
