# 🪡 CosturaApp - Sistema Integral para Taller de Costura y Confección

Aplicación móvil desarrollada con **React Native (Expo SDK 57)**, **React Navigation v7** y **Firebase Firestore** en Modo Producción, especialmente diseñada para talleres de costura, modistas y sastrerías artesanales.

Permite calcular presupuestos justos, gestionar composturas rápidas en segundos, registrar medidas corporales de clientas con fotos de diseños, controlar el inventario de telas con fotografías reales, y emitir comprobantes de pedido en PDF con avisos automáticos por WhatsApp.

---

## 🌟 Características Principales

### 1. ✂️ Arreglos Rápidos y Composturas
- **Catálogo de servicios comunes** con precios de mercado sugeridos:
  - Dobladillo / Bastilla sencilla de pantalón o falda ($40 MXN)
  - Dobladillo original de mezclilla conservando orilla de fábrica ($50 MXN)
  - Cambio de cierre en pantalón o falda ($60 MXN)
  - Cambio de cierre en chamarra o chamarrón ($90 MXN)
  - Meter cintura / Entalle de costados ($70 MXN)
  - Subir mangas / Ajuste de hombros ($65 MXN)
  - Parches, zurcidos y refuerzo de entrepierna ($40 MXN)
  - Pegar botones o broches de presión ($30 MXN)
- Contadores rápidos `+` / `-` para registrar prendas en un toque.
- Posibilidad de agregar arreglos personalizados al vuelo.

### 2. 👗 Confección a la Medida y Alta Costura
- Cotizador profesional de prendas complejas (vestidos de fiesta, XV años, novias, disfraces).
- Cálculo detallado de metros de tela e insumos de mercería.
- **Desglose didáctico de finanzas:**
  1. *Materiales y Desgaste:* Fondo intocable para reponer telas, hilos, agujas y luz.
  2. *Sueldo por tus Horas:* Pago justo por el tiempo dedicado al corte y costura.
  3. *Ganancia Neta:* Fondo libre de ahorro para reinversión y crecimiento del taller.
- Descuento automático de existencias del inventario al agendar el trabajo.

### 3. ⚡ Calculador de Recargos por Urgencia
- 🟢 **Normal (Fecha acordada):** Tarifa estándar sin costo extra.
- 🟡 **Urgente (24 a 48 hrs):** **+30%** sobre la mano de obra por acelerar tiempos.
- 🔴 **Súper Express (Mismo día / Hoy):** **+50%** por prioridad inmediata y trabajo fuera de horario.
- El presupuesto desglosa el costo del arreglo y el importe correspondiente a la urgencia.

### 4. 🏠 Agenda de Entregas con Semáforo de Prioridades
- Semáforo visual en la pantalla de Inicio:
  - 🔴 **Urgente:** Entrega para hoy, mañana o 2 días.
  - 🟡 **Esta semana:** Entrega programada entre 3 y 7 días.
  - 🟢 **En tiempo:** Entrega con más de una semana de margen.
- **Flujo de estados de taller:** `En Confección / Arreglo` ➔ `Prueba Lista` ➔ `Entregado y Cobrado`.
- Registro de anticipos pagados y cálculo automático del saldo pendiente por cobrar.

### 5. 📏 Libreta Digital de Medidas y Clientas
- Directorio de clientas con teléfono de WhatsApp y notas personales.
- Ficha de medidas anatómicas completas (busto, cintura, cadera, talle delantero/espalda, largo falda/manga, puño, etc.).
- **Toma de fotografías:** Permite tomar fotos con la cámara o seleccionar de la galería para guardar bocetos, muestras y pruebas de vestidos.

### 6. 📦 Control de Inventario con Fotografías Reales
- Inventario de telas con metros disponibles, precio por metro y proveedor.
- **Fotografía de la tela:** Toma foto del rollo o muestra para identificarla visualmente.
- Visor a pantalla completa para examinar texturas y colores.
- Alerta visual automática cuando el stock es menor a 2 metros.
- Inventario de hilos, cierres, botones y mercería básica.

### 7. 📄 Recibos Formales en PDF
- Generación de comprobante con membrete formal del taller, número de folio y fecha.
- Desglose adaptativo: tabla de arreglos o de confección a medida.
- Distintivo visual para servicios urgentes.
- Anticipo abonado, saldo pendiente y espacio para firmas.
- Compartir directo por WhatsApp o imprimir desde el celular.

### 8. 📲 Notificaciones Automáticas por WhatsApp
- **Compartir Presupuesto:** Envía el desglose formal de la prenda a la clienta.
- **Recordatorio de Cita de Prueba:** Avisa a la clienta de su prueba e incluye tips (ej. traer zapatos y ropa interior adecuada).
- **"¡Avisar que ya está listo!":** Con 1 toque avisa que la prenda ya está terminada y lista para recoger en el taller.

---

## 🛠️ Tecnologías Utilizadas

- **Framework:** React Native con Expo SDK 57 (Hermes Engine)
- **Navegación:** React Navigation v7 (Bottom Tabs & Native Stack)
- **Base de Datos:** Firebase Firestore v12 (Web SDK con long-polling optimizado para móviles)
- **Generación de Documentos:** `expo-print` y `expo-sharing`
- **Cámara y Galería:** `expo-image-picker`
- **Iconografía:** `@expo/vector-icons` (Ionicons)

---

## 📁 Estructura del Proyecto

```text
costura-app/
├── App.js                     # Punto de entrada, configuración de tema y tabs
├── app.json                   # Configuración de Expo, plugins y paquete Android
├── eas.json                   # Configuración de compilación para generar APK
├── firestore.rules            # Reglas de seguridad para Firebase Firestore
├── assets/                    # Iconos y splash screens
└── src/
    ├── components/common/     # Botones, Cards, Inputs y Headers reutilizables
    ├── constants/             # Paleta de colores, tipografía y espaciados
    ├── navigation/            # Configuración de React Navigation
    ├── screens/               # Pantallas principales:
    │   ├── HomeScreen.js         # Agenda de entregas, semáforo y citas de prueba
    │   ├── CalculatorScreen.js   # Cotizador doble: Arreglos y Confección a la Medida
    │   ├── ClientsScreen.js      # Libreta de medidas y fotos de clientas
    │   ├── InventoryScreen.js    # Inventario de telas con foto y mercería
    │   └── SuppliersScreen.js    # Directorio de proveedores de telas e hilos
    ├── services/              # Servicios de datos y utilidades:
    │   ├── firebase.js           # Inicialización de Firebase con persistencia
    │   ├── pricingService.js     # Motor de cálculo financiero, arreglos y urgencias
    │   ├── clientService.js      # Gestión de clientas y medidas
    │   ├── inventoryService.js   # Stock de telas y mercería
    │   ├── pdfReceiptService.js  # Motor de plantillas y generación de recibos PDF
    │   └── supplierService.js   # Gestión de proveedores
    └── utils/                 # Formato de moneda mexicana (MXN)
```

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (versión 18 o superior)
- Git
- Celular con la aplicación **Expo Go** instalada (disponible en Google Play Store y App Store)

### Pasos

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/TU_USUARIO/costura-app.git
   cd costura-app
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno:**
   Copia la plantilla de ejemplo y configura tus credenciales de Firebase:
   ```bash
   cp .env.example .env
   ```

4. **Iniciar el servidor de desarrollo:**
   ```bash
   npx expo start
   ```
   Escanea el código QR que aparece en la terminal desde la app **Expo Go** en tu celular.

---

## 📱 ¿Cómo Generar el Archivo APK (Para Instalar en Celular)?

Puedes compilar un archivo `.apk` instalable de forma gratuita utilizando **EAS Build** en los servidores en la nube de Expo (sin necesidad de tener Android Studio instalado):

1. **Inicia sesión o crea una cuenta gratuita en Expo:**
   ```bash
   npx eas-cli login
   ```

2. **Vincular el proyecto con tu cuenta:**
   ```bash
   npx eas-cli project:init
   ```

3. **Compilar el archivo APK para Android:**
   ```bash
   npx eas-cli build -p android --profile preview
   ```

4. **Descargar e Instalar:**
   - La terminal te proporcionará un enlace de descarga directo y un código QR.
   - Abre el enlace desde el celular Android para descargar el archivo `.apk` e instalar la app directamente.

---

## 🔒 Reglas de Seguridad de Firebase

Para desplegar las reglas de seguridad en Cloud Firestore:
1. Instala Firebase CLI: `npm install -g firebase-tools`
2. Inicia sesión: `firebase login`
3. Publica las reglas incluidas en este repositorio:
   ```bash
   firebase deploy --only firestore:rules
   ```

---

## 📄 Licencia

Este proyecto fue desarrollado como una solución artesanal y accesible para el empoderamiento de talleres de costura familiares y confeccionistas independientes.
