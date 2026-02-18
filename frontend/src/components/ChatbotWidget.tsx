import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const CHATBOT_SCRIPT_URL =
    'https://reschatbot.livelymeadow-4f6bca4e.centralindia.azurecontainerapps.io//embed.js';

/**
 * ChatbotWidget
 * Injects the chatbot embed script into <head> only when the user is
 * authenticated (any role). Removes the script + widget on logout.
 */
export const ChatbotWidget: React.FC = () => {
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            // Remove script and any widget DOM node the chatbot may have injected
            const existing = document.getElementById('reschatbot-script');
            if (existing) existing.remove();

            // Some chatbot embeds add a root container — clean it up if present
            const widget = document.getElementById('reschatbot-widget');
            if (widget) widget.remove();

            return;
        }

        // Avoid injecting twice
        if (document.getElementById('reschatbot-script')) return;

        const script = document.createElement('script');
        script.id = 'reschatbot-script';
        script.src = CHATBOT_SCRIPT_URL;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            // Cleanup on unmount (shouldn't normally happen, but just in case)
            const s = document.getElementById('reschatbot-script');
            if (s) s.remove();
        };
    }, [isAuthenticated]);

    return null; // renders nothing — purely a side-effect component
};
