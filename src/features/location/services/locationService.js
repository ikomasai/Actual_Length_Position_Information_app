import * as Location from 'expo-location';
import { supabase } from '../../../services/supabase/client';

export const saveLocationToSupabase = async (locationData, requestId = null) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('ログインしてください');
    }
    
    const { error } = await supabase
      .from('locations')
      .insert([
        {
          user_id: user.id,
          latitude: locationData.coords.latitude,
          longitude: locationData.coords.longitude,
          altitude: locationData.coords.altitude,
          accuracy: locationData.coords.accuracy,
          speed: locationData.coords.speed,
          heading: locationData.coords.heading,
          timestamp: new Date(locationData.timestamp).toISOString(),
          request_id: requestId,
        }
      ]);

    if (error) {
      console.error('位置情報の保存エラー:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('位置情報保存失敗:', error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  const { status } = await Location.requestForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('位置情報の権限が許可されていません');
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.High,
  });

  return location;
};

export const getLocationHistory = async (limit = 5) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('ログインしてください');
    }
    
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('履歴取得エラー:', error);
    return [];
  }
};
