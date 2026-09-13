import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { pricingService } from '../services/pricingService';
import { inventoryService } from '../services/inventoryService';
import { clientService } from '../services/clientService';
import { formatCurrency } from '../utils/currency';
import { pdfReceiptService } from '../services/pdfReceiptService';

export default function HomeScreen({ navigation }) {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({ fabricsCount: 0, threadsCount: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // Modal de Libreta de Medidas
  const [clientModalVisible, setClientModalVisible] = useState(false);
  const [newClientModal, setNewClientModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [busto, setBusto] = useState('');
  const [cintura, setCintura] = useState('');
  const [cadera, setCadera] = useState('');
  const [largoTalle, setLargoTalle] = useState('');
  const [largoFalda, setLargoFalda] = useState('');
  const [clientNotes, setClientNotes] = useState('');

  const loadData = async () => {
    try {
      const [savedQuotes, fabrics, threads, clientList] = await Promise.all([
        pricingService.getSavedQuotes(),
        inventoryService.getFabrics(),
        inventoryService.getThreads(),
        clientService.getClients(),
      ]);
      setQuotes(savedQuotes);
      setClients(clientList);
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

  const handleShareQuote = (q) => {
    const nameStr = q.clientName ? ` ${q.clientName}` : '';
    const text = `🧵 *Cotización de Confección y Costura*\n\n` +
      `Hola${nameStr}, con gusto te comparto el presupuesto para *${q.projectName}*:\n\n` +
      `💰 *Total a pagar:* ${formatCurrency(q.totalQuote)} MXN\n` +
      `🤝 *Anticipo requerido (50%):* ${formatCurrency(q.suggestedDeposit)} MXN\n\n` +
      `✨ *Incluye:* Materiales de calidad, corte y confección artesanal a la medida, y acabados finos de taller.\n\n` +
      `¡Quedo a tus órdenes para apartar tu fecha y comenzar con tu prenda! 🪡`;

    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(whatsappUrl);
        } else {
          Share.share({ message: text });
        }
      })
      .catch(() => {
        Share.share({ message: text });
      });
  };

  const handleGeneratePDF = async (q) => {
    await pdfReceiptService.generateAndShareReceipt(q);
  };

  const handleSendFittingReminder = (q) => {
    const nameStr = q.clientName || 'estimada clienta';
    const dateStr = q.fittingDate || 'esta semana';
    const text = `¡Hola ${nameStr}! Te saludo de CosturaApp con mucho gusto 🪡\n\n` +
      `Te recuerdo que tu cita de prueba de ajuste para tu *${q.projectName}* está programada para el *${dateStr}* en el taller.\n\n` +
      `📌 *Tip importante:* Por favor recuerda traer los zapatos y ropa interior que usarás con tu prenda para verificar el largo exacto.\n\n` +
      `¡Quedo a tus órdenes para confirmar la hora! ✨`;

    const cleanPhone = (q.clientPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Share.share({ message: text });
    });
  };

  const handleNotifyReady = (q) => {
    const nameStr = q.clientName ? ` ${q.clientName}` : '';
    const desc = q.projectName || 'tu prenda';
    const text = `🪡 *¡Tu prenda ya quedó lista!* 🎉\n\n` +
      `¡Hola${nameStr}! Con mucho gusto te aviso del taller que *${desc}* ya está terminado, revisado y listo para entregar.\n\n` +
      `Ya puedes pasar a recogerlo en el horario que gustes. ¡Muchas gracias por tu preferencia y confianza! 🧵✨`;

    const cleanPhone = (q.clientPhone || '').replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
      : `whatsapp://send?text=${encodeURIComponent(text)}`;

    Linking.openURL(url).catch(() => {
      Share.share({ message: text });
    });
  };

  const handleChangeStatus = async (q) => {
    const nextStatus = q.status === 'en_proceso' ? 'prueba_lista' : q.status === 'prueba_lista' ? 'entregado' : 'en_proceso';
    const label = nextStatus === 'prueba_lista' ? 'Prueba Lista 🔵' : nextStatus === 'entregado' ? 'Entregado y Cobrado 🟢' : 'En Confección 🟡';
    
    await pricingService.updateQuoteStatus(q.id, nextStatus);
    await loadData();
    Alert.alert('Estado Actualizado', `"${q.projectName}" cambió a: ${label}`);
  };

  const getDeliveryUrgency = (deliveryDateStr) => {
    if (!deliveryDateStr) return { color: '#16A34A', bg: '#DCFCE7', text: '🟢 Sin fecha' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(deliveryDateStr);
    target.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((target - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { color: '#DC2626', bg: '#FEE2E2', text: `🔴 Vencido (${Math.abs(diffDays)}d)` };
    if (diffDays <= 2) return { color: '#DC2626', bg: '#FEE2E2', text: `🔴 Urgente (${diffDays === 0 ? 'Hoy' : diffDays === 1 ? 'Mañana' : '2 días'})` };
    if (diffDays <= 7) return { color: '#D97706', bg: '#FEF3C7', text: `🟡 Esta semana (${diffDays}d)` };
    return { color: '#16A34A', bg: '#DCFCE7', text: `🟢 En tiempo (${diffDays}d)` };
  };

  const handleSaveClient = async () => {
    if (!clientName.trim()) {
      Alert.alert('Falta nombre', 'Por favor ingresa el nombre de tu clienta.');
      return;
    }

    try {
      await clientService.addClient({
        name: clientName.trim(),
        phone: clientPhone.trim(),
        notes: clientNotes.trim(),
        measurements: {
          busto: busto.trim() ? `${busto.trim()} cm` : '-',
          cintura: cintura.trim() ? `${cintura.trim()} cm` : '-',
          cadera: cadera.trim() ? `${cadera.trim()} cm` : '-',
          largoTalle: largoTalle.trim() ? `${largoTalle.trim()} cm` : '-',
          largoFalda: largoFalda.trim() ? `${largoFalda.trim()} cm` : '-',
        },
      });

      setClientName('');
      setClientPhone('');
      setBusto('');
      setCintura('');
      setCadera('');
      setLargoTalle('');
      setLargoFalda('');
      setClientNotes('');
      setNewClientModal(false);
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la clienta: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="CosturaApp"
        subtitle="Tu asistente de costura y finanzas"
        rightElement={
          <View style={styles.badgeContainer}>
            <Ionicons name="sparkles" size={16} color={theme.colors.primaryDark} />
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
          <View style={styles.welcomeHeader}>
            <Text style={styles.welcomeTitle}>¡Hola! 🪡</Text>
            <View style={styles.needleIconBox}>
              <Ionicons name="color-wand-outline" size={20} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.welcomeSubtitle}>
            Recuerda que tu talento y tus horas de dedicación valen. Siempre cobra tus materiales, tus horas de trabajo y tu margen de ganancia.
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

        {/* Resumen de Inventario, Proveedores y Medidas */}
        <Text style={styles.sectionTitle}>Tu Taller al Día</Text>
        <View style={styles.statsRow}>
          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('Inventario')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.materialsLight }]}>
              <Ionicons name="cut" size={22} color={theme.colors.materials} />
            </View>
            <Text style={styles.statNumber}>{stats.fabricsCount}</Text>
            <Text style={styles.statLabel}>Telas</Text>
          </Card>

          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('Proveedores')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.laborLight }]}>
              <Ionicons name="storefront" size={22} color={theme.colors.labor} />
            </View>
            <Text style={styles.statNumber}>Precios</Text>
            <Text style={styles.statLabel}>Tiendas</Text>
          </Card>

          <Card
            style={styles.statCard}
            onPress={() => navigation.navigate('Medidas')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.profitLight }]}>
              <Ionicons name="body-outline" size={22} color={theme.colors.profit} />
            </View>
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>Medidas</Text>
          </Card>
        </View>

        {/* Semáforo de Entregas y Pruebas Activas */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>Semáforo de Entregas y Pruebas 📅</Text>
          <Text style={styles.recentCountText}>
            {quotes.filter(q => q.status !== 'entregado').length} activas
          </Text>
        </View>

        {quotes.filter(q => q.status !== 'entregado').length === 0 ? (
          <Card variant="flat" style={[styles.emptyCard, { paddingVertical: theme.spacing.md, marginBottom: theme.spacing.md }]}>
            <Ionicons name="checkmark-done-circle-outline" size={36} color={theme.colors.profit} />
            <Text style={[styles.emptyText, { marginTop: 4 }]}>¡Al día con las entregas!</Text>
            <Text style={styles.emptySubtext}>No tienes prendas pendientes de confección o prueba.</Text>
          </Card>
        ) : (
          quotes
            .filter(q => q.status !== 'entregado')
            .map((q) => {
              const urgency = getDeliveryUrgency(q.deliveryDate);
              const deposit = q.depositPaid || q.suggestedDeposit || (q.totalQuote * 0.5);
              const balance = Math.max(0, q.totalQuote - deposit);

              return (
                <Card key={'active_' + q.id} style={styles.activeJobCard}>
                  <View style={styles.activeJobHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.activeJobTitle}>{q.projectName}</Text>
                        {q.type === 'arreglo' && (
                          <View style={{ backgroundColor: '#EDE9FE', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#6D28D9' }}>✂️ Arreglo</Text>
                          </View>
                        )}
                        {q.urgencyLevel && q.urgencyLevel !== 'normal' && (
                          <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                            <Text style={{ fontSize: 10, fontWeight: '800', color: '#DC2626' }}>⚡ {q.urgencyLevel === 'express' ? 'Express' : 'Urgente'}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.activeJobClient}>Clienta: {q.clientName || 'Sin asignar'}</Text>
                    </View>
                    <View style={[styles.urgencyBadge, { backgroundColor: urgency.bg }]}>
                      <Text style={[styles.urgencyText, { color: urgency.color }]}>{urgency.text}</Text>
                    </View>
                  </View>

                  <View style={styles.datesGrid}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateColLabel}>📍 Cita de Prueba:</Text>
                      <Text style={styles.dateColVal}>{q.fittingDate || 'Sin programar'}</Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateColLabel}>🎁 Entrega Final:</Text>
                      <Text style={styles.dateColVal}>{q.deliveryDate || 'Por acordar'}</Text>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateColLabel}>💰 Saldo por Cobrar:</Text>
                      <Text style={[styles.dateColVal, { color: '#DC2626' }]}>{formatCurrency(balance)}</Text>
                    </View>
                  </View>

                  {/* Fila de Botones de Acción de Taller */}
                  <View style={styles.activeJobActionsRow}>
                    <TouchableOpacity
                      style={styles.statusPillBtn}
                      onPress={() => handleChangeStatus(q)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={q.status === 'prueba_lista' ? 'body' : 'cut'}
                        size={14}
                        color={q.status === 'prueba_lista' ? '#1E40AF' : '#854D0E'}
                      />
                      <Text style={[
                        styles.statusPillText,
                        { color: q.status === 'prueba_lista' ? '#1E40AF' : '#854D0E' }
                      ]}>
                        {q.status === 'prueba_lista' ? 'Prueba Lista' : q.type === 'arreglo' ? 'En Arreglo' : 'En Confección'}
                      </Text>
                    </TouchableOpacity>

                    {q.fittingDate ? (
                      <TouchableOpacity
                        style={styles.fittingReminderBtn}
                        onPress={() => handleSendFittingReminder(q)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                        <Text style={styles.fittingReminderText}>Avisar Prueba</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.fittingReminderBtn, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}
                        onPress={() => handleNotifyReady(q)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="logo-whatsapp" size={14} color="#15803D" />
                        <Text style={[styles.fittingReminderText, { color: '#15803D' }]}>Avisar Listo</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.pdfBtn}
                      onPress={() => handleGeneratePDF(q)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="document-text" size={14} color="#6D28D9" />
                      <Text style={styles.pdfBtnText}>Recibo PDF</Text>
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })
        )}

        {/* Cotizaciones Recientes con desglose */}
        <View style={styles.recentHeaderRow}>
          <Text style={styles.sectionTitle}>Historial de Cotizaciones</Text>
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

              {/* Botones de acción: WhatsApp y PDF */}
              <View style={styles.quoteActionButtonsRow}>
                <TouchableOpacity
                  style={[styles.quoteShareBtn, { flex: 1 }]}
                  onPress={() => handleShareQuote(q)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
                  <Text style={styles.quoteShareText}>WhatsApp</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quotePdfBtn, { flex: 1 }]}
                  onPress={() => handleGeneratePDF(q)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="document-text" size={16} color="#6D28D9" />
                  <Text style={styles.quotePdfText}>Recibo PDF</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal: Libreta de Medidas de Clientas */}
      <Modal
        visible={clientModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setClientModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Libreta de Medidas 📏</Text>
              <TouchableOpacity onPress={() => setClientModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Button
                title="+ Nueva Clienta y Medidas"
                variant="primary"
                icon={<Ionicons name="person-add" size={20} color="#FFF" />}
                onPress={() => setNewClientModal(true)}
                style={{ marginBottom: theme.spacing.md }}
              />

              {clients.map((c) => (
                <Card key={c.id} style={styles.clientCard}>
                  <View style={styles.clientCardHeader}>
                    <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.clientCardName}>{c.name}</Text>
                      {c.phone ? <Text style={styles.clientCardPhone}>Tel: {c.phone}</Text> : null}
                    </View>
                  </View>

                  <View style={styles.measurementsGrid}>
                    <View style={styles.measureItem}>
                      <Text style={styles.measureLabel}>Busto:</Text>
                      <Text style={styles.measureVal}>{c.measurements?.busto || '-'}</Text>
                    </View>
                    <View style={styles.measureItem}>
                      <Text style={styles.measureLabel}>Cintura:</Text>
                      <Text style={styles.measureVal}>{c.measurements?.cintura || '-'}</Text>
                    </View>
                    <View style={styles.measureItem}>
                      <Text style={styles.measureLabel}>Cadera:</Text>
                      <Text style={styles.measureVal}>{c.measurements?.cadera || '-'}</Text>
                    </View>
                    <View style={styles.measureItem}>
                      <Text style={styles.measureLabel}>Talle:</Text>
                      <Text style={styles.measureVal}>{c.measurements?.largoTalle || '-'}</Text>
                    </View>
                    <View style={styles.measureItem}>
                      <Text style={styles.measureLabel}>Falda:</Text>
                      <Text style={styles.measureVal}>{c.measurements?.largoFalda || '-'}</Text>
                    </View>
                  </View>

                  {c.notes ? <Text style={styles.clientCardNotes}>Nota: {c.notes}</Text> : null}
                </Card>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal: Alta de Nueva Clienta y Medidas */}
      <Modal
        visible={newClientModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewClientModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Anotar Medidas</Text>
              <TouchableOpacity onPress={() => setNewClientModal(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Nombre de la Clienta:"
                placeholder="Ej. Sra. Guadalupe Pérez"
                value={clientName}
                onChangeText={setClientName}
              />

              <Input
                label="Teléfono o WhatsApp:"
                placeholder="Ej. 55 1234 5678"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />

              <Text style={styles.formSectionLabel}>Medidas Principales (en cm):</Text>
              <View style={styles.measuresInputRow}>
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
                  placeholder="102"
                  keyboardType="numeric"
                  value={cadera}
                  onChangeText={setCadera}
                  style={{ flex: 1 }}
                />
              </View>

              <View style={styles.measuresInputRow}>
                <Input
                  label="Largo Talle:"
                  placeholder="40"
                  keyboardType="numeric"
                  value={largoTalle}
                  onChangeText={setLargoTalle}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Largo Falda/Pantalón:"
                  placeholder="95"
                  keyboardType="numeric"
                  value={largoFalda}
                  onChangeText={setLargoFalda}
                  style={{ flex: 1 }}
                />
              </View>

              <Input
                label="Notas o detalles de la prenda:"
                placeholder="Ej. Prefiere escote redondo, evento en 2 semanas"
                value={clientNotes}
                onChangeText={setClientNotes}
              />

              <Button
                title="Guardar Medidas"
                variant="profit"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                onPress={handleSaveClient}
                style={{ marginTop: theme.spacing.sm }}
              />
              <Button
                title="Cancelar"
                variant="subtle"
                onPress={() => setNewClientModal(false)}
                style={{ marginTop: theme.spacing.xs, marginBottom: 20 }}
              />
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
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    gap: 6,
  },
  badgeText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 90, // Evita que se tape con los botones inferiores
  },
  welcomeBanner: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md + 4,
    marginBottom: theme.spacing.md,
    shadowColor: theme.colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  welcomeTitle: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  needleIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.typography.body - 1,
    color: '#E0E7FF',
    lineHeight: 22,
  },
  ctaCard: {
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md + 2,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  ctaIconBox: {
    width: 56,
    height: 56,
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
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  ctaDesc: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  ctaBtn: {
    marginTop: theme.spacing.xs,
  },
  sectionTitle: {
    fontSize: theme.typography.subtitle - 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm + 2,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 4,
    marginBottom: 0,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  statNumber: {
    fontSize: theme.typography.title - 2,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginTop: 2,
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
    marginBottom: theme.spacing.sm + 4,
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
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
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
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  activeJobCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activeJobTitle: {
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  activeJobClient: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  urgencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.full,
  },
  urgencyText: {
    fontSize: 11,
    fontWeight: '800',
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    padding: 10,
    marginVertical: 8,
    gap: 6,
  },
  dateCol: {
    flex: 1,
  },
  dateColLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  dateColVal: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  activeJobActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  statusPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    gap: 5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  fittingReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    gap: 5,
  },
  fittingReminderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    gap: 5,
  },
  pdfBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6D28D9',
  },
  quoteActionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: theme.spacing.sm + 2,
  },
  quoteShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#DCFCE7',
    gap: 6,
  },
  quoteShareText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: '#15803D',
  },
  quotePdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#EDE9FE',
    gap: 6,
  },
  quotePdfText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: '#6D28D9',
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
    maxHeight: '88%',
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
  clientCard: {
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm + 2,
  },
  clientCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientCardName: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  clientCardPhone: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
  },
  measureItem: {
    width: '30%',
  },
  measureLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  measureVal: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  clientCardNotes: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
  },
  formSectionLabel: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 4,
    marginBottom: 8,
  },
  measuresInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
});
