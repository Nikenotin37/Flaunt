import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { View, TouchableOpacity } from 'react-native';
import { useAuthStore } from '../../stores/authStore';

export default function TabLayout() {
  const { isSeller } = useAuthStore();

  return (
    <Tabs
      tabBar={({ state, descriptors, navigation }) => {
        // FIX 6: Show seller tabs if isSeller === true, customer tabs if isSeller === false
        const tabRoutes = isSeller
          ? ['orders', 'sell', 'profile']
          : ['auctions', 'index', 'profile'];
        
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
              if (!route) return null;
              
              const isFocused = state.routes[state.index].name === routeName;
              
              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });
                
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name);
                }
              };

              let iconName: any = 'compass';
              if (routeName === 'auctions') iconName = 'box'; // Tab 1: Safe chest / box
              else if (routeName === 'index') iconName = 'search'; // Tab 2: Discover Search
              else if (routeName === 'sell') iconName = 'plus'; // Tab 3: Create Plus
              else if (routeName === 'orders') iconName = 'trending-up'; // Tab 4: Graph
              else if (routeName === 'profile') iconName = 'user'; // Tab 5: User

              return (
                <TouchableOpacity
                  key={routeName}
                  onPress={onPress}
                  className="flex-1 justify-center items-center h-full"
                  style={{
                    backgroundColor: isFocused ? '#0D0D0D' : 'transparent',
                    borderRadius: 0,
                  }}
                >
                  <Feather 
                    name={iconName} 
                    size={20} 
                    color={isFocused ? '#FFFFFF' : '#0D0D0D'} 
                    strokeWidth={1.5}
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
    />
  );
}
