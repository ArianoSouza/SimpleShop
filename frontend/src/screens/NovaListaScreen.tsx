import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert, Modal, TouchableOpacity, FlatList } from 'react-native';
import { Text, IconButton, TextInput, ActivityIndicator, Chip, List, Divider } from 'react-native-paper';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { createShoppingList, fetchLists } from '../services/api';

export const NovaListaScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [participants, setParticipants] = useState('');
  const [items, setItems] = useState<string[]>([]);
  const [currentItem, setCurrentItem] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [availableLists, setAvailableLists] = useState<any[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  
  // Erros inline
  const [nameError, setNameError] = useState('');
  const [itemError, setItemError] = useState('');

  const handleAddItem = () => {
    setItemError('');
    if (currentItem.trim()) {
      setItems([...items, currentItem.trim()]);
      setCurrentItem('');
    } else {
      setItemError('O nome do produto não pode estar vazio');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleOpenCopyModal = async () => {
    setLoadingLists(true);
    setShowCopyModal(true);
    try {
      const data = await fetchLists();
      setAvailableLists(data);

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar suas listas para cópia.');
      setShowCopyModal(false);
    } finally {
      setLoadingLists(false);
      navigation.navigate('Home');
    }
  };

  const handleCopyFromList = (sourceList: any) => {
    if (sourceList.items && sourceList.items.length > 0) {
      const copiedItems = sourceList.items.map((item: any) => item.name);
      setItems([...items, ...copiedItems]);
      setShowCopyModal(false);
      Alert.alert('Sucesso', `${copiedItems.length} itens copiados de "${sourceList.name}".`);
    } else {
      Alert.alert('Aviso', 'Esta lista não possui itens para copiar.');
    }
  };

  const handleSave = async () => {
    setNameError('');
    
    if (!name.trim()) {
      setNameError('O nome da lista é obrigatório');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Lista Vazia', 'Adicione pelo menos um item à sua lista antes de salvar.');
      return;
    }

    setLoading(true);
    try {
      const formattedItems = items.map(itemName => ({
        name: itemName,
        quantity: '1.00',
        checked: false
      }));

      const result = await createShoppingList({ 
        name: name.trim(), 
        description: participants ? `Participantes: ${participants}` : '',
        items: formattedItems
      });
      
      const successMessage = result.isOffline 
        ? 'Lista salva offline. Será sincronizada quando houver conexão.' 
        : 'Lista criada com sucesso!';

      Alert.alert('Sucesso', successMessage, [
        { 
          text: 'OK', 
          onPress: () => navigation.navigate('Home') 
        }
      ], { cancelable: false });
      navigation.navigate('Home');
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a lista.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.topBar}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#b96565" 
          size={30} 
          onPress={() => navigation.goBack()} 
          disabled={loading}
        />
        <Text variant="displaySmall" style={styles.logo}>Lista de Compras</Text>
      </View>

      <Text variant="headlineMedium" style={styles.title}>Nova lista</Text>

      <View style={styles.form}>
        <CustomInput 
          label="Nome da lista" 
          placeholder="Ex: Compras Mensais" 
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError('');
          }}
          errorText={nameError}
          disabled={loading}
        />
        
        <CustomInput 
          label="Convidar participantes" 
          placeholder="email@exemplo.com"
          keyboardType="email-address"
          value={participants}
          onChangeText={setParticipants}
          disabled={loading}
          right={<TextInput.Icon icon="account-plus-outline" color="#5D4D5D" />}
        />

        <View style={styles.addItemHeader}>
          <Text variant="titleMedium" style={styles.sectionLabel}>Itens da lista</Text>
          <TouchableOpacity onPress={handleOpenCopyModal} disabled={loading}>
            <Text style={styles.copyLink}>Copiar de outra lista</Text>
          </TouchableOpacity>
        </View>

        <CustomInput 
          label="Adicionar item" 
          placeholder="Ex: Arroz 5kg"
          value={currentItem}
          onChangeText={(text) => {
            setCurrentItem(text);
            if (itemError) setItemError('');
          }}
          errorText={itemError}
          disabled={loading}
          right={
            <TextInput.Icon 
              icon="plus-circle-outline" 
              color="#5D4D5D" 
              onPress={handleAddItem}
            />
          }
          onSubmitEditing={handleAddItem}
        />

        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <Chip 
              key={`${item}-${index}`} 
              onClose={loading ? undefined : () => handleRemoveItem(index)}
              style={styles.chip}
              textStyle={styles.chipText}
            >
              {item}
            </Chip>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator animating={true} color="#b96565" style={{ marginTop: 20 }} />
        ) : (
          <CustomButton 
            title="Salvar" 
            onPress={handleSave} 
            style={styles.saveButton}
          />
        )}
      </View>

      {/* Modal para copiar de lista existente */}
      <Modal
        visible={showCopyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCopyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>Escolha uma lista</Text>
              <IconButton icon="close" onPress={() => setShowCopyModal(false)} />
            </View>
            <Divider />
            
            {loadingLists ? (
              <ActivityIndicator style={{ margin: 40 }} color="#b96565" />
            ) : (
              <FlatList
                data={availableLists}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <List.Item
                    title={item.name}
                    description={`${item.items?.length || 0} itens`}
                    onPress={() => handleCopyFromList(item)}
                    left={props => <List.Icon {...props} icon="clipboard-text-outline" color="#5D4D5D" />}
                  />
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>Você ainda não possui outras listas.</Text>
                }
                style={{ maxHeight: 400 }}
              />
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  logo: {
    color: '#887e88',
    flex: 1,
    textAlign: 'center',
    marginRight: 40,
    fontFamily: 'Lobster',
  },
  title: {
    color: '#5D4D5D',
    textAlign: 'center',
    fontFamily: 'PoppinsBold',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  addItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  sectionLabel: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
  },
  copyLink: {
    color: '#b96565',
    fontFamily: 'PoppinsBold',
    textDecorationLine: 'underline',
  },
  saveButton: {
    marginTop: 20,
  },
  itemsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  chip: {
    backgroundColor: '#fce4ec',
    margin: 4,
    borderRadius: 15,
  },
  chipText: {
    color: '#b96565',
    fontFamily: 'PoppinsRegular',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalTitle: {
    color: '#5D4D5D',
    fontFamily: 'PoppinsBold',
  },
  emptyText: {
    textAlign: 'center',
    margin: 40,
    color: '#887e88',
  }
});
