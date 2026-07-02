import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput as RNTextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface Props extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  maxLength?: number;
  containerStyle?: ViewStyle;
}

export function TextInput({
  label,
  error,
  helper,
  maxLength,
  secureTextEntry,
  containerStyle,
  value,
  style,
  ...rest
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = secureTextEntry;
  const charCount = value?.length ?? 0;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label} accessibilityRole="text">
          {label}
        </Text>
      )}

      <View style={[styles.inputWrapper, error ? styles.inputError : styles.inputNormal]}>
        <RNTextInput
          style={[styles.input, style]}
          value={value}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={isPassword && !showPassword}
          maxLength={maxLength}
          selectionColor={Colors.accent}
          {...rest}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword((v) => !v)}
            style={styles.passwordToggle}
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.meta}>
        {error ? (
          <Text style={styles.error} accessibilityRole="alert">{error}</Text>
        ) : helper ? (
          <Text style={styles.helper}>{helper}</Text>
        ) : (
          <View />
        )}
        {maxLength && (
          <Text style={[styles.counter, charCount >= maxLength && styles.counterMax]}>
            {charCount}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    backgroundColor: Colors.backgroundElevated,
  },
  inputNormal: { borderColor: Colors.border },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  passwordToggle: {
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  error: { color: Colors.error, fontSize: 12 },
  helper: { color: Colors.textMuted, fontSize: 12 },
  counter: { color: Colors.textMuted, fontSize: 12 },
  counterMax: { color: Colors.error },
});
