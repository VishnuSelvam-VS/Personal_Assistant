import React from 'react';
import { useAuth } from './contexts/AuthContext';
import App from './App';
import Auth from './features/Auth';

const AppWrapper: React.FC = () => {
    const { isLoggedIn } = useAuth();
    
    // The Auth component has its own background styling
    // So we don't need the main body background when showing it.
    React.useEffect(() => {
        if (isLoggedIn) {
            document.body.style.backgroundImage = 'linear-gradient(to bottom right, #08203e, #1d1635)';
        } else {
            document.body.style.backgroundImage = 'none';
        }
    }, [isLoggedIn]);

    return isLoggedIn ? <App /> : <Auth />;
};

export default AppWrapper;
