import React, { useState, useEffect } from 'react';
import { Heart, Music, Image as ImageIcon, MapPin, Video, Calendar, ArrowRight, Sparkles, Send, CheckCircle2, MessageCircle, ListTodo, Loader2, Phone, Navigation, MoreVertical, ShieldCheck, Lock, Smartphone, UserPlus, ChevronDown, Quote, PenTool } from 'lucide-react';
import { submitWaitlist, withdrawWaitlist, subscribeWaitlistCount, submitSuggestion, subscribeFeatureVotes, toggleVote } from './firebase';

export default function App() {
  const [email, setEmail] = useState(() => {
    return localStorage.getItem('waitlistEmail') || '';
  });
  const [isWaitlisted, setIsWaitlisted] = useState(() => {
    return localStorage.getItem('isWaitlisted') === 'true';
  });
  const [isSubmittingWaitlist, setIsSubmittingWaitlist] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');
  const [waitlistCount, setWaitlistCount] = useState(0);
  
  const [suggestion, setSuggestion] = useState('');
  const [suggestionSent, setSuggestionSent] = useState(false);
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');

  // Device ID & Local Votes for persistent feature voting state
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('deviceId');
    if (!id) {
      id = 'device_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', id);
    }
    return id;
  });

  const [localUserVotes, setLocalUserVotes] = useState(() => {
    return JSON.parse(localStorage.getItem('userVotes') || '[]');
  });

  useEffect(() => {
    localStorage.setItem('userVotes', JSON.stringify(localUserVotes));
  }, [localUserVotes]);

  // FAQ State
  const [openFaq, setOpenFaq] = useState(null);

  // Animation states
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [chatStep, setChatStep] = useState(0); // For animating the chat mockup

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Animate the chat mockup loop
    const chatInterval = setInterval(() => {
      setChatStep(prev => (prev >= 4 ? 0 : prev + 1));
    }, 2500);

    // Firebase listeners
    const unsubscribeWaitlist = subscribeWaitlistCount((count) => {
      setWaitlistCount(count);
    });

    const unsubscribeFeatures = subscribeFeatureVotes((votesData) => {
      // Ensure we don't wipe out array if votesData is empty initially
      if (Object.keys(votesData).length > 0) {
        setFeatures(prev => prev.map(f => ({
          ...f,
          votes: votesData[f.id] !== undefined ? votesData[f.id] : f.votes
        })));
      }
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(chatInterval);
      unsubscribeWaitlist();
      unsubscribeFeatures();
    };
  }, []);

  // State for interactive feature voting updated based on BRD
  const [features, setFeatures] = useState([
    {
      id: 1,
      title: 'Synchronized Music Playback',
      desc: 'Listen to the same songs together in real-time, perfectly synced across both your devices.',
      votes: 428,
      voted: false,
      icon: <Music className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
    },
    {
      id: 2,
      title: 'Shared Memory Timeline',
      desc: 'A beautifully organized, private gallery for your relationship photos, videos, and milestones.',
      votes: 892,
      voted: false,
      icon: <ImageIcon className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
    },
    {
      id: 3,
      title: 'Private Voice & Video Calling',
      desc: 'Crystal clear, secure 1-on-1 calls integrated directly into your shared space.',
      votes: 512,
      voted: false,
      icon: <Video className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
    },
    {
      id: 4,
      title: 'Opt-in Live Location sharing',
      desc: 'Always know your partner is safe with simple, privacy-focused live location tracking.',
      votes: 356,
      voted: false,
      icon: <MapPin className="w-6 h-6 text-rose-400 group-hover:text-rose-300 transition-colors" />
    }
  ]);

  const faqs = [
    {
      q: "Is Two Souls available on both iOS and Android?",
      a: "Yes! Two Souls is being built for both major platforms so you can easily connect with your partner regardless of the device they use."
    },
    {
      q: "Is our communication really secure?",
      a: "Absolutely. We use end-to-end encryption for all private chats, voice calls, and video calls. Your data is yours, and we never sell it to advertisers."
    },
    {
      q: "What happens if we break up?",
      a: "We understand that things change. Either partner can instantly sever the digital connection. Doing so immediately stops all live sharing, and you will both be given 30 days to export your shared memory timeline before it is securely deleted."
    },
    {
      q: "Can we create group chats or add friends?",
      a: "No. Two Souls is strictly designed for a 1-on-1 connection. There are no social feeds, no public profiles, and no group chats. It is the ultimate private space just for the two of you."
    }
  ];

  // Simple strict email validation regex
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleJoinWaitlist = async (e) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    
    if (!trimmedEmail) return;
    
    if (!isValidEmail(trimmedEmail)) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }

    setIsSubmittingWaitlist(true);
    setWaitlistError('');
    try {
      await submitWaitlist(trimmedEmail);
      setIsWaitlisted(true);
      localStorage.setItem('isWaitlisted', 'true');
      localStorage.setItem('waitlistEmail', trimmedEmail);
    } catch (error) {
      if (error.message === 'already-exists') {
        setWaitlistError("This email is already on the waitlist!");
      } else {
        console.error("Failed to join waitlist", error);
        setWaitlistError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmittingWaitlist(false);
    }
  };

  const handleWithdraw = async () => {
    if (!email) return;
    setIsWithdrawing(true);
    try {
      await withdrawWaitlist(email);
      setIsWaitlisted(false);
      setEmail('');
      localStorage.removeItem('isWaitlisted');
      localStorage.removeItem('waitlistEmail');
    } catch (error) {
      console.error("Failed to withdraw", error);
      // Optional: set some UI error here, but for now just console log
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleVote = async (id) => {
    const feature = features.find(f => f.id === id);
    if (!feature) return;

    const isCurrentlyVoted = localUserVotes.includes(id);

    // Optimistic local update
    setLocalUserVotes(prev => 
      isCurrentlyVoted ? prev.filter(vId => vId !== id) : [...prev, id]
    );

    try {
      await toggleVote(deviceId, id, feature.title);
    } catch (error) {
      console.error("Vote failed", error);
      // Revert on error
      setLocalUserVotes(prev => 
        isCurrentlyVoted ? [...prev.filter(vId => vId !== id), id] : prev.filter(vId => vId !== id)
      );
    }
  };

  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (suggestion.trim() !== '') {
      setIsSubmittingSuggestion(true);
      setSuggestionError('');
      try {
        await submitSuggestion(suggestion.trim(), deviceId);
        setSuggestionSent(true);
        setSuggestion('');
        setTimeout(() => setSuggestionSent(false), 3000);
      } catch (error) {
        console.error("Failed to submit suggestion", error);
        setSuggestionError("Failed to send suggestion. Please try again.");
      } finally {
        setIsSubmittingSuggestion(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-rose-500/30 scroll-smooth">
      
      {/* Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/90 backdrop-blur-md border-b border-white/10 py-2' : 'bg-transparent py-4'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="bg-gradient-to-tr from-rose-500 to-purple-600 p-2 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg shadow-rose-500/20">
              <Heart className="w-5 h-5 text-white fill-white/20 group-hover:fill-white transition-all duration-300" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">Two Souls</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#concept" className="hover:text-rose-400 transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-rose-400 after:transition-all after:duration-300">The Concept</a>
            <a href="#features" className="hover:text-rose-400 transition-colors relative after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 hover:after:w-full after:bg-rose-400 after:transition-all after:duration-300">Feature Voting</a>
          </div>
          <a 
            href="#waitlist" 
            className="bg-white text-slate-900 px-6 py-2.5 rounded-full font-semibold text-sm hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)]"
          >
            Join Waitlist
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-40 pb-20 px-6 relative overflow-hidden min-h-[90vh] flex flex-col justify-center">
        {/* Animated Background Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse duration-[10000ms]"></div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none animate-pulse duration-[7000ms]"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-rose-300 text-sm font-medium mb-8 transform transition-all duration-1000 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>A private space for just the two of you</span>
          </div>
          
          <h1 className={`text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-tight transform transition-all duration-1000 delay-150 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            Two Souls. One Space. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-400 to-purple-500 animate-gradient-x">
              A Shared Journey.
            </span>
          </h1>
          
          <p className={`text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed transform transition-all duration-1000 delay-300 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            More than just a messaging app. Chat securely, share your location, sync your favorite music, and build a digital memory timeline together—away from the noise of the world.
          </p>

          {/* Waitlist Form */}
          <div id="waitlist" className={`max-w-md mx-auto bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl shadow-rose-900/20 transform transition-all duration-1000 delay-500 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} hover:border-rose-500/30`}>
            
            {/* Subscribed Users Banner */}
            <div className="mb-5 flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-lg shadow-black/20">
                {waitlistCount > 0 && (
                  <div className="flex -space-x-2 mr-1">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 border-2 border-slate-900 shadow-sm relative z-30"></div>
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border-2 border-slate-900 shadow-sm relative z-20"></div>
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-900 shadow-sm flex items-center justify-center relative z-10">
                      <span className="text-[8px] font-bold text-slate-300">+</span>
                    </div>
                  </div>
                )}
                <span className="text-xs font-medium text-slate-300">
                  {waitlistCount > 0 ? (
                    <><strong className="text-white">{waitlistCount.toLocaleString()}</strong> users subscribed for joining</>
                  ) : (
                    <strong className="text-white">Be the early bird to join</strong>
                  )}
                </span>
              </div>
            </div>

            {!isWaitlisted ? (
              <div className="relative">
                <form onSubmit={handleJoinWaitlist} className="flex flex-col sm:flex-row gap-2 relative">
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address" 
                    required
                    disabled={isSubmittingWaitlist}
                    className="flex-1 bg-black/40 border border-white/5 rounded-xl focus:ring-1 focus:ring-rose-500/50 px-4 py-3 text-white placeholder-slate-500 outline-none disabled:opacity-50 transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={isSubmittingWaitlist}
                    className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-400 hover:to-purple-500 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 group disabled:opacity-80 active:scale-95 shadow-lg shadow-rose-500/20"
                  >
                    {isSubmittingWaitlist ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span className="whitespace-nowrap">Get Access</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </form>
                {waitlistError && (
                  <p className="absolute -bottom-6 left-2 text-xs text-rose-400 font-medium">{waitlistError}</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="px-4 py-3 flex items-center justify-center gap-3 text-emerald-400 animate-in fade-in zoom-in duration-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 w-full mb-3 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                  <span className="font-medium text-emerald-400">Spot secured! We'll be in touch.</span>
                </div>
                <button 
                  onClick={handleWithdraw}
                  disabled={isWithdrawing}
                  className="text-xs text-slate-500 hover:text-rose-400 transition-colors underline underline-offset-4 flex items-center gap-1 active:scale-95"
                >
                  {isWithdrawing ? "Processing..." : "Withdraw Interest"}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Interactive App Previews */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-16 lg:gap-24">
            
            {/* Mobile Mockup 1: Chat */}
            <div className="relative w-[300px] h-[600px] bg-slate-950 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl shadow-rose-500/10 overflow-hidden flex flex-col transform transition-all duration-500 hover:-translate-y-2 hover:shadow-rose-500/20 group">
              {/* Hardware Notch */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-30">
                <div className="w-32 h-6 bg-slate-800 rounded-b-3xl"></div>
              </div>
              
              {/* App Header */}
              <div className="pt-10 pb-4 px-5 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-20">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg shadow-rose-500/30">
                      B
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-white flex items-center gap-1">Babe <Heart className="w-3 h-3 fill-rose-500 text-rose-500" /></p>
                    <p className="text-[10px] text-emerald-400 font-medium tracking-wide uppercase">Online</p>
                  </div>
                </div>
                <div className="flex gap-3 text-slate-400">
                  <Phone className="w-5 h-5 hover:text-rose-400 cursor-pointer transition-colors" />
                  <Video className="w-5 h-5 hover:text-rose-400 cursor-pointer transition-colors" />
                </div>
              </div>

              {/* Chat Body */}
              <div className="flex-1 p-5 flex flex-col gap-4 overflow-hidden relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 to-slate-950">
                {/* Date Bubble */}
                <div className="flex justify-center mb-2">
                  <span className="text-[10px] font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">Today</span>
                </div>

                <div className={`transition-all duration-500 transform ${chatStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="bg-slate-800 text-sm p-3.5 rounded-2xl rounded-tl-sm w-[85%] text-slate-200 shadow-md">
                    Hey! Are we still on for dinner tonight? 🥰
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 ml-1 block">5:42 PM</span>
                </div>

                <div className={`transition-all duration-500 transform self-end flex flex-col items-end ${chatStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="bg-gradient-to-r from-rose-500 to-rose-600 text-sm p-3.5 rounded-2xl rounded-tr-sm text-white shadow-md shadow-rose-500/20 max-w-[85%]">
                    Yes! Can't wait. See you at 7?
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 mr-1 block">5:45 PM</span>
                </div>

                <div className={`transition-all duration-500 transform ${chatStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                  <div className="bg-slate-800 text-sm p-3.5 rounded-2xl rounded-tl-sm w-[85%] text-slate-200 shadow-md">
                    Perfect. I'll share my location when I leave the office! 📍
                  </div>
                </div>
                
                {/* Typing indicator */}
                <div className={`transition-all duration-300 transform ${chatStep === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} absolute bottom-5 left-5`}>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1 w-fit">
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-900 border-t border-white/5 z-20">
                <div className="bg-slate-950 rounded-full px-4 py-2.5 flex items-center gap-3 border border-white/10">
                  <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-slate-400" />
                  </div>
                  <div className="flex-1 text-sm text-slate-500">Message...</div>
                  <Send className="w-4 h-4 text-rose-500" />
                </div>
              </div>
            </div>

            {/* Mobile Mockup 2: Live Location */}
            <div className="relative w-[300px] h-[600px] bg-slate-950 border-[8px] border-slate-800 rounded-[3rem] shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col transform transition-all duration-500 hover:-translate-y-2 hover:shadow-purple-500/20 group">
              {/* Hardware Notch */}
              <div className="absolute top-0 inset-x-0 h-7 flex justify-center z-30">
                <div className="w-32 h-6 bg-slate-800 rounded-b-3xl"></div>
              </div>

              {/* Map Background (CSS Pattern) */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
              
              <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-transparent to-slate-950"></div>

              {/* App Header */}
              <div className="pt-10 pb-4 px-5 flex justify-between items-center z-20 relative">
                <h3 className="font-bold text-white text-lg drop-shadow-md">Map</h3>
                <MoreVertical className="w-5 h-5 text-slate-300 drop-shadow-md" />
              </div>

              {/* Interactive Map Elements */}
              <div className="flex-1 relative z-10 flex items-center justify-center">
                {/* Partner Pin */}
                <div className="absolute top-1/4 left-1/3 flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-500/30 rounded-full animate-ping"></div>
                    <div className="w-12 h-12 rounded-full border-2 border-rose-500 bg-slate-800 p-1 relative z-10 shadow-lg shadow-rose-500/30">
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">B</div>
                    </div>
                  </div>
                  <div className="mt-2 bg-slate-900/80 backdrop-blur-md text-xs px-3 py-1.5 rounded-full border border-white/10 shadow-xl">
                    <span className="text-white font-medium">Babe</span> <span className="text-rose-400">Heading home</span>
                  </div>
                </div>

                {/* Connecting Line (SVG) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ filter: 'drop-shadow(0 0 4px rgba(244,63,94,0.3))' }}>
                  <path d="M 120 180 Q 200 250 180 350" fill="none" stroke="url(#gradient)" strokeWidth="3" strokeDasharray="6 6" className="animate-[dash_20s_linear_infinite]" />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* User Pin */}
                <div className="absolute bottom-1/3 right-1/4 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full border-2 border-purple-500 bg-slate-800 p-1 shadow-lg shadow-purple-500/20">
                    <div className="w-full h-full rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">U</div>
                  </div>
                </div>
              </div>

              {/* Bottom Info Card */}
              <div className="p-4 pb-6 z-20">
                <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-rose-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">Partner is 2.4 mi away</h4>
                      <p className="text-xs text-slate-400">Arriving in approx. 12 mins</p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-rose-500 to-purple-600 w-[70%] h-full rounded-full relative">
                      <div className="absolute top-0 right-0 bottom-0 w-4 bg-white/30 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Three Steps to Your Private Space</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Connecting is simple and strictly limited to one partner at a time.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500/30 to-rose-500/0"></div>

            {[
              { 
                step: "01",
                title: "Download the App", 
                desc: "Both you and your partner download Two Souls and create your individual secure accounts.",
                icon: <Smartphone className="w-6 h-6 text-rose-400" />
              },
              { 
                step: "02",
                title: "Share Your Soul Code", 
                desc: "Generate a unique, time-sensitive pairing code and share it securely with your partner.",
                icon: <UserPlus className="w-6 h-6 text-rose-400" />
              },
              { 
                step: "03",
                title: "Start Your Journey", 
                desc: "Once paired, your private space is unlocked. Start chatting, sharing, and building memories.",
                icon: <Heart className="w-6 h-6 text-rose-400" />
              }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-slate-950 border-4 border-slate-900 flex items-center justify-center mb-6 shadow-xl shadow-rose-900/10 group-hover:scale-110 group-hover:border-rose-500/30 transition-all duration-500">
                  <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    {item.icon}
                  </div>
                </div>
                <div className="text-rose-500 font-black text-xl mb-2 tracking-widest">{item.step}</div>
                <h3 className="text-xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed px-4">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Concept Section */}
      <section id="concept" className="py-32 bg-slate-950 relative">
        <div className="max-w-6xl mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Your Relationship, Upgraded.</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Couples already use messaging platforms, but they lack a dedicated private space. Two Souls is designed strictly for one-to-one pairing to celebrate your relationship.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                title: "Private Communication", 
                desc: "An exclusive sanctuary for your chats, voice notes, and video calls. No group chats, no social feeds—just the two of you.",
                icon: <MessageCircle className="w-8 h-8 text-rose-400" />
              },
              { 
                title: "Your Digital Scrapbook", 
                desc: "Never lose a moment. Track anniversaries and build a timeline of shared memories that won't get lost in your endless camera roll.",
                icon: <Calendar className="w-8 h-8 text-rose-400" />
              },
              { 
                title: "Shared Life Management", 
                desc: "Coordinate your lives seamlessly with shared to-do lists for groceries, dates, or chores, alongside optional live location sharing.",
                icon: <ListTodo className="w-8 h-8 text-rose-400" />
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="group bg-slate-950/50 backdrop-blur-sm p-10 rounded-3xl border border-white/10 hover:border-rose-500/50 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl hover:shadow-rose-500/10 cursor-default"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/10 to-purple-500/10 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 border border-white/5 group-hover:border-rose-500/30">
                  <div className="transform group-hover:scale-110 transition-transform duration-500">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-rose-100 transition-colors">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed text-lg">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy Guarantee Banner */}
      <section className="py-16 relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-purple-950 border-y border-white/10">
        {/* Animated pattern overlay */}
        <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
        
        <div className="max-w-5xl mx-auto px-6 relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-4">
              <ShieldCheck className="w-4 h-4" />
              <span>Ironclad Privacy</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">What happens in Two Souls, stays in Two Souls.</h2>
            <p className="text-rose-100/70 text-lg leading-relaxed max-w-xl">
              Your relationship is your business. We use end-to-end encryption for your messages and strict opt-in protocols for location sharing. No ads, no data mining.
            </p>
          </div>
          
          <div className="shrink-0">
            <div className="w-32 h-32 rounded-3xl bg-white/5 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl shadow-rose-500/20 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <Lock className="w-12 h-12 text-rose-300" />
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Note Section */}
      <section className="py-24 bg-slate-950 relative border-b border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 md:p-12 rounded-[2.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
            <Quote className="absolute top-8 right-8 w-32 h-32 text-white/5 rotate-12" />
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-widest mb-8">
                <PenTool className="w-4 h-4" />
                <span>Why We're Building This</span>
              </div>
              
              <h2 className="text-2xl md:text-4xl font-bold mb-8 text-white leading-snug">
                "Our relationship memories were getting lost in a sea of group chats, work emails, and social media noise."
              </h2>
              
              <div className="space-y-5 text-slate-400 text-lg leading-relaxed mb-10">
                <p>
                  I started building Two Souls because I wanted a quiet, private sanctuary just for my partner and me. Existing communication apps are designed to connect you with the entire world, but nothing was built specifically to deepen the connection with your favorite person.
                </p>
                <p>
                  <strong className="text-slate-200">Two Souls is currently in active development.</strong> We aren't backed by massive corporations; we are writing the code and shaping this app right now, alongside early adopters like you. 
                </p>
                <p>
                  By joining the waitlist, you aren't just waiting for an app—you are helping us decide what gets built next.
                </p>
              </div>
              
              <div className="flex items-center gap-4 pt-6 border-t border-white/10">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-rose-500 to-purple-600 p-1">
                  <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white tracking-widest">TS</span>
                  </div>
                </div>
                <div>
                  <p className="font-bold text-white text-lg">The Founding Team</p>
                  <p className="text-sm text-rose-400 font-medium">Building Two Souls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Voting Section */}
      <section id="features" className="py-32 relative">
        <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-b from-transparent via-purple-900/10 to-transparent pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">Help Us Prioritize Features</h2>
            <p className="text-lg text-slate-400">
              We are building this application specifically for couples like you. Vote on the features you care about most for our initial release.
            </p>
          </div>

          <div className="space-y-4">
            {features.map((feature) => {
              const isVoted = localUserVotes.includes(feature.id);
              return (
              <div 
                key={feature.id} 
                className={`group p-6 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 hover:shadow-xl hover:-translate-y-1 ${
                  isVoted 
                  ? 'bg-gradient-to-r from-rose-500/10 to-transparent border-rose-500/50 shadow-rose-900/20' 
                  : 'bg-slate-900/50 border-white/10 hover:border-white/30 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className={`p-4 rounded-xl mt-1 sm:mt-0 transition-colors duration-300 ${isVoted ? 'bg-rose-500/20 shadow-inner shadow-rose-500/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <div className="transform group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-slate-100">{feature.title}</h3>
                    <p className="text-slate-400 text-base leading-relaxed">{feature.desc}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleVote(feature.id)}
                  className={`shrink-0 flex items-center gap-3 px-6 py-4 rounded-xl font-bold transition-all duration-300 w-full sm:w-auto justify-center active:scale-90 ${
                    isVoted 
                    ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] hover:shadow-[0_0_30px_rgba(244,63,94,0.6)]' 
                    : 'bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Heart className={`w-5 h-5 transition-all duration-500 ${isVoted ? 'fill-white scale-110' : 'group-hover/btn:scale-110'}`} />
                  <span className="min-w-[4ch] text-center">{feature.votes}</span>
                  <span className="font-medium text-sm opacity-80">{isVoted ? 'Voted' : 'Vote'}</span>
                </button>
              </div>
            )})}
          </div>

          {/* Custom Suggestion Box */}
          <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 rounded-full blur-[60px] group-hover:bg-rose-500/10 transition-colors duration-700"></div>
            
            <div className="relative z-10">
              <h3 className="text-2xl font-bold mb-3">Have another idea?</h3>
              <p className="text-slate-400 mb-8 text-base">Tell us what else would make connecting with your partner easier. We read every submission.</p>
              
              <div className="relative">
                <form onSubmit={handleSuggestionSubmit} className="flex flex-col gap-4">
                  <textarea 
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    disabled={isSubmittingSuggestion || suggestionSent}
                    placeholder="E.g. Couple games, custom chat themes..." 
                    rows={5}
                    className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/50 transition-all disabled:opacity-50 resize-y"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="submit"
                      disabled={isSubmittingSuggestion || suggestionSent}
                      className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-90 ${
                        suggestionSent 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                        : 'bg-white text-slate-900 hover:bg-rose-50 hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                      }`}
                    >
                      {isSubmittingSuggestion ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : suggestionSent ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      <span className="sm:inline">
                        {isSubmittingSuggestion ? 'Sending...' : suggestionSent ? 'Received!' : 'Submit Suggestion'}
                      </span>
                    </button>
                  </div>
                </form>
                {suggestionError && (
                  <p className="absolute -bottom-6 left-2 text-xs text-rose-400 font-medium">{suggestionError}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-slate-900/40 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400">Everything you need to know about your new shared space.</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${openFaq === index ? 'bg-slate-800/80 border-rose-500/30' : 'bg-slate-950 hover:bg-slate-900 hover:border-white/20'}`}
              >
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                >
                  <span className="font-bold text-lg text-slate-100">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ml-4 ${openFaq === index ? 'rotate-180 text-rose-400' : ''}`} />
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="p-6 pt-0 text-slate-400 leading-relaxed border-t border-white/5 mt-2">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-white/5 text-center text-slate-500">
        <div className="flex items-center justify-center gap-3 mb-8 opacity-60 hover:opacity-100 transition-opacity duration-300 cursor-pointer group">
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-rose-500/20 transition-colors">
            <Heart className="w-6 h-6 group-hover:text-rose-400 group-hover:fill-rose-400/20 transition-all" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-slate-300 group-hover:text-white transition-colors">Two Souls</span>
        </div>
        <div className="flex gap-6 justify-center mb-8 text-sm font-medium">
          <a href="#" className="hover:text-rose-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-rose-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-rose-400 transition-colors">Contact Us</a>
        </div>
        <p className="text-sm">© 2026 Two Souls Couples App. All rights reserved.</p>
      </footer>
    </div>
  );
}
