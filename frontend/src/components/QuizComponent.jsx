import { useState, useEffect } from 'react';
import { getQuizzes, getQuizQuestions, submitQuizResult } from '../services/quizService';
import { CheckCircle2, ChevronRight, Loader2, Trophy } from 'lucide-react';

export default function QuizComponent({ user }) {
    const [quizzes, setQuizzes] = useState([]);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [loading, setLoading] = useState(true);

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
            setShowResult(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        const optionKeys = ['a', 'b', 'c', 'd'];
        const selectedOption = optionKeys[optionIndex];
        const isCorrect = questions[currentQuestionIndex].correct_answer === selectedOption;

        const newScore = isCorrect ? score + 1 : score;
        if (isCorrect) setScore(newScore);

        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
            finishQuiz(newScore);
        }
    };

    const finishQuiz = async (finalScore) => {
        setShowResult(true);
        if (user) {
            await submitQuizResult({
                user_id: user.id,
                quiz_id: selectedQuiz.id,
                score: finalScore
            });
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
                    <p className="text-text-muted mb-6">Your score: {score} / {questions.length}</p>
                    <button
                        onClick={() => {
                            setSelectedQuiz(null);
                            setShowResult(false);
                        }}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                    >
                        Back to Quizzes
                    </button>
                </div>
            </div>
        );
    }

    if (selectedQuiz) {
        const currentQ = questions[currentQuestionIndex];
        return (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-4xl mx-auto bg-surface rounded-3xl p-8 border border-border shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg">{selectedQuiz.title}</h3>
                        <span className="text-sm text-text-muted">Question {currentQuestionIndex + 1} of {questions.length}</span>
                    </div>
                    <h4 className="text-xl font-medium mb-6">{currentQ.question}</h4>
                    <div className="grid gap-4">
                        {['a', 'b', 'c', 'd'].map((opt, idx) => (
                            <button
                                key={opt}
                                onClick={() => handleAnswer(idx)}
                                className="text-left p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-all flex items-center justify-between group"
                            >
                                <span>{currentQ[`option_${opt}`]}</span>
                                <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto grid gap-6">
                <h2 className="text-2xl font-bold font-sora">Available Quizzes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {quizzes.map(quiz => (
                        <div key={quiz.id} className="p-6 rounded-2xl bg-surface border border-border hover:border-primary/50 transition-all">
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
