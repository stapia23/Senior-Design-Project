import React, { useContext } from "react";
import { View, Text, FlatList, Button, TextInput, Alert, Image, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { API_URL } from "../services/api";

const confirmDialog = async (title, message, buttons) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      const okBtn = buttons?.find(b => b.text?.toLowerCase() === "login" || b.text?.toLowerCase() === "ok");
      okBtn?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user, token, refreshUserProfile } = useContext(UserContext);

  const handleCheckout = async () => {
    try {
      if (!token) {
        confirmDialog("Login Required", "Please log in to checkout.", [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login") },
        ]);
        return;
      }

      await refreshUserProfile(token);

      if (!user) {
        Alert.alert("Session Expired", "Please log in again.");
        navigation.navigate("Login");
        return;
      }

      if (cart.length === 0) {
        Alert.alert("Cart Empty", "Add items to your cart first.");
        return;
      }

      const body = {
        items: cart.map(item => ({
          productId: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      };

      console.log("Checkout → API URL:", `${API_URL}/api/payments/create-checkout-session`);
      console.log("Sending token:", token);

      const res = await fetch(`${API_URL}/api/payments/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const url = data.url;

      if (!url) throw new Error("Stripe did not return a checkout URL");

      // WEB → Redirect
      if (Platform.OS === "web") {
        window.location.href = url;
        return;
      }

      // MOBILE → Show popup with URL
      Alert.alert("Stripe Checkout", "Open this link to complete payment:\n\n" + url);

    } catch (err) {
      console.error("Checkout error:", err);
      Alert.alert("Checkout Error", err.message || "Something went wrong.");
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Cart</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeBtnText}>Home</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>
        Your Cart
      </Text>

      {cart.length === 0 ? (
        <Text>No items in cart.</Text>
      ) : (
        <>
          <FlatList
            data={cart}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{
                      width: 60,
                      height: 60,
                      marginRight: 10,
                      borderRadius: 5,
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 60,
                      height: 60,
                      backgroundColor: "#eee",
                      marginRight: 10,
                      justifyContent: "center",
                      alignItems: "center",
                      borderRadius: 5,
                    }}
                  >
                    <Text style={{ color: "#777", fontSize: 10 }}>No Image</Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>{item.name}</Text>
                  <Text>Price: ${item.price}</Text>
                  <Text>Quantity:</Text>

                  <TextInput
                    value={item.quantity.toString()}
                    onChangeText={(val) =>
                      updateQuantity(item.id, parseInt(val) || 1)
                    }
                    keyboardType="numeric"
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 5,
                      paddingHorizontal: 5,
                      width: 50,
                      marginBottom: 5,
                    }}
                  />

                  <Button title="Remove" onPress={() => removeFromCart(item.id)} />
                </View>
              </View>
            )}
          />

          <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 10 }}>
            Total: ${total.toFixed(2)}
          </Text>

          <View style={{ marginTop: 15 }}>
            <Button
              title="Proceed to Checkout"
              onPress={handleCheckout}
              disabled={!user || !token}
            />
            <View style={{ marginVertical: 5 }} />
            <Button title="Clear Cart" onPress={clearCart} color="red" />
          </View>
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  topBar: {
    backgroundColor: "#0d6efd",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topBarTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },

  homeBtn: {
    backgroundColor: "#198754",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },

  homeBtnText: {
    color: "#fff",
    fontWeight: "600",
  },
});