import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

  const safeJSON = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  // Load cart from storage on startup
  useEffect(() => {
    const loadCart = async () => {
      try {
        const storedMobile = await AsyncStorage.getItem("cart");
        const storedWeb =
          typeof window !== "undefined" ? localStorage.getItem("cart") : null;

        const raw = storedMobile || storedWeb;
        const parsed = safeJSON(raw);

        if (parsed && Array.isArray(parsed)) {
          setCart(parsed);
        }
      } catch (err) {
        console.log("Failed to load cart:", err);
      }
    };

    loadCart();
  }, []);

  // Persist cart to both storages
  const persistCart = async (updatedCart) => {
    setCart(updatedCart);

    const json = JSON.stringify(updatedCart);

    try {
      await AsyncStorage.setItem("cart", json);

      if (typeof window !== "undefined") {
        localStorage.setItem("cart", json);
      }
    } catch (err) {
      console.log("Failed to save cart:", err);
    }
  };

  // Add item or increase quantity
  const addToCart = (item) => {
    const existing = cart.find((i) => i.id === item.id);

    const updated = existing
      ? cart.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...cart, { ...item, quantity: 1 }];

    persistCart(updated);
  };

  // Remove item
  const removeFromCart = (id) => {
    persistCart(cart.filter((i) => i.id !== id));
  };

  // Update quantity
  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) return; // Prevent zero/negative quantities

    persistCart(
      cart.map((i) =>
        i.id === id ? { ...i, quantity: Number(quantity) } : i
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    persistCart([]);

    if (typeof window !== "undefined") {
      localStorage.removeItem("cart");
    }
  };

  //  total
  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        total,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        setCart: persistCart, // preserves storage sync
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);