import { supabase } from '../../../services/supabase/client';
import * as Location from 'expo-location';

let subscription = null;

export const startRequestListener = async (onRequestReceived) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('ログインしてください');
  }

  if (subscription) {
    subscription.unsubscribe();
  }

  subscription = supabase
    .channel('location_requests_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'location_requests',
        filter: `user_id=eq.${user.id}`,
      },
      async (payload) => {
        console.log('位置情報リクエストを受信:', payload);
        
        try {
          await handleLocationRequest(payload.new);
          if (onRequestReceived) {
            onRequestReceived(payload.new);
          }
        } catch (error) {
          console.error('位置情報送信エラー:', error);
        }
      }
    )
    .subscribe();

  console.log('リクエスト監視を開始しました');
  return subscription;
};

export const stopRequestListener = () => {
  if (subscription) {
    subscription.unsubscribe();
    subscription = null;
    console.log('リクエスト監視を停止しました');
  }
};

const handleLocationRequest = async (request) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('ログインしてください');
    }

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('位置情報の権限が許可されていません');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    const { error: insertError } = await supabase
      .from('locations')
      .insert([
        {
          user_id: user.id,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          altitude: location.coords.altitude,
          accuracy: location.coords.accuracy,
          speed: location.coords.speed,
          heading: location.coords.heading,
          timestamp: new Date(location.timestamp).toISOString(),
          request_id: request.id,
        }
      ]);

    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from('location_requests')
      .update({
        completed: true,
        completed_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    if (updateError) {
      console.error('リクエスト更新エラー:', updateError);
    }

    console.log('位置情報を送信しました');
  } catch (error) {
    console.error('位置情報取得・送信エラー:', error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('位置情報の権限が許可されていません');
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return location;
  } catch (error) {
    console.error('位置情報取得エラー:', error);
    throw error;
  }
};
