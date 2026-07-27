import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { analyzeInstagramShare } from '../lib/gemini';
import { supabase } from '../lib/supabase';
import { safeApiCall } from '../lib/api';
import { sanitizeText, sanitizeLongText, validatePrice } from '../lib/validation';
import { validateImage, compressImage } from '../lib/imageSecurity';
import ReceiveSharingIntent from 'react-native-receive-sharing-intent';

export default function ShareReviewScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [product, setProduct] = useState({
    title: '',
    price: '',
    description: '',
    sizes: [] as string[],
    imageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400'
  });
  
  const [condition, setCondition] = useState('THRIFTED');
  const [error, setError] = useState<string | null>(null);
  const [aiTimedOut, setAiTimedOut] = useState(false);

  const availableSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const conditions = ['NEW', 'THRIFTED', 'VINTAGE'];

  useEffect(() => {
    ReceiveSharingIntent.getReceivedFiles(
      (files: any) => {
        if (files && files.length > 0) {
          const file = files[0];
          const text = file.text || file.weblink || '';
          const imageUri = file.contentUri || file.filePath || product.imageUrl;
          
          setProduct(prev => ({ ...prev, imageUrl: imageUri }));
          
          if (text) {
            processGemini(text, imageUri);
          } else {
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      },
      (err: any) => {
        setLoading(false);
      },
      'flaunt'
    );
    
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setAiTimedOut(true);
      }
    }, 4000);

    return () => {
      ReceiveSharingIntent.clearReceivedFiles();
      clearTimeout(timeout);
    };
  }, []);

  const processGemini = async (text: string, img: string) => {
    setLoading(true);
    const aiResult = await analyzeInstagramShare(text, img);
    if (aiResult) {
      setProduct({
        ...product,
        title: aiResult.title || '',
        price: aiResult.price ? aiResult.price.toString() : '',
        description: aiResult.description || '',
        sizes: aiResult.sizes || [],
      });
    } else {
      setAiTimedOut(true);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    const cleanTitle = sanitizeText(product.title);
    const cleanDesc = sanitizeLongText(product.description);
    
    if (!cleanTitle || !product.price) {
      setError("Title and Price are required.");
      return;
    }
    
    if (!validatePrice(product.price)) {
      setError("Invalid price. Must be between 1 and 50,000 INR.");
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const { data: storeData, error: storeError } = await safeApiCall(() =>
        supabase
          .from('stores')
          .select('id')
          .eq('user_id', supabase.auth.getUser().then(r => r.data.user?.id))
          .single()
      );
        
      if (storeError || !storeData) throw new Error(storeError || "Store not found");

      const isImageValid = await validateImage(product.imageUrl);
      if (!isImageValid) throw new Error("Invalid image format.");
      
      const compressedUri = await compressImage(product.imageUrl);
      if (!compressedUri) throw new Error("Failed to process image.");

      const { error: insertError } = await safeApiCall(() => 
        supabase
          .from('products')
          .insert({
            store_id: storeData.id,
            title: cleanTitle,
            description: cleanDesc,
            price: parseFloat(product.price),
            images: [compressedUri],
            sizes: product.sizes,
            status: 'available'
          })
      );

      if (insertError) throw new Error(insertError);
      
      setSaving(false);
      router.replace('/(tabs)/sell');
    } catch (e: any) {
      setError(e.message);
      setSaving(false);
    }
  };

  const toggleSize = (sz: string) => {
    const activeSizes = [...product.sizes];
    if (activeSizes.includes(sz)) {
      setProduct({ ...product, sizes: activeSizes.filter(s => s !== sz) });
    } else {
      setProduct({ ...product, sizes: [...activeSizes, sz] });
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <ActivityIndicator color="#FF3B00" size="large" className="mb-6" />
        <Text 
          style={{ fontFamily: 'Inter_900Black', fontSize: 32, letterSpacing: -1 }}
          className="text-textPrimary text-center"
        >
          Analyzing post...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-border bg-white">
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#0D0D0D" strokeWidth={1.5} />
        </TouchableOpacity>
        <Text 
          style={{ fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 2 }}
          className="text-textSecondary uppercase"
        >
          FLAUNT
        </Text>
        <View className="w-6" />
      </View>

      {/* Timeout Alert Banner */}
      {aiTimedOut && (
        <View className="bg-accent py-3 px-6 flex-row items-center justify-center">
          <Text 
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
            className="text-white text-center"
          >
            AI detection timed out — fill manually
          </Text>
        </View>
      )}

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Shared Image Section */}
        <View className="w-full bg-surfaceContainer" style={{ height: 200 }}>
          <Image 
            source={{ uri: product.imageUrl }} 
            className="w-full h-full"
            resizeMode="cover"
            style={{ borderRadius: 0 }}
          />
        </View>

        <View className="px-6 pt-6">
          {/* Hero text */}
          <View className="flex-row items-start justify-between mb-8">
            <View className="flex-1">
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }}
                className="text-textSecondary"
              >
                Gemini detected
              </Text>
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 36, letterSpacing: -1 }}
                className="text-textPrimary leading-9 mt-1"
              >
                these details
              </Text>
            </View>
            <View className="border border-border px-2 py-1" style={{ borderRadius: 0 }}>
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
                className="text-textSecondary uppercase"
              >
                GEMINI AI
              </Text>
            </View>
          </View>

          {error && (
            <View className="mb-6">
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }}
                className="text-accent uppercase"
              >
                {error}
              </Text>
            </View>
          )}

          {/* Form Rows: Bottom border 1px only */}
          <View className="mb-6 border-b border-border pb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">PRODUCT NAME</Text>
            <TextInput
              style={{ fontFamily: 'Inter_500Medium', fontSize: 16 }}
              className="text-textPrimary p-0 m-0"
              value={product.title}
              onChangeText={(t) => setProduct({...product, title: t})}
              placeholder="Product Name"
              placeholderTextColor="#9B9B8E"
            />
          </View>

          <View className="mb-6 border-b border-border pb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">PRICE</Text>
            <View className="flex-row items-center">
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }} className="text-textPrimary mr-2">₹</Text>
              <TextInput
                style={{ fontFamily: 'Inter_700Bold', fontSize: 20 }}
                className="text-textPrimary flex-1 p-0 m-0"
                value={product.price}
                onChangeText={(t) => setProduct({...product, price: t})}
                keyboardType="numeric"
                placeholder="0.00"
                placeholderTextColor="#9B9B8E"
              />
            </View>
            {!product.price && (
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
                className="text-accent mt-2 uppercase"
              >
                Price not detected — please add
              </Text>
            )}
          </View>

          <View className="mb-6">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-3">SIZES</Text>
            <View className="flex-row flex-wrap" style={{ gap: 8 }}>
              {availableSizes.map((sz) => {
                const isSel = product.sizes.includes(sz);
                return (
                  <TouchableOpacity
                    key={sz}
                    onPress={() => toggleSize(sz)}
                    className="w-10 h-10 border items-center justify-center"
                    style={{
                      borderColor: isSel ? '#0D0D0D' : '#EBEBEB',
                      backgroundColor: isSel ? '#0D0D0D' : 'transparent',
                      borderRadius: 0,
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className={isSel ? 'text-white' : 'text-textPrimary'}>{sz}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-6">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-3">CONDITION</Text>
            <View className="flex-row">
              {conditions.map((c) => {
                const isSel = condition === c;
                return (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCondition(c)}
                    className="mr-3 px-4 py-2 border"
                    style={{
                      borderColor: isSel ? '#0D0D0D' : '#EBEBEB',
                      backgroundColor: isSel ? '#0D0D0D' : 'transparent',
                      borderRadius: 0,
                    }}
                  >
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11 }} className={isSel ? 'text-white' : 'text-textPrimary'}>{c}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="mb-10 border-b border-border pb-2">
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }} className="text-textSecondary uppercase mb-1">DESCRIPTION</Text>
            <TextInput
              style={{ fontFamily: 'Inter_400Regular', fontSize: 14 }}
              className="text-textPrimary p-0 m-0"
              value={product.description}
              onChangeText={(t) => setProduct({...product, description: t})}
              multiline
              numberOfLines={3}
              placeholder="Description"
              placeholderTextColor="#9B9B8E"
            />
          </View>
          
          <View className="h-10" />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="p-6 bg-background border-t border-border flex-row justify-between" style={{ gap: 8 }}>
        <TouchableOpacity 
          onPress={() => router.back()}
          className="border border-textPrimary items-center justify-center"
          style={{ width: '47%', height: 48, borderRadius: 0 }}
        >
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 }}
            className="text-textPrimary uppercase"
          >
            EDIT MORE
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSave}
          disabled={saving}
          className="bg-textPrimary items-center justify-center"
          style={{ width: '47%', height: 52, borderRadius: 0 }}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 13, letterSpacing: 1 }}
              className="text-white uppercase"
            >
              ADD TO STORE
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
