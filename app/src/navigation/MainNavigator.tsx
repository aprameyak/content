import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MainTabParamList } from '@/types';
import { Colors } from '@/constants/colors';
import { useNotificationStore } from '@/store/notificationStore';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { RecordScreen } from '@/screens/record/RecordScreen';
import { CommunitiesScreen } from '@/screens/communities/CommunitiesScreen';
import { ProfileScreen } from '@/screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function RecordTabIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={styles.recordIconWrap}>
      <Feather name="circle" size={size + 4} color={Colors.accent} />
    </View>
  );
}

export function MainNavigator() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Home feed',
        }}
      />
      <Tab.Screen
        name="Record"
        component={RecordScreen}
        options={{
          tabBarIcon: ({ color, size }) => <RecordTabIcon color={color} size={size} />,
          tabBarAccessibilityLabel: 'Record today\'s video',
        }}
      />
      <Tab.Screen
        name="Communities"
        component={CommunitiesScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="grid" size={size} color={color} />,
          tabBarAccessibilityLabel: 'Communities',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} />,
          tabBarAccessibilityLabel: 'My profile',
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 1,
    height: 56,
    paddingBottom: 4,
  },
  recordIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
