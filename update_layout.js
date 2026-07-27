const fs = require('fs');
let code = fs.readFileSync('src/app/(tabs)/_layout.tsx', 'utf8');

const newCode = `import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, TouchableOpacity, Modal, Text } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';

export default function TabLayout() {
  const router = useRouter();
  const [showPlusSheet, setShowPlusSheet] = useState(false);

  return (
    <>
      <Tabs
        tabBar={({ state, descriptors, navigation }) => {
          // Navigation Structure exactly like Instagram
          const tabRoutes = ['index', 'search', 'plus', 'activity', 'profile'];
          
          return (
            <View 
              className="flex-row bg-[#F7F4EF]" 
              style={{ 
                height: 60, 
                borderTopWidth: 1, 
                borderTopColor: '#EBEBEB',
                paddingBottom: 4,
              }}
            >
              {tabRoutes.map((routeName) => {
                const route = state.routes.find((r) => r.name === routeName);
                const isFocused = state.routes[state.index]?.name === routeName;
                
                const onPress = () => {
                  if (routeName === 'plus') {
                    setShowPlusSheet(true);
                    return;
                  }
                  
                  if (route) {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                      canPreventDefault: true,
                    });
                    
                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                    }
                  }
                };

                let iconName: any = 'home';
                if (routeName === 'index') iconName = 'home'; // Tab 1: HOME
                else if (routeName === 'search') iconName = 'search'; // Tab 2: SEARCH
                else if (routeName === 'plus') iconName = 'plus'; // Tab 3: PLUS
                else if (routeName === 'activity') iconName = 'heart'; // Tab 4: ACTIVITY
                else if (routeName === 'profile') iconName = 'user'; // Tab 5: PROFILE

                if (routeName === 'plus') {
                  return (
                    <TouchableOpacity
                      key={routeName}
                      onPress={onPress}
                      className="flex-1 justify-center items-center h-full"
                    >
                      <View className="bg-textPrimary items-center justify-center rounded-full" style={{ width: 44, height: 44 }}>
                        <Feather name={iconName} size={24} color="#FFFFFF" strokeWidth={1.5} />
                      </View>
                    </TouchableOpacity>
                  );
                }

                return (
                  <TouchableOpacity
                    key={routeName}
                    onPress={onPress}
                    className="flex-1 justify-center items-center h-full"
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: 0,
                    }}
                  >
                    <Feather 
                      name={iconName} 
                      size={24} 
                      color={isFocused ? '#0D0D0D' : '#9B9B8E'} 
                      strokeWidth={isFocused ? 2.5 : 1.5}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="search" />
        <Tabs.Screen name="plus" />
        <Tabs.Screen name="activity" />
        <Tabs.Screen name="profile" />
      </Tabs>
      
      {/* Plus Bottom Sheet */}
      <Modal visible={showPlusSheet} animationType="slide" transparent={true} onRequestClose={() => setShowPlusSheet(false)}>
        <TouchableOpacity 
          className="flex-1 justify-end bg-black/50" 
          activeOpacity={1} 
          onPress={() => setShowPlusSheet(false)}
        >
          <TouchableOpacity activeOpacity={1} className="bg-white px-6 pt-6 pb-12 rounded-t-3xl border-t border-border">
            <View className="w-12 h-1 bg-border self-center mb-6 rounded-full" />
            
            <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-textPrimary uppercase mb-6">Create New</Text>
            
            <TouchableOpacity 
              onPress={() => {
                setShowPlusSheet(false);
                router.push('/sell/add-product');
              }}
              className="flex-row items-center py-4 border-b border-border"
            >
              <View className="w-10 h-10 rounded-full bg-surfaceContainer items-center justify-center mr-4 border border-border">
                <Feather name="box" size={18} color="#0D0D0D" />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-textPrimary uppercase">Add Product / Listing</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => {
                setShowPlusSheet(false);
                router.push('/sell/add-story');
              }}
              className="flex-row items-center py-4"
            >
              <View className="w-10 h-10 rounded-full bg-surfaceContainer items-center justify-center mr-4 border border-border">
                <Feather name="camera" size={18} color="#0D0D0D" />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14 }} className="text-textPrimary uppercase">Add Story</Text>
            </TouchableOpacity>
            
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
`;

fs.writeFileSync('src/app/(tabs)/_layout.tsx', newCode);
