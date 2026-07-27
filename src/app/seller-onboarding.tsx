import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, ImageBackground, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { safeApiCall } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

const { width, height } = Dimensions.get('window');

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  
  // Form details
  const [storeName, setStoreName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('VINTAGE');
  const [selectedTheme, setSelectedTheme] = useState('ARCHIVE 01');

  const categories = [
    { id: 'THRIFT', icon: 'tag', label: 'THRIFT' }, 
    { id: 'VINTAGE', icon: 'rotate-ccw', label: 'VINTAGE' }, 
    { id: 'HANDMADE', icon: 'tool', label: 'HANDMADE' }, 
  ];

  const themes = [
    { id: 'ARCHIVE 01', label: 'ARCHIVE 01', status: 'FREE', isLocked: false, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=300' },
    { id: 'VOGUE NY', label: 'VOGUE NY', status: '₹99/MO', isLocked: true, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300' },
    { id: 'BERLIN RAW', label: 'BERLIN RAW', status: '₹99/MO', isLocked: true, image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300' },
    { id: 'MUSEUM', label: 'MUSEUM', status: '₹99/MO', isLocked: true, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300' },
  ];

  const handleGetStarted = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!storeName) {
      alert("Please enter a store name.");
      return;
    }
    setStep(3); // Go to Theme Selector
  };

  const handleNextStep3 = () => {
    setStep(4); // Go to Preview Store
  };

  const handleNextStep4 = () => {
    setStep(5); // Go to You're Live
  };

  const handleFinish = async () => {
    const userId = useAuthStore.getState().session?.user?.id;
    if (!userId) {
      alert("Authentication required. Please log in first.");
      router.replace('/(auth)/login');
      return;
    }

    // 1. Create store in Supabase
    const { data: store, error } = await safeApiCall(() =>
      supabase
        .from('stores')
        .insert({
          seller_id: userId,
          store_name: storeName,
          store_slug: storeName.toLowerCase().replace(/\s+/g, '-'),
          theme_id: selectedTheme,
          bio: `Welcome to ${storeName}`,
        })
        .select()
        .single()
    );

    if (error) {
      console.warn('Failed to create store:', error);
    }

    // 2. Update user to is_seller = true
    try {
      await supabase
        .from('users')
        .update({ is_seller: true })
        .eq('id', userId);
    } catch (e) {
      console.warn("Failed to update user profile to is_seller", e);
    }

    // 3. Update Zustand auth store
    useAuthStore.setState({ isSeller: true, storeId: store?.id || 'mock-store-id' });

    // 4. Switch to seller navigation
    router.replace('/(tabs)/orders');
  };

  // STEP 1: SPLASH PAGE (Screenshot 15)
  if (step === 1) {
    return (
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800' }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/75">
          <SafeAreaView className="flex-1 justify-between p-6">
            <View className="flex-row justify-between items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13 }} className="text-white">FLAUNT</Text>
              <Feather name="menu" size={20} color="#FFFFFF" />
            </View>

            <View>
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 52, lineHeight: 56 }}
                className="text-white uppercase mb-12"
              >
                START{'\n'}SELLING ON{'\n'}FLAUNT
              </Text>

              <View className="flex-row items-center mb-6">
                <View className="w-12 h-12 bg-white/10 items-center justify-center mr-4" style={{ borderRadius: 0 }}>
                  <Feather name="camera" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15 }} className="text-white uppercase">SYNC GRAM</Text>
                  <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-white/60 mt-0.5">Turn Instagram posts into listings instantly</Text>
                </View>
              </View>

              <View className="flex-row items-center mb-12">
                <View className="w-12 h-12 bg-white/10 items-center justify-center mr-4" style={{ borderRadius: 0 }}>
                  <Feather name="credit-card" size={20} color="#FFFFFF" />
                </View>
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15 }} className="text-white uppercase">DIRECT PAY</Text>
                  <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-white/60 mt-0.5">Get paid directly via UPI</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleGetStarted}
                className="w-full bg-accent flex-row items-center justify-center py-4.5 mb-6"
                style={{ borderRadius: 0 }}
              >
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase mr-2">GET STARTED</Text>
                <Feather name="arrow-right" size={16} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()} className="items-center py-2">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase">MAYBE LATER</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  // STEP 2: STORE DETAILS (Step 1 of 4 - Screenshot 16)
  if (step === 2) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-between p-6">
        <View>
          {/* Progress segments (1st is red/active, others grey) */}
          <View className="flex-row mb-12" style={{ gap: 6 }}>
            <View className="flex-1 h-1 bg-accent" />
            <View className="flex-1 h-1 bg-border" />
            <View className="flex-1 h-1 bg-border" />
            <View className="flex-1 h-1 bg-border" />
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase mb-1">YOUR STORE</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="text-textPrimary mb-12">What's your store called?</Text>

          {/* Large text input */}
          <View className="border-b border-textPrimary pb-4 mb-2">
            <TextInput
              style={{ fontFamily: 'Inter_900Black', fontSize: 32 }}
              className="text-textPrimary p-0 m-0"
              placeholder="Enter store name"
              placeholderTextColor="#D0D0CA"
              autoFocus
              value={storeName}
              onChangeText={setStoreName}
            />
          </View>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12 }} className="text-[#9B9B8E] mb-12">
            @{storeName.toLowerCase().replace(/\s+/g, '_') || 'storename'}
          </Text>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase mb-4">SELECT CATEGORY</Text>
          
          <View className="flex-row justify-between mb-8" style={{ gap: 8 }}>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id)}
                  className="flex-1 border p-6 items-center justify-center"
                  style={{
                    backgroundColor: isSelected ? '#FFFFFF' : 'transparent',
                    borderColor: isSelected ? '#0D0D0D' : '#EBEBEB',
                    borderRadius: 0,
                    height: 110
                  }}
                >
                  <View style={{ marginBottom: 12 }}><Feather name={cat.icon as any} size={22} color="#0D0D0D" strokeWidth={1.5} /></View>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 11, letterSpacing: 1 }} className="text-textPrimary uppercase">{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleNextStep2}
          className="w-full bg-textPrimary flex-row items-center justify-center py-4.5"
          style={{ borderRadius: 0 }}
        >
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase mr-2">NEXT</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // STEP 3: THEME SELECTOR (Step 2 of 4 - Screenshot 19)
  if (step === 3) {
    return (
      <SafeAreaView className="flex-1 bg-background justify-between pt-2">
        {/* Header step progress */}
        <View className="px-6 flex-row justify-between items-center pb-4 border-b border-border bg-white">
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase">STEP 2 OF 4</Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-textSecondary uppercase mb-1">YOUR STORE THEME</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, marginBottom: 8 }} className="text-textPrimary">Make it yours.</Text>

          {/* 2x2 Grid Themes list */}
          <View className="flex-row flex-wrap justify-between mt-6" style={{ gap: 8 }}>
            {themes.map((theme) => {
              const isSelected = selectedTheme === theme.id;
              return (
                <TouchableOpacity
                  key={theme.id}
                  onPress={() => !theme.isLocked && setSelectedTheme(theme.id)}
                  className="bg-white border relative mb-6"
                  style={{
                    width: '48%',
                    borderColor: isSelected ? '#FF3B00' : '#EBEBEB',
                    borderWidth: isSelected ? 2 : 1,
                    borderRadius: 0,
                  }}
                >
                  {/* Thumbnail */}
                  <View className="w-full aspect-[3/4] bg-surfaceContainer relative">
                    <Image source={{ uri: theme.image }} className="w-full h-full" resizeMode="cover" style={{ borderRadius: 0 }} />
                    {theme.isLocked && (
                      <View className="absolute inset-0 bg-black/40 justify-center items-center">
                        <Feather name="lock" size={20} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  {/* Label footer */}
                  <View className="p-3 flex-row justify-between items-center bg-[#F7F4EF]">
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 11 }} className="text-textPrimary">{theme.label}</Text>
                    <View className="bg-black px-1.5 py-0.5" style={{ borderRadius: 0 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7 }} className="text-white">{theme.status}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Unlocks and continue */}
        <View className="px-6 pb-6" style={{ gap: 12 }}>
          {/* Unlock all themes banner */}
          <TouchableOpacity 
            className="w-full bg-[#0D0D0D] px-6 py-4 flex-row justify-between items-center"
            style={{ borderRadius: 0 }}
          >
            <View>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13 }} className="text-white uppercase mb-0.5">UNLOCK ALL THEMES</Text>
              <Text style={{ fontFamily: 'Inter_300Light', fontSize: 10 }} className="text-white/60">Starting ₹99/month</Text>
            </View>
            <Feather name="arrow-right" size={16} color="#FF3B00" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleNextStep3}
            className="w-full bg-textPrimary py-4.5 items-center justify-center"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase">CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 4: PREVIEW STORE (Step 3 of 4 - Screenshot 17)
  if (step === 4) {
    const formattedName = storeName.toUpperCase().replace(/\s+/g, '_') || 'VINTAGE_ARCHIVE';
    return (
      <SafeAreaView className="flex-1 bg-background justify-between pt-2">
        <View className="px-6 flex-row justify-between items-center pb-4 border-b border-border">
          <Feather name="menu" size={20} color="#0D0D0D" />
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-textPrimary uppercase">FLAUNT</Text>
          <Feather name="user" size={20} color="#0D0D0D" />
        </View>

        <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
          {/* Progress segments (3 segments black, 1 segment grey) */}
          <View className="flex-row mb-6" style={{ gap: 6 }}>
            <View className="flex-1 h-1 bg-black" />
            <View className="flex-1 h-1 bg-black" />
            <View className="flex-1 h-1 bg-black" />
            <View className="flex-1 h-1 bg-border" />
          </View>

          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-textSecondary uppercase text-center mb-1">STEP 3 OF 4</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, letterSpacing: 0.5 }} className="text-textPrimary uppercase text-center mb-6">THIS IS YOUR STORE</Text>

          {/* Phone Frame preview container */}
          <View className="w-full bg-white border-4 border-black p-4 mb-4" style={{ borderRadius: 24, height: height * 0.46 }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400' }} className="w-full aspect-[16/9] mb-3" style={{ borderRadius: 0 }} />
              
              <View className="flex-row items-end justify-between -mt-8 mb-4">
                <View className="w-14 h-14 bg-white p-0.5 border border-border" style={{ borderRadius: 0 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' }} className="w-full h-full" style={{ borderRadius: 0 }} />
                </View>
              </View>

              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary uppercase">{formattedName}</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase mt-1 mb-4">CURATED IN BERLIN • 1.2K FOLLOWERS</Text>

              {/* Two items */}
              <View className="flex-row justify-between mb-4" style={{ gap: 6 }}>
                <View className="flex-1 border border-border bg-[#F7F4EF] p-2" style={{ borderRadius: 0 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150' }} className="w-full aspect-square mb-2" style={{ borderRadius: 0 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textPrimary uppercase" numberOfLines={1}>ARCHIVE TECH S...</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textPrimary mt-0.5">$450</Text>
                </View>
                <View className="flex-1 border border-border bg-[#F7F4EF] p-2" style={{ borderRadius: 0 }}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150' }} className="w-full aspect-square mb-2" style={{ borderRadius: 0 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textPrimary uppercase" numberOfLines={1}>BRUTALIST BOOT</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textPrimary mt-0.5">$320</Text>
                </View>
              </View>
            </ScrollView>
          </View>

          {/* flaunt.app copy link section */}
          <View className="flex-row justify-between items-center py-4 border-t border-b border-border mb-6">
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }} className="text-textPrimary">flaunt.app/{storeName.toLowerCase().replace(/\s+/g, '_') || 'vintage_archive'}</Text>
            <TouchableOpacity><Feather name="copy" size={18} color="#0D0D0D" /></TouchableOpacity>
          </View>
        </ScrollView>

        <View className="px-6 pb-6">
          <TouchableOpacity 
            onPress={handleNextStep4}
            className="w-full bg-textPrimary flex-row items-center justify-center py-4.5"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase mr-2">NEXT</Text>
            <Feather name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP 5: YOU'RE LIVE (Screenshot 18)
  return (
    <View className="flex-1 bg-black justify-between p-6">
      <SafeAreaView className="flex-1 justify-between">
        <View /> 

        <View className="items-center">
          <View 
            className="w-24 h-24 border-4 border-accent bg-transparent items-center justify-center mb-8"
            style={{ borderRadius: 48 }}
          >
            <Feather name="check" size={48} color="#FF3B00" strokeWidth={3} />
          </View>

          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 48, lineHeight: 52 }}
            className="text-white uppercase text-center mb-2"
          >
            YOU'RE LIVE.
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
            className="text-[#9B9B8E] text-center"
          >
            @{storeName.toLowerCase().replace(/\s+/g, '_') || 'storename'}
          </Text>
        </View>

        <View className="mb-6" style={{ gap: 12 }}>
          <TouchableOpacity 
            onPress={handleFinish}
            className="w-full bg-accent items-center justify-center py-4.5"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase">ADD FIRST PRODUCT</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleFinish}
            className="w-full border border-white items-center justify-center py-4.5 bg-transparent"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1.5 }} className="text-white uppercase">ADD FIRST STORY</Text>
          </TouchableOpacity>

          <TouchableOpacity className="items-center py-4">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase">SHARE YOUR STORE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
