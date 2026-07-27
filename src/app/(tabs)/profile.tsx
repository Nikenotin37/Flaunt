import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';

export default function ProfileScreen() {
  const setSession = useAuthStore(state => state.setSession);
  const router = useRouter();

  const handleLogout = () => {
    setSession(null);
  };

  const menuItems = [
    { title: 'MY FAVORITES', icon: 'heart', route: '/auctions' },
    { title: 'ORDER HISTORY', icon: 'shopping-cart', route: '/orders' },
    { title: 'PAYMENT METHODS', icon: 'credit-card', route: null },
    { title: 'SHIPPING ADDRESSES', icon: 'map-pin', route: null },
    { title: 'NOTIFICATIONS', icon: 'bell', route: '/notifications' },
  ];

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

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Profile Avatar and Info */}
        <View className="px-6 pt-8 pb-6 items-center">
          <View className="w-24 h-24 bg-surfaceContainer mb-4 border border-border" style={{ borderRadius: 0 }}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300' }}
              className="w-full h-full"
              style={{ borderRadius: 0 }}
            />
          </View>
          
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 28, letterSpacing: -0.5 }}
            className="text-textPrimary uppercase text-center"
          >
            ALEX_ARCHIVE
          </Text>
          <Text 
            style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }}
            className="text-textSecondary uppercase mt-1 mb-6 text-center"
          >
            CURATOR / LONDON, UK
          </Text>

          <TouchableOpacity 
            className="w-full bg-textPrimary items-center justify-center py-4"
            style={{ borderRadius: 0 }}
          >
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 12, letterSpacing: 1 }} className="text-white uppercase">EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Row (No boxes, bold numbers, small caps labels) */}
        <View className="px-6 py-6 border-t border-b border-border flex-row justify-between">
          <View className="flex-1 items-center">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22 }} className="text-textPrimary">124</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 }} className="text-textSecondary uppercase mt-1">ITEMS SOLD</Text>
          </View>
          <View className="flex-1 items-center">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22 }} className="text-textPrimary">2.8k</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 }} className="text-textSecondary uppercase mt-1">FOLLOWERS</Text>
          </View>
          <View className="flex-1 items-center">
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 22 }} className="text-textPrimary">942</Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 }} className="text-textSecondary uppercase mt-1">FOLLOWING</Text>
          </View>
        </View>

        {/* BECOME A SELLER Dark Card */}
        <View className="p-6">
          <TouchableOpacity 
            onPress={() => router.push('/seller-onboarding')}
            className="w-full bg-darkBg px-6 py-8 flex-row items-center justify-between"
            style={{ borderRadius: 0 }}
          >
            <View className="flex-1 pr-6">
              <Text 
                style={{ fontFamily: 'Inter_900Black', fontSize: 24, lineHeight: 28 }}
                className="text-white uppercase mb-2"
              >
                BECOME A SELLER
              </Text>
              <Text 
                style={{ fontFamily: 'Inter_300Light', fontSize: 12, lineHeight: 18 }}
                className="text-white/60"
              >
                Join the elite network of curators and monetize your personal archive with FLAUNT.
              </Text>
            </View>
            <Feather name="arrow-up-right" size={32} color="#FFFFFF" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* Menu list with outline icons */}
        <View className="px-6 pb-20">
          {menuItems.map((item) => (
            <TouchableOpacity 
              key={item.title} 
              onPress={() => item.route && router.push(item.route as any)}
              className="flex-row items-center justify-between py-5 border-b border-border"
            >
              <View className="flex-row items-center">
                <Feather name={item.icon as any} size={18} color="#0D0D0D" strokeWidth={1.5} />
                <Text 
                  style={{ fontFamily: 'Inter_900Black', fontSize: 14, marginLeft: 16, letterSpacing: 0.5 }}
                  className="text-textPrimary uppercase"
                >
                  {item.title}
                </Text>
              </View>
              <Feather name="chevron-right" size={16} color="#9B9B8E" strokeWidth={1.5} />
            </TouchableOpacity>
          ))}
          
          {/* Sign Out (Red text, red out icon) */}
          <TouchableOpacity 
            onPress={handleLogout} 
            className="flex-row items-center py-5 border-b border-border"
          >
            <Feather name="log-out" size={18} color="#FF3B00" strokeWidth={1.5} />
            <Text 
              style={{ fontFamily: 'Inter_900Black', fontSize: 14, marginLeft: 16, letterSpacing: 0.5 }}
              className="text-[#FF3B00] uppercase"
            >
              SIGN OUT
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
