import React, { useEffect } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Colors } from '@/constants/colors';
import { RootStackParamList } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy-load screens to avoid circular imports
const ProfileScreen = React.lazy(() =>
  import('@/screens/profile/ProfileScreen').then((m) => ({ default: m.ProfileScreen })),
);
import { VideoPlayerScreen } from '@/screens/video/VideoPlayerScreen';
import { CommentsScreen } from '@/screens/video/CommentsScreen';
import { EditProfileScreen } from '@/screens/profile/EditProfileScreen';
import { SettingsScreen } from '@/screens/settings/SettingsScreen';
import { PrivacySettingsScreen } from '@/screens/settings/PrivacyScreen';
import { BlockedUsersScreen } from '@/screens/settings/BlockedUsersScreen';
import { NotificationsScreen } from '@/screens/notifications/NotificationsScreen';
import { SearchScreen } from '@/screens/search/SearchScreen';
import { CalendarScreen } from '@/screens/profile/CalendarScreen';
import { StreakScreen } from '@/screens/profile/StreakScreen';
import { FollowersScreen } from '@/screens/social/FollowersScreen';
import { FollowingScreen } from '@/screens/social/FollowingScreen';
import { FavoritesScreen } from '@/screens/social/FavoritesScreen';
import { CloseFriendsScreen } from '@/screens/social/CloseFriendsScreen';
import { CommunityDetailScreen } from '@/screens/communities/CommunityDetailScreen';
import { TwoFactorSetupScreen } from '@/screens/settings/TwoFactorSetupScreen';
import { PostDetailsScreen } from '@/screens/record/PostDetailsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.background,
    card: Colors.backgroundElevated,
    text: Colors.text,
    border: Colors.border,
    primary: Colors.accent,
    notification: Colors.accent,
  },
};

export function RootNavigator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initialize = useAuthStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '600', fontSize: 16 },
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainNavigator} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen as React.ComponentType} options={{ title: '' }} />
            <Stack.Screen name="VideoPlayer" component={VideoPlayerScreen} options={{ headerShown: false, presentation: 'fullScreenModal' }} />
            <Stack.Screen name="Comments" component={CommentsScreen} options={{ title: 'Comments', presentation: 'modal' }} />
            <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit profile' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ title: 'Privacy' }} />
            <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} options={{ title: 'Blocked users' }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
            <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} options={{ title: 'Calendar' }} />
            <Stack.Screen name="StreakScreen" component={StreakScreen} options={{ title: 'Your streak' }} />
            <Stack.Screen name="Followers" component={FollowersScreen} options={{ title: 'Followers' }} />
            <Stack.Screen name="Following" component={FollowingScreen} options={{ title: 'Following' }} />
            <Stack.Screen name="FavoritesScreen" component={FavoritesScreen} options={{ title: 'Favorites' }} />
            <Stack.Screen name="CloseFriendsScreen" component={CloseFriendsScreen} options={{ title: 'Close friends' }} />
            <Stack.Screen name="CommunityDetail" component={CommunityDetailScreen} options={{ title: '' }} />
            <Stack.Screen name="TwoFactorSetup" component={TwoFactorSetupScreen} options={{ title: 'Two-factor auth' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
