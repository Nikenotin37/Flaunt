import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ALL');

  const notifications = [
    {
      id: '1',
      type: 'offer',
      isUnread: true,
      image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=150',
      boldText: 'OFFER RECEIVED',
      bodyText: 'Your archival Prada Windbreaker has a new offer of $450.',
      time: '2M',
      actions: ['ACCEPT', 'COUNTER']
    },
    {
      id: '2',
      type: 'follow',
      isUnread: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      boldText: '@CYBER_VINTAGE',
      bodyText: 'followed you and added 3 of your items to their Style Board.',
      time: '45M'
    },
    {
      id: '3',
      type: 'sold',
      isUnread: false,
      image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=150',
      boldText: 'SOLD',
      bodyText: 'Shipping label is now available for your Archive Totebag. Ship by Tuesday to maintain your status.',
      time: '3H'
    },
    {
      id: '4',
      type: 'price_drop',
      isUnread: true,
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=150',
      boldText: 'PRICE DROP',
      bodyText: 'An item in your vault, "Heliot Emil Boots", has dropped 15% in price.',
      time: '8H'
    },
    {
      id: '5',
      type: 'live_drop',
      isUnread: true,
      icon: 'aperture',
      boldText: 'LIVE DROP STARTING',
      bodyText: 'The "Tokyo Archive" curated drop begins in 10 minutes. 42 items available.',
      time: '1D',
      actions: ['JOIN LIVE']
    },
    {
      id: '6',
      type: 'review',
      isUnread: false,
      icon: 'star',
      boldText: '5-STAR REVIEW',
      bodyText: '"Item arrived in perfect condition, exactly as described. Best seller on Flaunt." — @studio_v',
      time: '2D'
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-background pt-2">
      {/* Header */}
      <View className="flex-row justify-between items-center px-margin-page pb-4 border-b border-border">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-4">
            <Feather name="arrow-left" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
          <Text 
            style={{ fontFamily: 'Inter_900Black', fontSize: 22 }}
            className="text-[#0D0D0D] uppercase"
          >
            NOTIFICATIONS
          </Text>
        </View>
        
        <View className="flex-row items-center">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 10, marginRight: 12 }} className="text-textSecondary uppercase">4 UNREAD</Text>
          <TouchableOpacity>
            <Feather name="settings" size={20} color="#0D0D0D" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-border bg-white px-4">
        {['ALL', 'OFFERS', 'ACTIVITY', 'SYSTEM'].map((tab) => {
          const isSelected = activeTab === tab;
          return (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              className="flex-1 py-4 items-center relative"
            >
              <Text 
                style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
                className={isSelected ? 'text-[#0D0D0D] uppercase' : 'text-textSecondary uppercase'}
              >
                {tab}
              </Text>
              {isSelected && (
                <View className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Notification items */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="py-2">
          {notifications.map((notif) => {
            return (
              <View 
                key={notif.id}
                className="flex-row px-6 py-5 border-b border-border relative items-start"
                style={{ backgroundColor: notif.isUnread ? 'transparent' : '#F7F4EF' }}
              >
                {/* Unread Red Dot indicator */}
                {notif.isUnread && (
                  <View 
                    className="absolute left-2.5 top-1/2 bg-accent"
                    style={{ width: 6, height: 6, borderRadius: 3, marginTop: -3 }}
                  />
                )}

                {/* Avatar Image or Icon */}
                {notif.image ? (
                  <Image source={{ uri: notif.image }} className="w-12 h-12 bg-surfaceContainer mr-4" style={{ borderRadius: 0 }} />
                ) : (
                  <View className="w-12 h-12 bg-black items-center justify-center mr-4" style={{ borderRadius: 0 }}>
                    <Feather name={notif.icon as any} size={20} color="#FFFFFF" />
                  </View>
                )}

                {/* Body Content */}
                <View className="flex-1 pr-6">
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 }} className="text-textPrimary">
                    <Text style={{ fontFamily: 'Inter_700Bold' }} className="text-textPrimary">{notif.boldText} </Text>
                    {notif.bodyText}
                  </Text>

                  {/* Actions (ACCEPT/COUNTER or JOIN LIVE) */}
                  {notif.actions && (
                    <View className="flex-row mt-3" style={{ gap: 8 }}>
                      {notif.actions.map((act) => {
                        const isPrimary = act === 'JOIN LIVE' || act === 'ACCEPT';
                        return (
                          <TouchableOpacity 
                            key={act}
                            className="px-4 py-2.5 border"
                            style={{ 
                              backgroundColor: isPrimary ? '#0D0D0D' : '#FFFFFF', 
                              borderColor: '#0D0D0D',
                              borderRadius: 0
                            }}
                          >
                            <Text 
                              style={{ fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}
                              className={isPrimary ? 'text-white' : 'text-textPrimary'}
                            >
                              {act}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* Time */}
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 10 }} className="text-textSecondary uppercase">{notif.time}</Text>
              </View>
            );
          })}
        </View>

        {/* Clear All Notifications */}
        <TouchableOpacity className="py-6 mt-4 mb-16 items-center">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.5 }} className="text-textSecondary uppercase">CLEAR ALL NOTIFICATIONS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
