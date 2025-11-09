import React, { useEffect, useState, useContext } from "react";
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Image } from "react-native";
import { UserContext } from "../context/UserContext";
import { API_URL } from "../services/api";

export default function OrderDetailsScreen({ route }) {
  const { token } = useContext(UserContext);
  const { orderId } = route.params;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to load order details");

      setOrder(await res.json());
    } catch (err) {
      console.log("Error loading order:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /><Text>Loading…</Text></View>;
  }

  if (!order) {
    return <View style={styles.center}><Text>Order not found.</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Order #{order.id}</Text>
      <Text>Status: {order.status}</Text>
      <Text>Date: {new Date(order.createdAt).toLocaleString()}</Text>
      <Text>Total: ${order.totalPrice.toFixed(2)}</Text>

      <Text style={styles.subTitle}>Items:</Text>

      {order.orderItems.map((item) => (
        <View key={item.id} style={styles.itemBox}>
          {item.product?.imageUrl && (
            <Image source={{ uri: item.product.imageUrl }} style={styles.image} />
          )}

          <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.product?.name}</Text>
            <Text>Qty: {item.quantity}</Text>
            <Text>Price: ${item.price.toFixed(2)}</Text>
            <Text>Subtotal: ${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10 },
  subTitle: { marginTop: 20, fontSize: 18, fontWeight: "600" },
  itemBox: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#f8f9fa",
    gap: 10,
  },
  itemName: { fontWeight: "bold", fontSize: 16 },
  image: { width: 70, height: 70, borderRadius: 6, backgroundColor: "#eee" },
});
