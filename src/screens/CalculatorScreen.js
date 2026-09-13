import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import {
  pricingService,
  ALTERATION_PRESETS,
  URGENCY_LEVELS,
} from '../services/pricingService';
import { inventoryService } from '../services/inventoryService';
import { pdfReceiptService } from '../services/pdfReceiptService';
import { formatCurrency } from '../utils/currency';

export default function CalculatorScreen({ navigation }) {
  // Modo activo: 'arreglos' (composturas rápidas) o 'confeccion' (vestidos / a la medida)
  const [activeMode, setActiveMode] = useState('arreglos');

  // ==========================================
  // ESTADO: MODO ARREGLOS RÁPIDOS
  // ==========================================
  const [alterations, setAlterations] = useState(
    ALTERATION_PRESETS.map((preset) => ({
      ...preset,
      quantity: 0,
      unitPrice: preset.defaultPrice,
    }))
  );
  const [customAltName, setCustomAltName] = useState('');
  const [customAltPrice, setCustomAltPrice] = useState('');
  const [altClientName, setAltClientName] = useState('');
  const [altClientPhone, setAltClientPhone] = useState('');
  const [altDeliveryDate, setAltDeliveryDate] = useState('');
  const [altUrgency, setAltUrgency] = useState('normal'); // 'normal' | 'urgente' | 'express'
  const [altDepositPaid, setAltDepositPaid] = useState('');

  // ==========================================
  // ESTADO: MODO CONFECCIÓN A MEDIDA
  // ==========================================
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [fittingDate, setFittingDate] = useState('');
  const [depositPaid, setDepositPaid] = useState('');
  const [confUrgency, setConfUrgency] = useState('normal'); // 'normal' | 'urgente' | 'express'
  const [deductStock, setDeductStock] = useState(true);

  // Materiales de confección
  const [materials, setMaterials] = useState([
    { id: '1', name: 'Tela principal', quantity: '2.5', unitPrice: '120' },
    { id: '2', name: 'Cierre o botones', quantity: '1', unitPrice: '25' },
  ]);
  const [newMatName, setNewMatName] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatPrice, setNewMatPrice] = useState('');

  // Mano de obra y factores
  const [laborHours, setLaborHours] = useState('4');
  const [hourlyRate, setHourlyRate] = useState('80');
  const [overheadPercent, setOverheadPercent] = useState('10');
  const [profitMargin, setProfitMargin] = useState('30');

  // ==========================================
  // CÁLCULOS EN TIEMPO REAL
  // ==========================================

  // Cálculo de Arreglos Rápidos
  const altResult = useMemo(() => {
    return pricingService.calculateAlterations({
      items: alterations,
      urgencyLevel: altUrgency,
    });
  }, [alterations, altUrgency]);

  // Cálculo de Confección
  const confResult = useMemo(() => {
    const formattedMaterials = materials.map((m) => ({
      name: m.name,
      quantity: Number(m.quantity) || 0,
      unitPrice: Number(m.unitPrice) || 0,
    }));

    return pricingService.calculate({
      materials: formattedMaterials,
      laborHours: Number(laborHours) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      overheadPercent: Number(overheadPercent) || 0,
      profitMarginPercent: Number(profitMargin) || 0,
      urgencyLevel: confUrgency,
    });
  }, [materials, laborHours, hourlyRate, overheadPercent, profitMargin, confUrgency]);

  // ==========================================
  // MANEJADORES: ARREGLOS RÁPIDOS
  // ==========================================
  const handleQuantityChange = (id, delta) => {
    setAlterations((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, (Number(item.quantity) || 0) + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const handleAddCustomAlteration = () => {
    if (!customAltName.trim() || !customAltPrice) {
      Alert.alert('Faltan datos', 'Ingresa la descripción del arreglo y su precio.');
      return;
    }

    const newItem = {
      id: 'custom_' + Date.now(),
      name: customAltName.trim(),
      detail: 'Arreglo personalizado',
      unitPrice: Number(customAltPrice) || 0,
      quantity: 1,
      icon: 'sparkles-outline',
    };

    setAlterations((prev) => [newItem, ...prev]);
    setCustomAltName('');
    setCustomAltPrice('');
  };

  const sendWhatsApp = (text, targetPhone = '') => {
    let url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    const cleanPhone = (targetPhone || '').replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const fullPhone = cleanPhone.length === 10 ? `521${cleanPhone}` : cleanPhone;
      url = `whatsapp://send?phone=${fullPhone}&text=${encodeURIComponent(text)}`;
    }

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Share.share({ message: text });
        }
      })
      .catch(() => {
        Share.share({ message: text });
      });
  };

  const handleShareAltQuoteWhatsApp = () => {
    if (!altResult || altResult.itemsCount === 0) {
      Alert.alert('Sin prendas', 'Suma al menos 1 arreglo con el botón (+) antes de compartir.');
      return;
    }

    const nameStr = altClientName.trim() ? ` ${altClientName.trim()}` : '';
    const dateStr = altDeliveryDate.trim() ? `\n🎁 *Fecha de entrega:* ${altDeliveryDate.trim()}` : '';
    const itemsList = altResult.items
      .map(
        (it) =>
          `• *${it.quantity}x ${it.name}* (${formatCurrency(it.unitPrice)} c/u) = ${formatCurrency(
            it.quantity * it.unitPrice
          )} MXN`
      )
      .join('\n');

    const text =
      `🪡 *Presupuesto de Arreglos y Composturas*\n\n` +
      `Hola${nameStr}, con gusto te comparto el costo de tus prendas:\n\n` +
      `${itemsList}\n\n` +
      `Subtotal: ${formatCurrency(altResult.subtotal)} MXN\n` +
      (altResult.urgencySurchargeAmount > 0
        ? `⚡ *Servicio ${altResult.urgencyBadge} (+${altResult.urgencySurchargePct}%):* +${formatCurrency(
            altResult.urgencySurchargeAmount
          )} MXN\n`
        : '') +
      `💰 *TOTAL A PAGAR:* ${formatCurrency(altResult.totalQuote)} MXN\n` +
      (altDepositPaid
        ? `🤝 *Anticipo recibido:* ${formatCurrency(altDepositPaid)} MXN\n` +
          `Saldo pendiente: ${formatCurrency(
            Math.max(0, altResult.totalQuote - Number(altDepositPaid))
          )} MXN\n`
        : `🤝 *Anticipo sugerido:* ${formatCurrency(altResult.suggestedDeposit)} MXN\n`) +
      dateStr +
      `\n\n` +
      `✨ *Taller de Costura y Confección* - Acabados finos y resistentes. ¡Quedo a tus órdenes! 🧵`;

    sendWhatsApp(text, altClientPhone);
  };

  const handleNotifyAltReadyWhatsApp = () => {
    const nameStr = altClientName.trim() ? ` ${altClientName.trim()}` : '';
    const itemsDesc =
      altResult.items.length > 0
        ? altResult.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
        : 'tus prendas';

    const text =
      `🪡 *¡Tu arreglo ya quedó listo!* 🎉\n\n` +
      `Hola${nameStr}, te aviso con gusto que *${itemsDesc}* ya está terminado, revisado y planchado en el taller.\n\n` +
      `Ya puedes pasar a recogerlo cuando gustes. ¡Muchas gracias por tu preferencia y confianza! 🧵✨`;

    sendWhatsApp(text, altClientPhone);
  };

  const handleSaveAltQuote = async () => {
    if (!altResult || altResult.itemsCount === 0) {
      Alert.alert('Sin prendas', 'Suma al menos 1 arreglo con el botón (+) antes de guardar.');
      return;
    }

    const itemsSummary = altResult.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const title =
      itemsSummary.length > 55 ? itemsSummary.slice(0, 52) + '...' : itemsSummary;

    try {
      const payload = {
        type: 'arreglo',
        projectName: title,
        clientName: altClientName.trim() || 'Clienta de Arreglos',
        clientPhone: altClientPhone.trim(),
        deliveryDate: altDeliveryDate.trim() || 'Por acordar',
        fittingDate: null,
        depositPaid: Number(altDepositPaid) || altResult.suggestedDeposit,
        status: 'en_proceso',
        alterationItems: altResult.items,
        totalQuote: altResult.totalQuote,
        subtotal: altResult.subtotal,
        urgencyLevel: altResult.urgencyLevel,
        urgencyBadge: altResult.urgencyBadge,
        urgencySurchargePct: altResult.urgencySurchargePct,
        urgencySurchargeAmount: altResult.urgencySurchargeAmount,
        suggestedDeposit: altResult.suggestedDeposit,
        materialsCost: 0,
        laborCost: altResult.totalQuote,
      };

      await pricingService.saveQuote(payload);

      Alert.alert(
        '¡Arreglo Guardado y Agendado! 🎉',
        `"${title}" se guardó en tus entregas activas con fecha: ${
          altDeliveryDate || 'Por acordar'
        }. Podrás darle seguimiento desde el Inicio.`,
        [
          { text: 'Ver en Inicio', onPress: () => navigation.navigate('Inicio') },
          { text: 'Hacer otro arreglo', style: 'cancel' },
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el arreglo: ' + e.message);
    }
  };

  const handleGenerateAltPDF = async () => {
    if (!altResult || altResult.itemsCount === 0) {
      Alert.alert('Sin prendas', 'Selecciona al menos 1 arreglo para generar la nota de pedido.');
      return;
    }
    const itemsSummary = altResult.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const currentQuote = {
      type: 'arreglo',
      projectName: itemsSummary,
      clientName: altClientName.trim() || 'Clienta de Taller',
      clientPhone: altClientPhone.trim(),
      deliveryDate: altDeliveryDate.trim() || 'Por acordar',
      depositPaid: Number(altDepositPaid) || altResult.suggestedDeposit,
      status: 'en_proceso',
      alterationItems: altResult.items,
      totalQuote: altResult.totalQuote,
      subtotal: altResult.subtotal,
      urgencyLevel: altResult.urgencyLevel,
      urgencyBadge: altResult.urgencyBadge,
      urgencySurchargePct: altResult.urgencySurchargePct,
      urgencySurchargeAmount: altResult.urgencySurchargeAmount,
      materialsCost: 0,
      laborCost: altResult.totalQuote,
    };
    await pdfReceiptService.generateAndShareReceipt(currentQuote);
  };

  const handleGenerateAltHangerTag = async () => {
    if (!altResult || altResult.itemsCount === 0) {
      Alert.alert('Sin prendas', 'Selecciona al menos 1 arreglo para generar la boleta de gancho.');
      return;
    }
    const itemsSummary = altResult.items.map((i) => `${i.quantity}x ${i.name}`).join(', ');
    const currentQuote = {
      type: 'arreglo',
      projectName: itemsSummary,
      clientName: altClientName.trim() || 'Clienta de Taller',
      clientPhone: altClientPhone.trim(),
      deliveryDate: altDeliveryDate.trim() || 'Por acordar',
      depositPaid: Number(altDepositPaid) || altResult.suggestedDeposit,
      status: 'en_proceso',
      alterationItems: altResult.items,
      totalQuote: altResult.totalQuote,
      subtotal: altResult.subtotal,
      urgencyLevel: altResult.urgencyLevel,
      urgencyBadge: altResult.urgencyBadge,
      urgencySurchargePct: altResult.urgencySurchargePct,
      urgencySurchargeAmount: altResult.urgencySurchargeAmount,
      materialsCost: 0,
      laborCost: altResult.totalQuote,
    };
    await pdfReceiptService.generateHangerTagPDF(currentQuote);
  };

  // ==========================================
  // MANEJADORES: MODO CONFECCIÓN A MEDIDA
  // ==========================================
  const handleAddMaterial = () => {
    if (!newMatName.trim() || !newMatQty || !newMatPrice) {
      Alert.alert('Faltan datos', 'Ingresa el nombre, cantidad y precio del material.');
      return;
    }

    setMaterials([
      ...materials,
      {
        id: Date.now().toString(),
        name: newMatName.trim(),
        quantity: newMatQty,
        unitPrice: newMatPrice,
      },
    ]);

    setNewMatName('');
    setNewMatQty('');
    setNewMatPrice('');
  };

  const handleRemoveMaterial = (id) => {
    setMaterials(materials.filter((m) => m.id !== id));
  };

  const handleSaveConfQuote = async () => {
    if (!projectName.trim()) {
      Alert.alert('Falta nombre', 'Por favor dale un nombre al trabajo (ej. "Vestido de XV años").');
      return;
    }

    try {
      const quotePayload = {
        type: 'confeccion',
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        deliveryDate: deliveryDate.trim() || null,
        fittingDate: fittingDate.trim() || null,
        depositPaid: Number(depositPaid) || confResult.suggestedDeposit,
        status: 'en_proceso',
        materials,
        laborHours: Number(laborHours),
        hourlyRate: Number(hourlyRate),
        overheadPercent: Number(overheadPercent),
        profitMarginPercent: Number(profitMargin),
        urgencyLevel: confUrgency,
        urgencyBadge: confResult.urgencyBadge,
        urgencySurchargePct: confResult.urgencySurchargePct,
        urgencySurchargeAmount: confResult.urgencySurchargeAmount,
        ...confResult,
      };

      await pricingService.saveQuote(quotePayload);

      // Descontar inventario
      if (deductStock) {
        for (const mat of materials) {
          const isFabric =
            (mat.name || '').toLowerCase().includes('tela') ||
            (mat.name || '').toLowerCase().includes('lino') ||
            (mat.name || '').toLowerCase().includes('satín') ||
            (mat.name || '').toLowerCase().includes('algodón') ||
            (mat.name || '').toLowerCase().includes('popelina');

          await inventoryService.deductMaterial({
            name: mat.name,
            quantity: mat.quantity,
            isFabric,
          });
        }
      }

      Alert.alert(
        '¡Trabajo Guardado y Agendado! 🎉',
        `"${projectName}" se guardó con éxito en tus entregas activas.${
          deductStock ? ' Se actualizaron las existencias de tus telas e insumos.' : ''
        }`,
        [{ text: 'Ver en Inicio', onPress: () => navigation.navigate('Inicio') }]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la cotización: ' + e.message);
    }
  };

  const handleGenerateConfPDF = async () => {
    if (!confResult) return;
    const currentQuote = {
      type: 'confeccion',
      projectName: projectName.trim() || 'Prenda de Costura',
      clientName: clientName.trim() || 'Clienta de Taller',
      clientPhone: clientPhone.trim(),
      deliveryDate: deliveryDate.trim() || 'Por acordar',
      fittingDate: fittingDate.trim() || 'Por agendar',
      depositPaid: Number(depositPaid) || confResult.suggestedDeposit,
      status: 'en_proceso',
      urgencyLevel: confUrgency,
      urgencyBadge: confResult.urgencyBadge,
      urgencySurchargePct: confResult.urgencySurchargePct,
      urgencySurchargeAmount: confResult.urgencySurchargeAmount,
      ...confResult,
    };
    await pdfReceiptService.generateAndShareReceipt(currentQuote);
  };

  const handleGenerateConfHangerTag = async () => {
    if (!confResult) return;
    const currentQuote = {
      type: 'confeccion',
      projectName: projectName.trim() || 'Prenda de Costura',
      clientName: clientName.trim() || 'Clienta de Taller',
      clientPhone: clientPhone.trim(),
      deliveryDate: deliveryDate.trim() || 'Por acordar',
      fittingDate: fittingDate.trim() || 'Por agendar',
      depositPaid: Number(depositPaid) || confResult.suggestedDeposit,
      status: 'en_proceso',
      urgencyLevel: confUrgency,
      urgencyBadge: confResult.urgencyBadge,
      urgencySurchargePct: confResult.urgencySurchargePct,
      urgencySurchargeAmount: confResult.urgencySurchargeAmount,
      ...confResult,
    };
    await pdfReceiptService.generateHangerTagPDF(currentQuote);
  };

  const handleShareConfWhatsApp = () => {
    if (!confResult) return;
    const nameStr = clientName.trim() ? ` ${clientName.trim()}` : '';
    const jobStr = projectName.trim() ? ` para *${projectName.trim()}*` : ' para tu prenda';
    const urgentNotice =
      confResult.urgencySurchargeAmount > 0
        ? `⚡ *Prioridad ${confResult.urgencyBadge} (+${confResult.urgencySurchargePct}% en confección)*\n`
        : '';

    const text =
      `🧵 *Cotización de Confección y Costura*\n\n` +
      `Hola${nameStr}, con mucho gusto te comparto el presupuesto${jobStr}:\n\n` +
      urgentNotice +
      `💰 *Total:* ${formatCurrency(confResult.totalQuote)} MXN\n` +
      `🤝 *Anticipo requerido (50%):* ${formatCurrency(confResult.suggestedDeposit)} MXN\n\n` +
      `✨ *Incluye:* Materiales de calidad, corte y confección a medida, y acabados finos de taller.\n\n` +
      `¡Quedo a tus órdenes para apartar la fecha y comenzar! 🪡`;

    sendWhatsApp(text, clientPhone);
  };

  // ==========================================
  // COMPONENTE: SELECTOR DE URGENCIA
  // ==========================================
  const renderUrgencySelector = (currentLevel, onSelect) => {
    return (
      <View style={styles.urgencyContainer}>
        <View style={styles.urgencyHeaderRow}>
          <Ionicons name="flash" size={18} color="#D97706" />
          <Text style={styles.urgencyTitle}>¿Qué tan pronto lo necesita la clienta?:</Text>
        </View>

        <View style={styles.urgencyGrid}>
          {Object.values(URGENCY_LEVELS).map((lvl) => {
            const isSelected = currentLevel === lvl.id;
            let activeBg = '#EDE9FE';
            let activeBorder = theme.colors.primary;
            if (lvl.id === 'urgente') {
              activeBg = '#FEF3C7';
              activeBorder = '#F59E0B';
            } else if (lvl.id === 'express') {
              activeBg = '#FEE2E2';
              activeBorder = '#EF4444';
            }

            return (
              <TouchableOpacity
                key={lvl.id}
                style={[
                  styles.urgencyChip,
                  isSelected && {
                    backgroundColor: activeBg,
                    borderColor: activeBorder,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => onSelect(lvl.id)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.urgencyBadgeText,
                    isSelected && { fontWeight: '900', color: theme.colors.textPrimary },
                  ]}
                >
                  {lvl.badge}
                </Text>
                <Text style={styles.urgencySubtext}>{lvl.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Cotizador Inteligente"
        subtitle="Cobros justos, arreglos al instante y recargos por urgencia"
      />

      {/* Barra de Cambio de Modo: Arreglos Rápidos vs Confección a Medida */}
      <View style={styles.modeTabBar}>
        <TouchableOpacity
          style={[
            styles.modeTabBtn,
            activeMode === 'arreglos' && styles.modeTabBtnActive,
          ]}
          onPress={() => setActiveMode('arreglos')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="cut"
            size={18}
            color={activeMode === 'arreglos' ? '#FFF' : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.modeTabText,
              activeMode === 'arreglos' && styles.modeTabTextActive,
            ]}
          >
            ✂️ Arreglos Rápidos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTabBtn,
            activeMode === 'confeccion' && styles.modeTabBtnActive,
          ]}
          onPress={() => setActiveMode('confeccion')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="shirt"
            size={18}
            color={activeMode === 'confeccion' ? '#FFF' : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.modeTabText,
              activeMode === 'confeccion' && styles.modeTabTextActive,
            ]}
          >
            👗 A la Medida
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* =================================================================== */}
        {/* VISTA 1: ARREGLOS RÁPIDOS Y COMPOSTURAS */}
        {/* =================================================================== */}
        {activeMode === 'arreglos' && (
          <View>
            {/* Tarjeta de Datos de la Clienta */}
            <Card style={styles.card}>
              <Text style={styles.cardSectionTitle}>1. Clienta y Fecha de Entrega</Text>
              <Input
                label="Nombre de la clienta (opcional):"
                placeholder="Ej. Sra. Lupita"
                value={altClientName}
                onChangeText={setAltClientName}
              />
              <Input
                label="Teléfono / WhatsApp:"
                placeholder="Ej. 55 9876 5432"
                keyboardType="phone-pad"
                value={altClientPhone}
                onChangeText={setAltClientPhone}
              />
              <Input
                label="¿Para cuándo lo prometes?: (Fecha u Hora)"
                placeholder="Ej. Hoy 6:00 pm, Mañana, 25 Sep"
                value={altDeliveryDate}
                onChangeText={setAltDeliveryDate}
              />

              {/* Selector de Urgencia */}
              {renderUrgencySelector(altUrgency, setAltUrgency)}
            </Card>

            {/* Catálogo de Arreglos Rápidos con botones + / - */}
            <Card style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.cardSectionTitle}>2. Selecciona las Prendas</Text>
                  <Text style={styles.sectionSubtitle}>
                    Toca (+) para sumar piezas o ajusta el precio
                  </Text>
                </View>
                {altResult.itemsCount > 0 && (
                  <View style={styles.activeCountBadge}>
                    <Text style={styles.activeCountText}>
                      {altResult.itemsCount} arreglo(s)
                    </Text>
                  </View>
                )}
              </View>

              {alterations.map((item) => {
                const qty = Number(item.quantity) || 0;
                const isSelected = qty > 0;

                return (
                  <View
                    key={item.id}
                    style={[styles.altItemRow, isSelected && styles.altItemRowSelected]}
                  >
                    <View style={styles.altItemIconBox}>
                      <Ionicons
                        name={item.icon || 'cut-outline'}
                        size={22}
                        color={isSelected ? theme.colors.primaryDark : theme.colors.textSecondary}
                      />
                    </View>

                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.altItemName, isSelected && styles.altItemNameSelected]}>
                        {item.name}
                      </Text>
                      <Text style={styles.altItemDetail}>{item.detail}</Text>
                      <Text style={styles.altItemUnitPrice}>
                        Precio: {formatCurrency(item.unitPrice)} c/u
                      </Text>
                    </View>

                    {/* Contador + / - */}
                    <View style={styles.counterRow}>
                      <TouchableOpacity
                        style={[styles.counterBtn, qty === 0 && styles.counterBtnDisabled]}
                        onPress={() => handleQuantityChange(item.id, -1)}
                        disabled={qty === 0}
                      >
                        <Ionicons
                          name="remove"
                          size={20}
                          color={qty > 0 ? theme.colors.textPrimary : '#CBD5E1'}
                        />
                      </TouchableOpacity>

                      <View style={styles.qtyDisplayBox}>
                        <Text style={[styles.qtyDisplayText, isSelected && styles.qtyDisplayTextActive]}>
                          {qty}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.counterBtn, styles.counterBtnAdd]}
                        onPress={() => handleQuantityChange(item.id, 1)}
                      >
                        <Ionicons name="add" size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}

              {/* Agregar otro arreglo personalizado */}
              <View style={styles.customAltBox}>
                <Text style={styles.customAltTitle}>+ ¿Otro arreglo no listado?:</Text>
                <Input
                  placeholder="Ej. Cambio de forro de falda, Zurcido especial"
                  value={customAltName}
                  onChangeText={setCustomAltName}
                />
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <Input
                    placeholder="Precio ($)"
                    keyboardType="numeric"
                    prefix="$"
                    value={customAltPrice}
                    onChangeText={setCustomAltPrice}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="Añadir"
                    size="small"
                    variant="outline"
                    onPress={handleAddCustomAlteration}
                    style={{ minWidth: 90 }}
                  />
                </View>
              </View>
            </Card>

            {/* Anticipo recibido en arreglos */}
            <Card style={styles.card}>
              <Text style={styles.cardSectionTitle}>3. Anticipo o Pago Completo</Text>
              <Input
                label="Anticipo pagado por la clienta ($):"
                placeholder={
                  altResult.totalQuote > 0
                    ? `Sugerido: ${formatCurrency(altResult.suggestedDeposit)}`
                    : 'Ej. 50'
                }
                keyboardType="numeric"
                prefix="$"
                value={altDepositPaid}
                onChangeText={setAltDepositPaid}
                helperText="En arreglos menores a $100 se sugiere cobrar el total al recibir la prenda."
              />
            </Card>

            {/* TARJETA DE RESULTADO FINAL PARA ARREGLOS */}
            <Card variant="highlight" style={styles.resultCard}>
              <Text style={styles.resultSuperHeader}>TOTAL A COBRAR</Text>
              <Text style={styles.resultTotalBig}>
                {formatCurrency(altResult.totalQuote)}
              </Text>

              {/* Desglose rápido si hay recargo */}
              {altResult.urgencySurchargeAmount > 0 && (
                <View style={styles.urgencyAlertPill}>
                  <Ionicons name="flash" size={18} color="#DC2626" />
                  <Text style={styles.urgencyAlertText}>
                    Incluye recargo de urgencia ({altResult.urgencyBadge}):{' '}
                    <Text style={{ fontWeight: '900' }}>
                      +{formatCurrency(altResult.urgencySurchargeAmount)} MXN
                    </Text>
                  </Text>
                </View>
              )}

              <View style={styles.depositBox}>
                <Ionicons name="cash-outline" size={22} color={theme.colors.primaryDark} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.depositText}>
                    {altDepositPaid
                      ? `Abonó ${formatCurrency(altDepositPaid)}. Saldo pendiente: `
                      : `Anticipo sugerido: `}
                    <Text style={{ fontWeight: '900' }}>
                      {formatCurrency(
                        altDepositPaid
                          ? Math.max(0, altResult.totalQuote - Number(altDepositPaid))
                          : altResult.suggestedDeposit
                      )}
                    </Text>
                  </Text>
                </View>
              </View>

              {/* Botones de acción directa */}
              <View style={styles.actionButtonsContainer}>
                <Button
                  title="Compartir Presupuesto por WhatsApp"
                  variant="secondary"
                  icon={<Ionicons name="logo-whatsapp" size={22} color="#FFF" />}
                  onPress={handleShareAltQuoteWhatsApp}
                  style={styles.whatsAppBtn}
                />

                <Button
                  title="📢 ¡Avisar que ya está listo! (WhatsApp)"
                  variant="outline"
                  icon={<Ionicons name="checkmark-done-circle" size={22} color="#15803D" />}
                  onPress={handleNotifyAltReadyWhatsApp}
                  style={{
                    marginTop: theme.spacing.sm,
                    borderColor: '#15803D',
                    backgroundColor: '#F0FDF4',
                  }}
                />

                <Button
                  title="📄 Generar Recibo Formal en PDF"
                  variant="primary"
                  icon={<Ionicons name="document-text-outline" size={22} color="#FFF" />}
                  onPress={handleGenerateAltPDF}
                  style={{ marginTop: theme.spacing.sm, backgroundColor: '#7C3AED' }}
                />

                <Button
                  title="🏷️ Mini Boleta para Gancho (PDF)"
                  variant="outline"
                  icon={<Ionicons name="pricetag-outline" size={20} color="#6D28D9" />}
                  onPress={handleGenerateAltHangerTag}
                  style={{
                    marginTop: theme.spacing.sm,
                    borderColor: '#DDD6FE',
                    backgroundColor: '#F5F3FF',
                  }}
                  textStyle={{ color: '#6D28D9', fontWeight: '700' }}
                />

                <Button
                  title="💾 Guardar y Agendar en Entregas"
                  variant="profit"
                  icon={<Ionicons name="calendar-outline" size={22} color="#FFF" />}
                  onPress={handleSaveAltQuote}
                  style={{ marginTop: theme.spacing.sm }}
                />
              </View>
            </Card>
          </View>
        )}

        {/* =================================================================== */}
        {/* VISTA 2: CONFECCIÓN A MEDIDA (VESTIDOS, BLUSAS, DISFRACES) */}
        {/* =================================================================== */}
        {activeMode === 'confeccion' && (
          <View>
            {/* Consejo Superior Didáctico */}
            <View style={styles.tipBox}>
              <View style={styles.tipIconBox}>
                <Ionicons name="bulb" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tipTitle}>La Regla de Oro de la Costurera:</Text>
                <Text style={styles.tipDesc}>
                  Nunca cobres solo la tela. Tu experiencia, tus horas cosiendo y el desgaste de tus
                  máquinas valen.
                </Text>
              </View>
            </View>

            {/* 1. Datos del trabajo */}
            <Card style={styles.card}>
              <Text style={styles.cardSectionTitle}>1. ¿Qué prenda es?</Text>
              <Input
                label="Nombre del trabajo:"
                placeholder="Ej. Vestido de XV años, Traje de gala"
                value={projectName}
                onChangeText={setProjectName}
              />
              <Input
                label="Nombre de la clienta (opcional):"
                placeholder="Ej. Sra. María Elena"
                value={clientName}
                onChangeText={setClientName}
              />
              <Input
                label="Teléfono / WhatsApp de la clienta:"
                placeholder="Ej. 55 1234 5678"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />

              {/* Selector de Urgencia en Confección */}
              {renderUrgencySelector(confUrgency, setConfUrgency)}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <Input
                  label="Fecha de Prueba:"
                  placeholder="Ej. 20 Sep"
                  value={fittingDate}
                  onChangeText={setFittingDate}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Fecha de Entrega:"
                  placeholder="Ej. 25 Sep"
                  value={deliveryDate}
                  onChangeText={setDeliveryDate}
                  style={{ flex: 1 }}
                />
              </View>
              <Input
                label="Anticipo recibido ($):"
                placeholder={
                  confResult ? `Sugerido: $${confResult.suggestedDeposit}` : '50% de anticipo'
                }
                keyboardType="numeric"
                value={depositPaid}
                onChangeText={setDepositPaid}
              />
              <TouchableOpacity
                style={styles.deductStockRow}
                onPress={() => setDeductStock(!deductStock)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={deductStock ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={deductStock ? theme.colors.primary : theme.colors.textMuted}
                />
                <Text style={styles.deductStockText}>
                  Descontar automáticamente estos materiales de mi inventario al guardar
                </Text>
              </TouchableOpacity>
            </Card>

            {/* 2. Materiales */}
            <Card style={styles.card}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.cardSectionTitle}>2. Materiales a utilizar</Text>
                <View style={styles.subtotalBadge}>
                  <Text style={styles.materialsSubtotal}>
                    Subtotal: {formatCurrency(confResult ? confResult.materialsCost : 0)}
                  </Text>
                </View>
              </View>

              {materials.map((m) => {
                const lineTotal = (Number(m.quantity) || 0) * (Number(m.unitPrice) || 0);
                return (
                  <View key={m.id} style={styles.materialRow}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.materialName}>{m.name}</Text>
                      <Text style={styles.materialDetails}>
                        {m.quantity} cant. × {formatCurrency(m.unitPrice)} ={' '}
                        {formatCurrency(lineTotal)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveMaterial(m.id)}
                      style={styles.removeMatBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="close-circle" size={24} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                );
              })}

              {/* Agregar material rápido */}
              <View style={styles.addMaterialBox}>
                <Text style={styles.addMaterialTitle}>+ Añadir otro material a este trabajo:</Text>
                <Input
                  placeholder="Nombre (ej. Encaje, Hilo, Entretela)"
                  value={newMatName}
                  onChangeText={setNewMatName}
                />
                <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                  <Input
                    placeholder="Cant. (ej. 2)"
                    keyboardType="numeric"
                    value={newMatQty}
                    onChangeText={setNewMatQty}
                    style={{ flex: 1 }}
                  />
                  <Input
                    placeholder="Precio ($)"
                    keyboardType="numeric"
                    value={newMatPrice}
                    onChangeText={setNewMatPrice}
                    style={{ flex: 1 }}
                  />
                </View>
                <Button
                  title="Añadir Insumo"
                  size="small"
                  variant="outline"
                  onPress={handleAddMaterial}
                />
              </View>
            </Card>

            {/* 3. Mano de obra y tiempo */}
            <Card style={styles.card}>
              <Text style={styles.cardSectionTitle}>3. Tu Tiempo (Mano de Obra)</Text>
              <Text style={styles.fieldHint}>
                ¿Cuántas horas reales tardarás? (Incluye cortar, hilvanar, coser y planchar):
              </Text>

              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <Input
                  label="Horas de trabajo:"
                  placeholder="Ej. 4"
                  keyboardType="numeric"
                  suffix="hrs"
                  value={laborHours}
                  onChangeText={setLaborHours}
                  style={{ flex: 1 }}
                />
                <Input
                  label="Tu pago por hora:"
                  placeholder="Ej. 80"
                  keyboardType="numeric"
                  prefix="$"
                  value={hourlyRate}
                  onChangeText={setHourlyRate}
                  style={{ flex: 1 }}
                />
              </View>

              <View style={styles.laborTotalPill}>
                <Ionicons name="time" size={20} color={theme.colors.labor} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.laborTotalText}>
                    Mano de obra:{' '}
                    <Text style={{ fontWeight: '800' }}>
                      {formatCurrency(confResult ? confResult.laborCost : 0)}
                    </Text>
                    {confResult && confResult.urgencySurchargeAmount > 0 && (
                      <Text style={{ color: '#DC2626', fontWeight: '800' }}>
                        {' '}
                        (+{formatCurrency(confResult.urgencySurchargeAmount)} por urgencia)
                      </Text>
                    )}
                  </Text>
                </View>
              </View>
            </Card>

            {/* 4. Margen de ganancia y desgaste */}
            <Card style={styles.card}>
              <Text style={styles.cardSectionTitle}>4. Ganancia del Taller y Desgaste</Text>

              <View style={{ flexDirection: 'row', gap: theme.spacing.md }}>
                <Input
                  label="Desgaste/Luz (%):"
                  placeholder="10"
                  keyboardType="numeric"
                  suffix="%"
                  value={overheadPercent}
                  onChangeText={setOverheadPercent}
                  helperText="Agujas, luz, hilos extra"
                  style={{ flex: 1 }}
                />

                <Input
                  label="Margen Ganancia (%):"
                  placeholder="30"
                  keyboardType="numeric"
                  suffix="%"
                  value={profitMargin}
                  onChangeText={setProfitMargin}
                  helperText="Fondo libre de ahorro"
                  style={{ flex: 1 }}
                />
              </View>

              {/* Botones rápidos de ganancia */}
              <Text style={styles.quickMarginLabel}>O elige un margen rápido:</Text>
              <View style={styles.quickMarginRow}>
                {['20', '30', '40', '50'].map((pct) => (
                  <TouchableOpacity
                    key={pct}
                    style={[
                      styles.quickMarginBtn,
                      profitMargin === pct && styles.quickMarginBtnActive,
                    ]}
                    onPress={() => setProfitMargin(pct)}
                  >
                    <Text
                      style={[
                        styles.quickMarginText,
                        profitMargin === pct && styles.quickMarginTextActive,
                      ]}
                    >
                      {pct}%
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card>

            {/* RESULTADO FINAL DIDÁCTICO PARA CONFECCIÓN */}
            {confResult && (
              <Card variant="highlight" style={styles.resultCard}>
                <Text style={styles.resultSuperHeader}>PRECIO SUGERIDO A COBRAR</Text>
                <Text style={styles.resultTotalBig}>
                  {formatCurrency(confResult.totalQuote)}
                </Text>

                {confResult.urgencySurchargeAmount > 0 && (
                  <View style={styles.urgencyAlertPill}>
                    <Ionicons name="flash" size={18} color="#DC2626" />
                    <Text style={styles.urgencyAlertText}>
                      Incluye recargo de urgencia ({confResult.urgencyBadge}):{' '}
                      <Text style={{ fontWeight: '900' }}>
                        +{formatCurrency(confResult.urgencySurchargeAmount)} MXN
                      </Text>
                    </Text>
                  </View>
                )}

                <View style={styles.depositBox}>
                  <Ionicons name="shield-checkmark" size={22} color={theme.colors.primaryDark} />
                  <Text style={styles.depositText}>
                    Pide un{' '}
                    <Text style={{ fontWeight: '800' }}>
                      Anticipo del 50% ({formatCurrency(confResult.suggestedDeposit)})
                    </Text>{' '}
                    para comprar telas sin poner de tu bolsa.
                  </Text>
                </View>

                <View style={styles.divider} />

                {/* El semáforo didáctico de tu dinero */}
                <Text style={styles.breakdownHeader}>¿Cómo se reparte este dinero?:</Text>

                <View style={styles.financialRow}>
                  <View
                    style={[styles.financialDot, { backgroundColor: theme.colors.materials }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.financialTitle}>1. Materiales e Insumos</Text>
                    <Text style={styles.financialDesc}>Dinero que repones para tela, cierres y luz</Text>
                  </View>
                  <Text style={styles.financialAmount}>
                    {formatCurrency(confResult.breakdown.toShopSupplies)}
                  </Text>
                </View>

                <View style={styles.financialRow}>
                  <View style={[styles.financialDot, { backgroundColor: theme.colors.labor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.financialTitle}>2. Tu Sueldo por tus Horas</Text>
                    <Text style={styles.financialDesc}>
                      Tu pago directo por coser {confResult.laborHours} horas
                    </Text>
                  </View>
                  <Text style={[styles.financialAmount, { color: theme.colors.labor }]}>
                    {formatCurrency(confResult.breakdown.toPersonalSalary)}
                  </Text>
                </View>

                <View style={styles.financialRow}>
                  <View style={[styles.financialDot, { backgroundColor: theme.colors.profit }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.financialTitle}>3. Ganancia Neta del Negocio</Text>
                    <Text style={styles.financialDesc}>Ahorro limpio para hacer crecer tu taller</Text>
                  </View>
                  <Text style={[styles.financialAmount, { color: theme.colors.profit }]}>
                    +{formatCurrency(confResult.breakdown.toBusinessProfit)}
                  </Text>
                </View>

                {/* Botones de acción principales */}
                <View style={styles.actionButtonsContainer}>
                  <Button
                    title="Compartir por WhatsApp"
                    variant="secondary"
                    icon={<Ionicons name="logo-whatsapp" size={22} color="#FFF" />}
                    onPress={handleShareConfWhatsApp}
                    style={styles.whatsAppBtn}
                  />

                  <Button
                    title="📄 Generar Recibo Formal en PDF"
                    variant="primary"
                    icon={<Ionicons name="document-text-outline" size={22} color="#FFF" />}
                    onPress={handleGenerateConfPDF}
                    style={{ marginTop: theme.spacing.sm, backgroundColor: '#7C3AED' }}
                  />

                  <Button
                    title="🏷️ Mini Boleta para Gancho (PDF)"
                    variant="outline"
                    icon={<Ionicons name="pricetag-outline" size={20} color="#6D28D9" />}
                    onPress={handleGenerateConfHangerTag}
                    style={{
                      marginTop: theme.spacing.sm,
                      borderColor: '#DDD6FE',
                      backgroundColor: '#F5F3FF',
                    }}
                    textStyle={{ color: '#6D28D9', fontWeight: '700' }}
                  />

                  <Button
                    title="Guardar y Agendar Este Trabajo"
                    variant="profit"
                    icon={<Ionicons name="calendar-outline" size={22} color="#FFF" />}
                    onPress={handleSaveConfQuote}
                    style={{ marginTop: theme.spacing.sm }}
                  />
                </View>
              </Card>
            )}
          </View>
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
  modeTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  modeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    backgroundColor: '#F1F5F9',
    gap: 8,
  },
  modeTabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  modeTabText: {
    fontSize: theme.typography.body - 1,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 100,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.materialsLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.md,
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: '#92400E',
  },
  tipDesc: {
    fontSize: theme.typography.caption,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 18,
  },
  card: {
    padding: theme.spacing.md + 2,
    marginBottom: theme.spacing.md,
  },
  cardSectionTitle: {
    fontSize: theme.typography.subtitle - 1,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: theme.spacing.sm,
  },
  activeCountBadge: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeCountText: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
  urgencyContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  urgencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  urgencyTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  urgencyGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  urgencyChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  urgencySubtext: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  urgencyAlertPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.sm,
    gap: 8,
    marginVertical: 6,
  },
  urgencyAlertText: {
    fontSize: theme.typography.caption,
    color: '#991B1B',
  },
  altItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  altItemRowSelected: {
    backgroundColor: '#FAF5FF',
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 6,
  },
  altItemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F3E8FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  altItemName: {
    fontSize: theme.typography.body - 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  altItemNameSelected: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
  },
  altItemDetail: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  altItemUnitPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginTop: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterBtnAdd: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  qtyDisplayBox: {
    minWidth: 26,
    alignItems: 'center',
  },
  qtyDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  qtyDisplayTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '900',
    fontSize: 18,
  },
  customAltBox: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  customAltTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtotalBadge: {
    backgroundColor: theme.colors.materialsLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  materialsSubtotal: {
    fontSize: theme.typography.caption,
    fontWeight: '800',
    color: '#92400E',
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  materialName: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  materialDetails: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  removeMatBtn: {
    padding: 6,
  },
  addMaterialBox: {
    marginTop: theme.spacing.md,
    backgroundColor: theme.colors.surfaceSubtle,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addMaterialTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  fieldHint: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 18,
  },
  laborTotalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.laborLight,
    padding: 12,
    borderRadius: theme.borderRadius.md,
    gap: 10,
    marginTop: 6,
  },
  laborTotalText: {
    fontSize: theme.typography.body - 1,
    color: '#1E40AF',
  },
  quickMarginLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 6,
    marginBottom: 6,
    fontWeight: '600',
  },
  quickMarginRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMarginBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  quickMarginBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  quickMarginText: {
    fontSize: theme.typography.body - 1,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  quickMarginTextActive: {
    color: theme.colors.primaryDark,
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#FAF5FF',
    borderColor: theme.colors.primary,
    borderWidth: 2,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  resultSuperHeader: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 1,
  },
  resultTotalBig: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginVertical: 6,
  },
  depositBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    marginTop: 4,
    width: '100%',
  },
  depositText: {
    flex: 1,
    fontSize: theme.typography.caption + 1,
    color: theme.colors.textPrimary,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#E9D5FF',
    width: '100%',
    marginVertical: theme.spacing.md,
  },
  breakdownHeader: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  financialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  financialDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
  },
  financialTitle: {
    fontSize: theme.typography.body - 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  financialDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  financialAmount: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
  actionButtonsContainer: {
    width: '100%',
    marginTop: theme.spacing.md,
  },
  whatsAppBtn: {
    backgroundColor: '#16A34A',
  },
  deductStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    marginTop: 8,
    gap: 8,
  },
  deductStockText: {
    flex: 1,
    fontSize: theme.typography.caption,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
});
