import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import CameraScreen from './src/screens/CameraScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import DealsScreen from './src/screens/DealsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ChildrenScreen from './src/screens/ChildrenScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#E8335A',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>📷</Text>, tabBarLabel: 'Snap' }}
      />
      <Tab.Screen
        name="Wishlist"
        component={WishlistScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>🎁</Text>, tabBarLabel: 'Wishlist' }}
      />
      <Tab.Screen
        name="Children"
        component={ChildrenScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>👶</Text>, tabBarLabel: 'Children' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 22 }}>⚙️</Text>, tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Deals" component={DealsScreen} options={{ headerShown: true, title: 'Find Deals' }} />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
