import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, Pressable, RefreshControl } from 'react-native';
import { Text, ActivityIndicator, Modal, Portal, List, IconButton } from 'react-native-paper';
import { CustomButton } from '../components/CustomButton';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShoppingList } from '../utils/mocks';
import { fetchLists, syncOfflineData, logout } from '../services/api';
import { useIsFocused, CommonActions } from '@react-navigation/native';

export const HomeScreen = ({ navigation }: any) => {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSelectModal, setShowSelectModal] = useState(false);
  const isFocused = useIsFocused();

  const handleLogout = async () => {
    // Alerta global para teste imediato e visual
    alert('Saindo da conta...');
    
    try {
      await logout();
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    } catch (err) {
      console.error('Erro ao sair:', err);
      navigation.navigate('Login');
    }
  };

  const loadLists = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // syncOfflineData agora retorna as listas atualizadas
      const data = await syncOfflineData();
      setLists([...data]);
    } catch (error) {
      console.error('Erro ao carregar listas na Home:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas listas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadLists();
    }
  }, [isFocused, loadLists]);

  const onRefresh = useCallback(() => {
    loadLists(true);
  }, [loadLists]);

  const openLists = lists.filter(l => l.status === 'OPEN' || !l.status);

  const handleStartShopping = () => {
    if (openLists.length === 0) {
      Alert.alert('Aviso', 'Crie uma nova lista primeiro ou reabra uma lista existente.');
    } else if (openLists.length === 1) {
      navigation.navigate('Shopping', { listId: openLists[0].id });
    } else {
      setShowSelectModal(true);
    }
  };

  const renderListItem = ({ item }: { item: ShoppingList }) => (
    <TouchableOpacity 
      style={[
        styles.listCard, 
        item.status === 'COMPLETED' && styles.completedCard
      ]}
      onPress={() => navigation.navigate('Lista', { listId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.nameRow}>
          <Text variant="titleMedium" style={styles.listName}>{item.name}</Text>
          {item.status === 'COMPLETED' && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>FINALIZADA</Text>
            </View>
          )}
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#b96565" />
      </View>
      <View style={styles.cardFooter}>
        <Text variant="bodySmall" style={styles.cardInfo}>
          Criada em: {new Date(item.created_at).toLocaleDateString('pt-BR')}
        </Text>
        <Text variant="bodySmall" style={styles.cardInfo}>Admin: {item.admin}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Portal>
        <Modal
          visible={showSelectModal}
          onDismiss={() => setShowSelectModal(false)}
          contentContainerStyle={styles.modalContent}
        >
          <View style={styles.modalHeader}>
            <Text variant="headlineSmall" style={styles.modalTitle}>Escolha uma lista</Text>
            <IconButton icon="close" onPress={() => setShowSelectModal(false)} />
          </View>
          <FlatList
            data={openLists}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <List.Item
                title={item.name}
                description={`Criada em: ${new Date(item.created_at).toLocaleDateString('pt-BR')}`}
                onPress={() => {
                  setShowSelectModal(false);
                  navigation.navigate('Shopping', { listId: item.id });
                }}
                left={props => <List.Icon {...props} icon="basket" color="#b96565" />}
                titleStyle={{ fontFamily: 'PoppinsBold', color: '#5D4D5D' }}
                style={styles.modalListItem}
              />
            )}
          />
        </Modal>
      </Portal>

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={{ width: 48 }} /> 
          <Text variant="displayMedium" style={styles.logo}>Lista de Compras</Text>
          <Pressable 
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              { backgroundColor: pressed ? '#FFDADA' : '#FFF5F5' }
            ]}
            hitSlop={20}
          >
            <MaterialCommunityIcons name="logout" size={28} color="#b96565" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <Text variant="titleMedium" style={styles.subtitle}>Histórico de listas</Text>
        
        {loading && !refreshing ? (
          <ActivityIndicator animating={true} color="#5D4D5D" />
        ) : (
          <FlatList
            data={lists}
            renderItem={renderListItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#b96565"]} />
            }
            ListEmptyComponent={() => (
              <Text style={styles.emptyText}>Nenhuma lista encontrada.</Text>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        <CustomButton 
          title="NOVA LISTA" 
          onPress={() => navigation.navigate('NovaLista')}
          icon="plus"
          style={styles.newBtn}
        />
        <CustomButton 
          title="INICIAR COMPRAS" 
          onPress={handleStartShopping}
          icon={({ size, color }) => (
            <MaterialCommunityIcons name="arrow-right-box" size={size} color={color} />
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
    width: '100%',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  logo: {
    color: '#887e88',
    textAlign: 'center',
    fontFamily: 'Lobster',
    flex: 1,
  },
  logoutButton: {
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#b96565',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  subtitle: {
    color: '#000000',
    fontFamily: 'PoppinsRegular',
    marginBottom: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  listCard: {
    borderWidth: 1,
    borderColor: '#5D4D5D',
    borderRadius: 15,
    padding: 16,
    marginBottom: 12,
  },
  completedCard: {
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listName: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
  },
  statusBadge: {
    backgroundColor: '#887e88',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'PoppinsBold',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardInfo: {
    color: '#887e88',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#887e88',
  },
  footer: {
    marginBottom: 20,
  },
  newBtn: {
    backgroundColor: '#887e88', // Cor neutra para o botão secundário
    marginBottom: 8,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    margin: 20,
    borderRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontFamily: 'PoppinsBold',
    color: '#5D4D5D',
  },
  modalListItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  }
});
