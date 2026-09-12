import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { pricingService } from '../services/pricingService';
import { inventoryService } from '../services/inventoryService';
import { formatCurrency } from '../utils/currency';

export default function HomeScreen({ navigation }) {
  const [quotes, setQuotes] = useState([]);
  const [stats, setStats] = useState({ fabricsCount: 0, threadsCount: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [savedQuotes, fabrics, threads] = await Promise.all([
        pricingService.getSavedQuotes(),
        inventoryService.getFabrics(),
        inventoryService.getThreads(),
      ]);
      setQuotes(savedQuotes);
      setStats({
        fabricsCount: fabrics.length,
        threadsCount: threads.length,
      });
    } catch (e) {
      console.warn('Error cargando datos del home:', e);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title="CosturaApp"
        subtitle="Tu asistente de costura y finanzas"
        rightElement={
          <View style={styles.badgeContainer}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primary} />
            <Text style={styles.badgeText}>Taller Activo</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Banner de Saludo y Consejo Financiero */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.welcomeTitle}>¡Hola! 🪡</Text>
          <Text style={styles.welcomeSubtitle}>
            Recuerda que tu talento y tus horas de dedicación valen. Siempre cobra tus materiales, tus horas y tu margen de ganancia.
          </Text>
        </View>

        {/* Acceso Rápido al Cotizador (Core) */}
        <Card variant="highlight" style={styles.ctaCard}>
          <View style={styles.ctaRow}>
            <View style={styles.ctaIconBox}>
              <Ionicons name="calculator" size={32} color={theme.colors.primary} />
            </View>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Cotizador Inteligente</Text>
              <Text style={styles.ctaDesc}>Calcula cuánto cobrar por una prenda sin perder dinero</Text>
            </View>
          </View>
          <Button
            title="Calcular Nuevo Trabajo"
            variant="primary"
            icon={<Ionicons name="add-circle-outline" size={22} color="#FFF" />}
            onPress={() => navigation.navigate('Calculadora')}
            style={styles.ctaBtn}
          />
        </Card>

        {/* Resumen de Inventario y Proveedores */}
        <Text style={styles.sectionTitle}>Tu Taller al Día</Text>
        <View style={styles.statsRow}>
          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('Inventario')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.materialsLight }]}>
              <Ionicons name="cut" size={24} color={theme.colors.materials} />
            </View>
            <Text style={styles.statNumber}>{stats.fabricsCount}</Text>
            <Text style={styles.statLabel}>Telas en Stock</Text>
          </Card>

          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('Proveedores')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.laborLight }]}>
              <Ionicons name="storefront" size={24} color={theme.colors.labor} />
            </View>
            <Text style={styles.statNumber}>Precios</Text>
            <Text style={styles.statLabel}>Comparador</Text>
          </Card>
        </View>

        {/* Cotizaciones Recientes con desglose */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>Cotizaciones Recientes</Text>
          <Text style={styles.recentCountText}>{quotes.length} guardadas</Text>
        </View>

        {quotes.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>Aún no tienes cotizaciones guardadas.</Text>
            <Text style={styles.emptySubtext}>Haz clic en "Calcular Nuevo Trabajo" para empezar a cobrar bien.</Text>
          </Card>
        ) : (
          quotes.map((q) => (
            <Card key={q.id} style={styles.quoteCard}>
              <View style={styles.quoteHeader}>
                <View style={styles.quoteTitleBlock}>
                  <Text style={styles.quoteProjectName}>{q.projectName}</Text>
                  {q.clientName ? <Text style={styles.quoteClient}>Cliente: {q.clientName}</Text> : null}
                  <Text style={styles.quoteDate}>{q.date}</Text>
                </View>
                <View style={styles.quotePriceBlock}>
                  <Text style={styles.quoteTotalLabel}>Cobro Total</Text>
                  <Text style={styles.quoteTotal}>{formatCurrency(q.totalQuote)}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.breakdownRow}>
                <View style={styles.breakdownChip}>
                  <Text style={styles.breakdownChipLabel}>Materiales:</Text>
                  <Text style={styles.breakdownChipValue}>{formatCurrency(q.materialsCost)}</Text>
                </View>
                <View style={styles.breakdownChip}>
                  <Text style={styles.breakdownChipLabel}>Mano de Obra:</Text>
                  <Text style={styles.breakdownChipValue}>{formatCurrency(q.laborCost)}</Text>
                </View>
                <View style={[styles.breakdownChip, { backgroundColor: theme.colors.profitLight }]}>
                  <Text style={[styles.breakdownChipLabel, { color: theme.colors.profit }]}>Ganancia Limpia:</Text>
                  <Text style={[styles.breakdownChipValue, { color: theme.colors.profit, fontWeight: '700' }]}>
                    {formatCurrency(q.profitAmount)}
                  </Text>
                </View>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
    gap: 4,
  },
  badgeText: {
    fontSize: theme.typography.small,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  welcomeBanner: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md + 4,
    marginBottom: theme.spacing.md,
  },
  welcomeTitle: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  welcomeSubtitle: {
    fontSize: theme.typography.body - 1,
    color: '#E0E7FF',
    lineHeight: 22,
  },
  ctaCard: {
    marginBottom: theme.spacing.lg,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ctaIconBox: {
    width: 54,
    height: 54,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  ctaTextContainer: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  ctaDesc: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  ctaBtn: {
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  statIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statNumber: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  recentHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  recentCountText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyText: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: theme.spacing.md,
  },
  quoteCard: {
    padding: theme.spacing.md,
  },
  quoteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  quoteTitleBlock: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  quoteProjectName: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  quoteClient: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  quoteDate: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  quotePriceBlock: {
    alignItems: 'flex-end',
  },
  quoteTotalLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
  },
  quoteTotal: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  breakdownChip: {
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    gap: 4,
  },
  breakdownChipLabel: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
  },
  breakdownChipValue: {
    fontSize: theme.typography.small,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
