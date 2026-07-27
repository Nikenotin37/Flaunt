// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

export default function StoryViewerScreen() {
  const { id } = useLocalSearchParams(); // store_id
  const router = useRouter();
  
  const [stories, setStories] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedValue = useRef(0);

  useEffect(() => {
    fetchStoreStories();
  }, [id]);

  const fetchStoreStories = async () => {
    const { data } = await safeApiCall(() => 
      supabase
        .from('stories')
        .select('*, store:stores(store_name, logo_url), product:products(id, name, price, images, sizes)')
        .eq('store_id', id)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: true })
    );

    if (data && data.length > 0) {
      setStories(data);
    } else {
      router.back(); // no valid stories
    }
  };

  const startProgress = useCallback((fromValue = 0) => {
    progressAnim.setValue(fromValue);
    const remainingDuration = STORY_DURATION * (1 - fromValue);
    
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false, // since we are changing width
    });
    
    animRef.current.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });
  }, [currentIndex, stories]);

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  }, [currentIndex, stories]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      progressAnim.setValue(0);
      startProgress(0);
    }
  }, [currentIndex, stories]);

  useEffect(() => {
    if (stories.length > 0) {
      startProgress(0);
      markAsViewed();
    }
    return () => {
      animRef.current?.stop();
    };
  }, [currentIndex, stories]);

  const markAsViewed = async () => {
    const story = stories[currentIndex];
    if (story) {
      await safeApiCall(() => 
        supabase.rpc('increment_story_view', { story_id: story.id })
      );
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    animRef.current?.stop();
    progressAnim.stopAnimation((value) => {
      pausedValue.current = value;
    });
  };

  const handleResume = () => {
    setIsPaused(false);
    startProgress(pausedValue.current);
  };

  const handleTap = (evt: any) => {
    const tapX = evt.nativeEvent.locationX;
    if (tapX < width * 0.35) {
      goPrev();
    } else {
      goNext();
    }
  };

  // Swipe down to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 20 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          router.back();
        }
      },
    })
  ).current;

  if (stories.length === 0) return <View className="flex-1 bg-black" />;

  const story = stories[currentIndex];
  const store = story.store;
  const product = story.product;

  return (
    <View className="flex-1 bg-black" {...panResponder.panHandlers}>
      {/* Background photo */}
      <Image 
        source={{ uri: story.media_url }}
        className="absolute w-full h-full"
        resizeMode="cover"
        style={{ opacity: 0.8 }}
      />

      <TouchableWithoutFeedback
        onPress={handleTap}
        onLongPress={handlePause}
        onPressOut={() => { if (isPaused) handleResume(); }}
        delayLongPress={200}
      >
        <SafeAreaView className="flex-1 justify-between p-6 bg-black/30">
          
          {/* Top Section */}
          <View>
            {/* Progress Bars */}
            <View className="flex-row mb-4" style={{ gap: 6 }}>
              {stories.map((_, i) => (
                <View key={i} className="flex-1 h-1 bg-white/20 relative overflow-hidden rounded-full">
                  {i < currentIndex ? (
                    <View className="absolute left-0 top-0 bottom-0 w-full bg-white" />
                  ) : i === currentIndex ? (
                    <Animated.View 
                      style={{
                        position: 'absolute', left: 0, top: 0, bottom: 0,
                        backgroundColor: '#FFFFFF',
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      }}
                    />
                  ) : null}
                </View>
              ))}
            </View>

            {/* User profile row */}
            <View className="flex-row items-center justify-between">
              <TouchableOpacity className="flex-row items-center" onPress={() => router.push(`/store/${story.store_id}`)}>
                <Image 
                  source={{ uri: store?.logo_url || 'https://via.placeholder.com/150' }}
                  className="w-10 h-10 mr-3 border border-border rounded-full"
                />
                <View>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13 }} className="text-white uppercase">{store?.store_name}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase mt-0.5">
                    {Math.floor((new Date().getTime() - new Date(story.created_at).getTime()) / 3600000)}H AGO
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => router.back()}>
                <Feather name="x" size={24} color="#FFFFFF" strokeWidth={1.5} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Central Captions */}
          {story.caption && (
            <View className="items-center my-auto">
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 32, fontStyle: 'italic', letterSpacing: -1 }}
                className="text-white uppercase text-center"
              >
                {story.caption}
              </Text>
            </View>
          )}

          {/* Bottom section (Product Peek + Reply) */}
          <View style={{ gap: 16 }}>
            {/* White Card Peek */}
            {product && (
              <TouchableOpacity 
                className="bg-white p-4 flex-row items-center"
                style={{ borderRadius: 0 }}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Image 
                  source={{ uri: product.images?.[0] || 'https://via.placeholder.com/150' }} 
                  style={{ width: 68, height: 68, borderRadius: 0 }}
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4 justify-between">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-2">
                      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase">{product.name}</Text>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase mt-0.5">SIZE {product.sizes?.[0]}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15 }} className="text-textPrimary">₹{product.price}</Text>
                  </View>

                  <View className="flex-row items-center mt-2">
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 10, letterSpacing: 1 }} className="text-textPrimary uppercase mr-1">SHOP ARCHIVE</Text>
                    <Feather name="arrow-right" size={10} color="#0D0D0D" strokeWidth={2.5} />
                  </View>
                </View>
              </TouchableOpacity>
            )}

            {/* Reply Input */}
            <View className="flex-row items-center border border-white/50 rounded-full px-4 py-2 bg-black/40">
              <Feather name="camera" size={24} color="#FFF" />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: '#FFF', marginLeft: 12, flex: 1 }}>Send Message...</Text>
              <Feather name="heart" size={24} color="#FFF" />
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}
