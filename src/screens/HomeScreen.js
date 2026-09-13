import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
import { portfolioService, PORTFOLIO_CATEGORIES } from '../services/portfolioService';
import { exportService } from '../services/exportService';

export default function HomeScreen({ navigation }) {
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
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

  // Modal y Estados de Portafolio de Alta Costura
  const [portfolioModalVisible, setPortfolioModalVisible] = useState(false);
  const [newDesignModalVisible, setNewDesignModalVisible] = useState(false);
  const [selectedPortfolioCat, setSelectedPortfolioCat] = useState('Todos');
  const [previewImageUri, setPreviewImageUri] = useState(null);

  // Formulario para nuevo diseño de portafolio
  const [designTitle, setDesignTitle] = useState('');
  const [designCategory, setDesignCategory] = useState('XV Años');
  const [designPrice, setDesignPrice] = useState('');
  const [designDescription, setDesignDescription] = useState('');
  const [designPhotoUri, setDesignPhotoUri] = useState('');

  const loadData = async () => {
    try {
      const [savedQuotes, fabrics, threads, clientList, portfolioItems] = await Promise.all([
        pricingService.getSavedQuotes(),
        inventoryService.getFabrics(),
        inventoryService.getThreads(),
        clientService.getClients(),
        portfolioService.getPortfolio(),
      ]);
      setQuotes(savedQuotes);
      setClients(clientList);
      setPortfolio(portfolioItems);
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

  // ==========================================
  // CORTE DE CAJA Y GANANCIAS (MÉTRICAS)
  // ==========================================
  const cashStats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let today = 0;
    let thisWeek = 0;
    let pendingBalance = 0;

    quotes.forEach((q) => {
      const deposit = Number(q.depositPaid) || Number(q.suggestedDeposit) || ((Number(q.totalQuote) || 0) * 0.5) || 0;
      const total = Number(q.totalQuote) || 0;
      const remaining = Math.max(0, total - deposit);

      // Si la prenda ya fue entregada, se considera liquidado el 100% del trabajo
      const totalCollected = q.status === 'entregado' ? total : deposit;

      // Extraer fecha del registro
      const qDateStr = q.createdAt
        ? (typeof q.createdAt === 'string' ? q.createdAt : (q.createdAt.toDate ? q.createdAt.toDate().toISOString() : ''))
        : (q.date || '');
      const qDate = qDateStr ? new Date(qDateStr) : null;

      if (qDate && !isNaN(qDate.getTime())) {
        const isToday = qDate.toISOString().slice(0, 10) === todayStr;
        const isThisWeek = qDate >= sevenDaysAgo;

        if (isToday) {
          today += totalCollected;
        }
        if (isThisWeek) {
          thisWeek += totalCollected;
        }
      } else {
        thisWeek += totalCollected;
      }

      if (q.status !== 'entregado') {
        pendingBalance += remaining;
      }
    });

    return { today, thisWeek, pendingBalance };
  }, [quotes]);

  const handleExportQuotesExcel = async () => {
    try {
      await exportService.exportQuotesToExcel(quotes);
    } catch (e) {
      Alert.alert('Error', 'No se pudo exportar el historial a Excel: ' + e.message);
    }
  };

  const handleGenerateHangerTag = async (q) => {
    await pdfReceiptService.generateHangerTagPDF(q);
  };

  // ==========================================
  // MANEJADORES DE PORTAFOLIO DE ALTA COSTURA
  // ==========================================
  const handlePickDesignPhoto = () => {
    Alert.alert(
      'Foto del Diseño 👗',
      '¿De dónde deseas cargar la foto de tu vestido o confección?',
      [
        {
          text: 'Tomar Foto 📷',
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Permiso necesario', 'Se requiere acceso a la cámara para fotografiar tus diseños.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [4, 3],
              quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              setDesignPhotoUri(res.assets[0].uri);
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
              quality: 0.8,
            });
            if (!res.canceled && res.assets && res.assets.length > 0) {
              setDesignPhotoUri(res.assets[0].uri);
            }
          },
        },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const handleSaveDesign = async () => {
    if (!designTitle.trim()) {
      Alert.alert('Falta título', 'Escribe el nombre o tipo de diseño (ej. "Vestido de XV Años Princesa").');
      return;
    }

    try {
      await portfolioService.addPortfolioItem({
        title: designTitle.trim(),
        category: designCategory,
        approxPrice: Number(designPrice) || 0,
        description: designDescription.trim(),
        photoUri: designPhotoUri || 'https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80',
      });

      setDesignTitle('');
      setDesignCategory('XV Años');
      setDesignPrice('');
      setDesignDescription('');
      setDesignPhotoUri('');
      setNewDesignModalVisible(false);

      await loadData();
      Alert.alert('¡Diseño Guardado! 🎉', 'Tu creación se agregó exitosamente a tu muestrario de alta costura.');
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el diseño: ' + e.message);
    }
  };

  const handleDeleteDesign = (id, title) => {
    Alert.alert(
      '¿Eliminar diseño?',
      `¿Segura que deseas quitar "${title}" de tu portafolio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await portfolioService.deletePortfolioItem(id);
            await loadData();
          },
        },
      ]
    );
  };

  const handleShareDesignWhatsApp = (item) => {
    const priceStr = item.approxPrice > 0 ? `\n💰 *Presupuesto estimado:* Desde ${formatCurrency(item.approxPrice)} MXN` : '';
    const text =
      `👗 *${item.title}* (${item.category})\n\n` +
      `${item.description || 'Confección fina artesanal a la medida.'}\n` +
      priceStr + '\n\n' +
      `¿Te gustaría confeccionar un diseño similar para tu evento especial? ¡Podemos personalizar la tela, el color y tus medidas exactas! ✨🪡\n\n` +
      `¡Escríbeme para agendar tu cita de diseño en el taller!`;

    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Share.share({ message: text });
    });
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

        {/* ========================================== */}
        {/* CORTE DE CAJA Y GANANCIAS DEL TALLER */}
        {/* ========================================== */}
        <Card style={styles.cashCard}>
          <View style={styles.cashHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={styles.cashIconBox}>
                <Ionicons name="cash" size={22} color="#15803D" />
              </View>
              <View>
                <Text style={styles.cashTitle}>Corte de Caja y Ganancias</Text>
                <Text style={styles.cashSubtitle}>Flujo financiero de tu taller</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.excelExportBtn}
              onPress={handleExportQuotesExcel}
              activeOpacity={0.8}
            >
              <Ionicons name="document-text" size={15} color="#15803D" />
              <Text style={styles.excelExportText}>📊 Excel</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.cashGrid}>
            <View style={styles.cashCol}>
              <Text style={styles.cashColLabel}>Cobrado Hoy</Text>
              <Text style={[styles.cashColVal, { color: '#15803D' }]}>
                {formatCurrency(cashStats.today)}
              </Text>
              <Text style={styles.cashColSub}>Anticipos y pagos</Text>
            </View>

            <View style={styles.cashDividerVert} />

            <View style={styles.cashCol}>
              <Text style={styles.cashColLabel}>Esta Semana</Text>
              <Text style={[styles.cashColVal, { color: theme.colors.primaryDark }]}>
                {formatCurrency(cashStats.thisWeek)}
              </Text>
              <Text style={styles.cashColSub}>Últimos 7 días</Text>
            </View>

            <View style={styles.cashDividerVert} />

            <View style={styles.cashCol}>
              <Text style={styles.cashColLabel}>Por Cobrar</Text>
              <Text style={[styles.cashColVal, { color: '#DC2626' }]}>
                {formatCurrency(cashStats.pendingBalance)}
              </Text>
              <Text style={styles.cashColSub}>Prendas activas</Text>
            </View>
          </View>
        </Card>

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

        {/* Resumen de Inventario, Proveedores, Medidas y Portafolio */}
        <Text style={styles.sectionTitle}>Tu Taller al Día</Text>
        <View style={styles.statsGrid}>
          <Card
            style={styles.statGridCard}
            onPress={() => navigation.navigate('Inventario')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.materialsLight }]}>
              <Ionicons name="cut" size={22} color={theme.colors.materials} />
            </View>
            <Text style={styles.statNumber}>{stats.fabricsCount}</Text>
            <Text style={styles.statLabel}>Telas en Stock</Text>
          </Card>

          <Card
            style={styles.statGridCard}
            onPress={() => navigation.navigate('Proveedores')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.laborLight }]}>
              <Ionicons name="storefront" size={22} color={theme.colors.labor} />
            </View>
            <Text style={styles.statNumber}>Precios</Text>
            <Text style={styles.statLabel}>Tiendas</Text>
          </Card>

          <Card
            style={styles.statGridCard}
            onPress={() => navigation.navigate('Medidas')}
          >
            <View style={[styles.statIconBox, { backgroundColor: theme.colors.profitLight }]}>
              <Ionicons name="body-outline" size={22} color={theme.colors.profit} />
            </View>
            <Text style={styles.statNumber}>{clients.length}</Text>
            <Text style={styles.statLabel}>Medidas</Text>
          </Card>

          <Card
            style={[styles.statGridCard, { borderColor: '#DDD6FE', borderWidth: 1 }]}
            onPress={() => setPortfolioModalVisible(true)}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="sparkles" size={22} color="#7C3AED" />
            </View>
            <Text style={[styles.statNumber, { color: '#7C3AED' }]}>{portfolio.length}</Text>
            <Text style={styles.statLabel}>Portafolio 👗</Text>
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

                    <TouchableOpacity
                      style={styles.hangerBtn}
                      onPress={() => handleGenerateHangerTag(q)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pricetag" size={14} color="#0D9488" />
                      <Text style={styles.hangerBtnText}>🏷️ Gancho</Text>
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

                <TouchableOpacity
                  style={[styles.quoteHangerBtn, { flex: 1 }]}
                  onPress={() => handleGenerateHangerTag(q)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pricetag" size={16} color="#0D9488" />
                  <Text style={styles.quoteHangerText}>Gancho</Text>
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

      {/* =================================================================== */}
      {/* MODAL: MI PORTAFOLIO DE DISEÑOS (ALTA COSTURA) */}
      {/* =================================================================== */}
      <Modal
        visible={portfolioModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setPortfolioModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Mi Portafolio de Diseños 👗</Text>
                <Text style={styles.portfolioModalSubtitle}>Muestrario de alta costura para tus clientas</Text>
              </View>
              <TouchableOpacity onPress={() => setPortfolioModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Botón para agregar nuevo diseño */}
            <Button
              title="+ Agregar Nuevo Vestido o Confección"
              variant="primary"
              icon={<Ionicons name="camera-outline" size={20} color="#FFF" />}
              onPress={() => setNewDesignModalVisible(true)}
              style={{ marginBottom: theme.spacing.sm }}
            />

            {/* Filtro por Categorías */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.portfolioFilterScroll}
              contentContainerStyle={{ gap: 8, paddingBottom: 6 }}
            >
              {PORTFOLIO_CATEGORIES.map((cat) => {
                const isSelected = selectedPortfolioCat === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.portfolioFilterChip,
                      isSelected && styles.portfolioFilterChipActive,
                    ]}
                    onPress={() => setSelectedPortfolioCat(cat)}
                  >
                    <Text
                      style={[
                        styles.portfolioFilterText,
                        isSelected && styles.portfolioFilterTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Listado de Diseños */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 6 }}>
              {portfolio
                .filter(
                  (item) =>
                    selectedPortfolioCat === 'Todos' ||
                    item.category === selectedPortfolioCat
                )
                .map((item) => (
                  <Card key={item.id} style={styles.portfolioCard}>
                    {item.photoUri ? (
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setPreviewImageUri(item.photoUri)}
                      >
                        <Image
                          source={{ uri: item.photoUri }}
                          style={styles.portfolioImage}
                          resizeMode="cover"
                        />
                        <View style={styles.portfolioImageZoomHint}>
                          <Ionicons name="scan-outline" size={14} color="#FFF" />
                          <Text style={styles.portfolioImageZoomText}>Tocar para ampliar</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}

                    <View style={styles.portfolioCardContent}>
                      <View style={styles.portfolioCardHeader}>
                        <View style={{ flex: 1, paddingRight: 6 }}>
                          <View style={styles.portfolioCategoryBadge}>
                            <Text style={styles.portfolioCategoryBadgeText}>
                              {item.category}
                            </Text>
                          </View>
                          <Text style={styles.portfolioCardTitle}>{item.title}</Text>
                        </View>
                        {item.approxPrice > 0 && (
                          <View style={styles.portfolioPriceBadge}>
                            <Text style={styles.portfolioPriceLabel}>Desde</Text>
                            <Text style={styles.portfolioPriceVal}>
                              {formatCurrency(item.approxPrice)}
                            </Text>
                          </View>
                        )}
                      </View>

                      {item.description ? (
                        <Text style={styles.portfolioCardDesc}>{item.description}</Text>
                      ) : null}

                      {/* Botones de acción del diseño */}
                      <View style={styles.portfolioActionsRow}>
                        <TouchableOpacity
                          style={styles.portfolioShareBtn}
                          onPress={() => handleShareDesignWhatsApp(item)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="logo-whatsapp" size={16} color="#15803D" />
                          <Text style={styles.portfolioShareBtnText}>Mostrar a Clienta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.portfolioDeleteBtn}
                          onPress={() => handleDeleteDesign(item.id, item.title)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </Card>
                ))}

              {portfolio.filter(
                (item) =>
                  selectedPortfolioCat === 'Todos' ||
                  item.category === selectedPortfolioCat
              ).length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons name="shirt-outline" size={48} color={theme.colors.textMuted} />
                  <Text style={[styles.emptyText, { marginTop: 8 }]}>
                    Aún no hay diseños en "{selectedPortfolioCat}"
                  </Text>
                  <Text style={styles.emptySubtext}>
                    Toma fotos de tus vestidos para mostrárselos a tus clientas cuando te pidan ideas.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: REGISTRAR NUEVO DISEÑO AL PORTAFOLIO */}
      {/* =================================================================== */}
      <Modal
        visible={newDesignModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewDesignModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Diseño en Portafolio</Text>
              <TouchableOpacity onPress={() => setNewDesignModalVisible(false)}>
                <Ionicons name="close-circle" size={28} color={theme.colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Selector de Foto con Vista Previa */}
              <TouchableOpacity
                style={styles.photoPickerContainer}
                onPress={handlePickDesignPhoto}
                activeOpacity={0.85}
              >
                {designPhotoUri ? (
                  <View style={{ width: '100%', position: 'relative' }}>
                    <Image
                      source={{ uri: designPhotoUri }}
                      style={styles.pickedImagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.changePhotoBadge}>
                      <Ionicons name="camera" size={14} color="#FFF" />
                      <Text style={styles.changePhotoText}>Cambiar Foto</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoPickerPlaceholder}>
                    <Ionicons name="camera-outline" size={40} color={theme.colors.primary} />
                    <Text style={styles.photoPickerTitle}>Tomar Foto o Elegir de Galería</Text>
                    <Text style={styles.photoPickerSub}>Sube una foto clara de tu vestido o confección</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Input
                label="Nombre del Vestido o Confección:"
                placeholder="Ej. Vestido de XV Años Princesa Azul Cielo"
                value={designTitle}
                onChangeText={setDesignTitle}
              />

              <Text style={styles.formSectionLabel}>Categoría:</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 12 }}
                contentContainerStyle={{ gap: 8 }}
              >
                {PORTFOLIO_CATEGORIES.filter((c) => c !== 'Todos').map((cat) => {
                  const isSel = designCategory === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.portfolioFilterChip,
                        isSel && styles.portfolioFilterChipActive,
                      ]}
                      onPress={() => setDesignCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.portfolioFilterText,
                          isSel && styles.portfolioFilterTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Input
                label="Precio aproximado desde ($ MXN):"
                placeholder="Ej. 3500"
                keyboardType="numeric"
                value={designPrice}
                onChangeText={setDesignPrice}
              />

              <Input
                label="Detalles de la confección:"
                placeholder="Ej. Falda de tul con crinolina, corsé con pedrería bordada a mano..."
                value={designDescription}
                onChangeText={setDesignDescription}
                multiline
                numberOfLines={3}
              />

              <Button
                title="Guardar en Mi Portafolio"
                variant="profit"
                icon={<Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                onPress={handleSaveDesign}
                style={{ marginTop: theme.spacing.sm }}
              />

              <Button
                title="Cancelar"
                variant="subtle"
                onPress={() => setNewDesignModalVisible(false)}
                style={{ marginTop: theme.spacing.xs, marginBottom: 20 }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL: VISOR DE FOTO EN PANTALLA COMPLETA */}
      {/* =================================================================== */}
      <Modal
        visible={!!previewImageUri}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImageUri(null)}
      >
        <View style={styles.imageViewerOverlay}>
          <TouchableOpacity
            style={styles.imageViewerCloseBtn}
            onPress={() => setPreviewImageUri(null)}
          >
            <Ionicons name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          {previewImageUri ? (
            <Image
              source={{ uri: previewImageUri }}
              style={styles.imageViewerImg}
              resizeMode="contain"
            />
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
  // ==========================================
  // ESTILOS: CORTE DE CAJA Y GANANCIAS
  // ==========================================
  cashCard: {
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  cashHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm + 2,
  },
  cashIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cashTitle: {
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
    color: '#14532D',
  },
  cashSubtitle: {
    fontSize: theme.typography.small,
    color: theme.colors.textMuted,
  },
  excelExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    gap: 4,
  },
  excelExportText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#15803D',
  },
  cashGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: theme.borderRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  cashCol: {
    flex: 1,
    alignItems: 'center',
  },
  cashColLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    marginBottom: 2,
  },
  cashColVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  cashColSub: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  cashDividerVert: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  // ==========================================
  // ESTILOS: TU TALLER AL DÍA (GRID 2x2)
  // ==========================================
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: 10,
  },
  statGridCard: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: 8,
    marginBottom: 0,
  },
  // ==========================================
  // ESTILOS: BOLETAS PARA GANCHOS
  // ==========================================
  hangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.sm,
    gap: 5,
  },
  hangerBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
  },
  quoteHangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#CCFBF1',
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 6,
  },
  quoteHangerText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: '#0F766E',
  },
  // ==========================================
  // ESTILOS: MI PORTAFOLIO DE DISEÑOS
  // ==========================================
  portfolioModalSubtitle: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  portfolioFilterScroll: {
    marginBottom: 10,
  },
  portfolioFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  portfolioFilterChipActive: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  portfolioFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  portfolioFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  portfolioCard: {
    padding: 0,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  portfolioImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  portfolioImageZoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  portfolioImageZoomText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  portfolioCardContent: {
    padding: theme.spacing.md,
  },
  portfolioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  portfolioCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  portfolioCategoryBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6D28D9',
  },
  portfolioCardTitle: {
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  portfolioPriceBadge: {
    alignItems: 'flex-end',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  portfolioPriceLabel: {
    fontSize: 9,
    color: '#15803D',
    fontWeight: '600',
  },
  portfolioPriceVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#15803D',
  },
  portfolioCardDesc: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  portfolioActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  portfolioShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 9,
    borderRadius: theme.borderRadius.sm,
    gap: 6,
  },
  portfolioShareBtnText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: '#15803D',
  },
  portfolioDeleteBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerContainer: {
    width: '100%',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    backgroundColor: '#FAF5FF',
    minHeight: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickedImagePreview: {
    width: '100%',
    height: 180,
  },
  changePhotoBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changePhotoText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  photoPickerPlaceholder: {
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  photoPickerTitle: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: '#6D28D9',
    marginTop: 6,
  },
  photoPickerSub: {
    fontSize: theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  imageViewerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerImg: {
    width: '94%',
    height: '80%',
  },
});
