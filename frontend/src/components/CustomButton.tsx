import React from 'react';
import { Button, ButtonProps } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface CustomButtonProps extends Omit<ButtonProps, 'children'> {
  title: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ title, style, ...rest }) => {
  return (
    <Button
      mode="contained"
      buttonColor="#5D4D5D"
      textColor="#FFFFFF"
      style={[styles.button, style]}
      labelStyle={styles.label}
      contentStyle={styles.content}
      {...rest}
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 8,
    marginVertical: 8,
  },
  label: {
    fontFamily: 'PoppinsBold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  content: {
    height: 50,
  },
});
