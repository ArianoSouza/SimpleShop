import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';
import { StyleSheet, View, Text } from 'react-native';

interface CustomInputProps extends TextInputProps {
  label: string;
  errorText?: string;
}

export const CustomInput: React.FC<CustomInputProps> = ({ label, errorText, ...rest }) => {
  return (
    <View style={styles.container}>
      <TextInput
        {...rest}
        label={label}
        mode="outlined"
        error={!!errorText}
        outlineColor={errorText ? '#B00020' : "#5D4D5D"}
        activeOutlineColor={errorText ? '#B00020' : "#5D4D5D"}
        style={styles.input}
        theme={{
          colors: {
            primary: errorText ? '#B00020' : '#5D4D5D',
            error: '#B00020',
          },
        }}
      />
      {!!errorText && (
        <Text style={styles.errorText}>
          {errorText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'transparent',
    height: 50,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'PoppinsRegular',
  },
});
