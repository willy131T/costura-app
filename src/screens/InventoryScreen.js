import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { inventoryService } from '../services/inventoryService';
import { formatCurrency } from '../utils/currency';

export default function InventoryScreen() {
  const [activeTab, setActiveTab] = useState('telas'); // 'telas' | 'hilos'
  const [fabrics, setFabrics] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Campos del formulario modal
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [color, setColor] = useState('');
  const [supplier, setSupplier] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [formError, setFormError] = useState('');

  const loadInventory = async () => {
    setLoading(true);
    try {
      const [fabricsList, threadsList] = await Promise.all([
        inventoryService.getFabrics(),
        inventoryService.getThreads(),
      ]);
      setFabrics(fabricsList);
      setThreads(threadsList);
    } catch (e) {
      console.warn('Error cargando inventario:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const handlePickImage = async () => {
    Alert.alert(
      'Foto de la Tela 🧵',
      '¿De dónde deseas tomar la foto de muestra de la tela?',
      [
        {
          text: 'Tomar Foto 📷',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso necesario', 'Se necesita permiso para usar la cámara.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              setPhotoUri(res.assets[0].uri);
            }
          },
        },
        {
          text: 'De la Galería 🖼️',
          onPress: async () => {
            const res = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.7,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              setPhotoUri(res.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleSaveItem = async () => {
    if (!name.trim()) {
      setFormError('Por favor ingresa el nombre de la tela o insumo.');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      setFormError('Ingresa una cantidad o metraje válido.');
      return;
    }
    if (!unitPrice || Number(unitPrice) <= 0) {
      setFormError('Ingresa el precio de compra unitario.');
      return;
    }

    setFormError('');

    try {
      if (activeTab === 'telas') {
        await inventoryService.addFabric({
          name: name.trim(),
          meters: Number(quantity),
          pricePerMeter: Number(unitPrice),
          color: color.trim() || 'No especificado',
          supplier: supplier.trim() || 'Particular',
          photoUri: photoUri || null,
        });
      } else {
        await inventoryService.addThread({
          name: name.trim(),
          category: 'merceria',
          quantity: Number(quantity),
          unitPrice: Number(unitPrice),
          color: color.trim() || 'Estándar',
        });
      }

      // Limpiar formulario y cerrar modal
      setName('');
      setQuantity('');
      setUnitPrice('');
      setColor('');
      setSupplier('');
      setPhotoUri(null);
      setModalVisible(false);
      await loadInventory();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el material: ' + e.message);
    }
  };

  const handleDeleteFabric = (item) => {
    Alert.alert(
      'Eliminar tela',
      `¿Deseas quitar "${item.name}" del inventario?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await inventoryService.deleteFabric(item.id);
            loadInventory();
          },
        },
      ]
    );
  };

  const handleDeleteThread = (item) => {
    Alert.alert(
      'Eliminar insumo',
      `¿Deseas quitar "${item.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await inventoryService.deleteThread(item.id);
            loadInventory();
          },
        },
      ]
    );
  };

  const currentList = activeTab === 'telas' ? fabrics : threads;

  return (
    <View style={styles.container}>
      <Header
        title="Inventario de Taller"
        subtitle="Controla tus telas, hilos y mercería"
        rightElement={
          <Button
            title="+ Agregar"
            size="small"
            variant="primary"
            onPress={() => setModalVisible(true)}
          />
        }
      />

      {/* Selector de pestañas accesible */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'telas' && styles.tabButtonActive]}
          onPress={() => setActiveTab('telas')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cut-outline"
            size={20}
            color={activeTab === 'telas' ? theme.colors.primaryDark : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'telas' && styles.tabTextActive]}>
            Mis Telas ({fabrics.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'hilos' && styles.tabButtonActive]}
          onPress={() => setActiveTab('hilos')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cube-outline"
            size={20}
            color={activeTab === 'hilos' ? theme.colors.primaryDark : theme.colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'hilos' && styles.tabTextActive]}>
            Hilos y Mercería ({threads.length})
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentList}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={loading}
        onRefresh={loadInventory}
        ListEmptyComponent={
          <Card variant="flat" style={styles.emptyCard}>
            <Ionicons name="file-tray-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>
              No tienes {activeTab === 'telas' ? 'telas' : 'hilos'} registrados aún.
            </Text>
            <Button
              title={`Registrar primera ${activeTab === 'telas' ? 'tela' : 'pieza'}`}
              variant="outline"
              size="small"
              style={{ marginTop: theme.spacing.md }}
              onPress={() => setModalVisible(true)}
            />
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={styles.itemCard}>
            <View style={styles.cardHeader}>
              {item.photoUri ? (
                <TouchableOpacity onPress={() => setPreviewImage(item.photoUri)} activeOpacity={0.85} style={styles.fabricThumbWrap}>
                  <Image source={{ uri: item.photoUri }} style={styles.fabricThumb} />
                  <View style={styles.thumbZoomIcon}>
                    <Ionicons name="expand" size={10} color="#FFF" />
                  </View>
                </TouchableOpacity>
              ) : null}
              <View style={styles.cardTitleBlock}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemColor}>Color: {item.color || 'Estándar'}</Text>
                {item.supplier ? <Text style={styles.itemSupplier}>Tienda: {item.supplier}</Text> : null}
              </View>
              <TouchableOpacity
                onPress={() => (activeTab === 'telas' ? handleDeleteFabric(item) : handleDeleteThread(item))}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.deleteBtn}
              >
                <Ionicons name="trash-outline" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.cardFooter}>
              {activeTab === 'telas' ? (
                item.meters < 2.0 ? (
                  <View style={[styles.stockBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Ionicons name="warning" size={16} color="#DC2626" />
                    <Text style={[styles.stockText, { color: '#B91C1C' }]}>
                      ⚠️ Poco stock: {item.meters} m
                    </Text>
                  </View>
                ) : (
                  <View style={styles.stockBadge}>
                    <Ionicons name="layers-outline" size={16} color={theme.colors.primaryDark} />
                    <Text style={styles.stockText}>{item.meters} metros</Text>
                  </View>
                )
              ) : (
                item.quantity < 2 ? (
                  <View style={[styles.stockBadge, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="alert-circle" size={16} color="#D97706" />
                    <Text style={[styles.stockText, { color: '#B45309' }]}>
                      ⚠️ Casi agotado: {item.quantity} pz
                    </Text>
                  </View>
                ) : (
                  <View style={styles.stockBadge}>
                    <Ionicons name="layers-outline" size={16} color={theme.colors.primaryDark} />
                    <Text style={styles.stockText}>{item.quantity} piezas</Text>
                  </View>
                )
              )}

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Costo compra:</Text>
                <Text style={styles.priceValue}>
                  {formatCurrency(activeTab === 'telas' ? item.pricePerMeter : item.unitPrice)}
                  <Text style={styles.priceUnit}>{activeTab === 'telas' ? '/m' : '/pz'}</Text>
                </Text>
              </View>
            </View>
          </Card>
        )}
      />

      {/* Modal accesible para dar de alta nuevo insumo */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeTab === 'telas' ? 'Nueva Tela' : 'Nuevo Insumo o Hilo'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

              <Input
                label="Nombre de la tela o material:"
                placeholder={activeTab === 'telas' ? 'Ej. Popelina lisa, Lino italiano' : 'Ej. Cono de hilo 5000m, Cierre 30cm'}
                value={name}
                onChangeText={setName}
              />

              <View style={styles.formRow}>
                <Input
                  label={activeTab === 'telas' ? 'Metros:' : 'Cantidad:'}
                  placeholder="Ej. 3.5"
                  keyboardType="numeric"
                  value={quantity}
                  onChangeText={setQuantity}
                  style={{ flex: 1, marginRight: theme.spacing.sm }}
                />

                <Input
                  label={activeTab === 'telas' ? 'Precio por metro ($):' : 'Precio unitario ($):'}
                  placeholder="Ej. 85"
                  keyboardType="numeric"
                  value={unitPrice}
                  onChangeText={setUnitPrice}
                  style={{ flex: 1 }}
                />
              </View>

              <Input
                label="Color o Estampado:"
                placeholder="Ej. Rojo quemado, Blanco hueso, Flores"
                value={color}
                onChangeText={setColor}
              />

              {activeTab === 'telas' && (
                <Input
                  label="¿Dónde la compraste? (Proveedor):"
                  placeholder="Ej. Telas Parisina, Modatelas, El Brillante"
                  value={supplier}
                  onChangeText={setSupplier}
                />
              )}

              {activeTab === 'telas' && (
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.formSectionTitle}>Foto de la Tela (Muestra o Rollo):</Text>
                  <TouchableOpacity
                    style={styles.photoPickerBtn}
                    onPress={handlePickImage}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="camera" size={20} color={theme.colors.primaryDark} />
                    <Text style={styles.photoPickerText}>
                      {photoUri ? '✓ Foto de Tela Lista (Toca para cambiar)' : '+ Tomar Foto del Rollo o Retazo'}
                    </Text>
                  </TouchableOpacity>

                  {photoUri ? (
                    <View style={styles.photoPreviewBox}>
                      <Image source={{ uri: photoUri }} style={styles.photoPreviewImg} />
                      <TouchableOpacity
                        style={styles.removePhotoBtn}
                        onPress={() => setPhotoUri(null)}
                      >
                        <Ionicons name="close-circle" size={24} color="#DC2626" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              )}

              <View style={styles.modalActions}>
                <Button
                  title="Guardar en Inventario"
                  variant="profit"
                  onPress={handleSaveItem}
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

      {/* Modal de Foto de Tela en Pantalla Completa */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.fullImageOverlay}>
          <TouchableOpacity style={styles.closeFullImageBtn} onPress={() => setPreviewImage(null)}>
            <Ionicons name="close-circle" size={38} color="#FFFFFF" />
          </TouchableOpacity>
          {previewImage ? (
            <Image source={{ uri: previewImage }} style={styles.fullImage} resizeMode="contain" />
          ) : null}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.surfaceSubtle,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  tabText: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: 90,
  },
  itemCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm + 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitleBlock: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  itemName: {
    fontSize: theme.typography.body + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  itemColor: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  itemSupplier: {
    fontSize: theme.typography.caption,
    color: theme.colors.primaryDark,
    fontWeight: '500',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  stockText: {
    fontSize: theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
  },
  priceValue: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  priceUnit: {
    fontSize: theme.typography.small,
    color: theme.colors.textSecondary,
    fontWeight: 'normal',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
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
  formRow: {
    flexDirection: 'row',
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
  fabricThumbWrap: {
    position: 'relative',
    marginRight: 10,
  },
  fabricThumb: {
    width: 54,
    height: 54,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
  },
  thumbZoomIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  formSectionTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  photoPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    marginBottom: 8,
  },
  photoPickerText: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  photoPreviewBox: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 10,
  },
  photoPreviewImg: {
    width: '100%',
    height: 140,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F3F4F6',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  fullImageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  closeFullImageBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
