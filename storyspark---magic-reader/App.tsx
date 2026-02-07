import React, { useState } from 'react';
import Library from './components/Library';
import StoryReader from './components/StoryReader';
import { AppView, Story } from './types';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LIBRARY);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  const handleSelectStory = (story: Story) => {
    setCurrentStory(story);
    setView(AppView.READER);
  };

  const handleBackToLibrary = () => {
    setView(AppView.LIBRARY);
    setCurrentStory(null);
  };

  return (
    <div className="antialiased text-gray-900">
      {view === AppView.LIBRARY && (
        <Library onSelectStory={handleSelectStory} />
      )}
      
      {view === AppView.READER && currentStory && (
        <StoryReader story={currentStory} onBack={handleBackToLibrary} />
      )}
    </div>
  );
};

export default App;
