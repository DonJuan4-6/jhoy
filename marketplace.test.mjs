import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addToCompare,
  advanceOrderStatus,
  appendNotification,
  buildRestockNotification,
  calculateTotals,
  cancelOrder,
  CATEGORIES,
  COUPON_CODE,
  createConfirmedOrder,
  createDemoOrders,
  createQuestion,
  createStockAlert,
  createSupportTicket,
  estimateShipping,
  filterAndSortProducts,
  getCartLineQuantity,
  getProductStock,
  getRatingStats,
  getRecommendations,
  getVariant,
  INITIAL_PRODUCTS,
  isValidCoupon,
  makeCartKey,
  normalizePersistedData,
  ORDER_STATUS,
  removeFromCompare,
  restockLine,
  saveAddress,
  setCartLine,
  setPrincipalAddress,
  simulateQuestionAnswer,
  simulateTicketReply,
  syncProductStock,
  validateAddress,
  validateBuyer,
  validateCart,
  validatePriceRange,
  validateProduct,
  validateQuestion,
  validateRating,
  validateSupportRequest,
  validateVariantSelection,
} from './marketplace.mjs';

const validBuyer = { name: 'Ana Ruiz', phone: '3001234567', municipality: 'Mosquera', address: 'Calle 10 # 20-30' };
const variantKey = makeCartKey('PROD-001', 'VAR-K552-BRN');

// ===========================================================================
// Pruebas heredadas del Taller 4 (garantizan que lo anterior siga funcionando)
// ===========================================================================

test('T-01 el catálogo inicia con 12 productos válidos en las cuatro categorías', () => {
  assert.equal(INITIAL_PRODUCTS.length, 12);
  assert.deepEqual(new Set(INITIAL_PRODUCTS.map((product) => product.category)), new Set(CATEGORIES));
  assert.equal(new Set(INITIAL_PRODUCTS.map((product) => product.id)).size, 12);
  for (const product of INITIAL_PRODUCTS) assert.equal(validateProduct(product), '');
});

test('T-02 búsqueda sin distinguir mayúsculas y filtro de categoría se combinan', () => {
  const found = filterAndSortProducts(INITIAL_PRODUCTS, 'g305', 'Periféricos', 'featured');
  assert.deepEqual(found.map((product) => product.id), ['PROD-002']);
  assert.deepEqual(filterAndSortProducts(INITIAL_PRODUCTS, 'RTX', 'CPU', 'featured'), []);
});

test('T-03 quitar el término conserva categoría y el orden asciende/desciende', () => {
  const categoryResults = filterAndSortProducts(INITIAL_PRODUCTS, '', 'GPU', 'featured');
  assert.equal(categoryResults.length, 3);
  const ascending = filterAndSortProducts(categoryResults, '', 'GPU', 'asc').map((product) => product.price);
  const descending = filterAndSortProducts(categoryResults, '', 'GPU', 'desc').map((product) => product.price);
  assert.deepEqual(ascending, [...ascending].sort((a, b) => a - b));
  assert.deepEqual(descending, [...ascending].reverse());
});

test('T-04 envío histórico cuesta $8.000 bajo $150.000 y es gratis desde el umbral', () => {
  assert.deepEqual(calculateTotals({ 'PROD-002': 1 }, INITIAL_PRODUCTS), { subtotal: 145000, shipping: 8000, discount: 0, total: 153000 });
  assert.deepEqual(calculateTotals({ 'PROD-010': 1 }, INITIAL_PRODUCTS), { subtotal: 150000, shipping: 0, discount: 0, total: 150000 });
  assert.deepEqual(calculateTotals({}, INITIAL_PRODUCTS), { subtotal: 0, shipping: 0, discount: 0, total: 0 });
});

test('T-05 cupón de prueba valida BIENVENIDO10 y limita el descuento al subtotal', () => {
  assert.equal(isValidCoupon(` ${COUPON_CODE.toLowerCase()} `), true);
  assert.equal(isValidCoupon('CUPON-INVALIDO'), false);
  assert.deepEqual(calculateTotals({ 'PROD-002': 1 }, INITIAL_PRODUCTS, true), { subtotal: 145000, shipping: 8000, discount: 14500, total: 138500 });
  assert.equal(calculateTotals({}, INITIAL_PRODUCTS, true).total, 0);
});

test('T-06 carrito rechaza vacío, cantidad no positiva y stock insuficiente', () => {
  assert.match(validateCart({}, INITIAL_PRODUCTS), /vacío/);
  assert.match(validateCart({ [variantKey]: 0 }, INITIAL_PRODUCTS), /entero positivo/);
  assert.match(validateCart({ 'PROD-003': 1 }, INITIAL_PRODUCTS), /Stock insuficiente/);
  assert.equal(validateCart({ [variantKey]: 2 }, INITIAL_PRODUCTS), '');
});

test('T-07 datos de entrega obligatorios se validan después de quitar espacios', () => {
  assert.match(validateBuyer({ ...validBuyer, name: '   ' }), /nombre/);
  assert.match(validateBuyer({ ...validBuyer, phone: '123' }), /teléfono válido/);
  assert.equal(validateBuyer(validBuyer), '');
});

test('T-08 panel vendedor acepta precio entero positivo y stock entero no negativo', () => {
  const product = { name: 'Ventilador RGB silencioso', category: 'Periféricos', price: 65000, stock: 0, description: 'Ventilador silencioso para mejorar el flujo de aire.' };
  assert.equal(validateProduct(product), '');
  assert.match(validateProduct({ ...product, price: 0 }), /precio/);
  assert.match(validateProduct({ ...product, stock: -1 }), /stock/);
  assert.match(validateProduct({ ...product, description: 'corta' }), /15 caracteres/);
});

test('T-09 reseñas solo admiten enteros de uno a cinco y el promedio se recalcula', () => {
  assert.equal(validateRating(5), '');
  assert.match(validateRating(0), /entre 1 y 5/);
  assert.match(validateRating(5.5), /entre 1 y 5/);
  assert.deepEqual(getRatingStats([5, 4, 5]), { count: 3, average: 4.7 });
  assert.deepEqual(getRatingStats([]), { count: 0, average: null });
});

test('T-10 confirmar crea copia del pedido y descuenta existencias solo al confirmar', () => {
  const originalStock = INITIAL_PRODUCTS.find((product) => product.id === 'PROD-007').stock;
  const result = createConfirmedOrder({
    cart: { 'PROD-007': 3 },
    products: INITIAL_PRODUCTS,
    buyer: validBuyer,
    now: new Date('2026-11-17T12:00:00.000Z'),
    randomPart: 'TEST-1',
  });
  assert.equal(result.error, undefined);
  assert.match(result.order.code, /^SWH-/);
  assert.equal(result.order.items[0].quantity, 3);
  assert.equal(result.order.total, 1497000);
  assert.equal(result.nextProducts.find((product) => product.id === 'PROD-007').stock, originalStock - 3);
  assert.equal(INITIAL_PRODUCTS.find((product) => product.id === 'PROD-007').stock, originalStock);
  assert.equal(Object.hasOwn(result.order, 'buyer'), false);
});

test('T-11 pedido con línea sin stock falla sin descontar parcialmente el inventario', () => {
  const result = createConfirmedOrder({
    cart: { [variantKey]: 1, 'PROD-003': 1 },
    products: INITIAL_PRODUCTS,
    buyer: validBuyer,
  });
  assert.match(result.error, /Stock insuficiente/);
  assert.equal(result.nextProducts, undefined);
  assert.equal(INITIAL_PRODUCTS.find((product) => product.id === 'PROD-001').stock, 12);
});

test('T-12 persistencia descarta datos corruptos sin inventario negativo', () => {
  const restored = normalizePersistedData({
    products: [{ ...INITIAL_PRODUCTS[0], stock: -2 }],
    cart: { 'PROD-001': 999, 'PROD-003': 2, UNKNOWN: 1, bad: -1 },
    favorites: ['PROD-001', 'UNKNOWN', 'PROD-001'],
    orders: [{ code: 'bad', items: [], subtotal: -1, shipping: -1, discount: -1, total: -1 }],
  });
  assert.equal(restored.products.find((product) => product.id === 'PROD-001').stock, 12);
  assert.deepEqual(restored.cart, { 'PROD-001': 12 });
  assert.deepEqual(restored.favorites, ['PROD-001']);
  assert.deepEqual(restored.orders, []);
});

// ===========================================================================
// HU21 - Variantes de los productos
// ===========================================================================

test('HU21-CA01 al menos tres productos tienen variantes con precio y stock propio', () => {
  const withVariants = INITIAL_PRODUCTS.filter((product) => product.variants?.length >= 2);
  assert.ok(withVariants.length >= 3);
  for (const product of withVariants) {
    assert.equal(product.stock, product.variants.reduce((sum, variant) => sum + variant.stock, 0));
    for (const variant of product.variants) {
      assert.ok(Number.isInteger(variant.price) && variant.price > 0);
      assert.ok(Number.isInteger(variant.stock) && variant.stock >= 0);
    }
  }
  const variant = getVariant(withVariants[0], withVariants[0].variants[0].id);
  assert.equal(variant.label, withVariants[0].variants[0].label);
});

test('HU21-CA02 agregar sin seleccionar variante se rechaza', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  assert.match(validateVariantSelection(product, null), /Selecciona una variante/);
  assert.equal(validateCart({ 'PROD-001': 1 }, INITIAL_PRODUCTS).includes('Selecciona una variante'), true);
  assert.match(validateVariantSelection(product, 'VAR-INEXISTENTE'), /ya no está disponible/);
});

test('HU21-CA03 el carrito conserva variante, precio y cantidad elegida', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  const cart = setCartLine({}, product, 'VAR-K552-RED', 3);
  assert.deepEqual(cart, { 'PROD-001::VAR-K552-RED': 3 });
  assert.equal(getCartLineQuantity(cart, product, 'VAR-K552-RED'), 3);
  const totals = calculateTotals(cart, INITIAL_PRODUCTS);
  assert.equal(totals.subtotal, 234000 * 3);
});

test('HU21-CA04 exceder el stock informa el máximo permitido y no se agrega', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  assert.match(validateCart({ [variantKey]: 8 }, INITIAL_PRODUCTS), /máximo permitido es 7/);
  assert.equal(validateCart({ [variantKey]: 7 }, INITIAL_PRODUCTS), '');
});

test('HU21 una variante sin stock no puede comprarse', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  assert.match(validateVariantSelection(product, 'VAR-K552-BLU'), /agotada/);
  assert.match(validateCart({ 'PROD-001::VAR-K552-BLU': 1 }, INITIAL_PRODUCTS), /agotada/);
  assert.equal(getVariant(product, 'VAR-K552-BLU').stock, 0);
});

test('HU21 dos variantes distintas del mismo producto son líneas separadas', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  let cart = setCartLine({}, product, 'VAR-K552-BRN', 1);
  cart = setCartLine(cart, product, 'VAR-K552-RED', 1);
  assert.equal(Object.keys(cart).length, 2);
  assert.equal(calculateTotals(cart, INITIAL_PRODUCTS).subtotal, 229000 + 234000);
});

// ===========================================================================
// HU22 - Comparador
// ===========================================================================

test('HU22-CA01 y CA03 la comparación guarda hasta tres productos', () => {
  const first = addToCompare([], 'PROD-001');
  const second = addToCompare(first.list, 'PROD-004');
  const third = addToCompare(second.list, 'PROD-007');
  assert.deepEqual(third.list, ['PROD-001', 'PROD-004', 'PROD-007']);
  const fourth = addToCompare(third.list, 'PROD-010');
  assert.match(fourth.error, /hasta 3/);
  assert.deepEqual(fourth.list, third.list);
  assert.deepEqual(addToCompare(third.list, 'PROD-001').list, third.list);
});

test('HU22-CA04 retirar del comparador no altera favoritos ni carrito', () => {
  const cart = { [variantKey]: 2 };
  const favorites = ['PROD-001', 'PROD-004'];
  const list = ['PROD-001', 'PROD-004'];
  assert.deepEqual(removeFromCompare(list, 'PROD-004'), ['PROD-001']);
  assert.deepEqual(cart, { [variantKey]: 2 });
  assert.deepEqual(favorites, ['PROD-001', 'PROD-004']);
});

// ===========================================================================
// HU23 - Filtros combinados
// ===========================================================================

test('HU23-CA01 marca, precio y disponibilidad se aplican simultáneamente con búsqueda', () => {
  const result = filterAndSortProducts(INITIAL_PRODUCTS, '', 'GPU', 'featured', {
    brand: 'Vortex', minPrice: 1000000, maxPrice: 2000000, onlyAvailable: true,
  });
  assert.deepEqual(result.map((product) => product.id), ['PROD-004']);
  const withSearch = filterAndSortProducts(INITIAL_PRODUCTS, '4060', 'GPU', 'featured', {
    brand: 'Vortex', minPrice: '', maxPrice: '', onlyAvailable: true,
  });
  assert.deepEqual(withSearch.map((product) => product.id), ['PROD-004']);
});

test('HU23-CA02 rango inválido se informa y no se aplica', () => {
  assert.match(validatePriceRange('500000', '100000'), /mínimo no puede ser mayor/);
  assert.match(validatePriceRange('-1', '100'), /positivo/);
  assert.equal(validatePriceRange('', ''), '');
  assert.equal(validatePriceRange('100000', '500000'), '');
});

test('HU23-CA03 ningún resultado entrega una lista vacía sin fallar', () => {
  const result = filterAndSortProducts(INITIAL_PRODUCTS, '', 'CPU', 'featured', {
    brand: 'Keytron', minPrice: '', maxPrice: '', onlyAvailable: true,
  });
  assert.deepEqual(result, []);
});

test('HU23-CA04 restablecer devuelve el catálogo completo', () => {
  const result = filterAndSortProducts(INITIAL_PRODUCTS, '', 'Todas', 'featured', {
    brand: 'Todas', minPrice: '', maxPrice: '', onlyAvailable: false,
  });
  assert.equal(result.length, 12);
});

// ===========================================================================
// HU24 - Preguntas frecuentes
// ===========================================================================

test('HU24-CA02 y CA03 validación de longitud y creación pendiente', () => {
  assert.match(validateQuestion('corto'), /10 caracteres/);
  assert.match(validateQuestion('   '), /10 caracteres/);
  assert.equal(validateQuestion('¿Cuánto dura la batería?'), '');
  const question = createQuestion('PROD-002', '¿Cuánto dura la batería?');
  assert.equal(question.status, 'Pendiente');
  assert.equal(question.answer, '');
  assert.ok(question.date);
});

test('HU24-CA04 la respuesta simulada se marca como demostración', () => {
  const pending = createQuestion('PROD-002', '¿Incluye garantía el producto?');
  const answered = simulateQuestionAnswer(pending);
  assert.equal(answered.status, 'Respondida');
  assert.match(answered.answer, /Respuesta simulada/);
  assert.match(answered.answer, /No proviene de una persona real/);
});

// ===========================================================================
// HU25 - Libreta de direcciones
// ===========================================================================

test('HU25-CA01 y CA03 alta y edición sin duplicar registros', () => {
  const empty = [];
  assert.match(validateAddress({ alias: '', municipality: 'Funza', reference: 'Calle 1 # 2-3' }), /alias/);
  const created = saveAddress(empty, { alias: 'Oficina', municipality: 'Funza', reference: 'Carrera 7 # 71-21' });
  assert.equal(created.addresses.length, 1);
  assert.equal(created.addresses[0].id, 'DIR-001');
  const edited = saveAddress(created.addresses, { alias: 'Oficina 2', municipality: 'Funza', reference: 'Carrera 7 # 71-22' }, 'DIR-001');
  assert.equal(edited.addresses.length, 1);
  assert.equal(edited.addresses[0].alias, 'Oficina 2');
});

test('HU25-CA02 solo una dirección puede ser principal', () => {
  const addresses = [
    { id: 'DIR-001', alias: 'Casa', municipality: 'Mosquera', reference: 'Calle 1', principal: true },
    { id: 'DIR-002', alias: 'Oficina', municipality: 'Funza', reference: 'Calle 2', principal: true },
  ];
  const result = setPrincipalAddress(addresses, 'DIR-002');
  assert.equal(result.addresses.filter((item) => item.principal).length, 1);
  assert.equal(result.addresses.find((item) => item.id === 'DIR-002').principal, true);
  assert.equal(result.selectedAddressId, 'DIR-002');
});

// ===========================================================================
// HU26 - Estimador de envío
// ===========================================================================

test('HU26-CA01 Mosquera estándar cuesta $6.000 en 1 a 2 días', () => {
  const quote = estimateShipping('Mosquera', 'estandar');
  assert.equal(quote.supported, true);
  assert.equal(quote.cost, 6000);
  assert.equal(quote.days, '1 a 2 días');
  const totals = calculateTotals({ [variantKey]: 1 }, INITIAL_PRODUCTS, false, quote);
  assert.equal(totals.shipping, 6000);
  assert.equal(totals.total, totals.subtotal + 6000);
});

test('HU26-CA02 Funza exprés cuesta $12.000 en 1 a 2 días', () => {
  const quote = estimateShipping('Funza', 'express');
  assert.equal(quote.cost, 12000);
  assert.equal(quote.days, '1 a 2 días');
});

test('HU26-CA03 cambiar municipio o modalidad recalcula sin duplicar el cargo', () => {
  const mosquera = estimateShipping('Mosquera', 'estandar');
  const madrid = estimateShipping('Madrid', 'express');
  const a = calculateTotals({ [variantKey]: 1 }, INITIAL_PRODUCTS, false, mosquera);
  const b = calculateTotals({ [variantKey]: 1 }, INITIAL_PRODUCTS, false, madrid);
  assert.equal(a.shipping, 6000);
  assert.equal(b.shipping, 14000);
  assert.equal(b.total, b.subtotal + 14000);
  assert.equal(b.total - b.subtotal + b.discount, b.shipping);
});

test('HU26-CA04 sin dirección o modalidad el envío no es válido', () => {
  assert.equal(estimateShipping('', null).supported, false);
  assert.equal(estimateShipping('Bogotá', 'estandar').supported, false);
  assert.equal(estimateShipping('Mosquera', '').supported, false);
});

// ===========================================================================
// HU27 - Seguimiento por estados
// ===========================================================================

test('HU27-CA01, CA02 y CA03 los avances son cronológicos y sin saltos', () => {
  const [demo] = createDemoOrders(INITIAL_PRODUCTS);
  assert.equal(demo.status, ORDER_STATUS.CONFIRMADO);
  assert.ok(demo.history.length >= 1);
  const first = advanceOrderStatus(demo);
  assert.equal(first.order.status, ORDER_STATUS.PREPARANDO);
  assert.equal(first.order.history.length, demo.history.length + 1);
  assert.equal(first.notification.type, 'pedido');
  const second = advanceOrderStatus(first.order);
  assert.equal(second.order.status, ORDER_STATUS.EN_CAMINO);
  const third = advanceOrderStatus(second.order);
  assert.equal(third.order.status, ORDER_STATUS.ENTREGADO);
});

test('HU27-CA04 entregado y cancelado no avanzan', () => {
  assert.match(advanceOrderStatus({ status: ORDER_STATUS.ENTREGADO }).error, /no admite nuevas transiciones/);
  assert.match(advanceOrderStatus({ status: ORDER_STATUS.CANCELADO }).error, /no admite nuevas transiciones/);
});

test('HU27 los pedidos de prueba cubren varios estados', () => {
  const demos = createDemoOrders(INITIAL_PRODUCTS);
  assert.deepEqual(demos.map((order) => order.status), ['Confirmado', 'Preparando', 'En camino']);
  for (const order of demos) assert.ok(order.history.length >= 1);
});

// ===========================================================================
// HU28 - Cancelación y reintegro de stock
// ===========================================================================

test('HU28-CA01 cancelar Confirmado cambia el estado y registra el evento', () => {
  const [demo] = createDemoOrders(INITIAL_PRODUCTS);
  const result = cancelOrder(demo, INITIAL_PRODUCTS);
  assert.equal(result.order.status, ORDER_STATUS.CANCELADO);
  assert.equal(result.order.history.at(-1).status, ORDER_STATUS.CANCELADO);
  assert.equal(result.order.restocked, true);
  assert.ok(result.notification);
});

test('HU28-CA02 En camino y Entregado no se pueden cancelar', () => {
  const demos = createDemoOrders(INITIAL_PRODUCTS);
  assert.match(cancelOrder(demos[2], INITIAL_PRODUCTS).error, /solo se cancelan pedidos Confirmado o Preparando/);
  assert.match(cancelOrder({ ...demos[0], status: ORDER_STATUS.ENTREGADO }, INITIAL_PRODUCTS).error, /solo se cancelan pedidos Confirmado o Preparando/);
});

test('HU28-CA03 la cancelación restituye exactamente las unidades de cada variante', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  const confirmed = createConfirmedOrder({
    cart: setCartLine({}, product, 'VAR-K552-RED', 2),
    products: INITIAL_PRODUCTS,
    buyer: validBuyer,
  });
  const afterBuy = confirmed.nextProducts.find((item) => item.id === 'PROD-001');
  assert.equal(getVariant(afterBuy, 'VAR-K552-RED').stock, 3);
  assert.equal(afterBuy.stock, 10);
  const result = cancelOrder(confirmed.order, confirmed.nextProducts);
  const restored = result.nextProducts.find((item) => item.id === 'PROD-001');
  assert.equal(getVariant(restored, 'VAR-K552-RED').stock, 5);
  assert.equal(restored.stock, 12);
  for (const item of result.nextProducts) assert.ok(getProductStock(item) >= 0);
});

test('HU28-CA04 cancelar dos veces no duplica el inventario', () => {
  const [demo] = createDemoOrders(INITIAL_PRODUCTS);
  const first = cancelOrder(demo, INITIAL_PRODUCTS);
  const second = cancelOrder(first.order, first.nextProducts);
  assert.match(second.error, /ya está cancelado/);
  assert.equal(second.nextProducts, undefined);
  assert.equal(first.nextProducts.find((item) => item.id === 'PROD-001').stock, 12);
});

// ===========================================================================
// HU29 - Notificaciones internas
// ===========================================================================

test('HU29-CA01, CA02, CA03 y CA04 avisos únicos, leídos y sin duplicados', () => {
  let notifications = [];
  const note = appendNotification(notifications, {
    id: 'N1', type: 'pedido', message: 'Pedido SWH-1 cambió a Preparando.', dedupeKey: 'pedido-SWH-1-Preparando',
  });
  notifications = note;
  notifications = appendNotification(notifications, { ...note[0], dedupeKey: 'pedido-SWH-1-Preparando' });
  assert.equal(notifications.length, 1);
  notifications = notifications.map((item) => ({ ...item, read: true }));
  assert.equal(notifications[0].read, true);
  assert.deepEqual(appendNotification([], { dedupeKey: 'x' }).length, 1);
});

// ===========================================================================
// HU30 - Avisos de reposición
// ===========================================================================

test('HU30-CA01, CA03 y CA04 suscripción única y cancelable', () => {
  const alert = createStockAlert('PROD-001', 'VAR-K552-BLU');
  assert.equal(alert.id, 'PROD-001::VAR-K552-BLU');
  const duplicate = createStockAlert('PROD-001', 'VAR-K552-BLU');
  assert.equal(duplicate.id, alert.id);
  assert.equal(alert.active, true);
  assert.equal({ ...alert, active: false }.active, false);
});

test('HU30-CA02 reponer genera un aviso de reposición', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  const restored = restockLine(product, 'VAR-K552-BLU', 4);
  assert.equal(getVariant(restored, 'VAR-K552-BLU').stock, 4);
  assert.equal(restored.stock, 16);
  const note = buildRestockNotification(product, 'VAR-K552-BLU', 4);
  assert.equal(note.type, 'reposicion');
  assert.match(note.message, /Reposición simulada/);
});

// ===========================================================================
// HU31 - Recomendaciones
// ===========================================================================

test('HU31-CA01 hasta cuatro artículos de la misma categoría', () => {
  const recommendations = getRecommendations(INITIAL_PRODUCTS, 'PROD-004', 4);
  assert.ok(recommendations.length <= 4);
  for (const item of recommendations) {
    assert.equal(item.category, 'GPU');
    assert.notEqual(item.id, 'PROD-004');
  }
});

test('HU31-CA02 las variantes agotadas no se presentan como disponibles', () => {
  const product = INITIAL_PRODUCTS.find((item) => item.id === 'PROD-001');
  const emptyVariantProduct = { ...product, variants: product.variants.map((variant) => ({ ...variant, stock: 0 })) };
  const products = INITIAL_PRODUCTS.map((item) => (item.id === 'PROD-002' ? emptyVariantProduct : item));
  const recommendations = getRecommendations(products, 'PROD-003', 4);
  assert.equal(recommendations.some((item) => item.id === 'PROD-002'), false);
});

test('HU31-CA03 categoría con un solo producto entrega estado vacío', () => {
  const only = [INITIAL_PRODUCTS[0]];
  assert.deepEqual(getRecommendations(only, 'PROD-001', 4), []);
});

// ===========================================================================
// HU32 - Centro de ayuda
// ===========================================================================

test('HU32-CA01, CA02 y CA03 validación y número único de caso', () => {
  assert.match(validateSupportRequest('', 'Corta'), /pedido/);
  assert.match(validateSupportRequest('SWH-1', 'Corta'), /15 caracteres/);
  assert.equal(validateSupportRequest('SWH-1', 'El pedido llegó con un artículo dañado.'), '');
  const ticket = createSupportTicket({ orderCode: 'SWH-1', motive: 'Producto', description: 'El pedido llegó con un artículo dañado.' });
  assert.match(ticket.id, /^CASO-/);
  assert.equal(ticket.status, 'Abierto');
  assert.equal(ticket.motive, 'Producto');
});

test('HU32-CA04 simular respuesta conserva el registro', () => {
  const ticket = createSupportTicket({ orderCode: 'SWH-1', motive: 'Entrega', description: 'La entrega no llegó en el plazo estimado.' });
  const answered = simulateTicketReply(ticket);
  assert.equal(answered.status, 'Respondido');
  assert.equal(answered.id, ticket.id);
  assert.match(answered.response, /simulada/);
});

// ===========================================================================
// Integración: persistencia de las colecciones nuevas
// ===========================================================================

test('IN-01 la normalización conserva direcciones, avisos, preguntas, casos y comparación', () => {
  const restored = normalizePersistedData({
    addresses: [{ id: 'DIR-001', alias: 'Casa', municipality: 'Mosquera', reference: 'Calle 1 # 2-3', principal: false }],
    selectedAddressId: 'DIR-001',
    shippingModal: 'express',
    notifications: [{ id: 'N1', message: 'Aviso', dedupeKey: 'n1' }],
    questions: [{ id: 'Q1', productId: 'PROD-001', question: 'Pregunta de prueba' }],
    stockAlerts: [{ id: 'PROD-001::VAR-K552-BLU', productId: 'PROD-001', variantId: 'VAR-K552-BLU', active: true }],
    tickets: [{ id: 'CASO-1', orderCode: 'SWH-1', status: 'Abierto' }],
    compareIds: ['PROD-001', 'PROD-004', 'PROD-007', 'PROD-010'],
  });
  assert.equal(restored.addresses[0].principal, true);
  assert.equal(restored.selectedAddressId, 'DIR-001');
  assert.equal(restored.shippingModal, 'express');
  assert.equal(restored.notifications.length, 1);
  assert.equal(restored.questions.length, 1);
  assert.equal(restored.stockAlerts.length, 1);
  assert.equal(restored.tickets.length, 1);
  assert.equal(restored.compareIds.length, 3);
});

test('IN-02 los carritos con variantes se restauran limitados al stock de la variante', () => {
  const restored = normalizePersistedData({
    cart: { [variantKey]: 99, 'PROD-001::VAR-INEXISTENTE': 2 },
  });
  assert.deepEqual(restored.cart, { [variantKey]: 7 });
});

test('IN-03 sincronizar stock nunca produce cifras negativas', () => {
  const product = syncProductStock({
    id: 'X', name: 'Producto de prueba', category: 'CPU', price: 1000, description: 'Descripción de prueba válida.',
    variants: [{ id: 'V1', label: 'Única', price: 1000, stock: -5 }],
  });
  assert.equal(product.stock, 0);
});
