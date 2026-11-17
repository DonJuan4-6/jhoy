import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateTotals,
  CATEGORIES,
  COUPON_CODE,
  createConfirmedOrder,
  filterAndSortProducts,
  getRatingStats,
  INITIAL_PRODUCTS,
  isValidCoupon,
  normalizePersistedData,
  validateBuyer,
  validateCart,
  validateProduct,
  validateRating,
} from './marketplace.mjs';

const validBuyer = { name: 'Ana Ruiz', phone: '3001234567', municipality: 'Bogotá', address: 'Calle 10 # 20-30' };

test('el catálogo inicia con 12 productos válidos en las cuatro categorías', () => {
  assert.equal(INITIAL_PRODUCTS.length, 12);
  assert.deepEqual(new Set(INITIAL_PRODUCTS.map((product) => product.category)), new Set(CATEGORIES));
  assert.equal(new Set(INITIAL_PRODUCTS.map((product) => product.id)).size, 12);
  for (const product of INITIAL_PRODUCTS) assert.equal(validateProduct(product), '');
});

test('búsqueda sin distinguir mayúsculas y filtro de categoría se combinan', () => {
  const found = filterAndSortProducts(INITIAL_PRODUCTS, 'g305', 'Periféricos', 'featured');
  assert.deepEqual(found.map((product) => product.id), ['PROD-002']);
  assert.deepEqual(filterAndSortProducts(INITIAL_PRODUCTS, 'RTX', 'CPU', 'featured'), []);
});

test('quitar el término conserva el filtro de categoría y el orden es ascendente o descendente', () => {
  const categoryResults = filterAndSortProducts(INITIAL_PRODUCTS, '', 'GPU', 'featured');
  assert.equal(categoryResults.length, 3);
  const ascending = filterAndSortProducts(categoryResults, '', 'GPU', 'asc').map((product) => product.price);
  const descending = filterAndSortProducts(categoryResults, '', 'GPU', 'desc').map((product) => product.price);
  assert.deepEqual(ascending, [...ascending].sort((a, b) => a - b));
  assert.deepEqual(descending, [...ascending].reverse());
});

test('envío cuesta $8.000 bajo $150.000 y es gratis desde el umbral', () => {
  assert.deepEqual(calculateTotals({ 'PROD-002': 1 }, INITIAL_PRODUCTS), { subtotal: 145000, shipping: 8000, discount: 0, total: 153000 });
  assert.deepEqual(calculateTotals({ 'PROD-010': 1 }, INITIAL_PRODUCTS), { subtotal: 150000, shipping: 0, discount: 0, total: 150000 });
  assert.deepEqual(calculateTotals({}, INITIAL_PRODUCTS), { subtotal: 0, shipping: 0, discount: 0, total: 0 });
});

test('cupón de prueba valida BIENVENIDO10 y limita el descuento al subtotal', () => {
  assert.equal(isValidCoupon(` ${COUPON_CODE.toLowerCase()} `), true);
  assert.equal(isValidCoupon('CUPON-INVALIDO'), false);
  assert.deepEqual(calculateTotals({ 'PROD-002': 1 }, INITIAL_PRODUCTS, true), { subtotal: 145000, shipping: 8000, discount: 14500, total: 138500 });
  assert.equal(calculateTotals({}, INITIAL_PRODUCTS, true).total, 0);
});

test('carrito rechaza vacío, cantidad no positiva y stock insuficiente', () => {
  assert.match(validateCart({}, INITIAL_PRODUCTS), /vacío/);
  assert.match(validateCart({ 'PROD-001': 0 }, INITIAL_PRODUCTS), /entero positivo/);
  assert.match(validateCart({ 'PROD-003': 1 }, INITIAL_PRODUCTS), /Stock insuficiente/);
  assert.equal(validateCart({ 'PROD-001': 2 }, INITIAL_PRODUCTS), '');
});

test('datos de entrega obligatorios se validan después de quitar espacios', () => {
  assert.match(validateBuyer({ ...validBuyer, name: '   ' }), /nombre/);
  assert.match(validateBuyer({ ...validBuyer, phone: '123' }), /teléfono válido/);
  assert.equal(validateBuyer(validBuyer), '');
});

test('panel vendedor acepta precio entero positivo y stock entero no negativo', () => {
  const product = { name: 'Ventilador RGB silencioso', category: 'Periféricos', price: 65000, stock: 0, description: 'Ventilador silencioso para mejorar el flujo de aire.' };
  assert.equal(validateProduct(product), '');
  assert.match(validateProduct({ ...product, price: 0 }), /precio/);
  assert.match(validateProduct({ ...product, stock: -1 }), /stock/);
  assert.match(validateProduct({ ...product, description: 'corta' }), /15 caracteres/);
});

test('reseñas solo admiten enteros de una a cinco estrellas y el promedio se recalcula', () => {
  assert.equal(validateRating(5), '');
  assert.match(validateRating(0), /entre 1 y 5/);
  assert.match(validateRating(5.5), /entre 1 y 5/);
  assert.deepEqual(getRatingStats([5, 4, 5]), { count: 3, average: 4.7 });
  assert.deepEqual(getRatingStats([]), { count: 0, average: null });
});

test('confirmar crea una copia del pedido y descuenta existencias solo al confirmar', () => {
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

test('pedido con cualquier línea sin stock falla sin descontar parcialmente el inventario', () => {
  const result = createConfirmedOrder({
    cart: { 'PROD-001': 1, 'PROD-003': 1 },
    products: INITIAL_PRODUCTS,
    buyer: validBuyer,
  });
  assert.match(result.error, /Stock insuficiente/);
  assert.equal(result.nextProducts, undefined);
  assert.equal(INITIAL_PRODUCTS.find((product) => product.id === 'PROD-001').stock, 12);
});

test('persistencia descarta cantidades, favoritos y pedidos corruptos sin inventario negativo', () => {
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
