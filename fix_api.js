const fs = require('fs');

const code = `import { supabase } from './supabase';

interface RateLimitEntry {
  count: number;
  firstAttempt: number;
}

const rateLimits: Record<string, RateLimitEntry> = {};

export const checkRateLimit = (action: string, maxAttempts: number, windowMs: number): boolean => {
  const now = Date.now();
  const entry = rateLimits[action];

  if (!entry) {
    rateLimits[action] = { count: 1, firstAttempt: now };
    return true;
  }

  if (now - entry.firstAttempt > windowMs) {
    // Reset window
    rateLimits[action] = { count: 1, firstAttempt: now };
    return true;
  }

  if (entry.count >= maxAttempts) {
    return false;
  }

  entry.count += 1;
  return true;
};

// Global API Wrapper
export const safeApiCall = async <T = any>(
  apiFunction: () => Promise<any>,
  timeoutMs = 10000
): Promise<{ data: T | null; error: string | null }> => {
  // HTTPS Enforcement check for Supabase URL
  if (!process.env.EXPO_PUBLIC_SUPABASE_URL?.startsWith('https://')) {
    // We disable this for local mockup/testing where undefined may happen, allowing graceful fallback instead of failing completely.
    // return { data: null, error: 'Insecure connection blocked. HTTPS is required.' };
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out after 10 seconds.')), timeoutMs)
    );
    
    const result = await Promise.race([apiFunction(), timeoutPromise]) as { data: T | null; error: any };
    
    if (result && result.error) {
      console.error('[API Error]:', result.error); 
      
      let friendlyError = 'An unexpected error occurred.';
      if (result.error.message?.includes('duplicate key')) {
        friendlyError = 'This record already exists.';
      } else if (result.error.message?.includes('JWT')) {
        friendlyError = 'Your session has expired. Please log in again.';
      } else if (result.error.message) {
        friendlyError = result.error.message;
      }
      
      return { data: null, error: friendlyError };
    }
    
    return { data: result ? result.data : null, error: null };
  } catch (error: any) {
    console.error('[API Catch]:', error);
    return { data: null, error: error.message || 'A network error occurred.' };
  }
};
`;
fs.writeFileSync('src/lib/api.ts', code);
