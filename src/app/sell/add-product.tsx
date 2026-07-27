// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, Switch, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
// Assuming gemini is correctly exported
import { analyzeInstagramShare } from '../../lib/gemini';

const { width } = Dimensions.get('window');

export default function AddProductScreen() {
  const router = useRouter();
  const { session, storeId } = useAuthStore();
  
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('ALL');
  const [condition, setCondition] = useState('NEW');
  const [selectedSize, setSelectedSize] = useState('M');
  const [isAuction, setIsAuction] = useState(false);
  const [auctionEndDays, setAuctionEndDays] = useState('1');
  const [image, setImage] = useState<string | null>(null); // Normally we'd use expo-image-picker here
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const categories = ['CLOTHING', 'SHOES', 'BAGS', 'JEWELRY', 'VINTAGE'];
  const conditions = ['NEW', 'THRIFTED', 'VINTAGE'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  const handlePickImage = () => {
    // Simulated pick image for now. In real environment, import * as ImagePicker from 'expo-image-picker';
    setImage('https://images.unsplash.com/photo-1550614000-4b95d4ed7977?w=500');
  };

  const handleAnalyzeDesc = async () => {
    if (!desc || !image) return;
    setIsAnalyzing(true);
    const analysis = await analyzeInstagramShare(desc, image);
    if (analysis) {
      if (analysis.title) setTitle(analysis.title);
      if (analysis.price) setPrice(String(analysis.price));
      if (analysis.category && categories.includes(analysis.category.toUpperCase())) setCategory(analysis.category.toUpperCase());
    }
    setIsAnalyzing(false);
  };

  const handlePublish = async () => {
    if (!session?.user?.id || !storeId) {
      alert('You must be a seller to post.');
      return;
    }
    if (!title || !price || !image) {
      alert('Please fill out title, price, and image.');
      return;
    }

    const priceNum = parseFloat(price);

    // 1. Insert Product
    const { data: productData, error } = await safeApiCall(() => 
      supabase.from('products').insert({
        store_id: storeId,
        name: title,
        description: desc,
        price: priceNum,
        images: [image],
        sizes: [selectedSize],
        category: category,
        condition: condition,
        is_auction: isAuction,
        status: 'active'
      }).select().single()
    );

    if (error || !productData) {
      alert('Failed to create product.');
      return;
    }

    // 2. If Auction, create auction record
    if (isAuction) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + parseInt(auctionEndDays || '1'));
      
      await safeApiCall(() => 
        supabase.from('auctions').insert({
          product_id: productData.id,
          seller_id: storeId,
          start_price: priceNum,
          current_price: priceNum,
          end_time: endDate.toISOString(),
          status: 'active'
        })
      );
    }

    alert('Product Published!');
    router.replace('/profile');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F7F4EF]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pb-4 border-b border-[#EBEBEB] pt-2">
        <TouchableOpacity onPress={() => router.back()}><Feather name="x" size={24} color="#0D0D0D" /></TouchableOpacity>
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="uppercase">NEW LISTING</Text>
        <View className="w-6" />
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Photo Upload Zone */}
        <TouchableOpacity 
          onPress={handlePickImage}
          className="w-full bg-[#EBEBEB] border border-dashed border-[#9B9B8E] items-center justify-center mb-6" 
          style={{ height: width - 48 }}
        >
          {image ? (
            <Image source={{ uri: image }} className="w-full h-full" resizeMode="cover" />
          ) : (
            <>
              <Feather name="camera" size={32} color="#9B9B8E" />
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, marginTop: 12 }} className="text-[#9B9B8E] uppercase">TAP TO UPLOAD PHOTO</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Basic Info */}
        <TextInput
          style={{ fontFamily: 'Inter_700Bold', fontSize: 24 }}
          className="border-b border-[#EBEBEB] pb-2 mb-6 text-[#0D0D0D]"
          placeholder="Product Name"
          placeholderTextColor="#9B9B8E"
          value={title}
          onChangeText={setTitle}
        />
        <View className="flex-row items-center border-b border-[#EBEBEB] pb-2 mb-6">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24 }} className="text-[#0D0D0D] mr-2">₹</Text>
          <TextInput
            style={{ fontFamily: 'Inter_700Bold', fontSize: 24 }}
            className="flex-1 text-[#0D0D0D]"
            placeholder="Price"
            placeholderTextColor="#9B9B8E"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
        </View>

        {/* Description + Gemini AI */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-[#9B9B8E] uppercase mb-2">Description</Text>
        <TextInput
          style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
          className="border-b border-[#EBEBEB] pb-4 mb-4 text-[#0D0D0D]"
          placeholder="Tell the story of this piece..."
          placeholderTextColor="#9B9B8E"
          multiline
          value={desc}
          onChangeText={setDesc}
        />
        <TouchableOpacity 
          onPress={handleAnalyzeDesc}
          className="bg-[#0D0D0D] flex-row items-center justify-center py-3 mb-6"
        >
          <Feather name="aperture" size={16} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: '#FFF' }} className="uppercase">
            {isAnalyzing ? 'ANALYZING...' : 'AI CAPTION DETECT'}
          </Text>
        </TouchableOpacity>

        {/* Condition Pills */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-[#9B9B8E] uppercase mb-2">Condition</Text>
        <View className="flex-row gap-2 mb-6">
          {conditions.map(c => (
            <TouchableOpacity 
              key={c} onPress={() => setCondition(c)}
              className="px-4 py-2 border"
              style={{ borderColor: condition === c ? '#0D0D0D' : '#EBEBEB', backgroundColor: condition === c ? '#0D0D0D' : 'transparent' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: condition === c ? '#FFF' : '#0D0D0D' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Sheet Replacement (Pills for simplicity) */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-[#9B9B8E] uppercase mb-2">Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {categories.map(c => (
            <TouchableOpacity 
              key={c} onPress={() => setCategory(c)}
              className="mr-2 px-4 py-2 border"
              style={{ borderColor: category === c ? '#0D0D0D' : '#EBEBEB', backgroundColor: category === c ? '#0D0D0D' : 'transparent' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: category === c ? '#FFF' : '#0D0D0D' }}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sizes */}
        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-[#9B9B8E] uppercase mb-2">Size</Text>
        <View className="flex-row flex-wrap gap-2 mb-8">
          {sizes.map(s => (
            <TouchableOpacity 
              key={s} onPress={() => setSelectedSize(s)}
              className="w-12 h-12 border items-center justify-center"
              style={{ borderColor: selectedSize === s ? '#0D0D0D' : '#EBEBEB', backgroundColor: selectedSize === s ? '#0D0D0D' : 'transparent' }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: selectedSize === s ? '#FFF' : '#0D0D0D' }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Auction Toggle */}
        <View className="flex-row justify-between items-center py-4 border-t border-[#EBEBEB] mb-2">
          <View>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-[#0D0D0D] uppercase">LIST AS AUCTION</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }} className="text-[#9B9B8E] mt-1">Start bidding at your set price</Text>
          </View>
          <Switch value={isAuction} onValueChange={setIsAuction} trackColor={{ true: '#FF3B00', false: '#EBEBEB' }} />
        </View>

        {isAuction && (
          <View className="flex-row items-center border-b border-[#EBEBEB] pb-2 mb-6">
             <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-[#0D0D0D] mr-4 uppercase">DURATION (DAYS)</Text>
             <TextInput
               style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
               className="flex-1 text-[#0D0D0D] text-right"
               keyboardType="numeric"
               value={auctionEndDays}
               onChangeText={setAuctionEndDays}
             />
          </View>
        )}

        {/* Publish */}
        <TouchableOpacity 
          onPress={handlePublish}
          className="w-full bg-[#0D0D0D] items-center justify-center py-4 mt-6 mb-12"
        >
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFFFFF' }} className="uppercase">PUBLISH TO ARCHIVE</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
