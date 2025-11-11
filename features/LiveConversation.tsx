import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LiveServerMessage, Blob } from '@google/genai';
import { connectLive } from '../services/geminiService';
import { handleOpenApplication } from '../utils/helpers';
import { MicIcon } from '../components/icons/MicIcon';

type LiveSession = Awaited<ReturnType<typeof connectLive>>;

const LiveConversation: React.FC = () => {
    const [isTalking, setIsTalking] = useState(false);
    const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'responding' | 'error'>('idle');
    const [userTranscript, setUserTranscript] = useState('');
    const [modelTranscript, setModelTranscript] = useState('');
    const [transcriptHistory, setTranscriptHistory] = useState<{ user: string; model: string }[]>([]);

    const sessionRef = useRef<LiveSession | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    
    const userTranscriptRef = useRef('');
    const modelTranscriptRef = useRef('');

    const sourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const nextStartTimeRef = useRef(0);
    
    // --- Audio Utility Functions ---
    const encode = (bytes: Uint8Array): string => {
        let binary = '';
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

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

    const createBlob = (data: Float32Array): Blob => {
      const l = data.length;
      const int16 = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
      }
      return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
      };
    };

    // --- Core Logic ---
    const handleCleanup = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(console.error);
            audioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
            outputAudioContextRef.current = null;
        }
        
        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;

        sessionRef.current = null;
        setIsTalking(false);
        setStatus('idle');
    }, []);

    const stopConversation = useCallback(() => {
        if (sessionRef.current) {
            sessionRef.current.close();
        } else {
            handleCleanup();
        }
    }, [handleCleanup]);
    
    const startConversation = useCallback(async () => {
        if (isTalking) return;
        
        setIsTalking(true);
        setStatus('connecting');
        setTranscriptHistory([]);
        setUserTranscript('');
        setModelTranscript('');
        userTranscriptRef.current = '';
        modelTranscriptRef.current = '';

        try {
            streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            if (outputAudioContextRef.current.state === 'suspended') await outputAudioContextRef.current.resume();

            nextStartTimeRef.current = 0;

            const sessionPromise = connectLive({
                onopen: () => {
                    setStatus('listening');
                    if (!streamRef.current || !audioContextRef.current) return;
                    sourceRef.current = audioContextRef.current.createMediaStreamSource(streamRef.current);
                    processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
                    
                    processorRef.current.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        sessionPromise.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };

                    sourceRef.current.connect(processorRef.current);
                    processorRef.current.connect(audioContextRef.current.destination);
                },
                onmessage: async (message: LiveServerMessage) => {
                   if (message.toolCall) {
                        for (const fc of message.toolCall.functionCalls) {
                            if (fc.name === 'openApplication') {
                                try {
                                    const result = handleOpenApplication(fc);
                                    sessionPromise.then((session) => {
                                        session.sendToolResponse({
                                            functionResponses: {
                                                id: fc.id,
                                                name: fc.name,
                                                response: { result: result },
                                            }
                                        })
                                    });
                                } catch (e) {
                                    console.error("Function call execution error:", e);
                                }
                            }
                        }
                   }
                   if (message.serverContent?.inputTranscription) {
                       userTranscriptRef.current += message.serverContent.inputTranscription.text;
                       setUserTranscript(userTranscriptRef.current);
                   }
                   if (message.serverContent?.outputTranscription) {
                       setStatus('responding');
                       modelTranscriptRef.current += message.serverContent.outputTranscription.text;
                       setModelTranscript(modelTranscriptRef.current);
                   }
                   if (message.serverContent?.turnComplete) {
                        setTranscriptHistory(prev => [...prev, {user: userTranscriptRef.current, model: modelTranscriptRef.current}]);
                        userTranscriptRef.current = '';
                        modelTranscriptRef.current = '';
                        setUserTranscript('');
                        setModelTranscript('');
                        setStatus('listening');
                   }
                   const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                   if (base64Audio && outputAudioContextRef.current) {
                       nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContextRef.current.currentTime);
                       const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContextRef.current, 24000, 1);
                       const source = outputAudioContextRef.current.createBufferSource();
                       source.buffer = audioBuffer;
                       source.connect(outputAudioContextRef.current.destination);
                       
                       source.addEventListener('ended', () => {
                         sourcesRef.current.delete(source);
                       });

                       source.start(nextStartTimeRef.current);
                       nextStartTimeRef.current += audioBuffer.duration;
                       sourcesRef.current.add(source);
                   }
                   const interrupted = message.serverContent?.interrupted;
                   if (interrupted) {
                       sourcesRef.current.forEach(source => {
                           source.stop();
                       });
                       sourcesRef.current.clear();
                       nextStartTimeRef.current = 0;
                   }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Live session error event:', e);
                    setStatus('error');
                    handleCleanup();
                },
                onclose: (e: CloseEvent) => {
                    console.log(`Live session closed: code=${e.code}, reason='${e.reason}', wasClean=${e.wasClean}`);
                    handleCleanup();
                },
            });

            sessionRef.current = await sessionPromise;

        } catch (err) {
            console.error('Failed to start conversation:', err);
            setStatus('error');
            handleCleanup();
        }

    }, [isTalking, handleCleanup]);

    useEffect(() => {
      return () => stopConversation();
    }, [stopConversation]);
    

    const getStatusText = () => {
        switch (status) {
            case 'idle': return 'Click the button to start talking with Red.';
            case 'connecting': return 'Connecting to Red...';
            case 'listening': return 'Listening...';
            case 'responding': return 'Red is responding...';
            case 'error': return 'Connection error. Check console & network, and ensure API key is valid.';
            default: return '';
        }
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col items-center h-full">
            <div className="w-full flex-1 bg-gray-800/50 border border-gray-700 rounded-t-xl p-4 overflow-y-auto">
                {transcriptHistory.map((turn, index) => (
                    <div key={index} className="mb-4">
                        <p className="text-cyan-300 font-semibold">You:</p>
                        <p className="text-gray-300 ml-4">{turn.user}</p>
                        <p className="text-purple-300 font-semibold mt-2">Red:</p>
                        <p className="text-gray-300 ml-4">{turn.model}</p>
                    </div>
                ))}
                 {userTranscript && <div className="text-cyan-300/70">You: {userTranscript}</div>}
                 {modelTranscript && <div className="text-purple-300/70">Red: {modelTranscript}</div>}
            </div>

            <div className="w-full bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-6 flex flex-col items-center">
                <button
                    onClick={isTalking ? stopConversation : startConversation}
                    className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-500/50
                        ${isTalking ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-cyan-500 hover:bg-cyan-600'}`}
                >
                    <MicIcon className="w-10 h-10 text-white" />
                </button>
                <p className="mt-4 text-gray-400 text-sm h-5">{getStatusText()}</p>
            </div>
        </div>
    );
};

export default LiveConversation;