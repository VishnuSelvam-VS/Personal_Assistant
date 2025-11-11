import React, { useState, useRef, FormEvent, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SonaIcon } from '../components/icons/SonaIcon';
import { MailIcon } from '../components/icons/MailIcon';
import { CloseIcon } from '../components/icons/CloseIcon';

type AuthMode = 'login' | 'signup' | 'forgot' | 'otp' | 'reset';
type NotificationType = {
    show: boolean;
    message: string;
    type: 'success' | 'error';
};

const Notification: React.FC<{ notification: NotificationType, onDismiss: () => void }> = ({ notification, onDismiss }) => {
    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                onDismiss();
            }, 5000); // Auto-dismiss after 5 seconds
            return () => clearTimeout(timer);
        }
    }, [notification, onDismiss]);

    const bgColor = notification.type === 'success' ? 'bg-green-500/80 border-green-400/50' : 'bg-red-500/80 border-red-400/50';

    return (
        <div 
            className={`fixed top-5 right-5 z-50 transform transition-all duration-300 ease-in-out ${notification.show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
        >
            <div className={`flex items-center gap-4 p-4 rounded-lg shadow-2xl backdrop-blur-md border ${bgColor}`}>
                 <MailIcon className="w-6 h-6 text-white flex-shrink-0" />
                 <p className="text-white text-sm font-medium">{notification.message}</p>
                 <button onClick={onDismiss} className="p-1 -mr-2 text-white/70 hover:text-white">
                    <CloseIcon className="w-4 h-4" />
                 </button>
            </div>
        </div>
    );
};


const Auth: React.FC = () => {
    const [mode, setMode] = useState<AuthMode>('login');
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<NotificationType>({ show: false, message: '', type: 'success' });
    
    const { login, signup } = useAuth();

    const nameRef = useRef<HTMLInputElement>(null);
    const emailRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const confirmPasswordRef = useRef<HTMLInputElement>(null);
    const otpRef = useRef<HTMLInputElement>(null);

    const showNotification = (message: string, type: 'success' | 'error') => {
        setNotification({ show: true, message, type });
    };

    const switchMode = (newMode: AuthMode) => {
        setMode(newMode);
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            switch (mode) {
                case 'login':
                    await login(emailRef.current?.value || '', passwordRef.current?.value || '');
                    break;
                case 'signup':
                    await signup(nameRef.current?.value || '', emailRef.current?.value || '', passwordRef.current?.value || '');
                    showNotification("Account created! A confirmation email has been sent.", 'success');
                    switchMode('login');
                    break;
                case 'forgot':
                    await new Promise(resolve => setTimeout(resolve, 500));
                    showNotification(`A password reset code has been sent to ${emailRef.current?.value}.`, 'success');
                    switchMode('otp');
                    break;
                case 'otp':
                    if(otpRef.current?.value === '123456') { // Mock OTP
                       await new Promise(resolve => setTimeout(resolve, 500));
                       showNotification("Code verified. Please set a new password.", 'success');
                       switchMode('reset');
                    } else {
                        throw new Error("Invalid verification code.");
                    }
                    break;
                case 'reset':
                     if (passwordRef.current?.value !== confirmPasswordRef.current?.value) {
                        throw new Error("Passwords do not match.");
                     }
                    await new Promise(resolve => setTimeout(resolve, 500));
                    showNotification("Password reset successfully! Please log in.", 'success');
                    switchMode('login');
                    break;
            }
        } catch (err: any) {
            showNotification(err.message || 'An unexpected error occurred.', 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderForm = () => {
        switch (mode) {
            case 'login': return (
                <>
                    <h1 className="text-2xl font-bold text-center text-cyan-300">Welcome Back</h1>
                    <p className="text-center text-gray-400 text-sm mb-6">Sign in to continue with Sona</p>
                    <div className="space-y-4">
                        <input ref={emailRef} type="email" placeholder="Email" required className="input-field" />
                        <input ref={passwordRef} type="password" placeholder="Password" required className="input-field" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary mt-6">
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <div className="text-center text-sm mt-4">
                        <button type="button" onClick={() => switchMode('forgot')} className="text-cyan-400 hover:underline">Forgot Password?</button>
                    </div>
                </>
            );
            case 'signup': return (
                <>
                    <h1 className="text-2xl font-bold text-center text-cyan-300">Create Account</h1>
                    <p className="text-center text-gray-400 text-sm mb-6">Get started with your personal assistant</p>
                    <div className="space-y-4">
                        <input ref={nameRef} type="text" placeholder="Full Name" required className="input-field" />
                        <input ref={emailRef} type="email" placeholder="Email" required className="input-field" />
                        <input ref={passwordRef} type="password" placeholder="Password" required className="input-field" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary mt-6">
                        {isLoading ? 'Creating Account...' : 'Sign Up'}
                    </button>
                </>
            );
            case 'forgot': return (
                 <>
                    <h1 className="text-2xl font-bold text-center text-cyan-300">Forgot Password</h1>
                    <p className="text-center text-gray-400 text-sm mb-6">Enter your email to receive a reset code.</p>
                    <input ref={emailRef} type="email" placeholder="Email" required className="input-field" />
                    <button type="submit" disabled={isLoading} className="btn-primary mt-6">
                        {isLoading ? 'Sending...' : 'Send Reset Code'}
                    </button>
                </>
            );
            case 'otp': return (
                 <>
                    <h1 className="text-2xl font-bold text-center text-cyan-300">Verify Code</h1>
                    <p className="text-center text-gray-400 text-sm mb-6">Enter the 6-digit code sent to your email.</p>
                    <input ref={otpRef} type="text" placeholder="123456" required className="input-field text-center tracking-[0.5em]" maxLength={6}/>
                    <button type="submit" disabled={isLoading} className="btn-primary mt-6">
                        {isLoading ? 'Verifying...' : 'Verify'}
                    </button>
                </>
            );
            case 'reset': return (
                 <>
                    <h1 className="text-2xl font-bold text-center text-cyan-300">Reset Password</h1>
                    <p className="text-center text-gray-400 text-sm mb-6">Enter your new password.</p>
                     <div className="space-y-4">
                        <input ref={passwordRef} type="password" placeholder="New Password" required className="input-field" />
                        <input ref={confirmPasswordRef} type="password" placeholder="Confirm New Password" required className="input-field" />
                    </div>
                    <button type="submit" disabled={isLoading} className="btn-primary mt-6">
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </>
            );
        }
    };
    
    const renderFooterLink = () => {
        switch (mode) {
            case 'login': return (
                <p>Don't have an account? <button type="button" onClick={() => switchMode('signup')} className="font-semibold text-cyan-400 hover:underline">Sign Up</button></p>
            );
            case 'signup': return (
                <p>Already have an account? <button type="button" onClick={() => switchMode('login')} className="font-semibold text-cyan-400 hover:underline">Sign In</button></p>
            );
            case 'forgot':
            case 'otp':
            case 'reset':
                return (
                    <p>Remember your password? <button type="button" onClick={() => switchMode('login')} className="font-semibold text-cyan-400 hover:underline">Sign In</button></p>
                );
        }
    };

    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-900 p-4 bg-cover bg-center" style={{backgroundImage: 'linear-gradient(to bottom right, #08203e, #1d1635)'}}>
        <style>{`
            .input-field {
                width: 100%;
                background-color: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                color: #e5e7eb;
                transition: all 0.2s ease-in-out;
            }
            .input-field:focus {
                outline: none;
                box-shadow: 0 0 0 2px #22d3ee;
                border-color: #22d3ee;
            }
            .btn-primary {
                width: 100%;
                padding: 0.75rem;
                font-weight: 600;
                color: white;
                border-radius: 0.5rem;
                background-image: linear-gradient(to right, #22d3ee, #a855f7);
                transition: opacity 0.2s;
            }
            .btn-primary:hover {
                opacity: 0.9;
            }
            .btn-primary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
        `}</style>
        <Notification notification={notification} onDismiss={() => setNotification(prev => ({ ...prev, show: false }))} />
        <div className="w-full max-w-md">
             <div className="flex justify-center mb-6">
                <SonaIcon className="w-20 h-20"/>
            </div>
            <div className="bg-black/30 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl">
                <form onSubmit={handleSubmit}>
                    {renderForm()}
                </form>
            </div>
             <div className="text-center text-sm text-gray-400 mt-6">
                {renderFooterLink()}
            </div>
        </div>
      </div>
    );
};

export default Auth;