import React, { useEffect, useState, useContext } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";
import { addToWishlist, getReviews, addReview, deleteReview } from "../services/api";

const confirmDialog = async (title, message) => {
  if (Platform.OS === "web") {
    return window.confirm(`${title}\n\n${message}`);
  } else {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "Delete", style: "destructive", onPress: () => resolve(true) },
      ]);
    });
  }
};

export default function ProductDetailsScreen({ route, navigation }) {
  const { product } = route.params;
  const { addToCart } = useCart();
  const { user } = useContext(UserContext);

  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  if (!product) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Product not found.</Text>
      </View>
    );
  }

  // Load reviews
  const loadReviews = async () => {
    try {
      setLoadingReviews(true);
      const data = await getReviews(product.id);
      setReviews(data);
    } catch (err) {
      console.log("Failed to load reviews:", err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Wishlist
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

  // Submit review
  const handleSubmitReview = async () => {
    try {
      const t = await AsyncStorage.getItem("token");
      if (!t) {
        Alert.alert("Login Required", "Please login to leave a review.");
        return;
      }

      if (!rating || !comment.trim()) {
        Alert.alert("Error", "Please enter a rating and comment.");
        return;
      }

      setSubmitting(true);
      await addReview(product.id, parseInt(rating), comment.trim(), t);

      Alert.alert("Success", "Review added!");
      setComment("");
      setRating("5");
      loadReviews();
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      const t = await AsyncStorage.getItem("token");
      if (!t) {
        Alert.alert("Unauthorized", "Admin login required.");
        return;
      }
      await deleteReview(reviewId, t);
      await loadReviews();
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // Confirm delete
  const confirmDeleteReview = async (reviewId) => {
    const confirmed = await confirmDialog(
      "Delete Review",
      "Are you sure you want to delete this review?"
    );

    if (confirmed) {
      handleDeleteReview(reviewId);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }}>
      <Image
        source={{ uri: product.imageUrl || "https://via.placeholder.com/400" }}
        style={{ width: "100%", height: 300 }}
        resizeMode="contain"
      />

      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: "bold" }}>{product.name}</Text>

        {/* ✅ Average Rating Display */}
        {averageRating && (
          <Text style={{ fontSize: 16, color: "#ffaa00", marginTop: 4 }}>
            ⭐ {averageRating} / 5 ({reviews.length} reviews)
          </Text>
        )}

        <Text style={{ fontSize: 18, color: "#007bff", marginVertical: 10 }}>
          ${product.price}
        </Text>

        <Text style={{ color: "#333", marginBottom: 20 }}>
          {product.description || "No description available."}
        </Text>

        {/* Add to Cart */}
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

        {/* Wishlist */}
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

        {/* Reviews */}
        <Text style={{ fontSize: 20, fontWeight: "bold", marginTop: 20, marginBottom: 10 }}>
          Reviews
        </Text>

        {loadingReviews ? (
          <ActivityIndicator size="large" />
        ) : reviews.length === 0 ? (
          <Text>No reviews yet.</Text>
        ) : (
          reviews.map((rev) => (
            <View
              key={rev.id}
              style={{
                borderWidth: 1,
                borderColor: "#ddd",
                padding: 10,
                borderRadius: 8,
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                ⭐ {rev.rating} / 5
              </Text>

              <Text>{rev.comment}</Text>

              <Text style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
                {rev.createdAt
                  ? new Date(rev.createdAt).toLocaleString()
                  : "Unknown date"}
              </Text>

              {user?.role === "ADMIN" && (
                <TouchableOpacity
                  onPress={() => confirmDeleteReview(rev.id)}
                  style={{
                    marginTop: 8,
                    backgroundColor: "#dc3545",
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 6,
                    alignSelf: "flex-start",
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>Delete Review</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        {/* Add Review Form */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginTop: 20, marginBottom: 8 }}>
          Write a Review
        </Text>

        <Text>Rating (1–5)</Text>
        <TextInput
          value={rating}
          keyboardType="numeric"
          onChangeText={setRating}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            borderRadius: 6,
            marginBottom: 10,
          }}
        />

        <Text>Your Review</Text>
        <TextInput
          value={comment}
          onChangeText={setComment}
          multiline
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 8,
            borderRadius: 6,
            height: 80,
            marginBottom: 10,
          }}
        />

        <TouchableOpacity
          style={{
            backgroundColor: "#198754",
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: "center",
            marginBottom: 30,
            opacity: submitting ? 0.6 : 1,
          }}
          onPress={handleSubmitReview}
          disabled={submitting}
        >
          <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
            {submitting ? "Submitting..." : "Submit Review"}
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
          <Text style={{ color: "#333", fontSize: 16 }}>Back to Products</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}