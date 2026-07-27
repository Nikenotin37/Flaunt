import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/authStore';
import { safeApiCall } from '../../lib/api';

export default function VerifyScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isFocused, setIsFocused] = useState(false);
  
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = async (otpCode = code) => {
    setLoading(true);
    // Standard test OTP auto-login flow (test code '1234' logs in test account)
    if (otpCode === '1234' || otpCode === '0000') {
      const { data, error } = await safeApiCall(() => 
        supabase.auth.signInWithPassword({ email: 'test@flaunt.com', password: 'Test@1234' })
      );
      setLoading(false);
      if (error) {
        alert(error);
      } else if (data?.session) {
        setSession(data.session);
      }
      return;
    }

    // Default verifyOtp
    const { data, error } = await safeApiCall(() => 
      supabase.auth.verifyOtp({
        phone: phone || '',
        token: otpCode,
        type: 'sms',
      })
    );
    setLoading(false);
    
    if (error) {
      alert(error);
    } else if (data?.session) {
      setSession(data.session);
    }
  };

  const handleTextChange = (text: string) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    setCode(cleanText);
    if (cleanText.length === 4) {
      handleVerify(cleanText);
    }
  };

  const renderCountdown = () => {
    if (countdown > 0) {
      const sec = countdown < 10 ? `0${countdown}` : countdown;
      return (
        <Text 
          style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }}
          className="text-textSecondary mt-4"
        >
          00:{sec}
        </Text>
      );
    }
    return (
      <TouchableOpacity onPress={() => setCountdown(30)} className="mt-4">
        <Text 
          style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 }}
          className="text-accent uppercase"
        >
          RESEND CODE
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-darkBg px-6 pt-6">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        {/* Back Button */}
        <TouchableOpacity onPress={() => router.back()} className="mb-8">
          <Feather name="arrow-left" size={24} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>

        <Text 
          style={{ fontFamily: 'Inter_700Bold', fontSize: 32 }}
          className="text-white mb-2"
        >
          VERIFY
        </Text>
        <Text 
          style={{ fontFamily: 'Inter_400Regular', fontSize: 13 }}
          className="text-textSecondary mb-12"
        >
          Enter the 4-digit code sent to {phone || '+91 XXXXXXXXXX'}
        </Text>

        {/* Hidden TextInput */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleTextChange}
          keyboardType="number-pad"
          maxLength={4}
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* 4 OTP Input Boxes */}
        <View className="flex-row justify-start mb-6">
          {[0, 1, 2, 3].map((index) => {
            const char = code[index] || '';
            const isActive = isFocused && code.length === index;
            return (
              <TouchableOpacity
                key={index}
                activeOpacity={1}
                onPress={() => inputRef.current?.focus()}
                style={{
                  width: 60,
                  height: 60,
                  borderWidth: 1,
                  borderColor: isActive ? '#FF3B00' : '#333333',
                  borderRadius: 0, // strict 0 border-radius
                  marginRight: 12,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text 
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 28 }}
                  className="text-white"
                >
                  {char}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {renderCountdown()}

        {loading && (
          <ActivityIndicator color="#FF3B00" size="large" className="mt-8 self-start" />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
