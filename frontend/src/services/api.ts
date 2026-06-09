import AsyncStorage from '@react-native-async-storage/async-storage';
import * as storage from './storage';
import { resetToLogin } from '../navigation/RootNavigation';

// Nota: Em dispositivos físicos ou emuladores Android, 'localhost' pode não funcionar.
// Use o IP da sua máquina se estiver testando em um dispositivo físico.
// Em desenvolvimento (__DEV__), usamos localhost (ou o IP 10.0.2.2 para emuladores Android)
// Em produção (Build do APK), usamos a URL do Fly.io
const BASE_URL = __DEV__ 
  ? 'http://192.168.1.12:3000/api' 
  : 'https://simpleshop.fly.dev/api';

export const endpoints = {
  login: `${BASE_URL}/auth/login`,
  register: `${BASE_URL}/auth/register`,
  requestReset: `${BASE_URL}/auth/request-reset`,
  verifyCode: `${BASE_URL}/auth/verify-code`,
  resetPassword: `${BASE_URL}/auth/reset-password`,
  lists: `${BASE_URL}/shopping-lists`,
  listById: (id: string) => `${BASE_URL}/shopping-lists/${id}`,
};

// ... (getHeaders remain same)

// --- AUTHENTICATION ---

// ... (login/register/logout stay same)

export const requestPasswordReset = async (email: string) => {
  const response = await fetch(endpoints.requestReset, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Erro ao solicitar recuperação');
  return data;
};

export const verifyResetCode = async (email: string, code: string) => {
  const response = await fetch(endpoints.verifyCode, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Código inválido');
  return data;
};

export const resetPassword = async (data: any) => {
  const response = await fetch(endpoints.resetPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message || 'Erro ao redefinir senha');
  return result;
};

// --- AUTH HELPERS ---
const getHeaders = async () => {
  const token = await AsyncStorage.getItem('user_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// --- AUTHENTICATION ---
export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(endpoints.login, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro no login');

    if (data.token) {
      await AsyncStorage.setItem('user_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

export const register = async (userData: any) => {
  try {
    const response = await fetch(endpoints.register, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Erro no registro');

    if (data.token) {
      await AsyncStorage.setItem('user_token', data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Erro no register:', error);
    throw error;
  }
};

export const logout = async () => {
  await storage.clearAllCache();
};

// --- SHOPPING LISTS ---
export const fetchLists = async () => {
  try {
    const response = await fetch(endpoints.lists, {
      headers: await getHeaders(),
    });

    if (response.status === 401) {
      await logout();
      resetToLogin();
      return [];
    }

    if (!response.ok) throw new Error('Erro ao buscar listas');
    
    const data = await response.json();
    await storage.saveListsToCache(data);
    return data;
  } catch (error) {
    console.warn('Usando listas do cache devido a erro na API:', error);
    const cachedData = await storage.getListsFromCache();
    return cachedData || [];
  }
};

export const fetchListById = async (id: string) => {
  try {
    const response = await fetch(endpoints.listById(id), {
      headers: await getHeaders(),
    });

    if (response.status === 401) {
      await logout();
      resetToLogin();
      throw new Error('Sessão expirada. Redirecionando...');
    }

    if (!response.ok) throw new Error('Erro ao buscar lista');
    
    const data = await response.json();
    await storage.saveListByIdToCache(id, data);
    return data;
  } catch (error) {
    console.warn(`Usando lista ${id} do cache devido a erro na API:`, error);
    const cachedData = await storage.getListByIdFromCache(id);
    if (cachedData) return cachedData;
    throw error;
  }
};

export const createShoppingList = async (data: any) => {
  try {
    const response = await fetch(endpoints.lists, {
      method: 'POST',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      await logout();
      resetToLogin();
      throw new Error('Sessão expirada. Redirecionando...');
    }
    
    if (!response.ok) {
        throw new Error('Erro na resposta do servidor ao criar lista');
    }
    
    const result = await response.json();
    // Atualizar cache local com o resultado real do servidor
    const currentLists = await storage.getListsFromCache() || [];
    await storage.saveListsToCache([...currentLists, result]);
    
    return result;
  } catch (error) {
    console.warn('Falha ao criar lista no servidor. Salvando localmente para sincronização posterior.');
    
    // Gerar um ID temporário se necessário
    const tempId = 'temp_' + Date.now();
    const offlineData = { ...data, id: tempId, isOffline: true };
    
    // Salvar no cache para aparecer na UI imediatamente
    const currentLists = await storage.getListsFromCache() || [];
    await storage.saveListsToCache([...currentLists, offlineData]);
    await storage.saveListByIdToCache(tempId, offlineData);
    
    // Adicionar à fila de sincronização
    await storage.addToOfflineQueue({ type: 'CREATE', payload: data });
    
    return offlineData;
  }
};

export const updateShoppingList = async (listId: string, data: any) => {
  try {
    const response = await fetch(endpoints.listById(listId), {
      method: 'PUT',
      headers: await getHeaders(),
      body: JSON.stringify(data),
    });

    if (response.status === 401) {
      await logout();
      resetToLogin();
      throw new Error('Sessão expirada. Redirecionando...');
    }
    
    if (!response.ok) {
        throw new Error('Erro na resposta do servidor ao atualizar lista');
    }
    
    const result = await response.json();
    await storage.saveListByIdToCache(listId, result);
    return result;
  } catch (error) {
    console.warn(`Falha ao atualizar lista ${listId} no servidor. Salvando localmente.`);
    
    // Atualizar cache local para a UI refletir a mudança
    const offlineData = { ...data, id: listId, isOffline: true };
    await storage.saveListByIdToCache(listId, offlineData);
    
    // Adicionar à fila de sincronização
    await storage.addToOfflineQueue({ type: 'UPDATE', payload: data, id: listId });
    
    return offlineData;
  }
};

export const deleteShoppingList = async (listId: string) => {
  console.log(`[API] Iniciando exclusão. ID: ${listId}`);
  
  // Limpeza preventiva do cache
  const currentLists = await storage.getListsFromCache() || [];
  const updatedLists = currentLists.filter((l: any) => l.id !== listId);
  await storage.saveListsToCache(updatedLists);

  if (listId.startsWith('temp_')) {
    console.log('[API] Removendo item temporário da fila offline.');
    const queue = await storage.getOfflineQueue();
    const filteredQueue = queue.filter((action: any) => 
      !(action.id === listId) && 
      !(action.type === 'CREATE' && action.payload.id === listId)
    );
    await AsyncStorage.setItem('offline_queue', JSON.stringify(filteredQueue));
    return { message: 'Removido localmente' };
  }

  try {
    const headers = await getHeaders();
    console.log('[API] Chamando DELETE no servidor...');
    
    const response = await fetch(endpoints.listById(listId), {
      method: 'DELETE',
      headers: headers,
    });

    console.log(`[API] Resposta do servidor: ${response.status}`);

    if (response.status === 401) {
      console.error('[API] Erro 401 - Não autorizado');
      await logout();
      resetToLogin();
      throw new Error('Sessão expirada');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API] Erro no servidor:', errorData);
      throw new Error(errorData.message || 'Erro ao excluir');
    }

    const result = await response.json();
    console.log('[API] Sucesso na exclusão:', result);
    return result;
  } catch (error: any) {
    console.warn('[API] Falha na rede ou servidor. Movendo para fila offline.', error.message);
    await storage.addToOfflineQueue({ type: 'DELETE', id: listId, payload: {} });
    return { message: 'Agendado para exclusão offline' };
  }
};

// --- SYNC LOGIC ---
export const syncOfflineData = async () => {
    try {
        const queue = await storage.getOfflineQueue();
        if (queue.length === 0) {
            console.log('[SYNC] Fila vazia. Buscando listas atualizadas.');
            return await fetchLists();
        }

        console.log(`[SYNC] Iniciando sincronização de ${queue.length} ações...`);
        const remainingQueue = [];

        for (const action of queue) {
            try {
                let response;
                if (action.type === 'CREATE') {
                    // Se o item já foi deletado na mesma fila, ignora o CREATE
                    const isDeletedInQueue = queue.some(a => a.type === 'DELETE' && a.id === action.payload.id);
                    if (isDeletedInQueue) {
                        console.log(`[SYNC] Ignorando CREATE para item já deletado na fila: ${action.payload.id}`);
                        continue;
                    }

                    response = await fetch(endpoints.lists, {
                        method: 'POST',
                        headers: await getHeaders(),
                        body: JSON.stringify(action.payload),
                    });
                } else if (action.type === 'UPDATE') {
                    response = await fetch(endpoints.listById(action.id!), {
                        method: 'PUT',
                        headers: await getHeaders(),
                        body: JSON.stringify(action.payload),
                    });
                } else if (action.type === 'DELETE') {
                    response = await fetch(endpoints.listById(action.id!), {
                        method: 'DELETE',
                        headers: await getHeaders(),
                    });
                }

                if (response && !response.ok) {
                    if (response.status === 401) {
                        await logout();
                        resetToLogin();
                        return []; 
                    }
                    
                    // Se tentar deletar algo que já sumiu do servidor, considera sucesso
                    if (action.type === 'DELETE' && response.status === 404) {
                        console.log(`[SYNC] Item ${action.id} já não existe no servidor. Removendo da fila.`);
                        continue;
                    }

                    const errorBody = await response.json().catch(() => ({}));
                    if ((response.status === 400 && errorBody.message?.includes('integridade')) || 
                        (response.status === 500 && errorBody.message === 'Erro ao criar lista')) {
                        console.warn('[SYNC] Descartando ação inválida:', action);
                        continue; 
                    }

                    throw new Error(`Servidor retornou ${response.status}`);
                }
            } catch (error) {
                console.error('[SYNC] Falha ao processar ação:', action, error);
                remainingQueue.push(action);
            }
        }

        await AsyncStorage.setItem('offline_queue', JSON.stringify(remainingQueue));
        
        const freshLists = await fetchLists();
        
        // FILTRAR localmente listas que ainda estão marcadas para DELETAR na remainingQueue
        // Isso evita que elas reapareçam se o sync falhou para elas
        const deletedIds = remainingQueue.filter(a => a.type === 'DELETE').map(a => a.id);
        const filteredLists = freshLists.filter((l: any) => !deletedIds.includes(l.id));
        
        if (remainingQueue.length === 0) {
            console.log('[SYNC] Concluído com sucesso!');
        } else {
            console.warn(`[SYNC] Parcial. ${remainingQueue.length} itens pendentes.`);
            await storage.saveListsToCache(filteredLists);
        }
        
        return filteredLists;
    } catch (error) {
        console.error('[SYNC] Erro crítico:', error);
        return await storage.getListsFromCache() || [];
    }
};
