import { supabase } from "./lib/supabaseClient";
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Bell, Menu, X } from 'lucide-react'
import Sidebar from './components/sections/Sidebar'
import Dashboard from './components/sections/Dashboard'
import Hero from './components/sections/Hero'
import UploadPage from './components/sections/UploadPage'
import AuthPage from './components/sections/AuthPage'
import SettingsPage from './components/sections/SettingsPage'
import BrowsePage from './components/sections/BrowsePage'
import MyLibraryPage from './components/sections/MyLibraryPage'
import VideoSection from './components/VideoSection'
import QuizComponent from './components/QuizComponent'
import DiscussionSection from './components/DiscussionSection'
import CoursesPage from './components/sections/CoursesPage'
import AssessmentPage from './components/sections/AssessmentPage'

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    // Priority: URL path > LocalStorage > Landing
    const path = window.location.pathname.replace('/', '').toLowerCase();
    const validTabs = ['dashboard', 'browse', 'videos', 'courses', 'quizzes', 'forum', 'library', 'settings', 'upload', 'assessment'];
    if (validTabs.includes(path)) return path;
    
    return localStorage.getItem('activeTab') || 'landing';
  });
  const [user, setUser] = useState(null)
  const [authView, setAuthView] = useState(false)
  const [loading, setLoading] = useState(true)
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')
  const [toasts, setToasts] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications] = useState([
    { id: 1, text: "Welcome to EduNest!", time: "Just now", read: false },
    { id: 2, text: "New Physics quiz is now available!", time: "2 hrs ago", read: false },
    { id: 3, text: "Your 'Quantum Mechanics' upload reached 10 downloads!", time: "5 hrs ago", read: true },
  ])
  const [assessmentParams, setAssessmentParams] = useState(null);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    
    // Sync URL with Tab for better routing/reload support
    const currentPath = window.location.pathname.replace('/', '');
    if (activeTab !== currentPath && activeTab !== 'landing') {
        window.history.pushState({}, '', `/${activeTab}`);
    } else if (activeTab === 'landing' && currentPath !== '') {
        window.history.pushState({}, '', '/');
    }
  }, [activeTab]);

    const isRefreshing = useRef(false);
    const refreshUser = async (authSession = null) => {
        if (isRefreshing.current) return;
        isRefreshing.current = true;
        
        try {
            // 1. Get user (either from provided session or fresh)
            let currentUser = authSession?.user;
            if (!currentUser) {
                const { data } = await supabase.auth.getUser();
                currentUser = data.user;
            }

            if (!currentUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // 2. Get Profile data from DB table
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            // 3. Merge profile data into user metadata safely
            const cleanProfile = {};
            if (profile) {
                // List of keys we care about in the profiles table
                const profileKeys = ['full_name', 'university', 'course', 'bio', 'avatar_url'];
                profileKeys.forEach(key => {
                    // Only overwrite if DB has a value (non-null)
                    // We allow empty string "" if it's explicitly in the DB
                    if (profile[key] !== null) {
                        cleanProfile[key] = profile[key];
                    }
                });
            }

            const mergedUser = {
                ...currentUser,
                user_metadata: {
                    ...currentUser.user_metadata,
                    ...cleanProfile
                }
            };

            setUser(mergedUser);
            setLoading(false);
        } catch (error) {
            console.error("Refresh user error:", error);
            setLoading(false);
        } finally {
            isRefreshing.current = false;
        }
    };

    useEffect(() => {
        let authSubscription = null;
        let profileSubscription = null;

        const initAuth = async () => {
            // 1. Initial Load
            const { data: { user: initialUser } } = await supabase.auth.getUser();
            if (initialUser) {
                await refreshUser();
            } else {
                setLoading(false);
            }

            // 2. Auth State Listener
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                console.log("Auth Event:", event);
                
                if (event === 'SIGNED_IN') {
                    await refreshUser(session);
                    if (activeTab === 'landing') setActiveTab('browse');
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setActiveTab('landing');
                    if (profileSubscription) profileSubscription.unsubscribe();
                } else if (event === 'USER_UPDATED') {
                    // Auth metadata changed, but we also rely on Realtime for the profile parts
                    await refreshUser(session);
                }
            });
            authSubscription = subscription;

            // 3. Realtime Profile Listener
            if (initialUser) {
                profileSubscription = supabase
                    .channel('profile_changes')
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${initialUser.id}` },
                        (payload) => {
                            console.log("Realtime Profile Change:", payload);
                            // Avoid double-refresh if auth listener already caught it
                            setTimeout(() => refreshUser(), 200); 
                        }
                    )
                    .subscribe();
            }
        };

        initAuth();

        return () => {
            if (authSubscription) authSubscription.unsubscribe();
            if (profileSubscription) profileSubscription.unsubscribe();
        };
    }, []); 

  const handleAuthSuccess = async () => {
    await refreshUser();
    setActiveTab('browse');
    setAuthView(false);
  };
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }

  useEffect(() => {
    window.showToast = (message, type = 'success') => {
      const id = Math.random().toString(36).substr(2, 9);
      
      // Ensure message is a string if it's an error object
      const toastMessage = typeof message === 'object' ? 
        (message.message || JSON.stringify(message)) : message;

      setToasts(prev => [...prev, { id, message: toastMessage, type }]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000); // 5 seconds as requested
    };
    return () => {
      delete window.showToast;
    };
  }, []);

  const handleAction = (tab) => {
    if (!user && tab !== 'landing') {
      setAuthView(true)
    } else {
      setActiveTab(tab)
      setAuthView(false)
    }
  }

  // Globally accessible helper to trigger assessments
  useEffect(() => {
    window.startAssessment = (id, courseData) => {
      setAssessmentParams({ id, courseData });
      setActiveTab('assessment');
    };
    return () => delete window.startAssessment;
  }, []);

  const renderContent = () => {
    if (authView && !user) {
      return <AuthPage onAuthSuccess={() => setAuthView(false)} />
    }

    switch (activeTab) {
      case 'landing':
        return <Hero
          onBrowse={() => handleAction('browse')}
          onUpload={() => handleAction('upload')}
          onLogin={() => setAuthView(true)}
        />
      case 'dashboard':
        return <Dashboard user={user} />
      case 'upload':
        return <UploadPage user={user} />
      case 'browse':
        return <BrowsePage user={user} />
      case 'videos':
        return <VideoSection user={user} />
      case 'courses':
        return <CoursesPage user={user} />
      case 'quizzes':
        return <QuizComponent user={user} />
      case 'forum':
        return <DiscussionSection user={user} />
      case 'library':
        return <MyLibraryPage user={user} />
      case 'settings':
        return <SettingsPage user={user} onProfileUpdate={refreshUser} setUser={setUser} />
      case 'assessment':
        return (
          <AssessmentPage 
            user={user} 
            assessmentId={assessmentParams?.id} 
            courseData={assessmentParams?.courseData} 
            onBack={() => setActiveTab('courses')} 
          />
        );
      default:
        return <BrowsePage user={user} />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(79,142,247,0.4)]" />
      </div>
    )
  }

  const showSidebar = activeTab !== 'landing' && !authView;

  return (
    <div className="min-h-screen flex bg-background text-text-main font-inter antialiased selection:bg-primary/20">
      {showSidebar && (
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} user={user} />
      )}

      <main className={`flex-1 flex flex-col relative overflow-hidden h-screen bg-background ${!showSidebar ? 'w-full' : ''}`}>
        {showSidebar && (
          <header className="h-20 border-b border-border glass-header flex items-center justify-between px-8 sticky top-0 z-40 transition-all duration-300">
            <div className="flex-1">
              <h2 className="text-xl font-sora font-extrabold text-text-main capitalize">
                {activeTab === 'browse' ? 'Browse Notes' : activeTab === 'forum' ? 'Community' : activeTab.replace('-', ' ')}
              </h2>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl bg-surface-2 border border-border text-text-muted hover:text-primary hover:border-primary/30 transition-all flex items-center justify-center"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl border transition-all relative ${showNotifications ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-2 border-border text-text-muted hover:text-primary'}`}
                >
                  <Bell className="w-5 h-5" />
                  {notifications.some(n => !n.read) && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-danger rounded-full border-2 border-surface" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className="absolute right-0 mt-3 w-80 bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden"
                    >
                      <div className="p-4 border-b border-border flex justify-between items-center">
                        <h3 className="font-bold text-sm">Notifications</h3>
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          {notifications.filter(n => !n.read).length} New
                        </span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-border/50 hover:bg-surface-2 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-primary/5' : ''}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.read ? 'bg-primary' : 'bg-transparent'}`} />
                            <div>
                              <p className="text-xs text-text-main leading-snug">{n.text}</p>
                              <p className="text-[10px] text-text-muted mt-1">{n.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 text-center border-t border-border">
                        <button className="text-[11px] font-bold text-primary hover:underline">Mark all as read</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + authView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.9 }}
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className={`pointer-events-auto px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-4 font-bold text-sm cursor-pointer hover:scale-105 transition-all active:scale-95 ${
                toast.type === 'success' ? 'bg-[#06b6d4]/10 text-[#06b6d4] border-[#06b6d4]/30' :
                toast.type === 'error' ? 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30' :
                'bg-surface-2 text-text-main border-border'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${
                toast.type === 'success' ? 'bg-[#06b6d4] shadow-[0_0_10px_#06b6d4]' : 
                'bg-[#ef4444] shadow-[0_0_10px_#ef4444]'
              }`} />
              <span className="flex-1">{toast.message}</span>
              <X className="w-3.5 h-3.5 opacity-40 hover:opacity-100 transition-opacity" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default App;
