import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ClientsScreen from '../screens/ClientsScreen';
import SuppliersScreen from '../screens/SuppliersScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();
  // Asegura que la barra de pestañas quede por encima de la barra de gestos/botones de Android/iOS
  const bottomInset = Math.max(insets.bottom, 10);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          height: 58 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Inicio') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Inventario') {
            iconName = focused ? 'cut' : 'cut-outline';
          } else if (route.name === 'Calculadora') {
            iconName = focused ? 'calculator' : 'calculator-outline';
          } else if (route.name === 'Medidas') {
            iconName = focused ? 'body' : 'body-outline';
          } else if (route.name === 'Proveedores') {
            iconName = focused ? 'storefront' : 'storefront-outline';
          }

          return <Ionicons name={iconName} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Inventario" component={InventoryScreen} />
      <Tab.Screen name="Calculadora" component={CalculatorScreen} />
      <Tab.Screen name="Medidas" component={ClientsScreen} />
      <Tab.Screen name="Proveedores" component={SuppliersScreen} />
    </Tab.Navigator>
  );
}
