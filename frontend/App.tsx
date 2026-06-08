import React, { useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { useFonts, Poppins_400Regular, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import * as SplashScreen from 'expo-splash-screen';
import { theme } from './src/theme/theme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { syncOfflineData } from './src/services/api';

// Previne que a splash screen saia automaticamente até que as fontes carreguem
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    PoppinsRegular: Poppins_400Regular,
    PoppinsBold: Poppins_700Bold,
    Lobster: Lobster_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Tenta sincronizar dados offline assim que o app inicia
      syncOfflineData();
    }
  }, [fontsLoaded]);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} color={theme.colors.tertiary} size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container} onLayout={onLayoutRootView}>
        <AppNavigator />
        <StatusBar style="dark" />
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
