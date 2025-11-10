
import React, { useState, useCallback, useRef } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import { UploadIcon } from '../components/icons/UploadIcon';
import { EditIcon } from '../components/icons/EditIcon';

const ImageEditor: React.FC = () => {
    const [originalImage, setOriginalImage] = useState<{ file: File; url: string; base64: string } | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const base64 = await fileToBase64(file);
                setOriginalImage({
                    file,
                    url: URL.createObjectURL(file),
                    base64,
                });
                setEditedImage(null); // Reset edited image on new upload
                setError(null);
            } catch (err) {
                console.error(err);
                setError("Failed to load image. Please try another one.");
            }
        }
    };

    const handleEdit = useCallback(async () => {
        if (!originalImage || !prompt.trim()) {
            setError("Please upload an image and enter an editing instruction.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setEditedImage(null);

        try {
            const newImageBase64 = await editImage(originalImage.base64, originalImage.file.type, prompt);
            setEditedImage(`data:image/png;base64,${newImageBase64}`);
        } catch (err) {
            console.error(err);
            setError("Failed to edit image. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt]);

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-6">
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center p-4 cursor-pointer hover:border-cyan-500 transition-colors"
                >
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    {originalImage ? (
                        <img src={originalImage.url} alt="Original" className="max-w-full max-h-full rounded-lg" />
                    ) : (
                        <div className="text-center text-gray-500">
                            <UploadIcon className="w-12 h-12 mx-auto mb-2" />
                            <p>Click to upload an image</p>
                            <span className="text-xs">PNG, JPG, WEBP</span>
                        </div>
                    )}
                </div>
                 <div className="bg-gray-800/50 p-4 rounded-xl shadow-lg border border-gray-700">
                    <h2 className="text-md font-semibold mb-3 text-cyan-300">Editing Instructions</h2>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., Add a birthday hat on the person, make the background black and white"
                        className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-shadow text-gray-200"
                        rows={3}
                        disabled={!originalImage}
                    />
                     <button
                        onClick={handleEdit}
                        disabled={isLoading || !originalImage || !prompt.trim()}
                        className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? "Editing..." : <><EditIcon className="w-5 h-5" /> Apply Edit</>}
                    </button>
                 </div>
            </div>

            <div className="w-full aspect-video bg-gray-800/30 border-2 border-dashed border-gray-600 rounded-xl flex items-center justify-center p-4">
                {isLoading ? (
                    <div className="text-center text-gray-400">
                        <div className="w-8 h-8 mx-auto border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p>Vishnu is applying edits...</p>
                    </div>
                ) : editedImage ? (
                    <img src={editedImage} alt="Edited" className="max-w-full max-h-full rounded-lg shadow-2xl" />
                ) : (
                    <div className="text-center text-gray-500">
                         <EditIcon className="w-16 h-16 mx-auto mb-4" />
                        <p>Your edited image will appear here</p>
                    </div>
                )}
            </div>
             {error && <div className="md:col-span-2 text-red-400 bg-red-900/50 p-3 rounded-lg w-full text-center">{error}</div>}
        </div>
    );
};

export default ImageEditor;
