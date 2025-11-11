import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
    isLoggedIn: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => void;
    signup: (name: string, email: string, pass: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // Check for a persisted login state
        const storedAuth = localStorage.getItem('isRedLoggedIn');
        if (storedAuth === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    // Simulate an API call for logging in
    const login = async (email: string, pass: string): Promise<void> => {
        console.log("Attempting to log in with:", email); // For debugging
        // In a real app, you would make an API call here.
        // For this simulation, we'll just accept any non-empty credentials.
        if (email && pass) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
            setIsLoggedIn(true);
            localStorage.setItem('isRedLoggedIn', 'true');
        } else {
           throw new Error("Email and password are required.");
        }
    };

    // Log the user out
    const logout = () => {
        setIsLoggedIn(false);
        localStorage.removeItem('isRedLoggedIn');
    };
    
    // Simulate an API call for signing up
    const signup = async (name: string, email: string, pass: string): Promise<void> => {
        console.log("Signing up with:", name, email); // For debugging
        if(name && email && pass) {
             await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
             // In a real app, you'd handle the response, maybe auto-login.
             // Here we'll just log success.
             return;
        } else {
            throw new Error("All fields are required for signup.");
        }
    }

    return (
        <AuthContext.Provider value={{ isLoggedIn, login, logout, signup }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};