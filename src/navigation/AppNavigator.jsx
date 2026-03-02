/**
 * アプリケーションナビゲーター
 * アプリ全体のナビゲーション構造を定義します
 */

import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { LocationServiceScreen } from '../features/location/screens/LocationServiceScreen';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { supabase } from '../services/supabase/client';

/** ネイティブスタックナビゲーター */
const Stack = createNativeStackNavigator();

/**
 * アプリケーションナビゲーター
 * @returns {JSX.Element} ナビゲーターコンポーネント
 */
const AppNavigator = () => {
  const [initialRoute, setInitialRoute] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setInitialRoute(session ? 'LocationService' : 'Login');
    } catch (error) {
      console.error('認証チェックエラー:', error);
      setInitialRoute('Login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* ログイン画面 */}
        <Stack.Screen name="Login" component={LoginScreen} />
        {/* 位置情報サービス画面 */}
        <Stack.Screen name="LocationService" component={LocationServiceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
