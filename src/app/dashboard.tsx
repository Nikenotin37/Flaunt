// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { safeApiCall } from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { session, storeId } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [storeId]);

  const fetchDashboardData = async () => {
    if (!storeId) return;

    // Fetch Store Details
    const { data: storeData } = await safeApiCall(() => 
      supabase.from('stores').select('follower_count').eq('id', storeId).single()
    );
    if (storeData) setFollowerCount(storeData.follower_count || 0);

    // Fetch Products Count
    const { data: prodData } = await safeApiCall(() => 
      supabase.from('products').select('id', { count: 'exact' }).eq('store_id', storeId)
    );
    if (prodData) setProductCount(prodData.length);

    // Fetch Orders
    const { data: ordersData } = await safeApiCall(() => 
      supabase
        .from('orders')
        .select('*, product:products(name, images)')
        .eq('seller_id', storeId)
        .order('created_at', { ascending: false })
    );

    if (ordersData) {
      setOrderCount(ordersData.length);
      setRecentOrders(ordersData.slice(0, 5));
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const rev = ordersData
        .filter(o => o.payment_status === 'paid' && new Date(o.created_at) >= today)
        .reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
        
      setTodayRevenue(rev);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F4EF] justify-center items-center">
        <ActivityIndicator color="#0D0D0D" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF]">
      <View className="flex-row justify-between items-center px-4 py-3 border-b border-[#EBEBEB] bg-white">
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#0D0D0D" /></TouchableOpacity>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="uppercase">DASHBOARD</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Revenue display */}
        <View className="px-6 pt-8 pb-6 border-b border-[#EBEBEB] bg-white">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase mb-1">TODAY'S REVENUE</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 44, letterSpacing: -1 }} className="text-[#0D0D0D]">₹{todayRevenue.toLocaleString()}</Text>
          
          <View className="flex-row items-center mt-4" style={{ gap: 24 }}>
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">PRODUCTS</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className="text-[#0D0D0D] mt-0.5">{productCount}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">ORDERS</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className="text-[#0D0D0D] mt-0.5">{orderCount}</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">FOLLOWERS</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className="text-[#FF3B00] mt-0.5">{followerCount}</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View className="p-6 bg-white border-b border-[#EBEBEB]" style={{ gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/sell/add-product')} className="w-full bg-[#0D0D0D] items-center justify-center py-4">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1, color: '#FFF' }} className="uppercase">CREATE NEW DROP +</Text>
          </TouchableOpacity>

          <TouchableOpacity className="w-full border border-[#0D0D0D] items-center justify-center py-4">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1, color: '#0D0D0D' }} className="uppercase">EXPORT REPORT</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Orders */}
        <View className="px-6 py-6 bg-white mb-12">
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-[#0D0D0D] uppercase mb-4">RECENT ORDERS</Text>
          
          {recentOrders.length === 0 ? (
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }} className="text-[#9B9B8E]">No orders yet.</Text>
          ) : (
            recentOrders.map(order => (
              <View key={order.id} className="flex-row items-center py-4 border-b border-[#EBEBEB]">
                <Image source={{ uri: order.product?.images?.[0] || 'https://via.placeholder.com/100' }} className="w-12 h-12 mr-4 bg-[#F7F4EF]" />
                <View className="flex-1">
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-[#0D0D0D] uppercase" numberOfLines={1}>{order.product?.name || 'Item'}</Text>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 10 }} className="text-[#9B9B8E] uppercase mt-1">Status: {order.status} • ₹{order.amount}</Text>
                </View>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
