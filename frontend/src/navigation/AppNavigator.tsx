import React, { useState, useEffect } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { navigationRef } from './RootNavigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator } from 'react-native';

import { LoginScreen } from '../screens/LoginScreen';
import { CadastroScreen } from '../screens/CadastroScreen';
import { RecuperarSenhaScreen } from '../screens/RecuperarSenhaScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ListaScreen } from '../screens/ListaScreen';
import { NovaListaScreen } from '../screens/NovaListaScreen';
import { ShoppingScreen } from '../screens/ShoppingScreen';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('user_token');
      setIsLoggedIn(!!token);
      setLoading(false);
    };
    checkLogin();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#5D4D5D" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator 
        initialRouteName={isLoggedIn ? "Home" : "Login"}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Cadastro" component={CadastroScreen} />
        <Stack.Screen name="RecuperarSenha" component={RecuperarSenhaScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Lista" component={ListaScreen} />
        <Stack.Screen name="NovaLista" component={NovaListaScreen} />
        <Stack.Screen name="Shopping" component={ShoppingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
