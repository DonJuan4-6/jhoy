export const CATEGORIES = ['Periféricos', 'GPU', 'CPU', 'Almacenamiento'];
export const SHIPPING_THRESHOLD = 150000;
export const SHIPPING_FEE = 8000;
export const COUPON_CODE = 'BIENVENIDO10';
export const isValidCoupon = (code) => String(code || '').trim().toUpperCase() === COUPON_CODE;

export const INITIAL_PRODUCTS = [
  { id: 'PROD-001', name: 'Teclado mecánico K552', category: 'Periféricos', price: 229000, stock: 12, description: 'Teclado mecánico compacto con switches táctiles, iluminación y construcción resistente para jugar o trabajar.', icon: '⌨', short: 'K552', ratings: [5, 4, 5, 5] },
  { id: 'PROD-002', name: 'Mouse inalámbrico G305', category: 'Periféricos', price: 145000, stock: 20, description: 'Mouse inalámbrico ligero con sensor preciso y batería de larga duración para un control confiable.', icon: '⌁', short: 'G305', ratings: [5, 4, 4, 5] },
  { id: 'PROD-003', name: 'Audífonos Cloud Stinger', category: 'Periféricos', price: 179000, stock: 0, description: 'Audífonos cómodos con micrófono abatible y audio envolvente para largas sesiones de juego.', icon: '◖', short: 'STINGER', ratings: [4, 5, 4] },
  { id: 'PROD-004', name: 'GeForce RTX 4060 8 GB', category: 'GPU', price: 1299000, stock: 5, description: 'Tarjeta gráfica eficiente para jugar en alta definición, crear contenido y acelerar tus aplicaciones.', icon: '▰', short: 'RTX 4060', ratings: [5, 5, 4, 5] },
  { id: 'PROD-005', name: 'Radeon RX 7600 8 GB', category: 'GPU', price: 1199000, stock: 4, description: 'Gráfica de alto rendimiento con 8 GB de memoria para disfrutar tus juegos favoritos con fluidez.', icon: '▰', short: 'RX 7600', ratings: [4, 5, 4, 5] },
  { id: 'PROD-006', name: 'GeForce RTX 4070 SUPER', category: 'GPU', price: 2899000, stock: 2, description: 'Potente tarjeta gráfica para gaming avanzado y creación con tecnologías modernas de renderizado.', icon: '▰', short: 'RTX 4070', ratings: [5, 5, 5, 4] },
  { id: 'PROD-007', name: 'AMD Ryzen 5 5600', category: 'CPU', price: 499000, stock: 9, description: 'Procesador de seis núcleos con gran desempeño para gaming y productividad en equipos actuales.', icon: '▦', short: 'RYZEN 5', ratings: [5, 4, 5] },
  { id: 'PROD-008', name: 'AMD Ryzen 7 7800X3D', category: 'CPU', price: 1849000, stock: 6, description: 'Procesador de ocho núcleos optimizado para alcanzar alto rendimiento en juegos y creación.', icon: '▦', short: 'RYZEN 7', ratings: [5, 5, 5, 4] },
  { id: 'PROD-009', name: 'Intel Core i5-14600KF', category: 'CPU', price: 1349000, stock: 3, description: 'Procesador híbrido de alto rendimiento para multitarea, gaming y aplicaciones exigentes.', icon: '▦', short: 'CORE i5', ratings: [4, 5, 5, 4] },
  { id: 'PROD-010', name: 'SSD SATA 480 GB', category: 'Almacenamiento', price: 150000, stock: 15, description: 'Unidad de estado sólido rápida y silenciosa para renovar tu equipo y acceder pronto a tus archivos.', icon: '▱', short: 'SSD 480', ratings: [4, 4, 5] },
  { id: 'PROD-011', name: 'Kingston NV2 1 TB', category: 'Almacenamiento', price: 299000, stock: 10, description: 'Almacenamiento NVMe de 1 TB con formato compacto para instalar juegos, proyectos y archivos.', icon: '▱', short: 'NV2 1TB', ratings: [5, 4, 5, 5] },
  { id: 'PROD-012', name: 'Samsung 990 PRO 2 TB', category: 'Almacenamiento', price: 699000, stock: 7, description: 'SSD NVMe de gran capacidad y velocidad para profesionales, creadores y aficionados exigentes.', icon: '▱', short: '990 PRO', ratings: [5, 5, 4, 5] },
];

export const formatPrice = (price) => `$${Number(price || 0).toLocaleString('es-CO')}`;

export function filterAndSortProducts(products, search, category, sort) {
  const term = search.trim().toLocaleLowerCase();
  const filtered = products.filter((product) => {
    const matchesSearch = !term || `${product.name} ${product.category}`.toLocaleLowerCase().includes(term);
    const matchesCategory = !category || category === 'Todas' || category === 'Todos' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  if (sort === 'asc') return filtered.sort((a, b) => a.price - b.price);
  if (sort === 'desc') return filtered.sort((a, b) => b.price - a.price);
  return filtered;
}

export function calculateTotals(cart, products, couponApplied = false) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const subtotal = Object.entries(cart).reduce((sum, [id, quantity]) => {
    const product = productById.get(id);
    return product && Number.isInteger(quantity) && quantity > 0 ? sum + product.price * quantity : sum;
  }, 0);
  const shipping = subtotal === 0 ? 0 : subtotal < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const discount = couponApplied ? Math.min(subtotal, Math.floor(subtotal * 0.1)) : 0;
  return { subtotal, shipping, discount, total: subtotal + shipping - discount };
}

export function validateCart(cart, products) {
  const items = Object.entries(cart);
  if (items.length === 0) return 'El carrito está vacío.';
  for (const [id, quantity] of items) {
    const product = products.find((item) => item.id === id);
    if (!product) return 'Hay un producto del carrito que ya no está disponible.';
    if (!Number.isInteger(quantity) || quantity <= 0) return 'La cantidad debe ser un entero positivo.';
    if (product.stock < quantity) return `Stock insuficiente para ${product.name}.`;
  }
  return '';
}

export function validateBuyer(buyer) {
  const labels = { name: 'nombre', phone: 'teléfono', municipality: 'municipio', address: 'dirección' };
  const missing = Object.entries(labels)
    .filter(([key]) => !String(buyer[key] || '').trim())
    .map(([, label]) => label);
  if (missing.length) return `Completa este dato obligatorio: ${missing.join(', ')}.`;
  const digits = String(buyer.phone).replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) return 'Ingresa un teléfono válido de 7 a 15 dígitos.';
  return '';
}

export function validateProduct(product) {
  if (!String(product.name || '').trim()) return 'Escribe el nombre del producto.';
  if (!CATEGORIES.includes(product.category)) return 'Selecciona una categoría válida.';
  if (!Number.isInteger(product.price) || product.price <= 0) return 'El precio debe ser un entero positivo en COP.';
  if (!Number.isInteger(product.stock) || product.stock < 0) return 'El stock debe ser un entero igual o mayor a cero.';
  if (String(product.description || '').trim().length < 15) return 'La descripción debe tener al menos 15 caracteres.';
  return '';
}

export function validateRating(rating) {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? '' : 'La valoración debe ser un número entero entre 1 y 5.';
}

export function getRatingStats(ratings = []) {
  const valid = ratings.filter((rating) => !validateRating(rating));
  if (valid.length === 0) return { count: 0, average: null };
  const average = valid.reduce((sum, rating) => sum + rating, 0) / valid.length;
  return { count: valid.length, average: Math.round(average * 10) / 10 };
}

export function createConfirmedOrder({ cart, products, buyer, couponApplied = false, now = new Date(), randomPart = Math.random().toString(36).slice(2, 7).toUpperCase() }) {
  const cartError = validateCart(cart, products);
  if (cartError) return { error: cartError };
  const buyerError = validateBuyer(buyer);
  if (buyerError) return { error: buyerError };

  const totals = calculateTotals(cart, products, couponApplied);
  const items = Object.entries(cart).map(([id, quantity]) => {
    const product = products.find((item) => item.id === id);
    return { id: product.id, name: product.name, category: product.category, price: product.price, quantity, icon: product.icon };
  });
  const nextProducts = products.map((product) => (
    cart[product.id] ? { ...product, stock: product.stock - cart[product.id] } : product
  ));
  const order = {
    code: `SWH-${now.getTime()}-${randomPart}`,
    date: now.toISOString(),
    items,
    ...totals,
    simulated: true,
  };
  return { order, nextProducts };
}

function isValidProduct(product) {
  return product && typeof product.id === 'string' && product.id.trim()
    && !validateProduct(product)
    && Array.isArray(product.ratings)
    && product.ratings.every((rating) => !validateRating(rating));
}

function isValidOrder(order) {
  return order && typeof order.code === 'string' && typeof order.date === 'string'
    && Array.isArray(order.items)
    && ['subtotal', 'shipping', 'discount', 'total'].every((key) => Number.isInteger(order[key]) && order[key] >= 0)
    && order.items.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string'
      && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.price) && item.price > 0);
}

export function normalizePersistedData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { products: INITIAL_PRODUCTS, cart: {}, favorites: [], orders: [] };
  }

  const storedProducts = Array.isArray(value.products) ? value.products.filter(isValidProduct) : [];
  const productsById = new Map(storedProducts.map((product) => [product.id, { ...product, ratings: [...product.ratings] }]));
  for (const product of INITIAL_PRODUCTS) {
    if (!productsById.has(product.id)) productsById.set(product.id, product);
  }
  const products = [...productsById.values()];
  const productById = new Map(products.map((product) => [product.id, product]));
  const cart = {};
  if (value.cart && typeof value.cart === 'object' && !Array.isArray(value.cart)) {
    for (const [id, quantity] of Object.entries(value.cart)) {
      const product = productById.get(id);
      if (product && Number.isInteger(quantity) && quantity > 0 && product.stock > 0) {
        cart[id] = Math.min(quantity, product.stock);
      }
    }
  }
  const favorites = Array.isArray(value.favorites)
    ? [...new Set(value.favorites.filter((id) => productById.has(id)))]
    : [];
  const orders = Array.isArray(value.orders) ? value.orders.filter(isValidOrder) : [];
  return { products, cart, favorites, orders };
}
