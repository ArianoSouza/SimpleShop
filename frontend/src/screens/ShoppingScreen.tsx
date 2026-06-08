import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Text, IconButton, Checkbox, ActivityIndicator } from 'react-native-paper';
import { ShoppingItem, ShoppingList } from '../utils/mocks';
import { createShoppingList, updateShoppingList, fetchListById } from '../services/api';
import { CustomButton } from '../components/CustomButton';

export const ShoppingScreen = ({ navigation, route }: any) => {
  const { listId } = route.params || {};
  const [list, setList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (!listId) {
        console.warn('ShoppingScreen: listId is undefined');
        setFetching(false);
        return;
      }
      setFetching(true);
      try {
        const data = await fetchListById(listId);
        setList(data);
        setItems([...data.items]);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista.');
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [listId]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleFinishShopping = async () => {
    if (!list) return;

    setLoading(true);
    try {
      // 1. Atualiza a lista atual para 'COMPLETED'
      const updateResult = await updateShoppingList(list.id, { 
        items,
        name: list.name,
        description: list.description,
        status: 'COMPLETED'
      });

      // 2. Lógica de criar a lista do próximo mês
      const nextMonthDate = new Date(list.created_at);
      nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
      
      const nextMonthName = list.name.replace(/\d+/, (match) => (parseInt(match) + 1).toString());
      const finalName = nextMonthName === list.name ? `${list.name} (Próxima)` : nextMonthName;

      const createResult = await createShoppingList({
        name: finalName,
        description: list.description,
        items: list.items.map(item => ({ ...item, id: Math.random().toString(36).substr(2, 9), checked: false })),
        created_at: nextMonthDate.toISOString(),
      });

      // Feedback e navegação
      const isOffline = updateResult.isOffline || createResult.isOffline;
      const successMessage = isOffline 
        ? 'Compras salvas offline. A próxima lista será sincronizada em breve.' 
        : 'Compras finalizadas e próxima lista criada.';

      Alert.alert('Sucesso!', successMessage);
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um problema ao finalizar as compras.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity 
      style={[styles.itemCard, item.checked && styles.itemChecked]} 
      onPress={() => toggleItem(item.id)}
    >
      <View style={styles.itemMain}>
        <Checkbox
          status={item.checked ? 'checked' : 'unchecked'}
          color="#b96565"
        />
        <Text style={[styles.itemName, item.checked && styles.textChecked]}>
          {item.name}
        </Text>
      </View>
      <Text style={[styles.itemQuant, item.checked && styles.textChecked]}>
        {parseFloat(item.quantity)}
      </Text>
    </TouchableOpacity>
  );

  if (fetching || !list) return <ActivityIndicator style={styles.loader} />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#b96565" 
          size={30} 
          onPress={() => navigation.goBack()} 
        />
        <Text variant="displaySmall" style={styles.logo}>Nas Compras</Text>
      </View>

      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.listTitle}>{list.name}</Text>
        <Text variant="bodyMedium" style={styles.progress}>
          Progresso: {items.filter(i => i.checked).length} / {items.length} itens
        </Text>
      </View>

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.footer}>
        <CustomButton 
          title="FINALIZAR COMPRAS" 
          onPress={handleFinishShopping}
          loading={loading}
          disabled={loading}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  logo: {
    color: '#887e88',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  listTitle: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
  },
  progress: {
    color: '#887e88',
    fontFamily: 'PoppinsRegular',
  },
  listContent: {
    paddingBottom: 20,
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#5D4D5D',
    borderRadius: 20,
    marginBottom: 12,
    backgroundColor: '#FFF',
  },
  itemChecked: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemName: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsRegular',
    fontSize: 16,
    marginLeft: 8,
  },
  textChecked: {
    color: '#887e88',
    textDecorationLine: 'line-through',
  },
  itemQuant: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
    marginRight: 10,
  },
  footer: {
    marginTop: 10,
    marginBottom: 20,
  },
});
