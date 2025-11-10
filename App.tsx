import React, { useState, useCallback } from 'react';
import { Feature } from './types';
import Sidebar from './components/Sidebar';
import Chat from './features/Chat';
import ImageGenerator from './features/ImageGenerator';
import ImageEditor from './features/ImageEditor';
import VideoGenerator from './features/VideoGenerator';
import VideoAnalyzer from './features/VideoAnalyzer';
import LiveConversation from './features/LiveConversation';
import CodeAssistant from './features/CodeAssistant';
import { VishnuIcon } from './components/icons/VishnuIcon';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.CHAT);

  const renderFeature = useCallback(() => {
    switch (activeFeature) {
      case Feature.CHAT:
        return <Chat />;
      case Feature.IMAGE_GENERATOR:
        return <ImageGenerator />;
      case Feature.IMAGE_EDITOR:
        return <ImageEditor />;
      case Feature.VIDEO_GENERATOR:
        return <VideoGenerator />;
      case Feature.VIDEO_ANALYZER:
        return <VideoAnalyzer />;
      case Feature.LIVE_CONVERSATION:
        return <LiveConversation />;
      case Feature.CODE_ASSISTANT:
        return <CodeAssistant />;
      default:
        return <Chat />;
    }
  }, [activeFeature]);

  return (
    <div className="flex h-screen bg-black/30 text-gray-100 font-sans">
      <Sidebar activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <main className="flex-1 flex flex-col overflow-hidden bg-gray-900/50 backdrop-blur-xl rounded-l-2xl border-l border-t border-b border-white/10 my-2">
        <header className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20">
          <h1 className="text-xl font-bold text-cyan-400">{activeFeature}</h1>
           <div className="flex items-center gap-3">
             <span className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                VISHNU
             </span>
             <VishnuIcon className="w-8 h-8"/>
           </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderFeature()}
        </div>
      </main>
    </div>
  );
};

export default App;