# JHOY / SWAREH — Marketplace 2.0

Aplicación de comercio electrónico **simulada** desarrollada en React Native + Expo para el
**Taller 5: Nuevas funcionalidades para tu aplicación** (continuación del Taller 4
`Marketplace_swareh`).

- **Aprendiz:** Juan Diego Henao Suarez
- **Ficha:** 3409609 ADSO
- **Marca:** SWAREH (iniciales SWH) · **App:** JHOY
- **Eslogan 2.0:** Compara, elige y sigue tu hardware con confianza.
- **Rama de trabajo:** `marketplace-v2` (la versión 1.0 permanece en `master`).

> Todo es una simulación académica: no hay pagos, envíos reales, transportadoras,
> notificaciones push, bases de datos ni autenticación. Los datos de compradores y
> direcciones son ficticios.

## Requisitos

- Node.js 20+ y npm
- Expo Go compatible con SDK 58 o un navegador para la versión Web

## Ejecución

```bash
npm install
npx expo start
```

Opciones:

```bash
npx expo start --web      # abrir en navegador
npx expo start --android  # Expo Go en Android
npx expo start --ios      # Expo Go en iOS
```

Verificación:

```bash
npm test                  # 50 pruebas automatizadas
npx expo export --platform web  # compilación Web
```

No vuelvas a ejecutar `create-expo-app`: este repositorio ya es el proyecto del Taller 4.

## Estructura

| Archivo | Contenido |
|---|---|
| `App.js` | Estado, navegación, pantallas y componentes reutilizables de la app |
| `marketplace.mjs` | Datos iniciales, reglas de negocio, validaciones y normalización de persistencia |
| `marketplace.test.mjs` | 50 pruebas: 12 heredadas del Taller 4 + 38 nuevas (HU21–HU32) |
| `Taller_5_Marketplace_2_0_SWAREH.docx` | Documento del taller con historias, criterios, trazabilidad y reflexión |
| `MATRIZ_TRAZABILIDAD.md` | Matriz HU21–HU32 → pantalla/componente → caso de prueba |
| `REFLEXION_TECNICA.md` | Decisiones, dificultades y mejora pendiente |
| `PRUEBAS_FUNCIONALES_V2.md` | Evidencias de ejecución y guion de la demo en video |
| `FICHA_MARCA.md` | Ficha de marca heredada y renovada |

## Funcionalidades

### Conservadas del Taller 4

Marca e identidad, catálogo de 12 productos en 4 categorías, búsqueda, categorías,
ordenamiento, detalle, favoritos, carrito con cantidades, cupón `BIENVENIDO10`,
resumen de compra, datos del comprador, confirmación simulada, descuento de stock,
historial, panel de vendedor, reseñas y persistencia local.

### Nuevas del Taller 5 (HU21–HU32)

| HU | Funcionalidad | Dónde probarla |
|---|---|---|
| HU21 | Variantes con precio y stock propio | Detalle de K552, G305 o RTX 4060 |
| HU22 | Comparador de 2 a 3 productos | Botón «Comp» en tarjetas y pantalla Comparador |
| HU23 | Filtros por marca, precio y disponibilidad | Panel «Filtros combinados» en Catálogo |
| HU24 | Preguntas con respuesta simulada | Sección «Preguntas del producto» en Detalle |
| HU25 | Libreta de direcciones | Pantalla «Mis direcciones» y Checkout |
| HU26 | Estimador de envío por municipio | Checkout: elige dirección y modalidad |
| HU27 | Seguimiento por estados | Mis pedidos → Detalle y seguimiento |
| HU28 | Cancelación y reintegro de stock | Detalle y seguimiento → Cancelar pedido |
| HU29 | Centro de notificaciones interno | Campana del encabezado |
| HU30 | Avisos de reposición | Detalle de un producto agotado |
| HU31 | Recomendaciones relacionadas | Sección «Productos relacionados» en Detalle |
| HU32 | Centro de ayuda y solicitudes | Pantalla «Centro de ayuda» |

**Primeros pasos recomendados para la demostración**

1. En Catálogo, abre el **Teclado mecánico K552**, elige **Switch rojo** y agrégalo.
2. En Carrito, continúa al checkout, completa nombre y teléfono, elige la dirección
   **Casa (Mosquera)** y la modalidad **Estándar**: el envío es **$6.000** y el total se
   recalcula una sola vez.
3. Confirma. En el pedido resultante usa **Simular avance de entrega** dos veces:
   Confirmado → Preparando → En camino.
4. En **Mis pedidos**, pulsa **Cargar pedidos de prueba (Simular)** para ver pedidos en
   distintos estados; cancela uno en Confirmado/Preparando y vuelve a intentarlo para
   comprobar que no hay doble reintegro.
5. Abre **Notificaciones**, **Centro de ayuda** y un producto agotado para probar avisos,
   casos de soporte y reposición simulada.

## Tarifas de envío (ficticias)

| Municipio | Estándar | Exprés |
|---|---|---|
| Mosquera | $6.000 | $10.000 |
| Funza | $8.000 | $12.000 |
| Madrid | $10.000 | $14.000 |

Plazo mostrado: 1 a 2 días. Otros municipios: no se ofrece envío y se solicita ajuste manual.

## Registros Git (rama `marketplace-v2`)

1. `52507e3` — `feat: reglas de negocio Marketplace 2.0 (HU21-HU32) y 50 pruebas`
2. `b0a7161` — `feat: pantallas e interacciones Marketplace 2.0 (HU21-HU32)`
3. Commit de documentación y evidencias ( este README, matriz, reflexión, docx y video ).
