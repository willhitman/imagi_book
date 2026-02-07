import React, { useState } from 'react';
import { BookOpen, Sparkles, Loader2, Play } from 'lucide-react';
import * as GeminiService from '../services/geminiService';
import { Story } from '../types';

interface LibraryProps {
  onSelectStory: (story: Story) => void;
}

const CLASSIC_STORIES = [
  "Cinderella",
  "The Three Little Pigs",
  "Little Red Riding Hood",
  "Jack and the Beanstalk",
  "The Tortoise and the Hare"
];

const STORAGE_KEY = 'story_spark_stories';

const Library: React.FC<LibraryProps> = ({ onSelectStory }) => {
  const [loadingStory, setLoadingStory] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStoryClick = async (title: string, index: number) => {
    try {
      setLoadingStory(title);
      setError(null);

      const colors = ['bg-kid-blue', 'bg-kid-pink', 'bg-kid-green', 'bg-kid-yellow', 'bg-kid-purple'];
      const assignedColor = colors[index % colors.length];

      // 1. Check LocalStorage for existing story
      const savedStoriesJson = localStorage.getItem(STORAGE_KEY);
      const savedStories: Story[] = savedStoriesJson ? JSON.parse(savedStoriesJson) : [];
      const existingStory = savedStories.find(s => s.title === title);

      if (existingStory) {
        // Reset media properties because Blob URLs and AudioBuffers don't persist across reloads
        // This ensures the reader will regenerate media while keeping the text constant
        const hydratedStory = {
            ...existingStory,
            pages: existingStory.pages.map(p => ({
                ...p,
                isGenerating: false,
                videoUrl: undefined,
                audioBuffer: undefined
            }))
        };
        onSelectStory(hydratedStory);
        return;
      }
      
      // 2. Generate new story if not found
      const pages = await GeminiService.generateStoryStructure(title);
      
      const newStory: Story = {
        id: Date.now().toString(),
        title,
        pages: pages,
        coverColor: assignedColor,
      };
      
      // 3. Save to LocalStorage
      savedStories.push(newStory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedStories));
      
      onSelectStory(newStory);
    } catch (e) {
      console.error(e);
      setError("Oops! Couldn't open that book. Try another?");
    } finally {
      setLoadingStory(null);
    }
  };

  const colors = ['bg-kid-blue', 'bg-kid-pink', 'bg-kid-green', 'bg-kid-yellow', 'bg-kid-purple'];

  return (
    <div className="min-h-screen p-6 md:p-12 relative z-10">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
            <h1 className="text-4xl md:text-7xl font-comic font-bold text-gray-900 mb-4 tracking-tight drop-shadow-md">
                <span className="text-kid-blue">Story</span>
                <span className="text-kid-yellow">Spark</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-800 font-comic opacity-90 italic">
                Choose a magic portal to another world...
            </p>
        </header>

        {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-8 text-center font-bold animate-bounce shadow-md border-2 border-red-200">
                {error}
            </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12">
            {CLASSIC_STORIES.map((title, index) => (
                <button
                    key={title}
                    disabled={!!loadingStory}
                    onClick={() => handleStoryClick(title, index)}
                    className={`group relative aspect-[3/4] rounded-r-3xl rounded-l-md shadow-[0_20px_50px_rgba(0,0,0,0.3)] hover:shadow-[0_30px_60px_rgba(0,0,0,0.4)] transition-all duration-300 transform hover:-translate-y-4 text-left flex flex-col overflow-hidden ${colors[index % colors.length]} ${loadingStory && loadingStory !== title ? 'opacity-50 grayscale-[0.2]' : ''}`}
                >
                    {/* Book Spine Detail */}
                    <div className="absolute left-0 top-0 bottom-0 w-6 bg-black/30 z-10 border-r border-white/10" />
                    <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-white/20 z-11" />
                    
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center relative z-20 overflow-hidden">
                         {loadingStory === title ? (
                            <div className="flex flex-col items-center gap-4 text-white">
                                <Loader2 size={56} className="animate-spin" />
                                <span className="font-bold font-comic text-xl">Weaving Magic...</span>
                            </div>
                        ) : (
                            <>
                                <div className="bg-white/10 p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-500 shrink-0">
                                    <BookOpen size={56} className="text-white opacity-95" />
                                </div>
                                <h3 className="text-[22px] md:text-[26px] font-comic font-bold text-white leading-tight drop-shadow-xl line-clamp-3 overflow-hidden">
                                    {title}
                                </h3>
                            </>
                        )}
                    </div>
                    
                    <div className="bg-black/20 p-5 flex justify-center items-center gap-2 border-t border-white/10 relative z-20 mt-auto h-[64px] shrink-0">
                        <span className="text-white font-bold text-xs md:text-sm uppercase tracking-widest font-comic whitespace-nowrap">
                            {loadingStory === title ? 'Opening Door...' : 'Begin Adventure'}
                        </span>
                        {!loadingStory && <Play size={18} className="text-white fill-current shrink-0" />}
                    </div>
                </button>
            ))}
            
            {/* "Create Your Own" Placeholder */}
            <div className="aspect-[3/4] border-4 border-dashed border-gray-600/40 rounded-3xl flex flex-col items-center justify-center p-8 text-gray-700 hover:border-kid-blue hover:text-kid-blue transition-all duration-300 cursor-pointer group hover:bg-white/40 shadow-inner">
                <div className="bg-white/50 p-6 rounded-full mb-4 shadow-sm group-hover:bg-white transition-colors">
                    <Sparkles size={56} className="group-hover:rotate-12 group-hover:scale-110 transition-transform duration-500 text-gray-500 group-hover:text-kid-yellow" />
                </div>
                <span className="font-comic font-bold text-[22px] md:text-[26px] text-center">New Enchanted Tale</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Library;