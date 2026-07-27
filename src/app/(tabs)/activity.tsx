// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { safeApiCall } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';
import { useRouter } from 'expo-router';

export default function ActivityScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuthStore();
  const router = useRouter();

  const fetchNotifications = async () => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    const { data, error } = await safeApiCall(() => 
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
    );

    if (data) {
      setNotifications(data);
      // Mark as read
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id);
      if (unreadIds.length > 0) {
        supabase
          .from('notifications')
          .update({ is_read: true })
          .in('id', unreadIds)
          .then();
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [session]);

  const formatTimeAgo = (isoString: string) => {
    const elapsed = Date.now() - new Date(isoString).getTime();
    if (elapsed < 60000) return 'Just now';
    const mins = Math.floor(elapsed / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notificationsToday = notifications.filter(n => new Date(n.created_at) >= today);
  const notificationsEarlier = notifications.filter(n => new Date(n.created_at) < today);

  const renderNotification = (item: any) => {
    let icon = 'bell';
    let iconColor = '#0D0D0D';
    if (item.type === 'new_order') { icon = 'shopping-bag'; iconColor = '#FF3B00'; }
    else if (item.type === 'new_follower') { icon = 'user-plus'; }
    else if (item.type === 'new_bid') { icon = 'trending-up'; iconColor = '#FF3B00'; }
    else if (item.type === 'auction_won') { icon = 'award'; iconColor = '#FF3B00'; }
    else if (item.type === 'product_sold') { icon = 'dollar-sign'; iconColor = '#FF3B00'; }
    else if (item.type === 'story_view') { icon = 'eye'; }

    return (
      <TouchableOpacity 
        key={item.id} 
        className="flex-row items-center py-4 border-b border-border"
        onPress={() => {
          if (item.data?.product_id) router.push(`/product/${item.data.product_id}`);
          else if (item.data?.store_id) router.push(`/store/${item.data.store_id}`);
          else if (item.data?.auction_id) router.push(`/auction/${item.data.auction_id}`);
        }}
      >
        <View className="w-12 h-12 bg-surfaceContainer items-center justify-center mr-4" style={{ borderRadius: 0 }}>
          {item.data?.image ? (
            <Image source={{ uri: item.data.image }} className="w-full h-full" style={{ borderRadius: 0 }} />
          ) : (
            <Feather name={icon as any} size={20} color={iconColor} />
          )}
        </View>
        
        <View className="flex-1 mr-4">
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, lineHeight: 18 }} className="text-textPrimary">
            {item.title} <Text style={{ fontFamily: 'Inter_400Regular' }}>{item.body}</Text>
          </Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11 }} className="text-textSecondary mt-1 uppercase">
            {formatTimeAgo(item.created_at)}
          </Text>
        </View>
        
        {item.data?.product_image && (
          <Image source={{ uri: item.data.product_image }} className="w-10 h-10 bg-surfaceContainer" style={{ borderRadius: 0 }} />
        )}

        {!item.is_read && (
          <View className="w-2 h-2 rounded-full bg-accent ml-2" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background pt-2">
      <View className="px-margin-page pb-4 border-b border-border">
        <Text style={{ fontFamily: 'Inter_900Black', fontSize: 24 }} className="text-textPrimary uppercase">ACTIVITY</Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator color="#0D0D0D" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Feather name="bell" size={48} color="#EBEBEB" />
          <Text style={{ fontFamily: 'Inter_900Black', fontSize: 16 }} className="text-textSecondary uppercase mt-4">NO ACTIVITY YET</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {notificationsToday.length > 0 && (
            <View className="mb-6">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase mb-2">TODAY</Text>
              {notificationsToday.map(renderNotification)}
            </View>
          )}

          {notificationsEarlier.length > 0 && (
            <View className="mb-24">
              <Text style={{ fontFamily: 'Inter_900Black', fontSize: 14 }} className="text-textPrimary uppercase mb-2">EARLIER</Text>
              {notificationsEarlier.map(renderNotification)}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
