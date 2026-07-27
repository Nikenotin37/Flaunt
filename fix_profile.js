const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { session, setSession, isSeller, storeId } = useAuthStore();
  const router = useRouter();
  
  const [profileData, setProfileData] = useState<any>(null);
  const [storeData, setStoreData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState({ listings: 0, followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [session, isSeller, storeId]);

  const fetchProfile = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }
    const userId = session.user.id;

    // Fetch user details
    const { data: user } = await safeApiCall(() => supabase.from('users').select('*').eq('auth_id', userId).single());
    if (user) setProfileData(user);

    // Fetch following count
    const { data: followsData } = await safeApiCall(() => supabase.from('follows').select('id', { count: 'exact' }).eq('follower_id', userId));
    const followingCount = followsData?.length || 0;

    let listingsCount = 0;
    let followersCount = 0;

    if (isSeller && storeId) {
      // Fetch store
      const { data: store } = await safeApiCall(() => supabase.from('stores').select('*').eq('id', storeId).single());
      if (store) {
        setStoreData(store);
        followersCount = store.follower_count || 0;
      }

      // Fetch products
      const { data: prods } = await safeApiCall(() => supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false }));
      if (prods) {
        setProducts(prods);
        listingsCount = prods.length;
      }
    }

    setStats({ listings: listingsCount, followers: followersCount, following: followingCount });
    setLoading(false);
  };

  const handleLogout = () => {
    setMenuVisible(false);
    setSession(null);
  };

  const themeColors = {
    bg: '#F7F4EF',
    text: '#0D0D0D',
    secondary: '#9B9B8E',
    border: '#EBEBEB',
  };

  // Apply theme if seller
  if (isSeller && storeData?.theme_id) {
    if (storeData.theme_id === 'dark_luxury') {
      themeColors.bg = '#0D0D0D';
      themeColors.text = '#FFFFFF';
      themeColors.secondary = '#888888';
      themeColors.border = '#333333';
    }
    // other themes can be implemented here...
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: themeColors.bg }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-3" style={{ borderBottomWidth: 1, borderColor: themeColors.border }}>
        <View className="w-8" />
        <Text 
          style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: themeColors.text }}
          className="uppercase"
        >
          {profileData?.full_name || 'PROFILE'}
        </Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={themeColors.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        {/* Top: Square Avatar + Name + Stats Row */}
        <View className="px-4 pt-6 flex-row items-center justify-between">
          {/* Avatar (Square) */}
          <View className="items-center mr-4" style={{ width: 80 }}>
            <View className="w-20 h-20 bg-gray-200" style={{ borderRadius: 0, borderWidth: 1, borderColor: themeColors.border }}>
              <Image 
                source={{ uri: storeData?.logo_url || profileData?.avatar_url || 'https://via.placeholder.com/150' }}
                className="w-full h-full"
                style={{ borderRadius: 0 }}
              />
            </View>
          </View>
          
          {/* Stats Row */}
          <View className="flex-1 flex-row justify-around">
            <View className="items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: themeColors.text }}>{stats.listings}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: themeColors.text }}>Listings</Text>
            </View>
            <View className="items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: themeColors.text }}>{stats.followers}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: themeColors.text }}>Followers</Text>
            </View>
            <View className="items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 18, color: themeColors.text }}>{stats.following}</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: themeColors.text }}>Following</Text>
            </View>
          </View>
        </View>

        {/* Bio Text below stats */}
        <View className="px-4 py-4">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: themeColors.text }}>
            {storeData?.store_name || profileData?.full_name || 'User Name'}
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, color: themeColors.text, marginTop: 2 }}>
            {storeData?.bio || 'Welcome to my profile.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="px-4 py-2 flex-row gap-2">
          <TouchableOpacity 
            className="flex-1 py-1.5 items-center justify-center"
            style={{ backgroundColor: themeColors.border, borderRadius: 6 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: themeColors.text }}>Edit profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            className="flex-1 py-1.5 items-center justify-center"
            style={{ backgroundColor: themeColors.border, borderRadius: 6 }}
          >
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: themeColors.text }}>Share profile</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="mt-4" style={{ borderBottomWidth: 1, borderColor: themeColors.border }} />
        
        {/* Grid Tabs */}
        <View className="flex-row items-center justify-around h-12" style={{ borderBottomWidth: 1, borderColor: themeColors.border }}>
          <View className="flex-1 items-center justify-center h-full" style={{ borderBottomWidth: 1, borderColor: themeColors.text }}>
            <Feather name="grid" size={24} color={themeColors.text} />
          </View>
          <View className="flex-1 items-center justify-center h-full">
            <Feather name="bookmark" size={24} color={themeColors.secondary} />
          </View>
        </View>

        {/* Content Area */}
        {isSeller ? (
          <View className="flex-row flex-wrap">
            {products.map((item, index) => (
              <TouchableOpacity 
                key={item.id} 
                onPress={() => router.push(\`/product/\${item.id}\`)}
                style={{ 
                  width: width / 3, 
                  height: width / 3, 
                  borderRightWidth: (index + 1) % 3 !== 0 ? 1 : 0,
                  borderBottomWidth: 1,
                  borderColor: themeColors.bg
                }}
              >
                <Image 
                  source={{ uri: item.images?.[0] || 'https://via.placeholder.com/300' }}
                  className="w-full h-full bg-gray-200"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="p-6 mt-4">
            <TouchableOpacity 
              onPress={() => router.push('/seller-onboarding')}
              className="w-full bg-[#0D0D0D] p-6 items-center justify-center"
            >
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16, color: '#FFFFFF' }} className="uppercase mb-2">
                BECOME A SELLER
              </Text>
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#FFFFFF', textAlign: 'center' }}>
                Open your store and start selling to our exclusive community.
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Slide-in Hamburger Menu (Right Side) */}
      <Modal visible={menuVisible} animationType="fade" transparent={true} onRequestClose={() => setMenuVisible(false)}>
        <View className="flex-1 flex-row">
          <TouchableOpacity className="flex-1 bg-black/50" activeOpacity={1} onPress={() => setMenuVisible(false)} />
          <View className="bg-white h-full" style={{ width: width * 0.7 }}>
            <View className="pt-12 px-6 pb-6 border-b border-border flex-row justify-between items-center">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }}>MENU</Text>
              <TouchableOpacity onPress={() => setMenuVisible(false)}>
                <Feather name="x" size={24} color="#0D0D0D" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              <TouchableOpacity className="flex-row items-center p-6 border-b border-border" onPress={() => { setMenuVisible(false); router.push('/wishlist' as any); }}>
                <Feather name="bookmark" size={20} color="#0D0D0D" />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 16 }}>Saved</Text>
              </TouchableOpacity>
              
              {isSeller && (
                <TouchableOpacity className="flex-row items-center p-6 border-b border-border" onPress={() => { setMenuVisible(false); router.push('/dashboard' as any); }}>
                  <Feather name="pie-chart" size={20} color="#0D0D0D" />
                  <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 16 }}>Dashboard</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity className="flex-row items-center p-6 border-b border-border">
                <Feather name="settings" size={20} color="#0D0D0D" />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 16 }}>Settings</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center p-6 border-b border-border">
                <Feather name="help-circle" size={20} color="#0D0D0D" />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 16 }}>Help</Text>
              </TouchableOpacity>
              
              <TouchableOpacity className="flex-row items-center p-6" onPress={handleLogout}>
                <Feather name="log-out" size={20} color="#FF3B00" />
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, marginLeft: 16, color: '#FF3B00' }}>Log Out</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
`;
fs.writeFileSync('src/app/(tabs)/profile.tsx', code);
