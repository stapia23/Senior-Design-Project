import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { addToWishlist } from "../services/api";

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  const handleAddToWishlist = async () => {
    try {
      const t = await AsyncStorage.getItem("token");
      if (!t) {
        Alert.alert("Login Required", "Please login to add items to your wishlist.");
        return;
      }

      await addToWishlist(product.id, t);
      Alert.alert("Wishlist", `${product.name} added to your wishlist!`);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Image
        source={{
          uri: product.imageUrl || "https://via.placeholder.com/400",
        }}
        style={{ width: "100%", height: 300 }}
        resizeMode="contain"
      />

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>{product.name}</Text>

        <Text style={{ fontSize: 18, color: "#007bff", marginVertical: 10 }}>
          ${product.price}
        </Text>

        <Text style={{ color: "#333", marginBottom: 20 }}>
          {product.description || "No description available."}
        </Text>

        <TouchableOpacity
          style={{
            backgroundColor: "#007bff",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 15,
          }}
          onPress={() => {
            addToCart(product);
            Alert.alert("Added to Cart", `${product.name} was added to your cart.`);
          }}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Add to Cart
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#ff0051",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 15,
          }}
          onPress={handleAddToWishlist}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            Add to Wishlist
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            backgroundColor: "#ccc",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: "#333", fontSize: 16 }}>
            Back to Products
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}