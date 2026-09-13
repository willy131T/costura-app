import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { formatCurrency } from '../utils/currency';

export const pdfReceiptService = {
  async generateAndShareReceipt(quote) {
    try {
      const folio = (quote.id || 'COT-' + Date.now().toString().slice(-4)).toUpperCase();
      const deposit = quote.depositPaid || quote.suggestedDeposit || (quote.totalQuote * 0.5);
      const remainingBalance = Math.max(0, quote.totalQuote - deposit);

      const isAlteration = quote.type === 'arreglo' || (quote.alterationItems && quote.alterationItems.length > 0);
      const isUrgent = quote.urgencyLevel && quote.urgencyLevel !== 'normal';

      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 32px;
      color: #1F2937;
      background-color: #FFFFFF;
    }
    .header {
      border-bottom: 3px solid #7C3AED;
      padding-bottom: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .workshop-name {
      font-size: 26px;
      font-weight: 800;
      color: #5B21B6;
      margin: 0;
    }
    .workshop-tagline {
      font-size: 13px;
      color: #6B7280;
      margin-top: 4px;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-badge {
      display: inline-block;
      background-color: #EDE9FE;
      color: #7C3AED;
      font-weight: 800;
      font-size: 14px;
      padding: 4px 12px;
      border-radius: 20px;
    }
    .receipt-date {
      font-size: 12px;
      color: #6B7280;
      margin-top: 6px;
    }
    .info-grid {
      display: flex;
      margin-top: 24px;
      gap: 16px;
    }
    .info-box {
      flex: 1;
      background-color: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .info-box-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 800;
      color: #9CA3AF;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    .info-box-content {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
    }
    .info-box-sub {
      font-size: 13px;
      color: #4B5563;
      margin-top: 2px;
    }
    .dates-banner {
      background-color: #EFF6FF;
      border: 1px solid #BFDBFE;
      border-radius: 8px;
      padding: 12px 16px;
      margin-top: 18px;
      display: flex;
      justify-content: space-around;
      text-align: center;
    }
    .date-item-title {
      font-size: 11px;
      font-weight: 800;
      color: #1E40AF;
      text-transform: uppercase;
    }
    .date-item-val {
      font-size: 16px;
      font-weight: 800;
      color: #1D4ED8;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
    }
    th {
      background-color: #F3F4F6;
      text-align: left;
      padding: 10px 14px;
      font-size: 12px;
      font-weight: 800;
      color: #4B5563;
      border-bottom: 2px solid #E5E7EB;
    }
    td {
      padding: 12px 14px;
      font-size: 14px;
      border-bottom: 1px solid #F3F4F6;
      color: #374151;
    }
    .price-col {
      text-align: right;
      font-weight: 700;
    }
    .financial-summary {
      width: 50%;
      margin-left: auto;
      margin-top: 20px;
      background-color: #F9FAFB;
      border-radius: 8px;
      padding: 14px 18px;
      border: 1px solid #E5E7EB;
    }
    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      padding-top: 10px;
      border-top: 2px solid #E5E7EB;
      font-size: 17px;
      font-weight: 800;
      color: #111827;
    }
    .deposit-paid {
      color: #15803D;
      font-weight: 800;
    }
    .balance-pending {
      color: #DC2626;
      font-weight: 800;
    }
    .footer-notes {
      margin-top: 36px;
      padding: 16px;
      background-color: #FEF3C7;
      border-left: 4px solid #F59E0B;
      border-radius: 4px;
      font-size: 12px;
      color: #92400E;
      line-height: 18px;
    }
    .signature-area {
      display: flex;
      justify-content: space-around;
      margin-top: 48px;
      text-align: center;
    }
    .signature-line {
      width: 200px;
      border-top: 1px solid #9CA3AF;
      padding-top: 8px;
      font-size: 12px;
      color: #6B7280;
    }
  </style>
</head>
<body>

  <!-- Encabezado con Membrete -->
  <div class="header">
    <div>
      <h1 class="workshop-name">🧵 Taller de Costura y Confección</h1>
      <div class="workshop-tagline">Confección a la medida, arreglos y alta costura</div>
    </div>
    <div class="receipt-title">
      <div class="receipt-badge" style="${isUrgent ? 'background-color: #FEE2E2; color: #DC2626;' : ''}">
        ${isUrgent ? (quote.urgencyLevel === 'express' ? '⚡ SÚPER EXPRESS' : '⚡ SERVICIO URGENTE') : (isAlteration ? 'ARREGLO DE ROPA' : 'NOTA DE PEDIDO')}
      </div>
      <div class="receipt-date">Folio: ${folio}</div>
      <div class="receipt-date">Fecha: ${quote.date || new Date().toLocaleDateString('es-MX')}</div>
    </div>
  </div>

  <!-- Información de la Clienta y Trabajo -->
  <div class="info-grid">
    <div class="info-box">
      <div class="info-box-title">Clienta</div>
      <div class="info-box-content">${quote.clientName || 'Cliente de Taller'}</div>
      ${quote.clientPhone ? `<div class="info-box-sub">Tel: ${quote.clientPhone}</div>` : ''}
    </div>
    <div class="info-box">
      <div class="info-box-title">Prenda / Trabajo</div>
      <div class="info-box-content">${quote.projectName}</div>
      <div class="info-box-sub">Tipo: ${isAlteration ? '✂️ Arreglo / Compostura' : '👗 Confección a Medida'}</div>
    </div>
  </div>

  <!-- Semáforo de Fechas: Prueba y Entrega -->
  <div class="dates-banner">
    ${!isAlteration ? `
    <div>
      <div class="date-item-title">📍 Fecha de Prueba de Ajuste</div>
      <div class="date-item-val">${quote.fittingDate || 'Por agendar'}</div>
    </div>
    <div style="border-left: 1px solid #BFDBFE; height: 36px;"></div>
    ` : ''}
    <div>
      <div class="date-item-title">🎁 Fecha Prometida de Entrega</div>
      <div class="date-item-val" style="${isUrgent ? 'color: #DC2626;' : ''}">${quote.deliveryDate || 'Por acordar'}</div>
    </div>
  </div>

  <!-- Detalle del Trabajo -->
  <table>
    <thead>
      <tr>
        <th>CONCEPTO</th>
        <th style="width: 25%;">DETALLE</th>
        <th class="price-col" style="width: 25%;">SUBTOTAL</th>
      </tr>
    </thead>
    <tbody>
      ${isAlteration && quote.alterationItems ? (
        quote.alterationItems.map(item => `
        <tr>
          <td><strong>${item.name}</strong><br><span style="font-size:12px; color:#6B7280;">${item.detail || 'Arreglo / Compostura'}</span></td>
          <td>${item.quantity} pza(s) × ${formatCurrency(item.unitPrice)}</td>
          <td class="price-col">${formatCurrency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))} MXN</td>
        </tr>
        `).join('')
      ) : `
        <tr>
          <td><strong>Confección Artesanal a la Medida</strong><br><span style="font-size:12px; color:#6B7280;">Corte, patronaje, hilvanado y costura con acabados finos</span></td>
          <td>Mano de Obra</td>
          <td class="price-col">${formatCurrency(quote.baseLaborCost || quote.laborCost)} MXN</td>
        </tr>
        <tr>
          <td><strong>Materiales e Insumos</strong><br><span style="font-size:12px; color:#6B7280;">Telas de calidad, hilos de alta resistencia y mercería</span></td>
          <td>Insumos</td>
          <td class="price-col">${formatCurrency(quote.materialsCost)} MXN</td>
        </tr>
        ${quote.overheadCost ? `
        <tr>
          <td><strong>Imprevistos y Operación del Taller</strong><br><span style="font-size:12px; color:#6B7280;">Electricidad, desgaste de agujas y mantenimiento</span></td>
          <td>10% Taller</td>
          <td class="price-col">${formatCurrency(quote.overheadCost)} MXN</td>
        </tr>` : ''}
      `}
      ${quote.urgencySurchargeAmount > 0 ? `
      <tr style="background-color: #FEF2F2;">
        <td><strong style="color:#DC2626;">⚡ Recargo por Servicio Urgente (${quote.urgencyBadge || 'Urgente'})</strong><br><span style="font-size:12px; color:#991B1B;">Prioridad especial de entrega (+${quote.urgencySurchargePct}%)</span></td>
        <td style="color:#DC2626;">Urgencia</td>
        <td class="price-col" style="color:#DC2626;">+${formatCurrency(quote.urgencySurchargeAmount)} MXN</td>
      </tr>
      ` : ''}
    </tbody>
  </table>

  <!-- Resumen Financiero: Total, Anticipo y Saldo -->
  <div class="financial-summary">
    <div class="summary-row">
      <span>Presupuesto Total:</span>
      <span style="font-weight: 700;">${formatCurrency(quote.totalQuote)} MXN</span>
    </div>
    <div class="summary-row">
      <span class="deposit-paid">🤝 Anticipo Recibido:</span>
      <span class="deposit-paid">- ${formatCurrency(deposit)} MXN</span>
    </div>
    <div class="total-row">
      <span class="balance-pending">Restante a Pagar:</span>
      <span class="balance-pending">${formatCurrency(remainingBalance)} MXN</span>
    </div>
  </div>

  <!-- Notas de Taller -->
  <div class="footer-notes">
    <strong>📌 Recordatorio para la clienta:</strong>
    <ul>
      <li>Para su cita de prueba de ajuste, favor de traer los zapatos y ropa interior que usará con la prenda para verificar el largo exacto.</li>
      <li>El saldo restante se liquida al recibir la prenda en el taller.</li>
      <li>¡Agradecemos su preferencia y confianza en el trabajo artesanal hecho con amor y esmero! 🪡</li>
    </ul>
  </div>

  <!-- Firmas -->
  <div class="signature-area">
    <div class="signature-line">Firma del Taller</div>
    <div class="signature-line">Conformidad de la Clienta</div>
  </div>

</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Recibo de Costura - ${quote.clientName || 'Cliente'}`,
        });
      } else {
        Alert.alert('PDF Generado', `El recibo se generó exitosamente en: ${uri}`);
      }
    } catch (error) {
      console.log('Error generando recibo PDF:', error);
      Alert.alert('Error', 'No se pudo generar el comprobante PDF: ' + error.message);
    }
  },

  /**
   * Genera una Mini Boleta de Taller imprimible/recortable para prender al gancho con alfiler
   */
  async generateHangerTagPDF(quote) {
    try {
      const folio = (quote.id || 'COT-' + Date.now().toString().slice(-4)).toUpperCase();
      const deposit = quote.depositPaid || quote.suggestedDeposit || (quote.totalQuote * 0.5);
      const remainingBalance = Math.max(0, quote.totalQuote - deposit);
      const isAlteration = quote.type === 'arreglo' || (quote.alterationItems && quote.alterationItems.length > 0);
      const isUrgent = quote.urgencyLevel && quote.urgencyLevel !== 'normal';

      const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 24px;
      color: #0F172A;
      background-color: #FFFFFF;
    }
    .ticket-container {
      border: 3px dashed #64748B;
      border-radius: 12px;
      padding: 20px;
      max-width: 440px;
      margin: 0 auto;
      background-color: #FAFAFA;
    }
    .pin-target {
      text-align: center;
      margin-bottom: 12px;
    }
    .pin-hole {
      display: inline-block;
      width: 22px;
      height: 22px;
      border: 2px dashed #94A3B8;
      border-radius: 50%;
      background: #FFFFFF;
    }
    .pin-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748B;
      font-weight: 700;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .ticket-header {
      text-align: center;
      border-bottom: 2px solid #E2E8F0;
      padding-bottom: 12px;
    }
    .ticket-title {
      font-size: 18px;
      font-weight: 900;
      color: #7C3AED;
      margin: 0;
    }
    .ticket-subtitle {
      font-size: 11px;
      color: #64748B;
      font-weight: 700;
      margin-top: 2px;
    }
    .folio-badge {
      display: inline-block;
      background-color: #0F172A;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 15px;
      padding: 4px 14px;
      border-radius: 6px;
      margin-top: 8px;
    }
    .client-card {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      margin-top: 14px;
    }
    .field-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #94A3B8;
      letter-spacing: 0.5px;
    }
    .client-name {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
      margin-top: 2px;
    }
    .client-phone {
      font-size: 13px;
      font-weight: 700;
      color: #2563EB;
      margin-top: 2px;
    }
    .date-box {
      background-color: ${isUrgent ? '#FEE2E2' : '#FEF3C7'};
      border: 2px solid ${isUrgent ? '#EF4444' : '#F59E0B'};
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 12px;
      text-align: center;
    }
    .date-title {
      font-size: 11px;
      font-weight: 800;
      color: ${isUrgent ? '#991B1B' : '#92400E'};
      text-transform: uppercase;
    }
    .date-value {
      font-size: 18px;
      font-weight: 900;
      color: ${isUrgent ? '#DC2626' : '#B45309'};
      margin-top: 2px;
    }
    .urgency-badge {
      display: inline-block;
      background-color: #DC2626;
      color: #FFFFFF;
      font-weight: 900;
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 4px;
    }
    .tasks-section {
      background: #FFFFFF;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px;
      margin-top: 12px;
    }
    .tasks-title {
      font-size: 12px;
      font-weight: 800;
      color: #334155;
      text-transform: uppercase;
      margin-bottom: 8px;
      border-bottom: 1px solid #F1F5F9;
      padding-bottom: 4px;
    }
    .task-item {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
      font-size: 14px;
      color: #1E293B;
    }
    .checkbox-box {
      width: 18px;
      height: 18px;
      border: 2px solid #64748B;
      border-radius: 4px;
      margin-right: 10px;
      flex-shrink: 0;
    }
    .money-summary {
      background-color: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 8px;
      padding: 10px 14px;
      margin-top: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .money-label {
      font-size: 12px;
      color: #64748B;
      font-weight: 700;
    }
    .money-pending {
      font-size: 18px;
      font-weight: 900;
      color: #DC2626;
    }
    .cut-line-notice {
      text-align: center;
      font-size: 10px;
      color: #94A3B8;
      margin-top: 14px;
      font-style: italic;
    }
  </style>
</head>
<body>

  <div class="ticket-container">
    <div class="pin-target">
      <div class="pin-hole"></div>
      <div class="pin-label">📌 Prender aquí al gancho</div>
    </div>

    <div class="ticket-header">
      <h2 class="ticket-title">🧵 TALLER DE COSTURA</h2>
      <div class="ticket-subtitle">CONTROL DE PRENDAS Y GANCHOS</div>
      <div class="folio-badge">FOLIO: ${folio}</div>
    </div>

    <!-- Clienta -->
    <div class="client-card">
      <div class="field-label">Clienta:</div>
      <div class="client-name">${quote.clientName || 'Cliente de Taller'}</div>
      ${quote.clientPhone ? `<div class="client-phone">📱 ${quote.clientPhone}</div>` : ''}
    </div>

    <!-- Fecha de entrega destacada -->
    <div class="date-box">
      <div class="date-title">🎁 Entregar el día:</div>
      <div class="date-value">${quote.deliveryDate || 'Por acordar'}</div>
      ${isUrgent ? `<div class="urgency-badge">⚡ ${quote.urgencyBadge || 'URGENTE'}</div>` : ''}
    </div>

    <!-- Lista de prendas / trabajos con checkbox -->
    <div class="tasks-section">
      <div class="tasks-title">Prendas y Trabajos a Realizar:</div>
      ${isAlteration && quote.alterationItems && quote.alterationItems.length > 0 ? (
        quote.alterationItems.map(it => `
          <div class="task-item">
            <div class="checkbox-box"></div>
            <div>
              <strong>${it.quantity}x ${it.name}</strong>
              <div style="font-size:11px; color:#64748B;">${it.detail || 'Compostura'}</div>
            </div>
          </div>
        `).join('')
      ) : `
        <div class="task-item">
          <div class="checkbox-box"></div>
          <div>
            <strong>${quote.projectName}</strong>
            <div style="font-size:11px; color:#64748B;">Confección a la medida</div>
          </div>
        </div>
      `}
    </div>

    <!-- Saldo por Cobrar -->
    <div class="money-summary">
      <div>
        <div class="money-label">Total: ${formatCurrency(quote.totalQuote)}</div>
        <div class="money-label" style="color:#15803D;">Anticipo: -${formatCurrency(deposit)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px; font-weight:800; color:#DC2626; text-transform:uppercase;">Por Cobrar:</div>
        <div class="money-pending">${formatCurrency(remainingBalance)} MXN</div>
      </div>
    </div>

    <div class="cut-line-notice">
      ✂️ Recortar por la línea punteada y colocar en el gancho de la prenda
    </div>
  </div>

</body>
</html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: `Boleta de Gancho - ${quote.clientName || 'Prenda'}`,
        });
      } else {
        Alert.alert('Boleta Generada', `La boleta de gancho se generó en: ${uri}`);
      }
    } catch (error) {
      console.log('Error generando boleta de gancho:', error);
      Alert.alert('Error', 'No se pudo generar la boleta de gancho: ' + error.message);
    }
  }
};
