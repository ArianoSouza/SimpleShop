import React, { useState, useRef } from 'react';
import { StyleSheet, View, Animated, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, IconButton, ActivityIndicator, TextInput } from 'react-native-paper';
import { CustomInput } from '../components/CustomInput';
import { CustomButton } from '../components/CustomButton';
import { requestPasswordReset, verifyResetCode, resetPassword } from '../services/api';

export const RecuperarSenhaScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Erros
  const [emailError, setEmailError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animação de transição entre passos
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = (nextStep: number) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleRequestCode = async () => {
    if (!email.trim() || !email.includes('@')) {
      setEmailError('Informe um e-mail válido');
      return;
    }

    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      Alert.alert('Código Enviado', 'Se o e-mail estiver cadastrado, você receberá um código de 6 dígitos.');
      transitionTo(2);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível solicitar o código.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      setCodeError('O código deve ter 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await verifyResetCode(email.trim(), code);
      transitionTo(3);
    } catch (error: any) {
      setCodeError(error.message || 'Código inválido ou expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setPasswordError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({
        email: email.trim(),
        code: code,
        newPassword: newPassword
      });
      
      const onSuccess = () => {
        // Usa replace para garantir a navegação no Web e Native
        navigation.replace('Login');
      };

      if (Platform.OS === 'web') {
        alert('Sua senha foi redefinida com sucesso!');
        onSuccess();
      } else {
        Alert.alert(
          'Sucesso', 
          'Sua senha foi redefinida com sucesso!', 
          [{ text: 'Fazer Login', onPress: onSuccess }],
          { cancelable: false }
        );
      }
    } catch (error: any) {
      setPasswordError(error.message || 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text variant="bodyLarge" style={styles.description}>
              Informe seu e-mail para receber um código de recuperação.
            </Text>
            <CustomInput 
              label="E-mail"
              placeholder="seu@email.com"
              keyboardType="email-address"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              errorText={emailError}
              disabled={loading}
              left={<TextInput.Icon icon="email-outline" color="#5D4D5D" />}
            />
            <CustomButton 
              title="Enviar Código" 
              onPress={handleRequestCode} 
              loading={loading}
              style={styles.button}
            />
          </View>
        );
      case 2:
        return (
          <View>
            <Text variant="bodyLarge" style={styles.description}>
              Insira o código de 6 dígitos enviado para {email}
            </Text>
            <CustomInput 
              label="Código"
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={(text) => {
                setCode(text);
                setCodeError('');
              }}
              errorText={codeError}
              disabled={loading}
              left={<TextInput.Icon icon="numeric" color="#5D4D5D" />}
            />
            <CustomButton 
              title="Verificar Código" 
              onPress={handleVerifyCode} 
              loading={loading}
              style={styles.button}
            />
            <TouchableOpacity onPress={() => transitionTo(1)} disabled={loading}>
              <Text style={styles.backLink}>Alterar e-mail</Text>
            </TouchableOpacity>
          </View>
        );
      case 3:
        return (
          <View>
            <Text variant="bodyLarge" style={styles.description}>
              Crie uma nova senha segura para sua conta.
            </Text>
            <CustomInput 
              label="Nova Senha"
              secureTextEntry
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                setPasswordError('');
              }}
              disabled={loading}
              left={<TextInput.Icon icon="lock-outline" color="#5D4D5D" />}
            />
            <CustomInput 
              label="Confirmar Nova Senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setPasswordError('');
              }}
              errorText={passwordError}
              disabled={loading}
              left={<TextInput.Icon icon="lock-check-outline" color="#5D4D5D" />}
            />
            <CustomButton 
              title="Redefinir Senha" 
              onPress={handleResetPassword} 
              loading={loading}
              style={styles.button}
            />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton 
          icon="chevron-left" 
          iconColor="#b96565" 
          size={30} 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        />
        <Text variant="displaySmall" style={styles.logo}>Lista de Compras</Text>
      </View>

      <Text variant="headlineMedium" style={styles.title}>Recuperar Senha</Text>

      <Animated.View style={[styles.form, { opacity: fadeAnim }]}>
        {renderStep()}
      </Animated.View>
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
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  backButton: {
    marginLeft: -12,
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
    marginBottom: 20,
  },
  description: {
    color: '#5D4D5D',
    textAlign: 'center',
    fontFamily: 'PoppinsRegular',
    marginBottom: 30,
    lineHeight: 24,
  },
  form: {
    width: '100%',
  },
  button: {
    marginTop: 20,
  },
  backLink: {
    color: '#b96565',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'PoppinsBold',
    textDecorationLine: 'underline',
  }
});
