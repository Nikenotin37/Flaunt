const fs = require('fs');

const code = `import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

const { width, height } = Dimensions.get('window');

export default function AuctionLiveScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { session } = useAuthStore();
  
  const [auction, setAuction] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [bidInput, setBidInput] = useState('');
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [loading, setLoading] = useState(true);

  // Setup Realtime
  useEffect(() => {
    fetchData();

    // Subscribe to realtime bids table for this auction
    const channel = supabase
      .channel(\`auction_\${id}\`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'bids', filter: \`auction_id=eq.\${id}\` },
        (payload) => {
          handleNewRealtimeBid(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  // Setup Timer
  useEffect(() => {
    if (!auction?.end_time) return;
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const end = new Date(auction.end_time).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft('ENDED');
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        \`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`
      );
    };

    updateTimer();
    const intervalId = setInterval(updateTimer, 1000);
    return () => clearInterval(intervalId);
  }, [auction?.end_time]);

  const fetchData = async () => {
    // Check if it's an auction ID or product ID
    let auctionData;
    let prodData;

    // First try querying auctions
    const { data: aData } = await safeApiCall(() => 
      supabase.from('auctions').select('*').eq('id', id).single()
    );

    if (aData) {
      auctionData = aData;
      const { data: pData } = await safeApiCall(() => 
        supabase.from('products').select('*').eq('id', auctionData.product_id).single()
      );
      prodData = pData;
    } else {
      // Maybe they passed a product ID
      const { data: aData2 } = await safeApiCall(() => 
        supabase.from('auctions').select('*').eq('product_id', id).single()
      );
      if (aData2) {
        auctionData = aData2;
        const { data: pData2 } = await safeApiCall(() => 
          supabase.from('products').select('*').eq('id', id).single()
        );
        prodData = pData2;
      }
    }

    if (!auctionData || !prodData) {
      setLoading(false);
      return;
    }

    setAuction(auctionData);
    setProduct(prodData);
    setCurrentBid(auctionData.current_price || auctionData.start_price);

    // Fetch last 3 bids
    const { data: bidsData } = await safeApiCall(() => 
      supabase.from('bids').select('*, user:users(auth_id, full_name)').eq('auction_id', auctionData.id).order('created_at', { ascending: false }).limit(3)
    );
    
    if (bidsData) setBids(bidsData);
    setLoading(false);
  };

  const handleNewRealtimeBid = (newBid: any) => {
    setBids(prev => [newBid, ...prev].slice(0, 3));
    setCurrentBid(newBid.amount);
  };

  const handlePlaceBid = async () => {
    if (!session?.user?.id) {
      alert('Must be logged in');
      return;
    }
    
    if (timeLeft === 'ENDED') {
      alert('Auction has ended');
      return;
    }

    const amountNum = parseFloat(bidInput);
    if (isNaN(amountNum) || amountNum <= currentBid) {
      alert(\`Bid must be higher than ₹\${currentBid}\`);
      return;
    }

    // Anti-snipe: if end_time - now < 5 mins, add 5 mins
    let newEndTime = auction.end_time;
    const now = new Date().getTime();
    const end = new Date(auction.end_time).getTime();
    if (end - now < 5 * 60 * 1000) {
      newEndTime = new Date(end + 5 * 60 * 1000).toISOString();
      await safeApiCall(() => 
        supabase.from('auctions').update({ end_time: newEndTime, current_price: amountNum }).eq('id', auction.id)
      );
      setAuction(prev => ({ ...prev, end_time: newEndTime }));
    } else {
      await safeApiCall(() => 
        supabase.from('auctions').update({ current_price: amountNum }).eq('id', auction.id)
      );
    }

    // Insert bid
    const { error } = await safeApiCall(() => 
      supabase.from('bids').insert({
        auction_id: auction.id,
        bidder_id: session.user.id,
        amount: amountNum
      })
    );

    if (!error) {
      setBidInput('');
    } else {
      alert('Error placing bid');
    }
  };

  if (loading) return <View className="flex-1 bg-black justify-center items-center"><ActivityIndicator color="#FF3B00" /></View>;
  if (!auction) return <View className="flex-1 bg-black justify-center items-center"><Text className="text-white">Auction not found</Text></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-black">
      <ScrollView className="flex-1" bounces={false} showsVerticalScrollIndicator={false}>
        {/* Top Image */}
        <View style={{ height: height * 0.42 }} className="w-full relative bg-gray-900">
          <Image source={{ uri: product?.images?.[0] || 'https://via.placeholder.com/600' }} className="w-full h-full" resizeMode="cover" />
          
          <View style={{ paddingTop: insets.top + 10 }} className="absolute z-10 w-full px-4 flex-row justify-between items-center">
            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-black/50 rounded-full">
              <Feather name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View className="flex-row items-center border border-[#FF3B00] bg-black/80 px-3 py-1.5">
              <View className="w-2 h-2 rounded-full bg-[#FF3B00] mr-2" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-[#FF3B00] uppercase">LIVE AUCTION</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="px-6 pt-6 pb-36">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-[#888888] mb-2 uppercase">{product?.name}</Text>
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 56, letterSpacing: -2 }} className="text-white">₹{currentBid.toLocaleString()}</Text>
          
          {/* Timer */}
          <View className="my-8">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-[#888888] uppercase mb-2">ENDS IN</Text>
            <Text style={{ fontFamily: 'monospace', fontSize: 24, letterSpacing: 4 }} className="text-white mb-2">{timeLeft}</Text>
          </View>

          {/* Bids List */}
          <View className="mb-8">
            {bids.map((b, i) => (
              <View key={b.id || i} className="flex-row justify-between items-center py-3 border-b border-[#333333]">
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 14 }} className="text-white">@{b.user?.full_name || 'bidder'}</Text>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-white">₹{b.amount}</Text>
              </View>
            ))}
            {bids.length === 0 && <Text className="text-[#888] font-inter">No bids yet.</Text>}
          </View>

          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 9 }} className="text-[#555] uppercase mb-4">Anti-snipe: bids in last 5m extend timer by 5m</Text>

          {/* Input */}
          <View className="flex-row items-center border-b border-[#333] pb-2 mb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }} className="text-white mr-2">₹</Text>
            <TextInput
              style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }}
              className="text-white flex-1 p-0 m-0"
              placeholder="Amount"
              placeholderTextColor="#555"
              keyboardType="numeric"
              value={bidInput}
              onChangeText={setBidInput}
            />
          </View>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10 }} className="text-[#888] uppercase">Min: ₹{currentBid + 1}</Text>
        </View>
      </ScrollView>

      {/* Fixed bottom place bid */}
      <View style={{ paddingBottom: insets.bottom || 24 }} className="absolute bottom-0 w-full px-6 pt-4 bg-black border-t border-[#1A1A1A]">
        <TouchableOpacity 
          onPress={handlePlaceBid}
          className="w-full bg-[#FF3B00] items-center justify-center h-14"
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, letterSpacing: 1 }} className="text-white uppercase">PLACE BID</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
`;
fs.writeFileSync('src/app/auction/[id].tsx', code);
