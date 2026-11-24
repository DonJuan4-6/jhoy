// JHOY / SWAREH - Marketplace 2.0
// Reglas de negocio, datos iniciales y validaciones (fuente única de la lógica).
// Toda la operación es una simulación académica: no hay pagos, envíos reales ni APIs.

export const CATEGORIES = ['Periféricos', 'GPU', 'CPU', 'Almacenamiento'];
export const SHIPPING_THRESHOLD = 150000;
export const SHIPPING_FEE = 8000;
export const COUPON_CODE = 'BIENVENIDO10';
export const isValidCoupon = (code) => String(code || '').trim().toUpperCase() === COUPON_CODE;

// ---------------------------------------------------------------------------
// HU26 - Tarifas ficticias de envío por municipio y modalidad
// ---------------------------------------------------------------------------
export const SHIPPING_RATES = {
  Mosquera: { estandar: 6000, express: 10000 },
  Funza: { estandar: 8000, express: 12000 },
  Madrid: { estandar: 10000, express: 14000 },
};
export const SHIPPING_MODALITIES = [
  { id: 'estandar', label: 'Estándar', days: '1 a 2 días' },
  { id: 'express', label: 'Exprés', days: '1 a 2 días' },
];

export function estimateShipping(municipality, modality) {
  const name = String(municipality || '').trim();
  const key = Object.keys(SHIPPING_RATES).find(
    (item) => item.toLocaleLowerCase() === name.toLocaleLowerCase(),
  );
  if (!key) {
    return {
      supported: false,
      cost: 0,
      days: null,
      message: 'Todavía no ofrecemos envío a ese municipio. Elige Mosquera, Funza o Madrid.',
    };
  }
  const option = SHIPPING_MODALITIES.find((item) => item.id === modality);
  if (!option) {
    return {
      supported: false,
      municipality: key,
      cost: 0,
      days: null,
      message: 'Selecciona una modalidad de envío (Estándar o Exprés).',
    };
  }
  return {
    supported: true,
    municipality: key,
    modality: option.id,
    label: option.label,
    cost: SHIPPING_RATES[key][option.id],
    days: option.days,
  };
}

// ---------------------------------------------------------------------------
// HU27 / HU28 - Estados del pedido y transiciones permitidas
// ---------------------------------------------------------------------------
export const ORDER_STATUS = {
  CONFIRMADO: 'Confirmado',
  PREPARANDO: 'Preparando',
  EN_CAMINO: 'En camino',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};
export const NEXT_STATUS = {
  [ORDER_STATUS.CONFIRMADO]: ORDER_STATUS.PREPARANDO,
  [ORDER_STATUS.PREPARANDO]: ORDER_STATUS.EN_CAMINO,
  [ORDER_STATUS.EN_CAMINO]: ORDER_STATUS.ENTREGADO,
  [ORDER_STATUS.ENTREGADO]: null,
  [ORDER_STATUS.CANCELADO]: null,
};
export const CANCELABLE_STATUS = [ORDER_STATUS.CONFIRMADO, ORDER_STATUS.PREPARANDO];

// ---------------------------------------------------------------------------
// Catálogo base. El stock de un producto con variantes SIEMPRE se deriva de
// sus variantes: no existen dos cifras independientes que puedan diverger.
// ---------------------------------------------------------------------------
export function syncProductStock(product) {
  if (Array.isArray(product.variants) && product.variants.length) {
    return {
      ...product,
      stock: product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0),
    };
  }
  return product;
}

const withStock = (product) => syncProductStock(product);

export const INITIAL_PRODUCTS = [
  withStock({
    id: 'PROD-001', name: 'Teclado mecánico K552', brand: 'Keytron', category: 'Periféricos',
    price: 229000, description: 'Teclado mecánico compacto con switches táctiles, iluminación y construcción resistente para jugar o trabajar.',
    icon: '⌨', short: 'K552', ratings: [5, 4, 5, 5],
    variants: [
      { id: 'VAR-K552-BRN', label: 'Switch marrón', price: 229000, stock: 7 },
      { id: 'VAR-K552-RED', label: 'Switch rojo', price: 234000, stock: 5 },
      { id: 'VAR-K552-BLU', label: 'Switch azul', price: 232000, stock: 0 },
    ],
  }),
  withStock({
    id: 'PROD-002', name: 'Mouse inalámbrico G305', brand: 'Logix', category: 'Periféricos',
    price: 145000, description: 'Mouse inalámbrico ligero con sensor preciso y batería de larga duración para un control confiable.',
    icon: '⌁', short: 'G305', ratings: [5, 4, 4, 5],
    variants: [
      { id: 'VAR-G305-BLK', label: 'Negro', price: 145000, stock: 12 },
      { id: 'VAR-G305-WHT', label: 'Blanco', price: 149000, stock: 8 },
    ],
  }),
  withStock({
    id: 'PROD-003', name: 'Audífonos Cloud Stinger', brand: 'Auralite', category: 'Periféricos',
    price: 179000, stock: 0, description: 'Audífonos cómodos con micrófono abatible y audio envolvente para largas sesiones de juego.',
    icon: '◖', short: 'STINGER', ratings: [4, 5, 4],
  }),
  withStock({
    id: 'PROD-004', name: 'GeForce RTX 4060 8 GB', brand: 'Vortex', category: 'GPU',
    price: 1299000, description: 'Tarjeta gráfica eficiente para jugar en alta definición, crear contenido y acelerar tus aplicaciones.',
    icon: '▰', short: 'RTX 4060', ratings: [5, 5, 4, 5],
    variants: [
      { id: 'VAR-4060-STD', label: '8 GB Estándar', price: 1299000, stock: 3 },
      { id: 'VAR-4060-OC', label: '8 GB OC Edition', price: 1349000, stock: 2 },
    ],
  }),
  withStock({
    id: 'PROD-005', name: 'Radeon RX 7600 8 GB', brand: 'Radeonix', category: 'GPU',
    price: 1199000, stock: 4, description: 'Gráfica de alto rendimiento con 8 GB de memoria para disfrutar tus juegos favoritos con fluidez.',
    icon: '▰', short: 'RX 7600', ratings: [4, 5, 4, 5],
  }),
  withStock({
    id: 'PROD-006', name: 'GeForce RTX 4070 SUPER', brand: 'Vortex', category: 'GPU',
    price: 2899000, stock: 2, description: 'Potente tarjeta gráfica para gaming avanzado y creación con tecnologías modernas de renderizado.',
    icon: '▰', short: 'RTX 4070', ratings: [5, 5, 5, 4],
  }),
  withStock({
    id: 'PROD-007', name: 'AMD Ryzen 5 5600', brand: 'Coreon', category: 'CPU',
    price: 499000, stock: 9, description: 'Procesador de seis núcleos con gran desempeño para gaming y productividad en equipos actuales.',
    icon: '▦', short: 'RYZEN 5', ratings: [5, 4, 5],
  }),
  withStock({
    id: 'PROD-008', name: 'AMD Ryzen 7 7800X3D', brand: 'Coreon', category: 'CPU',
    price: 1849000, stock: 6, description: 'Procesador de ocho núcleos optimizado para alcanzar alto rendimiento en juegos y creación.',
    icon: '▦', short: 'RYZEN 7', ratings: [5, 5, 5, 4],
  }),
  withStock({
    id: 'PROD-009', name: 'Intel Core i5-14600KF', brand: 'Coreon', category: 'CPU',
    price: 1349000, stock: 3, description: 'Procesador híbrido de alto rendimiento para multitarea, gaming y aplicaciones exigentes.',
    icon: '▦', short: 'CORE i5', ratings: [4, 5, 5, 4],
  }),
  withStock({
    id: 'PROD-010', name: 'SSD SATA 480 GB', brand: 'NexaStorage', category: 'Almacenamiento',
    price: 150000, stock: 15, description: 'Unidad de estado sólido rápida y silenciosa para renovar tu equipo y acceder pronto a tus archivos.',
    icon: '▱', short: 'SSD 480', ratings: [4, 4, 5],
  }),
  withStock({
    id: 'PROD-011', name: 'Kingston NV2 1 TB', brand: 'NexaStorage', category: 'Almacenamiento',
    price: 299000, stock: 10, description: 'Almacenamiento NVMe de 1 TB con formato compacto para instalar juegos, proyectos y archivos.',
    icon: '▱', short: 'NV2 1TB', ratings: [5, 4, 5, 5],
  }),
  withStock({
    id: 'PROD-012', name: 'Samsung 990 PRO 2 TB', brand: 'NexaStorage', category: 'Almacenamiento',
    price: 699000, stock: 7, description: 'SSD NVMe de gran capacidad y velocidad para profesionales, creadores y aficionados exigentes.',
    icon: '▱', short: '990 PRO', ratings: [5, 5, 4, 5],
  }),
];

export const BRANDS = [...new Set(INITIAL_PRODUCTS.map((product) => product.brand))].sort();

// Direcciones y preguntas de prueba (datos ficticios).
export const INITIAL_ADDRESSES = [
  { id: 'DIR-001', alias: 'Casa', municipality: 'Mosquera', reference: 'Calle 5 # 12-30, apto 2', principal: true },
];

export const INITIAL_QUESTIONS = [
  {
    id: 'Q-001', productId: 'PROD-001',
    question: '¿El teclado incluye cable de conexión en la caja?',
    answer: 'Respuesta simulada: sí, incluye cable USB trenzado. Esta respuesta es generada por el modo demostración.',
    status: 'Respondida', date: '2026-11-18T09:00:00.000Z',
  },
  {
    id: 'Q-002', productId: 'PROD-004',
    question: '¿Esta gráfica funciona con fuentes de 550 W?',
    answer: '', status: 'Pendiente', date: '2026-11-19T10:30:00.000Z',
  },
];

export const formatPrice = (price) => `$${Number(price || 0).toLocaleString('es-CO')}`;

// ---------------------------------------------------------------------------
// HU21 - Variantes: identificadores y stock por variante
// ---------------------------------------------------------------------------
export function getVariant(product, variantId) {
  if (!variantId || !Array.isArray(product?.variants)) return null;
  return product.variants.find((variant) => variant.id === variantId) || null;
}

export function availableVariants(product) {
  if (!Array.isArray(product?.variants)) return [];
  return product.variants.filter((variant) => variant.stock > 0);
}

export function getLineInfo(product, variantId) {
  const variant = getVariant(product, variantId);
  if (variant) {
    return { price: variant.price, stock: variant.stock, label: variant.label, variantId: variant.id };
  }
  return {
    price: product.price,
    stock: Number(product.stock || 0),
    label: null,
    variantId: null,
  };
}

export function getProductStock(product) {
  if (Array.isArray(product?.variants) && product.variants.length) {
    return product.variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0);
  }
  return Number(product?.stock || 0);
}

export function makeCartKey(productId, variantId) {
  return variantId ? `${productId}::${variantId}` : String(productId);
}

export function parseCartKey(key) {
  const [productId, variantId] = String(key).split('::');
  return { productId, variantId: variantId || null };
}

export function validateVariantSelection(product, variantId) {
  if (!Array.isArray(product?.variants) || !product.variants.length) return '';
  if (!variantId) return 'Selecciona una variante (talla, color o presentación) antes de agregar el producto.';
  const variant = product.variants.find((item) => item.id === variantId);
  if (!variant) return 'La variante seleccionada ya no está disponible.';
  if (variant.stock <= 0) return 'Esa variante está agotada y no puede comprarse.';
  return '';
}

export function validateCartLine(product, variantId, quantity) {
  if (!Number.isInteger(quantity) || quantity <= 0) return 'La cantidad debe ser un entero positivo.';
  const variantError = validateVariantSelection(product, variantId);
  if (variantError) return variantError;
  const info = getLineInfo(product, variantId);
  if (info.stock < quantity) {
    return `Stock insuficiente para ${info.label || product.name}. Solo hay ${info.stock} unidades; el máximo permitido es ${info.stock}.`;
  }
  return '';
}

export function setCartLine(cart, product, variantId, quantity) {
  const next = { ...cart };
  const key = makeCartKey(product.id, variantId);
  if (quantity <= 0) delete next[key];
  else next[key] = quantity;
  return next;
}

export function getCartLineQuantity(cart, product, variantId) {
  return cart[makeCartKey(product.id, variantId)] || 0;
}

// ---------------------------------------------------------------------------
// HU23 - Filtros combinados + HU06 - Ordenamiento (se conserva)
// ---------------------------------------------------------------------------
export function validatePriceRange(minPrice, maxPrice) {
  const hasMin = String(minPrice ?? '').trim() !== '';
  const hasMax = String(maxPrice ?? '').trim() !== '';
  if (!hasMin && !hasMax) return '';
  const min = Number(minPrice);
  const max = Number(maxPrice);
  if (hasMin && (!Number.isFinite(min) || min < 0)) return 'El precio mínimo debe ser un número positivo.';
  if (hasMax && (!Number.isFinite(max) || max < 0)) return 'El precio máximo debe ser un número positivo.';
  if (hasMin && hasMax && min > max) return 'El precio mínimo no puede ser mayor que el precio máximo.';
  return '';
}

export function filterAndSortProducts(products, search, category, sort, filters = {}) {
  const term = String(search || '').trim().toLocaleLowerCase();
  const {
    brand = 'Todas',
    minPrice = '',
    maxPrice = '',
    onlyAvailable = false,
  } = filters || {};
  const min = String(minPrice).trim() === '' ? null : Number(minPrice);
  const max = String(maxPrice).trim() === '' ? null : Number(maxPrice);

  const filtered = products.filter((product) => {
    const matchesSearch = !term || `${product.name} ${product.category} ${product.brand || ''}`.toLocaleLowerCase().includes(term);
    const matchesCategory = !category || category === 'Todas' || category === 'Todos' || product.category === category;
    const matchesBrand = !brand || brand === 'Todas' || product.brand === brand;
    const matchesMin = min === null || !Number.isFinite(min) || product.price >= min;
    const matchesMax = max === null || !Number.isFinite(max) || product.price <= max;
    const matchesAvailable = !onlyAvailable || getProductStock(product) > 0;
    return matchesSearch && matchesCategory && matchesBrand && matchesMin && matchesMax && matchesAvailable;
  });

  if (sort === 'asc') return [...filtered].sort((a, b) => a.price - b.price);
  if (sort === 'desc') return [...filtered].sort((a, b) => b.price - a.price);
  return filtered;
}

// ---------------------------------------------------------------------------
// HU11 / HU26 - Totales. shippingOverride viene del estimador por municipio;
// cuando no se entrega, se mantiene la regla histórica del Taller 4.
// El envío se SUMa una sola vez en este único punto.
// ---------------------------------------------------------------------------
export function calculateTotals(cart, products, couponApplied = false, shippingOverride = null) {
  const productById = new Map(products.map((product) => [product.id, product]));
  const subtotal = Object.entries(cart).reduce((sum, [key, quantity]) => {
    const { productId, variantId } = parseCartKey(key);
    const product = productById.get(productId);
    if (!product || !Number.isInteger(quantity) || quantity <= 0) return sum;
    return sum + getLineInfo(product, variantId).price * quantity;
  }, 0);
  const shipping = shippingOverride && Number.isFinite(shippingOverride.cost)
    ? Math.max(0, shippingOverride.cost)
    : subtotal === 0 ? 0 : subtotal < SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
  const discount = couponApplied ? Math.min(subtotal, Math.floor(subtotal * 0.1)) : 0;
  return { subtotal, shipping, discount, total: Math.max(0, subtotal + shipping - discount) };
}

export function validateCart(cart, products) {
  const items = Object.entries(cart);
  if (items.length === 0) return 'El carrito está vacío.';
  const productById = new Map(products.map((product) => [product.id, product]));
  for (const [key, quantity] of items) {
    const { productId, variantId } = parseCartKey(key);
    const product = productById.get(productId);
    if (!product) return 'Hay un producto del carrito que ya no está disponible.';
    const error = validateCartLine(product, variantId, quantity);
    if (error) return error;
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

// ---------------------------------------------------------------------------
// HU13 / HU14 - Confirmación inmutable del pedido y descuento de stock
// ---------------------------------------------------------------------------
export function createConfirmedOrder({
  cart,
  products,
  buyer,
  couponApplied = false,
  shippingQuote = null,
  now = new Date(),
  randomPart = Math.random().toString(36).slice(2, 7).toUpperCase(),
}) {
  const cartError = validateCart(cart, products);
  if (cartError) return { error: cartError };
  const buyerError = validateBuyer(buyer);
  if (buyerError) return { error: buyerError };

  const totals = calculateTotals(cart, products, couponApplied, shippingQuote);
  const items = Object.entries(cart).map(([key, quantity]) => {
    const { productId, variantId } = parseCartKey(key);
    const product = products.find((item) => item.id === productId);
    const info = getLineInfo(product, variantId);
    return {
      id: product.id,
      key,
      variantId: info.variantId,
      variantLabel: info.label,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: info.price,
      quantity,
      icon: product.icon,
    };
  });

  const nextProducts = products.map((product) => {
    const lines = items.filter((item) => item.id === product.id);
    if (!lines.length) return product;
    let updated = { ...product };
    for (const line of lines) {
      if (line.variantId && Array.isArray(product.variants)) {
        updated.variants = (updated.variants || []).map((variant) => (
          variant.id === line.variantId
            ? { ...variant, stock: variant.stock - line.quantity }
            : variant
        ));
      } else {
        updated.stock = updated.stock - line.quantity;
      }
    }
    return syncProductStock(updated);
  });

  const code = `SWH-${now.getTime()}-${randomPart}`;
  const date = now.toISOString();
  const order = {
    id: code,
    code,
    date,
    items,
    ...totals,
    status: ORDER_STATUS.CONFIRMADO,
    history: [{ status: ORDER_STATUS.CONFIRMADO, date, note: 'Pedido confirmado en la simulación.' }],
    delivery: {
      alias: buyer.addressAlias || 'Dirección de entrega',
      municipality: buyer.municipality,
      reference: buyer.address,
      customerName: buyer.name,
      phone: buyer.phone,
    },
    shippingModal: shippingQuote ? shippingQuote.modality : null,
    shippingDays: shippingQuote ? shippingQuote.days : null,
    simulated: true,
    stockDeducted: true,
    restocked: false,
  };
  return { order, nextProducts };
}

// ---------------------------------------------------------------------------
// HU27 - Seguimiento por estados (sin saltos, control "Simular avance")
// ---------------------------------------------------------------------------
export function advanceOrderStatus(order, now = new Date()) {
  const next = NEXT_STATUS[order.status];
  if (!next) {
    return { error: `El pedido está ${order.status || 'sin estado'} y no admite nuevas transiciones.` };
  }
  const date = now.toISOString();
  return {
    order: {
      ...order,
      status: next,
      history: [...(order.history || []), { status: next, date, note: 'Avance simulado de entrega.' }],
    },
    notification: makeNotification({
      type: 'pedido',
      message: `Pedido ${order.id || order.code} cambió a ${next}.`,
      reference: order.id || order.code,
      dedupeKey: `pedido-${order.id || order.code}-${next}`,
      date,
    }),
  };
}

// ---------------------------------------------------------------------------
// HU28 - Cancelación lógica con reintegro único de inventario
// ---------------------------------------------------------------------------
export function cancelOrder(order, products, now = new Date()) {
  if (order.status === ORDER_STATUS.CANCELADO || order.restocked) {
    return { error: 'Este pedido ya está cancelado. No se generan reintegros duplicados.' };
  }
  if (!CANCELABLE_STATUS.includes(order.status)) {
    return {
      error: 'No se puede cancelar: solo se cancelan pedidos Confirmado o Preparando, antes del despacho simulado.',
    };
  }

  const date = now.toISOString();
  let nextProducts = products;
  if (order.stockDeducted && !order.restocked) {
    nextProducts = products.map((product) => {
      const lines = (order.items || []).filter((item) => item.id === product.id);
      if (!lines.length) return product;
      let updated = { ...product };
      for (const line of lines) {
        if (line.variantId && Array.isArray(product.variants)) {
          updated.variants = (updated.variants || []).map((variant) => (
            variant.id === line.variantId
              ? { ...variant, stock: variant.stock + line.quantity }
              : variant
          ));
        } else {
          updated.stock = updated.stock + line.quantity;
        }
      }
      return syncProductStock(updated);
    });
  }

  return {
    order: {
      ...order,
      status: ORDER_STATUS.CANCELADO,
      canceledAt: date,
      restocked: true,
      history: [...(order.history || []), { status: ORDER_STATUS.CANCELADO, date, note: 'Pedido cancelado; inventario restituido una sola vez.' }],
    },
    nextProducts,
    notification: makeNotification({
      type: 'cancelacion',
      message: order.stockDeducted
        ? `Pedido ${order.id || order.code} fue cancelado y el inventario fue restituido una sola vez.`
        : `Pedido ${order.id || order.code} fue cancelado (pedido de prueba histórico: su stock ya estaba descontado en el historial).`,
      reference: order.id || order.code,
      dedupeKey: `cancelacion-${order.id || order.code}`,
      date,
    }),
  };
}

// ---------------------------------------------------------------------------
// Pedidos de prueba para verificar el seguimiento (se cargan bajo demanda)
// ---------------------------------------------------------------------------
export function createDemoOrders(products = INITIAL_PRODUCTS, now = new Date()) {
  const findProduct = (id) => products.find((product) => product.id === id);
  const makeItem = (product, variantId, quantity) => {
    const info = getLineInfo(product, variantId);
    return {
      id: product.id,
      key: makeCartKey(product.id, variantId),
      variantId: info.variantId,
      variantLabel: info.label,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: info.price,
      quantity,
      icon: product.icon,
    };
  };
  const makeOrder = (offset, status, items) => {
    const code = `SWH-DEMO-00${offset}`;
    const date = new Date(now.getTime() - offset * 3600000).toISOString();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = SHIPPING_RATES.Mosquera.estandar;
    return {
      id: code,
      code,
      date,
      items,
      subtotal,
      shipping,
      discount: 0,
      total: subtotal + shipping,
      status,
      history: [
        { status: ORDER_STATUS.CONFIRMADO, date, note: 'Pedido de prueba cargado en modo demostración.' },
        ...(status === ORDER_STATUS.CONFIRMADO ? [] : [{ status, date, note: 'Avance de prueba.' }]),
      ],
      delivery: {
        alias: 'Casa (demo)',
        municipality: 'Mosquera',
        reference: 'Dirección ficticia de prueba',
        customerName: 'Comprador de prueba',
        phone: '3000000000',
      },
      shippingModal: 'estandar',
      shippingDays: '1 a 2 días',
      simulated: true,
      demo: true,
      // Pedido histórico de prueba: su descuento de stock ya está reflejado en
      // el catálogo inicial, por eso cancelarlo NO vuelve a restituir unidades.
      stockDeducted: false,
      restocked: false,
    };
  };
  return [
    makeOrder(5, ORDER_STATUS.CONFIRMADO, [makeItem(findProduct('PROD-001'), 'VAR-K552-BRN', 2)]),
    makeOrder(4, ORDER_STATUS.PREPARANDO, [makeItem(findProduct('PROD-002'), 'VAR-G305-BLK', 1)]),
    makeOrder(3, ORDER_STATUS.EN_CAMINO, [makeItem(findProduct('PROD-007'), null, 1)]),
  ];
}

// ---------------------------------------------------------------------------
// HU29 - Notificaciones internas (sin copias de un mismo evento)
// ---------------------------------------------------------------------------
export function makeNotification({
  id,
  type = 'sistema',
  message = '',
  reference = null,
  date = new Date(),
  dedupeKey,
}) {
  const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
  return {
    id: id || `NOT-${Number.isFinite(timestamp) ? timestamp : Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    type,
    message,
    reference,
    date: date instanceof Date ? date.toISOString() : date,
    read: false,
    dedupeKey: dedupeKey || `${type}-${reference || ''}-${message}`,
  };
}

export function appendNotification(notifications, notification) {
  if (notifications.some((item) => item.dedupeKey === notification.dedupeKey)) return notifications;
  return [notification, ...notifications];
}

// ---------------------------------------------------------------------------
// HU24 - Preguntas del producto
// ---------------------------------------------------------------------------
export function validateQuestion(text) {
  const value = String(text || '').trim();
  if (value.length < 10) return 'La pregunta debe tener al menos 10 caracteres.';
  return '';
}

export function createQuestion(productId, text, now = new Date()) {
  return {
    id: `Q-${now.getTime()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
    productId,
    question: String(text).trim(),
    answer: '',
    status: 'Pendiente',
    date: now.toISOString(),
  };
}

export function simulateQuestionAnswer(question, now = new Date()) {
  return {
    ...question,
    status: 'Respondida',
    answer: `Respuesta simulada (modo demostración): revisa la descripción y las variantes de este artículo. Generada el ${now.toLocaleDateString('es-CO')}. No proviene de una persona real.`,
    answeredAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// HU30 - Avisos de reposición
// ---------------------------------------------------------------------------
export function makeStockAlertKey(productId, variantId) {
  return makeCartKey(productId, variantId);
}

export function createStockAlert(productId, variantId) {
  return { id: makeStockAlertKey(productId, variantId), productId, variantId, active: true };
}

export function restockLine(product, variantId, units, now = new Date()) {
  let updated;
  if (variantId && Array.isArray(product.variants)) {
    updated = {
      ...product,
      variants: product.variants.map((variant) => (
        variant.id === variantId ? { ...variant, stock: variant.stock + units } : variant
      )),
    };
  } else {
    updated = { ...product, stock: product.stock + units };
  }
  return syncProductStock(updated);
}

export function buildRestockNotification(product, variantId, units, now = new Date()) {
  const variant = getVariant(product, variantId);
  return makeNotification({
    type: 'reposicion',
    message: `¡Reposición simulada! ${product.name}${variant ? ` · ${variant.label}` : ''} tiene ${units} unidades nuevas disponibles.`,
    reference: makeStockAlertKey(product.id, variantId),
    dedupeKey: `reposicion-${makeStockAlertKey(product.id, variantId)}-${now.getTime()}`,
    date: now,
  });
}

// ---------------------------------------------------------------------------
// HU31 - Recomendaciones: misma categoría, otro producto, con stock disponible
// ---------------------------------------------------------------------------
export function getRecommendations(products, productId, limit = 4) {
  const current = products.find((product) => product.id === productId);
  if (!current) return [];
  return products
    .filter((product) => product.id !== productId && product.category === current.category)
    .map((product) => {
      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
      const variations = availableVariants(product);
      if (hasVariants && variations.length === 0) return null;
      if (!hasVariants && getProductStock(product) <= 0) return null;
      return hasVariants ? { ...product, variants: variations } : product;
    })
    .filter(Boolean)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// HU32 - Centro de ayuda y solicitudes
// ---------------------------------------------------------------------------
export const SUPPORT_MOTIVES = ['Entrega', 'Producto', 'Otro'];

export function validateSupportRequest(orderCode, description) {
  const missing = [];
  if (!String(orderCode || '').trim()) missing.push('un pedido');
  if (String(description || '').trim().length < 15) missing.push('una descripción de al menos 15 caracteres');
  if (missing.length) return `Completa ${missing.join(' y ')}.`;
  return '';
}

export function createSupportTicket({ orderCode, motive, description }, now = new Date()) {
  return {
    id: `CASO-${String(now.getTime()).slice(-6)}${Math.random().toString(36).slice(2, 4).toUpperCase()}`,
    orderCode,
    motive: SUPPORT_MOTIVES.includes(motive) ? motive : 'Otro',
    description: String(description).trim(),
    status: 'Abierto',
    date: now.toISOString(),
    response: '',
  };
}

export function simulateTicketReply(ticket, now = new Date()) {
  return {
    ...ticket,
    status: 'Respondido',
    response: `Respuesta simulada de demostración: revisamos el caso ${ticket.id} asociado al pedido ${ticket.orderCode}. Este mensaje es ficticio y no proviene de un agente real.`,
    respondedAt: now.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// HU22 - Comparador (máximo tres productos, sin tocar carrito ni favoritos)
// ---------------------------------------------------------------------------
export const COMPARE_LIMIT = 3;

export function addToCompare(list, productId) {
  if (list.includes(productId)) return { list, error: '' };
  if (list.length >= COMPARE_LIMIT) {
    return { list, error: `Solo se pueden comparar hasta ${COMPARE_LIMIT} productos.` };
  }
  return { list: [...list, productId], error: '' };
}

export function removeFromCompare(list, productId) {
  return list.filter((id) => id !== productId);
}

// ---------------------------------------------------------------------------
// HU25 - Libreta de direcciones (una sola principal)
// ---------------------------------------------------------------------------
export function validateAddress(address) {
  if (!String(address?.alias || '').trim()) return 'Escribe un alias para la dirección.';
  if (!String(address?.municipality || '').trim()) return 'Escribe el municipio.';
  if (String(address?.reference || '').trim().length < 8) return 'La referencia de entrega debe tener al menos 8 caracteres.';
  return '';
}

export function saveAddress(addresses, address, editingId = null) {
  const error = validateAddress(address);
  if (error) return { error };
  const clean = {
    alias: String(address.alias).trim(),
    municipality: String(address.municipality).trim(),
    reference: String(address.reference).trim(),
  };
  if (editingId) {
    return {
      addresses: addresses.map((item) => (item.id === editingId ? { ...item, ...clean } : item)),
    };
  }
  const nextNumber = addresses.reduce((largest, item) => {
    const match = String(item.id).match(/^DIR-(\d+)$/);
    return match ? Math.max(largest, Number(match[1])) : largest;
  }, 0) + 1;
  return {
    addresses: [
      ...addresses.map((item) => ({ ...item, principal: false })),
      { id: `DIR-${String(nextNumber).padStart(3, '0')}`, ...clean, principal: false },
    ],
  };
}

export function setPrincipalAddress(addresses, addressId) {
  if (!addresses.some((item) => item.id === addressId)) return { error: 'Esa dirección ya no existe.' };
  return {
    addresses: addresses.map((item) => ({ ...item, principal: item.id === addressId })),
    selectedAddressId: addressId,
  };
}

// ---------------------------------------------------------------------------
// Persistencia: normaliza todas las colecciones nuevas sin datos corruptos
// ---------------------------------------------------------------------------
function isValidProduct(product) {
  if (!product || typeof product.id !== 'string' || !product.id.trim()) return false;
  return !validateProduct(product)
    && Array.isArray(product.ratings)
    && product.ratings.every((rating) => !validateRating(rating));
}

function sanitizeProduct(product) {
  if (!product || typeof product.id !== 'string' || !product.id.trim()) return null;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  let variants;
  if (hasVariants) {
    variants = product.variants.filter((variant) => (
      variant && typeof variant.id === 'string' && typeof variant.label === 'string'
        && Number.isInteger(variant.price) && variant.price > 0
        && Number.isInteger(variant.stock) && variant.stock >= 0
    ));
    if (!variants.length) return null;
  }
  const candidate = {
    ...product,
    brand: typeof product.brand === 'string' && product.brand.trim() ? product.brand : 'SWAREH',
    ratings: Array.isArray(product.ratings) ? product.ratings.filter((rating) => !validateRating(rating)) : [],
  };
  if (hasVariants) candidate.variants = variants;
  if (!Number.isInteger(candidate.stock) || candidate.stock < 0) {
    if (!hasVariants) return null;
  }
  const synced = syncProductStock(candidate);
  return isValidProduct(synced) ? synced : null;
}

function isValidOrder(order) {
  return order && typeof (order.id || order.code) === 'string'
    && typeof (order.date || order.code) === 'string'
    && Array.isArray(order.items)
    && ['subtotal', 'shipping', 'discount', 'total'].every((key) => Number.isInteger(order[key]) && order[key] >= 0)
    && order.items.every((item) => item && typeof item.id === 'string' && typeof item.name === 'string'
      && Number.isInteger(item.quantity) && item.quantity > 0 && Number.isInteger(item.price) && item.price > 0);
}

function sanitizeOrder(order) {
  if (!isValidOrder(order)) return null;
  const status = order.status && NEXT_STATUS[order.status] !== undefined
    ? order.status
    : ORDER_STATUS.CONFIRMADO;
  return {
    ...order,
    id: order.id || order.code,
    code: order.code || order.id,
    status,
    history: Array.isArray(order.history) && order.history.length
      ? order.history
      : [{ status, date: order.date, note: 'Pedido restaurado de la sesión anterior.' }],
    restocked: Boolean(order.restocked),
    stockDeducted: order.stockDeducted !== false,
  };
}

function isValidAddress(address, used = new Set()) {
  return address && typeof address.id === 'string' && address.id.trim()
    && typeof address.alias === 'string' && address.alias.trim()
    && typeof address.municipality === 'string' && address.municipality.trim()
    && typeof address.reference === 'string' && address.reference.trim()
    && !used.has(address.id);
}

export function normalizePersistedData(value) {
  const empty = {
    products: INITIAL_PRODUCTS,
    cart: {},
    favorites: [],
    orders: [],
    addresses: INITIAL_ADDRESSES,
    selectedAddressId: null,
    shippingModal: null,
    notifications: [],
    questions: INITIAL_QUESTIONS,
    stockAlerts: [],
    tickets: [],
    compareIds: [],
  };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;

  const storedProducts = Array.isArray(value.products)
    ? value.products.map(sanitizeProduct).filter(Boolean)
    : [];
  const productsById = new Map(storedProducts.map((product) => [product.id, product]));
  for (const product of INITIAL_PRODUCTS) {
    if (!productsById.has(product.id)) productsById.set(product.id, product);
  }
  const products = [...productsById.values()];
  const productById = new Map(products.map((product) => [product.id, product]));

  const cart = {};
  if (value.cart && typeof value.cart === 'object' && !Array.isArray(value.cart)) {
    for (const [key, quantity] of Object.entries(value.cart)) {
      const { productId, variantId } = parseCartKey(key);
      const product = productById.get(productId);
      if (!product || !Number.isInteger(quantity) || quantity <= 0) continue;
      const info = getLineInfo(product, variantId);
      if (variantId && !getVariant(product, variantId)) continue;
      if (info.stock <= 0) continue;
      // Un carrito restoreado nunca puede superar el stock válido de la línea.
      cart[key] = Math.min(quantity, info.stock);
    }
  }

  const favorites = Array.isArray(value.favorites)
    ? [...new Set(value.favorites.filter((id) => productById.has(id)))]
    : [];

  const orders = Array.isArray(value.orders) ? value.orders.map(sanitizeOrder).filter(Boolean) : [];

  const usedAddressIds = new Set();
  const addresses = Array.isArray(value.addresses)
    ? value.addresses.filter((address) => {
      if (!isValidAddress(address, usedAddressIds)) return false;
      usedAddressIds.add(address.id);
      return true;
    }).map((address) => ({ ...address, principal: Boolean(address.principal) }))
    : INITIAL_ADDRESSES;
  const principalCount = addresses.filter((address) => address.principal).length;
  const safeAddresses = principalCount === 1
    ? addresses
    : addresses.map((address, index) => ({ ...address, principal: index === 0 }));

  const selectedAddressId = safeAddresses.some((address) => address.id === value.selectedAddressId)
    ? value.selectedAddressId
    : null;

  const shippingModal = SHIPPING_MODALITIES.some((item) => item.id === value.shippingModal)
    ? value.shippingModal
    : null;

  const notifications = Array.isArray(value.notifications)
    ? value.notifications.filter((item) => item && typeof item.message === 'string' && typeof item.id === 'string')
      .slice(0, 100)
    : [];

  const questions = Array.isArray(value.questions)
    ? value.questions.filter((item) => item && typeof item.question === 'string' && productById.has(item.productId))
    : INITIAL_QUESTIONS;

  const stockAlerts = Array.isArray(value.stockAlerts)
    ? value.stockAlerts.filter((item) => item && productById.has(item.productId))
    : [];

  const tickets = Array.isArray(value.tickets)
    ? value.tickets.filter((item) => item && typeof item.id === 'string' && typeof item.orderCode === 'string')
    : [];

  const compareIds = Array.isArray(value.compareIds)
    ? [...new Set(value.compareIds.filter((id) => productById.has(id)))].slice(0, 3)
    : [];

  return {
    products, cart, favorites, orders, addresses: safeAddresses, selectedAddressId,
    shippingModal, notifications, questions, stockAlerts, tickets, compareIds,
  };
}
