import React, { useEffect, useContext, useState } from "react";
import { View, Text, Button, ActivityIndicator, Platform } from "react-native";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { API_URL } from "../services/api";

export default function CheckoutSuccessScreen({ navigation }) {
  const { clearCart } = useCart();
  const { token, setToken, refreshUserProfile } = useContext(UserContext);

  const [loading, setLoading] = useState(true);
  const [orderSaved, setOrderSaved] = useState(false);

  // Get session ID only on web
  const sessionId =
    Platform.OS === "web"
      ? new URLSearchParams(window.location.search).get("session_id")
      : null;

  // Load cart stored during Stripe redirect
  const loadCartForOrder = async () => {
    try {
      const stored =
        typeof window !== "undefined"
          ? window.localStorage.getItem("cart")
          : null;

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // JWT available after redirect
  const ensureToken = async () => {
    if (token) return token;

    const stored =
      typeof window !== "undefined"
        ? window.localStorage.getItem("token")
        : null;

    if (stored) {
      setToken(stored);              // update context
      await refreshUserProfile(stored);  // load profile
      return stored;                 // use stored token directly
    }
    return null;
  };

  const saveOrderToBackend = async () => {
    try {
      const jwt = await ensureToken();

      if (!jwt) {
        console.warn("No JWT available — user not logged in.");
        setLoading(false);
        return;
      }

      const cartItems = await loadCartForOrder();

      if (!cartItems.length) {
        console.warn("No cart items found.");
        setLoading(false);
        return;
      }

      const body = cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

      const res = await fetch(`${API_URL}/api/orders/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        console.error("Order creation failed:", await res.text());
        throw new Error("Order creation failed.");
      }

      setOrderSaved(true);
      clearCart();

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("cart");
      }

    } catch (err) {
      console.error("Order save error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    saveOrderToBackend();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Processing your order...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Payment Successful!
      </Text>

      {sessionId && (
        <Text style={{ marginBottom: 10, color: "#555" }}>
          Stripe Session ID: {sessionId}
        </Text>
      )}

      <Text style={{ fontSize: 16, marginBottom: 20 }}>
        {orderSaved
          ? "Your order has been created and saved!"
          : "Payment confirmed, but the order was not saved."}
      </Text>

      <Button
        title="View My Orders"
        onPress={() => navigation.navigate("Account", { tab: "orders" })}
      />

      <View style={{ marginTop: 10 }} />

      <Button title="Go Home" onPress={() => navigation.navigate("Home")} />
    </View>
  );
}