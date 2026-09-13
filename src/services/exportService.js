import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export const exportService = {
  /**
   * Exporta la lista de clientas con sus medidas corporales a un archivo Excel (.csv con UTF-8 BOM)
   */
  async exportClientsToExcel(clients = []) {
    try {
      if (!clients || clients.length === 0) {
        Alert.alert('Sin clientas', 'No tienes clientas registradas para exportar.');
        return false;
      }

      const headers = [
        'Nombre de la Clienta',
        'Teléfono / WhatsApp',
        'Busto',
        'Cintura',
        'Cadera',
        'Largo Talle',
        'Largo Falda',
        'Espalda',
        'Notas / Preferencias',
        'Fecha de Registro'
      ];

      const rows = clients.map(c => {
        const m = c.measurements || {};
        return [
          `"${(c.name || '').replace(/"/g, '""')}"`,
          `"${(c.phone || '').replace(/"/g, '""')}"`,
          `"${(m.busto || '-').replace(/"/g, '""')}"`,
          `"${(m.cintura || '-').replace(/"/g, '""')}"`,
          `"${(m.cadera || '-').replace(/"/g, '""')}"`,
          `"${(m.largoTalle || '-').replace(/"/g, '""')}"`,
          `"${(m.largoFalda || '-').replace(/"/g, '""')}"`,
          `"${(m.espalda || '-').replace(/"/g, '""')}"`,
          `"${(c.notes || '').replace(/"/g, '""')}"`,
          `"${(c.createdAt ? new Date(c.createdAt).toLocaleDateString('es-MX') : '-').replace(/"/g, '""')}"`,
        ].join(',');
      });

      // \uFEFF es el BOM (Byte Order Mark) para que Microsoft Excel lo abra en UTF-8 con acentos correctos
      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');

      const fileName = `Clientas_Taller_Costura_${Date.now().toString().slice(-4)}.csv`;
      const fileUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Libreta de Clientas a Excel',
          UTI: 'public.comma-separated-values-text',
        });
        return true;
      } else {
        Alert.alert('Archivo generado', `Tu archivo de Excel se guardó en: ${fileUri}`);
        return true;
      }
    } catch (e) {
      console.log('Error exportando clientas a Excel:', e);
      Alert.alert('Error al exportar', 'No se pudo generar el archivo de Excel: ' + e.message);
      return false;
    }
  },

  /**
   * Exporta el historial de cotizaciones, pedidos y finanzas a Excel (.csv con UTF-8 BOM)
   */
  async exportQuotesToExcel(quotes = []) {
    try {
      if (!quotes || quotes.length === 0) {
        Alert.alert('Sin registros', 'Aún no hay cotizaciones o pedidos guardados para exportar.');
        return false;
      }

      const headers = [
        'Folio',
        'Fecha',
        'Tipo de Trabajo',
        'Prenda / Proyecto',
        'Clienta',
        'Teléfono',
        'Estado',
        'Total Cotizado ($)',
        'Anticipo Recibido ($)',
        'Saldo Pendiente ($)',
        'Materiales ($)',
        'Mano de Obra ($)',
        'Urgencia',
        'Recargo Urgencia ($)',
        'Fecha de Entrega',
        'Fecha de Prueba'
      ];

      const rows = quotes.map(q => {
        const deposit = Number(q.depositPaid) || Number(q.suggestedDeposit) || 0;
        const total = Number(q.totalQuote) || 0;
        const balance = Math.max(0, total - deposit);
        const folio = (q.id || 'COT').toUpperCase();
        const tipo = q.type === 'arreglo' ? 'Arreglo / Compostura' : 'Confección a la Medida';
        const estado = q.status === 'entregado' ? 'Entregado y Cobrado' : q.status === 'prueba_lista' ? 'Prueba Lista' : 'En Proceso';

        return [
          `"${folio}"`,
          `"${q.date || '-'}"`,
          `"${tipo}"`,
          `"${(q.projectName || '').replace(/"/g, '""')}"`,
          `"${(q.clientName || 'Cliente').replace(/"/g, '""')}"`,
          `"${(q.clientPhone || '').replace(/"/g, '""')}"`,
          `"${estado}"`,
          total,
          deposit,
          balance,
          Number(q.materialsCost) || 0,
          Number(q.laborCost) || 0,
          `"${q.urgencyBadge || 'Normal'}"`,
          Number(q.urgencySurchargeAmount) || 0,
          `"${q.deliveryDate || 'Por acordar'}"`,
          `"${q.fittingDate || 'N/A'}"`,
        ].join(',');
      });

      const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
      const fileName = `Cuentas_Taller_Costura_${Date.now().toString().slice(-4)}.csv`;
      const fileUri = `${FileSystem.cacheDirectory || FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar Cuentas del Taller a Excel',
          UTI: 'public.comma-separated-values-text',
        });
        return true;
      } else {
        Alert.alert('Archivo generado', `Tu reporte financiero se guardó en: ${fileUri}`);
        return true;
      }
    } catch (e) {
      console.log('Error exportando cuentas a Excel:', e);
      Alert.alert('Error al exportar', 'No se pudo generar el reporte: ' + e.message);
      return false;
    }
  }
};
