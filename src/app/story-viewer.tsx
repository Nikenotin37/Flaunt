import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, TouchableWithoutFeedback, Animated, Dimensions, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const STORY_DURATION = 5000;

const mockStories = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=800',
    userName: 'FLAUNT ARCHIVE',
    userAvatar: 'F',
    subtitle: 'VERIFIED CURATOR • 4H AGO',
    overlayTitle: 'ARCHIVE\nDROP 04',
    overlaySubtitle: 'LIMITED RELEASE CURATED BY FLAUNT',
    product: { title: '90S HELMUT LEATHER', meta: 'SIZE MEDIUM • PRISTINE', price: '$1,240', id: 'mock-1', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=150' },
    likes: '1.2K',
    comments: '42',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800',
    userName: 'NOIR STUDIO',
    userAvatar: 'N',
    subtitle: 'CURATOR • 2H AGO',
    overlayTitle: 'NEW\nCOLLECTION',
    overlaySubtitle: 'FALL WINTER 2024 EDITORIAL',
    product: null,
    likes: '890',
    comments: '21',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    userName: 'TECHNE',
    userAvatar: 'T',
    subtitle: 'SELLER • 6H AGO',
    overlayTitle: 'AVANT\nGARDE',
    overlaySubtitle: 'DECONSTRUCTED SILHOUETTES',
    product: { title: 'MARGIELA ARTISANAL', meta: 'SIZE 42 • MINT', price: '$2,800', id: 'mock-2', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150' },
    likes: '3.4K',
    comments: '128',
  },
];

export default function StoryViewerScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const pausedValue = useRef(0);

  const story = mockStories[currentIndex];

  const startProgress = useCallback((fromValue = 0) => {
    progressAnim.setValue(fromValue);
    const remainingDuration = STORY_DURATION * (1 - fromValue);
    animRef.current = Animated.timing(progressAnim, {
      toValue: 1,
      duration: remainingDuration,
      useNativeDriver: false,
    });
    animRef.current.start(({ finished }) => {
      if (finished) {
        goNext();
      }
    });
  }, [currentIndex]);

  const goNext = useCallback(() => {
    if (currentIndex < mockStories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      router.back();
    }
  }, [currentIndex]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      progressAnim.setValue(0);
      startProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    startProgress(0);
    return () => {
      animRef.current?.stop();
    };
  }, [currentIndex]);

  const handlePause = () => {
    setIsPaused(true);
    animRef.current?.stop();
    // Capture current progress value
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

  return (
    <View className="flex-1 bg-black" {...panResponder.panHandlers}>
      {/* Background photo */}
      <Image 
        source={{ uri: story.image }}
        className="absolute w-full h-full"
        resizeMode="cover"
        style={{ opacity: 0.5 }}
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
            {/* Progress Indicators */}
            <View className="flex-row mb-4" style={{ gap: 6 }}>
              {mockStories.map((_, i) => (
                <View key={i} className="flex-1 h-1 bg-white/20 relative overflow-hidden">
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
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-white items-center justify-center mr-3 border border-border" style={{ borderRadius: 0 }}>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18 }} className="text-textPrimary">{story.userAvatar}</Text>
                </View>
                <View>
                  <Text style={{ fontFamily: 'Inter_900Black', fontSize: 13 }} className="text-white uppercase">{story.userName}</Text>
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-[#9B9B8E] uppercase mt-0.5">{story.subtitle}</Text>
                </View>
              </View>

              <View className="flex-row items-center" style={{ gap: 16 }}>
                <TouchableOpacity>
                  <Feather name="more-horizontal" size={20} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.back()}>
                  <Feather name="x" size={20} color="#FFFFFF" strokeWidth={1.5} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Central Overlay Text */}
          <View className="items-center my-auto">
            {story.overlayTitle.split('\n').map((line, i) => (
              <Text 
                key={i}
                style={{ fontFamily: 'Inter_900Black', fontSize: 48, fontStyle: 'italic', letterSpacing: -1 }}
                className="text-white uppercase text-center"
              >
                {line}
              </Text>
            ))}
            
            <View className="w-20 h-[1.5px] bg-white my-4" />
            
            <Text 
              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 2 }}
              className="text-white uppercase text-center"
            >
              {story.overlaySubtitle}
            </Text>
          </View>

          {/* Bottom Product Peek Tag & Social actions */}
          <View style={{ gap: 16 }}>
            
            {/* White Card Peek */}
            {story.product && (
              <View className="bg-white p-4 flex-row" style={{ borderRadius: 0 }}>
                <Image 
                  source={{ uri: story.product.image }} 
                  style={{ width: 68, height: 68, borderRadius: 0 }}
                  resizeMode="cover"
                />
                <View className="flex-1 ml-4 justify-between">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1 pr-2">
                      <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase">{story.product.title}</Text>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-textSecondary uppercase mt-0.5">{story.product.meta}</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 15 }} className="text-textPrimary">{story.product.price}</Text>
                  </View>

                  <TouchableOpacity 
                    onPress={() => router.push(`/product/${story.product!.id}`)}
                    className="flex-row items-center mt-2"
                  >
                    <Text style={{ fontFamily: 'Inter_900Black', fontSize: 10, letterSpacing: 1 }} className="text-textPrimary uppercase mr-1">SHOP ARCHIVE</Text>
                    <Feather name="arrow-right" size={10} color="#0D0D0D" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Social Actions (Heart, Message, Share) */}
            <View className="flex-row justify-center py-2" style={{ gap: 40 }}>
              <TouchableOpacity className="items-center">
                <Feather name="heart" size={20} color="#FFFFFF" strokeWidth={1.5} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase mt-1">{story.likes}</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center">
                <Feather name="message-square" size={20} color="#FFFFFF" strokeWidth={1.5} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase mt-1">{story.comments}</Text>
              </TouchableOpacity>

              <TouchableOpacity className="items-center">
                <Feather name="send" size={20} color="#FFFFFF" strokeWidth={1.5} />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9 }} className="text-white uppercase mt-1">SHARE</Text>
              </TouchableOpacity>
            </View>

          </View>

        </SafeAreaView>
      </TouchableWithoutFeedback>
    </View>
  );
}
