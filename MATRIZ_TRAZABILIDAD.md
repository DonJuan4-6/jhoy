# Matriz de trazabilidad — Taller 5 (HU21–HU32)

Relación entre cada historia de usuario nueva, la pantalla/componente que la implementa
y el caso o casos de prueba que la verifican. Las pruebas T-01 a T-12 se conservan del
Taller 4 y se ejecutan en cada `npm test`.

| HU | Pantalla / componente (`App.js`) | Regla (`marketplace.mjs`) | Caso(s) de prueba | Resultado |
|---|---|---|---|---|
| HU21 | `renderDetail` → selector de variantes, cantidad y precio específico; `ProductCard`; `renderCart` → línea con `variantLabel` | `getVariant`, `validateVariantSelection`, `validateCartLine`, `setCartLine`, `syncProductStock` | HU21-CA01, HU21-CA02, HU21-CA03, HU21-CA04, T-06 | Cumple |
| HU22 | `ProductCard` → control «Comp»; `renderCompare` → columnas y botón Quitar | `addToCompare`, `removeFromCompare`, `COMPARE_LIMIT` | HU22-CA01, HU22-CA03, HU22-CA04 | Cumple |
| HU23 | `renderCatalog` → panel «Filtros combinados» y estado vacío | `filterAndSortProducts`, `validatePriceRange` | HU23-CA01, HU23-CA02, HU23-CA03, HU23-CA04, T-02 | Cumple |
| HU24 | `renderDetail` → «Preguntas del producto», «Simular respuesta» | `validateQuestion`, `createQuestion`, `simulateQuestionAnswer` | HU24-CA02, HU24-CA03, HU24-CA04 | Cumple |
| HU25 | `renderAddresses`; `renderCheckout` → selección de dirección | `validateAddress`, `saveAddress`, `setPrincipalAddress` | HU25-CA01/03, HU25-CA02, IN-01 | Cumple |
| HU26 | `renderCheckout` → estimador; `renderSummary` → envío y total | `SHIPPING_RATES`, `estimateShipping`, `calculateTotals` | HU26-CA01, HU26-CA02, HU26-CA03, HU26-CA04, T-04 | Cumple |
| HU27 | `renderHistory`; `renderOrderDetail` → historial y «Simular avance de entrega» | `ORDER_STATUS`, `NEXT_STATUS`, `advanceOrderStatus`, `createDemoOrders` | HU27-CA01, HU27-CA02, HU27-CA03, HU27-CA04 | Cumple |
| HU28 | `renderOrderDetail` → «Cancelar pedido» + `ConfirmDialog` | `CANCELABLE_STATUS`, `cancelOrder` (bandera `restocked`) | HU28-CA01, HU28-CA02, HU28-CA03, HU28-CA04 | Cumple |
| HU29 | `BrandMark`/campana en encabezado; `renderNotifications` | `makeNotification`, `appendNotification` (clave `dedupeKey`) | HU29-CA01, HU29-CA02, HU29-CA03, HU29-CA04 | Cumple |
| HU30 | `renderDetail` → «Avisarme cuando haya stock» y «Simular reposición» | `createStockAlert`, `restockLine`, `buildRestockNotification` | HU30-CA01/03/04, HU30-CA02 | Cumple |
| HU31 | `renderDetail` → «Productos relacionados» y estado vacío | `getRecommendations`, `availableVariants` | HU31-CA01, HU31-CA02, HU31-CA03 | Cumple |
| HU32 | `renderHelp` → pedido, motivo, descripción, casos y «Simular respuesta» | `validateSupportRequest`, `createSupportTicket`, `simulateTicketReply` | HU32-CA01/02/03, HU32-CA04, IN-01 | Cumple |

## Matriz de criterios de aceptación (detalle)

| Criterio | Verificación | Evidencia |
|---|---|---|
| HU21-CA01 | Seleccionar «Switch rojo» muestra $234.000 y 5 disponibles | Prueba + UI detalle |
| HU21-CA02 | Agregar sin variante muestra aviso y no cambia carrito | Prueba + UI |
| HU21-CA03 | La línea del carrito guarda `PROD-001::VAR-K552-RED`, precio y cantidad | Prueba + UI carrito |
| HU21-CA04 | Pedir 8 unidades de un variante con 5 muestra «máximo permitido es 5» | Prueba |
| HU22-CA01 | Marcar un producto lo guarda en comparación | Prueba + UI |
| HU22-CA02 | Comparador muestra nombre, marca, precio y disponibilidad en columnas | UI |
| HU22-CA03 | El cuarto producto se rechaza con «hasta 3 productos» | Prueba + UI |
| HU22-CA04 | Quitar del comparador no toca carrito ni favoritos | Prueba |
| HU23-CA01 | Marca + precio + disponibilidad + búsqueda se aplican a la vez | Prueba |
| HU23-CA02 | Mínimo > máximo muestra error y no filtra | Prueba + UI |
| HU23-CA03 | Sin coincidencias muestra estado vacío explicativo | Prueba |
| HU23-CA04 | Restablecer devuelve los 12 productos y limpia controles | Prueba + UI |
| HU24-CA01 | El detalle lista las preguntas existentes del producto | UI |
| HU24-CA02 | Pregunta ≥ 10 caracteres se crea como Pendiente con fecha | Prueba |
| HU24-CA03 | Texto corto muestra validación y no se agrega | Prueba |
| HU24-CA04 | «Simular respuesta» marca Respondida y muestra texto de demo | Prueba + UI |
| HU25-CA01 | Alta con alias, municipio y referencia válidos agrega la dirección | Prueba |
| HU25-CA02 | Solo una dirección queda como principal | Prueba |
| HU25-CA03 | Editar no duplica el registro | Prueba |
| HU25-CA04 | Sin dirección seleccionada, el checkout pide elegir una | UI |
| HU26-CA01 | Mosquera + estándar = $6.000, 1 a 2 días | Prueba + UI |
| HU26-CA02 | Funza + exprés = $12.000, 1 a 2 días | Prueba |
| HU26-CA03 | Cambiar municipio/modalidad recalcula sin duplicar cargo | Prueba |
| HU26-CA04 | Sin dirección ni modalidad pide completar datos | Prueba + UI |
| HU27-CA01 | El pedido muestra historial cronológico de estados | UI |
| HU27-CA02 | Confirmado → Preparando registra el evento | Prueba + UI |
| HU27-CA03 | Preparando → En camino sin saltos | Prueba + UI |
| HU27-CA04 | Entregado/Cancelado no avanzan | Prueba |
| HU28-CA01 | Cancelar Confirmado/Preparando cambia a Cancelado y registra | Prueba + UI |
| HU28-CA02 | En camino/Entregado no se pueden cancelar | Prueba + UI |
| HU28-CA03 | Restituye exactamente las unidades de cada variante | Prueba |
| HU28-CA04 | Cancelar dos veces no duplica stock | Prueba |
| HU29-CA01 | El aviso incluye id de pedido y nuevo estado | Prueba + UI |
| HU29-CA02 | Abrir un aviso lo marca leído | Prueba + UI |
| HU29-CA03 | Cero notificaciones muestra mensaje informativo | UI |
| HU29-CA04 | Un mismo evento no genera copias | Prueba |
| HU30-CA01 | Alta de aviso única por artículo | Prueba + UI |
| HU30-CA02 | Simular reposición genera aviso | Prueba + UI |
| HU30-CA03 | Solicitar de nuevo no duplica suscripción | Prueba |
| HU30-CA04 | Cancelar el aviso evita la notificación | Prueba |
| HU31-CA01 | Hasta cuatro artículos de la misma categoría | Prueba |
| HU31-CA02 | Variantes agotadas no se muestran disponibles | Prueba |
| HU31-CA03 | Categoría con un solo producto muestra estado vacío | Prueba |
| HU31-CA04 | Abrir sugerencia conserva variante y carrito | UI |
| HU32-CA01 | Elegir pedido y motivo Entrega/Producto/Otro | Prueba + UI |
| HU32-CA02 | Caso único con estado Abierto | Prueba + UI |
| HU32-CA03 | Sin pedido o texto corto muestra validación | Prueba |
| HU32-CA04 | Simular respuesta conserva el registro y cambia a Respondido | Prueba + UI |

## Trazabilidad inversa (pregunta de sustentación)

- *¿Qué impide pasar de Confirmado a Entregado?* → `NEXT_STATUS` solo define el siguiente estado.
- *¿Cómo evitas sumar dos veces el envío?* → `calculateTotals` es el único punto que lo suma.
- *¿Cómo se que una recomendación no incluye agotados?* → `getRecommendations` usa `availableVariants` y `getProductStock`.
- *¿Cómo demuestras que lo nuevo no dañó el carrito?* → las pruebas T-01…T-12 siguen en `marketplace.test.mjs`.
