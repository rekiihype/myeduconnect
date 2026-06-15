import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen     from './src/screens/LoginScreen';
import RegisterScreen  from './src/screens/RegisterScreen';
import HomeScreen      from './src/screens/HomeScreen';
import CoursesScreen   from './src/screens/CoursesScreen';
import CourseDetailScreen from './src/screens/CourseDetailScreen';
import ProfileScreen   from './src/screens/ProfileScreen';
import EnrolmentScreen from './src/screens/EnrolmentScreen';
import PaymentScreen   from './src/screens/PaymentScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const THEME = {
  bg:      '#050505',
  card:    '#0A0A0A',
  primary: '#FFFFFF',
  accent:  '#888888',
  text:    '#FFFFFF',
  muted:   '#888888',
  border:  '#222222',
};

function MainTabs({ route }) {
  const { token, user } = route.params;
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: { backgroundColor: THEME.card, borderTopColor: THEME.border },
        tabBarActiveTintColor: THEME.primary,
        tabBarInactiveTintColor: THEME.muted,
        headerStyle: { backgroundColor: THEME.card },
        headerTintColor: THEME.text,
      }}
    >
      <Tab.Screen name="Home"      options={{ tabBarLabel: 'Home',      tabBarIcon: () => <Text>🏠</Text> }}>
        {props => <HomeScreen {...props} token={token} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Courses"   options={{ tabBarLabel: 'Courses',   tabBarIcon: () => <Text>📚</Text> }}>
        {props => <CoursesScreen {...props} token={token} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="My Learning" options={{ tabBarLabel: 'Learning', tabBarIcon: () => <Text>🎓</Text> }}>
        {props => <EnrolmentScreen {...props} token={token} user={user} />}
      </Tab.Screen>
      <Tab.Screen name="Profile"   options={{ tabBarLabel: 'Profile',   tabBarIcon: () => <Text>👤</Text> }}>
        {props => <ProfileScreen {...props} token={token} user={user} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser]   = useState(null);

  useEffect(() => {
    AsyncStorage.getItem('mec_token').then(t => {
      setToken(t);
      setInitializing(false);
    });
  }, []);

  if (initializing) return null;

  return (
    <NavigationContainer theme={{
      colors: { background: THEME.bg, card: THEME.card, text: THEME.text, border: THEME.border, primary: THEME.primary }
    }}>
      <StatusBar style="light" />
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: THEME.card }, headerTintColor: THEME.text }}>
        {!token ? (
          <>
            <Stack.Screen name="Login"    options={{ headerShown: false }}>
              {props => <LoginScreen {...props} onLogin={(t, u) => { setToken(t); setUser(u); }} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ title: 'Create Account' }}>
              {props => <RegisterScreen {...props} onLogin={(t, u) => { setToken(t); setUser(u); }} />}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Main" options={{ headerShown: false }}>
              {props => <MainTabs {...props} route={{ ...props.route, params: { token, user } }} />}
            </Stack.Screen>
            <Stack.Screen name="CourseDetail" options={{ title: 'Course Details' }}>
              {props => <CourseDetailScreen {...props} token={token} user={user} />}
            </Stack.Screen>
            <Stack.Screen name="Payment" options={{ title: 'Complete Enrolment' }}>
              {props => <PaymentScreen {...props} token={token} user={user} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
