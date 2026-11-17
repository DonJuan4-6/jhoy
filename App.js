import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Pressable, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  calculateTotals,
  CATEGORIES,
  COUPON_CODE,
  createConfirmedOrder,
  filterAndSortProducts,
  formatPrice,
  getRatingStats,
  INITIAL_PRODUCTS,
  isValidCoupon,
  normalizePersistedData,
  SHIPPING_FEE,
  validateBuyer,
  validateCart,
  validateProduct,
  validateRating,
} from './marketplace.mjs';

const STORAGE_KEY = 'jhoy-marketplace-v1';
const EMPTY_BUYER = { name: '', phone: '', municipality: '', address: '' };
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
};

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

function ActionButton({ label, onPress, disabled = false, secondary = false, compact = false }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.actionButton, secondary && styles.secondaryButton, compact && styles.compactButton, disabled && styles.disabledButton]}
    >
      <Text style={[styles.actionButtonText, secondary && styles.secondaryButtonText, disabled && styles.disabledButtonText]}>{label}</Text>
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

function ProductCard({ product, isFavorite, cartQuantity, onOpen, onAdd, onToggleFavorite }) {
  const unavailable = product.stock === 0;
  const atCartLimit = cartQuantity >= product.stock;
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
      <Text style={styles.productCategory}>{product.category}</Text>
      <Pressable onPress={onOpen}><Text style={styles.productName} numberOfLines={2}>{product.name}</Text></Pressable>
      <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
      <Text style={[styles.stockLabel, unavailable && styles.outOfStock]}>{unavailable ? 'Agotado' : `${product.stock} disponibles`}</Text>
      <ActionButton
        label={unavailable ? 'Agotado' : atCartLimit ? 'Stock en carrito' : '＋  Agregar'}
        onPress={onAdd}
        disabled={unavailable || atCartLimit}
        compact
      />
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

export default function App() {
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [cart, setCart] = useState({});
  const [favorites, setFavorites] = useState([]);
  const [orders, setOrders] = useState([]);
  const [screen, setScreen] = useState('catalog');
  const [detailBackScreen, setDetailBackScreen] = useState('catalog');
  const [selectedProductId, setSelectedProductId] = useState(INITIAL_PRODUCTS[0].id);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartItems = products.filter((product) => cart[product.id] > 0);
  const totals = calculateTotals(cart, products, couponApplied);
  const selectedProduct = products.find((product) => product.id === selectedProductId) || products[0];
  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, search, category, sort),
    [products, search, category, sort],
  );

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
    const state = JSON.stringify({ products, cart, favorites, orders });
    AsyncStorage.setItem(STORAGE_KEY, state).catch((error) => {
      console.error('No fue posible guardar los datos de JHOY.', error);
      setNotice({ message: 'No se pudieron guardar los cambios en este dispositivo.', type: 'error' });
    });
  }, [products, cart, favorites, orders, hydrated]);

  const showNotice = (message, type = 'success') => setNotice({ message, type });
  const navigate = (nextScreen) => {
    setNotice(null);
    setScreen(nextScreen);
  };

  const openProduct = (product, fromScreen = screen) => {
    setSelectedProductId(product.id);
    setDetailBackScreen(fromScreen);
    setRatingSelection(0);
    navigate('detail');
  };

  const toggleFavorite = (product) => {
    const isSaved = favorites.includes(product.id);
    setFavorites((current) => (
      isSaved ? current.filter((id) => id !== product.id) : [...current, product.id]
    ));
    showNotice(isSaved ? 'Producto eliminado de favoritos.' : 'Producto guardado en favoritos.');
  };

  const addToCart = (product) => {
    const quantity = cart[product.id] || 0;
    if (product.stock <= 0) {
      showNotice('Este producto está agotado y no se puede agregar.', 'error');
      return;
    }
    if (quantity >= product.stock) {
      showNotice(`Solo hay ${product.stock} unidades disponibles de este producto.`, 'error');
      return;
    }
    setCart((current) => ({ ...current, [product.id]: (current[product.id] || 0) + 1 }));
    showNotice(`${product.name} se agregó al carrito.`);
  };

  const decreaseCartItem = (productId) => {
    const currentQuantity = cart[productId] || 0;
    setCart((current) => {
      const next = { ...current };
      if (currentQuantity <= 1) delete next[productId];
      else next[productId] = currentQuantity - 1;
      return next;
    });
    showNotice(currentQuantity <= 1 ? 'El producto se quitó del carrito.' : 'Cantidad actualizada.');
  };

  const removeCartItem = (productId) => {
    setCart((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
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
    const error = validateBuyer(buyer);
    if (error) {
      showNotice(error, 'error');
      return;
    }
    setCheckoutStep('review');
    setNotice(null);
  };

  const confirmOrder = () => {
    const result = createConfirmedOrder({
      cart,
      products,
      buyer,
      couponApplied,
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

  const editProduct = (product) => {
    setEditingProductId(product.id);
    setSellerForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      stock: String(product.stock),
      description: product.description,
    });
    setNotice(null);
  };

  const clearSellerForm = () => {
    setEditingProductId(null);
    setSellerForm({ name: '', category: CATEGORIES[0], price: '', stock: '0', description: '' });
  };

  const saveSellerProduct = () => {
    const productData = {
      ...sellerForm,
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
        product.id === editingProductId ? { ...product, ...productData } : product
      )));
      showNotice('Producto actualizado sin duplicar su referencia.');
    } else {
      const nextNumber = products.reduce((largest, product) => {
        const match = product.id.match(/^PROD-(\d+)$/);
        return match ? Math.max(largest, Number(match[1])) : largest;
      }, 0) + 1;
      const iconByCategory = { 'Periféricos': '⌁', GPU: '▰', CPU: '▦', Almacenamiento: '▱' };
      const newProduct = {
        ...productData,
        id: `PROD-${String(nextNumber).padStart(3, '0')}`,
        icon: iconByCategory[productData.category],
        short: productData.name.slice(0, 12).toUpperCase(),
        ratings: [],
      };
      setProducts((current) => [...current, newProduct]);
      showNotice('Producto creado y agregado al catálogo.');
    }
    clearSellerForm();
  };

  const renderProductCards = (list, source) => (
    <View style={styles.productGrid}>
      {list.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          isFavorite={favorites.includes(product.id)}
          cartQuantity={cart[product.id] || 0}
          onOpen={() => openProduct(product, source)}
          onAdd={() => addToCart(product)}
          onToggleFavorite={() => toggleFavorite(product)}
        />
      ))}
    </View>
  );

  const renderCatalog = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>POTENCIA A TU MEDIDA</Text>
        <Text style={styles.heroTitle}>Arma tu próximo gran setup.</Text>
        <Text style={styles.heroCopy}>Para aficionados a las computadoras: componentes para tareas suaves o fuertes.</Text>
      </View>
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Busca por nombre de producto"
          placeholderTextColor="#94A0B0"
          style={styles.searchInput}
          accessibilityLabel="Buscar productos"
        />
      </View>
      <SectionTitle title="Categorías" subtitle="Elige el componente para tu setup" />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        {['Todas', ...CATEGORIES].map((item) => (
          <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.listHeading}>
        <View>
          <Text style={styles.sectionTitle}>Catálogo</Text>
          <Text style={styles.sectionSubtitle}>{filteredProducts.length} {filteredProducts.length === 1 ? 'producto' : 'productos'}</Text>
        </View>
        <View style={styles.sortControls}>
          {[['featured', 'Destacados'], ['asc', 'Menor a mayor'], ['desc', 'Mayor a menor']].map(([value, label]) => (
            <Pressable key={value} onPress={() => setSort(value)} style={[styles.sortChip, sort === value && styles.sortChipActive]}>
              <Text style={[styles.sortText, sort === value && styles.sortTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {filteredProducts.length
        ? renderProductCards(filteredProducts, 'catalog')
        : <EmptyState title="No encontramos productos" message="Prueba con otra palabra o cambia la categoría." action="Ver todo el catálogo" onPress={() => { setSearch(''); setCategory('Todas'); }} />}
      <Text style={styles.trustNote}>✓  Compra simulada · Precios en pesos colombianos</Text>
    </ScrollView>
  );

  const renderDetail = () => {
    if (!selectedProduct) return null;
    const stockAvailable = selectedProduct.stock > 0;
    const stats = getRatingStats(selectedProduct.ratings);
    const isFavorite = favorites.includes(selectedProduct.id);
    return (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Pressable onPress={() => navigate(detailBackScreen)} style={styles.backButton}>
          <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver</Text>
        </Pressable>
        <ProductArtwork product={selectedProduct} large />
        <View style={styles.detailCard}>
          <View style={styles.detailMetaRow}>
            <Text style={styles.detailCategory}>{selectedProduct.category.toUpperCase()}</Text>
            <Text style={styles.detailRating}>{stats.count ? `★ ${stats.average} · ${stats.count} valoraciones` : 'Sin valoraciones'}</Text>
          </View>
          <Text style={styles.detailTitle}>{selectedProduct.name}</Text>
          <Text style={styles.detailPrice}>{formatPrice(selectedProduct.price)}</Text>
          <Text style={styles.stockLabel}>{stockAvailable ? `${selectedProduct.stock} unidades disponibles` : 'Agotado'}</Text>
          <Text style={styles.description}>{selectedProduct.description}</Text>
          <View style={styles.detailActions}>
            <ActionButton label={isFavorite ? '♥ En favoritos' : '♡ Favorito'} secondary compact onPress={() => toggleFavorite(selectedProduct)} />
            <ActionButton
              label={!stockAvailable ? 'Agotado' : cart[selectedProduct.id] >= selectedProduct.stock ? 'Stock en carrito' : 'Agregar al carrito'}
              onPress={() => addToCart(selectedProduct)}
              disabled={!stockAvailable || (cart[selectedProduct.id] || 0) >= selectedProduct.stock}
              compact
            />
          </View>
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
      </ScrollView>
    );
  };

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
      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatPrice(totals.subtotal)}</Text></View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Envío</Text>
        <Text style={styles.summaryValue}>{totals.subtotal === 0 ? formatPrice(0) : totals.shipping === 0 ? 'Gratis' : formatPrice(SHIPPING_FEE)}</Text>
      </View>
      {totals.discount > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Cupón BIENVENIDO10</Text><Text style={styles.discountValue}>−{formatPrice(totals.discount)}</Text></View>}
      <View style={styles.divider} />
      <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatPrice(totals.total)}</Text></View>
      <Text style={styles.summaryFootnote}>{totals.subtotal === 0 ? 'Agrega productos para calcular el envío.' : totals.subtotal >= 150000 ? 'Envío gratis desde $150.000' : 'El envío cuesta $8.000 para compras menores a $150.000.'}</Text>
    </View>
  );

  const renderCart = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Tu carrito" subtitle={`${cartCount} ${cartCount === 1 ? 'unidad seleccionada' : 'unidades seleccionadas'}`} />
      {cartItems.length === 0 ? (
        <EmptyState title="Tu carrito está vacío" message="Explora el catálogo y prepara tu pedido." action="Ir al catálogo" onPress={() => navigate('catalog')} />
      ) : (
        cartItems.map((product) => (
          <View key={product.id} style={styles.cartItem}>
            <Pressable onPress={() => openProduct(product, 'cart')}><ProductArtwork product={product} /></Pressable>
            <View style={styles.cartItemInfo}>
              <Text style={styles.productCategory}>{product.category}</Text>
              <Text style={styles.cartProductName}>{product.name}</Text>
              <Text style={styles.productPrice}>{formatPrice(product.price)}</Text>
              <View style={styles.cartControls}>
                <QuantityControl
                  quantity={cart[product.id]}
                  onDecrease={() => decreaseCartItem(product.id)}
                  onIncrease={() => addToCart(product)}
                  canIncrease={cart[product.id] < product.stock}
                />
                <Pressable onPress={() => removeCartItem(product.id)}><Text style={styles.removeText}>Eliminar</Text></Pressable>
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
      <SectionTitle title={checkoutStep === 'form' ? 'Datos de entrega' : 'Revisa tu pedido'} subtitle="No solicitamos datos de pago ni documentos personales." />
      {checkoutStep === 'form' ? (
        <View style={styles.formCard}>
          <Field label="Nombre" value={buyer.name} onChangeText={(name) => setBuyer((current) => ({ ...current, name }))} placeholder="Tu nombre" />
          <Field label="Teléfono" value={buyer.phone} onChangeText={(phone) => setBuyer((current) => ({ ...current, phone }))} placeholder="Solo contacto para la entrega" keyboardType="phone-pad" />
          <Field label="Municipio" value={buyer.municipality} onChangeText={(municipality) => setBuyer((current) => ({ ...current, municipality }))} />
          <Field label="Dirección" value={buyer.address} onChangeText={(address) => setBuyer((current) => ({ ...current, address }))} placeholder="Dirección de entrega" />
          <ActionButton label="Revisar pedido" onPress={continueToReview} />
        </View>
      ) : (
        <>
          <View style={styles.formCard}>
            <Text style={styles.summaryTitle}>Entrega para {buyer.name.trim()}</Text>
            <Text style={styles.reviewLine}>{buyer.phone.trim()}</Text>
            <Text style={styles.reviewLine}>{buyer.address.trim()}, {buyer.municipality.trim()}</Text>
            <View style={styles.divider} />
            {cartItems.map((product) => (
              <View key={product.id} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{cart[product.id]} × {product.name}</Text>
                <Text style={styles.summaryValue}>{formatPrice(product.price * cart[product.id])}</Text>
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

  const renderHistory = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <SectionTitle title="Historial de pedidos" subtitle="Tus compras simuladas se guardan en este dispositivo" />
      {orders.length === 0 ? (
        <EmptyState title="Todavía no hay pedidos" message="Cuando confirmes una compra simulada, aparecerá aquí." action="Volver al catálogo" onPress={() => navigate('catalog')} />
      ) : orders.map((order) => (
        <Pressable key={order.code} onPress={() => { setSelectedOrder(order); navigate('orderDetail'); }} style={styles.orderCard}>
          <View style={styles.orderCardTop}>
            <Text style={styles.orderCode}>{order.code}</Text>
            <Text style={styles.orderTotal}>{formatPrice(order.total)}</Text>
          </View>
          <Text style={styles.orderDate}>{new Date(order.date).toLocaleString('es-CO')}</Text>
          <Text style={styles.orderItems}>{order.items.length} referencias · Simulación sin cobro</Text>
          <Text style={styles.linkText}>Ver detalle ›</Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderOrderDetail = () => selectedOrder && (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Pressable onPress={() => navigate('history')} style={styles.backButton}>
        <Text style={styles.backArrow}>‹</Text><Text style={styles.backText}>Volver al historial</Text>
      </Pressable>
      <SectionTitle title="Detalle del pedido" subtitle={selectedOrder.code} />
      <View style={styles.formCard}>
        {selectedOrder.items.map((item) => (
          <View key={item.id} style={styles.orderLine}>
            <View style={styles.orderItemIcon}><Text style={styles.artIcon}>{item.icon}</Text></View>
            <View style={styles.orderLineInfo}>
              <Text style={styles.cartProductName}>{item.name}</Text>
              <Text style={styles.summaryLabel}>{item.quantity} × {formatPrice(item.price)}</Text>
            </View>
            <Text style={styles.summaryValue}>{formatPrice(item.quantity * item.price)}</Text>
          </View>
        ))}
        <View style={styles.divider} />
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Subtotal</Text><Text style={styles.summaryValue}>{formatPrice(selectedOrder.subtotal)}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Envío</Text><Text style={styles.summaryValue}>{selectedOrder.shipping ? formatPrice(selectedOrder.shipping) : 'Gratis'}</Text></View>
        {selectedOrder.discount > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Descuento</Text><Text style={styles.discountValue}>−{formatPrice(selectedOrder.discount)}</Text></View>}
        <View style={styles.summaryRow}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{formatPrice(selectedOrder.total)}</Text></View>
        <Text style={styles.secureCheckout}>Pedido simulado · No se realizó ningún cobro</Text>
      </View>
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
        <ActionButton label="Ver historial" onPress={() => navigate('history')} />
        <ActionButton label="Seguir explorando" onPress={() => navigate('catalog')} secondary compact />
      </View>
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
            <Pressable key={item} onPress={() => setSellerForm((current) => ({ ...current, category: item }))} style={[styles.categoryChip, sellerForm.category === item && styles.categoryChipActive]}>
              <Text style={[styles.categoryText, sellerForm.category === item && styles.categoryTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <View style={styles.numericRow}>
          <View style={styles.halfField}><Field label="Precio COP (entero)" value={sellerForm.price} onChangeText={(price) => setSellerForm((current) => ({ ...current, price }))} keyboardType="numeric" /></View>
          <View style={styles.halfField}><Field label="Stock" value={sellerForm.stock} onChangeText={(stock) => setSellerForm((current) => ({ ...current, stock }))} keyboardType="numeric" /></View>
        </View>
        <Field label="Descripción (mínimo 15 caracteres)" value={sellerForm.description} onChangeText={(description) => setSellerForm((current) => ({ ...current, description }))} multiline maxLength={240} />
        <ActionButton label={editingProductId ? 'Guardar cambios' : 'Crear producto'} onPress={saveSellerProduct} />
        {editingProductId && <ActionButton label="Cancelar edición" onPress={clearSellerForm} secondary compact />}
      </View>
      <SectionTitle title="Productos registrados" subtitle={`${products.length} productos`} />
      {products.map((product) => (
        <View key={product.id} style={styles.sellerRow}>
          <View style={styles.sellerProductInfo}>
            <Text style={styles.sellerProductId}>{product.id} · {product.category}</Text>
            <Text style={styles.cartProductName}>{product.name}</Text>
            <Text style={styles.summaryLabel}>{formatPrice(product.price)} · Stock: {product.stock}</Text>
          </View>
          <Pressable onPress={() => editProduct(product)} style={styles.editButton}><Text style={styles.editButtonText}>Editar</Text></Pressable>
        </View>
      ))}
    </ScrollView>
  );

  const navItems = [
    { key: 'catalog', label: 'Catálogo', icon: '⌂' },
    { key: 'favorites', label: 'Favoritos', icon: '♡' },
    { key: 'cart', label: `Carrito${cartCount ? ` (${cartCount})` : ''}`, icon: '⌑' },
    { key: 'history', label: 'Historial', icon: '↻' },
    { key: 'seller', label: 'Vendedor', icon: '▤' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.appShell}>
        <View style={styles.header}><BrandMark /><View style={styles.headerBadge}><Text style={styles.headerBadgeText}>JHOY</Text></View></View>
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
              {screen === 'favorites' && renderFavorites()}
              {screen === 'cart' && renderCart()}
              {screen === 'checkout' && renderCheckout()}
              {screen === 'history' && renderHistory()}
              {screen === 'orderDetail' && renderOrderDetail()}
              {screen === 'confirmation' && renderConfirmation()}
              {screen === 'seller' && renderSeller()}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  appShell: { flex: 1, backgroundColor: COLORS.background, maxWidth: 720, width: '100%', alignSelf: 'center' },
  header: { minHeight: 72, paddingHorizontal: 15, backgroundColor: COLORS.white, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: COLORS.line },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 },
  brandIcon: { height: 39, width: 39, borderRadius: 13, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
  brandIconText: { color: COLORS.white, fontSize: 10, fontWeight: '900', letterSpacing: -0.5 },
  brandCopy: { flexShrink: 1 },
  brandName: { color: COLORS.ink, fontSize: 15, fontWeight: '900', letterSpacing: 1.5 },
  brandTagline: { color: COLORS.muted, fontSize: 8, marginTop: 2 },
  headerBadge: { backgroundColor: COLORS.paleBlue, borderRadius: 9, paddingHorizontal: 9, paddingVertical: 6, marginLeft: 8 },
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
  categoryChip: { paddingHorizontal: 12, height: 32, borderRadius: 10, borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  categoryChipActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  categoryText: { color: '#657389', fontSize: 10, fontWeight: '600' },
  categoryTextActive: { color: COLORS.white, fontWeight: '700' },
  listHeading: { marginTop: 19, marginBottom: 10 },
  sortControls: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 },
  sortChip: { paddingHorizontal: 9, paddingVertical: 6, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8 },
  sortChipActive: { backgroundColor: COLORS.paleBlue, borderColor: '#C9D9F9' },
  sortText: { color: COLORS.muted, fontSize: 9 },
  sortTextActive: { color: COLORS.blue, fontWeight: '700' },
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
  compactButton: { minHeight: 32, borderRadius: 9, marginTop: 8 },
  disabledButton: { backgroundColor: '#E7EAF0', borderColor: '#E7EAF0' },
  disabledButtonText: { color: '#8E99A8' },
  trustNote: { color: COLORS.muted, fontSize: 9, textAlign: 'center', marginTop: 16, marginBottom: 4 },
  emptyState: { minHeight: 220, padding: 22, borderRadius: 17, backgroundColor: COLORS.white, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.line, marginTop: 8 },
  emptyStateIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: COLORS.paleBlue, alignItems: 'center', justifyContent: 'center' },
  emptyStateGlyph: { color: COLORS.blue, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  emptyStateTitle: { color: COLORS.ink, fontSize: 15, fontWeight: '800', marginTop: 13, textAlign: 'center' },
  emptyStateCopy: { color: COLORS.muted, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 6, maxWidth: 260 },
  backButton: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', marginBottom: 13 },
  backArrow: { color: COLORS.blue, fontSize: 26, lineHeight: 27, marginRight: 5 },
  backText: { color: COLORS.blue, fontSize: 11, fontWeight: '700' },
  detailCard: { backgroundColor: COLORS.white, borderRadius: 17, padding: 15, borderWidth: 1, borderColor: COLORS.line },
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
  emptySearch: { color: COLORS.muted, textAlign: 'center', paddingVertical: 25, fontSize: 12 },
  cartItem: { flexDirection: 'row', gap: 10, padding: 10, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  cartItemInfo: { flex: 1, justifyContent: 'center' },
  cartProductName: { color: COLORS.ink, fontSize: 11, lineHeight: 15, fontWeight: '700', marginTop: 4 },
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
  orderCard: { padding: 14, borderRadius: 15, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, marginBottom: 10 },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  orderCode: { color: COLORS.blue, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  orderTotal: { color: COLORS.ink, fontSize: 13, fontWeight: '900' },
  orderDate: { color: COLORS.muted, fontSize: 9, marginTop: 6 },
  orderItems: { color: COLORS.ink, fontSize: 10, marginTop: 8 },
  linkText: { color: COLORS.blue, fontSize: 10, fontWeight: '700', marginTop: 9 },
  orderLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 6 },
  orderItemIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.paleBlue, alignItems: 'center', justifyContent: 'center' },
  orderLineInfo: { flex: 1 },
  confirmationCard: { marginTop: 30, padding: 22, borderRadius: 19, backgroundColor: COLORS.white, alignItems: 'center', borderWidth: 1, borderColor: COLORS.line },
  confirmationCheck: { width: 61, height: 61, borderRadius: 22, backgroundColor: '#E5F5EC', alignItems: 'center', justifyContent: 'center' },
  confirmationCheckText: { color: COLORS.green, fontSize: 29, fontWeight: '800' },
  confirmationTitle: { color: COLORS.ink, fontSize: 20, fontWeight: '900', marginTop: 16 },
  confirmationCopy: { color: COLORS.muted, fontSize: 11, textAlign: 'center', marginTop: 6 },
  simulationNotice: { width: '100%', padding: 11, borderRadius: 10, backgroundColor: '#FFF5E5', marginTop: 15 },
  simulationText: { color: '#85601D', fontSize: 10, lineHeight: 15, textAlign: 'center' },
  numericRow: { flexDirection: 'row', gap: 9 },
  halfField: { flex: 1 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.line, borderRadius: 13, padding: 10, marginBottom: 8 },
  sellerProductInfo: { flex: 1 },
  sellerProductId: { color: COLORS.blue, fontSize: 8, fontWeight: '800', textTransform: 'uppercase' },
  editButton: { backgroundColor: COLORS.paleBlue, paddingHorizontal: 11, paddingVertical: 8, borderRadius: 8 },
  editButtonText: { color: COLORS.blue, fontSize: 9, fontWeight: '800' },
  bottomNav: { minHeight: 61, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 3 },
  navItem: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  navIcon: { color: '#96A1B0', fontSize: 19, lineHeight: 22 },
  navIconActive: { color: COLORS.blue },
  navLabel: { color: '#96A1B0', fontSize: 8, fontWeight: '600' },
  navLabelActive: { color: COLORS.blue, fontWeight: '800' },
});
