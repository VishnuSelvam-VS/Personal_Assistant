import { GoogleGenAI, GenerateContentResponse, Chat, Modality, Type, LiveServerMessage, GenerateContentParameters, FunctionDeclaration, GenerateVideosOperation } from "@google/genai";
import { AspectRatio } from '../types';

export const getAi = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Tool/Function Declaration ---
export const openApplicationFunctionDeclaration: FunctionDeclaration = {
  name: 'openApplication',
  parameters: {
    type: Type.OBJECT,
    description: 'Opens a specified web application or performs a search within it. Can also compose emails.',
    properties: {
      appName: {
        type: Type.STRING,
        description: 'The name of the application to open. Supported apps: "whatsapp", "youtube", "maps", "gmail", "calendar", "spotify".',
      },
      // YouTube & Maps
      searchQuery: {
        type: Type.STRING,
        description: 'The search term for applications like YouTube or Spotify.',
      },
      location: {
          type: Type.STRING,
          description: 'The location or address to search for in Google Maps.',
      },
      // WhatsApp
      phoneNumber: {
        type: Type.STRING,
        description: 'Optional phone number for messaging apps like WhatsApp, in E.164 format.',
      },
      text: {
        type: Type.STRING,
        description: 'Optional message to pre-fill in a messaging app.',
      },
      // Gmail
      recipient: {
        type: Type.STRING,
        description: 'The email address of the recipient for composing an email in Gmail.'
      },
      subject: {
        type: Type.STRING,
        description: 'The subject line for the email in Gmail.'
      },
      body: {
        type: Type.STRING,
        description: 'The body content for the email in Gmail.'
      }
    },
    required: ['appName'],
  },
};


// Text Generation
export const generateText = async (prompt: string, model: 'gemini-2.5-flash' | 'gemini-flash-lite-latest' | 'gemini-2.5-pro', config?: GenerateContentParameters['config']): Promise<GenerateContentResponse> => {
    const ai = getAi();
    return await ai.models.generateContent({
        model,
        contents: prompt,
        config
    });
};

// Multimodal Text Generation (Text + Image)
export const generateTextWithImage = async (prompt: string, base64Image: string, mimeType: string): Promise<GenerateContentResponse> => {
    const ai = getAi();
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType,
        },
    };
    const textPart = { text: prompt };

    return await ai.models.generateContent({
        model: 'gemini-2.5-flash', // A good model for multimodal chat
        contents: { parts: [textPart, imagePart] },
    });
};

// Code Debugging
export const debugCode = async (code: string, language: string, issue: string): Promise<GenerateContentResponse> => {
    const ai = getAi();
    const systemInstruction = `You are an expert software developer and pair programmer named Red. Your role is to help users debug, understand, and improve their code.
When given a code snippet, analyze it carefully.
- If the user asks for a fix, provide the corrected code and a clear, concise explanation of the changes and why they were necessary.
- If they ask for an explanation, describe what the code does, its potential issues, and suggest improvements in performance or readability.
- If they ask for refactoring, rewrite the code to be more efficient, clean, and maintainable.
Always format your code responses within markdown code blocks with the correct language identifier. Be friendly, helpful, and encouraging.`;
    
    const userPrompt = `
I'm having an issue with my ${language} code.
Problem: ${issue}

Here is the code:
\`\`\`${language}
${code}
\`\`\`

Please help me analyze and fix it.
`;

    return await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: userPrompt,
        config: {
            systemInstruction: systemInstruction,
            temperature: 0.2, // Lower temperature for more deterministic code output
        }
    });
};


// Search Grounding
export const generateWithSearch = async (prompt: string): Promise<GenerateContentResponse> => {
    const ai = getAi();
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
};

// Maps Grounding
export const generateWithMaps = async (prompt: string, latitude: number, longitude: number): Promise<GenerateContentResponse> => {
    const ai = getAi();
    return await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            tools: [{ googleMaps: {} }],
            toolConfig: {
                retrievalConfig: {
                    latLng: {
                        latitude,
                        longitude,
                    },
                },
            },
        },
    });
};

// Image Generation
export const generateImage = async (prompt: string, aspectRatio: AspectRatio): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio,
        },
    });
    return response.generatedImages[0].image.imageBytes;
};

// Image Editing
export const editImage = async (base64Image: string, mimeType: string, prompt: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { inlineData: { data: base64Image, mimeType: mimeType } },
                { text: prompt },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            return part.inlineData.data;
        }
    }
    throw new Error('No edited image found in response.');
};

// Video Generation
export const generateVideo = async (
    prompt: string,
    aspectRatio: AspectRatio,
    image?: { base64: string, mimeType: string }
): Promise<GenerateVideosOperation> => {
    const ai = getAi();
    return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: image ? { imageBytes: image.base64, mimeType: image.mimeType } : undefined,
        config: {
            numberOfVideos: 1,
            resolution: '720p',
            aspectRatio: aspectRatio,
        }
    });
};

export const checkVideoOperation = async (operation: GenerateVideosOperation): Promise<GenerateVideosOperation> => {
    const ai = getAi();
    return await ai.operations.getVideosOperation({ operation: operation });
};

// Video Analysis
export const analyzeVideo = async (frames: string[], prompt: string): Promise<GenerateContentResponse> => {
    const ai = getAi();
    const imageParts = frames.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame,
        },
    }));

    return await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: { parts: [...imageParts, { text: prompt }] },
    });
};


// Text-to-Speech (TTS)
export const generateSpeech = async (text: string): Promise<string> => {
    const ai = getAi();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error('No audio data received from TTS API.');
    }
    return base64Audio;
};


// Live Conversation
export const connectLive = (callbacks: {
    onopen: () => void;
    onmessage: (message: LiveServerMessage) => void;
    onerror: (e: ErrorEvent) => void;
    onclose: (e: CloseEvent) => void;
}) => {
    const ai = getAi();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are Red, a friendly and helpful personal assistant.',
            // Add the tool declaration to the live session config
            tools: [{ functionDeclarations: [openApplicationFunctionDeclaration] }],
        },
    });
};