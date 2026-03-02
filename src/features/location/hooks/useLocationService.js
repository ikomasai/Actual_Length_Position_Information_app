import { useState, useEffect } from 'react';
import { getLocationHistory } from '../services/locationService';
import { startRequestListener, stopRequestListener } from '../services/requestListener';
import { supabase } from '../../../services/supabase/client';

export const useLocationService = () => {
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [lastSentAt, setLastSentAt] = useState(null);
  const [sendCount, setSendCount] = useState(0);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadUser();
    loadHistory();
  }, []);

  const loadUser = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    } catch (err) {
      console.error('ユーザー情報読み込みエラー:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const data = await getLocationHistory(5);
      setHistory(data);
    } catch (err) {
      console.error('履歴読み込みエラー:', err);
    }
  };

  const startService = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        throw new Error('ログインしてください');
      }

      await startRequestListener((request) => {
        console.log('リクエスト受信:', request);
        setLastSentAt(new Date());
        setSendCount(prev => prev + 1);
        loadHistory();
      });

      setIsListening(true);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('サービス開始エラー:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const stopService = async () => {
    setLoading(true);
    setError(null);
    
    try {
      stopRequestListener();
      setIsListening(false);
      return true;
    } catch (err) {
      setError(err.message);
      console.error('サービス停止エラー:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const refreshHistory = async () => {
    await loadHistory();
  };

  return {
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
  };
};
