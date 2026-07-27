import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  lastActivity: number;
  isSeller: boolean;
  storeId: string | null;
  setSession: (session: Session | null) => void;
  setInitialized: (initialized: boolean) => void;
  updateActivity: () => void;
  signOut: () => void;
  setSeller: (isSeller: boolean, storeId?: string | null) => void;
  checkSellerStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  isInitialized: false,
  lastActivity: Date.now(),
  isSeller: false,
  storeId: null,
  setSession: (session) => {
    set({ session, user: session?.user || null, lastActivity: Date.now() });
    // Check seller status when session is set
    if (session?.user) {
      get().checkSellerStatus();
    }
  },
  setInitialized: (isInitialized) => set({ isInitialized }),
  updateActivity: () => set({ lastActivity: Date.now() }),
  setSeller: (isSeller, storeId = null) => set({ isSeller, storeId }),
  signOut: () => {
    supabase.auth.signOut().catch(console.error);
    set({ session: null, user: null, isSeller: false, storeId: null });
  },
  checkSellerStatus: async () => {
    const userId = get().session?.user?.id;
    if (!userId) return;
    try {
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('seller_id', userId)
        .limit(1)
        .maybeSingle();
      if (data) {
        set({ isSeller: true, storeId: data.id });
      } else {
        set({ isSeller: false, storeId: null });
      }
    } catch {
      // Table may not exist — gracefully ignore
    }
  },
}));
