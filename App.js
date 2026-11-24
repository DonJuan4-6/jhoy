import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  addToCompare,
  advanceOrderStatus,
  appendNotification,
  BRANDS,
  buildRestockNotification,
  calculateTotals,
  cancelOrder,
  CANCELABLE_STATUS,
  CATEGORIES,
  COUPON_CODE,
  createDemoOrders,
  createQuestion,
  createStockAlert,
  createSupportTicket,
  createConfirmedOrder,
  estimateShipping,
  filterAndSortProducts,
  formatPrice,
  getCartLineQuantity,
  getLineInfo,
  getProductStock,
  getRatingStats,
  getRecommendations,
  getVariant,
  INITIAL_PRODUCTS,
  isValidCoupon,
  makeCartKey,
  makeNotification,
  NEXT_STATUS,
  normalizePersistedData,
  ORDER_STATUS,
  parseCartKey,
  removeFromCompare,
  restockLine,
  saveAddress as saveAddressRule,
  setCartLine,
  setPrincipalAddress,
  SHIPPING_MODALITIES,
  simulateQuestionAnswer,
  simulateTicketReply,
  SUPPORT_MOTIVES,
  syncProductStock,
  validateAddress,
  validateBuyer,
  validateCart,
  validateCartLine,
  validatePriceRange,
  validateProduct,
  validateQuestion,
  validateRating,
  validateSupportRequest,
} from './marketplace.mjs';

const STORAGE_KEY = 'jhoy-marketplace-v2';
const FRESH_STATE = normalizePersistedData(null);
const EMPTY_BUYER = { name: '', phone: '', municipality: '', address: '' };
const EMPTY_FILTERS = { brand: 'Todas', minPrice: '', maxPrice: '', onlyAvailable: false };
const EMPTY_ADDRESS_FORM = { alias: '', municipality: '', reference: '', principal: false };
const EMPTY_HELP_FORM = { orderCode: '', motive: SUPPORT_MOTIVES[0], description: '' };

const COLORS = {
  ink: '#172438',
  muted: '#78869A',
  blue: '#2868E8',
  paleBlue: '#EAF1FF',
  background: '#F4F6FA',
  white: '#FFFFFF',
  line: '#E8ECF2',
  green: '#17865B',
  red: '#B23B4B',
  amber: '#B37A12',
};

const STATUS_COLORS = {
  [ORDER_STATUS.CONFIRMADO]: COLORS.blue,
  [ORDER_STATUS.PREPARANDO]: COLORS.amber,
  [ORDER_STATUS.EN_CAMINO]: '#7B5BD6',
  [ORDER_STATUS.ENTREGADO]: COLORS.green,
  [ORDER_STATUS.CANCELADO]: COLORS.red,
};

// ---------------------------------------------------------------------------
// Componentes reutilizables
// ---------------------------------------------------------------------------

function ProductArtwork({ product, large = false }) {
  return (
    <View style={[styles.artwork, large && styles.artworkLarge]}>
      <View style={[styles.artGlow, large && styles.artGlowLarge]} />
      <View style={styles.artFrame}>
        <Text style={[styles.artIcon, large && styles.artIconLarge]}>{product.icon}</Text>
        <Text style={styles.artLabel}>{product.short}</Text>
      </View>
      <Text style={styles.artCategory}>{product.category.toUpperCase()}</Text>
    </View>
  );
}

function BrandMark() {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}><Text style={styles.brandIconText}>SWH</Text></View>
      <View style={styles.brandCopy}>
        <Text style={styles.brandName}>SWAREH</Text>
        <Text style={styles.brandTagline}>Consigue tu Hardware, para tareas suaves o fuertes</Text>
      </View>
    </View>
  );
}

function ActionButton({ label, onPress, disabled = false, secondary = false, compact = false, tone }) {
  const style = [styles.actionButton, secondary && styles.secondaryButton, compact && styles.compactButton, disabled && styles.disabledButton];
  if (tone === 'danger') style.push(styles.dangerButton);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={style}
    >
      <Text style={[styles.actionButtonText, secondary && styles.secondaryButtonText, disabled && styles.disabledButtonText]}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({ title, message, action, onPress }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}><Text style={styles.emptyStateGlyph}>SWH</Text></View>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateCopy}>{message}</Text>
      {action && <ActionButton label={action} onPress={onPress} compact />}
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, maxLength }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#99A4B3"
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        style={[styles.fieldInput, multiline && styles.multilineInput]}
      />
    </View>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <View style={styles.sectionTitleBlock}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function Chip({ label, active, onPress, disabled = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive, disabled && styles.chipTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

function InfoRow({ label, value, emphasis = false, negative = false }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, emphasis && styles.totalLabel]}>{label}</Text>
      <Text style={[styles.summaryValue, emphasis && styles.totalValue, negative && styles.discountValue]}>{value}</Text>
    </View>
  );
}

function QuantityControl({ quantity, onDecrease, onIncrease, canIncrease }) {
  return (
    <View style={styles.quantityControl}>
      <Pressable onPress={onDecrease} style={styles.quantityButton} accessibilityRole="button" accessibilityLabel="Disminuir cantidad">
        <Text style={styles.quantityButtonText}>−</Text>
      </Pressable>
      <Text style={styles.quantityValue}>{quantity}</Text>
      <Pressable onPress={onIncrease} disabled={!canIncrease} style={[styles.quantityButton, !canIncrease && styles.quantityButtonDisabled]} accessibilityRole="button" accessibilityLabel="Aumentar cantidad">
        <Text style={styles.quantityButtonText}>+</Text>
      </Pressable>
    </View>
  );
}

function StatusBadge({ status }) {
  return (
    <View style={[styles.statusBadge, { borderColor: STATUS_COLORS[status] || COLORS.muted }]}>
      <Text style={[styles.statusText, { color: STATUS_COLORS[status] || COLORS.muted }]}>{status}</Text>
    </View>
  );
}

function PlainBadge({ label, color = COLORS.blue }) {
  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <Text style={[styles.statusText, { color }]}>{label}</Text>
    </View>
  );
}

function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  if (!visible) return null;
  return (
    <View style={styles.dialogOverlay}>
      <View style={styles.dialogCard}>
        <Text style={styles.dialogTitle}>{title}</Text>
        <Text style={styles.dialogMessage}>{message}</Text>
        <View style={styles.dialogActions}>
          <ActionButton label={confirmLabel} onPress={onConfirm} compact tone="danger" />
          <ActionButton label="Volver" onPress={onCancel} secondary compact />
        </View>
      </View>
    </View>
  );
}

function ProductCard({ product, isFavorite, cartQuantity, isCompared, onOpen, onAdd, onToggleFavorite, onToggleCompare }) {
  const stock = getProductStock(product);
  const unavailable = stock === 0;
  const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
  const atCartLimit = cartQuantity >= stock;
  return (
    <View style={styles.productCard}>
      <View style={styles.productArtworkWrap}>
        <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Ver ${product.name}`}>
          <ProductArtwork product={product} />
        </Pressable>
        <Pressable
          onPress={onToggleFavorite}
          style={styles.favoriteButton}
          accessibilityRole="button"
          accessibilityLabel={isFavorite ? `Quitar ${product.name} de favoritos` : `Agregar ${product.name} a favoritos`}
        >
          <Text style={[styles.favoriteGlyph, isFavorite && styles.favoriteGlyphActive]}>{isFavorite ? '♥' : '♡'}</Text>
        </Pressable>
      </View>
      <Text style={styles.productCategory}>{product.brand} · {product.category}</Text>
      <Pressable onPress={onOpen}><Text style={styles.productName} numberOfLines={2}>{product.name}</Text></Pressable>
      <Text style={styles.productPrice}>
        {hasVariants ? `Desde ${formatPrice(Math.min(...product.variants.map((v) => v.price)))}` : formatPrice(product.price)}
      </Text>
      <Text style={[styles.stockLabel, unavailable && styles.outOfStock]}>
        {unavailable ? 'Agotado' : `${stock} disponibles${hasVariants ? ' en variantes' : ''}`}
      </Text>
      <View style={styles.cardActions}>
        <ActionButton
          label={unavailable ? 'Agotado' : atCartLimit ? 'Stock en carrito' : '＋  Agregar'}
          onPress={onAdd}
          disabled={unavailable || atCartLimit}
          compact
        />
        <Pressable
          onPress={onToggleCompare}
          accessibilityRole="button"
          accessibilityLabel={isCompared ? `Quitar ${product.name} del comparador` : `Comparar ${product.name}`}
          style={[styles.compareToggle, isCompared && styles.compareToggleActive]}
        >
          <Text style={[styles.compareToggleText, isCompared && styles.compareToggleTextActive]}>{isCompared ? '✓ Comp' : 'Comp'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Aplicación
// ---------------------------------------------------------------------------

export default function App() {
  // Estado heredado del Taller 4
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [screen, setScreen] = useState('catalog');
  const [detailBackScreen, setDetailBackScreen] = useState('catalog');
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[0].id);
  const [selectedOrderCode, setSelectedOrderCode] = useState(null);
  const [confirmedOrder, setConfirmedOrder] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');
  const [sort, setSort] = useState('featured');
  const [notice, setNotice] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [buyer, setBuyer] = useState(EMPTY_BUYER);
  const [checkoutStep, setCheckoutStep] = useState('form');
  const [sellerForm, setSellerForm] = useState({ name: '', category: CATEGORIES[0], price: '', stock: '0', description: '' });
  const [editingProductId, setEditingProductId] = useState(null);
  const [ratingSelection, setRatingSelection] = useState(0);

  // Estado nuevo del Taller 5
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filterError, setFilterError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [detailQuantity, setDetailQuantity] = useState(1);
  const [questions, setQuestions] = useState(FRESH_STATE.questions);
  const [questionDraft, setQuestionDraft] = useState('');
  const [addresses, setAddresses] = useState(FRESH_STATE.addresses);
  const [selectedAddressId, setSelectedAddressId] = useState(FRESH_STATE.selectedAddressId);
  const [shippingModal, setShippingModal] = useState(FRESH_STATE.shippingModal);
  const [addressForm, setAddressForm] = useState(EMPTY_ADDRESS_FORM);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [notifications, setNotifications] = useState(FRESH_STATE.notifications);
  const [stockAlerts, setStockAlerts] = useState(FRESH_STATE.stockAlerts);
  const [tickets, setTickets] = useState(FRESH_STATE.tickets);
  const [helpForm, setHelpForm] = useState(EMPTY_HELP_FORM);
  const [dialog, setDialog] = useState(null);

  // -------------------------------------------------------------------------
  // Derivados
  // -------------------------------------------------------------------------
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartLines = useMemo(() => Object.entries(cart).map(([key, quantity]) => {
    const { productId, variantId } = parseCartKey(key);
    const product = products.find((item) => item.id === productId);
    if (!product) return null;
    const info = getLineInfo(product, variantId);
    return { key, product, variantId, variantLabel: info.label, price: info.price, stock: info.stock, quantity, lineTotal: info.price * quantity };
  }).filter(Boolean), [cart, products]);

  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0];
  const selectedVariant = getVariant(selectedProduct, selectedVariantId);
  const selectedVariantInfo = getLineInfo(selectedProduct, selectedVariantId);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) || null;
  const shippingQuote = useMemo(
    () => (selectedAddress && shippingModal ? estimateShipping(selectedAddress.municipality, shippingModal) : null),
    [selectedAddress, shippingModal],
  );
  const totals = useMemo(
    () => calculateTotals(cart, products, couponApplied, shippingQuote),
    [cart, products, couponApplied, shippingQuote],
  );
  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, search, category, sort, filters),
    [products, search, category, sort, filters],
  );
  const compareProducts = compareIds.map((id) => products.find((product) => product.id === id)).filter(Boolean);
  const selectedOrder = orders.find((order) => (order.id || order.code) === selectedOrderCode) || null;
  const unreadCount = notifications.filter((item) => !item.read).length;
  const productQuestions = questions.filter((question) => question.productId === selectedProduct?.id);
  const recommendations = useMemo(
    () => getRecommendations(products, selectedProductId, 4),
    [products, selectedProductId],
  );
  const activeAlert = stockAlerts.find(
    (alert) => alert.productId === selectedProductId && alert.variantId === selectedVariantId && alert.active,
  );

  // -------------------------------------------------------------------------
  // Hidratación y persistencia local
  // -------------------------------------------------------------------------
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved && active) {
          let parsed;
          try {
            parsed = JSON.parse(saved);
          } catch (error) {
            console.error('No se pudieron interpretar los datos locales de JHOY.', error);
            await AsyncStorage.removeItem(STORAGE_KEY);
            setNotice({ message: 'Los datos guardados no eran válidos. Iniciamos una sesión nueva.', type: 'error' });
          }
          if (parsed && active) {
            const restored = normalizePersistedData(parsed);
            setProducts(restored.products);
            setCart(restored.cart);
            setFavorites(restored.favorites);
            setOrders(restored.orders);
            setAddresses(restored.addresses);
            setSelectedAddressId(restored.selectedAddressId);
            setShippingModal(restored.shippingModal);
            setNotifications(restored.notifications);
            setQuestions(restored.questions);
            setStockAlerts(restored.stockAlerts);
            setTickets(restored.tickets);
            setCompareIds(restored.compareIds);
          }
        }
      } catch (error) {
        console.error('No fue posible recuperar los datos de JHOY.', error);
        if (active) setNotice({ message: 'No se pudieron recuperar los datos locales de esta sesión.', type: 'error' });
      } finally {
        if (active) setHydrated(true);
      }
    };
    restore();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const state = JSON.stringify({
      products, cart, favorites, orders, addresses, selectedAddressId, shippingModal,
      notifications, questions, stockAlerts, tickets, compareIds,
    });
    AsyncStorage.setItem(STORAGE_KEY, state).catch((error) => {
      console.error('No fue posible guardar los datos de JHOY.', error);
      setNotice({ message: 'No se pudieron guardar los cambios en este dispositivo.', type: 'error' });
    });
  }, [hydrated, products, cart, favorites, orders, addresses, selectedAddressId, shippingModal,
    notifications, questions, stockAlerts, tickets, compareIds]);

  // -------------------------------------------------------------------------
  // Utilidades y acciones
  // -------------------------------------------------------------------------
  const showNotice = (message, type = 'success') => setNotice({ message, type });
  const navigate = (nextScreen) => {
    setNotice(null);
    setScreen(nextScreen);
  };

  const notify = (notification) => {
    setNotifications((current) => appendNotification(current, notification));
  };

  const openProduct = (product, fromScreen = screen) => {
    setSelectedProductId(product.id);
    setDetailBackScreen(fromScreen);
    setSelectedVariantId(null);
    setDetailQuantity(1);
    setRatingSelection(0);
    setQuestionDraft('');
    navigate('detail');
  };

  const toggleFavorite = (product) => {
    const isSaved = favorites.includes(product.id);
    setFavorites((current) => (
      isSaved ? current.filter((id) => id !== product.id) : [...current, product.id]
    ));
    showNotice(isSaved ? 'Producto eliminado de favoritos.' : 'Producto guardado en favoritos.');
  };

  const toggleCompare = (product) => {
    if (compareIds.includes(product.id)) {
      setCompareIds((current) => removeFromCompare(current, product.id));
      showNotice(`${product.name} se quitó del comparador.`);
      return;
    }
    const result = addToCompare(compareIds, product.id);
    if (result.error) {
      showNotice(result.error, 'error');
      return;
    }
    setCompareIds(result.list);
    showNotice(`${product.name} se agregó al comparador (${result.list.length}/3).`);
  };

  const addToCart = (product, variantId = null, quantity = 1) => {
    const error = validateCartLine(product, variantId, quantity);
    if (error) {
      showNotice(error, 'error');
      return false;
    }
    const currentQuantity = getCartLineQuantity(cart, product, variantId);
    const max = getLineInfo(product, variantId).stock;
    if (currentQuantity + quantity > max) {
      showNotice(`Stock insuficiente. Ya tienes ${currentQuantity} en el carrito; el máximo permitido es ${max}.`, 'error');
      return false;
    }
    const label = variantId ? `${product.name} · ${getVariant(product, variantId)?.label}` : product.name;
    setCart((current) => setCartLine(current, product, variantId, currentQuantity + quantity));
    showNotice(`${label} × ${quantity} se agregó al carrito.`);
    return true;
  };

  const changeCartLine = (line, delta) => {
    const nextQuantity = line.quantity + delta;
    if (nextQuantity <= 0) {
      setCart((current) => setCartLine(current, line.product, line.variantId, 0));
      showNotice('El producto se quitó del carrito.');
      return;
    }
    if (nextQuantity > line.stock) {
      showNotice(`No hay más stock. El máximo permitido es ${line.stock}.`, 'error');
      return;
    }
    setCart((current) => setCartLine(current, line.product, line.variantId, nextQuantity));
    showNotice('Cantidad actualizada.');
  };

  const removeCartLine = (line) => {
    setCart((current) => setCartLine(current, line.product, line.variantId, 0));
    showNotice('El producto se eliminó del carrito.');
  };

  const applyCoupon = () => {
    if (!isValidCoupon(couponCode)) {
      showNotice('El cupón no es válido. Revisa el código e inténtalo otra vez.', 'error');
      return;
    }
    setCouponApplied(true);
    setCouponCode(COUPON_CODE);
    showNotice('Cupón BIENVENIDO10 aplicado: 10 % de descuento.');
  };

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    setFilterError('');
    setSearch('');
    setCategory('Todas');
    showNotice('Filtros restablecidos. Catálogo completo.');
  };

  const applyFilters = () => {
    const error = validatePriceRange(filters.minPrice, filters.maxPrice);
    setFilterError(error);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    showNotice('Filtros aplicados al catálogo.');
  };

  // HU24
  const submitQuestion = () => {
    const error = validateQuestion(questionDraft);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    setQuestions((current) => [createQuestion(selectedProduct.id, questionDraft), ...current]);
    setQuestionDraft('');
    showNotice('Pregunta enviada. Estado: Pendiente (respuesta simulada).');
  };

  const answerQuestion = (question) => {
    setQuestions((current) => current.map((item) => (
      item.id === question.id ? simulateQuestionAnswer(item) : item
    )));
    showNotice('Respuesta simulada agregada a la pregunta.');
  };

  // HU25
  const submitAddress = () => {
    const result = saveAddressRule(addresses, addressForm, editingAddressId);
    if (result.error) {
      showNotice(result.error, 'error');
      return;
    }
    setAddresses(result.addresses);
    setAddressForm(EMPTY_ADDRESS_FORM);
    setEditingAddressId(null);
    showNotice(editingAddressId ? 'Dirección actualizada sin duplicar registros.' : 'Dirección agregada a tu libreta.');
  };

  const editAddress = (address) => {
    setEditingAddressId(address.id);
    setAddressForm({ alias: address.alias, municipality: address.municipality, reference: address.reference, principal: address.principal });
    setNotice(null);
  };

  const makePrincipal = (address) => {
    const result = setPrincipalAddress(addresses, address.id);
    if (result.error) {
      showNotice(result.error, 'error');
      return;
    }
    setAddresses(result.addresses);
    setSelectedAddressId(result.selectedAddressId);
    showNotice(`${address.alias} es ahora la dirección principal y la seleccionada.`);
  };

  // HU30
  const toggleStockAlert = (variantId) => {
    const key = makeCartKey(selectedProduct.id, variantId);
    const existing = stockAlerts.find((alert) => alert.id === key);
    if (existing?.active) {
      setStockAlerts((current) => current.map((alert) => (alert.id === key ? { ...alert, active: false } : alert)));
      showNotice('Aviso de reposición cancelado.');
      return;
    }
    setStockAlerts((current) => [
      ...current.filter((alert) => alert.id !== key),
      createStockAlert(selectedProduct.id, variantId),
    ]);
    showNotice('Te avisaremos cuando haya stock (aviso único por artículo).');
  };

  const simulateRestock = (variantId, units) => {
    setProducts((current) => current.map((product) => (
      product.id === selectedProduct.id ? restockLine(product, variantId, units) : product
    )));
    const alert = stockAlerts.find((item) => (
      item.productId === selectedProduct.id && item.variantId === variantId && item.active
    ));
    if (alert) {
      notify(buildRestockNotification(selectedProduct, variantId, units));
      showNotice('Reposición simulada y aviso enviado al centro de notificaciones.');
    } else {
      showNotice('Reposición simulada realizada (no había aviso activo para este artículo).');
    }
    setStockAlerts((current) => current.filter((item) => item.id !== makeCartKey(selectedProduct.id, variantId)));
  };

  // Checkout / compra
  const startCheckout = () => {
    const error = validateCart(cart, products);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    setCheckoutStep('form');
    navigate('checkout');
  };

  const continueToReview = () => {
    if (!selectedAddress) {
      showNotice('Selecciona una dirección de entrega antes de continuar al pago simulado.', 'error');
      return;
    }
    const deliveryBuyer = {
      ...buyer,
      municipality: selectedAddress.municipality,
      address: selectedAddress.reference,
      addressAlias: selectedAddress.alias,
    };
    const error = validateBuyer(deliveryBuyer);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    if (!shippingModal) {
      showNotice('Selecciona la modalidad de envío antes de continuar.', 'error');
      return;
    }
    if (!shippingQuote?.supported) {
      showNotice(shippingQuote?.message || 'No es posible calcular el envío con esos datos.', 'error');
      return;
    }
    setCheckoutStep('review');
    setNotice(null);
  };

  const confirmOrder = () => {
    const buyerData = {
      ...buyer,
      municipality: selectedAddress.municipality,
      address: selectedAddress.reference,
      addressAlias: selectedAddress.alias,
    };
    const result = createConfirmedOrder({
      cart,
      products,
      buyer: buyerData,
      couponApplied,
      shippingQuote,
      randomPart: `${orders.length + 1}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    });
    if (result.error) {
      showNotice(result.error, 'error');
      return;
    }
    setProducts(result.nextProducts);
    setOrders((current) => [result.order, ...current]);
    setCart({});
    setCouponApplied(false);
    setCouponCode('');
    setBuyer(EMPTY_BUYER);
    setConfirmedOrder(result.order);
    notify(makeNotification({
      type: 'pedido',
      message: `Pedido ${result.order.code} confirmado por ${formatPrice(result.order.total)}.`,
      reference: result.order.code,
      dedupeKey: `pedido-${result.order.code}-Confirmado`,
    }));
    navigate('confirmation');
  };

  const submitRating = () => {
    const error = validateRating(ratingSelection);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    setProducts((current) => current.map((product) => (
      product.id === selectedProduct.id
        ? { ...product, ratings: [...product.ratings, ratingSelection] }
        : product
    )));
    setRatingSelection(0);
    showNotice('¡Gracias! Tu valoración simulada quedó registrada.');
  };

  const saveSellerProduct = () => {
    const productData = {
      ...sellerForm,
      brand: sellerForm.brand || 'SWAREH',
      price: Number(sellerForm.price),
      stock: Number(sellerForm.stock),
    };
    const error = validateProduct(productData);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    if (editingProductId) {
      setProducts((current) => current.map((product) => (
        product.id === editingProductId ? syncProductStock({ ...product, ...productData }) : product
      )));
      showNotice('Producto actualizado sin duplicar su referencia.');
    } else {
      const nextNumber = products.reduce((largest, product) => {
        const match = product.id.match(/^PROD-(\d+)$/);
        return match ? Math.max(largest, Number(match[1])) : largest;
      }, 0) + 1;
      const iconByCategory = { 'Periféricos': '⌁', GPU: '▰', CPU: '▦', Almacenamiento: '▱' };
      setProducts((current) => [...current, {
        ...productData,
        id: `PROD-${String(nextNumber).padStart(3, '0')}`,
        icon: iconByCategory[productData.category],
        short: productData.name.slice(0, 12).toUpperCase(),
        ratings: [],
      }]);
      showNotice('Producto creado y agregado al catálogo.');
    }
    setEditingProductId(null);
    setSellerForm({ name: '', category: CATEGORIES[0], price: '', stock: '0', description: '' });
  };

  // HU27 / HU28
  const advanceStatus = (order) => {
    const result = advanceOrderStatus(order);
    if (result.error) {
      showNotice(result.error, 'error');
      return;
    }
    setOrders((current) => current.map((item) => (
      (item.id || item.code) === (order.id || order.code) ? result.order : item
    )));
    notify(result.notification);
    showNotice(`Pedido avanzó a ${result.order.status}.`);
  };

  const requestCancel = (order) => {
    if (!CANCELABLE_STATUS.includes(order.status)) {
      showNotice('No se puede cancelar: solo se cancelan pedidos Confirmado o Preparando, antes del despacho simulado.', 'error');
      return;
    }
    setDialog({
      title: 'Cancelar pedido simulado',
      message: `¿Confirmas la cancelación de ${order.code}? El pedido permanecerá en el historial.${
        order.stockDeducted
          ? ' El inventario se restituirá una sola vez.'
          : ' Es un pedido de prueba histórico: su stock ya estaba descontado en el catálogo inicial.'
      }`,
      confirmLabel: 'Sí, cancelar',
      onConfirm: () => {
        const result = cancelOrder(order, products);
        setDialog(null);
        if (result.error) {
          showNotice(result.error, 'error');
          return;
        }
        setProducts(result.nextProducts);
        setOrders((current) => current.map((item) => (
          (item.id || item.code) === (order.id || order.code) ? result.order : item
        )));
        notify(result.notification);
        showNotice(order.stockDeducted
          ? 'Pedido cancelado. Inventario restituido una sola vez.'
          : 'Pedido de prueba cancelado. Su stock histórico no se duplica.');
      },
    });
  };

  const loadDemoOrders = () => {
    const demos = createDemoOrders(products);
    setOrders((current) => {
      const existing = new Set(current.map((order) => order.code));
      return [...demos.filter((order) => !existing.has(order.code)), ...current];
    });
    showNotice('Pedidos de prueba cargados en modo demostración.');
  };

  // HU29
  const markNotificationRead = (notification) => {
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? { ...item, read: true } : item
    )));
    showNotice('Aviso marcado como leído.');
  };

  // HU32
  const submitTicket = () => {
    const error = validateSupportRequest(helpForm.orderCode, helpForm.description);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    const ticket = createSupportTicket(helpForm);
    setTickets((current) => [ticket, ...current]);
    setHelpForm(EMPTY_HELP_FORM);
    showNotice(`Caso ${ticket.id} creado con estado Abierto.`);
    notify(makeNotification({
      type: 'soporte',
      message: `Caso ${ticket.id} abierto para el pedido ${ticket.orderCode}.`,
      reference: ticket.id,
    }));
  };

  const answerTicket = (ticket) => {
    setTickets((current) => current.map((item) => (
      item.id === ticket.id ? simulateTicketReply(item) : item
    )));
    showNotice('Respuesta simulada agregada al caso.');
  };

  // -------------------------------------------------------------------------
  // Pantallas
  // -------------------------------------------------------------------------
  const renderProductCards = (list, source) => (
    <View style={styles.productGrid}>
      {list.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favorites.includes(product.id)}
          cartQuantity={getCartLineQuantity(cart, product, null) + (product.variants || []).reduce(
            (sum, variant) => sum + getCartLineQuantity(cart, product, variant.id), 0,
          )}
          isCompared={compareIds.includes(product.id)}
          onOpen={() => openProduct(product, source)}
          onAdd={() => (product.variants?.length ? openProduct(product, source) : addToCart(product))}
          onToggleFavorite={() => toggleFavorite(product)}
          onToggleCompare={() => toggleCompare(product)}
        />
      ))}
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filterCard}>
      <Pressable onPress={() => setShowFilters((value) => !value)} style={styles.filterHeader}>
        <Text style={styles.filterHeaderText}>⚙  Filtros combinados{showFilters ? '  ▴' : '  ▾'}</Text>
      </Pressable>
      {showFilters ? (
        <View>
          <Text style={styles.fieldLabel}>Marca</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {['Todas', ...BRANDS].map((brand) => (
              <Chip key={brand} label={brand} active={filters.brand === brand} onPress={() => setFilters((current) => ({ ...current, brand }))} />
            ))}
          </ScrollView>
          <View style={styles.numericRow}>
            <View style={styles.halfField}>
              <Field label="Precio mínimo" value={filters.minPrice} onChangeText={(minPrice) => setFilters((current) => ({ ...current, minPrice }))} keyboardType="numeric" placeholder="Ej. 100000" />
            </View>
            <View style={styles.halfField}>
              <Field label="Precio máximo" value={filters.maxPrice} onChangeText={(maxPrice) => setFilters((current) => ({ ...current, maxPrice }))} keyboardType="numeric" placeholder="Ej. 500000" />
            </View>
          </View>
          {filterError ? <Text style={styles.errorText}>{filterError}</Text> : null}
          <Pressable onPress={() => setFilters((current) => ({ ...current, onlyAvailable: !current.onlyAvailable }))} style={styles.checkRow} accessibilityRole="button">
            <View style={[styles.checkBox, filters.onlyAvailable && styles.checkBoxActive]}>
              {filters.onlyAvailable ? <Text style={styles.checkMark}>✓</Text> : null}
            </View>
            <Text style={styles.checkLabel}>Solo productos disponibles</Text>
          </Pressable>
          <View style={styles.filterActions}>
            <View style={styles.halfField}><ActionButton label="Aplicar filtros" onPress={applyFilters} compact /></View>
            <View style={styles.halfField}><ActionButton label="Restablecer" onPress={resetFilters} secondary compact /></View>
          </View>
        </View>
      ) : null}
    </View>
  );

  const renderCatalog = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>POTENCIA A TU MEDIDA · 2.0</Text>
        <Text style={styles.heroTitle}>Arma tu próximo gran setup.</Text>
        <Text style={styles.heroCopy}>Compara, elige variantes, consulta envíos y sigue tus pedidos en una sola app.</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Busca por nombre, categoría o marca"
          placeholderTextColor="#94A0B0"
          style={styles.searchInput}
          accessibilityLabel="Buscar productos"
        />
      </View>
      <SectionTitle title="Categorías" subtitle="Elige el componente para tu setup" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {['Todas', ...CATEGORIES].map((item) => (
          <Chip key={item} label={item} active={category === item} onPress={() => setCategory(item)} />
        ))}
      </ScrollView>
      {renderFilters()}
      <View style={styles.listHeading}>
        <View>
          <Text style={styles.sectionTitle}>Catálogo</Text>
          <Text style={styles.sectionSubtitle}>{filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}</Text>
        </View>
        <View style={styles.sortControls}>
          {[['featured', 'Destacados'], ['asc', 'Menor a mayor'], ['desc', 'Mayor a menor']].map(([value, label]) => (
            <Chip key={value} label={label} active={sort === value} onPress={() => setSort(value)} />
          ))}
        </View>
      </View>
      <Pressable onPress={() => navigate('compare')} style={styles.compareBanner} accessibilityRole="button">
        <Text style={styles.compareBannerText}>⚖  Comparador  ({compareIds.length}/3) ›</Text>
      </Pressable>
      {filteredProducts.length
        ? renderProductCards(filteredProducts, 'catalog')
        : <EmptyState title="No encontramos productos" message="Prueba con otra palabra, cambia la categoría o restablece los filtros." action="Restablecer filtros" onPress={resetFilters} />}
      <Text style={styles.trustNote}>✓  Compra simulada · Precios en pesos colombianos · Avisos y respuestas de demostración</Text>
    </ScrollView>
  );

  const renderDetail = () => {
    if (!selectedProduct) return null;
    const hasVariants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0;
    const stock = hasVariants ? selectedVariantInfo.stock : getProductStock(selectedProduct);
    const stats = getRatingStats(selectedProduct.ratings);
    const isFavorite = favorites.includes(selectedProduct.id);
    const alreadyInCart = hasVariants
      ? getCartLineQuantity(cart, selectedProduct, selectedVariantId)
      : getCartLineQuantity(cart, selectedProduct, null);
    const maxQuantity = Math.max(0, stock - alreadyInCart);
    const price = hasVariants && selectedVariant ? selectedVariant.price : selectedProduct.price;
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => navigate(detailBackScreen)} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver</Text>
        </Pressable>
        <ProductArtwork product={selectedProduct} large />
        <View style={styles.detailCard}>
          <View style={styles.detailMetaRow}>
            <Text style={styles.detailCategory}>{selectedProduct.brand} · {selectedProduct.category.toUpperCase()}</Text>
            <Text style={styles.detailRating}>{stats.count ? `★ ${stats.average} · ${stats.count}` : 'Sin valoraciones'}</Text>
          </View>
          <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
          <Text style={styles.detailPrice}>{formatPrice(price)}</Text>
          <Text style={[styles.stockLabel, stock === 0 && styles.outOfStock]}>
            {stock === 0 ? 'Agotado' : `${stock} unidades disponibles`}
          </Text>
          <Text style={styles.description}>{selectedProduct.description}</Text>

          {hasVariants ? (
            <View style={styles.variantBlock}>
              <SectionTitle title="Elige una variante" subtitle="Switch, color o presentación según el producto" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {selectedProduct.variants.map((variant) => (
                  <Pressable
                    key={variant.id}
                    onPress={() => { setSelectedVariantId(variant.id); setDetailQuantity(1); }}
                    disabled={variant.stock === 0}
                    style={[styles.variantChip, selectedVariantId === variant.id && styles.variantChipActive, variant.stock === 0 && styles.variantChipDisabled]}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.variantLabel, selectedVariantId === variant.id && styles.variantLabelActive]}>{variant.label}</Text>
                    <Text style={[styles.variantPrice, selectedVariantId === variant.id && styles.variantLabelActive]}>{formatPrice(variant.price)}</Text>
                    <Text style={[styles.variantStock, variant.stock === 0 && styles.outOfStock]}>
                      {variant.stock === 0 ? 'Agotada' : `${variant.stock} und.`}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {selectedVariant ? (
                <View style={styles.selectedVariantBox}>
                  <Text style={styles.selectedVariantText}>
                    Seleccionada: {selectedVariant.label} · {formatPrice(selectedVariant.price)} · {selectedVariant.stock} disponibles
                  </Text>
                </View>
              ) : (
                <Text style={styles.hintText}>Selecciona una opción para ver su precio y disponibilidad específicos.</Text>
              )}
              <View style={styles.quantityRow}>
                <Text style={styles.fieldLabel}>Cantidad</Text>
                <QuantityControl
                  quantity={detailQuantity}
                  onDecrease={() => setDetailQuantity((value) => Math.max(1, value - 1))}
                  onIncrease={() => {
                    if (detailQuantity >= maxQuantity) {
                      showNotice(`El máximo permitido es ${maxQuantity} unidades de esta variante.`, 'error');
                      return;
                    }
                    setDetailQuantity((value) => value + 1);
                  }}
                  canIncrease={detailQuantity < maxQuantity}
                />
              </View>
            </View>
          ) : null}

          <View style={styles.detailActions}>
            <ActionButton label={isFavorite ? '♥ En favoritos' : '♡ Favorito'} secondary compact onPress={() => toggleFavorite(selectedProduct)} />
            <ActionButton
              label={stock === 0 ? 'Agotado' : 'Agregar al carrito'}
              disabled={stock === 0}
              onPress={() => {
                const variantId = hasVariants ? selectedVariantId : null;
                if (addToCart(selectedProduct, variantId, detailQuantity) && hasVariants) setDetailQuantity(1);
              }}
              compact
            />
          </View>

          {stock === 0 ? (
            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Modo demostración · Reposición</Text>
              <Text style={styles.demoCopy}>Esta variante está agotada. Puedes solicitar un aviso y simular la reposición para probar el centro de notificaciones.</Text>
              <ActionButton
                label={activeAlert ? '✓ Aviso activo (cancelar)' : 'Avisarme cuando haya stock'}
                secondary
                compact
                onPress={() => toggleStockAlert(hasVariants ? selectedVariantId : null)}
              />
              <ActionButton label="Simular reposición (+3 und.)" onPress={() => simulateRestock(hasVariants ? selectedVariantId : null, 3)} compact />
            </View>
          ) : null}

          <View style={styles.divider} />
          <SectionTitle title="Valora este producto" subtitle="Reseña ficticia para el prototipo" />
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable key={star} onPress={() => setRatingSelection(star)} accessibilityRole="button" accessibilityLabel={`Calificar con ${star} estrellas`}>
                <Text style={[styles.reviewStar, ratingSelection >= star && styles.reviewStarSelected]}>★</Text>
              </Pressable>
            ))}
            <Text style={styles.ratingPrompt}>{ratingSelection ? `${ratingSelection} de 5` : 'Selecciona estrellas'}</Text>
          </View>
          <ActionButton label="Guardar valoración" onPress={submitRating} disabled={!ratingSelection} compact />
        </View>

        <View style={styles.detailCardSpaced}>
          <SectionTitle title="Preguntas del producto" subtitle="Respuestas simuladas en modo demostración" />
          {productQuestions.length === 0
            ? <Text style={styles.hintText}>Sé la primera persona en preguntar sobre este artículo.</Text>
            : productQuestions.map((question) => (
              <View key={question.id} style={styles.questionCard}>
                <Text style={styles.questionText}>{question.question}</Text>
                <Text style={styles.questionMeta}>{new Date(question.date).toLocaleDateString('es-CO')} · {question.status}</Text>
                {question.status === 'Respondida' ? (
                  <Text style={styles.answerText}>{question.answer}</Text>
                ) : (
                  <ActionButton label="Simular respuesta" onPress={() => answerQuestion(question)} secondary compact />
                )}
              </View>
            ))}
          <Field
            label="Escribe tu pregunta (mínimo 10 caracteres)"
            value={questionDraft}
            onChangeText={setQuestionDraft}
            placeholder="Ej. ¿Incluye garantía este componente?"
            multiline
            maxLength={240}
          />
          <ActionButton label="Enviar pregunta" onPress={submitQuestion} compact />
        </View>

        <View style={styles.detailCardSpaced}>
          <SectionTitle title="Productos relacionados" subtitle="Misma categoría, otros artículos con stock" />
          {recommendations.length === 0 ? (
            <EmptyState title="Sin recomendaciones" message="No hay otros artículos disponibles en esta categoría." />
          ) : (
            <View style={styles.productGrid}>
              {recommendations.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favorites.includes(product.id)}
                  cartQuantity={getCartLineQuantity(cart, product, null)}
                  isCompared={compareIds.includes(product.id)}
                  onOpen={() => openProduct(product, 'detail')}
                  onAdd={() => (product.variants?.length ? openProduct(product, 'detail') : addToCart(product))}
                  onToggleFavorite={() => toggleFavorite(product)}
                  onToggleCompare={() => toggleCompare(product)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    );
  };

  const renderCompare = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable onPress={() => navigate(detailBackScreen === 'compare' ? 'catalog' : detailBackScreen)} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver</Text>
      </Pressable>
      <SectionTitle title="Comparador de productos" subtitle={`${compareProducts.length} de 3 seleccionados · Máximo tres`} />
      {compareProducts.length === 0 ? (
        <EmptyState title="Aún no hay productos para comparar" message="Marca «Comp» en dos o tres tarjetas del catálogo." action="Ir al catálogo" onPress={() => navigate('catalog')} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.compareTable}>
            {[
              ['Producto', (p) => p.name],
              ['Marca', (p) => p.brand],
              ['Precio', (p) => formatPrice(p.price)],
              ['Disponibilidad', (p) => (getProductStock(p) > 0 ? `${getProductStock(p)} disponibles` : 'Agotado')],
              ['Categoría', (p) => p.category],
              ['Acción', null],
            ].map(([label, getValue]) => (
              <View key={label} style={styles.compareRow}>
                <View style={styles.compareLabelCell}><Text style={styles.compareLabelText}>{label}</Text></View>
                {compareProducts.map((product) => (
                  <View key={product.id} style={styles.compareCell}>
                    {getValue ? (
                      <Text style={styles.compareCellText}>{getValue(product)}</Text>
                    ) : (
                      <Pressable onPress={() => toggleCompare(product)} style={styles.compareRemove}>
                        <Text style={styles.compareRemoveText}>Quitar</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <Text style={styles.hintText}>La comparación no modifica tu carrito, tus favoritos ni el inventario.</Text>
    </ScrollView>
  );

  const renderFavorites = () => {
    const favoriteProducts = products.filter((product) => favorites.includes(product.id));
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionTitle title="Mis favoritos" subtitle={`${favoriteProducts.length} productos guardados`} />
        {favoriteProducts.length
          ? renderProductCards(favoriteProducts, 'favorites')
          : <EmptyState title="Aún no tienes favoritos" message="Guarda productos con el corazón para encontrarlos aquí." action="Explorar catálogo" onPress={() => navigate('catalog')} />}
      </ScrollView>
    );
  };

  const renderSummary = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Resumen de compra</Text>
      <InfoRow label="Subtotal" value={formatPrice(totals.subtotal)} />
      <InfoRow
        label={shippingQuote?.supported ? `Envío ${shippingQuote.label} · ${shippingQuote.days}` : 'Envío (estimación)'}
        value={totals.subtotal === 0 ? formatPrice(0) : totals.shipping === 0 ? 'Gratis' : formatPrice(totals.shipping)}
      />
      {totals.discount > 0 && <InfoRow label="Cupón BIENVENIDO10" value={`−${formatPrice(totals.discount)}`} negative />}
      <View style={styles.divider} />
      <InfoRow label="Total" value={formatPrice(totals.total)} emphasis />
      <Text style={styles.summaryFootnote}>
        {shippingQuote?.supported
          ? `Tarifa ficticia para ${shippingQuote.municipality} (${shippingQuote.label}). El cargo se incluye una sola vez.`
          : totals.subtotal === 0
            ? 'Agrega productos para calcular el envío.'
            : 'El envío final se calcula al elegir dirección y modalidad en la entrega.'}
      </Text>
    </View>
  );

  const renderCart = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Tu carrito" subtitle={`${cartCount} ${cartCount === 1 ? 'unidad seleccionada' : 'unidades seleccionadas'}`} />
      {cartLines.length === 0 ? (
        <EmptyState title="Tu carrito está vacío" message="Explora el catálogo y prepara tu pedido." action="Ir al catálogo" onPress={() => navigate('catalog')} />
      ) : (
        cartLines.map((line) => (
          <View key={line.key} style={styles.cartItem}>
            <Pressable onPress={() => openProduct(line.product, 'cart')}><ProductArtwork product={line.product} /></Pressable>
            <View style={styles.cartItemInfo}>
              <Text style={styles.productCategory}>{line.product.brand}</Text>
              <Text style={styles.cartProductName}>{line.product.name}</Text>
              {line.variantLabel ? <Text style={styles.variantTag}>Variante: {line.variantLabel}</Text> : null}
              <Text style={styles.productPrice}>{formatPrice(line.price)} c/u</Text>
              <View style={styles.cartControls}>
                <QuantityControl
                  quantity={line.quantity}
                  onDecrease={() => changeCartLine(line, -1)}
                  onIncrease={() => changeCartLine(line, 1)}
                  canIncrease={line.quantity < line.stock}
                />
                <Pressable onPress={() => removeCartLine(line)}><Text style={styles.removeText}>Eliminar</Text></Pressable>
              </View>
            </View>
          </View>
        ))
      )}
      <View style={styles.couponCard}>
        <Text style={styles.summaryTitle}>¿Tienes un cupón?</Text>
        <View style={styles.couponRow}>
          <TextInput value={couponCode} onChangeText={setCouponCode} placeholder="Ingresa tu código" autoCapitalize="characters" style={styles.couponInput} accessibilityLabel="Código de cupón" />
          <ActionButton label={couponApplied ? 'Aplicado' : 'Aplicar'} onPress={applyCoupon} disabled={couponApplied} compact />
        </View>
        <Text style={styles.summaryFootnote}>Prueba el código BIENVENIDO10 para recibir 10 % de descuento.</Text>
      </View>
      {renderSummary()}
      <ActionButton label="Continuar con los datos de entrega" onPress={startCheckout} disabled={!cartCount || !hydrated} />
      <Text style={styles.secureCheckout}>Simulación académica · No se realizan cobros</Text>
    </ScrollView>
  );

  const renderCheckout = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable onPress={() => checkoutStep === 'review' ? setCheckoutStep('form') : navigate('cart')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>{checkoutStep === 'review' ? 'Volver a los datos' : 'Volver al carrito'}</Text>
      </Pressable>
      <SectionTitle
        title={checkoutStep === 'form' ? 'Datos de entrega y envío' : 'Revisa tu pedido'}
        subtitle="No solicitamos datos de pago ni documentos personales."
      />
      {checkoutStep === 'form' ? (
        <View style={styles.formCard}>
          <Field label="Nombre" value={buyer.name} onChangeText={(name) => setBuyer((current) => ({ ...current, name }))} placeholder="Tu nombre" />
          <Field label="Teléfono" value={buyer.phone} onChangeText={(phone) => setBuyer((current) => ({ ...current, phone }))} placeholder="Solo contacto para la entrega" keyboardType="phone-pad" />

          <SectionTitle title="Dirección de entrega" subtitle="Principal ≠ seleccionada: elige cuál usar en este pedido" />
          {addresses.length === 0 ? (
            <EmptyState title="No tienes direcciones" message="Registra una dirección ficticia para continuar." action="Crear dirección" onPress={() => navigate('addresses')} />
          ) : addresses.map((address) => (
            <Pressable
              key={address.id}
              onPress={() => setSelectedAddressId(address.id)}
              style={[styles.addressOption, selectedAddressId === address.id && styles.addressOptionActive]}
              accessibilityRole="button"
            >
              <View style={styles.addressOptionInfo}>
                <Text style={styles.addressAlias}>
                  {address.alias}{address.principal ? '  ·  Principal' : ''}
                </Text>
                <Text style={styles.addressLine}>{address.municipality}</Text>
                <Text style={styles.addressLine}>{address.reference}</Text>
              </View>
              <Text style={[styles.selectLabel, selectedAddressId === address.id && styles.selectLabelActive]}>
                {selectedAddressId === address.id ? '✓ Elegida' : 'Elegir'}
              </Text>
            </Pressable>
          ))}
          <ActionButton label="Administrar mis direcciones" onPress={() => navigate('addresses')} secondary compact />

          <SectionTitle title="Modalidad de envío" subtitle="Tarifas ficticias solo para prácticas" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {SHIPPING_MODALITIES.map((modality) => (
              <Chip
                key={modality.id}
                label={`${modality.label} · ${modality.days}`}
                active={shippingModal === modality.id}
                onPress={() => setShippingModal(modality.id)}
              />
            ))}
          </ScrollView>
          {shippingQuote ? (
            <View style={[styles.quoteBox, !shippingQuote.supported && styles.quoteBoxError]}>
              <Text style={styles.quoteTitle}>Estimador de envío</Text>
              <Text style={styles.quoteText}>
                {shippingQuote.supported
                  ? `${shippingQuote.municipality} · ${shippingQuote.label}: ${formatPrice(shippingQuote.cost)} · ${shippingQuote.days}`
                  : shippingQuote.message}
              </Text>
              {shippingQuote.supported ? <Text style={styles.quoteText}>Total estimado: {formatPrice(calculateTotals(cart, products, couponApplied, shippingQuote).total)}</Text> : null}
            </View>
          ) : (
            <Text style={styles.hintText}>Selecciona una dirección y una modalidad para conocer el costo y plazo.</Text>
          )}
          <ActionButton label="Revisar pedido" onPress={continueToReview} />
        </View>
      ) : (
        <>
          <View style={styles.formCard}>
            <Text style={styles.summaryTitle}>Entrega para {buyer.name.trim()}</Text>
            <Text style={styles.reviewLine}>{buyer.phone.trim()}</Text>
            <Text style={styles.reviewLine}>{selectedAddress?.alias} · {selectedAddress?.municipality}</Text>
            <Text style={styles.reviewLine}>{selectedAddress?.reference}</Text>
            <Text style={styles.reviewLine}>{shippingQuote?.label} · {formatPrice(shippingQuote?.cost)} · {shippingQuote?.days}</Text>
            <View style={styles.divider} />
            {cartLines.map((line) => (
              <View key={line.key} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  {line.quantity} × {line.product.name}{line.variantLabel ? ` (${line.variantLabel})` : ''}
                </Text>
                <Text style={styles.summaryValue}>{formatPrice(line.lineTotal)}</Text>
              </View>
            ))}
          </View>
          {renderSummary()}
          <ActionButton label="Confirmar pedido simulado" onPress={confirmOrder} disabled={!cartCount} />
          <Text style={styles.secureCheckout}>La confirmación no genera ningún cobro real.</Text>
        </>
      )}
    </ScrollView>
  );

  const renderConfirmation = () => confirmedOrder && (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.confirmationCard}>
        <View style={styles.confirmationCheck}><Text style={styles.confirmationCheckText}>✓</Text></View>
        <Text style={styles.confirmationTitle}>¡Pedido confirmado!</Text>
        <Text style={styles.confirmationCopy}>Tu pedido quedó registrado en este prototipo.</Text>
        <Text style={styles.orderCode}>{confirmedOrder.code}</Text>
        <Text style={styles.totalValue}>{formatPrice(confirmedOrder.total)}</Text>
        <View style={styles.simulationNotice}><Text style={styles.simulationText}>Esta es una simulación académica. No se realizó ningún cobro.</Text></View>
        <ActionButton label="Ver seguimiento" onPress={() => { setSelectedOrderCode(confirmedOrder.code); navigate('orderDetail'); }} />
        <ActionButton label="Ver historial" onPress={() => navigate('history')} secondary compact />
        <ActionButton label="Seguir explorando" onPress={() => navigate('catalog')} secondary compact />
      </View>
    </ScrollView>
  );

  const renderHistory = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Mis pedidos" subtitle="Compras simuladas guardadas en este dispositivo" />
      {orders.length === 0 ? (
        <EmptyState title="Todavía no hay pedidos" message="Cuando confirmes una compra simulada, aparecerá aquí." action="Volver al catálogo" onPress={() => navigate('catalog')} />
      ) : orders.map((order) => (
        <Pressable
          key={order.code}
          onPress={() => { setSelectedOrderCode(order.code); navigate('orderDetail'); }}
          style={styles.orderCard}
          accessibilityRole="button"
        >
          <View style={styles.orderCardTop}>
            <Text style={styles.orderCode}>{order.code}</Text>
            <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
          </View>
          <Text style={styles.orderDate}>{new Date(order.date).toLocaleString('es-CO')}</Text>
          <View style={styles.orderMetaRow}>
            <StatusBadge status={order.status} />
            <Text style={styles.orderItems}>{order.items.length} referencias</Text>
          </View>
          <Text style={styles.linkText}>Ver detalle y seguimiento ›</Text>
        </Pressable>
      ))}
      <ActionButton label="Cargar pedidos de prueba (Simular)" onPress={loadDemoOrders} secondary compact />
      <Text style={styles.hintText}>Los pedidos de prueba son históricos: cancelarlos no vuelve a sumar stock al catálogo actual.</Text>
    </ScrollView>
  );

  const renderOrderDetail = () => selectedOrder && (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable onPress={() => navigate('history')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver a Mis pedidos</Text>
      </Pressable>
      <SectionTitle title="Detalle y seguimiento" subtitle={selectedOrder.code} />
      <View style={styles.formCard}>
        <StatusBadge status={selectedOrder.status} />
        <Text style={styles.reviewLine}>{new Date(selectedOrder.date).toLocaleString('es-CO')}</Text>
        <Text style={styles.reviewLine}>
          Entrega: {selectedOrder.delivery?.alias} · {selectedOrder.delivery?.municipality}
        </Text>
        <View style={styles.divider} />
        {selectedOrder.items.map((item) => (
          <View key={item.key || item.id} style={styles.orderLine}>
            <View style={styles.orderItemIcon}><Text style={styles.artIcon}>{item.icon}</Text></View>
            <View style={styles.orderLineInfo}>
              <Text style={styles.cartProductName}>{item.name}</Text>
              {item.variantLabel ? <Text style={styles.variantTag}>{item.variantLabel}</Text> : null}
              <Text style={styles.summaryLabel}>{item.quantity} × {formatPrice(item.price)}</Text>
            </View>
            <Text style={styles.summaryValue}>{formatPrice(item.quantity * item.price)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <InfoRow label="Subtotal" value={formatPrice(selectedOrder.subtotal)} />
        <InfoRow label="Envío" value={selectedOrder.shipping ? formatPrice(selectedOrder.shipping) : 'Gratis'} />
        {selectedOrder.discount > 0 && <InfoRow label="Descuento" value={`−${formatPrice(selectedOrder.discount)}`} negative />}
        <InfoRow label="Total" value={formatPrice(selectedOrder.total)} emphasis />
        <Text style={styles.secureCheckout}>Pedido simulado · No se realizó ningún cobro</Text>
      </View>

      <View style={styles.detailCardSpaced}>
        <SectionTitle title="Historial cronológico de estados" subtitle="Cada avance queda registrado" />
        {(selectedOrder.history || []).map((event, index) => (
          <View key={`${event.status}-${index}`} style={styles.timelineRow}>
            <View style={styles.timelineDot} />
            <View style={styles.timelineInfo}>
              <Text style={styles.timelineStatus}>{event.status}</Text>
              <Text style={styles.timelineDate}>{new Date(event.date).toLocaleString('es-CO')} · {event.note}</Text>
            </View>
          </View>
        ))}
        <ActionButton
          label="Simular avance de entrega"
          onPress={() => advanceStatus(selectedOrder)}
          disabled={!NEXT_STATUS[selectedOrder.status]}
        />
        {!NEXT_STATUS[selectedOrder.status] ? (
          <Text style={styles.hintText}>Estado final: no se permiten nuevas transiciones.</Text>
        ) : null}
        <ActionButton label="Cancelar pedido" onPress={() => requestCancel(selectedOrder)} secondary compact tone="danger" />
        <ActionButton label="Solicitar ayuda sobre este pedido" onPress={() => { setHelpForm((current) => ({ ...current, orderCode: selectedOrder.code })); navigate('help'); }} secondary compact />
      </View>
    </ScrollView>
  );

  const renderAddresses = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable onPress={() => navigate('checkout')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver</Text>
      </Pressable>
      <SectionTitle title="Mis direcciones" subtitle="Datos ficticios · Nunca solicitamos información real" />
      {addresses.map((address) => (
        <View key={address.id} style={styles.addressCard}>
          <View style={styles.addressCardTop}>
            <Text style={styles.addressAlias}>{address.alias}{address.principal ? '  ·  Principal' : ''}</Text>
            {selectedAddressId === address.id ? <Text style={styles.selectLabelActive}>Seleccionada</Text> : null}
          </View>
          <Text style={styles.addressLine}>{address.municipality}</Text>
          <Text style={styles.addressLine}>{address.reference}</Text>
          <View style={styles.cardActions}>
            <ActionButton label={address.principal ? 'Principal ✓' : 'Hacer principal'} onPress={() => makePrincipal(address)} secondary compact />
            <ActionButton label="Editar" onPress={() => editAddress(address)} secondary compact />
          </View>
        </View>
      ))}
      <View style={styles.formCard}>
        <Text style={styles.summaryTitle}>{editingAddressId ? 'Editar dirección' : 'Nueva dirección'}</Text>
        <Field label="Alias" value={addressForm.alias} onChangeText={(alias) => setAddressForm((current) => ({ ...current, alias }))} placeholder="Ej. Casa, Oficina" />
        <Field label="Municipio" value={addressForm.municipality} onChangeText={(municipality) => setAddressForm((current) => ({ ...current, municipality }))} placeholder="Mosquera, Funza o Madrid" />
        <Field label="Referencia de entrega" value={addressForm.reference} onChangeText={(reference) => setAddressForm((current) => ({ ...current, reference }))} placeholder="Calle, número, apartamento" multiline maxLength={160} />
        <ActionButton label={editingAddressId ? 'Guardar cambios' : 'Agregar dirección'} onPress={submitAddress} compact />
        {editingAddressId ? <ActionButton label="Cancelar edición" onPress={() => { setEditingAddressId(null); setAddressForm(EMPTY_ADDRESS_FORM); }} secondary compact /> : null}
        <Text style={styles.hintText}>{validateAddress(addressForm) || 'Lista para guardar.'}</Text>
      </View>
    </ScrollView>
  );

  const renderNotifications = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Centro de notificaciones" subtitle={`${unreadCount} sin leer · Avisos internos de la app`} />
      {notifications.length === 0 ? (
        <EmptyState title="No tienes notificaciones" message="Los cambios de pedido, reposiciones y casos de soporte aparecerán aquí." action="Ver mis pedidos" onPress={() => navigate('history')} />
      ) : notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => markNotificationRead(notification)}
          style={[styles.notificationCard, !notification.read && styles.notificationUnread]}
          accessibilityRole="button"
        >
          <View style={styles.notificationTop}>
            <Text style={styles.notificationType}>{notification.type.toUpperCase()}</Text>
            <Text style={styles.notificationDate}>{new Date(notification.date).toLocaleString('es-CO')}</Text>
          </View>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationStatus}>{notification.read ? 'Leído' : 'Sin leer · toca para marcar como leído'}</Text>
        </Pressable>
      ))}
      <Text style={styles.hintText}>Estos avisos son internos: no son notificaciones push ni envíos a dispositivos.</Text>
    </ScrollView>
  );

  const renderHelp = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Centro de ayuda y solicitudes" subtitle="Registra un caso asociado a un pedido simulado" />
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>Pedido relacionado</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {orders.length === 0
            ? <Text style={styles.hintText}>Aún no hay pedidos en el historial.</Text>
            : orders.map((order) => (
              <Chip
                key={order.code}
                label={order.code}
                active={helpForm.orderCode === order.code}
                onPress={() => setHelpForm((current) => ({ ...current, orderCode: order.code }))}
              />
            ))}
        </ScrollView>
        <Text style={styles.fieldLabel}>Motivo</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {SUPPORT_MOTIVES.map((motive) => (
            <Chip
              key={motive}
              label={motive}
              active={helpForm.motive === motive}
              onPress={() => setHelpForm((current) => ({ ...current, motive }))}
            />
          ))}
        </ScrollView>
        <Field
          label="Descripción (mínimo 15 caracteres)"
          value={helpForm.description}
          onChangeText={(description) => setHelpForm((current) => ({ ...current, description }))}
          placeholder="Cuéntanos qué ocurrió con tu pedido"
          multiline
          maxLength={300}
        />
        <ActionButton label="Enviar solicitud" onPress={submitTicket} compact />
        <Text style={styles.hintText}>{validateSupportRequest(helpForm.orderCode, helpForm.description) || 'Lista para enviar. Este formulario es una simulación.'}</Text>
      </View>

      <SectionTitle title="Mis solicitudes" subtitle={`${tickets.length} ${tickets.length === 1 ? 'caso registrado' : 'casos registrados'}`} />
      {tickets.length === 0 ? (
        <EmptyState title="No hay solicitudes" message="Cuando envíes un caso, podrás consultar su estado aquí." />
      ) : tickets.map((ticket) => (
        <View key={ticket.id} style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketId}>{ticket.id}</Text>
            <PlainBadge label={ticket.status} color={ticket.status === 'Abierto' ? COLORS.amber : COLORS.green} />
          </View>
          <Text style={styles.ticketLine}>Pedido: {ticket.orderCode} · Motivo: {ticket.motive}</Text>
          <Text style={styles.ticketLine}>{ticket.description}</Text>
          {ticket.response ? <Text style={styles.answerText}>{ticket.response}</Text> : null}
          {ticket.status === 'Abierto' ? (
            <ActionButton label="Simular respuesta" onPress={() => answerTicket(ticket)} secondary compact />
          ) : null}
        </View>
      ))}
    </ScrollView>
  );

  const renderSeller = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Panel de vendedor" subtitle="Administración simulada del catálogo" />
      <View style={styles.formCard}>
        <Text style={styles.summaryTitle}>{editingProductId ? `Editar ${editingProductId}` : 'Crear producto'}</Text>
        <Field label="Nombre del producto" value={sellerForm.name} onChangeText={(name) => setSellerForm((current) => ({ ...current, name }))} />
        <Text style={styles.fieldLabel}>Categoría</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((item) => (
            <Chip key={item} label={item} active={sellerForm.category === item} onPress={() => setSellerForm((current) => ({ ...current, category: item }))} />
          ))}
        </ScrollView>
        <View style={styles.numericRow}>
          <View style={styles.halfField}><Field label="Precio COP (entero)" value={sellerForm.price} onChangeText={(price) => setSellerForm((current) => ({ ...current, price }))} keyboardType="numeric" /></View>
          <View style={styles.halfField}><Field label="Stock" value={sellerForm.stock} onChangeText={(stock) => setSellerForm((current) => ({ ...current, stock }))} keyboardType="numeric" /></View>
        </View>
        <Field label="Descripción (mínimo 15 caracteres)" value={sellerForm.description} onChangeText={(description) => setSellerForm((current) => ({ ...current, description }))} multiline maxLength={240} />
        <ActionButton label={editingProductId ? 'Guardar cambios' : 'Crear producto'} onPress={saveSellerProduct} />
        {editingProductId ? <ActionButton label="Cancelar edición" onPress={() => { setEditingProductId(null); setSellerForm({ name: '', category: CATEGORIES[0], price: '', stock: '0', description: '' }); }} secondary compact /> : null}
      </View>
      <SectionTitle title="Productos registrados" subtitle={`${products.length} productos · stock derivado de variantes`} />
      {products.map((product) => (
        <View key={product.id} style={styles.sellerRow}>
          <View style={styles.sellerProductInfo}>
            <Text style={styles.sellerProductId}>{product.id} · {product.category}</Text>
            <Text style={styles.cartProductName}>{product.name}</Text>
            <Text style={styles.summaryLabel}>{formatPrice(product.price)} · Stock: {getProductStock(product)}{product.variants?.length ? ' (variantes)' : ''}</Text>
          </View>
          <Pressable onPress={() => { setEditingProductId(product.id); setSellerForm({ name: product.name, category: product.category, price: String(product.price), stock: String(getProductStock(product)), description: product.description, brand: product.brand }); }} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );

  const renderMore = () => {
    const items = [
      { screen: 'compare', label: 'Comparador de productos', detail: `${compareIds.length}/3 seleccionados`, icon: '⚖' },
      { screen: 'addresses', label: 'Mis direcciones', detail: `${addresses.length} registradas`, icon: '⌖' },
      { screen: 'notifications', label: 'Notificaciones', detail: `${unreadCount} sin leer`, icon: '♢' },
      { screen: 'help', label: 'Centro de ayuda', detail: `${tickets.length} solicitudes`, icon: '?' },
      { screen: 'seller', label: 'Panel de vendedor', detail: `${products.length} productos`, icon: '▤' },
    ];
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <SectionTitle title="Más servicios" subtitle="Novedades del Marketplace 2.0" />
        {items.map((item) => (
          <Pressable key={item.screen} onPress={() => navigate(item.screen)} style={styles.moreItem} accessibilityRole="button">
            <Text style={styles.moreIcon}>{item.icon}</Text>
            <View style={styles.moreInfo}>
              <Text style={styles.moreLabel}>{item.label}</Text>
              <Text style={styles.moreDetail}>{item.detail}</Text>
            </View>
            <Text style={styles.moreArrow}>›</Text>
          </Pressable>
        ))}
        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Simulación académica</Text>
          <Text style={styles.demoCopy}>
            Los avances de entrega, reposiciones y respuestas se ejecutan con controles marcados «Simular».
            No hay pagos, transportistas, notificaciones push ni servicios externos.
          </Text>
        </View>
      </ScrollView>
    );
  };

  const navItems = [
    { key: 'catalog', label: 'Catálogo', icon: '⌂' },
    { key: 'favorites', label: 'Favoritos', icon: '♡' },
    { key: 'cart', label: `Carrito${cartCount ? ` (${cartCount})` : ''}`, icon: '⌑' },
    { key: 'history', label: 'Pedidos', icon: '↻' },
    { key: 'more', label: 'Más', icon: '◈' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <BrandMark />
          <Pressable onPress={() => navigate('notifications')} accessibilityRole="button" accessibilityLabel={`Notificaciones, ${unreadCount} sin leer`} style={styles.bellButton}>
            <Text style={styles.bellIcon}>♢</Text>
            {unreadCount > 0 ? <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{unreadCount}</Text></View> : null}
          </Pressable>
          <View style={styles.headerBadge}><Text style={styles.headerBadgeText}>JHOY</Text></View>
        </View>
        {notice && (
          <Pressable onPress={() => setNotice(null)} style={[styles.notice, notice.type === 'error' && styles.noticeError]}>
            <Text style={[styles.noticeText, notice.type === 'error' && styles.noticeErrorText]}>{notice.message}</Text>
            <Text style={styles.noticeClose}>×</Text>
          </Pressable>
        )}
        <View style={styles.screenContent}>
          {hydrated ? (
            <>
              {screen === 'catalog' && renderCatalog()}
              {screen === 'detail' && renderDetail()}
              {screen === 'compare' && renderCompare()}
              {screen === 'favorites' && renderFavorites()}
              {screen === 'cart' && renderCart()}
              {screen === 'checkout' && renderCheckout()}
              {screen === 'confirmation' && renderConfirmation()}
              {screen === 'history' && renderHistory()}
              {screen === 'orderDetail' && renderOrderDetail()}
              {screen === 'addresses' && renderAddresses()}
              {screen === 'notifications' && renderNotifications()}
              {screen === 'help' && renderHelp()}
              {screen === 'seller' && renderSeller()}
              {screen === 'more' && renderMore()}
            </>
          ) : <Text style={styles.loadingLabel}>Cargando tus datos guardados…</Text>}
        </View>
        <View style={styles.bottomNav}>
          {navItems.map((item) => (
            <Pressable key={item.key} onPress={() => navigate(item.key)} style={styles.navItem} accessibilityRole="button" accessibilityLabel={item.label}>
              <Text style={[styles.navIcon, screen === item.key && styles.navIconActive]}>{item.icon}</Text>
              <Text style={[styles.navLabel, screen === item.key && styles.navLabelActive]} numberOfLines={1}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      <ConfirmDialog
        visible={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        confirmLabel={dialog?.confirmLabel}
        onConfirm={dialog?.onConfirm}
        onCancel={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Estilos
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  appShell: { flex: 1, backgroundColor: COLORS.background, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { minHeight: 72, paddingHorizontal: 15, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: COLORS.line },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 },
  brandIcon: { height: 39, width: 39, borderRadius: 13, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: COLORS.white, fontSize: 10, fontWeight: '900', letterSpacing: -0.5 },
  brandCopy: { flexShrink: 1 },
  brandName: { color: COLORS.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  brandTagline: { color: COLORS.muted, fontSize: 8, marginTop: 2 },
  bellButton: { paddingHorizontal: 8, paddingVertical: 6, position: 'relative' },
  bellIcon: { color: COLORS.blue, fontSize: 22, fontWeight: '700' },
  bellBadge: { position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: COLORS.red, alignItems: 'center', justifyContent: 'center' },
  bellBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  headerBadge: { backgroundColor: COLORS.paleBlue, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 4 },
  headerBadgeText: { color: COLORS.blue, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  notice: { marginHorizontal: 12, marginTop: 8, paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#E8F5EE', flexDirection: 'row', alignItems: 'center', gap: 8 },
  noticeError: { backgroundColor: '#FCECEE' },
  noticeText: { flex: 1, color: '#28764E', fontSize: 11, lineHeight: 15, fontWeight: '600' },
  noticeErrorText: { color: COLORS.red },
  noticeClose: { color: COLORS.muted, fontSize: 18, paddingHorizontal: 3 },
  loadingLabel: { color: COLORS.muted, fontSize: 10, textAlign: 'center', paddingVertical: 5 },
  screenContent: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 26 },
  hero: { minHeight: 148, borderRadius: 20, padding: 20, backgroundColor: '#142640', justifyContent: 'center', overflow: 'hidden' },
  eyebrow: { color: '#91B7FF', fontSize: 9, letterSpacing: 1.7, fontWeight: '800', marginBottom: 8 },
  heroTitle: { color: COLORS.white, fontSize: 25, lineHeight: 30, fontWeight: '800', maxWidth: 310 },
  heroCopy: { color: '#C0CCDE', fontSize: 11, lineHeight: 16, marginTop: 6, maxWidth: 300 },
  searchBox: { height: 46, borderRadius: 13, backgroundColor: COLORS.white, marginTop: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  searchIcon: { color: COLORS.muted, fontSize: 23, lineHeight: 27, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.ink, fontSize: 12, paddingVertical: 0 },
  sectionTitleBlock: { marginTop: 19, marginBottom: 11 },
  sectionTitle: { color: COLORS.ink, fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sectionSubtitle: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  categoryRow: { gap: 7, paddingRight: 10 },
  chipRow: { gap: 7, paddingRight: 10, marginTop: 8 },
  chip: { paddingHorizontal: 12, height: 32, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  chipDisabled: { opacity: 0.5 },
  chipText: { color: '#657389', fontSize: 10, fontWeight: '600' },
  chipTextActive: { color: COLORS.white, fontWeight: '700' },
  chipTextDisabled: { color: COLORS.muted },
  filterCard: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  filterHeader: { paddingVertical: 2 },
  filterHeaderText: { color: COLORS.blue, fontSize: 11, fontWeight: '800' },
  numericRow: { flexDirection: 'row', gap: 9, marginTop: 10 },
  halfField: { flex: 1 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  checkBox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: COLORS.line, alignItems: 'center', justifyContent: 'center' },
  checkBoxActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  checkMark: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  checkLabel: { color: COLORS.ink, fontSize: 10 },
  filterActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  errorText: { color: COLORS.red, fontSize: 10, marginTop: 6 },
  hintText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 8 },
  listHeading: { marginTop: 19, marginBottom: 10 },
  sortControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  compareBanner: { paddingVertical: 11, paddingHorizontal: 14, borderRadius: 12, backgroundColor: COLORS.paleBlue, marginBottom: 12 },
  compareBannerText: { color: COLORS.blue, fontSize: 11, fontWeight: '800' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 11 },
  productCard: { width: '48.5%', padding: 9, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#EDF0F5' },
  productArtworkWrap: { position: 'relative' },
  artwork: { height: 105, borderRadius: 11, backgroundColor: '#EAF0F8', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  artworkLarge: { height: 220, borderRadius: 19, marginBottom: 14, backgroundColor: '#E8EEF8' },
  artGlow: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: '#D4E1F7', right: -15, top: -19 },
  artGlowLarge: { width: 160, height: 160, borderRadius: 80 },
  artFrame: { width: 86, height: 62, borderRadius: 10, backgroundColor: '#203959', justifyContent: 'center', alignItems: 'center' },
  artIcon: { color: '#B8D1FF', fontSize: 25, fontWeight: '700' },
  artIconLarge: { fontSize: 48 },
  artLabel: { color: '#DDE8FA', fontSize: 8, fontWeight: '700', letterSpacing: 0.6 },
  artCategory: { position: 'absolute', left: 8, bottom: 7, color: '#8393A9', fontSize: 7, fontWeight: '800', letterSpacing: 0.8 },
  favoriteButton: { position: 'absolute', top: 6, right: 6, width: 27, height: 27, borderRadius: 9, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  favoriteGlyph: { color: '#78869A', fontSize: 17 },
  favoriteGlyphActive: { color: '#DB4660' },
  productCategory: { color: COLORS.blue, fontSize: 9, fontWeight: '700', marginTop: 9, textTransform: 'uppercase', letterSpacing: 0.4 },
  productName: { color: COLORS.ink, fontSize: 11, lineHeight: 15, minHeight: 30, fontWeight: '700', marginTop: 4 },
  productPrice: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginTop: 7 },
  stockLabel: { color: COLORS.green, fontSize: 9, marginTop: 4, fontWeight: '600' },
  outOfStock: { color: COLORS.red },
  actionButton: { minHeight: 43, borderRadius: 12, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 13 },
  actionButtonText: { color: COLORS.white, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  secondaryButton: { backgroundColor: '#F5F8FF', borderWidth: 1, borderColor: '#D8E4FA' },
  secondaryButtonText: { color: COLORS.blue },
  dangerButton: { backgroundColor: COLORS.red },
  compactButton: { minHeight: 32, borderRadius: 9, marginTop: 8 },
  disabledButton: { backgroundColor: '#E7EAF0', borderColor: '#E7EAF0' },
  disabledButtonText: { color: '#8E99A8' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  compareToggle: { minHeight: 32, borderRadius: 9, marginTop: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#D8E4FA', backgroundColor: '#F5F8FF' },
  compareToggleActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  compareToggleText: { color: COLORS.blue, fontSize: 9, fontWeight: '800' },
  compareToggleTextActive: { color: COLORS.white },
  trustNote: { color: COLORS.muted, fontSize: 9, textAlign: 'center', marginTop: 16, marginBottom: 4 },
  emptyState: { minHeight: 200, padding: 22, borderRadius: 17, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, marginTop: 8 },
  emptyStateIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.paleBlue, alignItems: 'center', justifyContent: 'center' },
  emptyStateGlyph: { color: COLORS.blue, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  emptyStateTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '800', marginTop: 13, textAlign: 'center' },
  emptyStateCopy: { color: COLORS.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 6, maxWidth: 260 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 13 },
  backArrow: { color: COLORS.blue, fontSize: 26, lineHeight: 27, marginRight: 5 },
  backText: { color: COLORS.blue, fontSize: 11, fontWeight: '700' },
  detailCard: { backgroundColor: COLORS.white, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: COLORS.line },
  detailCardSpaced: { backgroundColor: COLORS.white, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: COLORS.line, marginTop: 14 },
  detailMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  detailCategory: { color: COLORS.blue, fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  detailRating: { color: COLORS.ink, fontSize: 9, fontWeight: '700' },
  detailTitle: { color: COLORS.ink, fontSize: 20, lineHeight: 26, fontWeight: '800', marginTop: 9 },
  detailPrice: { color: COLORS.ink, fontSize: 22, fontWeight: '900', marginTop: 10 },
  description: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 12 },
  detailActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 7 },
  divider: { height: 1, backgroundColor: COLORS.line, marginVertical: 15 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  reviewStar: { color: '#C7CED9', fontSize: 26 },
  reviewStarSelected: { color: '#F3A92C' },
  ratingPrompt: { color: COLORS.muted, fontSize: 9, marginLeft: 4 },
  variantBlock: { marginTop: 14 },
  variantChip: { minWidth: 118, padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FCFDFE' },
  variantChipActive: { borderColor: COLORS.blue, backgroundColor: COLORS.paleBlue },
  variantChipDisabled: { opacity: 0.45 },
  variantLabel: { color: COLORS.ink, fontSize: 10, fontWeight: '800' },
  variantLabelActive: { color: COLORS.blue },
  variantPrice: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  variantStock: { color: COLORS.green, fontSize: 9, marginTop: 3 },
  selectedVariantBox: { marginTop: 9, padding: 10, borderRadius: 9, backgroundColor: COLORS.paleBlue },
  selectedVariantText: { color: COLORS.blue, fontSize: 10, fontWeight: '700' },
  quantityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  demoBox: { marginTop: 14, padding: 12, borderRadius: 12, backgroundColor: '#FFF8E8', borderWidth: 1, borderColor: '#F3E2B8' },
  demoTitle: { color: COLORS.amber, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  demoCopy: { color: '#7A642F', fontSize: 10, lineHeight: 15, marginTop: 6 },
  questionCard: { padding: 11, borderRadius: 10, backgroundColor: '#F8FAFD', borderWidth: 1, borderColor: COLORS.line, marginBottom: 9 },
  questionText: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  questionMeta: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  answerText: { color: '#5F6F83', fontSize: 10, lineHeight: 15, marginTop: 7, fontStyle: 'italic' },
  compareTable: { minWidth: 560, backgroundColor: COLORS.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.line },
  compareRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.line, minHeight: 54 },
  compareLabelCell: { width: 92, padding: 10, justifyContent: 'center', backgroundColor: '#F4F7FC' },
  compareLabelText: { color: COLORS.blue, fontSize: 10, fontWeight: '800' },
  compareCell: { width: 150, padding: 10, justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: COLORS.line },
  compareCellText: { color: COLORS.ink, fontSize: 10, fontWeight: '600' },
  compareRemove: { paddingVertical: 6, alignItems: 'center', borderRadius: 7, backgroundColor: '#FCECEE' },
  compareRemoveText: { color: COLORS.red, fontSize: 10, fontWeight: '800' },
  cartItem: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  cartItemInfo: { flex: 1, justifyContent: 'center' },
  cartProductName: { color: COLORS.ink, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 4 },
  variantTag: { color: COLORS.blue, fontSize: 9, fontWeight: '700', marginTop: 3 },
  cartControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginTop: 6 },
  quantityControl: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: COLORS.line, overflow: 'hidden' },
  quantityButton: { width: 29, height: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FB' },
  quantityButtonDisabled: { opacity: 0.4 },
  quantityButtonText: { color: COLORS.ink, fontSize: 16, lineHeight: 19 },
  quantityValue: { width: 27, color: COLORS.ink, textAlign: 'center', fontSize: 10, fontWeight: '700' },
  removeText: { color: COLORS.red, fontSize: 9, fontWeight: '700', padding: 4 },
  couponCard: { marginTop: 9, padding: 13, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  couponRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  couponInput: { flex: 1, height: 38, borderRadius: 9, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 10, color: COLORS.ink, fontSize: 11 },
  summaryCard: { marginTop: 11, padding: 15, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line },
  summaryTitle: { color: COLORS.ink, fontSize: 13, fontWeight: '800', marginBottom: 9 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginVertical: 5 },
  summaryLabel: { flex: 1, color: COLORS.muted, fontSize: 10 },
  summaryValue: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  discountValue: { color: COLORS.green, fontSize: 10, fontWeight: '800' },
  totalLabel: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  totalValue: { color: COLORS.ink, fontSize: 16, fontWeight: '900' },
  summaryFootnote: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 7 },
  secureCheckout: { color: COLORS.muted, fontSize: 9, textAlign: 'center', marginVertical: 11 },
  formCard: { padding: 15, borderRadius: 16, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 12 },
  fieldGroup: { marginBottom: 11 },
  fieldLabel: { color: COLORS.ink, fontSize: 10, fontWeight: '700', marginBottom: 5 },
  fieldInput: { minHeight: 40, borderRadius: 9, borderWidth: 1, borderColor: COLORS.line, paddingHorizontal: 10, color: COLORS.ink, fontSize: 11, backgroundColor: '#FCFDFE' },
  multilineInput: { minHeight: 75, paddingTop: 10, textAlignVertical: 'top' },
  reviewLine: { color: COLORS.muted, fontSize: 11, marginTop: 5 },
  addressOption: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 11, borderRadius: 11, borderWidth: 1, borderColor: COLORS.line, backgroundColor: '#FCFDFE', marginBottom: 8 },
  addressOptionActive: { borderColor: COLORS.blue, backgroundColor: COLORS.paleBlue },
  addressOptionInfo: { flex: 1 },
  addressAlias: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  addressLine: { color: COLORS.muted, fontSize: 10, marginTop: 3 },
  selectLabel: { color: COLORS.blue, fontSize: 10, fontWeight: '800' },
  selectLabelActive: { color: COLORS.blue, fontSize: 10, fontWeight: '800' },
  quoteBox: { marginTop: 11, padding: 11, borderRadius: 10, backgroundColor: COLORS.paleBlue },
  quoteBoxError: { backgroundColor: '#FCECEE' },
  quoteTitle: { color: COLORS.blue, fontSize: 10, fontWeight: '900' },
  quoteText: { color: COLORS.ink, fontSize: 10, lineHeight: 15, marginTop: 4 },
  orderCard: { padding: 14, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  orderCode: { color: COLORS.blue, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  orderTotal: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
  orderDate: { color: COLORS.muted, fontSize: 9, marginTop: 6 },
  orderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 },
  orderItems: { color: COLORS.ink, fontSize: 10 },
  linkText: { color: COLORS.blue, fontSize: 10, fontWeight: '700', marginTop: 9 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 9, fontWeight: '800' },
  orderLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  orderItemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.paleBlue, alignItems: 'center', justifyContent: 'center' },
  orderLineInfo: { flex: 1 },
  timelineRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.blue, marginTop: 3 },
  timelineInfo: { flex: 1 },
  timelineStatus: { color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  timelineDate: { color: COLORS.muted, fontSize: 9, lineHeight: 13, marginTop: 2 },
  addressCard: { padding: 13, borderRadius: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 9 },
  addressCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  notificationCard: { padding: 12, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 8 },
  notificationUnread: { borderLeftWidth: 4, borderLeftColor: COLORS.blue },
  notificationTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  notificationType: { color: COLORS.blue, fontSize: 9, fontWeight: '900' },
  notificationDate: { color: COLORS.muted, fontSize: 8 },
  notificationMessage: { color: COLORS.ink, fontSize: 11, lineHeight: 16, marginTop: 6 },
  notificationStatus: { color: COLORS.muted, fontSize: 9, marginTop: 6 },
  ticketCard: { padding: 13, borderRadius: 13, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 9 },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  ticketId: { color: COLORS.blue, fontSize: 11, fontWeight: '900' },
  ticketLine: { color: COLORS.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  moreItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 13, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 9 },
  moreIcon: { color: COLORS.blue, fontSize: 20, width: 26, textAlign: 'center' },
  moreInfo: { flex: 1 },
  moreLabel: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  moreDetail: { color: COLORS.muted, fontSize: 9, marginTop: 3 },
  moreArrow: { color: COLORS.muted, fontSize: 20 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, padding: 10, marginBottom: 8 },
  sellerProductInfo: { flex: 1 },
  sellerProductId: { color: COLORS.blue, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  editButton: { backgroundColor: COLORS.paleBlue, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8 },
  editButtonText: { color: COLORS.blue, fontSize: 9, fontWeight: '800' },
  confirmationCard: { marginTop: 30, padding: 22, borderRadius: 19, backgroundColor: COLORS.white, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  confirmationCheck: { width: 61, height: 61, borderRadius: 22, backgroundColor: '#E5F5EC', alignItems: 'center', justifyContent: 'center' },
  confirmationCheckText: { color: COLORS.green, fontSize: 29, fontWeight: '800' },
  confirmationTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '900', marginTop: 16 },
  confirmationCopy: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 6 },
  simulationNotice: { width: '100%', padding: 11, borderRadius: 10, backgroundColor: '#FFF5E5', marginTop: 15 },
  simulationText: { color: '#85601D', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  dialogOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,27,45,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  dialogCard: { width: '100%', maxWidth: 380, backgroundColor: COLORS.white, borderRadius: 17, padding: 20 },
  dialogTitle: { color: COLORS.ink, fontSize: 16, fontWeight: '900' },
  dialogMessage: { color: COLORS.muted, fontSize: 11, lineHeight: 17, marginTop: 9 },
  dialogActions: { marginTop: 12 },
  bottomNav: { minHeight: 61, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 3 },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navIcon: { color: '#96A1B0', fontSize: 19, lineHeight: 22 },
  navIconActive: { color: COLORS.blue },
  navLabel: { color: '#96A1B0', fontSize: 8, fontWeight: '600' },
  navLabelActive: { color: COLORS.blue, fontWeight: '800' },
});
