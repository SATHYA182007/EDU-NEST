import { useState, useEffect } from 'react';
import { getQuizzes, getQuizQuestions, submitQuizResult } from '../services/quizService';
import { ChevronRight, Loader2, Trophy, Search, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';

export default function QuizComponent({ user }) {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userAnswers, setUserAnswers] = useState([]);

    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.subject?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const data = await getQuizzes();
            setQuizzes(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const startQuiz = async (quiz) => {
        try {
            setLoading(true);
            const data = await getQuizQuestions(quiz.id);
            setQuestions(data);
            setSelectedQuiz(quiz);
            setCurrentQuestionIndex(0);
            setScore(0);
            setUserAnswers([]);
            setShowResult(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        const optionKeys = ['A', 'B', 'C', 'D'];
        const selectedOption = optionKeys[optionIndex];
        const currentQ = questions[currentQuestionIndex];
        const isCorrect = currentQ.correct_answer === selectedOption;

        const updatedAnswers = [...userAnswers, {
            question: currentQ.question,
            selected: selectedOption,
            correct: currentQ.correct_answer,
            isCorrect
        }];
        setUserAnswers(updatedAnswers);

        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) setScore(newScore);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz(newScore, updatedAnswers);
        }
    };

    const finishQuiz = async (finalScore, answers) => {
        setShowResult(true);
        if (user) {
            try {
                await submitQuizResult({
                    user_id: user.id,
                    quiz_id: selectedQuiz.id,
                    score: finalScore
                });
            } catch (e) {
                console.error('Failed to submit quiz result', e);
            }
        }
    };

    const downloadPDF = () => {
        try {
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 18;
            let y = 0;

            const totalQ = questions.length;
            const pct = totalQ > 0 ? ((score / totalQ) * 100).toFixed(1) : '0.0';
            const grade =
                parseFloat(pct) >= 90 ? 'A+' :
                parseFloat(pct) >= 80 ? 'A'  :
                parseFloat(pct) >= 70 ? 'B'  :
                parseFloat(pct) >= 60 ? 'C'  : 'D';

            // ── Purple Header ──────────────────────────────────────────────
            doc.setFillColor(108, 99, 255);
            doc.rect(0, 0, pageWidth, 42, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('EduNest', margin, 18);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Quiz Performance Report', margin, 27);

            // Score badge top-right
            doc.setFontSize(26);
            doc.setFont('helvetica', 'bold');
            doc.text(pct + '%', pageWidth - margin, 28, { align: 'right' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Grade: ' + grade, pageWidth - margin, 36, { align: 'right' });

            y = 54;

            // ── Info Grid ──────────────────────────────────────────────────
            const labelColor = [108, 99, 255];
            const textColor  = [25, 25, 25];
            doc.setFontSize(10);

            const infoRows = [
                ['Name',    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student'],
                ['Email',   user?.email || 'N/A'],
                ['Quiz',    selectedQuiz?.title || 'N/A'],
                ['Subject', selectedQuiz?.subject || 'N/A'],
                ['Score',   score + ' / ' + totalQ],
                ['Date',    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
            ];

            infoRows.forEach(([label, value]) => {
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...labelColor);
                doc.text(label + ':', margin, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...textColor);
                doc.text(String(value), margin + 30, y);
                y += 7;
            });

            y += 4;

            // ── Divider ────────────────────────────────────────────────────
            doc.setDrawColor(200, 200, 210);
            doc.setLineWidth(0.3);
            doc.line(margin, y, pageWidth - margin, y);
            y += 7;

            // ── Answer Sheet Title ─────────────────────────────────────────
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.setTextColor(...textColor);
            doc.text('Answer Sheet', margin, y);
            y += 7;

            // ── Table ──────────────────────────────────────────────────────
            const rowH  = 7;
            const col0  = margin;            // #      (10)
            const col1  = margin + 11;       // Question (87)
            const col2  = margin + 101;      // Your Ans (18)
            const col3  = margin + 122;      // Correct (18)
            const col4  = margin + 144;      // Result (28)

            // Header row
            doc.setFillColor(108, 99, 255);
            doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#',           col0 + 1, y + 5);
            doc.text('Question',    col1 + 1, y + 5);
            doc.text('Your Ans',    col2 + 1, y + 5);
            doc.text('Correct Ans', col3 + 1, y + 5);
            doc.text('Result',      col4 + 1, y + 5);
            y += rowH;

            // Data rows
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);

            userAnswers.forEach((ans, idx) => {
                // Start new page if needed
                if (y + rowH > pageHeight - 22) {
                    doc.addPage();
                    y = 16;
                }

                // Alternating row bg
                if (idx % 2 === 0) {
                    doc.setFillColor(248, 247, 255);
                } else {
                    doc.setFillColor(255, 255, 255);
                }
                doc.rect(margin, y, pageWidth - margin * 2, rowH, 'F');

                // Row border
                doc.setDrawColor(218, 216, 230);
                doc.setLineWidth(0.2);
                doc.line(margin, y + rowH, pageWidth - margin, y + rowH);

                const maxQ = 62;
                const qText = ans.question.length > maxQ
                    ? ans.question.substring(0, maxQ) + '...'
                    : ans.question;

                doc.setTextColor(25, 25, 25);
                doc.text(String(idx + 1), col0 + 1, y + 5);
                doc.text(qText,            col1 + 1, y + 5);
                doc.text(ans.selected,     col2 + 1, y + 5);
                doc.text(ans.correct,      col3 + 1, y + 5);

                if (ans.isCorrect) {
                    doc.setTextColor(22, 163, 74);   // green
                    doc.setFont('helvetica', 'bold');
                    doc.text('PASS', col4 + 1, y + 5);
                } else {
                    doc.setTextColor(220, 38, 38);   // red
                    doc.setFont('helvetica', 'bold');
                    doc.text('FAIL', col4 + 1, y + 5);
                }
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(25, 25, 25);
                y += rowH;
            });

            y += 10;

            // ── Summary Box ────────────────────────────────────────────────
            if (y + 18 > pageHeight - 18) { doc.addPage(); y = 18; }
            doc.setFillColor(240, 238, 255);
            doc.roundedRect(margin, y, pageWidth - margin * 2, 16, 2, 2, 'F');
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(108, 99, 255);
            doc.text(
                'Final Score: ' + score + '/' + totalQ + '   |   Percentage: ' + pct + '%   |   Grade: ' + grade,
                pageWidth / 2, y + 10,
                { align: 'center' }
            );

            // ── Footer ─────────────────────────────────────────────────────
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(170, 170, 170);
            doc.text(
                'Generated by EduNest Learning Platform  •  ' + new Date().toLocaleString(),
                pageWidth / 2, pageHeight - 6,
                { align: 'center' }
            );

            const fileName = (selectedQuiz?.title || 'Quiz').replace(/\s+/g, '_') + '_Result.pdf';
            doc.save(fileName);

        } catch (err) {
            console.error('PDF generation failed:', err);
            if (window.showToast) window.showToast('PDF generation failed: ' + err.message, 'error');
        }
    };

    if (loading && !selectedQuiz) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (showResult) {
        return (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto bg-surface rounded-3xl p-8 border border-border text-center shadow-2xl">
                    <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
                    <p className="text-text-muted mb-8 text-lg font-medium">
                        Your score: <span className="text-primary font-bold text-xl">{score}</span> / {questions.length}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={downloadPDF}
                            className="flex items-center gap-2 px-8 py-3 bg-surface-2 border border-border hover:border-primary/50 text-white rounded-2xl font-bold transition-all shadow-lg"
                        >
                            <FileDown className="w-5 h-5 text-primary" />
                            Download Result PDF
                        </button>
                        <button
                            onClick={() => { setSelectedQuiz(null); setShowResult(false); }}
                            className="px-8 py-3 bg-primary text-white rounded-2xl font-bold shadow-lg hover:shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Back to Quizzes
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (selectedQuiz) {
        if (!questions || questions.length === 0) {
            return (
                <div className="flex-1 p-8 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
                        <p className="text-text-muted font-medium">Preparing your questions...</p>
                    </div>
                </div>
            );
        }
        const currentQ = questions[currentQuestionIndex];
        if (!currentQ) return null;

        return (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto bg-surface rounded-3xl p-8 border border-border shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">{selectedQuiz.title}</h3>
                        <span className="text-sm text-text-muted">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-surface-2 rounded-full mb-6 overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                    <h4 className="text-xl font-medium mb-6">{currentQ.question}</h4>
                    <div className="grid gap-4">
                        {['a', 'b', 'c', 'd'].map((opt, idx) => (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(idx)}
                                className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-3">
                                    <span className="w-7 h-7 rounded-full border border-border group-hover:border-primary flex items-center justify-center text-xs font-bold text-text-muted group-hover:text-primary transition-colors">
                                        {opt.toUpperCase()}
                                    </span>
                                    {currentQ[`option_${opt}`]}
                                </span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h2 className="text-2xl font-bold font-sora">Available Quizzes</h2>
                    <div className="relative w-full md:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search quizzes by title or subject..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-2 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredQuizzes.map(quiz => (
                        <div key={quiz.id} className="p-6 rounded-3xl bg-surface border border-border hover:border-primary/50 transition-all group hover:shadow-xl hover:shadow-primary/5">
                            <h3 className="font-bold mb-2">{quiz.title}</h3>
                            <p className="text-sm text-text-muted mb-4">{quiz.subject}</p>
                            <button
                                onClick={() => startQuiz(quiz)}
                                className="w-full py-2 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all"
                            >
                                Take Quiz
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
