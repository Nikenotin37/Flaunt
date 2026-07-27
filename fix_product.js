const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Dimensions, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuthStore();
  
  const [product, setProduct] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  // Actions states
  const [isSaved, setIsSaved] = useState(false);
  
  useEffect(() => {
    fetchProductAndRecordView();
    checkWishlist();
  }, [id]);

  const fetchProductAndRecordView = async () => {
    // Join product with store data
    const { data } = await safeApiCall(() => 
      supabase
        .from('products')
        .select('*, store:stores(id, store_name, store_slug, logo_url, is_verified)')
        .eq('id', id)
        .single()
    );

    if (data) {
      setProduct(data);
      setStore(data.store);
      if (data.sizes && data.sizes.length > 0) setSelectedSize(data.sizes[0]);
      
      // Increment view count
      supabase.rpc('increment_product_view', { prod_id: id }).then();
    }
    setLoading(false);
  };

  const checkWishlist = async () => {
    if (!session?.user?.id) return;
    const { data } = await safeApiCall(() => 
      supabase.from('wishlist').select('id').eq('user_id', session.user.id).eq('product_id', id).single()
    );
    if (data) setIsSaved(true);
  };

  const handleToggleSave = async () => {
    if (!session?.user?.id) return router.push('/sign-in' as any);
    
    setIsSaved(!isSaved); // Optimistic
    
    if (isSaved) {
      await safeApiCall(() => supabase.from('wishlist').delete().eq('user_id', session.user.id).eq('product_id', id));
    } else {
      await safeApiCall(() => supabase.from('wishlist').insert({ user_id: session.user.id, product_id: id }));
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: \`Check out \${product.name} on FLAUNT Archive!\`,
        url: \`https://flaunt.app/product/\${id}\`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleBuyNow = async () => {
    if (!session?.user?.id) return router.push('/sign-in' as any);
    
    // Create order record and "open payment" (simulated here)
    const { data } = await safeApiCall(() => 
      supabase.from('orders').insert({
        product_id: id,
        buyer_id: session.user.id,
        seller_id: product.store_id,
        size: selectedSize,
        amount: product.price,
        status: 'pending',
        payment_status: 'unpaid'
      }).select().single()
    );
    
    if (data) {
      alert(\`Navigating to payment flow for order #\${data.id}\`);
      // In a real app: router.push(\`/checkout/\${data.id}\`)
    }
  };

  if (loading || !product) {
    return <View className="flex-1 bg-[#F7F4EF]" />;
  }

  const images = product.images || ['https://via.placeholder.com/600'];

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF] pt-2">
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header Actions */}
        <View className="flex-row justify-between items-center px-4 py-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color="#0D0D0D" />
          </TouchableOpacity>
          <View className="flex-row" style={{ gap: 16 }}>
            <TouchableOpacity onPress={handleShare}>
              <Feather name="share" size={22} color="#0D0D0D" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleSave}>
              <Feather name="heart" size={22} color={isSaved ? '#FF3B00' : '#0D0D0D'} fill={isSaved ? '#FF3B00' : 'transparent'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Image Carousel */}
        <View className="relative">
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setCurrentImageIndex(Math.round(x / width));
            }}
            scrollEventThrottle={16}
          >
            {images.map((img: string, idx: number) => (
              <Image 
                key={idx}
                source={{ uri: img }}
                style={{ width, height: width * 1.2, backgroundColor: '#EBEBEB' }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          
          {/* Pagination Dots */}
          <View className="absolute bottom-4 w-full flex-row justify-center" style={{ gap: 6 }}>
            {images.map((_, idx) => (
              <View 
                key={idx}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: idx === currentImageIndex ? '#0D0D0D' : 'rgba(13,13,13,0.2)' }}
              />
            ))}
          </View>
        </View>

        <View className="p-4">
          {/* Seller Info */}
          {store && (
            <TouchableOpacity 
              onPress={() => router.push(\`/store/\${store.id}\`)}
              className="flex-row items-center border-b border-[#EBEBEB] pb-4 mb-4"
            >
              <Image source={{ uri: store.logo_url }} className="w-10 h-10 rounded-full mr-3 border border-[#EBEBEB]" />
              <View>
                <View className="flex-row items-center">
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13 }} className="text-[#0D0D0D] uppercase mr-1">
                    {store.store_name}
                  </Text>
                  {store.is_verified && <Feather name="check-circle" size={12} color="#0D0D0D" />}
                </View>
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11 }} className="text-[#9B9B8E] mt-0.5">
                  @{store.store_slug}
                </Text>
              </View>
              <View className="flex-1 items-end">
                <View className="border border-[#0D0D0D] px-3 py-1">
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }}>VISIT</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* Product Title & Price */}
          <View className="flex-row justify-between items-start mb-2">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20, flex: 1 }} className="text-[#0D0D0D] uppercase leading-6">
              {product.name}
            </Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20 }} className="text-[#0D0D0D]">
              ₹{product.price}
            </Text>
          </View>

          {/* Meta Tags */}
          <View className="flex-row flex-wrap mt-2 mb-6" style={{ gap: 8 }}>
            <View className="bg-[#EBEBEB] px-2 py-1"><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }}>{product.category}</Text></View>
            <View className="bg-[#EBEBEB] px-2 py-1"><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }}>{product.condition}</Text></View>
          </View>

          {/* Sizes */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, marginBottom: 8 }} className="text-[#9B9B8E] uppercase">SELECT SIZE</Text>
          <View className="flex-row flex-wrap mb-6" style={{ gap: 8 }}>
            {(product.sizes || []).map((sz: string) => (
              <TouchableOpacity 
                key={sz}
                onPress={() => setSelectedSize(sz)}
                className="w-12 h-12 border items-center justify-center"
                style={{ 
                  borderColor: selectedSize === sz ? '#0D0D0D' : '#EBEBEB',
                  backgroundColor: selectedSize === sz ? '#0D0D0D' : 'transparent'
                }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: selectedSize === sz ? '#FFF' : '#0D0D0D' }}>{sz}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, marginBottom: 4 }} className="text-[#9B9B8E] uppercase">DESCRIPTION</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 }} className="text-[#0D0D0D] mb-8">
            {product.description}
          </Text>

          <View className="h-20" />
        </View>
      </ScrollView>

      {/* Fixed Bottom Buy Button */}
      <View className="absolute bottom-0 w-full bg-[#F7F4EF] p-4 border-t border-[#EBEBEB]">
        {product.is_auction ? (
          <TouchableOpacity 
            onPress={() => router.push(\`/auction/\${product.id}\`)}
            className="w-full bg-[#FF3B00] items-center justify-center py-4"
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: '#FFFFFF', letterSpacing: 1 }} className="uppercase">ENTER LIVE AUCTION</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={handleBuyNow}
            className="w-full bg-[#0D0D0D] items-center justify-center py-4"
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, color: '#FFFFFF', letterSpacing: 1 }} className="uppercase">BUY NOW • ₹{product.price}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
`;
fs.writeFileSync('src/app/product/[id].tsx', code);
