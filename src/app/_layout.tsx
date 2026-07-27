import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

import '../lib/logger';
import '../global.css';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, lastActivity, updateActivity, signOut } = useAuthStore();
  const appState = useRef(AppState.currentState);

  const [loaded, error] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Handle Inactivity and AppState
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        const now = Date.now();
        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
        if (now - lastActivity > INACTIVITY_LIMIT) {
          signOut();
          router.replace('/(auth)/login');
        } else {
          updateActivity();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        updateActivity();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [lastActivity]);

  // Handle Route Guarding
  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, segments]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F7F4EF' } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="store/[id]" />
      <Stack.Screen name="product/[id]" />
      <Stack.Screen name="auction/[id]" />
      <Stack.Screen name="share-review" />
      <Stack.Screen name="story-viewer" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="seller-onboarding" />
    </Stack>
  );
}
