import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { clientService } from '../services/clientService';
import { exportService } from '../services/exportService';

export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Formulario de nueva clienta
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busto, setBusto] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [largoTalle, setLargoTalle] = useState('');
  const [largoFalda, setLargoFalda] = useState('');
  const [espalda, setEspalda] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUri, setPhotoUri] = useState(null);

  const loadClients = async () => {
    try {
      const list = await clientService.getClients();
      setClients(list);
    } catch (e) {
      console.log('Error cargando clientas:', e.message);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClients();
    setRefreshing(false);
  };

  const handlePickImage = async () => {
    Alert.alert(
      'Foto del Modelo o Prenda 👗',
      '¿De dónde deseas elegir la foto de muestra?',
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

  const handleSaveClient = async () => {
    if (!name.trim()) {
      Alert.alert('Falta nombre', 'Por favor escribe el nombre de tu clienta.');
      return;
    }

    try {
      await clientService.addClient({
        name: name.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        photoUri: photoUri || null,
        measurements: {
          busto: busto.trim() ? `${busto.trim()} cm` : '-',
          cintura: cintura.trim() ? `${cintura.trim()} cm` : '-',
          cadera: cadera.trim() ? `${cadera.trim()} cm` : '-',
          largoTalle: largoTalle.trim() ? `${largoTalle.trim()} cm` : '-',
          largoFalda: largoFalda.trim() ? `${largoFalda.trim()} cm` : '-',
          espalda: espalda.trim() ? `${espalda.trim()} cm` : '-',
        },
      });

      setName('');
      setPhone('');
      setBusto('');
      setCintura('');
      setCadera('');
      setLargoTalle('');
      setLargoFalda('');
      setEspalda('');
      setNotes('');
      setPhotoUri(null);
      setModalVisible(false);

      await loadClients();
      Alert.alert('¡Guardada!', 'Las medidas y la foto de la clienta quedaron registradas.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la clienta: ' + e.message);
    }
  };

  const handleDeleteClient = (client) => {
    Alert.alert(
      '¿Eliminar clienta?',
      `¿Seguro que deseas eliminar a ${client.name}? Se perderán sus medidas registradas.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await clientService.deleteClient(client.id);
            await loadClients();
          },
        },
      ]
    );
  };

  const handleOpenWhatsApp = (clientPhone, clientName) => {
    if (!clientPhone) {
      Alert.alert('Sin teléfono', 'Esta clienta no tiene un número registrado.');
      return;
    }
    const cleanPhone = clientPhone.replace(/[^0-9]/g, '');
    const msg = `¡Hola ${clientName}! Te escribo de CosturaApp sobre tu prenda 🪡`;
    const url = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('No se pudo abrir WhatsApp', 'Asegúrate de tener WhatsApp instalado en tu celular.');
    });
  };

  const filteredClients = clients.filter(c =>
    (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.notes || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || '').includes(search)
  );

  return (
    <View style={styles.container}>
      <Header
        title="Libreta de Medidas"
        subtitle="Medidas de clientas para confección exacta"
        rightElement={
          <View style={styles.badgeContainer}>
            <Ionicons name="body" size={16} color={theme.colors.profit} />
            <Text style={styles.badgeText}>{clients.length} Clientas</Text>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Input
          placeholder="🔍 Buscar por nombre o teléfono..."
          value={search}
          onChangeText={setSearch}
          style={{ marginBottom: theme.spacing.sm }}
        />

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: theme.spacing.md }}>
          <Button
            title="+ Anotar Clienta"
            variant="primary"
            icon={<Ionicons name="person-add" size={20} color="#FFF" />}
            onPress={() => setModalVisible(true)}
            style={{ flex: 1.2 }}
          />
          <Button
            title="📊 Excel"
            variant="outline"
            icon={<Ionicons name="document-text-outline" size={20} color="#15803D" />}
            onPress={() => exportService.exportClientsToExcel(clients)}
            style={{ flex: 0.8, borderColor: '#15803D', backgroundColor: '#F0FDF4' }}
            textStyle={{ color: '#15803D', fontWeight: '800' }}
          />
        </View>

        {filteredClients.length === 0 ? (
          <Card variant="flat" style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No hay clientas registradas</Text>
            <Text style={styles.emptySubtext}>
              {search ? 'Ninguna clienta coincide con tu búsqueda.' : 'Toca el botón "+ Anotar Nueva Clienta" para guardar sus medidas corporales.'}
            </Text>
          </Card>
        ) : (
          filteredClients.map((c) => (
            <Card key={c.id} style={styles.clientCard}>
              <View style={styles.clientCardHeader}>
                <View style={styles.clientAvatar}>
                  <Ionicons name="person" size={22} color={theme.colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.clientName}>{c.name}</Text>
                  {c.phone ? (
                    <Text style={styles.clientPhone}>📞 {c.phone}</Text>
                  ) : (
                    <Text style={styles.clientNoPhone}>Sin teléfono registrado</Text>
                  )}
                </View>

                <View style={styles.actionsRow}>
                  {c.phone ? (
                    <TouchableOpacity
                      style={styles.whatsAppBtn}
                      onPress={() => handleOpenWhatsApp(c.phone, c.name)}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteClient(c)}
                  >
                    <Ionicons name="trash-outline" size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.measurementsGrid}>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Busto</Text>
                  <Text style={styles.measureVal}>{c.measurements?.busto || '-'}</Text>
                </View>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Cintura</Text>
                  <Text style={styles.measureVal}>{c.measurements?.cintura || '-'}</Text>
                </View>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Cadera</Text>
                  <Text style={styles.measureVal}>{c.measurements?.cadera || '-'}</Text>
                </View>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Largo Talle</Text>
                  <Text style={styles.measureVal}>{c.measurements?.largoTalle || '-'}</Text>
                </View>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Largo Falda</Text>
                  <Text style={styles.measureVal}>{c.measurements?.largoFalda || '-'}</Text>
                </View>
                <View style={styles.measureItem}>
                  <Text style={styles.measureLabel}>Espalda</Text>
                  <Text style={styles.measureVal}>{c.measurements?.espalda || '-'}</Text>
                </View>
              </View>

              {c.photoUri ? (
                <View style={styles.clientPhotoRow}>
                  <TouchableOpacity onPress={() => setPreviewImage(c.photoUri)} activeOpacity={0.85} style={styles.clientPhotoWrap}>
                    <Image source={{ uri: c.photoUri }} style={styles.clientThumb} />
                    <View style={styles.expandBadge}>
                      <Ionicons name="expand" size={12} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.photoAttachedText}>👗 Foto de Modelo Adjunta</Text>
                    <Text style={styles.photoAttachedSub}>Toca la imagen para ver en grande</Text>
                  </View>
                </View>
              ) : null}

              {c.notes ? (
                <View style={styles.notesContainer}>
                  <Ionicons name="document-text-outline" size={14} color={theme.colors.textMuted} />
                  <Text style={styles.notesText}>{c.notes}</Text>
                </View>
              ) : null}
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal: Registrar Nueva Clienta y Medidas */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Anotar Clienta y Medidas 📏</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nombre Completo:"
                placeholder="Ej. Sra. Rosa María González"
                value={name}
                onChangeText={setName}
              />

              <Input
                label="Teléfono / WhatsApp:"
                placeholder="Ej. 55 1234 5678"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              {/* Selector de Foto del Modelo */}
              <Text style={styles.formSectionTitle}>Foto del Modelo o Boceto (Opcional):</Text>
              <TouchableOpacity
                style={styles.photoPickerBtn}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera" size={20} color={theme.colors.primaryDark} />
                <Text style={styles.photoPickerText}>
                  {photoUri ? '✓ Foto Seleccionada (Toca para cambiar)' : '+ Tomar o Elegir Foto del Modelo'}
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

              <Text style={styles.formSectionTitle}>Medidas en Centímetros (cm):</Text>
              <View style={styles.formRow}>
                <Input
                  label="Busto:"
                  placeholder="95"
                  keyboardType="numeric"
                  value={busto}
                  onChangeText={setBusto}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Cintura:"
                  placeholder="75"
                  keyboardType="numeric"
                  value={cintura}
                  onChangeText={setCintura}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Cadera:"
                  placeholder="100"
                  keyboardType="numeric"
                  value={cadera}
                  onChangeText={setCadera}
                  style={{ flex: 1 }}
                />
              </View>

              <View style={styles.formRow}>
                <Input
                  label="Largo Talle:"
                  placeholder="40"
                  keyboardType="numeric"
                  value={largoTalle}
                  onChangeText={setLargoTalle}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Largo Falda:"
                  placeholder="90"
                  keyboardType="numeric"
                  value={largoFalda}
                  onChangeText={setLargoFalda}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Espalda:"
                  placeholder="38"
                  keyboardType="numeric"
                  value={espalda}
                  onChangeText={setEspalda}
                  style={{ flex: 1 }}
                />
              </View>

              <Input
                label="Notas de la Prenda o Estilo:"
                placeholder="Ej. Prefiere mangas 3/4, dobladillo ancho, para boda en octubre"
                value={notes}
                onChangeText={setNotes}
              />

              <Button
                title="Guardar Clienta y Medidas"
                variant="profit"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                onPress={handleSaveClient}
                style={{ marginTop: theme.spacing.sm }}
              />

              <Button
                title="Cancelar"
                variant="subtle"
                onPress={() => setModalVisible(false)}
                style={{ marginTop: theme.spacing.xs, marginBottom: 30 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Foto en Pantalla Completa */}
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.profitLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  badgeText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.profit,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 90,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginTop: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.typography.body,
    fontWeight: '700',
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
  clientCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  clientAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientName: {
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  clientPhone: {
    fontSize: theme.typography.caption,
    color: theme.colors.primaryDark,
    fontWeight: '600',
    marginTop: 2,
  },
  clientNoPhone: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  whatsAppBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#25D366',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginTop: 4,
  },
  measureItem: {
    width: '30%',
    paddingVertical: 2,
  },
  measureLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  measureVal: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 1,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  notesText: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: theme.borderRadius.lg + 6,
    borderTopRightRadius: theme.borderRadius.lg + 6,
    padding: theme.spacing.lg,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  modalTitle: {
    fontSize: theme.typography.title - 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  formSectionTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 4,
    marginBottom: 8,
  },
  formRow: {
    flexDirection: 'row',
    gap: 8,
  },
  clientPhotoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 8,
    backgroundColor: '#F3E8FF',
    borderRadius: theme.borderRadius.sm,
  },
  clientPhotoWrap: {
    position: 'relative',
  },
  clientThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E9D5FF',
  },
  expandBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },
  photoAttachedText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B21A8',
  },
  photoAttachedSub: {
    fontSize: 11,
    color: '#7E22CE',
    marginTop: 2,
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
    marginBottom: 12,
  },
  photoPickerText: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  photoPreviewBox: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 14,
  },
  photoPreviewImg: {
    width: '100%',
    height: 160,
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
