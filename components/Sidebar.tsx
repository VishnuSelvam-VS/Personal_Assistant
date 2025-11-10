import React from 'react';
import { Feature } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { ImageIcon } from './icons/ImageIcon';
import { EditIcon } from './icons/EditIcon';
import { VideoIcon } from './icons/VideoIcon';
import { FilmIcon } from './icons/FilmIcon';
import { MicIcon } from './icons/MicIcon';
import { VishnuIcon } from './icons/VishnuIcon';
import { CodeIcon } from './icons/CodeIcon';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const NavItem: React.FC<{
  feature: Feature;
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ feature, activeFeature, setActiveFeature, icon, label }) => {
  const isActive = activeFeature === feature;
  return (
    <button
      onClick={() => setActiveFeature(feature)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
        isActive
          ? 'bg-cyan-500/20 text-cyan-300 shadow-lg border border-cyan-500/30'
          : 'text-gray-400 hover:bg-white/10 hover:text-gray-200'
      }`}
    >
      {icon}
      <span className="ml-4">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  const navItems = [
    { feature: Feature.CHAT, icon: <ChatIcon className="w-5 h-5" />, label: 'Chat' },
    { feature: Feature.LIVE_CONVERSATION, icon: <MicIcon className="w-5 h-5" />, label: 'Live Conversation' },
    { feature: Feature.CODE_ASSISTANT, icon: <CodeIcon className="w-5 h-5" />, label: 'Code Assistant' },
    { feature: Feature.IMAGE_GENERATOR, icon: <ImageIcon className="w-5 h-5" />, label: 'Image Generator' },
    { feature: Feature.IMAGE_EDITOR, icon: <EditIcon className="w-5 h-5" />, label: 'Image Editor' },
    { feature: Feature.VIDEO_GENERATOR, icon: <VideoIcon className="w-5 h-5" />, label: 'Video Generator' },
    { feature: Feature.VIDEO_ANALYZER, icon: <FilmIcon className="w-5 h-5" />, label: 'Video Analyzer' },
  ];

  return (
    <aside className="w-64 bg-black/20 p-4 flex flex-col backdrop-blur-lg">
      <div className="flex items-center gap-2 px-2 pb-6 border-b border-white/10">
         <VishnuIcon className="w-10 h-10"/>
        <h2 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
           VISHNU
        </h2>
      </div>
      <nav className="flex-1 mt-6 space-y-2">
        {navItems.map(item => (
          <NavItem
            key={item.feature}
            feature={item.feature}
            activeFeature={activeFeature}
            setActiveFeature={setActiveFeature}
            icon={item.icon}
            label={item.label}
          />
        ))}
      </nav>
      <div className="text-xs text-gray-500 text-center p-2">
        Powered by Gemini
      </div>
    </aside>
  );
};

export default Sidebar;