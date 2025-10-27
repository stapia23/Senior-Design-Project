import React, { useContext } from "react"; 
import { View, Text, FlatList, Button, TextInput, Alert, Image, Platform } from "react-native";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

const confirmDialog = async (title, message, buttons) => {
  if (Platform.OS === "web") {
    if (window.confirm(`${title}\n\n${message}`)) {
      const confirmAction = buttons?.find((b) => b.text?.toLowerCase() === "login" || b.text?.toLowerCase() === "ok");
      confirmAction?.onPress?.();
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function CartScreen({ navigation }) {
  const { cart, removeFromCart, updateQuantity, total, clearCart } = useCart();
  const { user, token } = useContext(UserContext);

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert("Cart is empty", "Please add items before checking out.");
      return;
    }

    if (!user || !token) {
      confirmDialog(
        "Login Required",
        "You need to log in or create an account to proceed with checkout.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Login", onPress: () => navigation.navigate("Login", { redirect: "Cart" }) },
        ]
      );
      return;
    }

    confirmDialog(
      "Checkout",
      `Total: $${total.toFixed(2)}\nProceed with checkout? (Feature coming soon)`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "OK", onPress: () => console.log("Checkout confirmed") },
      ]
    );
  };

  return (
    <View style={{ flex: 1, padding: 10 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 10 }}>Your Cart</Text>

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
                    style={{ width: 60, height: 60, marginRight: 10, borderRadius: 5 }}
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
                    onChangeText={(val) => updateQuantity(item.id, parseInt(val) || 1)}
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
            {user && token ? (
              <Button title="Proceed to Checkout" onPress={handleCheckout} />
            ) : (
              <Button
                title="Login to Checkout"
                color="#007BFF"
                onPress={() => navigation.navigate("Login", { redirect: "Cart" })}
              />
            )}
            <View style={{ marginVertical: 5 }} />
            <Button title="Clear Cart" onPress={clearCart} color="red" />
          </View>
        </>
      )}
    </View>
  );
}
