import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { register } from '../services/api';

export const CadastroScreen = ({ navigation }: any) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Estados para erros inline
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateEmail = (email: string) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleRegister = async () => {
    // Resetar erros
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    let hasError = false;

    if (!name.trim()) {
      setNameError('O nome é obrigatório');
      hasError = true;
    }

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
    } else if (password.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      hasError = true;
    }

    if (!confirmPassword.trim()) {
      setConfirmPasswordError('A confirmação é obrigatória');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('As senhas não coincidem');
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password });
      // Redireciona automaticamente para a Home após o cadastro
      navigation.replace('Home');
    } catch (error: any) {
      const errorMsg = error.message;
      
      if (errorMsg === 'Usuário já cadastrado com este e-mail') {
        setEmailError('Este e-mail já está em uso');
      } else if (errorMsg === 'Failed to fetch') {
        Alert.alert('Erro de Conexão', 'Não foi possível conectar ao servidor.');
      } else {
        Alert.alert('Erro no Cadastro', errorMsg || 'Erro ao realizar cadastro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="displaySmall" style={styles.title}>Faça seu cadastro</Text>

      <View style={styles.form}>
        <CustomInput 
          label="Nome" 
          placeholder="Ex: Adriana" 
          value={name}
          onChangeText={(text) => {
            setName(text);
            if (nameError) setNameError('');
          }}
          errorText={nameError}
          disabled={loading}
        />
        <CustomInput 
          label="Email" 
          placeholder="Ex: seunome@gmail.com" 
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
          label="Crie uma senha" 
          placeholder="********"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (passwordError) setPasswordError('');
          }}
          errorText={passwordError}
          disabled={loading}
          right={<TextInput.Icon icon={showPassword ? "eye-off" : "eye"} onPress={() => setShowPassword(!showPassword)} />}
        />

        {!passwordError && (
          <Text variant="bodySmall" style={styles.instruction}>
            A senha deve conter pelo menos 6 caracteres.
          </Text>
        )}

        <CustomInput 
          label="Repetir senha" 
          placeholder="********"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (confirmPasswordError) setConfirmPasswordError('');
          }}
          errorText={confirmPasswordError}
          disabled={loading}
          right={<TextInput.Icon icon={showConfirmPassword ? "eye-off" : "eye"} onPress={() => setShowConfirmPassword(!showConfirmPassword)} />}
        />

        {loading ? (
          <ActivityIndicator animating={true} color="#b96565" style={{ marginTop: 20 }} />
        ) : (
          <CustomButton 
            title="Cadastrar" 
            onPress={handleRegister} 
            style={styles.cadastrarButton}
          />
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#887e88',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  instruction: {
    color: '#887e88',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: -8,
  },
  cadastrarButton: {
    marginTop: 20,
  },
});
