import React from 'react';

export enum Feature {
  CHAT = 'Chat',
  LIVE_CONVERSATION = 'Live Conversation',
  IMAGE_GENERATOR = 'Image Generator',
  IMAGE_EDITOR = 'Image Editor',
  VIDEO_GENERATOR = 'Video Generator',
  VIDEO_ANALYZER = 'Video Analyzer',
  CODE_ASSISTANT = 'Code Assistant',
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export interface ChatMessage {
  role: 'user' | 'model';
  content: React.ReactNode;
  image?: string; // URL for the user's image
  isThinking?: boolean;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources: {
        reviewSnippets: {
            text: string;
            author: string;
        }[];
    }[];
  };
}