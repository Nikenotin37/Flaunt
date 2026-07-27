import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { height } = Dimensions.get('window');

export default function LiveDropOrDashboardScreen() {
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');
  const [currentBid, setCurrentBid] = useState(2450);
  
  // Real Dashboard stats
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  const userId = useAuthStore(state => state.session?.user?.id);
  const storeId = useAuthStore(state => state.storeId);

  const bids = [
    { user: 'archivist_99', amount: 2450, isNew: true },
    { user: 'vibe_curator', amount: 2400 },
    { user: 'fashion_killa', amount: 2350 },
    { user: 'null_set', amount: 2200 },
  ];

  const handleQuickBid = (amt: number) => {
    setCurrentBid(prev => prev + amt);
  };

  // FIX 4: Fetch real dashboard data from Supabase
  const fetchDashboardData = async () => {
    if (!userId) return;
    setDashboardLoading(true);
    
    // Real revenue today
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('amount')
        .eq('seller_id', userId)
        .eq('payment_status', 'paid')
        .gte('created_at', todayStr);

      const rev = todayOrders?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0;
      setTodayRevenue(rev);
    } catch (e) {
      console.warn("Failed fetching today's revenue:", e);
    }

    // Real product count
    try {
      if (storeId) {
        const { count } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);
        setProductCount(count || 0);
      }
    } catch (e) {
      console.warn("Failed fetching product count:", e);
    }

    // Real order count
    try {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', userId);
      setOrderCount(count || 0);
    } catch (e) {
      console.warn("Failed fetching order count:", e);
    }

    // Real follower count
    try {
      if (storeId) {
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('store_id', storeId);
        setFollowerCount(count || 0);
      }
    } catch (e) {
      console.warn("Failed fetching follower count:", e);
    }
    
    setDashboardLoading(false);
  };

  useEffect(() => {
    if (viewMode === 'seller') {
      fetchDashboardData();
    }
  }, [viewMode, userId, storeId]);

  const pendingDrops = [
    {
      id: 'drop-1',
      title: 'ARCHIVE PRADA \'99 SHOULDER BAG',
      time: '18:00 TODAY',
      reach: '12.4K',
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=300'
    },
    {
      id: 'drop-2',
      title: 'RICK OWENS KISS BOOTS - FW21',
      time: '10:00 TOMORROW',
      reach: '45.1K',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300'
    },
    {
      id: 'drop-3',
      title: 'MARGIELA ARTISANAL DECONSTRUCTED COAT',
      time: '22:00 SUNDAY',
      reach: '8.9K',
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-darkBg">
      {/* Header */}
      <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-[#1A1A1A]">
        <TouchableOpacity>
          <Feather name="menu" size={20} color="#FFFFFF" strokeWidth={1.5} />
        </TouchableOpacity>
        
        {/* Toggle Switcher between Buyer Auction & Seller Dashboard */}
        <View className="flex-row bg-[#1A1A1A] p-1" style={{ borderRadius: 0 }}>
          <TouchableOpacity 
            onPress={() => setViewMode('buyer')} 
            className="px-3 py-1"
            style={{ backgroundColor: viewMode === 'buyer' ? '#FF3B00' : 'transparent', borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }} className="text-white uppercase">LIVE AUCTION</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setViewMode('seller')} 
            className="px-3 py-1"
            style={{ backgroundColor: viewMode === 'seller' ? '#FF3B00' : 'transparent', borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }} className="text-white uppercase">DASHBOARD</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="relative">
          <Feather name="shopping-bag" size={20} color="#FFFFFF" strokeWidth={1.5} />
          {viewMode === 'seller' && (
            <View className="absolute -top-1.5 -right-1.5 bg-accent w-4 h-4 rounded-full items-center justify-center">
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white">2</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {viewMode === 'buyer' ? (
        <ScrollView className="flex-1 bg-darkBg" showsVerticalScrollIndicator={false}>
          {/* Full Bleed Product Image */}
          <View style={{ height: height * 0.40 }} className="w-full relative">
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800' }} 
              className="w-full h-full"
              resizeMode="cover"
              style={{ borderRadius: 0 }}
            />
            {/* Tag and thumbnails overlay */}
            <View className="absolute top-4 left-4 bg-accent px-3 py-1.5 flex-row items-center" style={{ borderRadius: 0 }}>
              <View className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-white uppercase">LIVE AUCTION</Text>
            </View>
            
            {/* Thumbnails overlay bottom left */}
            <View className="absolute bottom-4 left-4 flex-row" style={{ gap: 6 }}>
              <View className="w-12 h-12 border border-white/40 p-0.5 bg-black/50" style={{ borderRadius: 0 }}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100' }} className="w-full h-full" style={{ borderRadius: 0 }} />
              </View>
              <View className="w-12 h-12 border border-white/25 p-0.5 bg-black/50" style={{ borderRadius: 0 }}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=100' }} className="w-full h-full" style={{ borderRadius: 0 }} />
              </View>
            </View>
          </View>

          {/* Details Section */}
          <View className="p-6">
            <View className="flex-row items-center mb-1">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 26 }} className="text-white uppercase flex-1">
                RICK OWENS 'STROBE' ARCHIVAL PUFFER
              </Text>
              <View className="bg-white/10 px-2 py-0.5 ml-2" style={{ borderRadius: 0 }}>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }} className="text-white">SS22</Text>
              </View>
            </View>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12 }} className="text-[#9B9B8E] mb-6">
              Lot #4429 • Authentic Archive • Size 48
            </Text>

            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-accent uppercase mb-1">
              CURRENT BID
            </Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 48, letterSpacing: -2 }} className="text-white mb-6">
              ${currentBid.toLocaleString()} <Text style={{ fontSize: 18 }} className="text-[#9B9B8E]">USD</Text>
            </Text>

            {/* Closers and Viewers Grid */}
            <View className="flex-row border-t border-b border-[#1A1A1A] py-4 mb-6">
              <View className="flex-1 pr-4 border-r border-[#1A1A1A]">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase mb-1">CLOSES IN</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: 20 }} className="text-accent">04:22:13</Text>
              </View>
              <View className="flex-1 pl-4">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-[#9B9B8E] uppercase mb-1">VIEWERS</Text>
                <View className="flex-row items-center">
                  <View style={{ marginRight: 8 }}><Feather name="eye" size={16} color="#FFFFFF" /></View>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }} className="text-white">1,204</Text>
                </View>
              </View>
            </View>

            {/* Live Activity list */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1 }} className="text-[#9B9B8E] uppercase">LIVE ACTIVITY</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 }} className="text-accent uppercase">NEW BID</Text>
              </View>
              
              {bids.map((b, i) => (
                <View key={b.user} className="flex-row justify-between items-center py-3 border-b border-[#1A1A1A]">
                  <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13 }} className="text-white">@{b.user}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-white">${i === 0 ? currentBid.toLocaleString() : b.amount.toLocaleString()}</Text>
                </View>
              ))}
            </View>

            {/* Quick bid and Place bid */}
            <View className="flex-row justify-between mb-4" style={{ gap: 12 }}>
              <TouchableOpacity 
                onPress={() => handleQuickBid(100)}
                className="flex-1 py-4 border border-[#333333] items-center justify-center bg-transparent"
                style={{ borderRadius: 0 }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-white uppercase">QUICK +$100</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => handleQuickBid(500)}
                className="flex-1 py-4 border border-[#333333] items-center justify-center bg-transparent"
                style={{ borderRadius: 0 }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-white uppercase">QUICK +$500</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={() => handleQuickBid(100)}
              className="w-full bg-accent items-center justify-center py-4.5 mb-4"
              style={{ borderRadius: 0 }}
            >
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, letterSpacing: 1.5 }} className="text-white uppercase">PLACE BID</Text>
            </TouchableOpacity>

            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 9 }} className="text-center text-[#555555] uppercase leading-4 mb-20">
              BY BIDDING, YOU AGREE TO FLAUNT ARCHIVES TERMS OF SERVICE AND BUYER PREMIUM FEES.
            </Text>
          </View>
        </ScrollView>
      ) : (
        /* SELLER DASHBOARD VIEW */
        <ScrollView className="flex-1 bg-[#F7F4EF]" showsVerticalScrollIndicator={false}>
          {dashboardLoading ? (
            <View className="py-12 justify-center items-center">
              <ActivityIndicator color="#0D0D0D" />
            </View>
          ) : (
            <>
              {/* Revenue display */}
              <View className="px-6 pt-8 pb-6 border-b border-border bg-white">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-textSecondary uppercase mb-1">TODAY'S REVENUE</Text>
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 44, letterSpacing: -1 }} className="text-textPrimary">€{todayRevenue.toFixed(2)}</Text>
                
                {/* FIX 4: Real products, orders, followers counts */}
                <View className="flex-row items-center mt-3" style={{ gap: 16 }}>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">PRODUCTS</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-textPrimary mt-0.5">{productCount}</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">ORDERS</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-textPrimary mt-0.5">{orderCount}</Text>
                  </View>
                  <View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase">FOLLOWERS</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-accent mt-0.5">{followerCount}</Text>
                  </View>
                </View>
              </View>

              {/* Pending Drops */}
              <View className="px-6 pt-6 pb-6 border-b border-border bg-[#F7F4EF]">
                <View className="flex-row justify-between items-center mb-6">
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary uppercase">PENDING INSTAGRAM DROPS</Text>
                  <TouchableOpacity className="border border-border bg-white px-3 py-1.5" style={{ borderRadius: 0 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 }} className="text-textPrimary uppercase">SYNC ACCOUNT</Text>
                  </TouchableOpacity>
                </View>

                {pendingDrops.map((drop) => (
                  <View key={drop.id} className="flex-row bg-white border border-border p-4 mb-4" style={{ borderRadius: 0 }}>
                    <Image source={{ uri: drop.image }} className="w-14 h-14 bg-surfaceContainer mr-4" style={{ borderRadius: 0 }} />
                    <View className="flex-1 justify-between">
                      <View>
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase">SCHEDULED: {drop.time}</Text>
                        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, marginTop: 2 }} className="text-textPrimary uppercase" numberOfLines={1}>{drop.title}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_300Light', fontSize: 10 }} className="text-textSecondary mt-2">Estimated Reach: {drop.reach}</Text>
                    </View>
                    <View className="justify-center flex-row items-center ml-2" style={{ gap: 12 }}>
                      <TouchableOpacity><Feather name="edit-2" size={16} color="#0D0D0D" /></TouchableOpacity>
                      <TouchableOpacity><Feather name="trash-2" size={16} color="#0D0D0D" /></TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Audience Insights */}
              <View className="px-6 pt-6 pb-6 border-b border-border bg-white">
                <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary uppercase mb-6">AUDIENCE INSIGHTS</Text>
                
                <View className="flex-col" style={{ gap: 16 }}>
                  <View className="flex-row justify-between items-center pb-3 border-b border-border">
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 }} className="text-textSecondary uppercase">UNIQUE VIEWERS</Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary">124,098</Text>
                  </View>
                  <View className="flex-row justify-between items-center pb-3 border-b border-border">
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 }} className="text-textSecondary uppercase">AVG. SELL-THROUGH</Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary">12.5 hrs</Text>
                  </View>
                  <View className="flex-row justify-between items-center pb-3">
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 0.5 }} className="text-textSecondary uppercase">RETURNING CURATORS</Text>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary">64%</Text>
                  </View>
                </View>
              </View>

              {/* Action buttons */}
              <View className="p-6 bg-white border-b border-border" style={{ gap: 12 }}>
                <TouchableOpacity className="w-full bg-textPrimary items-center justify-center py-4.5" style={{ borderRadius: 0 }}>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1 }} className="text-white uppercase">CREATE NEW DROP +</Text>
                </TouchableOpacity>

                <TouchableOpacity className="w-full border border-textPrimary items-center justify-center py-4.5 bg-transparent" style={{ borderRadius: 0 }}>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13, letterSpacing: 1 }} className="text-textPrimary uppercase">EXPORT REVENUE REPORT</Text>
                </TouchableOpacity>
              </View>

              {/* Active Bid Heatmap Graph Placeholder */}
              <View className="p-6 bg-white mb-24">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-textSecondary uppercase mb-4">ACTIVE BID HEATMAP</Text>
                <View className="flex-row justify-between items-end h-16 w-full px-2" style={{ gap: 6 }}>
                  <View className="bg-border flex-1" style={{ height: '20%' }} />
                  <View className="bg-border flex-1" style={{ height: '35%' }} />
                  <View className="bg-black flex-1" style={{ height: '75%' }} />
                  <View className="bg-border flex-1" style={{ height: '10%' }} />
                  <View className="bg-black flex-1" style={{ height: '45%' }} />
                  <View className="bg-black flex-1" style={{ height: '85%' }} />
                  <View className="bg-border flex-1" style={{ height: '30%' }} />
                  <View className="bg-black flex-1 items-center justify-center" style={{ height: '100%' }}>
                    <Feather name="plus" size={10} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
