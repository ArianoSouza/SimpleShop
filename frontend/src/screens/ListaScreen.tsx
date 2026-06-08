import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Alert, TextInput as RNTextInput, Platform } from 'react-native';
import { Text, Searchbar, IconButton, TextInput, ActivityIndicator, HelperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShoppingItem } from '../utils/mocks';
import { updateShoppingList, fetchListById, deleteShoppingList } from '../services/api';

export const ListaScreen = ({ navigation, route }: any) => {
  const { listId } = route.params || {};
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [listName, setListName] = useState('');
  const [listDescription, setListDescription] = useState('');
  const [listStatus, setListStatus] = useState<'OPEN' | 'COMPLETED'>('OPEN');
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [itemError, setItemError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await fetchListById(listId);
        setListName(data.name);
        setListDescription(data.description);
        setListStatus(data.status || 'OPEN');
        setItems([...data.items]);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar a lista.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [listId, isEditing === false]);

  const executeDelete = async () => {
    try {
      setSaving(true);
      console.log('Iniciando exclusão da lista:', listId);
      await deleteShoppingList(listId);
      navigation.goBack();
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      Alert.alert('Erro', error.message || 'Falha ao excluir lista.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteList = () => {
    console.log('Botão excluir pressionado');
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Tem certeza que deseja excluir esta lista permanentemente?');
      if (confirmed) {
        executeDelete();
      }
    } else {
      Alert.alert(
        'Excluir Lista',
        'Tem certeza que deseja excluir esta lista permanentemente?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Excluir', style: 'destructive', onPress: executeDelete }
        ]
      );
    }
  };

  const handleAddItem = () => {
    setItemError('');
    if (newItemName.trim()) {
      const newItem: ShoppingItem = {
        id: Math.random().toString(36).substr(2, 9),
        name: newItemName.trim(),
        quantity: '1.00',
        checked: false,
        list_id: listId
      };
      setItems([...items, newItem]);
      setNewItemName('');
    } else {
      setItemError('O nome do produto não pode estar vazio');
    }
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItemQuantity = (id: string, delta: number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const current = parseFloat(item.quantity) || 0;
        const next = Math.max(0.1, current + delta);
        return { ...item, quantity: next.toFixed(2) };
      }
      return item;
    }));
  };

  const handleSave = async () => {
    if (!listName.trim()) {
      Alert.alert('Erro', 'O nome da lista não pode estar vazio.');
      return;
    }

    const hasEmptyItem = items.some(item => !item.name.trim());
    if (hasEmptyItem) {
      Alert.alert('Erro', 'Todos os itens da lista devem ter um nome.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateShoppingList(listId, {
        name: listName.trim(),
        description: listDescription.trim(),
        items: items.map(i => ({ ...i, name: i.name.trim() }))
      });
      setIsEditing(false);
      
      const successMessage = result.isOffline 
        ? 'Alterações salvas offline. Serão sincronizadas em breve.' 
        : 'Lista atualizada!';
        
      Alert.alert('Sucesso', successMessage);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Falha ao salvar alterações.');
    } finally {
      setSaving(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <View style={[
      styles.itemCard, 
      isEditing && styles.itemCardEditing,
      !isEditing && item.checked && styles.itemCardChecked
    ]}>
      <View style={styles.itemInfoMain}>
        {isEditing ? (
          <RNTextInput
            style={styles.itemNameInput}
            value={item.name}
            onChangeText={(text) => {
              setItems(items.map(i => i.id === item.id ? { ...i, name: text } : i));
            }}
            placeholder="Nome do item..."
          />
        ) : (
          <View style={styles.itemNameRow}>
            {item.checked && (
              <MaterialCommunityIcons name="check-circle" size={20} color="#b96565" style={{ marginRight: 8 }} />
            )}
            <Text 
              variant="bodyLarge" 
              style={[
                styles.itemName, 
                item.checked && styles.itemNameChecked
              ]}
            >
              {item.name}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.itemActions}>
        {isEditing ? (
          <>
            <IconButton 
              icon="minus-circle-outline" 
              size={20} 
              onPress={() => updateItemQuantity(item.id, -1)} 
              iconColor="#b96565"
            />
            <Text style={styles.itemQuant}>{parseFloat(item.quantity)}</Text>
            <IconButton 
              icon="plus-circle-outline" 
              size={20} 
              onPress={() => updateItemQuantity(item.id, 1)} 
              iconColor="#5D4D5D"
            />
            <IconButton 
              icon="trash-can-outline" 
              size={20} 
              onPress={() => handleRemoveItem(item.id)} 
              iconColor="#887e88"
            />
          </>
        ) : (
          <Text variant="bodyMedium" style={styles.itemQuant}>{item.quantity}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#b96565" 
          size={30} 
          onPress={() => navigation.goBack()} 
          disabled={saving}
        />
        <Text variant="displaySmall" style={styles.logo}>Lista de Compras</Text>
        <IconButton 
          icon="trash-can" 
          iconColor="#b96565" 
          size={24} 
          onPress={handleDeleteList} 
          disabled={saving}
        />
      </View>

      <View style={styles.headerInfo}>
        {isEditing ? (
          <>
            <TextInput
              mode="flat"
              value={listName}
              onChangeText={setListName}
              style={styles.titleInput}
              placeholder="Nome da lista"
              textColor="#5D4D5D"
              disabled={saving}
              error={!listName.trim()}
            />
            <TextInput
              mode="flat"
              value={listDescription}
              onChangeText={setListDescription}
              style={styles.descInput}
              placeholder="Descrição (opcional)"
              textColor="#887e88"
              disabled={saving}
            />
          </>
        ) : (
          <>
            <Text variant="headlineMedium" style={styles.listTitle}>{listName}</Text>
            <Text variant="bodyMedium" style={styles.description}>{listDescription || 'Sem descrição'}</Text>
          </>
        )}
      </View>

      {!isEditing && (
        <Searchbar
          placeholder="Pesquisar..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
          iconColor="#887e88"
        />
      )}

      {isEditing ? (
        <View style={styles.editActionsRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.cancelBtn]} 
            onPress={() => setIsEditing(false)}
            disabled={saving}
          >
            <Text style={styles.actionBtnText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.saveBtn]} 
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.actionBtnText}>Salvar</Text>}
          </TouchableOpacity>
        </View>
      ) : (
        listStatus === 'OPEN' && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setIsEditing(true)}
          >
            <MaterialCommunityIcons name="pencil-outline" size={20} color="#FFFFFF" />
            <Text style={styles.editButtonText}>Editar lista</Text>
          </TouchableOpacity>
        )
      )}

      {listStatus === 'COMPLETED' && !isEditing && (
        <View style={styles.completedBanner}>
          <MaterialCommunityIcons name="lock" size={20} color="#887e88" />
          <Text style={styles.completedBannerText}>Esta lista está finalizada e não pode ser editada.</Text>
        </View>
      )}

      {isEditing && (
        <View style={styles.addItemRow}>
          <TextInput
            mode="outlined"
            placeholder="Novo item..."
            value={newItemName}
            onChangeText={(text) => {
              setNewItemName(text);
              if (itemError) setItemError('');
            }}
            style={styles.addItemInput}
            outlineColor={itemError ? "#B00020" : "#5D4D5D"}
            activeOutlineColor={itemError ? "#B00020" : "#5D4D5D"}
            error={!!itemError}
            onSubmitEditing={handleAddItem}
            disabled={saving}
            right={<TextInput.Icon icon="plus" onPress={handleAddItem} color="#5D4D5D" />}
          />
          {!!itemError && (
            <HelperText type="error" visible={!!itemError}>
              {itemError}
            </HelperText>
          )}
        </View>
      )}

      <View style={styles.listHeader}>
        <Text variant="bodyLarge" style={styles.listHeaderText}>Item</Text>
        <Text variant="bodyLarge" style={styles.listHeaderText}>Quant.</Text>
      </View>

      {loading ? (
        <ActivityIndicator animating={true} color="#5D4D5D" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={() => (
            <Text style={{ textAlign: 'center', marginTop: 20, color: '#887e88' }}>
              Nenhum item encontrado.
            </Text>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
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
    fontFamily: 'Lobster',
  },
  headerInfo: {
    marginBottom: 20,
  },
  listTitle: {
    textAlign: 'center',
    color: '#5D4D5D',
    marginBottom: 8,
    fontFamily: 'PoppinsBold',
  },
  titleInput: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 24,
    fontFamily: 'PoppinsBold',
    height: 50,
  },
  description: {
    textAlign: 'center',
    color: '#887e88',
    marginBottom: 20,
  },
  descInput: {
    backgroundColor: 'transparent',
    textAlign: 'center',
    fontSize: 14,
    height: 40,
    marginBottom: 10,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 2,
    marginBottom: 20,
  },
  searchInput: {
    fontFamily: 'PoppinsRegular',
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#5D4D5D',
    padding: 12,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontFamily: 'PoppinsRegular',
    fontSize: 16,
    marginLeft: 8,
  },
  editActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionBtn: {
    flex: 0.48,
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#887e88',
  },
  saveBtn: {
    backgroundColor: '#b96565',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontFamily: 'PoppinsBold',
  },
  addItemRow: {
    marginBottom: 10,
  },
  addItemInput: {
    backgroundColor: '#FFF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  listHeaderText: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
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
  },
  itemCardEditing: {
    borderColor: '#b96565',
    backgroundColor: '#FFF9F9',
  },
  itemCardChecked: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F9F9F9',
  },
  itemInfoMain: {
    flex: 1,
  },
  itemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemName: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsRegular',
  },
  itemNameChecked: {
    color: '#887e88',
    textDecorationLine: 'line-through',
  },
  itemNameInput: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsRegular',
    fontSize: 16,
    padding: 0,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQuant: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
    marginHorizontal: 4,
  },
  completedBanner: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  completedBannerText: {
    color: '#887e88',
    fontFamily: 'PoppinsRegular',
    marginLeft: 8,
    fontSize: 14,
  },
});