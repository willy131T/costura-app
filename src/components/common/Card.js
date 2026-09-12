import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../../constants/theme';

export const Card = ({ children, style, onPress, variant = 'default' }) => {
  const Container = onPress ? TouchableOpacity : View;

  return (
    <Container
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        variant === 'highlight' && styles.highlight,
        variant === 'flat' && styles.flat,
        style,
      ]}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  highlight: {
    borderColor: theme.colors.primaryLight,
    backgroundColor: '#FAF5FF',
  },
  flat: {
    shadowOpacity: 0,
    elevation: 0,
    backgroundColor: theme.colors.surfaceSubtle,
  },
});
