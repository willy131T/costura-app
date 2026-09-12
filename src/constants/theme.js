// Configuración de tema visual adaptado para máxima legibilidad y confort visual
export const theme = {
  colors: {
    primary: '#7C3AED',         // Violeta artesanal / sofisticado
    primaryDark: '#5B21B6',
    primaryLight: '#EDE9FE',
    secondary: '#0D9488',       // Verde azulado (costura & precisión)
    secondaryLight: '#CCFBF1',
    background: '#F8FAFC',      // Fondo claro y descansado
    surface: '#FFFFFF',         // Blanco puro para tarjetas
    surfaceSubtle: '#F1F5F9',
    
    // Estados financieros (Clave para aprender a cobrar)
    profit: '#16A34A',          // Verde: Ganancia limpia
    profitLight: '#DCFCE7',
    materials: '#D97706',       // Ámbar: Costo de materiales
    materialsLight: '#FEF3C7',
    labor: '#2563EB',           // Azul: Tu mano de obra / tiempo
    laborLight: '#DBEAFE',
    overhead: '#9333EA',        // Púrpura: Desgaste de taller
    overheadLight: '#F3E8FF',

    // Textos de alto contraste (pensado para visión descansada)
    textPrimary: '#0F172A',     // Texto principal casi negro
    textSecondary: '#475569',   // Texto secundario legible
    textMuted: '#64748B',
    textLight: '#FFFFFF',

    // Bordes y separadores
    border: '#E2E8F0',
    borderFocus: '#7C3AED',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    warning: '#EA580C',
  },
  
  // Tipografía espaciosa y grande para fácil lectura
  typography: {
    hero: 28,
    title: 22,
    subtitle: 18,
    body: 16,
    caption: 14,
    small: 12,
  },

  // Tamaños táctiles amplios (mínimo 48-52px para botones cómodos)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    full: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    hover: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
      elevation: 4,
    }
  }
};

export default theme;
