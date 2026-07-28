// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, RefreshControl, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuthStore();
  
  const [stories, setStories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchStories = async () => {
    // Problem 3/4: Real stories from stories table grouped by store
    const { data } = await safeApiCall(() => 
      supabase
        .from('stories')
        .select('*, store:stores(store_name, logo_url)')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
    );

    if (data) {
      // Group by store for unique story heads
      const uniqueStores = Array.from(new Set(data.map(s => s.store_id)));
      const groupedStories = uniqueStores.map(storeId => {
        const storeStories = data.filter(s => s.store_id === storeId);
        return {
          store_id: storeId,
          store_name: storeStories[0].store?.store_name,
          logo_url: storeStories[0].store?.logo_url,
          hasUnseen: storeStories.some(s => !s.view_count), // simplistic check for now
          stories: storeStories
        };
      });
      setStories(groupedStories);
    }
  };

  const fetchProducts = async (pageNumber = 0, isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    
    // Problem 3: Fetch real products
    const { data } = await safeApiCall(() => 
      supabase
        .from('products')
        .select('*, stores(store_name, logo_url)')
        .eq('status', 'active')
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .range(pageNumber * 20, pageNumber * 20 + 19)
    );

    if (data) {
      if (isRefresh || pageNumber === 0) {
        setProducts(data);
      } else {
        setProducts(prev => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
    }
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStories();
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchStories();
    fetchProducts(0, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage);
    }
  };

  const renderSkeleton = () => (
    <View className="flex-row justify-between px-4 mt-4" style={{ gap: 12 }}>
      <View style={{ width: '58%' }}>
        <View className="bg-surfaceContainer mb-4" style={{ height: 260, borderRadius: 0 }} />
        <View className="bg-surfaceContainer mb-4" style={{ height: 180, borderRadius: 0 }} />
      </View>
      <View style={{ width: '38%' }}>
        <View className="bg-surfaceContainer mb-4" style={{ height: 180, borderRadius: 0 }} />
        <View className="bg-surfaceContainer mb-4" style={{ height: 260, borderRadius: 0 }} />
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF] pt-2">
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 pb-2">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="text-textPrimary uppercase">FLAUNT</Text>
        <TouchableOpacity onPress={() => router.push('/activity')}>
          <Feather name="heart" size={24} color="#0D0D0D" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D0D0D" />}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            loadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {/* Stories Row */}
        <View className="py-2 border-b border-border">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
            {/* YOUR STORY */}
            <TouchableOpacity 
              className="items-center mr-4"
              onPress={() => router.push('/sell/add-story')}
            >
              <View className="w-[60px] h-[60px] rounded-full justify-center items-center relative mb-1">
                <Image 
                  source={{ uri: session?.user?.user_metadata?.avatar_url || 'https://via.placeholder.com/60' }} 
                  className="w-[56px] h-[56px] rounded-full bg-gray-200" 
                />
                <View className="absolute bottom-0 right-0 bg-[#FF3B00] rounded-full w-5 h-5 items-center justify-center border-2 border-[#F7F4EF]">
                  <Feather name="plus" size={12} color="#FFF" />
                </View>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#0D0D0D' }}>Your Story</Text>
            </TouchableOpacity>

            {/* Other Stories */}
            {stories.map(storyGrp => (
              <TouchableOpacity 
                key={storyGrp.store_id}
                className="items-center mr-4"
                onPress={() => router.push(`/story/${storyGrp.store_id}`)}
              >
                <View 
                  className="w-[60px] h-[60px] rounded-full justify-center items-center mb-1"
                  style={{ borderWidth: 2, borderColor: storyGrp.hasUnseen ? '#FF3B00' : '#EBEBEB' }}
                >
                  <Image 
                    source={{ uri: storyGrp.logo_url || 'https://via.placeholder.com/60' }} 
                    className="w-[52px] h-[52px] rounded-full bg-gray-200" 
                  />
                </View>
                <Text 
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 10, color: '#0D0D0D' }}
                  numberOfLines={1}
                >
                  {storyGrp.store_name || 'Store'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Product Masonry Grid */}
        {loading && page === 0 ? (
          renderSkeleton()
        ) : (
          <View className="px-4 mt-4 flex-row justify-between" style={{ gap: '4%' }}>
            {/* Left Column (58%) */}
            <View style={{ width: '58%' }}>
              {products.filter((_, i) => i % 2 === 0).map((product, i) => (
                <TouchableOpacity 
                  key={product.id}
                  className="mb-4"
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <Image 
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
                    style={{ width: '100%', height: i % 2 === 0 ? 260 : 180, backgroundColor: '#EBEBEB', borderRadius: 0 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Right Column (38%) */}
            <View style={{ width: '38%' }}>
              {products.filter((_, i) => i % 2 !== 0).map((product, i) => (
                <TouchableOpacity 
                  key={product.id}
                  className="mb-4"
                  onPress={() => router.push(`/product/${product.id}`)}
                >
                  <Image 
                    source={{ uri: product.images?.[0] || 'https://via.placeholder.com/400' }}
                    style={{ width: '100%', height: i % 2 === 0 ? 180 : 260, backgroundColor: '#EBEBEB', borderRadius: 0 }}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {loading && page > 0 && (
          <View className="py-4 items-center">
            <Feather name="loader" size={24} color="#0D0D0D" />
          </View>
        )}
        
        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }: any) => {
  const paddingToBottom = 20;
  return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
};
