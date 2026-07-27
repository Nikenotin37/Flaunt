import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function SellScreen() {
  const [mode, setMode] = useState<'overlay' | 'add_product' | 'add_story' | 'review_listing'>('overlay');
  
  // Add Product Form State
  const [title, setTitle] = useState("Rick Owens FW14 'Moody' Leather Jacket");
  const [brand, setBrand] = useState('Rick Owens');
  const [price, setPrice] = useState('');
  const [desc, setDesc] = useState('Classic Mollino silhouette in blistered lamb leather. Fits slim. Iconic high-collar and offset zipper. From the FW14 "Moody" collection.');
  const [category, setCategory] = useState('Outerwear');
  const [condition, setCondition] = useState('Like New');
  const [selectedSize, setSelectedSize] = useState('S');
  const [aiVisionActive, setAiVisionActive] = useState(true);

  const sizes = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'OS'];
  const conditions = ['DEADSTOCK / NEW', 'GENTLY USED', 'WELL WORN / VINTAGE'];
  
  // Keyword tags for Review Listing
  const [tags, setTags] = useState(['ARCHIVE', 'RICK OWENS', 'LEATHER']);

  const handlePostProduct = () => {
    if (!price) {
      // Transition to Review Listing step 2 of 3 as shown in Screenshot 11!
      setMode('review_listing');
      return;
    }
    alert("Post added successfully to marketplace!");
    setMode('overlay');
  };

  const handleFinalize = () => {
    if (!price || parseFloat(price) === 0) {
      alert("Missing price value. Please specify your asking price to continue.");
      return;
    }
    alert("Listing published successfully!");
    setMode('overlay');
  };

  if (mode === 'overlay') {
    return (
      <SafeAreaView className="flex-1 bg-background pt-2">
        {/* Underlay mimicking Tab 1 (Archive Vault) preview */}
        <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border opacity-30">
          <Feather name="menu" size={20} color="#0D0D0D" />
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 20 }} className="text-textPrimary">FLAUNT</Text>
          <Feather name="shopping-bag" size={20} color="#0D0D0D" />
        </View>
        <View className="flex-row px-4 pt-6 justify-between opacity-20" style={{ gap: 4 }}>
          <View className="bg-card border border-border" style={{ width: '47%', aspectRatio: 3/4 }} />
          <View className="bg-card border border-border" style={{ width: '47%', aspectRatio: 3/4 }} />
        </View>

        {/* CREATE CONTENT Bottom Sheet Overlay */}
        <View className="absolute bottom-0 left-0 right-0 bg-[#F7F4EF] border-t border-border px-6 pt-4 pb-12 z-50">
          {/* Drag handler and Close */}
          <View className="flex-row justify-between items-center mb-6">
            <View className="w-12 h-1 bg-border self-center" style={{ borderRadius: 2 }} />
            <TouchableOpacity onPress={() => setMode('add_product')}>
              <Feather name="x" size={20} color="#0D0D0D" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 24 }}
            className="text-textPrimary uppercase mb-1"
          >
            CREATE CONTENT
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_300Light', fontSize: 13, lineHeight: 18 }}
            className="text-textSecondary mb-6"
          >
            Share your latest archive find or curate a new style board for the community.
          </Text>

          {/* Option 1: ADD PRODUCT */}
          <TouchableOpacity 
            onPress={() => setMode('add_product')}
            className="border border-textPrimary bg-white p-5 flex-row items-center justify-between mb-4"
            style={{ borderRadius: 0 }}
          >
            <View className="flex-row items-center flex-1">
              <Feather name="box" size={28} color="#0D0D0D" strokeWidth={1.5} />
              <View className="ml-4">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }} className="text-textPrimary uppercase">ADD PRODUCT</Text>
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary mt-0.5">LIST AN ITEM IN THE ARCHIVE</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#9B9B8E" />
          </TouchableOpacity>

          {/* Option 2: ADD STORY */}
          <TouchableOpacity 
            onPress={() => setMode('add_story')}
            className="border border-textPrimary bg-white p-5 flex-row items-center justify-between mb-6"
            style={{ borderRadius: 0 }}
          >
            <View className="flex-row items-center flex-1">
              <Feather name="aperture" size={28} color="#0D0D0D" strokeWidth={1.5} />
              <View className="ml-4">
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }} className="text-textPrimary uppercase">ADD STORY</Text>
                <Text style={{ fontFamily: 'Inter_300Light', fontSize: 12 }} className="text-textSecondary mt-0.5">POST A STYLE UPDATE OR DROP ALERT</Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color="#9B9B8E" />
          </TouchableOpacity>

          {/* Sub options list */}
          <View className="border-t border-border pt-4">
            <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-border">
              <View className="flex-row items-center">
                <Feather name="grid" size={16} color="#5E5F54" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 12 }} className="text-textPrimary uppercase">CURATE STYLE BOARD</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#9B9B8E" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row justify-between items-center py-4 border-b border-border">
              <View className="flex-row items-center">
                <Feather name="clock" size={16} color="#5E5F54" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 12 }} className="text-textPrimary uppercase">SCHEDULE LIVE DROP</Text>
              </View>
              <Feather name="chevron-right" size={14} color="#9B9B8E" />
            </TouchableOpacity>

            <TouchableOpacity className="flex-row justify-between items-center py-4">
              <View className="flex-row items-center">
                <Feather name="file-text" size={16} color="#5E5F54" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 12 }} className="text-textPrimary uppercase">DRAFTS</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-black px-1.5 py-0.5 mr-2"><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white">4</Text></View>
                <Feather name="chevron-right" size={14} color="#9B9B8E" />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (mode === 'add_story') {
    return (
      <View className="flex-1 bg-black">
        {/* Live Camera Preview area placeholder */}
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800' }}
          className="absolute w-full h-full"
          resizeMode="cover"
        />

        {/* Camera Overlay Controls */}
        <SafeAreaView className="flex-1 justify-between p-6 bg-black/25">
          {/* Top row */}
          <View className="flex-row justify-between items-center">
            <TouchableOpacity onPress={() => setMode('overlay')} className="w-10 h-10 items-center justify-center bg-black/40" style={{ borderRadius: 20 }}>
              <Feather name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <View className="flex-row" style={{ gap: 8 }}>
              <TouchableOpacity className="w-10 h-10 items-center justify-center bg-black/40" style={{ borderRadius: 20 }}>
                <Feather name="zap" size={18} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity className="w-10 h-10 items-center justify-center bg-black/40" style={{ borderRadius: 20 }}>
                <Feather name="settings" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Right column Tools */}
          <View className="absolute right-6 top-1/3 flex-col" style={{ gap: 20 }}>
            <TouchableOpacity className="items-center">
              <View className="w-10 h-10 bg-black/50 items-center justify-center mb-1"><Feather name="music" size={16} color="#FFFFFF" /></View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase">MUSIC</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-10 h-10 bg-black/50 items-center justify-center mb-1"><Feather name="type" size={16} color="#FFFFFF" /></View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase">TEXT</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-10 h-10 bg-black/50 items-center justify-center mb-1"><Feather name="aperture" size={16} color="#FFFFFF" /></View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase">EFFECTS</Text>
            </TouchableOpacity>

            <TouchableOpacity className="items-center">
              <View className="w-10 h-10 bg-black/50 items-center justify-center mb-1"><Feather name="more-vertical" size={16} color="#FFFFFF" /></View>
            </TouchableOpacity>
          </View>

          {/* Bottom Area */}
          <View className="w-full">
            {/* Camera Slider Mode */}
            <View className="flex-row justify-center mb-6" style={{ gap: 24 }}>
              <TouchableOpacity><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-white/60 uppercase">POST</Text></TouchableOpacity>
              <TouchableOpacity className="border-b border-white pb-1"><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-white uppercase">STORY</Text></TouchableOpacity>
              <TouchableOpacity><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13 }} className="text-white/60 uppercase">LIVE</Text></TouchableOpacity>
            </View>

            {/* Shutter actions */}
            <View className="flex-row justify-between items-center px-8">
              <TouchableOpacity className="w-12 h-12 bg-white/20 border border-white p-1" style={{ borderRadius: 0 }}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=100' }} className="w-full h-full" style={{ borderRadius: 0 }} />
              </TouchableOpacity>

              <TouchableOpacity className="w-20 h-20 bg-white items-center justify-center" style={{ borderRadius: 40, borderWidth: 4, borderColor: '#FFFFFF4D' }}>
                <View className="w-16 h-16 bg-white" style={{ borderRadius: 32 }} />
              </TouchableOpacity>

              <TouchableOpacity className="w-12 h-12 bg-black/50 items-center justify-center" style={{ borderRadius: 24 }}>
                <Feather name="rotate-cw" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (mode === 'review_listing') {
    /* STEP 2 OF 3: REVIEW LISTING SCREEN (Screenshot 11) */
    return (
      <SafeAreaView className="flex-1 bg-background pt-2">
        {/* Header */}
        <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border bg-white">
          <TouchableOpacity onPress={() => setMode('add_product')}>
            <Feather name="menu" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
          <View className="items-center">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase">STEP 2 OF 3</Text>
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-textPrimary uppercase">FLAUNT</Text>
          </View>
          <TouchableOpacity>
            <Feather name="shopping-bag" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
          {/* Image Product Preview */}
          <View className="w-full bg-surfaceContainer relative mb-6" style={{ height: 280 }}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500' }} 
              className="w-full h-full"
              resizeMode="cover"
              style={{ borderRadius: 0 }}
            />
            <View className="absolute bottom-4 left-4 bg-black px-3 py-1.5" style={{ borderRadius: 0 }}>
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 10 }} className="text-white uppercase">PRODUCT PREVIEW</Text>
            </View>
          </View>

          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 44, lineHeight: 46 }}
            className="text-textPrimary uppercase mb-2"
          >
            REVIEW LISTING
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_300Light', fontSize: 13, lineHeight: 18 }}
            className="text-textSecondary mb-8"
          >
            Fine-tune the details of your archive piece. Precision ensures the right eyes find your item.
          </Text>

          {/* Form items */}
          <View className="mb-6 border-b border-border pb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">ITEM TITLE</Text>
            <TextInput
              style={{ fontFamily: 'Inter_700Bold', fontSize: 18 }}
              className="text-textPrimary p-0 m-0"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="mb-6 border-b border-border pb-2 flex-row justify-between items-center">
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">CATEGORY</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15 }} className="text-textPrimary">{category}</Text>
            </View>
            <Feather name="chevron-down" size={18} color="#0D0D0D" />
          </View>

          <View className="mb-6 border-b border-border pb-2 flex-row justify-between items-center">
            <View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">CONDITION</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15 }} className="text-textPrimary">{condition}</Text>
            </View>
            <Feather name="chevron-down" size={18} color="#0D0D0D" />
          </View>

          {/* Required Price Warning */}
          <View className="mb-6">
            <View className="flex-row items-center mb-1">
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-accent uppercase mr-2">PRICE (USD)</Text>
              <View className="bg-accent px-1.5 py-0.5" style={{ borderRadius: 0 }}><Text style={{ fontFamily: 'Inter_700Bold', fontSize: 7 }} className="text-white">REQUIRED</Text></View>
            </View>
            <View className="flex-row items-center border-b border-accent pb-3">
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }} className="text-textPrimary mr-2">$</Text>
              <TextInput
                style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }}
                className="text-accent flex-1 p-0 m-0"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#FF3B00"
              />
            </View>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 9, lineHeight: 12 }} className="text-accent mt-2 uppercase">
              MISSING PRICE VALUE. PLEASE SPECIFY YOUR ASKING PRICE TO CONTINUE.
            </Text>
          </View>

          <View className="mb-6 border-b border-border pb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">DESCRIPTION</Text>
            <TextInput
              style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 }}
              className="text-textPrimary p-0 m-0"
              value={desc}
              onChangeText={setDesc}
              multiline
            />
          </View>

          {/* Keywords add tags */}
          <View className="mb-10">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-3">KEYWORDS</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {tags.map((tag) => (
                <View 
                  key={tag} 
                  className="flex-row items-center border border-border px-3 py-2 bg-white"
                  style={{ borderRadius: 0 }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-textPrimary uppercase mr-2">{tag}</Text>
                  <TouchableOpacity onPress={() => setTags(tags.filter(t => t !== tag))}>
                    <Feather name="x" size={12} color="#0D0D0D" />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity className="border border-dashed border-border px-3 py-2 bg-white flex-row items-center" style={{ borderRadius: 0 }}>
                <View style={{ marginRight: 4 }}><Feather name="plus" size={12} color="#9B9B8E" /></View>
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10 }} className="text-textSecondary uppercase">ADD TAG</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Finalize Button */}
          <TouchableOpacity 
            onPress={handleFinalize}
            className="w-full bg-textPrimary flex-row items-center justify-center py-4 mb-4"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14, letterSpacing: 1.5 }} className="text-white uppercase mr-2">FINALIZE & POST</Text>
            <Feather name="arrow-right" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 8 }} className="text-center text-[#9B9B8E] uppercase mb-16">
            BY CLICKING POST, YOU AGREE TO THE FLAUNT ARCHIVE TERMS OF SERVICE.
          </Text>

        </ScrollView>
      </SafeAreaView>
    );
  }

  // mode === 'add_product' (Screenshot 1: NEW LISTING Form)
  return (
    <SafeAreaView className="flex-1 bg-background pt-2">
      {/* Header */}
      <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border bg-white">
        <TouchableOpacity onPress={() => setMode('overlay')}>
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

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        <Text 
          style={{ fontFamily: 'Inter_900Black', fontSize: 36 }}
          className="text-textPrimary uppercase"
        >
          NEW LISTING
        </Text>
        <Text 
          style={{ fontFamily: 'Inter_300Light', fontSize: 13 }}
          className="text-textSecondary mb-6"
        >
          Archive your piece in the digital vault.
        </Text>

        {/* Visual Documentation upload section */}
        <Text 
          style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}
          className="text-textSecondary uppercase mb-3"
        >
          VISUAL DOCUMENTATION (1/5)
        </Text>

        {/* Main image upload box */}
        <TouchableOpacity className="w-full bg-surfaceContainer border border-dashed border-[#9B9B8E] items-center justify-center mb-4" style={{ height: 280, borderRadius: 0 }}>
          <Feather name="camera" size={28} color="#9B9B8E" strokeWidth={1.5} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1.5 }} className="text-textSecondary uppercase mt-2">UPLOAD MAIN IMAGE</Text>
        </TouchableOpacity>

        {/* Smaller box placeholders */}
        <View className="flex-row flex-wrap justify-between mb-6" style={{ gap: 8 }}>
          {[1, 2, 3, 4].map((i) => (
            <TouchableOpacity key={i} className="bg-surfaceContainer items-center justify-center" style={{ width: '48%', height: 110, borderRadius: 0 }}>
              <Feather name="plus" size={18} color="#9B9B8E" strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Gemini Vision Card */}
        {aiVisionActive && (
          <View className="bg-white border-l-2 border-accent p-4 mb-8 flex-row items-start" style={{ borderRadius: 0 }}>
            <View style={{ marginRight: 12, marginTop: 2 }}><Feather name="aperture" size={16} color="#FF3B00" /></View>
            <View className="flex-1">
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }} className="text-accent uppercase mb-1">GEMINI VISION ACTIVE</Text>
              <Text style={{ fontFamily: 'Inter_300Light', fontSize: 11, lineHeight: 15 }} className="text-textSecondary">
                Upload a photo to automatically extract brand, model, and archival era data. Verified listings sell 40% faster.
              </Text>
            </View>
          </View>
        )}

        {/* Form Fields: Bottom border 1px only */}
        <View className="mb-6 border-b border-border pb-2">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">PRODUCT NAME</Text>
          <TextInput
            style={{ fontFamily: 'Inter_500Medium', fontSize: 15 }}
            className="text-textPrimary p-0 m-0"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. 1999 HELMUT LANG PARK"
            placeholderTextColor="#9B9B8E"
          />
        </View>

        <View className="mb-6 border-b border-border pb-2">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">BRAND / DESIGNER</Text>
          <TextInput
            style={{ fontFamily: 'Inter_500Medium', fontSize: 15 }}
            className="text-textPrimary p-0 m-0"
            value={brand}
            onChangeText={setBrand}
            placeholder="Search Archives..."
            placeholderTextColor="#9B9B8E"
          />
        </View>

        <View className="mb-6 border-b border-border pb-2">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">PRICE (USD)</Text>
          <View className="flex-row items-center">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className="text-textPrimary mr-2">$</Text>
            <TextInput
              style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
              className="text-textPrimary flex-1 p-0 m-0"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#9B9B8E"
            />
          </View>
        </View>

        {/* Dropdown category */}
        <View className="mb-6 border-b border-border pb-2 flex-row justify-between items-center">
          <View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">CATEGORY</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className="text-textPrimary">{category}</Text>
          </View>
          <Feather name="chevron-down" size={18} color="#0D0D0D" />
        </View>

        {/* Size chips */}
        <View className="mb-6">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-3">SIZE SELECTION</Text>
          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
            {sizes.map((sz) => {
              const isSel = selectedSize === sz;
              return (
                <TouchableOpacity
                  key={sz}
                  onPress={() => setSelectedSize(sz)}
                  className="border items-center justify-center"
                  style={{
                    width: 60,
                    height: 40,
                    borderColor: isSel ? '#0D0D0D' : '#EBEBEB',
                    backgroundColor: isSel ? '#0D0D0D' : '#FFFFFF',
                    borderRadius: 0,
                  }}
                >
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className={isSel ? 'text-white' : 'text-textPrimary'}>{sz}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Condition Registry Checkboxes */}
        <View className="mb-8">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-4">CONDITION REGISTRY</Text>
          {conditions.map((cond) => {
            const isChecked = condition === cond;
            return (
              <TouchableOpacity
                key={cond}
                onPress={() => setCondition(cond)}
                className="flex-row justify-between items-center py-4 border-b border-border"
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12 }} className="text-textPrimary uppercase">{cond}</Text>
                <View 
                  className="items-center justify-center border"
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 0,
                    borderColor: isChecked ? '#0D0D0D' : '#9B9B8E',
                    backgroundColor: isChecked ? '#0D0D0D' : 'transparent'
                  }}
                >
                  {isChecked && <Feather name="check" size={12} color="#FFFFFF" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Manifesto description */}
        <View className="mb-10">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-2">MANIFESTO / DESCRIPTION</Text>
          <TextInput
            style={{ fontFamily: 'Inter_300Light', fontSize: 13 }}
            className="border-b border-border py-2 text-textPrimary p-0 m-0"
            value={desc}
            onChangeText={setDesc}
            placeholder="Tell the story of this piece..."
            placeholderTextColor="#9B9B8E"
            multiline
          />
        </View>

        {/* Post Button */}
        <TouchableOpacity
          onPress={handlePostProduct}
          className="w-full bg-textPrimary flex-row items-center justify-center py-4 mb-24"
          style={{ borderRadius: 0 }}
        >
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 }} className="text-white uppercase mr-2">POST TO MARKETPLACE</Text>
          <Feather name="arrow-right" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
