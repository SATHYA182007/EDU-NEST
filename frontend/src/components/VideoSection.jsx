import { useState, useEffect } from 'react';
import { getVideos, uploadVideo, deleteVideo } from '../services/videoService';
import { Play, Plus, Video, Search, ChevronRight, Loader2, X, Trash2 } from 'lucide-react';

const subjects = ["Computer Science", "Physics", "Mathematics", "Biology", "Economics", "History", "English Literature"];

export default function VideoSection({ user }) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);
    const [newVideo, setNewVideo] = useState({ title: '', subject: '', description: '', video_url: '' });
    const [deletingId, setDeletingId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredVideos = videos.filter(video => 
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        fetchVideos();
    }, []);

    const fetchVideos = async () => {
        try {
            setLoading(true);
            const data = await getVideos();
            setVideos(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        try {
            await uploadVideo({ ...newVideo, user_id: user?.id });
            setShowUpload(false);
            setNewVideo({ title: '', subject: '', description: '', video_url: '' });
            fetchVideos();
            if (window.showToast) window.showToast("Video shared successfully!", "success");
        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast("Failed to share video", "error");
        }
    };

    const handleDelete = async (videoId) => {
        if (!window.confirm("Are you sure you want to delete this video lecture?")) return;
        
        try {
            setDeletingId(videoId);
            await deleteVideo(videoId);
            setVideos(videos.filter(v => v.id !== videoId));
            if (window.showToast) window.showToast("Video deleted successfully", "success");
        } catch (error) {
            console.error(error);
            if (window.showToast) window.showToast("Failed to delete video", "error");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold font-sora">Video Lectures</h1>
                        <p className="text-text-muted mt-2">Learn from fellow students through video tutorials.</p>
                    </div>

                    <div className="flex items-center gap-4 flex-1 max-w-xl">
                        <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-primary transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search video lectures..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-surface-2 border border-border rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                            />
                        </div>

                        <button
                            onClick={() => setShowUpload(true)}
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-all shrink-0"
                        >
                            <Plus className="w-5 h-5" /> Share Lecture
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredVideos.map(video => (
                            <div key={video.id} className="bg-surface rounded-3xl overflow-hidden border border-border group hover:border-primary/50 transition-all relative">
                                {(user?.id === video.user_id || !video.user_id) && (
                                    <button
                                        onClick={() => handleDelete(video.id)}
                                        disabled={deletingId === video.id}
                                        className="absolute top-4 right-4 z-10 p-2 bg-danger/10 text-danger rounded-xl opacity-60 group-hover:opacity-100 transition-all hover:bg-danger hover:text-white disabled:opacity-50"
                                        title="Delete Lecture"
                                    >
                                        {deletingId === video.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                    </button>
                                )}
                                <div className="aspect-video bg-surface-2 relative flex items-center justify-center">
                                    <Video className="w-12 h-12 text-text-muted/20" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <a
                                            href={video.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white"
                                        >
                                            <Play className="w-6 h-6 fill-white" />
                                        </a>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{video.subject}</span>
                                    <h3 className="text-lg font-bold mt-1 line-clamp-1">{video.title}</h3>
                                    <p className="text-text-muted text-sm mt-2 line-clamp-2">{video.description}</p>
                                    <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                                        <span className="text-xs text-text-muted">{new Date(video.created_at).toLocaleDateString()}</span>
                                        <a
                                            href={video.video_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary text-xs font-bold flex items-center"
                                        >
                                            Watch Now <ChevronRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showUpload && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-surface w-full max-w-lg rounded-3xl p-8 border border-border shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold font-sora">Share Video Lecture</h2>
                            <button onClick={() => setShowUpload(false)}><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold mb-2">Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3"
                                    value={newVideo.title}
                                    onChange={e => setNewVideo({ ...newVideo, title: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Subject</label>
                                <select
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 cursor-pointer"
                                    value={newVideo.subject}
                                    onChange={e => setNewVideo({ ...newVideo, subject: e.target.value })}
                                    required
                                >
                                    <option value="" disabled>Select a subject...</option>
                                    {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">YouTube URL</label>
                                <input
                                    type="text"
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3"
                                    value={newVideo.video_url}
                                    onChange={e => setNewVideo({ ...newVideo, video_url: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2">Description</label>
                                <textarea
                                    className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 min-h-[100px]"
                                    value={newVideo.description}
                                    onChange={e => setNewVideo({ ...newVideo, description: e.target.value })}
                                    required
                                />
                            </div>
                            <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20">
                                Share Lecture
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
