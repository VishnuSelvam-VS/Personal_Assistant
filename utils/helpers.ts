import { FunctionCall } from '@google/genai';

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as Base64 string.'));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        if (reader.result) {
            resolve((reader.result as string).split(',')[1]);
        } else {
            reject('Failed to convert blob to base64');
        }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const SUPPORTED_APPS = ['whatsapp', 'youtube', 'maps', 'gmail', 'calendar', 'spotify'];

/**
 * Executes the logic to open an application in a new tab based on the
 * arguments from a Gemini function call.
 * @param fc The FunctionCall object from the Gemini response.
 * @returns A result string indicating success.
 */
export const handleOpenApplication = (fc: FunctionCall): string => {
    const args = fc.args;
    const appName = (args.appName as string)?.toLowerCase();

    if (!appName || !SUPPORTED_APPS.includes(appName)) {
        throw new Error(`Application "${appName}" is not supported.`);
    }

    let url: string;

    switch (appName) {
        case 'whatsapp':
            const phoneNumber = args.phoneNumber as string;
            const text = args.text as string;
            url = 'https://web.whatsapp.com';
            if (phoneNumber) {
                const cleanPhoneNumber = phoneNumber.replace(/[^0-9]/g, '');
                url = `https://wa.me/${cleanPhoneNumber}`;
                if (text) {
                    url += `?text=${encodeURIComponent(text)}`;
                }
            }
            break;
        case 'youtube':
            const searchQuery = args.searchQuery as string;
            url = 'https://www.youtube.com';
            if (searchQuery) {
                url += `/results?search_query=${encodeURIComponent(searchQuery)}`;
            }
            break;
        case 'maps':
            const location = args.location as string;
            url = 'https://www.google.com/maps';
            if (location) {
                url += `/search/?api=1&query=${encodeURIComponent(location)}`;
            }
            break;
        case 'gmail':
            const recipient = args.recipient as string;
            const subject = args.subject as string;
            const body = args.body as string;
             // If any compose field is present, go to compose view
            if (recipient || subject || body) {
                url = 'https://mail.google.com/mail/?view=cm&fs=1';
                if (recipient) url += `&to=${encodeURIComponent(recipient)}`;
                if (subject) url += `&su=${encodeURIComponent(subject)}`;
                if (body) url += `&body=${encodeURIComponent(body)}`;
            } else {
                 // Otherwise, just open the inbox
                url = 'https://mail.google.com/';
            }
            break;
        case 'calendar':
            url = 'https://calendar.google.com/';
            break;
        case 'spotify':
            const spotifySearchQuery = args.searchQuery as string;
            url = 'https://open.spotify.com';
            if (spotifySearchQuery) {
                url += `/search/${encodeURIComponent(spotifySearchQuery)}`;
            }
            break;
        default:
            throw new Error(`Application "${appName}" logic not implemented.`);
    }

    window.open(url, '_blank');
    
    // Return a message that includes details of what was done
    let details = '';
    if (args.searchQuery) details = ` for "${args.searchQuery}"`;
    if (args.location) details = ` for "${args.location}"`;
    if (args.recipient) details = ` to ${args.recipient}`;

    return `Successfully opened ${args.appName}${details}.`;
};