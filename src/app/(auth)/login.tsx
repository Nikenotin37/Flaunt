import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ImageBackground, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const setSession = useAuthStore((state) => state.setSession);

  const handleContinue = () => {
    if (!phone || phone.length < 10) {
      alert("Please enter a valid phone number.");
      return;
    }
    router.push({
      pathname: '/(auth)/verify',
      params: { phone: `+1 ${phone}` }
    });
  };

  const handleTestLogin = async () => {
    setLoading(true);
    const { data, error } = await safeApiCall(() => 
      supabase.auth.signInWithPassword({ email: 'test@flaunt.com', password: 'Test@1234' })
    );
    setLoading(false);
    
    if (error) {
      alert(error);
    } else if (data?.session) {
      setSession(data.session);
    }
  };

  return (
    <ImageBackground 
      source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1000' }}
      className="flex-1"
      resizeMode="cover"
    >
      {/* Dark tint overlay */}
      <View className="flex-1 bg-black/75">
        <SafeAreaView className="flex-1 px-6 justify-between py-6">
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            className="flex-1 justify-between"
          >
            {/* Header / Brand title */}
            <View className="pt-8">
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2 }}
                className="text-[#9B9B8E] uppercase mb-1"
              >
                ACCESS PORTAL
              </Text>
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 56, letterSpacing: -2 }}
                className="text-white uppercase"
              >
                FLAUNT
              </Text>
            </View>

            {/* Form Area */}
            <View className="justify-center">
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 32, lineHeight: 38 }}
                className="text-white mb-8"
              >
                Enter your phone to enter the archive.
              </Text>

              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}
                className="text-[#9B9B8E] uppercase mb-2"
              >
                PHONE NUMBER
              </Text>
              
              <View className="flex-row items-center border-b border-white pb-3 mb-6">
                <Text 
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }}
                  className="text-white mr-4"
                >
                  +1
                </Text>
                <TextInput
                  style={{ fontFamily: 'Inter_500Medium', fontSize: 20 }}
                  className="text-white flex-1 p-0 m-0"
                  placeholder="000 000 0000"
                  placeholderTextColor="#444444"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>

              <TouchableOpacity 
                onPress={handleContinue}
                disabled={loading}
                className="w-full bg-accent flex-row items-center justify-center py-4.5 mb-6"
                style={{ borderRadius: 0 }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Text 
                      style={{ fontFamily: 'Inter_900Black', fontSize: 14, letterSpacing: 1.5 }}
                      className="text-white uppercase mr-2"
                    >
                      CONTINUE
                    </Text>
                    <Feather name="arrow-right" size={16} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleTestLogin} className="mb-4 self-start">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-white/60 uppercase">
                  Test Bypass Login
                </Text>
              </TouchableOpacity>

              <Text 
                style={{ fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 14 }}
                className="text-[#555555] uppercase"
              >
                BY CONTINUING, YOU AGREE TO OUR{' '}
                <Text className="underline text-[#9B9B8E]">TERMS OF SERVICE</Text> AND{' '}
                <Text className="underline text-[#9B9B8E]">PRIVACY POLICY</Text>.
              </Text>
            </View>

            {/* Footer */}
            <View className="flex-row justify-between items-end border-t border-white/10 pt-4">
              <View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">SOCIAL</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className="text-white mt-1 uppercase">INSTAGRAM</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className="text-white uppercase">TIKTOK</Text>
              </View>
              
              <View className="items-end">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">EDITION</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className="text-white mt-1 uppercase">WINTER 24</Text>
                
                <View className="flex-row items-center mt-3">
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, marginRight: 6 }} className="text-[#9B9B8E] uppercase">SECURE CONNECTION</Text>
                  <Feather name="lock" size={12} color="#FF3B00" />
                </View>
              </View>
            </View>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
