// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const TILE_SIZE = width / COLUMN_COUNT;

export default function SearchScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'CLOTHING', 'SHOES', 'BAGS', 'JEWELRY', 'VINTAGE'];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchExploreProducts();
  }, [debouncedQuery, selectedCategory]);

  const fetchExploreProducts = async () => {
    setLoading(true);
    let query = supabase
      .from('products')
      .select('id, images, view_count')
      .eq('status', 'active')
      .order('view_count', { ascending: false }) // Order by view count
      .limit(30);

    if (debouncedQuery) {
      query = query.ilike('name', `%${debouncedQuery}%`);
    }
    
    if (selectedCategory !== 'ALL') {
      query = query.eq('category', selectedCategory);
    }

    const { data } = await safeApiCall(() => query);
    if (data) setProducts(data);
    setLoading(false);
  };

  // Build the collage grid where every 7th item is large
  const renderCollage = () => {
    const gridItems = [];
    let i = 0;

    while (i < products.length) {
      // Is it the 7th item?
      const isLarge = i % 7 === 0;

      if (isLarge) {
        const item = products[i];
        gridItems.push(
          <TouchableOpacity 
            key={item.id} 
            onPress={() => router.push(`/product/${item.id}`)}
            style={{ width: TILE_SIZE * 2, height: TILE_SIZE * 2, borderWidth: 0.5, borderColor: '#F7F4EF' }}
          >
            <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/600' }} className="w-full h-full bg-gray-200" />
          </TouchableOpacity>
        );
        i++;
      } else {
        // Find how many small items we can place together to fill the space
        const smallChunk = [];
        const limit = Math.min(i + 4, products.length);
        while (i < limit) {
          const item = products[i];
          smallChunk.push(
            <TouchableOpacity 
              key={item.id} 
              onPress={() => router.push(`/product/${item.id}`)}
              style={{ width: TILE_SIZE, height: TILE_SIZE, borderWidth: 0.5, borderColor: '#F7F4EF' }}
            >
              <Image source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }} className="w-full h-full bg-gray-200" />
            </TouchableOpacity>
          );
          i++;
        }
        
        // Wrap the small chunk in a container to align properly
        gridItems.push(
          <View key={`chunk-${i}`} className="flex-row flex-wrap" style={{ width: TILE_SIZE * 2 }}>
            {smallChunk}
          </View>
        );
      }
    }

    return (
      <View className="flex-row flex-wrap">
        {gridItems}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF]">
      {/* Search Bar */}
      <View className="px-4 py-3">
        <View className="flex-row items-center border-b border-[#0D0D0D] pb-2">
          <Feather name="search" size={20} color="#0D0D0D" className="mr-2" />
          <TextInput
            style={{ fontFamily: 'Inter_500Medium', fontSize: 16 }}
            className="flex-1 text-[#0D0D0D] p-0"
            placeholder="Search brands, styles, pieces..."
            placeholderTextColor="#9B9B8E"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Category Pills */}
      <View className="py-2 mb-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className="mr-2 px-4 py-2 border"
              style={{ 
                borderColor: selectedCategory === cat ? '#0D0D0D' : '#EBEBEB',
                backgroundColor: selectedCategory === cat ? '#0D0D0D' : 'transparent',
                borderRadius: 0
              }}
            >
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }}
                className={selectedCategory === cat ? 'text-white' : 'text-[#0D0D0D]'}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Collage Grid */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0D0D0D" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {renderCollage()}
          <View className="h-20" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
