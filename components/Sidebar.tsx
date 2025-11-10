import React from 'react';
import { Feature } from '../types';
import { ChatIcon } from './icons/ChatIcon';
import { ImageIcon } from './icons/ImageIcon';
import { EditIcon } from './icons/EditIcon';
import { VideoIcon } from './icons/VideoIcon';
import { FilmIcon } from './icons/FilmIcon';
import { MicIcon } from './icons/MicIcon';
import { SonaIcon } from './icons/VishnuIcon';
import { CodeIcon } from './icons/CodeIcon';
import { CloseIcon } from './icons/CloseIcon';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
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

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature, isOpen, setIsOpen }) => {
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
    <aside className={`absolute md:relative z-20 w-64 bg-black/50 backdrop-blur-lg p-4 flex flex-col h-full transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
      <div className="flex items-center justify-between gap-2 px-2 pb-6 border-b border-white/10">
         <div className="flex items-center gap-2">
            <SonaIcon className="w-10 h-10"/>
            <h2 className="text-2xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
               SONA
            </h2>
         </div>
         <button onClick={() => setIsOpen(false)} className="md:hidden p-1">
            <CloseIcon className="w-6 h-6 text-gray-400 hover:text-white"/>
         </button>
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