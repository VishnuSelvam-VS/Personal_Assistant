
import React, { useState, useRef, useCallback } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { UploadIcon } from '../components/icons/UploadIcon';
import { SendIcon } from '../components/icons/SendIcon';

const FRAME_CAPTURE_INTERVAL = 1000; // 1 frame per second
const MAX_FRAMES = 20;

const VideoAnalyzer: React.FC = () => {
    const [videoFile, setVideoFile] = useState<{ file: File; url: string } | null>(null);
    const [frames, setFrames] = useState<string[]>([]);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const captureFrames = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        setIsCapturing(true);
        setFrames([]);
        setError(null);
        setAnalysisResult(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        const duration = video.duration;
        const interval = duration > MAX_FRAMES ? duration / MAX_FRAMES : FRAME_CAPTURE_INTERVAL / 1000;
        let capturedCount = 0;
        
        video.currentTime = 0;

        const doCapture = () => {
            if (capturedCount >= MAX_FRAMES || video.currentTime >= duration) {
                setIsCapturing(false);
                return;
            }

            video.currentTime += interval;
        };

        video.onseeked = () => {
             if (capturedCount < MAX_FRAMES) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                const frameDataUrl = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
                setFrames(prev => [...prev, frameDataUrl]);
                capturedCount++;
                setTimeout(doCapture, 100);
             } else {
                 setIsCapturing(false);
             }
        }
        
        doCapture();
    }, []);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('video/')) {
            setVideoFile({ file, url: URL.createObjectURL(file) });
            setFrames([]);
            setAnalysisResult(null);
            setError(null);
        } else {
            setError("Please select a valid video file.");
        }
    };

    const handleAnalyze = async () => {
        if (!prompt.trim() || frames.length === 0) {
            setError("Please enter a question after frames have been captured.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);

        try {
            const response = await analyzeVideo(frames, prompt);
            setAnalysisResult(response.text);
        } catch (err) {
            console.error(err);
            setError("Failed to analyze the video.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center cursor-pointer hover:border-cyan-500"
                >
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="video/*" className="hidden" />
                    {videoFile ? (
                        <video ref={videoRef} src={videoFile.url} controls className="max-w-full max-h-full rounded-lg" onLoadedData={captureFrames}></video>
                    ) : (
                        <div className="text-center text-gray-500"><UploadIcon className="w-12 h-12 mx-auto mb-2" /> Click to upload a video</div>
                    )}
                </div>
                 <canvas ref={canvasRef} className="hidden"></canvas>
                <div className="text-sm text-gray-400 p-3 bg-gray-800/50 rounded-lg">
                    {isCapturing ? `Capturing frames... (${frames.length}/${MAX_FRAMES})` : 
                    videoFile ? `${frames.length} frames captured. Ready for analysis.` : "Upload a video to begin."}
                </div>
            </div>

            <div className="flex flex-col bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                <div className="flex-1 overflow-y-auto mb-4 pr-2">
                   <h3 className="font-semibold mb-4 text-cyan-300">Analysis</h3>
                   {analysisResult ? (
                       <div className="prose prose-invert prose-sm text-gray-200">{analysisResult}</div>
                   ) : (
                       <div className="text-gray-500 text-center py-10">
                           {isLoading ? "Analyzing..." : "Ask a question about the video content."}
                       </div>
                   )}
                </div>
                {isLoading && <div className="w-full h-1 bg-cyan-500/50 rounded-full overflow-hidden mb-4"><div className="w-1/2 h-full bg-cyan-400 animate-indeterminate"></div></div> }
                 <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg">
                    <input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., What is the main subject? Is the person smiling?"
                        className="flex-1 bg-transparent focus:outline-none text-gray-100 p-2"
                        disabled={isLoading || frames.length === 0}
                    />
                    <button onClick={handleAnalyze} disabled={isLoading || frames.length === 0 || !prompt.trim()} className="p-2 bg-cyan-600 rounded-full text-white hover:bg-cyan-500 disabled:bg-gray-600">
                        <SendIcon className="w-5 h-5"/>
                    </button>
                </div>
                {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            </div>
        </div>
    );
};
// Add a custom animation for the indeterminate loader
const style = document.createElement('style');
style.textContent = `
@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
.animate-indeterminate {
  animation: indeterminate 1.5s infinite linear;
}
`;
document.head.append(style);

export default VideoAnalyzer;
