# Pruebas funcionales

## Evidencia de ejecución

- `npm test`: 12 pruebas automatizadas aprobadas.
- `npx expo export --platform web`: compilación Expo Web aprobada.
- Pruebas UI ejecutadas en el navegador Expo Web: catálogo y navegación, búsqueda/categorías, favoritos, compra simulada, persistencia, panel vendedor y reseñas.

### Referencias

- **UI-01:** Inicio muestra JHOY, SWAREH, eslogan, público y catálogo con 12 productos.
- **UI-02:** Navegación a Catálogo, Favoritos, Carrito e Historial; abrir un detalle y volver conserva la sección.
- **UI-03:** Detalle muestra nombre, precio COP, descripción, categoría y stock; producto agotado no se puede agregar.
- **UI-04:** Búsqueda sin coincidencias muestra el estado vacío; categoría GPU filtra a tres productos.
- **UI-05:** Favorito se agrega, se quita y permanece después de recargar la app.
- **UI-06:** Agregar, aumentar cantidad y eliminar del carrito actualiza sus líneas; carrito sobrevive una recarga.
- **UI-07:** Envío, descuento y total se recalculan al modificar el carrito.
- **UI-08:** Checkout rechaza datos vacíos y permite revisar datos completos sin pedir información de pago.
- **UI-09:** Confirmación genera código, guarda el pedido, vacía el carrito y descuenta el inventario.
- **UI-10:** Historial permite abrir el detalle de una compra y recuperarla después de recargar.
- **UI-11:** BIENVENIDO10 aplica 10 %; un código desconocido muestra error sin alterar el total.
- **UI-12:** El panel crea un producto con id único y permite editarlo sin duplicar la referencia.
- **UI-13:** Una valoración de cinco estrellas queda registrada y actualiza el promedio y el conteo.
- **UI-14:** La restauración local conserva favoritos, carrito e historial y limpia datos corruptos.
- **T-01:** Catálogo mínimo, ids únicos, categorías y atributos válidos.
- **T-02:** Búsqueda insensible a mayúsculas, filtros combinados, categoría vacía y orden ascendente/descendente.
- **T-03:** Umbrales de envío, carrito vacío, cupón válido/inválido y descuento limitado.
- **T-04:** Carrito vacío, cantidades positivas, stock máximo y producto agotado.
- **T-05:** Datos de contacto obligatorios, espacios y validación de teléfono.
- **T-06:** Precio positivo, stock no negativo, descripción mínima y categoría.
- **T-07:** Rango de estrellas y promedio de reseñas.
- **T-08:** Pedido confirmado, copia de artículos y descuento de inventario al confirmar.
- **T-09:** Stock insuficiente en cualquier línea impide el pedido sin descontar parcialmente.
- **T-10:** Datos corruptos, cantidades fuera de stock, favoritos desconocidos e inventario negativo se normalizan.

## Casos de aceptación

| Caso | Verificación | Resultado | Evidencia |
|---|---|---|---|
| HU01-CA01 | Abrir inicio y comprobar nombre de marca y eslogan legible. | Cumple | UI-01 |
| HU01-CA02 | Navegar entre catálogo y carrito y comprobar colores coherentes. | Cumple | UI-01, UI-02 |
| HU01-CA03 | Comparar marca, público objetivo y cuatro categorías con la ficha. | Cumple | UI-01, FICHA_MARCA.md |
| HU02-CA01 | Comprobar accesos visibles a catálogo, favoritos, carrito e historial. | Cumple | UI-02 |
| HU02-CA02 | Cambiar de sección y comprobar que la app sigue respondiendo. | Cumple | UI-02 |
| HU02-CA03 | Abrir detalle y volver a la sección anterior conservando el carrito. | Cumple | UI-02, UI-06 |
| HU03-CA01 | Cargar al menos 12 productos de cuatro categorías. | Cumple | T-01, UI-01 |
| HU03-CA02 | Verificar nombre, precio COP, categoría y disponibilidad en una tarjeta. | Cumple | UI-01 |
| HU03-CA03 | Buscar un término sin resultados y comprobar mensaje vacío. | Cumple | UI-04 |
| HU04-CA01 | Buscar parte de un nombre con mayúsculas/minúsculas indistintas. | Cumple | T-02 |
| HU04-CA02 | Borrar el término y conservar los resultados del filtro activo. | Cumple | T-02 |
| HU04-CA03 | Escribir una palabra inexistente y comprobar “No encontramos productos”. | Cumple | UI-04 |
| HU05-CA01 | Elegir una categoría y comprobar que solo quedan sus productos. | Cumple | UI-04 |
| HU05-CA02 | Elegir “Todas” y recuperar productos según la búsqueda actual. | Cumple | T-02 |
| HU05-CA03 | Aplicar búsqueda y categoría a la vez. | Cumple | T-02 |
| HU06-CA01 | Ordenar los productos visibles de menor a mayor precio. | Cumple | T-02 |
| HU06-CA02 | Ordenar los productos visibles de mayor a menor precio. | Cumple | T-02 |
| HU06-CA03 | Ordenar sin perder búsqueda ni categoría activa. | Cumple | T-02 |
| HU07-CA01 | Abrir un producto y comprobar nombre, descripción, precio, categoría y stock. | Cumple | UI-03 |
| HU07-CA02 | Abrir un producto sin stock y comprobar estado agotado y acción deshabilitada. | Cumple | UI-03, T-04 |
| HU07-CA03 | Volver del detalle y conservar favoritos y carrito. | Cumple | UI-02, UI-05, UI-06 |
| HU08-CA01 | Agregar un producto a favoritos y comprobar su indicador/lista. | Cumple | UI-05 |
| HU08-CA02 | Pulsar de nuevo el favorito y comprobar que se elimina. | Cumple | UI-05 |
| HU08-CA03 | Abrir favoritos sin artículos y usar la acción para volver al catálogo. | Cumple | UI-05 |
| HU09-CA01 | Agregar un producto disponible y comprobar cantidad 1 o incremento. | Cumple | UI-06 |
| HU09-CA02 | Intentar exceder stock y comprobar que se impide con aviso. | Cumple | T-04 |
| HU09-CA03 | Intentar agregar un producto agotado y comprobar que el carrito no cambia. | Cumple | UI-03, T-04 |
| HU10-CA01 | Aumentar una unidad cuando hay stock suficiente. | Cumple | UI-06 |
| HU10-CA02 | Disminuir cantidad y comprobar actualización del subtotal. | Cumple | UI-06, T-03 |
| HU10-CA03 | Eliminar una línea y comprobar que desaparece y se recalcula. | Cumple | UI-06 |
| HU10-CA04 | Disminuir una unidad de cantidad 1 y comprobar eliminación consistente. | Cumple | UI-06 |
| HU11-CA01 | Comparar subtotal con suma de cantidad por precio unitario. | Cumple | T-03 |
| HU11-CA02 | Comprar por menos de $150.000 y comprobar envío de $8.000. | Cumple | T-03, UI-07 |
| HU11-CA03 | Comprar desde $150.000 y comprobar envío gratis y total correcto. | Cumple | T-03, UI-07 |
| HU11-CA04 | Abrir carrito vacío y comprobar subtotal, envío y total en $0. | Cumple | T-03, UI-07 |
| HU12-CA01 | Abrir checkout y comprobar nombre, teléfono, municipio y dirección. | Cumple | UI-08 |
| HU12-CA02 | Enviar campos vacíos o teléfono inválido y comprobar mensaje. | Cumple | UI-08, T-05 |
| HU12-CA03 | Completar datos y comprobar pantalla de revisión antes de confirmar. | Cumple | UI-08 |
| HU12-CA04 | Comprobar que no se solicitan tarjetas, contraseñas ni documentos. | Cumple | UI-08 |
| HU13-CA01 | Confirmar pedido válido y comprobar código único y confirmación. | Cumple | UI-09, T-08 |
| HU13-CA02 | Confirmar con stock insuficiente y comprobar rechazo sin cambios parciales. | Cumple | T-09 |
| HU13-CA03 | Confirmar, abrir carrito vacío y comprobar pedido en historial. | Cumple | UI-09, UI-10 |
| HU13-CA04 | Confirmar y comprobar aviso explícito de simulación sin cobro. | Cumple | UI-09 |
| HU14-CA01 | Confirmar tres unidades y comprobar que el stock baja en tres. | Cumple | T-08 |
| HU14-CA02 | Agregar o quitar unidades sin confirmar y comprobar stock intacto. | Cumple | UI-06, T-08 |
| HU14-CA03 | Confirmar una compra y comprobar que ningún stock es negativo. | Cumple | T-08, T-10 |
| HU15-CA01 | Confirmar pedido y comprobar código, fecha aproximada y total en historial. | Cumple | UI-10 |
| HU15-CA02 | Abrir historial y comprobar artículos, cantidades, precios, envío y total. | Cumple | UI-10 |
| HU15-CA03 | Modificar carrito y comprobar que el pedido anterior conserva sus datos. | Cumple | UI-10, T-08 |
| HU15-CA04 | Abrir historial sin pedidos y comprobar estado vacío informativo. | Cumple | UI-10 |
| HU16-CA01 | Agregar o quitar un artículo y comprobar confirmación visual. | Cumple | UI-06 |
| HU16-CA02 | Ejecutar una acción inválida y comprobar explicación comprensible. | Cumple | UI-08, UI-11 |
| HU16-CA03 | Revisar estados vacíos de favoritos, carrito, búsqueda e historial. | Cumple | UI-04, UI-05, UI-07, UI-10 |
| HU16-CA04 | Cambiar repetidamente de sección y comprobar que los datos siguen presentes. | Cumple | UI-02, UI-14 |
| HU17-CA01 | Aplicar BIENVENIDO10 a un carrito válido y descontar 10 %. | Cumple | UI-07, T-03 |
| HU17-CA02 | Aplicar código desconocido y comprobar rechazo sin cambiar el total. | Cumple | UI-11 |
| HU17-CA03 | Cambiar carrito con cupón aplicado y comprobar recálculo. | Cumple | UI-07, T-03 |
| HU18-CA01 | Crear producto válido y comprobar id, categoría, precio y stock. | Cumple | UI-12, T-06 |
| HU18-CA02 | Editar un producto y comprobar que no se crea un duplicado. | Cumple | UI-12 |
| HU18-CA03 | Guardar precio no positivo o stock negativo y comprobar rechazo. | Cumple | T-06 |
| HU19-CA01 | Guardar valoración entera entre 1 y 5 y verla en el detalle. | Cumple | UI-13, T-07 |
| HU19-CA02 | Intentar guardar valoración fuera del rango y comprobar error. | Cumple | T-07 |
| HU19-CA03 | Registrar varias valoraciones y comprobar promedio calculado. | Cumple | UI-13, T-07 |
| HU20-CA01 | Recargar app y comprobar restauración de carrito y favoritos. | Cumple | UI-05, UI-14 |
| HU20-CA02 | Restaurar datos inválidos y comprobar estado saneado sin stock negativo. | Cumple | T-10 |
| HU20-CA03 | Iniciar sin datos guardados y comprobar catálogo/estado inicial. | Cumple | T-01, UI-01 |
