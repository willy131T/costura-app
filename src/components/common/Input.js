import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  prefix,
  suffix,
  helperText,
  error,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error && styles.inputError]}>
        {prefix && <Text style={styles.affix}>{prefix}</Text>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType={keyboardType}
          style={styles.input}
          {...props}
        />
        {suffix && <Text style={styles.affix}>{suffix}</Text>}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : helperText ? (
        <Text style={styles.helperText}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    height: 52, // Altura óptima táctil
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.body,
    color: theme.colors.textPrimary,
    height: '100%',
  },
  affix: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.xs,
  },
  helperText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  errorText: {
    fontSize: theme.typography.caption,
    color: theme.colors.error,
    marginTop: 4,
    fontWeight: '500',
  },
});
