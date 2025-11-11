import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessage, GroundingChunk } from '../types';
import { generateText, generateWithSearch, generateWithMaps, generateSpeech, openApplicationFunctionDeclaration, generateImage, generateTextWithImage } from '../services/geminiService';
import { handleOpenApplication, fileToBase64 } from '../utils/helpers';
import { UserIcon } from '../components/icons/UserIcon';
import { RedIcon } from '../components/icons/VisIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { GlobeIcon } from '../components/icons/GlobeIcon';
import { MapPinIcon } from '../components/icons/MapPinIcon';
import { CpuIcon } from '../components/icons/CpuIcon';
import { ZapIcon } from '../components/icons/ZapIcon';
import { SparklesIcon } from '../components/icons/SparklesIcon';
import { SpeakerIcon } from '../components/icons/SpeakerIcon';
import { YouTubeIcon } from '../components/icons/YouTubeIcon';
import { GmailIcon } from '../components/icons/GmailIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { ActionIcon } from '../components/icons/ActionIcon';
import { SpotifyIcon } from '../components/icons/SpotifyIcon';
import { ImageIcon } from '../components/icons/ImageIcon';
import { PaperclipIcon } from '../components/icons/PaperclipIcon';
import { CloseIcon } from '../components/icons/CloseIcon';
import { ChatIcon } from '../components/icons/ChatIcon';


type ChatMode = 'balanced' | 'fast' | 'complex' | 'web' | 'maps' | 'image';

const MODE_CONFIG = {
    balanced: { model: 'gemini-2.5-flash', label: 'Balanced', icon: <SparklesIcon className="w-4 h-4" />, config: {} },
    fast: { model: 'gemini-flash-lite-latest', label: 'Fast', icon: <ZapIcon className="w-4 h-4" />, config: {} },
    complex: { 
        model: 'gemini-2.5-pro', 
        label: 'Complex', 
        icon: <CpuIcon className="w-4 h-4" />, 
        config: { 
            thinkingConfig: { thinkingBudget: 32768 },
            tools: [{ functionDeclarations: [openApplicationFunctionDeclaration] }],
        } 
    },
    web: { model: 'gemini-2.5-flash', label: 'Web Search', icon: <GlobeIcon className="w-4 h-4" />, config: {} },
    maps: { model: 'gemini-2.5-flash', label: 'Maps Search', icon: <MapPinIcon className="w-4 h-4" />, config: {} },
    image: { model: 'imagen-4.0-generate-001', label: 'Image Search', icon: <ImageIcon className="w-4 h-4" />, config: {} },
};

const appIcons: { [key: string]: React.ReactNode } = {
    youtube: <YouTubeIcon className="w-5 h-5 text-red-500" />,
    maps: <MapPinIcon className="w-5 h-5 text-green-500" />,
    gmail: <GmailIcon className="w-5 h-5 text-red-400" />,
    calendar: <CalendarIcon className="w-5 h-5 text-blue-400" />,
    whatsapp: <ChatIcon className="w-5 h-5 text-green-400" />, // Using ChatIcon for whatsapp
    spotify: <SpotifyIcon className="w-5 h-5 text-green-500" />,
    default: <ActionIcon className="w-5 h-5 text-cyan-400" />,
};

const ActionCard: React.FC<{ appName: string; result: string }> = ({ appName, result }) => {
    const icon = appIcons[appName.toLowerCase()] || appIcons.default;
    return (
        <div className="border border-purple-500/50 bg-gray-800/60 rounded-lg p-3 mt-2 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className="bg-black/30 p-2 rounded-full flex-shrink-0">{icon}</div>
                <div>
                    <h4 className="font-semibold text-purple-300">Action: Open {appName}</h4>
                    <p className="text-xs text-gray-300">{result}</p>
                </div>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: 'model', content: "I am Red, your personal assistant. How can I help you today?" }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<ChatMode>('balanced');
    const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
    const [image, setImage] = useState<{ file: File; url: string; base64: string; mimeType: string; } | null>(null);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);
    
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
    }, []);

    const decode = (base64: string): Uint8Array => {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }

    const decodeAudioData = async (
        data: Uint8Array,
        ctx: AudioContext,
        sampleRate: number,
        numChannels: number,
    ): Promise<AudioBuffer> => {
        const dataInt16 = new Int16Array(data.buffer);
        const frameCount = dataInt16.length / numChannels;
        const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
      
        for (let channel = 0; channel < numChannels; channel++) {
          const channelData = buffer.getChannelData(channel);
          for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
          }
        }
        return buffer;
    };

    const handlePlayTTS = async (text: string, index: number) => {
        if (!audioContextRef.current || isSpeaking === index) return;
        setIsSpeaking(index);
        try {
            const base64Audio = await generateSpeech(text);
            const audioData = decode(base64Audio);
            const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);
            source.start();
            source.onended = () => setIsSpeaking(null);
        } catch (error) {
            console.error("TTS Error:", error);
            setIsSpeaking(null);
            alert("Failed to generate speech.");
        }
    };

    const handleFileSelect = async (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            try {
                const base64 = await fileToBase64(file);
                setImage({
                    file: file,
                    url: URL.createObjectURL(file),
                    base64: base64,
                    mimeType: file.type,
                });
            } catch (error) {
                console.error("Error converting file to base64:", error);
                alert("Could not process the selected image.");
            }
        }
    };

    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const file = event.clipboardData.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleSendMessage = useCallback(async () => {
        if ((!input.trim() && !image) || isLoading) return;

        const currentInput = input;
        const currentImage = image;

        const newUserMessage: ChatMessage = { 
            role: 'user', 
            content: currentInput, 
            image: currentImage?.url 
        };
        setMessages(prev => [...prev, newUserMessage]);
        
        setInput('');
        setImage(null);
        setIsLoading(true);

        try {
            if (currentImage) {
                const response = await generateTextWithImage(currentInput, currentImage.base64, currentImage.mimeType);
                const modelResponseContent = (
                    <div>
                      <div dangerouslySetInnerHTML={{ __html: response.text.replace(/\n/g, '<br />') }} />
                    </div>
                );
                const newModelMessage: ChatMessage = { role: 'model', content: modelResponseContent };
                setMessages(prev => [...prev, newModelMessage]);

            } else if (mode === 'image') {
                const imageBytes = await generateImage(currentInput, '1:1');
                const imageUrl = `data:image/jpeg;base64,${imageBytes}`;
                const newModelMessage: ChatMessage = { 
                    role: 'model', 
                    content: (
                        <div>
                            <p>Here is the image you requested for: "{currentInput}"</p>
                            <img src={imageUrl} alt={currentInput} className="rounded-lg shadow-lg mt-2 max-w-full sm:max-w-sm" />
                        </div>
                    )
                };
                setMessages(prev => [...prev, newModelMessage]);
            } else {
                let response;
                if (mode === 'web') {
                    response = await generateWithSearch(currentInput);
                } else if (mode === 'maps') {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    const { latitude, longitude } = position.coords;
                    response = await generateWithMaps(currentInput, latitude, longitude);
                } else {
                    const { model, config } = MODE_CONFIG[mode];
                    // @ts-ignore
                    response = await generateText(currentInput, model, config);
                }

                // Handle function calls
                if (response.functionCalls && response.functionCalls.length > 0) {
                    for (const fc of response.functionCalls) {
                        if (fc.name === 'openApplication') {
                            try {
                                const result = handleOpenApplication(fc);
                                 const toolMessage: ChatMessage = { role: 'model', content: <ActionCard appName={fc.args.appName as string} result={result} /> };
                                 setMessages(prev => [...prev, toolMessage]);
                            } catch (e: any) {
                                 const errorMessage: ChatMessage = { role: 'model', content: `Sorry, I couldn't do that. Error: ${e.message}` };
                                 setMessages(prev => [...prev, errorMessage]);
                            }
                        }
                    }
                    if(response.text){
                        const newModelMessage: ChatMessage = { role: 'model', content: response.text };
                        setMessages(prev => [...prev, newModelMessage]);
                    }
                } else {
                    const groundingChunks: GroundingChunk[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
                    const modelResponseContent = (
                      <div>
                        <div dangerouslySetInnerHTML={{ __html: response.text.replace(/\n/g, '<br />') }} />
                        {groundingChunks.length > 0 && (
                          <div className="mt-4 border-t border-gray-600 pt-2">
                            <h4 className="text-xs font-semibold text-gray-400 mb-2">Sources:</h4>
                            <div className="flex flex-wrap gap-2">
                              {groundingChunks.map((chunk, i) => (
                                (chunk.web || chunk.maps) && (
                                    <a 
                                        key={i}
                                        href={(chunk.web || chunk.maps)?.uri} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="text-xs bg-gray-700 hover:bg-cyan-500/30 text-cyan-300 px-2 py-1 rounded-md transition-colors"
                                    >
                                        {(chunk.web || chunk.maps)?.title}
                                    </a>
                                )
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );

                    const newModelMessage: ChatMessage = { role: 'model', content: modelResponseContent, isThinking: mode === 'complex' };
                    setMessages(prev => [...prev, newModelMessage]);
                }
            }

        } catch (error) {
            console.error("Gemini API error:", error);
            const errorMessage: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, mode, image]);
    
    const ChatMessageBubble: React.FC<{ message: ChatMessage, index: number }> = ({ message, index }) => {
        const isUser = message.role === 'user';
        return (
            <div className={`flex items-start gap-2 sm:gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
                {!isUser && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg"><RedIcon className="w-5 h-5 text-white" /></div>}
                <div className={`max-w-lg p-3 sm:p-4 rounded-2xl shadow-md ${isUser ? 'bg-cyan-600 text-white rounded-br-none' : 'bg-gray-700/70 backdrop-blur-sm border border-white/10 text-gray-200 rounded-bl-none'}`}>
                   {message.isThinking && <div className="text-xs text-purple-300 mb-2 font-medium flex items-center gap-2"><CpuIcon className="w-4 h-4" /> Thinking...</div>}
                   {isUser && message.image && (
                       <img src={message.image} alt="User upload" className="rounded-lg mb-2 max-w-full h-auto max-h-60" />
                   )}
                   {message.content && <div className="prose prose-invert prose-sm max-w-none text-gray-200">{message.content}</div>}
                   {!isUser && typeof message.content === 'string' && (
                     <button onClick={() => handlePlayTTS(message.content as string, index)} className="mt-3 text-gray-400 hover:text-cyan-300 disabled:opacity-50 transition-colors">
                        {isSpeaking === index ? <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div> : <SpeakerIcon className="w-5 h-5"/>}
                     </button>
                   )}
                </div>
                {isUser && <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gray-600 flex items-center justify-center shadow-lg"><UserIcon className="w-5 h-5 text-gray-300" /></div>}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto">
            <div ref={chatContainerRef} className="flex-1 overflow-y-auto pr-2 -mr-2">
                {messages.map((msg, index) => <ChatMessageBubble key={index} message={msg} index={index} />)}
                {isLoading && (
                    <div className="flex items-start gap-3 my-4">
                        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center"><RedIcon className="w-5 h-5 text-white" /></div>
                        <div className="max-w-xl p-4 rounded-2xl shadow-md bg-gray-700/70 backdrop-blur-sm text-gray-200 rounded-bl-none">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></div>
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-auto pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 -mx-2 px-2">
                    {Object.keys(MODE_CONFIG).map((key) => {
                        const m = key as ChatMode;
                        return (
                           <button key={m} onClick={() => setMode(m)} className={`flex-shrink-0 flex items-center gap-2 px-3 py-1 text-xs rounded-full transition-colors ${mode === m ? 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50' : 'bg-black/20 hover:bg-white/10 text-gray-300'}`}>
                              {MODE_CONFIG[m].icon}
                              {MODE_CONFIG[m].label}
                           </button>
                        )
                    })}
                </div>
                {image && (
                    <div className="relative w-24 h-24 mb-2 p-1 border border-gray-600 rounded-lg">
                        <img src={image.url} alt="Preview" className="w-full h-full object-cover rounded" />
                        <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1 text-white hover:bg-red-500 shadow-lg">
                            <CloseIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                <div className="flex items-center gap-2 sm:gap-4 bg-black/20 backdrop-blur-md border border-white/10 p-2 rounded-lg shadow-inner">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                            }
                        }}
                        onPaste={handlePaste}
                        placeholder={mode === 'image' ? 'Describe the image you want...' : 'Ask Red anything...'}
                        className="flex-1 bg-transparent focus:outline-none resize-none p-2 text-gray-100"
                        rows={1}
                        disabled={isLoading}
                    />
                    <input type="file" ref={fileInputRef} onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)} accept="image/*" className="hidden"/>
                    <button onClick={() => fileInputRef.current?.click()} disabled={isLoading} className="p-2 text-gray-400 hover:text-cyan-400 transition-colors">
                        <PaperclipIcon className="w-5 h-5"/>
                    </button>
                    <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !image)} className="p-3 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">
                       <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;