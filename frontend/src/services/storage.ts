import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEYS = {
  LISTS: 'cached_lists',
  LIST_PREFIX: 'cached_list_',
  OFFLINE_QUEUE: 'offline_queue',
};

export const saveListsToCache = async (lists: any[]) => {
  try {
    await AsyncStorage.setItem(CACHE_KEYS.LISTS, JSON.stringify(lists));
  } catch (error) {
    console.error('Error caching lists:', error);
  }
};

export const getListsFromCache = async () => {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEYS.LISTS);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error getting cached lists:', error);
    return null;
  }
};

export const saveListByIdToCache = async (id: string, list: any) => {
  try {
    await AsyncStorage.setItem(`${CACHE_KEYS.LIST_PREFIX}${id}`, JSON.stringify(list));
  } catch (error) {
    console.error(`Error caching list ${id}:`, error);
  }
};

export const getListByIdFromCache = async (id: string) => {
  try {
    const cached = await AsyncStorage.getItem(`${CACHE_KEYS.LIST_PREFIX}${id}`);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error(`Error getting cached list ${id}:`, error);
    return null;
  }
};

export const addToOfflineQueue = async (action: { type: string; payload: any; id?: string }) => {
  try {
    const queueJson = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_QUEUE);
    const queue = queueJson ? JSON.parse(queueJson) : [];
    queue.push({ ...action, timestamp: Date.now() });
    await AsyncStorage.setItem(CACHE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  } catch (error) {
    console.error('Error adding to offline queue:', error);
  }
};

export const getOfflineQueue = async () => {
  try {
    const queueJson = await AsyncStorage.getItem(CACHE_KEYS.OFFLINE_QUEUE);
    return queueJson ? JSON.parse(queueJson) : [];
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
};

export const clearOfflineQueue = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_KEYS.OFFLINE_QUEUE);
  } catch (error) {
    console.error('Error clearing offline queue:', error);
  }
};

export const clearAllCache = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => 
      key === CACHE_KEYS.LISTS || 
      key.startsWith(CACHE_KEYS.LIST_PREFIX) ||
      key === CACHE_KEYS.OFFLINE_QUEUE ||
      key === 'user_data' ||
      key === 'user_token'
    );
    
    if (cacheKeys.length > 0) {
      // Compatibilidade Web: usa removeItem em loop se multiRemove falhar
      try {
        await AsyncStorage.multiRemove(cacheKeys);
      } catch {
        for (const key of cacheKeys) {
          await AsyncStorage.removeItem(key);
        }
      }
    }
    console.log('[STORAGE] Cache limpo com sucesso.');
  } catch (error) {
    console.error('[STORAGE] Erro ao limpar cache:', error);
  }
};
