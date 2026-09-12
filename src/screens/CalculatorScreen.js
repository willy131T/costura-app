import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { Header } from '../components/common/Header';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { pricingService } from '../services/pricingService';
import { formatCurrency } from '../utils/currency';

export default function CalculatorScreen({ navigation }) {
  // Datos del proyecto
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');

  // Materiales de este proyecto
  const [materials, setMaterials] = useState([
    { id: '1', name: 'Tela principal', quantity: '2.5', unitPrice: '120' },
    { id: '2', name: 'Cierre o botones', quantity: '1', unitPrice: '25' },
  ]);

  // Campos temporales para nuevo material
  const [newMatName, setNewMatName] = useState('');
  const [newMatQty, setNewMatQty] = useState('');
  const [newMatPrice, setNewMatPrice] = useState('');

  // Mano de obra y factores
  const [laborHours, setLaborHours] = useState('4');
  const [hourlyRate, setHourlyRate] = useState('80'); // Tarifa base recomendada por hora
  const [overheadPercent, setOverheadPercent] = useState('10'); // Desgaste taller / luz
  const [profitMargin, setProfitMargin] = useState('30'); // Margen de ganancia

  // Estado del resultado calculado
  const [result, setResult] = useState(null);

  // Recalcular automáticamente en tiempo real
  useEffect(() => {
    const formattedMaterials = materials.map(m => ({
      name: m.name,
      quantity: Number(m.quantity) || 0,
      unitPrice: Number(m.unitPrice) || 0,
    }));

    const calculated = pricingService.calculate({
      materials: formattedMaterials,
      laborHours: Number(laborHours) || 0,
      hourlyRate: Number(hourlyRate) || 0,
      overheadPercent: Number(overheadPercent) || 0,
      profitMarginPercent: Number(profitMargin) || 0,
    });

    setResult(calculated);
  }, [materials, laborHours, hourlyRate, overheadPercent, profitMargin]);

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
    setMaterials(materials.filter(m => m.id !== id));
  };

  const handleSaveQuote = async () => {
    if (!projectName.trim()) {
      Alert.alert('Falta nombre', 'Por favor dale un nombre al trabajo (ej. "Vestido de fiesta azul").');
      return;
    }

    try {
      await pricingService.saveQuote({
        projectName: projectName.trim(),
        clientName: clientName.trim(),
        materials,
        laborHours: Number(laborHours),
        hourlyRate: Number(hourlyRate),
        overheadPercent: Number(overheadPercent),
        profitMarginPercent: Number(profitMargin),
        ...result,
      });

      Alert.alert(
        '¡Cotización Guardada!',
        `El trabajo "${projectName}" se guardó correctamente con un cobro sugerido de ${formatCurrency(result.totalQuote)}.`,
        [{ text: 'Entendido', onPress: () => navigation.navigate('Inicio') }]
      );
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar la cotización: ' + e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Cotizador Inteligente"
        subtitle="Aprende a cobrar lo justo y gana dinero"
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Consejo Superior Didáctico */}
        <View style={styles.tipBox}>
          <Ionicons name="bulb" size={24} color={theme.colors.materials} />
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>La Regla de Oro de la Costurera:</Text>
            <Text style={styles.tipDesc}>
              Nunca cobres solo la tela. Tu experiencia, tus horas cosiendo y el desgaste de tus máquinas valen.
            </Text>
          </View>
        </View>

        {/* 1. Datos del trabajo */}
        <Card style={styles.card}>
          <Text style={styles.cardSectionTitle}>1. ¿Qué prenda o trabajo es?</Text>
          <Input
            label="Nombre del trabajo:"
            placeholder="Ej. Vestido de XV años, Dobladillo de pantalón"
            value={projectName}
            onChangeText={setProjectName}
          />
          <Input
            label="Nombre del cliente (opcional):"
            placeholder="Ej. Sra. María Elena"
            value={clientName}
            onChangeText={setClientName}
            style={{ marginBottom: 0 }}
          />
        </Card>

        {/* 2. Materiales */}
        <Card style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.cardSectionTitle}>2. Materiales que vas a usar</Text>
            <Text style={styles.materialsSubtotal}>
              Subtotal: {formatCurrency(result ? result.materialsCost : 0)}
            </Text>
          </View>

          {materials.map((m) => {
            const lineTotal = (Number(m.quantity) || 0) * (Number(m.unitPrice) || 0);
            return (
              <View key={m.id} style={styles.materialRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.materialName}>{m.name}</Text>
                  <Text style={styles.materialDetails}>
                    {m.quantity} cant. × {formatCurrency(m.unitPrice)} = {formatCurrency(lineTotal)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveMaterial(m.id)}
                  style={styles.removeMatBtn}
                >
                  <Ionicons name="close-circle" size={22} color={theme.colors.error} />
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
            <Ionicons name="time" size={18} color={theme.colors.labor} />
            <Text style={styles.laborTotalText}>
              Pago justo por tu tiempo: <Text style={{ fontWeight: '800' }}>{formatCurrency(result ? result.laborCost : 0)}</Text>
            </Text>
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

        {/* RESULTADO FINAL DIDÁCTICO */}
        {result && (
          <Card variant="highlight" style={styles.resultCard}>
            <Text style={styles.resultSuperHeader}>PRECIO SUGERIDO A COBRAR</Text>
            <Text style={styles.resultTotalBig}>
              {formatCurrency(result.totalQuote)}
            </Text>

            <View style={styles.depositBox}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.primaryDark} />
              <Text style={styles.depositText}>
                Pide un <Text style={{ fontWeight: '800' }}>Anticipo del 50% ({formatCurrency(result.suggestedDeposit)})</Text> para comprar telas sin poner de tu bolsa.
              </Text>
            </View>

            <View style={styles.divider} />

            {/* El semáforo didáctico de tu dinero */}
            <Text style={styles.breakdownHeader}>¿Cómo se reparte este dinero?:</Text>

            <View style={styles.financialRow}>
              <View style={[styles.financialDot, { backgroundColor: theme.colors.materials }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.financialTitle}>1. Materiales e Insumos</Text>
                <Text style={styles.financialDesc}>Dinero que repones para tela, cierres y luz</Text>
              </View>
              <Text style={styles.financialAmount}>
                {formatCurrency(result.breakdown.toShopSupplies)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <View style={[styles.financialDot, { backgroundColor: theme.colors.labor }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.financialTitle}>2. Tu Sueldo por tus Horas</Text>
                <Text style={styles.financialDesc}>Tu pago directo por coser {result.laborHours} horas</Text>
              </View>
              <Text style={[styles.financialAmount, { color: theme.colors.labor }]}>
                {formatCurrency(result.breakdown.toPersonalSalary)}
              </Text>
            </View>

            <View style={styles.financialRow}>
              <View style={[styles.financialDot, { backgroundColor: theme.colors.profit }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.financialTitle}>3. Ganancia Neta del Negocio</Text>
                <Text style={styles.financialDesc}>Ahorro limpio para hacer crecer tu taller</Text>
              </View>
              <Text style={[styles.financialAmount, { color: theme.colors.profit }]}>
                +{formatCurrency(result.breakdown.toBusinessProfit)}
              </Text>
            </View>

            <Button
              title="Guardar Esta Cotización"
              variant="profit"
              icon={<Ionicons name="save-outline" size={22} color="#FFF" />}
              onPress={handleSaveQuote}
              style={{ marginTop: theme.spacing.md }}
            />
          </Card>
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
  scrollContent: {
    padding: theme.spacing.md,
    paddingBottom: 50,
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.materialsLight,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    gap: 12,
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
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  cardSectionTitle: {
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: theme.spacing.sm,
  },
  materialsSubtotal: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.materials,
  },
  materialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
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
  },
  laborTotalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.laborLight,
    padding: 10,
    borderRadius: theme.borderRadius.sm,
    gap: 8,
    marginTop: 4,
  },
  laborTotalText: {
    fontSize: theme.typography.caption + 1,
    color: '#1E40AF',
  },
  quickMarginLabel: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 6,
  },
  quickMarginRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickMarginBtn: {
    flex: 1,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickMarginBtnActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  quickMarginText: {
    fontSize: theme.typography.caption + 1,
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
  },
  resultSuperHeader: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '800',
    color: theme.colors.primaryDark,
    letterSpacing: 1,
  },
  resultTotalBig: {
    fontSize: 34,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    marginVertical: 6,
  },
  depositBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: theme.borderRadius.md,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
    marginTop: 4,
  },
  depositText: {
    flex: 1,
    fontSize: theme.typography.caption,
    color: theme.colors.textPrimary,
    lineHeight: 18,
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
    padding: 10,
    borderRadius: theme.borderRadius.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  financialDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  financialTitle: {
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  financialDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  financialAmount: {
    fontSize: theme.typography.body,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginLeft: 8,
  },
});
