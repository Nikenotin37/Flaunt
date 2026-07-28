// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

export default function StoreProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthStore();
  
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    fetchStoreAndProducts();
    checkFollowStatus();
  }, [id]);

  const fetchStoreAndProducts = async () => {
    const { data: storeData } = await safeApiCall(() => 
      supabase.from('stores').select('*').eq('id', id).single()
    );
    if (storeData) {
      setStore(storeData);
      setFollowerCount(storeData.follower_count || 0);
    }
    
    const { data: prodData } = await safeApiCall(() => 
      supabase.from('products').select('*').eq('store_id', id).order('created_at', { ascending: false })
    );
    if (prodData) setProducts(prodData);
    
    setLoading(false);
  };

  const checkFollowStatus = async () => {
    if (!session?.user?.id) return;
    const { data } = await safeApiCall(() => 
      supabase.from('follows').select('id').eq('follower_id', session.user.id).eq('store_id', id).maybeSingle()
    );
    if (data) setIsFollowing(true);
  };

  const handleFollowToggle = async () => {
    if (!session?.user?.id) return router.push('/sign-in' as any);
    
    // Optimistic update
    setIsFollowing(!isFollowing);
    setFollowerCount(prev => isFollowing ? prev - 1 : prev + 1);

    if (isFollowing) {
      await safeApiCall(() => supabase.from('follows').delete().eq('follower_id', session.user.id).eq('store_id', id));
    } else {
      await safeApiCall(() => supabase.from('follows').insert({ follower_id: session.user.id, store_id: id }));
    }
  };

  if (loading || !store) return <View className="flex-1 bg-[#F7F4EF]" />;

  // Problem 7 Theme Logic
  const theme = store.theme_id || 'classic';
  
  let themeStyles = {
    bg: '#F7F4EF',
    text: '#0D0D0D',
    secondary: '#9B9B8E',
    border: '#EBEBEB',
    accent: '#0D0D0D',
    heroFont: 'Inter_900Black',
    heroSize: 32,
    alignItems: 'flex-start' as 'flex-start' | 'center',
    padding: 16
  };

  if (theme === 'dark_luxury') {
    themeStyles = { ...themeStyles, bg: '#0D0D0D', text: '#FFFFFF', secondary: '#888888', border: '#333333', accent: '#FFFFFF', alignItems: 'center' };
  } else if (theme === 'editorial') {
    themeStyles = { ...themeStyles, heroSize: 48, heroFont: 'Inter_900Black', alignItems: 'center' };
  } else if (theme === 'minimal') {
    themeStyles = { ...themeStyles, padding: 32, alignItems: 'center', bg: '#FFFFFF' };
  } else if (theme === 'bold') {
    themeStyles = { ...themeStyles, accent: '#FF3B00' };
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeStyles.bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={themeStyles.text} />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: themeStyles.text }} className="uppercase">
          {store.store_name}
        </Text>
        <TouchableOpacity>
          <Feather name="more-horizontal" size={24} color={themeStyles.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner/Hero */}
        {store.banner_url && (
          <Image source={{ uri: store.banner_url }} className="w-full h-48 bg-gray-200" />
        )}

        <View style={{ padding: themeStyles.padding, alignItems: themeStyles.alignItems }}>
          {!store.banner_url && (
            <Image 
              source={{ uri: store.logo_url || 'https://via.placeholder.com/150' }} 
              className="w-24 h-24 rounded-full mb-4 border"
              style={{ borderColor: themeStyles.border }}
            />
          )}

          <Text 
            style={{ 
              fontFamily: themeStyles.heroFont as any, 
              fontSize: themeStyles.heroSize, 
              color: themeStyles.text,
              textAlign: themeStyles.alignItems === 'center' ? 'center' : 'left'
            }} 
            className="uppercase mb-2"
          >
            {store.store_name}
            {store.is_verified && <Feather name="check-circle" size={themeStyles.heroSize * 0.6} color={themeStyles.text} style={{ marginLeft: 8 }} />}
          </Text>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: themeStyles.text, marginBottom: 16, textAlign: themeStyles.alignItems === 'center' ? 'center' : 'left' }}>
            {store.bio || 'Curated archive of exceptional pieces.'}
          </Text>

          <View className="flex-row items-center mb-6" style={{ gap: 16 }}>
            <View>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: themeStyles.text }}>{followerCount}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: themeStyles.secondary }} className="uppercase">Followers</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: themeStyles.text }}>{products.length}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: themeStyles.secondary }} className="uppercase">Pieces</Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity 
            onPress={handleFollowToggle}
            className="w-full py-3 items-center justify-center border"
            style={{ 
              backgroundColor: isFollowing ? 'transparent' : themeStyles.accent, 
              borderColor: themeStyles.accent,
              borderRadius: 0 
            }}
          >
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: isFollowing ? themeStyles.accent : (theme === 'dark_luxury' ? '#000' : '#FFF') }} 
              className="uppercase"
            >
              {isFollowing ? 'Following' : 'Follow Store'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Grid */}
        <View className="flex-row flex-wrap mt-4 border-t" style={{ borderColor: themeStyles.border }}>
          {products.map((item, index) => (
            <TouchableOpacity 
              key={item.id} 
              onPress={() => router.push(`/product/${item.id}`)}
              style={{ 
                width: width / 3, 
                height: width / 3, 
                borderRightWidth: (index + 1) % 3 !== 0 ? 1 : 0,
                borderBottomWidth: 1,
                borderColor: themeStyles.bg
              }}
            >
              <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }} className="w-full h-full bg-gray-200" />
            </TouchableOpacity>
          ))}
        </View>
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}
