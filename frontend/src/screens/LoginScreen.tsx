import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert } from 'react-native';
import { Text, Divider, ActivityIndicator } from 'react-native-paper';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { login } from '../services/api';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estados para erros inline
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleLogin = async () => {
    // Resetar erros
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email.trim()) {
      setEmailError('O e-mail é obrigatório');
      hasError = true;
    } else if (!validateEmail(email.trim())) {
      setEmailError('E-mail inválido');
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError('A senha é obrigatória');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      navigation.replace('Home');
    } catch (error: any) {
      const errorMsg = error.message ? error.message.trim() : 'Erro ao fazer login';
      const lowerMsg = errorMsg.toLowerCase();
      
      // Mapeamento de erros para exibição inline
      if (lowerMsg.includes('email') || lowerMsg.includes('e-mail') || lowerMsg.includes('cadastrado') || lowerMsg.includes('encontrado')) {
        setEmailError(errorMsg);
      } else if (lowerMsg.includes('senha') || lowerMsg.includes('password') || lowerMsg.includes('incorreta') || lowerMsg.includes('inválida')) {
        setPasswordError(errorMsg);
      } else if (lowerMsg.includes('network') || lowerMsg.includes('fetch')) {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      } else {
        Alert.alert('Erro', errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="displayMedium" style={styles.logo}>Lista de Compras</Text>
      </View>

      <View style={styles.form}>
        <CustomInput 
          label="Email" 
          keyboardType="email-address" 
          autoCapitalize="none" 
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (emailError) setEmailError('');
          }}
          errorText={emailError}
          disabled={loading}
        />
        <CustomInput 
          label="Senha" 
          secureTextEntry 
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          errorText={passwordError}
          disabled={loading}
        />
        
        {loading ? (
          <ActivityIndicator animating={true} color="#b96565" style={{ marginTop: 20 }} />
        ) : (
          <CustomButton 
            title="Entrar" 
            onPress={handleLogin} 
            style={styles.loginButton}
          />
        )}
      </View>

      <View style={styles.footer}>
        <Divider style={styles.divider} />
        <View style={styles.footerButtons}>
          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={() => navigation.navigate('RecuperarSenha')}
            disabled={loading}
          >
            <Text variant="labelLarge" style={styles.linkText}>Esqueci minha senha</Text>
          </TouchableOpacity>
          <View style={styles.verticalDivider} />
          <TouchableOpacity 
            style={styles.footerLink} 
            onPress={() => navigation.navigate('Cadastro')}
            disabled={loading}
          >
            <Text variant="labelLarge" style={styles.linkText}>Criar uma conta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logo: {
    color: '#5D4D5D',
    textAlign: 'center',
    lineHeight: 70,
    fontFamily: 'Lobster',
  },
  form: {
    width: '100%',
    marginBottom: 40,
  },
  loginButton: {
    marginTop: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  divider: {
    backgroundColor: '#5D4D5D',
    height: 1,
    marginHorizontal: 24,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 12,
  },
  footerLink: {
    flex: 1,
    alignItems: 'center',
  },
  linkText: {
    color: '#000000',
    fontFamily: 'PoppinsRegular',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#5D4D5D',
    height: '100%',
  },
});
