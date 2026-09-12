import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { supplierService } from '../services/supplierService';
import { formatCurrency } from '../utils/currency';

export default function SuppliersScreen() {
  const [suppliers, setSuppliers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [comparisonResults, setComparisonResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Formulario nuevo proveedor
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const data = await supplierService.getSuppliers();
      setSuppliers(data);
    } catch (e) {
      console.warn('Error cargando proveedores:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Comparador en tiempo real
  useEffect(() => {
    const runComparison = async () => {
      if (searchQuery.trim().length > 1) {
        const results = await supplierService.compareMaterialPrices(searchQuery);
        setComparisonResults(results);
      } else {
        setComparisonResults([]);
      }
    };
    runComparison();
  }, [searchQuery]);

  const handleCall = (phoneNumber) => {
    if (!phoneNumber) return;
    const cleaned = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleaned}`).catch(() => {
      Alert.alert('Teléfono', `Número: ${phoneNumber}`);
    });
  };

  const handleSaveSupplier = async () => {
    if (!name.trim()) {
      setFormError('Ingresa el nombre de la tienda o proveedor.');
      return;
    }

    try {
      await supplierService.addSupplier({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        notes: notes.trim(),
        catalog: [],
      });
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      setModalVisible(false);
      loadSuppliers();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el proveedor: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Proveedores y Precios"
        subtitle="Encuentra dónde te rinde más tu dinero"
        rightElement={
          <Button
            title="+ Tienda"
            size="small"
            variant="primary"
            onPress={() => setModalVisible(true)}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Herramienta de Comparación Inteligente */}
        <Card variant="highlight" style={styles.compareCard}>
          <View style={styles.compareHeader}>
            <Ionicons name="pricetags" size={24} color={theme.colors.primaryDark} />
            <Text style={styles.compareTitle}>Comparador de Telas e Insumos</Text>
          </View>
          <Text style={styles.compareDesc}>
            Escribe qué tela buscas (ej. "Lino", "Popelina", "Hilo") para saber quién la vende más barata:
          </Text>

          <Input
            placeholder="Buscar material a comparar..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            prefix={<Ionicons name="search" size={20} color={theme.colors.textMuted} />}
            style={{ marginBottom: 4 }}
          />

          {searchQuery.trim().length > 1 && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>
                Precios encontrados para "{searchQuery}":
              </Text>
              {comparisonResults.length === 0 ? (
                <Text style={styles.noResultsText}>
                  No tenemos registrado ese material en los catálogos aún.
                </Text>
              ) : (
                comparisonResults.map((item, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.resultRow,
                      idx === 0 && styles.bestDealRow, // El más barato resaltado en verde
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {idx === 0 && (
                          <View style={styles.bestDealBadge}>
                            <Text style={styles.bestDealBadgeText}>🥇 MEJOR PRECIO</Text>
                          </View>
                        )}
                        <Text style={styles.resultMaterial}>{item.material}</Text>
                      </View>
                      <Text style={styles.resultSupplier}>Tienda: {item.supplierName}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.resultPrice, idx === 0 && styles.bestPriceText]}>
                        {formatCurrency(item.price)}
                      </Text>
                      <Text style={styles.resultUnit}>por {item.unit}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </Card>

        {/* Directorio de Proveedores */}
        <Text style={styles.sectionTitle}>Tus Tiendas Registradas</Text>

        {suppliers.map((sup) => (
          <Card key={sup.id} style={styles.supplierCard}>
            <View style={styles.supplierHeader}>
              <View style={styles.supplierIconBox}>
                <Ionicons name="storefront" size={24} color={theme.colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.supplierName}>{sup.name}</Text>
                {sup.address ? (
                  <Text style={styles.supplierAddress}>
                    <Ionicons name="location-outline" size={14} color={theme.colors.textMuted} /> {sup.address}
                  </Text>
                ) : null}
              </View>
            </View>

            {sup.notes ? (
              <View style={styles.notesBox}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.secondary} />
                <Text style={styles.notesText}>{sup.notes}</Text>
              </View>
            ) : null}

            {sup.phone ? (
              <View style={styles.supplierFooter}>
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => handleCall(sup.phone)}
                >
                  <Ionicons name="call" size={18} color="#FFF" />
                  <Text style={styles.callBtnText}>Llamar: {sup.phone}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </Card>
        ))}
      </ScrollView>

      {/* Modal para nuevo proveedor */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nueva Tienda o Proveedor</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

              <Input
                label="Nombre del Proveedor o Tienda:"
                placeholder="Ej. Modatelas Centro, Don Beto Hilos"
                value={name}
                onChangeText={setName}
              />

              <Input
                label="Teléfono o WhatsApp:"
                placeholder="Ej. 55 1234 5678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Input
                label="Dirección o Ubicación:"
                placeholder="Ej. Calle Pino Suárez #40, local 3"
                value={address}
                onChangeText={setAddress}
              />

              <Input
                label="Notas o consejos (descuentos, días que llega tela):"
                placeholder="Ej. Descuento con mayoreo, llega mercancía los martes"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80 }}
              />

              <View style={styles.modalActions}>
                <Button
                  title="Guardar Tienda"
                  variant="profit"
                  onPress={handleSaveSupplier}
                  icon={<Ionicons name="checkmark-circle-outline" size={22} color="#FFF" />}
                />
                <Button
                  title="Cancelar"
                  variant="subtle"
                  onPress={() => setModalVisible(false)}
                  style={{ marginTop: theme.spacing.sm }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 40,
  },
  compareCard: {
    marginBottom: theme.spacing.lg,
  },
  compareHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  compareTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  compareDesc: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  resultsContainer: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  resultsTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  noResultsText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bestDealRow: {
    borderColor: theme.colors.profit,
    backgroundColor: '#F0FDF4',
  },
  bestDealBadge: {
    backgroundColor: theme.colors.profit,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bestDealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
  },
  resultMaterial: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  resultSupplier: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  resultPrice: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  bestPriceText: {
    color: theme.colors.profit,
    fontSize: theme.typography.subtitle,
  },
  resultUnit: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  supplierCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm + 4,
  },
  supplierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supplierIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierName: {
    fontSize: theme.typography.body + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  supplierAddress: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 8,
    borderRadius: theme.borderRadius.sm,
    marginTop: 10,
    gap: 6,
  },
  notesText: {
    flex: 1,
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  supplierFooter: {
    marginTop: 12,
    flexDirection: 'row',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    gap: 6,
  },
  callBtnText: {
    color: '#FFF',
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg + 4,
    borderTopRightRadius: theme.borderRadius.lg + 4,
    padding: theme.spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  formErrorText: {
    color: theme.colors.error,
    fontSize: theme.typography.caption,
    marginBottom: theme.spacing.sm,
    fontWeight: '600',
  },
  modalActions: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
});
