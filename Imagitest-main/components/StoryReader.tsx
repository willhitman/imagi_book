import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Volume2, Home, MessageCircle, X, Sparkles, Loader2, GraduationCap } from 'lucide-react';
import { Story, StoryPage, ChatMessage } from '../types';
import * as GeminiService from '../services/geminiService';

interface StoryReaderProps {
  story: Story;
  onBack: () => void;
}

interface WordInfo {
  word: string;
  startTime: number;
}

const LOADING_MESSAGES = [
  "Whispering to the winds...",
  "Gathering the stars...",
  "Painting with light...",
  "Weaving your magic story...",
  "Almost there, adventurer!"
];

const StoryReader: React.FC<StoryReaderProps> = ({ story, onBack }) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pages, setPages] = useState<StoryPage[]>(story.pages);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isBuddyOpen, setIsBuddyOpen] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  
  // Teach Mode State
  const [isTeachMode, setIsTeachMode] = useState(false);
  const [loadingWord, setLoadingWord] = useState<string | null>(null);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: 'model', text: `Hi! I'm your reading buddy. Ask me anything about "${story.title}"!` }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // References for Teach Mode sliding interaction
  const lastReadIndexRef = useRef<number | null>(null);
  const latestWordRequestRef = useRef<number>(0);

  const currentPage = pages[currentPageIndex];

  // Logic to generate video for a specific index
  const triggerPageGeneration = async (index: number) => {
    if (!pages[index] || pages[index].videoUrl || pages[index].isGenerating) return;

    setPages(prev => {
      const next = [...prev];
      if (next[index]) {
          next[index] = { ...next[index], isGenerating: true };
      }
      return next;
    });

    try {
      const videoUrl = await GeminiService.generateAnimatedIllustration(pages[index].imagePrompt);
      setPages(prev => {
        const next = [...prev];
        if (next[index]) {
            next[index] = { ...next[index], videoUrl, isGenerating: false };
        }
        return next;
      });
      return true;
    } catch (e) {
      console.error(`Failed to generate video for page ${index}`, e);
      setPages(prev => {
        const next = [...prev];
        if (next[index]) {
            next[index] = { ...next[index], isGenerating: false };
        }
        return next;
      });
      return false;
    }
  };

  // Waterfall pre-generation logic
  useEffect(() => {
    const startPreload = async () => {
      // Step 1: Generate first page immediately
      const page1Done = await triggerPageGeneration(0);
      
      if (page1Done) {
        // Step 2: Once first is done, start 2nd and 3rd in parallel
        await Promise.all([
          triggerPageGeneration(1),
          triggerPageGeneration(2)
        ]);
        
        // Step 3: Once those are done, finish remaining pages in batches
        const remainingPromises = [];
        for (let i = 3; i < pages.length; i++) {
            remainingPromises.push(triggerPageGeneration(i));
        }
        await Promise.all(remainingPromises);
      }
    };
    startPreload();
  }, [story.id]); // Added dependency to re-run if story changes (though unlikely within component lifecycle)

  // Message rotator for long video generations
  useEffect(() => {
    if (currentPage.isGenerating) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [currentPage.isGenerating]);

  // Turn off teach mode when changing pages
  useEffect(() => {
    setIsTeachMode(false);
    lastReadIndexRef.current = null;
  }, [currentPageIndex]);

  const stopAudio = () => {
    if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
    }
    setIsPlayingAudio(false);
    setActiveWordIndex(null);
  };

  const handleWordClick = async (word: string, index: number) => {
    if (!isTeachMode) return;
    
    // Clean word for better TTS (remove punctuation like quotes)
    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (!cleanWord) return;

    // Update the last read index to current
    lastReadIndexRef.current = index;

    // Track this specific request ID to handle race conditions (sliding fast)
    const requestId = Date.now();
    latestWordRequestRef.current = requestId;

    try {
        stopAudio(); // Stop narrative if playing
        setLoadingWord(word);
        
        // Generate speech for just this word
        const buffer = await GeminiService.generateSpeech(cleanWord);
        
        // If the user has moved to another word (new request started), ignore this result
        if (latestWordRequestRef.current !== requestId) return;
        
        // Play it
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.start();
        audioSourceRef.current = source;
        
    } catch(e) {
        console.error("Failed to read word", e);
    } finally {
        if (latestWordRequestRef.current === requestId) {
            setLoadingWord(null);
        }
    }
  };

  const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isTeachMode) return;

    // For mouse, only if button is pressed (drag)
    if (e.type === 'mousemove' && (e as React.MouseEvent).buttons !== 1) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const element = document.elementFromPoint(clientX, clientY) as HTMLElement;
    
    if (element && element.dataset.wordIndex) {
        const index = parseInt(element.dataset.wordIndex, 10);
        const word = element.dataset.wordText;
        
        // Only trigger if we moved to a new word
        if (index !== lastReadIndexRef.current && word) {
            handleWordClick(word, index);
        }
    }
  };

  const handlePlayAudio = async () => {
    if (isPlayingAudio) {
        stopAudio();
        return;
    }

    // Turn off teach mode when reading starts
    setIsTeachMode(false);

    try {
        setIsPlayingAudio(true);
        let buffer = currentPage.audioBuffer;
        
        if (!buffer) {
             buffer = await GeminiService.generateSpeech(currentPage.text);
             setPages(prev => {
                const newPages = [...prev];
                newPages[currentPageIndex] = { ...newPages[currentPageIndex], audioBuffer: buffer };
                return newPages;
              });
        }

        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }

        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer!;
        source.connect(audioContextRef.current.destination);
        
        const duration = buffer!.duration;
        const words = currentPage.text.split(/(\s+)/);
        const totalChars = currentPage.text.length;
        let currentChars = 0;
        
        const wordsWithTimings = words.map((word) => {
          const startTime = (currentChars / totalChars) * duration;
          currentChars += word.length;
          return { word, startTime };
        });

        source.onended = () => {
            setIsPlayingAudio(false);
            setActiveWordIndex(null);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };

        const playStartTime = audioContextRef.current.currentTime;
        startTimeRef.current = playStartTime;

        const updateHighlight = () => {
            if (!audioContextRef.current) return;
            const elapsed = audioContextRef.current.currentTime - playStartTime;
            
            let index = 0;
            for (let i = 0; i < wordsWithTimings.length; i++) {
                if (elapsed >= wordsWithTimings[i].startTime) {
                    index = i;
                } else {
                    break;
                }
            }
            setActiveWordIndex(index);
            animationFrameRef.current = requestAnimationFrame(updateHighlight);
        };

        source.start();
        audioSourceRef.current = source;
        animationFrameRef.current = requestAnimationFrame(updateHighlight);

    } catch (e) {
        console.error("Audio playback failed", e);
        setIsPlayingAudio(false);
    }
  };

  const handleSendMessage = async () => {
      if (!inputMessage.trim()) return;
      const newMsg: ChatMessage = { role: 'user', text: inputMessage };
      setChatMessages(prev => [...prev, newMsg]);
      setInputMessage('');
      setIsChatLoading(true);

      try {
          const history = chatMessages.map(m => ({
              role: m.role,
              parts: [{ text: m.text }]
          }));
          const contextMessage = `[Context: The child is reading page ${currentPageIndex + 1} of "${story.title}". The text is: "${currentPage.text}"]\nUser asks: ${inputMessage}`;
          const responseText = await GeminiService.getChatResponse(history, contextMessage);
          setChatMessages(prev => [...prev, { role: 'model', text: responseText }]);
      } catch (e) {
          setChatMessages(prev => [...prev, { role: 'model', text: "Oops, I'm a bit tired. Let me try again later!" }]);
      } finally {
          setIsChatLoading(false);
      }
  };

  const renderText = () => {
      const words = currentPage.text.split(/(\s+)/);
      return words.map((word, idx) => {
          const isInteractive = isTeachMode && word.trim().length > 0;
          const isLoading = loadingWord === word;
          
          return (
            <span 
                key={idx} 
                onClick={() => handleWordClick(word, idx)}
                data-word-index={idx}
                data-word-text={word}
                className={`transition-all duration-200 inline-block rounded-md px-0.5 relative z-10
                    ${activeWordIndex === idx ? 'text-kid-purple font-black scale-110 drop-shadow-sm' : 'text-gray-800'}
                    ${isInteractive ? 'cursor-pointer hover:text-kid-purple hover:bg-purple-100 hover:scale-110 active:scale-95' : ''}
                    ${isLoading ? 'animate-pulse text-kid-purple' : ''}
                `}
            >
                {word}
            </span>
          );
      });
  };

  return (
    <div className="h-screen bg-paper overflow-hidden relative w-full">
      {/* Floating Header */}
      <div className="absolute top-0 left-0 w-full z-20 p-4 md:p-6 flex items-center justify-between pointer-events-none">
        <button onClick={onBack} className="pointer-events-auto p-3 md:p-4 rounded-full bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white text-gray-700 hover:text-kid-blue transition-all hover:scale-110 border-2 border-white/50">
            <Home size={24} className="md:w-7 md:h-7" />
        </button>
        
        <div className="pointer-events-auto bg-white/80 backdrop-blur-md shadow-xl rounded-full px-6 py-2 md:px-8 md:py-3 mx-2 md:mx-4 max-w-[50%] md:max-w-xl truncate border-2 border-white/50">
            <h1 className="text-lg md:text-2xl lg:text-3xl font-comic font-bold text-gray-800 truncate">{story.title}</h1>
        </div>
        
        <button 
            onClick={() => setIsBuddyOpen(true)}
            className="pointer-events-auto p-3 md:p-4 rounded-full bg-kid-yellow shadow-xl text-white hover:bg-yellow-400 transition-all hover:scale-110 border-2 border-white/20"
        >
            <MessageCircle size={24} className="md:w-7 md:h-7" />
        </button>
      </div>

      {/* Main Content Area - with padding for floating elements */}
      <div className="w-full h-full overflow-y-auto pt-24 pb-32 px-4 md:px-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 max-w-[1800px] mx-auto w-full items-center md:items-stretch justify-center min-h-[calc(100vh-14rem)]">
            
            {/* Animated Image Section */}
            <div className="w-full md:w-5/12 aspect-square max-h-[50vh] md:max-h-none bg-gray-100 rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl overflow-hidden relative flex items-center justify-center border-2 md:border-4 lg:border-8 border-white shrink-0 self-center">
            {currentPage.videoUrl ? (
                <video 
                    src={currentPage.videoUrl} 
                    autoPlay 
                    loop 
                    muted 
                    playsInline 
                    className="w-full h-full object-cover animate-fade-in"
                />
            ) : (
                <div className="flex flex-col items-center text-gray-400 p-4 text-center">
                    <Loader2 size={40} className="md:w-16 md:h-16 mb-4 text-kid-blue animate-spin" />
                    <p className="font-comic text-base md:text-xl text-gray-600">
                        {LOADING_MESSAGES[loadingMsgIdx]}
                    </p>
                </div>
            )}
            </div>

            {/* Text Section - Centered content */}
            <div className="w-full md:w-7/12 flex flex-col items-center space-y-6 p-2 justify-center h-full translate-y-[10px]">
                
                <div className="flex items-center gap-4 w-full justify-center order-2 flex-wrap">
                    <button 
                        onClick={handlePlayAudio}
                        className={`flex items-center gap-2 md:gap-3 px-6 py-3 rounded-full font-bold text-lg md:text-xl transition-all transform hover:scale-105 shadow-lg ${
                            isPlayingAudio 
                            ? 'bg-kid-pink text-white' 
                            : 'bg-kid-green text-white'
                        }`}
                    >
                        <Volume2 size={24} className="md:w-7 md:h-7" />
                        {isPlayingAudio ? 'Stop' : 'Read to Me'}
                    </button>

                    <button 
                        onClick={() => {
                            stopAudio();
                            setIsTeachMode(!isTeachMode);
                            lastReadIndexRef.current = null;
                        }}
                        className={`flex items-center gap-2 md:gap-3 px-6 py-3 rounded-full font-bold text-lg md:text-xl transition-all transform hover:scale-105 shadow-lg border-2 ${
                            isTeachMode
                            ? 'bg-kid-purple text-white border-kid-purple' 
                            : 'bg-white text-kid-purple border-kid-purple hover:bg-purple-50'
                        }`}
                    >
                        <GraduationCap size={24} className="md:w-7 md:h-7" />
                        {isTeachMode ? 'Teaching...' : 'Teach'}
                    </button>
                </div>

                <div 
                    onTouchMove={handleTouchMove}
                    onMouseMove={handleTouchMove}
                    className={`bg-white p-6 md:p-10 rounded-3xl md:rounded-[40px] shadow-lg md:shadow-xl w-full border-l-8 md:border-l-[12px] lg:border-l-[20px] flex items-center order-1 transition-colors duration-300 min-h-[40vh] md:min-h-[50vh] ${
                    isTeachMode ? 'border-kid-purple ring-4 ring-purple-100 touch-none cursor-crosshair' : 'border-kid-blue'
                }`}>
                    <div className="text-xl sm:text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-comic leading-relaxed lg:leading-[1.5] flex flex-wrap gap-x-1 md:gap-x-2 select-none">
                        {renderText()}
                    </div>
                </div>
                
                {isTeachMode && (
                    <div className="order-3 w-full text-center text-kid-purple font-comic font-bold animate-pulse text-lg">
                        Slide your finger over words to hear them!
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* Floating Footer */}
      <div className="absolute bottom-0 left-0 w-full z-20 p-4 md:p-8 flex justify-between items-center pointer-events-none">
        <button 
            disabled={currentPageIndex === 0}
            onClick={() => {
                stopAudio();
                setCurrentPageIndex(p => p - 1);
            }}
            className={`pointer-events-auto px-6 py-3 md:px-8 md:py-4 rounded-full flex items-center gap-2 md:gap-3 font-bold text-lg md:text-xl transition-all shadow-xl backdrop-blur-md border-2 border-white/50 ${
                currentPageIndex === 0 
                ? 'bg-white/60 text-gray-400 cursor-not-allowed' 
                : 'bg-white/90 text-kid-blue hover:bg-white hover:scale-105'
            }`}
        >
            <ArrowLeft size={24} className="md:w-8 md:h-8" />
            <span className="hidden sm:inline">Prev</span>
        </button>

        <span className="pointer-events-auto font-comic text-gray-800 font-bold text-sm md:text-lg bg-white/80 backdrop-blur-md px-6 py-2 md:px-8 md:py-3 rounded-full shadow-xl border-2 border-white/50">
            {currentPageIndex + 1} / {pages.length}
        </span>

        <button 
            disabled={currentPageIndex === pages.length - 1}
            onClick={() => {
                stopAudio();
                setCurrentPageIndex(p => p + 1);
            }}
            className={`pointer-events-auto px-6 py-3 md:px-8 md:py-4 rounded-full flex items-center gap-2 md:gap-3 font-bold text-lg md:text-xl transition-all shadow-xl backdrop-blur-md border-2 border-white/20 ${
                currentPageIndex === pages.length - 1
                ? 'bg-white/60 text-gray-400 cursor-not-allowed' 
                : 'bg-kid-blue/90 text-white hover:bg-kid-blue hover:scale-105'
            }`}
        >
            <span className="hidden sm:inline">Next</span>
            <ArrowRight size={24} className="md:w-8 md:h-8" />
        </button>
      </div>

      {/* Reading Buddy Sidebar */}
      {isBuddyOpen && (
        <div className="absolute inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-[1px]">
            <div className="w-full md:w-[450px] bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
                <div className="p-4 md:p-6 bg-kid-yellow flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 md:gap-3">
                        <div className="bg-white p-1 md:p-2 rounded-full">
                            <Sparkles size={18} className="text-kid-yellow md:w-6 md:h-6" />
                        </div>
                        <h2 className="font-comic font-bold text-white text-lg md:text-2xl">Reading Buddy</h2>
                    </div>
                    <button onClick={() => setIsBuddyOpen(false)} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                        <X size={24} className="md:w-8 md:h-8" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50">
                    {chatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-4 md:p-5 rounded-2xl md:rounded-3xl text-base md:text-xl leading-relaxed ${
                                msg.role === 'user' 
                                ? 'bg-kid-blue text-white rounded-tr-none shadow-md' 
                                : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                        <div className="flex justify-start">
                             <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex gap-1 md:gap-2">
                                <span className="w-2 md:w-3 h-2 md:h-3 bg-gray-400 rounded-full animate-bounce"></span>
                                <span className="w-2 md:w-3 h-2 md:h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                <span className="w-2 md:w-3 h-2 md:h-3 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                             </div>
                        </div>
                    )}
                </div>

                <div className="p-4 md:p-6 bg-white border-t shrink-0">
                    <div className="flex gap-2 md:gap-3">
                        <input 
                            type="text" 
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask..."
                            className="flex-1 border-2 border-gray-200 rounded-full px-4 md:px-6 py-2 md:py-4 text-base md:text-xl focus:outline-none focus:border-kid-blue font-comic"
                        />
                        <button 
                            onClick={handleSendMessage}
                            disabled={isChatLoading || !inputMessage.trim()}
                            className="bg-kid-blue text-white p-3 md:p-5 rounded-full hover:bg-blue-400 disabled:opacity-50 transition-colors shadow-lg"
                        >
                            <ArrowRight size={20} className="md:w-7 md:h-7" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StoryReader;