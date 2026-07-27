import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, ActivityIndicator, TextInput, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const MasonryLayout = ({ data, renderItem }: { data: any[], renderItem: (item: any, index: number) => React.ReactNode }) => {
  const leftColumn = data.filter((_, i) => i % 2 === 0);
  const rightColumn = data.filter((_, i) => i % 2 !== 0);

  return (
    <View className="flex-row px-margin-page mt-6" style={{ gap: 12 }}>
      <View style={{ flex: 1 }}>
        {leftColumn.map((item, index) => renderItem(item, index * 2))}
      </View>
      <View style={{ flex: 1 }}>
        {rightColumn.map((item, index) => renderItem(item, index * 2 + 1))}
      </View>
    </View>
  );
};

export default function DiscoverScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL GRAILS');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // FIX 9: Fetch products with range pagination
  const fetchProducts = async (currentPage = 0, isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else if (currentPage > 0) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const { data } = await safeApiCall(() =>
        supabase
          .from('products')
          .select('*, store:stores(id, store_name, logo_url)')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .range(currentPage * 20, (currentPage + 1) * 20 - 1)
      );

      if (data) {
        setProducts(prev => currentPage === 0 ? data : [...prev, ...data]);
        setHasMore(data.length === 20);
      } else {
        if (currentPage === 0) setProducts([]);
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts(0);
    fetchTrending();
  }, []);

  const onRefresh = () => {
    setPage(0);
    fetchProducts(0, true);
  };

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchProducts(nextPage, false);
  };

  // FIX 3: Fetch trending products for search page
  const fetchTrending = async () => {
    try {
      const { data } = await safeApiCall(() =>
        supabase
          .from('products')
          .select('*, store:stores(id, store_name, logo_url)')
          .eq('status', 'active')
          .order('view_count', { ascending: false })
          .limit(20)
      );
      if (data) {
        setTrendingProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // FIX 3: Real search debounced query
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      // Robust query: check title/name columns and fallback if needed
      let result = await safeApiCall(() =>
        supabase
          .from('products')
          .select('*, store:stores(id, store_name, logo_url)')
          .ilike('title', `%${query}%`)
          .eq('status', 'active')
          .limit(20)
      );

      if (result.error && result.error.includes('column "title" does not exist')) {
        result = await safeApiCall(() =>
          supabase
            .from('products')
            .select('*, store:stores(id, store_name, logo_url)')
            .ilike('name', `%${query}%`)
            .eq('status', 'active')
            .limit(20)
        );
      }

      setSearchResults(result.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle text input with 400ms debounce
  const handleSearchTextChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(text);
    }, 400);
  };

  // Mock Category Visuals
  const visualCategories = [
    { id: '1', title: 'ARCHIVE', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150' },
    { id: '2', title: 'DROPS', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150' },
    { id: '3', title: 'STYLE', image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=150' },
    { id: '4', title: 'COMMUNITY', image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=150' },
  ];

  const stories = [
    { id: 1, name: 'RAREARCH', seen: false, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 2, name: 'NOIR', seen: true, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 3, name: 'TECHNE', seen: false, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 4, name: 'FLOU', seen: true, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  const categoryPills = ['ALL GRAILS', 'OUTERWEAR', 'FOOTWEAR'];

  const renderGrail = (item: any, index: number) => {
    const height = index % 2 === 0 ? 260 : 180;
    const brandName = item.store?.store_name || item.brand || 'SELLER';
    const imageUrl = item.image || item.images?.[0] || 'https://via.placeholder.com/300x400';
    const displayTitle = item.title || item.name || 'ARCHIVE GRAIL';

    return (
      <TouchableOpacity 
        key={item.id} 
        onPress={() => router.push(`/product/${item.id}`)}
        className="bg-card mb-6"
        style={{ borderRadius: 0 }}
      >
        <View style={{ width: '100%', height }} className="relative bg-surfaceContainer border border-border">
          <Image 
            source={{ uri: imageUrl }} 
            className="w-full h-full"
            resizeMode="cover"
            style={{ borderRadius: 0 }}
          />
          {item.isFeatured && (
            <View 
              className="absolute top-3 left-3 bg-black px-2 py-1"
              style={{ borderRadius: 0 }}
            >
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 10, letterSpacing: 1 }}
                className="text-white uppercase"
              >
                FEATURED DROP
              </Text>
            </View>
          )}
        </View>

        <View className="pt-3 px-1 bg-transparent">
          <Text 
            style={{ fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 1.5 }}
            className="text-textSecondary uppercase mb-1"
          >
            {brandName.toUpperCase()}
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 18, letterSpacing: -0.5, lineHeight: 20 }}
            className="text-textPrimary"
          >
            {displayTitle.toUpperCase()}
          </Text>
          {item.price && (
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4 }}
              className="text-textPrimary"
            >
              ${item.price}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchItem = ({ item }: { item: any }) => {
    const imageUrl = item.image || item.images?.[0] || 'https://via.placeholder.com/150';
    const brandName = item.store?.store_name || item.brand || 'SELLER';
    const displayTitle = item.title || item.name || 'GRAIL';
    return (
      <TouchableOpacity 
        onPress={() => {
          setShowSearch(false);
          router.push(`/product/${item.id}`);
        }}
        className="flex-row items-center p-4 border-b border-border bg-white"
      >
        <Image source={{ uri: imageUrl }} className="w-12 h-12 bg-surfaceContainer mr-4" style={{ borderRadius: 0 }} />
        <View className="flex-1">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-textSecondary uppercase">{brandName}</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase mt-0.5">{displayTitle}</Text>
        </View>
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-textPrimary">${item.price}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-2">
      {/* Header */}
      {!showSearch ? (
        <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border">
          <TouchableOpacity>
            <Feather name="menu" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 20, letterSpacing: -1 }}
            className="text-textPrimary uppercase"
          >
            FLAUNT
          </Text>
          <TouchableOpacity>
            <Feather name="shopping-bag" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border">
          <TextInput
            placeholder="SEARCH ARCHIVE..."
            value={searchQuery}
            onChangeText={handleSearchTextChange}
            className="flex-1 text-textPrimary h-10 p-0 m-0"
            style={{ fontFamily: 'Inter_900Black', fontSize: 18, letterSpacing: -0.5 }}
            placeholderTextColor="#9B9B8E"
            autoFocus
          />
          <TouchableOpacity onPress={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }} className="pl-4">
            <Feather name="x" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      )}

      {/* SEARCH MODE CONTENT */}
      {showSearch ? (
        <View className="flex-1 bg-background">
          {searchLoading ? (
            <View className="py-12 justify-center items-center">
              <ActivityIndicator color="#0D0D0D" />
            </View>
          ) : searchQuery.trim() !== '' ? (
            searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchItem}
                contentContainerStyle={{ paddingBottom: 100 }}
              />
            ) : (
              <View className="py-20 justify-center items-center px-6">
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textSecondary uppercase">Nothing found.</Text>
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary mt-2">Try searching another archival brand or style.</Text>
              </View>
            )
          ) : (
            // FIX 3: Display Real Trending Products
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-margin-page pt-6">
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24, letterSpacing: -1 }} className="text-textPrimary uppercase mb-4">TRENDING GRAILS</Text>
                {trendingProducts.map((item) => {
                  const imageUrl = item.image || item.images?.[0] || 'https://via.placeholder.com/150';
                  const brandName = item.store?.store_name || item.brand || 'SELLER';
                  const displayTitle = item.title || item.name || 'GRAIL';
                  return (
                    <TouchableOpacity 
                      key={item.id}
                      onPress={() => {
                        setShowSearch(false);
                        router.push(`/product/${item.id}`);
                      }}
                      className="flex-row items-center py-4 border-b border-border"
                    >
                      <Image source={{ uri: imageUrl }} className="w-12 h-12 bg-surfaceContainer mr-4" style={{ borderRadius: 0 }} />
                      <View className="flex-1">
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-textSecondary uppercase">{brandName}</Text>
                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase mt-0.5" numberOfLines={1}>{displayTitle}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-textPrimary">${item.price}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        /* NORMAL DISCOVER VIEW */
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D0D0D" />}
        >
          <View className="px-margin-page pt-6">
            <Text 
              style={{ fontFamily: 'Inter_900Black', fontSize: 52, letterSpacing: -2 }}
              className="text-textPrimary uppercase mb-2"
            >
              DISCOVER
            </Text>
            <Text 
              style={{ fontFamily: 'Inter_300Light', fontSize: 14, lineHeight: 20 }}
              className="text-textSecondary mb-6"
            >
              Curated archives, trending grails, and editorial style boards from the global fashion community.
            </Text>
          </View>

          {/* Dynamic stories/visual categories row */}
          <View className="px-margin-page mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {stories.map((story) => (
                <TouchableOpacity 
                  key={story.id} 
                  onPress={() => router.push('/story-viewer')}
                  className="items-center mr-4"
                >
                  <View 
                    className="border-2 p-0.5"
                    style={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: 0,
                      borderColor: story.seen ? '#EBEBEB' : '#FF3B00'
                    }}
                  >
                    <Image 
                      source={{ uri: story.avatar }}
                      className="w-full h-full"
                      style={{ borderRadius: 0 }}
                    />
                  </View>
                  <Text 
                    style={{ fontFamily: 'Inter_400Regular', fontSize: 10, letterSpacing: 1 }}
                    className="text-textSecondary uppercase mt-1.5"
                    numberOfLines={1}
                  >
                    {story.name.slice(0, 8)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Category Pills with outlines */}
          <View className="px-margin-page mb-2">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {categoryPills.map((cat) => {
                const isSelected = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(cat)}
                    className="mr-3 border"
                    style={{
                      backgroundColor: isSelected ? '#000000' : 'transparent',
                      borderColor: isSelected ? '#000000' : '#EBEBEB',
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 0,
                    }}
                  >
                    <Text 
                      style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 }}
                      className={`uppercase ${isSelected ? 'text-white' : 'text-textPrimary'}`}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Masonry Product Grid */}
          {loading && products.length === 0 ? (
            // SKELETON LOADER CARDS
            <View className="px-margin-page mt-6 flex-row justify-between" style={{ gap: 12 }}>
              <View className="flex-1">
                <View className="bg-surfaceContainer mb-6" style={{ height: 260 }} />
                <View className="bg-surfaceContainer mb-6" style={{ height: 180 }} />
              </View>
              <View className="flex-1">
                <View className="bg-surfaceContainer mb-6" style={{ height: 180 }} />
                <View className="bg-surfaceContainer mb-6" style={{ height: 260 }} />
              </View>
            </View>
          ) : products.length > 0 ? (
            <View>
              <MasonryLayout data={products} renderItem={renderGrail} />

              {/* Infinite Scroll Load More Button */}
              {hasMore && (
                <View className="px-margin-page py-8">
                  <TouchableOpacity 
                    onPress={handleLoadMore}
                    disabled={loadingMore}
                    className="flex-row items-center justify-center py-4 border border-border bg-transparent"
                    style={{ borderRadius: 0 }}
                  >
                    {loadingMore ? (
                      <ActivityIndicator color="#0D0D0D" />
                    ) : (
                      <>
                        <Text 
                          style={{ fontFamily: 'Inter_900Black', fontSize: 14, letterSpacing: 1 }}
                          className="text-textPrimary uppercase mr-2"
                        >
                          LOAD MORE GRAILS
                        </Text>
                        <Feather name="arrow-right" size={16} color="#0D0D0D" />
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View className="py-20 justify-center items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-textSecondary uppercase">No products yet</Text>
            </View>
          )}
          <View className="h-24" />
        </ScrollView>
      )}

      {/* Floating Search Icon Box (bottom right) */}
      {!showSearch && (
        <TouchableOpacity 
          onPress={() => setShowSearch(true)}
          className="absolute bottom-20 right-6 bg-black items-center justify-center z-50"
          style={{ width: 48, height: 48, borderRadius: 0 }}
        >
          <Feather name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
