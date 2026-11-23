# Pruebas funcionales — Marketplace 2.0 (Taller 5)

## Evidencia de ejecución

- `npm test`: **50 pruebas automatizadas aprobadas** (12 heredadas del Taller 4 + 38 nuevas HU21–HU32 e integración).
- `npx expo export --platform web`: **compilación Expo Web aprobada** (196 módulos, sin errores).
- Pruebas UI ejecutadas en el navegador sobre la compilación Web: flujo de compra completo,
  seguimiento, cancelación, notificaciones, reposición, comparador, filtros y soporte.
- Sin errores en la consola del navegador durante las pruebas UI.

## Referencias de ejecución UI

| Id | Verificación observada |
|---|---|
| UI-21 | Detalle de K552: al elegir «Switch rojo» se muestran $234.000 y 5 disponibles; agregar sin variante muestra aviso y no toca carrito. |
| UI-22 | Carrito conserva la línea «Teclado mecánico K552 · Switch rojo» con su precio propio. |
| UI-23 | Checkout con Casa (Mosquera) + Estándar muestra $6.000 y 1 a 2 días; total $240.000 para una unidad de $234.000. |
| UI-24 | Revisión muestra dirección, modalidad, ítem con variante, subtotal $234.000, envío $6.000 y total $240.000. |
| UI-25 | Confirmación genera código `SWH-…`, limpia carrito, descuenta stock y crea aviso interno. |
| UI-26 | Seguimiento: Confirmado → Preparando → En camino, con historial cronológico y avisos por cada cambio. |
| UI-27 | Intento de cancelar en «En camino» se rechaza con explicación; en pedido Confirmado se abre diálogo y se cancela. |
| UI-28 | Centro de notificaciones muestra avisos con id de pedido/estado y cuenta de no leídos en la campana. |
| UI-29 | Reposición simulada de un producto agotado genera aviso «¡Reposición simulada!…». |
| UI-30 | Comparador con tres productos muestra nombre, marca, precio y disponibilidad; el cuarto se rechaza. |
| UI-31 | Filtro con mínimo > máximo muestra error; «Restablecer» devuelve los 12 productos. |
| UI-32 | Caso de ayuda: se crea `CASO-…` en estado Abierto; «Simular respuesta» lo pasa a Respondido y conserva el registro. |

## Casos de aceptación automatizados

Los nombres de las pruebas en `marketplace.test.mjs` coinciden con los criterios:
`HU21-CA01…CA04`, `HU22-CA01/03/04`, `HU23-CA01…CA04`, `HU24-CA02/03/04`,
`HU25-CA01/02/03`, `HU26-CA01…CA04`, `HU27-CA01…CA04`, `HU28-CA01…CA04`,
`HU29-CA01…CA04`, `HU30-CA01/02/03/04`, `HU31-CA01/02/03`, `HU32-CA01/02/03/04`,
más `IN-01`, `IN-02`, `IN-03` de integración de persistencia.
La matriz completa está en `MATRIZ_TRAZABILIDAD.md`.

## Guion del video de demostración (máximo 5 minutos)

El video `demo_marketplace_2_0.mp4` se arma con capturas de la app y subtítulos que
recorren los cinco momentos exigidos: **compra, seguimiento, cancelación, avisos y soporte**.

| Tiempo | Escena | Acción visible |
|---|---|---|
| 0:00–0:20 | Inicio | Marca SWAREH / JHOY, eslogan 2.0 y catálogo con variantes y botón Comparar. |
| 0:20–0:55 | HU21 | Detalle del K552, selección de «Switch rojo», precio $234.000 y 5 disponibles; cantidad y agregado al carrito. |
| 0:55–1:25 | HU22 / HU23 | Comparador con tres productos; filtro inválido y restablecimiento del catálogo. |
| 1:25–2:05 | HU25 / HU26 / compra | Checkout con dirección Casa (Mosquera) y envío Estándar $6.000, total $240.000 y confirmación. |
| 2:05–2:40 | HU27 | Pedido confirmado; «Simular avance de entrega» hasta En camino con historial de estados. |
| 2:40–3:10 | HU28 | Pedido de prueba en Confirmado; diálogo de cancelación, estado Cancelado y bloqueo de nuevos avances. |
| 3:10–3:40 | HU29 / HU30 | Notificaciones del pedido y aviso de reposición simulada de un producto agotado. |
| 3:40–4:20 | HU32 | Centro de ayuda: caso `CASO-…` abierto y respuesta simulada. |
| 4:20–4:40 | Cierre | Resumen: 50 pruebas aprobadas, compilación Web y rama `marketplace-v2`. |

Duración total objetivo: **4 minutos 40 segundos**.
