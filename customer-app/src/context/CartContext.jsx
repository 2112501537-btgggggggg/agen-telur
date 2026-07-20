import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) =>
          i.productVariantId === newItem.productVariantId &&
          i.unit === newItem.unit
      );
      if (idx >= 0) {
        // Combine quantity
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          quantity: updated[idx].quantity + newItem.quantity,
        };
        return updated;
      }
      return [...prev, newItem];
    });
  }, []);

  const removeItem = useCallback((productVariantId, unit) => {
    setItems((prev) =>
      prev.filter(
        (i) => !(i.productVariantId === productVariantId && i.unit === unit)
      )
    );
  }, []);

  const updateQuantity = useCallback((productVariantId, unit, newQuantity) => {
    if (newQuantity <= 0) {
      setItems((prev) =>
        prev.filter(
          (i) => !(i.productVariantId === productVariantId && i.unit === unit)
        )
      );
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productVariantId === productVariantId && i.unit === unit
          ? { ...i, quantity: newQuantity }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItemsCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
