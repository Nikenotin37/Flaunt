// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// Note: expo-camera would be used here in a full real environment, simulated for this scope
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const { width, height } = Dimensions.get('window');

export default function AddStoryScreen() {
  const router = useRouter();
  const { session, storeId } = useAuthStore();
  
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Simulated capture
  const handleCapture = () => {
    setPhotoUri('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800');
    setIsEditing(true);
  };

  const handlePublish = async () => {
    if (!session?.user?.id || !storeId) {
      alert('You must be a seller to post a story.');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const { error } = await safeApiCall(() => 
      supabase.from('stories').insert({
        store_id: storeId,
        media_url: photoUri,
        caption: caption,
        expires_at: expiresAt.toISOString()
      })
    );

    if (!error) {
      alert('Story Added!');
      router.replace('/');
    } else {
      alert('Error adding story');
    }
  };

  if (!isEditing) {
    return (
      <View className="flex-1 bg-black">
        <SafeAreaView className="flex-1 justify-between">
          {/* Top Bar */}
          <View className="flex-row justify-between items-center px-4 py-2">
            <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={28} color="#FFF" /></TouchableOpacity>
            <Feather name="settings" size={24} color="#FFF" />
          </View>

          {/* Camera View Area Simulated */}
          <View className="flex-1 justify-center items-center">
             <Text className="text-white/50 font-inter">Camera View (Simulated)</Text>
          </View>

          {/* Bottom Controls */}
          <View className="pb-8 px-8 flex-row items-center justify-between">
            <TouchableOpacity className="w-10 h-10 border border-white/50 items-center justify-center rounded-lg overflow-hidden">
              <Image source={{ uri: 'https://via.placeholder.com/40' }} className="w-full h-full" />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleCapture}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
            >
              <View className="w-16 h-16 rounded-full bg-white" />
            </TouchableOpacity>

            <TouchableOpacity>
              <Feather name="refresh-cw" size={28} color="#FFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Image source={{ uri: photoUri! }} className="absolute w-full h-full" resizeMode="cover" />
      
      <SafeAreaView className="flex-1 justify-between">
        <View className="flex-row justify-between px-4 py-2">
          <TouchableOpacity onPress={() => setIsEditing(false)}><Feather name="arrow-left" size={28} color="#FFF" /></TouchableOpacity>
          <View className="flex-row gap-6">
            <TouchableOpacity><Feather name="type" size={24} color="#FFF" /></TouchableOpacity>
            <TouchableOpacity><Feather name="tag" size={24} color="#FFF" /></TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <TextInput
            style={{ fontFamily: 'Inter_900Black', fontSize: 32, fontStyle: 'italic', color: '#FFF', textAlign: 'center' }}
            placeholder="ADD CAPTION..."
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={caption}
            onChangeText={setCaption}
            multiline
          />
        </View>

        <View className="p-4 flex-row justify-between items-center">
          <View className="flex-row gap-4">
             <TouchableOpacity className="w-12 h-12 bg-black/50 rounded-full items-center justify-center"><Text className="text-white font-bold">A</Text></TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            onPress={handlePublish}
            className="bg-white px-6 py-3 rounded-full flex-row items-center"
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-black uppercase mr-2">ADD TO STORY</Text>
            <Feather name="chevron-right" size={16} color="#000" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}
