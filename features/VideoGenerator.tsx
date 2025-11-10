
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GenerateVideosOperation } from '@google/genai';
import { generateVideo, checkVideoOperation } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { AspectRatio } from '../types';
import { VideoIcon } from '../components/icons/VideoIcon';
import { UploadIcon } from '../components/icons/UploadIcon';
import { KeyIcon } from '../components/icons/KeyIcon';

const aspectRatios: AspectRatio[] = ["16:9", "9:16", "1:1", "4:3", "3:4"];

const loadingMessages = [
    "Summoning digital actors...",
    "Rendering pixel by pixel...",
    "Calibrating the director's chair...",
    "Waiting for the paint to dry on the digital set...",
    "This can take a few minutes, please be patient...",
    "Composing the perfect shot...",
];

const ApiKeySelector: React.FC<{ children: React.ReactNode, onKeyReady: () => void }> = ({ children, onKeyReady }) => {
    const [hasKey, setHasKey] = useState(false);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const keyStatus = await window.aistudio.hasSelectedApiKey();
                setHasKey(keyStatus);
                if (keyStatus) onKeyReady();
            } else {
                 setHasKey(false);
            }
            setIsChecking(false);
        };
        checkKey();
    }, [onKeyReady]);

    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            await window.aistudio.openSelectKey();
            // Assume success and let the user proceed.
            // A failed API call later will prompt them again.
            setHasKey(true);
            onKeyReady();
        }
    };
    
    if (isChecking) {
        return <div className="text-center text-gray-400">Checking API Key status...</div>;
    }
    
    if (!hasKey) {
        return (
            <div className="text-center p-8 bg-gray-800/50 border border-gray-700 rounded-xl max-w-md mx-auto">
                <KeyIcon className="w-12 h-12 mx-auto mb-4 text-cyan-400"/>
                <h3 className="text-lg font-semibold mb-2">API Key Required for Video Generation</h3>
                <p className="text-gray-400 text-sm mb-4">
                    The Veo model requires you to select your own Google AI Studio API key. 
                    This service may incur billing charges.
                </p>
                <button onClick={handleSelectKey} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">
                    Select API Key
                </button>
                 <p className="text-xs text-gray-500 mt-4">
                    For more information, see the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-400">billing documentation</a>.
                </p>
            </div>
        );
    }
    
    return <>{children}</>;
};


const VideoGenerator: React.FC = () => {
    const [isKeyReady, setIsKeyReady] = useState(false);
    const [mode, setMode] = useState<'text' | 'image'>('text');
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
    const [image, setImage] = useState<{ file: File; url: string; base64: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (isLoading) {
            intervalRef.current = window.setInterval(() => {
                setLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    const nextIndex = (currentIndex + 1) % loadingMessages.length;
                    return loadingMessages[nextIndex];
                });
            }, 3000);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isLoading]);


    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setImage({ file, url: URL.createObjectURL(file), base64 });
            } catch (err) {
                setError("Failed to load image.");
            }
        }
    };

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim() && mode === 'text') {
            setError("Please enter a prompt.");
            return;
        }
        if (!image && mode === 'image') {
            setError("Please upload an image.");
            return;
        }

        setIsLoading(true);
        setVideoUrl(null);
        setError(null);
        setLoadingMessage(loadingMessages[0]);
        
        try {
            let operation = await generateVideo(prompt, aspectRatio, mode === 'image' ? { base64: image!.base64, mimeType: image!.file.type } : undefined);

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await checkVideoOperation(operation);
            }
            
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                 const videoBlob = await response.blob();
                 setVideoUrl(URL.createObjectURL(videoBlob));
            } else {
                throw new Error("Video generation completed but no download link was found.");
            }

        } catch (err: any) {
            console.error(err);
             if (err.message && err.message.includes("Requested entity was not found.")) {
                setError("API Key error. Please re-select your key and try again.");
                setIsKeyReady(false); // Force re-selection
            } else {
                setError('Failed to generate video. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }

    }, [prompt, aspectRatio, image, mode]);
    
    const generatorContent = (
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-6">
            <div className="w-full bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700">
                <div className="flex border-b border-gray-700 mb-4">
                    <button onClick={() => setMode('text')} className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'text' ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>Text-to-Video</button>
                    <button onClick={() => setMode('image')} className={`px-4 py-2 text-sm font-medium transition-colors ${mode === 'image' ? 'border-b-2 border-cyan-400 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>Image-to-Video</button>
                </div>

                {mode === 'image' && (
                     <div onClick={() => fileInputRef.current?.click()} className="mb-4 w-full aspect-video bg-gray-700/50 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-700">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                        {image ? <img src={image.url} alt="Input" className="max-h-full max-w-full rounded-lg" /> : <div className="text-gray-400 flex flex-col items-center gap-2"><UploadIcon className="w-8 h-8" /> Upload starting image</div>}
                     </div>
                )}
                
                <h2 className="text-md font-semibold mb-2 text-cyan-300">Prompt</h2>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g., A futuristic city with flying cars at sunset" className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200" rows={3} />

                <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {aspectRatios.map(ar => <button key={ar} onClick={() => setAspectRatio(ar)} className={`px-4 py-2 text-sm rounded-md ${aspectRatio === ar ? 'bg-cyan-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>{ar}</button>)}
                    </div>
                </div>

                <button onClick={handleGenerate} disabled={isLoading} className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {isLoading ? "Generating..." : <><VideoIcon className="w-5 h-5"/> Generate Video</>}
                </button>
            </div>

            {error && <div className="text-red-400 bg-red-900/50 p-3 rounded-lg w-full text-center">{error}</div>}

            <div className="w-full aspect-video bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center p-4">
                {isLoading ? (
                    <div className="text-center text-gray-400">
                        <div className="w-8 h-8 mx-auto border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>{loadingMessage}</p>
                    </div>
                ) : videoUrl ? (
                    <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full rounded-lg shadow-2xl" />
                ) : (
                    <div className="text-center text-gray-500">
                         <VideoIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Your generated video will appear here</p>
                    </div>
                )}
            </div>
      </div>
    );
    
    return <ApiKeySelector onKeyReady={() => setIsKeyReady(true)}>{isKeyReady ? generatorContent : null}</ApiKeySelector>;
};

export default VideoGenerator;
