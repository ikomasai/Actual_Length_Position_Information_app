import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useLocationService } from '../hooks/useLocationService';
import { supabase } from '../../../services/supabase/client';

export const LocationServiceScreen = ({ navigation }) => {
  const {
    isListening,
    loading,
    error,
    user,
    lastSentAt,
    sendCount,
    history,
    startService,
    stopService,
    refreshHistory,
  } = useLocationService();

  const [refreshing, setRefreshing] = useState(false);

  const handleStartService = async () => {
    if (!user) {
      Alert.alert('エラー', 'ログインしてください');
      return;
    }

    const success = await startService();
    if (success) {
      Alert.alert('成功', '呼び出し待機を開始しました');
    } else {
      Alert.alert('エラー', error || 'サービスの開始に失敗しました');
    }
  };

  const handleStopService = async () => {
    const success = await stopService();
    if (success) {
      Alert.alert('成功', '呼び出し待機を停止しました');
    } else {
      Alert.alert('エラー', error || 'サービスの停止に失敗しました');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            if (isListening) {
              await stopService();
            }
            await supabase.auth.signOut();
            navigation.replace('Login');
          },
        },
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>位置情報送信アプリ</Text>
        {user && (
          <Text style={styles.userIdText}>
            ユーザー: {user.email || user.id.slice(0, 8)}
          </Text>
        )}
      </View>

      <View style={styles.statusContainer}>
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: isListening ? '#4CAF50' : '#9E9E9E' },
          ]}
        />
        <View style={styles.statusTextContainer}>
          <Text style={styles.statusText}>
            {isListening ? '待機中' : '停止中'}
          </Text>
          {lastSentAt && (
            <Text style={styles.lastSentText}>
              最終送信: {formatDate(lastSentAt)}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{sendCount}</Text>
          <Text style={styles.statLabel}>送信回数</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{history.length}</Text>
          <Text style={styles.statLabel}>履歴</Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.controlContainer}>
        {!isListening ? (
          <TouchableOpacity
            style={[
              styles.button,
              styles.startButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleStartService}
            disabled={loading || !user}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>サービス開始</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.button,
              styles.stopButton,
              loading && styles.buttonDisabled,
            ]}
            onPress={handleStopService}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>サービス停止</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>送信履歴</Text>
        {history.length === 0 ? (
          <Text style={styles.noHistoryText}>履歴がありません</Text>
        ) : (
          history.map((item, index) => (
            <View key={item.id || index} style={styles.historyItem}>
              <Text style={styles.historyTime}>
                {formatDate(item.timestamp)}
              </Text>
              <Text style={styles.historyLocation}>
                緯度: {item.latitude.toFixed(6)}
              </Text>
              <Text style={styles.historyLocation}>
                経度: {item.longitude.toFixed(6)}
              </Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>動作について</Text>
        <Text style={styles.infoText}>
          • ERPから呼び出しがあった時のみ位置情報を送信します
        </Text>
        <Text style={styles.infoText}>
          • サービス開始中は呼び出しを待機します
        </Text>
        <Text style={styles.infoText}>
          • バックグラウンドでも呼び出しを受信可能です
        </Text>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <Text style={styles.logoutButtonText}>ログアウト</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    marginTop: 60,
    marginBottom: 20,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  userIdText: {
    fontSize: 16,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  lastSentText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  controlContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  stopButton: {
    backgroundColor: '#f44336',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 12,
  },
  historyTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  historyLocation: {
    fontSize: 12,
    color: '#666',
  },
  infoContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  logoutButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f44336',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
});
