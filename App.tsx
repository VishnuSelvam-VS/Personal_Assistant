

import React, { useState, useCallback } from 'react';
import { Feature } from './types';
import Sidebar from './components/Sidebar';
import Chat from './features/Chat';
import ImageGenerator from './features/ImageGenerator';
import ImageEditor from './features/ImageEditor';
import VideoAnalyzer from './features/VideoAnalyzer';
import LiveConversation from './features/LiveConversation';
import CodeAssistant from './features/CodeAssistant';
import { SonaIcon } from './components/icons/SonaIcon';
import { MenuIcon } from './components/icons/MenuIcon';
import { useAuth } from './contexts/AuthContext';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.CHAT);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();

  const renderFeature = useCallback(() => {
    switch (activeFeature) {
      case Feature.CHAT:
        return <Chat />;
      case Feature.IMAGE_GENERATOR:
        return <ImageGenerator />;
      case Feature.IMAGE_EDITOR:
        return <ImageEditor />;
      case Feature.VIDEO_ANALYZER:
        return <VideoAnalyzer />;
      // Fix: Corrected typo from LIVE_CONVERSION to LIVE_CONVERSATION to match the Feature enum.
      case Feature.LIVE_CONVERSATION:
        return <LiveConversation />;
      case Feature.CODE_ASSISTANT:
        return <CodeAssistant />;
      default:
        return <Chat />;
    }
  }, [activeFeature]);

  const handleFeatureSelect = (feature: Feature) => {
    setActiveFeature(feature);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-black/30 text-gray-100 font-sans relative">
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-10"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <Sidebar 
        activeFeature={activeFeature} 
        setActiveFeature={handleFeatureSelect} 
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        logout={logout}
      />
      
      <main className="flex-1 flex flex-col overflow-hidden md:bg-gray-900/50 md:backdrop-blur-xl md:rounded-l-2xl md:border-l md:border-t md:border-b border-white/10 md:my-2">
        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 md:bg-transparent">
           <div className="flex items-center gap-3">
             <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 -ml-2">
                <MenuIcon className="w-6 h-6"/>
             </button>
             <h1 className="text-xl font-bold text-cyan-400">{activeFeature}</h1>
           </div>
           <div className="flex items-center gap-3">
             <span className="hidden sm:inline text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                SONA
             </span>
             <SonaIcon className="w-8 h-8"/>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6">
          {renderFeature()}
        </div>
      </main>
    </div>
  );
};

export default App;