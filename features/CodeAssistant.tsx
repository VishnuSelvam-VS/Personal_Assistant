import React, { useState, useCallback } from 'react';
import { debugCode } from '../services/geminiService';
import { CodeIcon } from '../components/icons/CodeIcon';
import { SendIcon } from '../components/icons/SendIcon';
import { SonaIcon } from '../components/icons/VishnuIcon';
import { CopyIcon } from '../components/icons/CopyIcon';

const languages = [
    "javascript", "python", "typescript", "java", "csharp", "cpp", "php", "go", "rust", "kotlin", "swift", "html", "css", "sql"
];

const CodeAssistant: React.FC = () => {
    const [code, setCode] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [issue, setIssue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [copiedBlockIndex, setCopiedBlockIndex] = useState<number | null>(null);

    const handleDebug = useCallback(async () => {
        if (!code.trim() || !issue.trim()) {
            setError('Please provide the code and describe the issue.');
            return;
        }
        setIsLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await debugCode(code, language, issue);
            setResult(response.text);
        } catch (err) {
            console.error(err);
            setError('An error occurred while analyzing the code. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [code, language, issue]);

    const handleCopyCode = (codeToCopy: string, index: number) => {
        navigator.clipboard.writeText(codeToCopy);
        setCopiedBlockIndex(index);
        setTimeout(() => {
            setCopiedBlockIndex(null);
        }, 2000); // Reset after 2 seconds
    };

    const renderResponse = (responseText: string) => {
        const parts = responseText.split(/(```(?:\w+\n)?[\s\S]*?```)/g);
        return parts.map((part, index) => {
            if (part.startsWith('```')) {
                const codeContent = part.replace(/```(?:\w+\n)?|```/g, '').trim();
                const lang = part.match(/```(\w+)/)?.[1] || 'Code';

                return (
                    <div key={index} className="bg-black/50 my-4 rounded-lg border border-gray-700">
                        <div className="flex justify-between items-center px-4 py-2 bg-gray-800/50 rounded-t-lg text-xs text-gray-400">
                            <span>{lang}</span>
                             <button
                                onClick={() => handleCopyCode(codeContent, index)}
                                className="flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-colors"
                            >
                                {copiedBlockIndex === index ? (
                                    'Copied!'
                                ) : (
                                    <>
                                        <CopyIcon className="w-4 h-4" />
                                        Copy Code
                                    </>
                                )}
                            </button>
                        </div>
                        <pre className="p-4 overflow-x-auto">
                            <code className="text-sm font-mono">{codeContent}</code>
                        </pre>
                    </div>
                );
            } else {
                return part.trim() ? <p key={index} className="my-2 leading-relaxed whitespace-pre-wrap">{part.trim()}</p> : null;
            }
        }).filter(Boolean);
    };

    return (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            <div className="flex flex-col gap-4">
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <label htmlFor="language" className="block text-sm font-medium text-cyan-300 mb-2">Language</label>
                    <select
                        id="language"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full bg-gray-700/50 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200"
                    >
                        {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
                <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700 flex-1 flex flex-col">
                    <label htmlFor="code-input" className="block text-sm font-medium text-cyan-300 mb-2">Code</label>
                    <textarea
                        id="code-input"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Paste your code snippet here..."
                        className="flex-1 w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200 font-mono text-sm resize-none"
                    />
                </div>
                 <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <label htmlFor="issue-input" className="block text-sm font-medium text-cyan-300 mb-2">Problem Description</label>
                    <textarea
                        id="issue-input"
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        placeholder="e.g., 'This function throws an error when the input is null' or 'How can I refactor this to be more efficient?'"
                        className="w-full bg-gray-700/50 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 text-gray-200 resize-none"
                        rows={3}
                    />
                </div>
                 <button
                    onClick={handleDebug}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isLoading ? (
                        <>
                           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                           Analyzing Code...
                        </>
                    ) : (
                        <>
                           <SendIcon className="w-5 h-5" /> Analyze & Debug
                        </>
                    )}
                </button>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl flex flex-col">
                <div className="p-4 border-b border-gray-700">
                    <h3 className="font-semibold text-cyan-300">Sona's Analysis</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 prose prose-invert prose-sm max-w-none text-gray-300">
                   {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <SonaIcon className="w-16 h-16 animate-pulse" />
                            <p className="mt-4">Analyzing your code...</p>
                        </div>
                   )}
                   {error && <div className="text-red-400 p-3 bg-red-900/30 rounded-lg">{error}</div>}
                   {result && renderResponse(result)}
                   {!isLoading && !result && !error && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                            <CodeIcon className="w-16 h-16 mx-auto mb-4" />
                            <p>Your code analysis and suggestions will appear here.</p>
                        </div>
                   )}
                </div>
            </div>
        </div>
    );
};

export default CodeAssistant;