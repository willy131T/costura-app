import { collection, addDoc, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db, isMockMode } from './firebase.js';

let localQuotes = [
  {
    id: 'q1',
    projectName: 'Vestido de Fiesta en Lino y Encaje',
    clientName: 'Sra. Carmen Morales',
    date: new Date(Date.now() - 86400000 * 2).toLocaleDateString('es-MX'),
    materialsCost: 450.00,
    laborCost: 400.00,
    overheadCost: 85.00,
    profitAmount: 280.50,
    totalQuote: 1215.50,
    suggestedDeposit: 607.75,
    laborHours: 5,
    hourlyRate: 80,
    profitMarginPercent: 30,
    breakdown: {
      toShopSupplies: 535.00,
      toPersonalSalary: 400.00,
      toBusinessProfit: 280.50
    }
  }
];

export const ALTERATION_PRESETS = [
  {
    id: 'dobladillo_sencillo',
    name: 'Dobladillo / Bastilla sencilla',
    detail: 'Pantalón de vestir, mezclilla simple o falda',
    defaultPrice: 40,
    icon: 'cut-outline',
  },
  {
    id: 'dobladillo_mezclilla',
    name: 'Dobladillo original mezclilla',
    detail: 'Conserva orilla y deslavado de fábrica',
    defaultPrice: 50,
    icon: 'shirt-outline',
  },
  {
    id: 'cierre_pantalon',
    name: 'Cambio de cierre (Pantalón / Falda)',
    detail: 'Descoser, alinear y coser cierre nuevo',
    defaultPrice: 60,
    icon: 'repeat-outline',
  },
  {
    id: 'cierre_chamarra',
    name: 'Cambio de cierre chamarra',
    detail: 'Chamarra, sudadera gruesa o chamarrón',
    defaultPrice: 90,
    icon: 'shield-outline',
  },
  {
    id: 'entalle_cintura',
    name: 'Meter cintura / Entalle de costados',
    detail: 'Ajuste de silueta en pantalón, falda o blusa',
    defaultPrice: 70,
    icon: 'body-outline',
  },
  {
    id: 'subir_mangas',
    name: 'Subir mangas / Ajuste de hombro',
    detail: 'Camisa, saco o blusa',
    defaultPrice: 65,
    icon: 'bowtie-outline',
  },
  {
    id: 'parches_refuerzo',
    name: 'Parches / Refuerzo entrepierna',
    detail: 'Zurcido invisible o parche reforzado',
    defaultPrice: 40,
    icon: 'bandage-outline',
  },
  {
    id: 'botones_broches',
    name: 'Pegar botones / Broches de presión',
    detail: 'Juego de botones o reposición firme',
    defaultPrice: 30,
    icon: 'radio-button-on-outline',
  },
];

export const URGENCY_LEVELS = {
  normal: {
    id: 'normal',
    label: 'Normal',
    badge: '🟢 Normal',
    subtitle: 'Fecha acordada',
    surchargePct: 0,
    multiplier: 1.0,
  },
  urgente: {
    id: 'urgente',
    label: 'Urgente',
    badge: '🟡 Urgente',
    subtitle: '24 a 48 hrs (+30%)',
    surchargePct: 30,
    multiplier: 1.3,
  },
  express: {
    id: 'express',
    label: 'Súper Express',
    badge: '🔴 Súper Express',
    subtitle: 'Mismo día (+50%)',
    surchargePct: 50,
    multiplier: 1.5,
  },
};

export const pricingService = {
  /**
   * Calcula el cobro para arreglos rápidos y composturas sencillas
   */
  calculateAlterations({
    items = [],
    urgencyLevel = 'normal',
  }) {
    // 1. Subtotal de los arreglos seleccionados
    const activeItems = items.filter(it => (Number(it.quantity) || 0) > 0);
    const subtotal = activeItems.reduce((sum, it) => {
      const qty = Number(it.quantity) || 0;
      const price = Number(it.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    // 2. Recargo por urgencia
    const urgency = URGENCY_LEVELS[urgencyLevel] || URGENCY_LEVELS.normal;
    const urgencySurchargePct = urgency.surchargePct;
    const urgencySurchargeAmount = Math.round(subtotal * (urgencySurchargePct / 100) * 100) / 100;

    // 3. Total final
    const totalQuote = Math.round((subtotal + urgencySurchargeAmount) * 100) / 100;

    // 4. Anticipo sugerido (si es <= $100 se sugiere pago completo, sino 50%)
    const suggestedDeposit = totalQuote <= 100 ? totalQuote : Math.round((totalQuote * 0.5) * 100) / 100;

    return {
      subtotal,
      urgencyLevel,
      urgencyBadge: urgency.badge,
      urgencySubtitle: urgency.subtitle,
      urgencySurchargePct,
      urgencySurchargeAmount,
      totalQuote,
      suggestedDeposit,
      itemsCount: activeItems.reduce((acc, it) => acc + (Number(it.quantity) || 0), 0),
      items: activeItems,
    };
  },

  /**
   * Calcula el cobro integral de confección a medida asegurando margen real y urgencia
   */
  calculate({
    materials = [],
    laborHours = 0,
    hourlyRate = 80, // Tarifa base sugerida por hora
    overheadPercent = 10, // 10% de desgaste de taller, agujas y luz
    profitMarginPercent = 30, // 30% de ganancia limpia
    urgencyLevel = 'normal',
  }) {
    // 1. Costo total de materiales
    const materialsCost = materials.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      return sum + (qty * price);
    }, 0);

    // 2. Costo de mano de obra base
    const hours = Number(laborHours) || 0;
    const rate = Number(hourlyRate) || 0;
    const baseLaborCost = hours * rate;

    // 3. Recargo de urgencia sobre mano de obra
    const urgency = URGENCY_LEVELS[urgencyLevel] || URGENCY_LEVELS.normal;
    const urgencySurchargePct = urgency.surchargePct;
    const urgencySurchargeAmount = Math.round(baseLaborCost * (urgencySurchargePct / 100) * 100) / 100;
    const laborCost = baseLaborCost + urgencySurchargeAmount;

    // 4. Costo directo
    const directCost = materialsCost + laborCost;

    // 5. Desgaste de máquinas, luz, hilo e imprevistos
    const overheadPct = Number(overheadPercent) || 0;
    const overheadCost = directCost * (overheadPct / 100);

    // 6. Costo base de producción
    const baseCost = directCost + overheadCost;

    // 7. Ganancia neta para el negocio
    const profitPct = Number(profitMarginPercent) || 0;
    const profitAmount = baseCost * (profitPct / 100);

    // 8. Precio final total
    const totalQuote = Math.round((baseCost + profitAmount) * 100) / 100;

    // 9. Anticipo sugerido (50%) para cubrir materiales antes de coser
    const suggestedDeposit = Math.round((totalQuote * 0.5) * 100) / 100;

    // 10. Desglose pedagógico para la costurera
    const breakdown = {
      toShopSupplies: Math.round((materialsCost + overheadCost) * 100) / 100, // Dinero intocable para reponer
      toPersonalSalary: Math.round(laborCost * 100) / 100,                   // Sueldo por sus horas (+ urgencia)
      toBusinessProfit: Math.round(profitAmount * 100) / 100,                 // Ahorro y ganancia pura
    };

    return {
      materialsCost,
      baseLaborCost,
      laborCost,
      urgencyLevel,
      urgencyBadge: urgency.badge,
      urgencySubtitle: urgency.subtitle,
      urgencySurchargePct,
      urgencySurchargeAmount,
      overheadCost,
      baseCost,
      profitAmount,
      totalQuote,
      suggestedDeposit,
      laborHours: hours,
      hourlyRate: rate,
      overheadPercent: overheadPct,
      profitMarginPercent: profitPct,
      breakdown,
    };
  },

  async getSavedQuotes() {
    if (isMockMode || !db) return [...localQuotes];
    try {
      const snap = await getDocs(collection(db, 'quotes'));
      if (snap.empty) return [...localQuotes];
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.log('ℹ️ Usando cotizaciones locales:', e.message);
      return [...localQuotes];
    }
  },

  async saveQuote(quoteData) {
    const item = {
      ...quoteData,
      createdAt: new Date().toISOString(),
      date: new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
    };

    if (isMockMode || !db) {
      const saved = { id: 'q_' + Date.now(), ...item };
      localQuotes.unshift(saved);
      return saved;
    }

    try {
      const ref = await addDoc(collection(db, 'quotes'), item);
      return { id: ref.id, ...item };
    } catch (e) {
      const saved = { id: 'q_' + Date.now(), ...item };
      localQuotes.unshift(saved);
      return saved;
    }
  },

  async updateQuoteStatus(quoteId, newStatus) {
    // Actualizar local
    localQuotes = localQuotes.map(q => q.id === quoteId ? { ...q, status: newStatus } : q);

    if (!isMockMode && db) {
      try {
        await updateDoc(doc(db, 'quotes', quoteId), { status: newStatus });
      } catch (e) {
        console.log('ℹ️ Error actualizando estado en Firestore:', e.message);
      }
    }
    return true;
  },

  async updateQuote(quoteId, updates) {
    localQuotes = localQuotes.map(q => q.id === quoteId ? { ...q, ...updates } : q);

    if (!isMockMode && db) {
      try {
        await updateDoc(doc(db, 'quotes', quoteId), updates);
      } catch (e) {
        console.log('ℹ️ Error actualizando cotización en Firestore:', e.message);
      }
    }
    return true;
  }
};
