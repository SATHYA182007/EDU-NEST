import { useState, useEffect } from 'react';
import { getForumQuestions, getForumAnswers, askForumQuestion, answerForumQuestion } from '../services/forumService';
import { MessageSquare, Send, User, ChevronRight, Loader2, Search } from 'lucide-react';

export default function DiscussionSection({ user }) {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [newQuestionTitle, setNewQuestionTitle] = useState('');
    const [newQuestionDesc, setNewQuestionDesc] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredQuestions = questions.filter(q => 
        q.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        q.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            setLoading(true);
            const data = await getForumQuestions();
            setQuestions(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectQuestion = async (q) => {
        setSelectedQuestion(q);
        const data = await getForumAnswers(q.id);
        setAnswers(data);
    };

    const handlePostQuestion = async (e) => {
        e.preventDefault();
        if (!user) return alert('Please login to ask questions');
        try {
            await askForumQuestion({
                user_id: user.id,
                title: newQuestionTitle,
                description: newQuestionDesc
            });
            setNewQuestionTitle('');
            setNewQuestionDesc('');
            fetchQuestions();
        } catch (error) {
            console.error(error);
        }
    };

    const handlePostAnswer = async (e) => {
        e.preventDefault();
        if (!user) return alert('Please login to answer');
        try {
            await answerForumQuestion({
                question_id: selectedQuestion.id,
                user_id: user.id,
                answer: newAnswer
            });
            setNewAnswer('');
            handleSelectQuestion(selectedQuestion);
        } catch (error) {
            console.error(error);
        }
    };

    if (loading && !selectedQuestion) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (selectedQuestion) {
        return (
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                <div className="max-w-5xl mx-auto flex flex-col gap-6">
                    <button
                        onClick={() => setSelectedQuestion(null)}
                        className="text-primary text-sm font-bold flex items-center gap-2 w-fit"
                    >
                        <ChevronRight className="rotate-180 w-4 h-4" /> Back to Forum
                    </button>

                    <div className="bg-surface rounded-3xl p-8 border border-border shadow-xl">
                        <h2 className="text-2xl font-bold mb-2 font-sora">{selectedQuestion.title}</h2>
                        <p className="text-text-muted mb-4 leading-relaxed">{selectedQuestion.description}</p>
                        <div className="flex items-center gap-2 text-xs text-text-muted">
                            <User className="w-3 h-3" />
                            <span>Posted on {new Date(selectedQuestion.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2 text-lg">
                            <MessageSquare className="w-5 h-5 text-primary" /> Answers ({answers.length})
                        </h3>
                        {answers.map(ans => (
                            <div key={ans.id} className="bg-surface-2 p-6 rounded-2xl border border-border">
                                <p className="text-sm leading-relaxed">{ans.answer}</p>
                                <div className="mt-4 text-[10px] text-text-muted font-medium">
                                    {new Date(ans.created_at).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={handlePostAnswer} className="mt-8">
                        <textarea
                            value={newAnswer}
                            onChange={(e) => setNewAnswer(e.target.value)}
                            placeholder="Write your answer..."
                            className="w-full bg-surface-2 border border-border rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] shadow-inner"
                        />
                        <button
                            type="submit"
                            className="mt-4 px-8 py-3 bg-primary text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all"
                        >
                            <Send className="w-4 h-4" /> Post Answer
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-2xl font-bold font-sora">Student Discussion</h2>
                        <div className="relative flex-1 max-w-sm group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search discussions..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-2xl py-2.5 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredQuestions.map(q => (
                            <div
                                key={q.id}
                                onClick={() => handleSelectQuestion(q)}
                                className="bg-surface p-6 rounded-2xl border border-border hover:border-primary/50 cursor-pointer transition-all group shadow-sm hover:shadow-md"
                            >
                                <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{q.title}</h3>
                                <p className="text-sm text-text-muted line-clamp-2 mt-2 leading-relaxed">{q.description}</p>
                                <div className="mt-6 flex items-center justify-between">
                                    <span className="text-xs text-text-muted font-medium">{new Date(q.created_at).toLocaleDateString()}</span>
                                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                                        View Discussion <ChevronRight className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="sticky top-0 bg-surface rounded-3xl p-8 border border-border shadow-xl">
                        <h3 className="font-bold text-lg mb-6">Ask a Question</h3>
                        <form onSubmit={handlePostQuestion} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Title</label>
                                <input
                                    type="text"
                                    value={newQuestionTitle}
                                    onChange={(e) => setNewQuestionTitle(e.target.value)}
                                    placeholder="e.g., How to solve Maxwell's equations?"
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Description</label>
                                <textarea
                                    value={newQuestionDesc}
                                    onChange={(e) => setNewQuestionDesc(e.target.value)}
                                    placeholder="Provide more context..."
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm min-h-[150px] focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all mt-4"
                            >
                                <Send className="w-4 h-4" /> Ask Community
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
