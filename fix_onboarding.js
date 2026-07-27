const fs = require('fs');

const code = `import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabase';
import { safeApiCall } from '../lib/api';

const { width, height } = Dimensions.get('window');

export default function SellerOnboardingScreen() {
  const router = useRouter();
  const { session, setSeller } = useAuthStore();
  
  const [step, setStep] = useState(1);
  const [storeName, setStoreName] = useState('');
  const [storeSlug, setStoreSlug] = useState('');
  const [category, setCategory] = useState('');
  const [selectedTheme, setSelectedTheme] = useState('classic');
  const [slugError, setSlugError] = useState('');
  
  const themes = [
    { id: 'classic', label: 'Classic (Free)' },
    { id: 'dark_luxury', label: 'Dark Luxury (Pro)' },
    { id: 'editorial', label: 'Editorial (Pro)' },
    { id: 'minimal', label: 'Minimal (Pro)' },
    { id: 'bold', label: 'Bold (Pro)' },
  ];

  const validateSlug = async () => {
    if (!storeSlug) return false;
    const { data } = await safeApiCall(() => 
      supabase.from('stores').select('id').eq('store_slug', storeSlug).single()
    );
    if (data) {
      setSlugError('Store handle already taken.');
      return false;
    }
    setSlugError('');
    return true;
  };

  const handleNextStep2 = async () => {
    if (!storeName || !storeSlug || !category) {
      alert('Please fill all fields');
      return;
    }
    const isValid = await validateSlug();
    if (isValid) setStep(3);
  };

  const handleFinish = async () => {
    if (!session?.user?.id) return router.push('/sign-in' as any);
    
    // 1. Create store in Supabase
    const { data: storeData } = await safeApiCall(() => 
      supabase.from('stores').insert({
        seller_id: session.user.id,
        store_name: storeName,
        store_slug: storeSlug,
        theme_id: selectedTheme,
        is_verified: false,
      }).select().single()
    );

    // 2. Update user to is_seller = true
    if (storeData) {
      await safeApiCall(() => 
        supabase.from('users').update({ is_seller: true }).eq('auth_id', session.user.id)
      );
      
      setSeller(true, storeData.id);
      
      // Go to profile to see the new dashboard and theme
      router.replace('/profile');
    } else {
      alert('Error creating store. Please try again.');
    }
  };

  if (step === 1) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EF] justify-center p-6">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 48, lineHeight: 52 }} className="uppercase mb-4">BECOME A SELLER.</Text>
        <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 16 }} className="mb-8">Join the elite network of curators and monetize your personal archive with FLAUNT.</Text>
        <TouchableOpacity onPress={() => setStep(2)} className="bg-[#0D0D0D] py-4 items-center">
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFF' }} className="uppercase">GET STARTED</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 2) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EF] p-6">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="uppercase mb-8">STORE DETAILS</Text>
        
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="uppercase mb-2">STORE NAME</Text>
        <TextInput 
          value={storeName} onChangeText={setStoreName}
          className="border-b border-[#0D0D0D] pb-2 mb-6 font-inter text-lg"
          placeholder="e.g. Vintage Vault"
        />

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="uppercase mb-2">STORE HANDLE</Text>
        <TextInput 
          value={storeSlug} onChangeText={(v) => { setStoreSlug(v.toLowerCase()); setSlugError(''); }}
          className="border-b border-[#0D0D0D] pb-2 mb-2 font-inter text-lg"
          placeholder="e.g. vintage_vault"
          autoCapitalize="none"
        />
        {slugError ? <Text className="text-red-500 mb-6">{slugError}</Text> : <View className="mb-6" />}

        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="uppercase mb-2">CATEGORY</Text>
        <TextInput 
          value={category} onChangeText={setCategory}
          className="border-b border-[#0D0D0D] pb-2 mb-8 font-inter text-lg"
          placeholder="e.g. Archival Fashion"
        />

        <TouchableOpacity onPress={handleNextStep2} className="bg-[#0D0D0D] py-4 items-center mt-auto">
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFF' }} className="uppercase">NEXT: CHOOSE THEME</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 3) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EF] p-6">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="uppercase mb-8">STORE THEME</Text>
        
        {themes.map(t => (
          <TouchableOpacity 
            key={t.id} 
            onPress={() => setSelectedTheme(t.id)}
            className="flex-row items-center p-4 border mb-4"
            style={{ borderColor: selectedTheme === t.id ? '#0D0D0D' : '#EBEBEB', backgroundColor: selectedTheme === t.id ? '#0D0D0D' : 'transparent' }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: selectedTheme === t.id ? '#FFF' : '#0D0D0D' }}>{t.label}</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity onPress={() => setStep(4)} className="bg-[#0D0D0D] py-4 items-center mt-auto">
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFF' }} className="uppercase">PREVIEW STORE</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (step === 4) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EF] p-6">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="uppercase mb-8 text-center">PREVIEW</Text>
        <View className="flex-1 border-4 border-[#0D0D0D] rounded-3xl p-4 bg-white items-center justify-center">
           <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="uppercase">{storeName}</Text>
           <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}>@{storeSlug}</Text>
           <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 16 }}>Theme: {selectedTheme}</Text>
        </View>

        <TouchableOpacity onPress={() => setStep(5)} className="bg-[#0D0D0D] py-4 items-center mt-8">
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFF' }} className="uppercase">GO LIVE</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // STEP 5
  return (
    <SafeAreaView className="flex-1 bg-[#0D0D0D] p-6 justify-center items-center">
      <Feather name="check-circle" size={64} color="#FF3B00" />
      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 32, color: '#FFF', textAlign: 'center', marginTop: 24 }} className="uppercase">STORE CREATED.</Text>
      
      <TouchableOpacity onPress={handleFinish} className="bg-[#FF3B00] py-4 px-12 items-center mt-12 w-full">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFF' }} className="uppercase">GO TO DASHBOARD</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
`;
fs.writeFileSync('src/app/seller-onboarding.tsx', code);
