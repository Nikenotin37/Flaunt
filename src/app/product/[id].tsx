import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { height } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.session?.user?.id);
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('M');
  const [isSaved, setIsSaved] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
    checkWishlist();
    trackView();
  }, [id]);

  const fetchProduct = async () => {
    const { data } = await safeApiCall(() => 
      supabase
        .from('products')
        .select('*, store:stores(id, store_name, logo_url)')
        .eq('id', id)
        .single()
    );

    if (data) {
      setProduct(data);
    }
    setLoading(false);
  };

  // FIX 2 — Check if user already wishlisted this product
  const checkWishlist = async () => {
    if (!userId || !id) return;
    try {
      const { data } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', id)
        .maybeSingle();
      if (data) setIsSaved(true);
    } catch {
      // wishlist table may not exist — ignore
    }
  };

  // FIX 2 — Toggle wishlist with optimistic update
  const toggleWishlist = async () => {
    if (!userId || !id || wishlistLoading) return;
    setWishlistLoading(true);
    
    // Optimistic update
    const wasWishlisted = isSaved;
    setIsSaved(!wasWishlisted);

    try {
      if (wasWishlisted) {
        await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', id);
      } else {
        await supabase
          .from('wishlist')
          .insert({ user_id: userId, product_id: id });
      }
    } catch {
      // Revert on failure
      setIsSaved(wasWishlisted);
    }
    setWishlistLoading(false);
  };

  // FIX 10 — Track view count
  const trackView = async () => {
    if (!id) return;
    try {
      // Increment view_count directly — fire and forget
      await supabase.rpc('increment_view_count', { p_product_id: id });
    } catch {
      // RPC or column may not exist — gracefully ignore
    }
  };

  const sizes = ['S', 'M', 'L', 'XL'];

  const completeLookItems = [
    { title: 'BRUTALIST BOOT', price: 650, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300' },
    { title: 'FOLD TROUSER', price: 420, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300', isTagged: true },
    { title: 'STEEL BAND R1', price: 120, image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300' },
  ];

  if (loading) {
    return (
      <View className="flex-1 bg-[#F7F4EF] justify-center items-center">
        <ActivityIndicator color="#0D0D0D" />
      </View>
    );
  }

  // Use dynamic data if available, fallback to Heliot Sculpt Jacket exact screenshot content
  const displayTitle = product ? product.title.toUpperCase() : 'HELIOT SCULPT JACKET';
  const displayPrice = product ? `$${product.price.toLocaleString()}` : '$1,240.00';
  const displayDesc = product ? product.description : 'A rare iteration of the Sculpt Jacket, featuring custom modular paneling and an oversized architectural collar. This piece represents the pinnacle of dark-wear evolution, sourced directly from a private collector in Berlin. The silhouette is aggressive, using structural leather to maintain its shape even when unworn.';
  const displayImage = product?.images?.[0] || 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800';

  // FIX 7 — Seller info from the joined store data
  const storeName = product?.store?.store_name || null;
  const storeId = product?.store?.id || null;
  const storeLogo = product?.store?.logo_url || null;

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#0D0D0D" strokeWidth={1.5} />
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

      <ScrollView showsVerticalScrollIndicator={false} bounces={false} style={{ flex: 1 }}>
        {/* Full Bleed Image */}
        <View style={{ height: height * 0.46 }} className="w-full bg-surfaceContainer">
          <Image 
            source={{ uri: displayImage }} 
            className="w-full h-full"
            resizeMode="cover"
            style={{ borderRadius: 0 }}
          />
        </View>

        {/* Content Area */}
        <View className="p-6 pb-36">
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
            className="text-textSecondary uppercase mb-1"
          >
            ARCHIVE DROP 012
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 32, letterSpacing: -1, lineHeight: 36 }}
            className="text-textPrimary uppercase mb-2"
          >
            {displayTitle}
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 24 }}
            className="text-textPrimary mb-3"
          >
            {displayPrice}
          </Text>

          {/* FIX 7 — Seller Info Row */}
          {storeName && (
            <TouchableOpacity 
              onPress={() => storeId && router.push(`/store/${storeId}`)}
              className="flex-row items-center mb-4 py-3 border-t border-b border-border"
            >
              <View className="w-8 h-8 bg-surfaceContainer border border-border items-center justify-center mr-3" style={{ borderRadius: 0 }}>
                {storeLogo ? (
                  <Image source={{ uri: storeLogo }} className="w-full h-full" style={{ borderRadius: 0 }} />
                ) : (
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 12 }} className="text-textPrimary">{storeName.charAt(0)}</Text>
                )}
              </View>
              <View className="flex-1">
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 12, letterSpacing: 0.5 }} className="text-textPrimary uppercase">{storeName}</Text>
              </View>
              <View className="flex-row items-center">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-textPrimary uppercase mr-1">VISIT STORE</Text>
                <Feather name="arrow-right" size={12} color="#0D0D0D" strokeWidth={2} />
              </View>
            </TouchableOpacity>
          )}

          {/* 1 of 1 Archive label */}
          <View className="flex-row items-center mb-6">
            <View className="w-2.5 h-2.5 bg-accent mr-2" style={{ borderRadius: 0 }} />
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
              className="text-accent uppercase"
            >
              1 OF 1 ARCHIVE
            </Text>
          </View>

          <View className="h-[1px] w-full bg-border mb-6" />

          {/* Sizes Selection */}
          <View className="mb-6">
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
              className="text-textSecondary uppercase mb-3"
            >
              SELECT SIZE
            </Text>
            <View className="flex-row items-center mb-2" style={{ gap: 8 }}>
              {sizes.map((sz) => {
                const isSelected = selectedSize === sz;
                const isUnavailable = sz === 'XL';

                if (isUnavailable) {
                  return (
                    <View 
                      key={sz} 
                      className="border border-[#EBEBEB] bg-[#F7F4EF] justify-center items-center"
                      style={{ width: 60, height: 40, borderRadius: 0 }}
                    >
                      <Text 
                        style={{ fontFamily: 'Inter_700Bold', fontSize: 12, textDecorationLine: 'line-through' }}
                        className="text-textSecondary"
                      >
                        {sz}
                      </Text>
                    </View>
                  );
                }

                return (
                  <TouchableOpacity
                    key={sz}
                    onPress={() => setSelectedSize(sz)}
                    className="border justify-center items-center"
                    style={{
                      width: 60,
                      height: 40,
                      borderColor: isSelected ? '#0D0D0D' : '#EBEBEB',
                      backgroundColor: isSelected ? '#0D0D0D' : '#FFFFFF',
                      borderRadius: 0
                    }}
                  >
                    <Text 
                      style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }}
                      className={isSelected ? 'text-white' : 'text-textPrimary'}
                    >
                      {sz}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity>
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, textDecorationLine: 'underline', letterSpacing: 1 }}
                className="text-textSecondary uppercase"
              >
                SIZE GUIDE
              </Text>
            </TouchableOpacity>
          </View>

          {/* Product Details flat grid list */}
          <View className="bg-white border border-border p-5 mb-6" style={{ borderRadius: 0 }}>
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
              className="text-textSecondary uppercase mb-4"
            >
              PRODUCT DETAILS
            </Text>
            <View className="flex-col" style={{ gap: 12 }}>
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary">Condition</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-textPrimary">GRADE A / MINT</Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary">Material</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-textPrimary">CALFSKIN LEATHER</Text>
              </View>
              <View className="flex-row justify-between">
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary">Year</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-textPrimary">SS 2021</Text>
              </View>
            </View>
          </View>

          {/* Logistics */}
          <View className="bg-white border border-border p-5 mb-6" style={{ borderRadius: 0 }}>
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
              className="text-textSecondary uppercase mb-3"
            >
              LOGISTICS
            </Text>
            <Text 
              style={{ fontFamily: 'Inter_300Light', fontSize: 12, lineHeight: 18 }}
              className="text-textSecondary mb-4"
            >
              Complimentary express shipping on all archival drops. Fully insured and tracked worldwide.
            </Text>
            <View className="flex-row items-center">
              <View style={{ marginRight: 8 }}><Feather name="shield" size={14} color="#0D0D0D" /></View>
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
                className="text-textPrimary uppercase"
              >
                AUTHENTICITY GUARANTEED
              </Text>
            </View>
          </View>

          {/* Narrative */}
          <View className="mb-8">
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
              className="text-textSecondary uppercase mb-3"
            >
              THE NARRATIVE
            </Text>
            <Text 
              style={{ fontFamily: 'Inter_900Black', fontSize: 18, lineHeight: 26 }}
              className="text-textPrimary"
            >
              {displayDesc}
            </Text>
          </View>

          {/* Complete the look */}
          <View className="mb-8">
            <Text 
              style={{ fontFamily: 'Inter_900Black', fontSize: 20 }}
              className="text-textPrimary uppercase text-center mb-6"
            >
              COMPLETE THE LOOK
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              {completeLookItems.map((look) => (
                <View key={look.title} className="mr-4 bg-white border border-border p-3" style={{ width: 180, borderRadius: 0 }}>
                  <Image source={{ uri: look.image }} className="w-full aspect-square bg-surfaceContainer mb-3" style={{ borderRadius: 0 }} />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className="text-textPrimary uppercase mb-1">{look.title}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className="text-textPrimary">${look.price}</Text>
                  {look.isTagged && (
                    <View className="absolute top-2 right-2 bg-black px-2 py-1" style={{ borderRadius: 0 }}>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white">Add to tag</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>

        </View>
      </ScrollView>

      {/* Fixed bottom buy now / save — FIX 2 uses real toggleWishlist */}
      <View style={{ paddingBottom: insets.bottom || 24 }} className="absolute bottom-0 w-full bg-[#F7F4EF] border-t border-border px-6 pt-4 flex-row justify-between items-center">
        <TouchableOpacity 
          className="bg-textPrimary items-center justify-center py-4 flex-1 mr-3"
          style={{ borderRadius: 0 }}
        >
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, letterSpacing: 1.5 }} className="text-white uppercase">BUY NOW</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={toggleWishlist}
          className="border border-border items-center justify-center"
          style={{ width: 52, height: 52, borderRadius: 0, backgroundColor: '#FFFFFF' }}
        >
          <Feather name="heart" size={20} color={isSaved ? '#FF3B00' : '#0D0D0D'} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
