import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function ArchiveVaultScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchVaultProducts = async () => {
    const { data } = await safeApiCall(() =>
      supabase
        .from('products')
        .select('*, store:stores(store_name)')
        .limit(6)
    );
    if (data) {
      setProducts(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVaultProducts();
  }, []);

  const mockVaultItems = [
    { id: '1', title: 'RICK OWENS', price: 1240, category: 'ARCHIVE 001', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400' },
    { id: '2', title: 'HELMUT LANG', price: 450, category: 'DROP 12', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
    { id: '3', title: 'BALENCIAGA', price: 2450, category: 'FEATURED', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400' },
    { id: '4', title: 'MARTINE ALI', price: 315, category: 'JEWELRY', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400' },
  ];

  const itemsToRender = products.length > 0 
    ? products.map((p, idx) => ({
        id: p.id,
        title: p.title.toUpperCase(),
        price: p.price,
        category: idx % 2 === 0 ? `ARCHIVE 00${idx + 1}` : `DROP ${10 + idx}`,
        image: p.images?.[0] || 'https://via.placeholder.com/300x400'
      }))
    : mockVaultItems;

  const renderVaultCard = (item: any) => (
    <TouchableOpacity 
      key={item.id} 
      onPress={() => router.push(`/product/${item.id}`)}
      className="bg-card border border-border mb-6"
      style={{ width: (width - 44) / 2, borderRadius: 0 }}
    >
      <Image 
        source={{ uri: item.image }} 
        className="w-full aspect-[3/4] bg-surfaceContainer"
        resizeMode="cover"
        style={{ borderRadius: 0 }}
      />
      <View className="p-3 bg-card">
        <Text 
          style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }}
          className="text-textSecondary uppercase mb-1"
        >
          {item.category}
        </Text>
        <View className="flex-row justify-between items-baseline">
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}
            className="text-textPrimary flex-1 mr-2"
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}
            className="text-textPrimary"
          >
            ${item.price}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-background pt-2">
      {/* Header */}
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

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#FF3B00" />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>
          <View className="flex-row flex-wrap justify-between" style={{ gap: 4 }}>
            {itemsToRender.map(renderVaultCard)}
          </View>
          <View className="h-24" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
