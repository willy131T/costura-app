import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { theme } from '../../constants/theme';

export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'large',
  icon,
  loading = false,
  disabled = false,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) return '#CBD5E1';
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'profit':
        return theme.colors.profit;
      case 'outline':
        return 'transparent';
      case 'subtle':
        return theme.colors.surfaceSubtle;
      default:
        return theme.colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#64748B';
    if (variant === 'outline') return theme.colors.primary;
    if (variant === 'subtle') return theme.colors.textPrimary;
    return theme.colors.textLight;
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        {
          backgroundColor: getBackgroundColor(),
          borderWidth: variant === 'outline' ? 2 : 0,
          borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
        },
        size === 'small' ? styles.small : styles.large,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, size === 'small' && styles.textSmall]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  large: {
    height: 52, // Altura táctil cómoda recomendada para adultos
    paddingHorizontal: theme.spacing.lg,
  },
  small: {
    height: 38,
    paddingHorizontal: theme.spacing.md,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  text: {
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  textSmall: {
    fontSize: theme.typography.caption,
  },
});
