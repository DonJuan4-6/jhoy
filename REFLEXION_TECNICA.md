# Reflexión técnica — Marketplace 2.0 (Taller 5)

## Dos decisiones de diseño

**1. Una sola fuente de verdad para el inventario.**
El stock de un producto con variantes se calcula siempre sumando el stock de sus variantes
(`syncProductStock`). No guardamos una cifra global independiente que pueda quedar
desincronizada. Comprar, cancelar y reponer son las únicas operaciones que modifican
inventario, y todas pasan por funciones puras de `marketplace.mjs`. Esto responde a la
pregunta de sustentación sobre la fuente única de verdad y evita el error clásico de
mostrar «12 disponibles» en catálogo y «10» en el detalle.

**2. Carrito por producto + variante y pedido inmutable.**
La clave de una línea de carrito es `PROD-001::VAR-K552-RED`. Así, dos tallas del mismo
producto conviven como líneas distintas con precio y stock propios, y el questionario de
sustentación tiene una respuesta concreta. Al confirmar, el pedido copia nombre, marca,
variante y precio de ese instante; modificar catálogo o precios después no altera el
historial. La cancelación es un evento lógico (estado `Cancelado` + entrada en `history`),
nunca un borrado.

## Dos dificultades resueltas

**1. Envío: resolver el nuevo cálculo sin doble cobro y sin romper el Taller 4.**
El Taller 4 definía $8.000 bajo $150.000 y envío gratis desde ese umbral; el Taller 5
 introdujo tarifas por municipio y modalidad. En lugar de duplicar la lógica, se mantuvo
 una única función `calculateTotals(cart, products, couponApplied, shippingQuote)`: sin
 cotización aplica la regla antigua, con cotización del estimador aplica la tarifa de
 Mosquera, Funza o Madrid. El pedido guarda `shipping`, `shippingModal` y `shippingDays`
 con el valor usado, de modo que el resumen y el historial siempre coinciden.

**2. Cancelación sin inflar artificialmente el inventario.**
Los pedidos de prueba son datos históricos: su descuento ya está reflejado en el catálogo
inicial. Si al cancelarlos se devolvieran unidades, el stock subiría sin una compra real
en la sesión. Por eso se marcan con `stockDeducted: false` y su cancelación solo cambia el
estado. Los pedidos creados en la sesión sí descuentan y se restituyen una sola vez gracias
a la bandera `restocked`. Las pruebas HU28-CA03 y HU28-CA04 cubren ambos casos.

## Mejora pendiente

Migrar la navegación actual (un único root con estado, heredada del Taller 4) a
**Expo Router** con rutas por pantalla, y añadir **tema oscuro con tamaño de letra
configurable** (HU33, opcional). También quedan como ampliaciones opcionales las
devoluciones simuladas (HU34) y el compartir enlace de producto (HU35).

Antes de conectar el prototipo a una API real harían falta: autenticación, un backend de
inventario con transacciones atómicas para evitar ventas simultáneas del último stock,
una pasarela de pago real, un servicio de mensajería para notificaciones push y un
servicio de transporte real. La persistencia local actual es solo para la demostración
académica y se descarta al reiniciar con datos corruptos.

## Evidencia de no regresión

Las 12 pruebas del Taller 4 (`T-01` a `T-12`) se ejecutan junto con las 38 nuevas en cada
`npm test`. El resultado actual es **50/50 aprobadas**. La compilación Web también se
verifica con `npx expo export --platform web`.
