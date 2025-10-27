import React, { useEffect, useState, useContext } from "react";
import {View,Text,FlatList,Image,TouchableOpacity,TextInput,Alert,ActivityIndicator,Platform,useWindowDimensions} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProducts, getProductsByCategory } from "../services/api";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

export default function HomeScreen({ navigation }) {
  const { user, token } = useContext(UserContext);
  const { cart, addToCart, setCart } = useCart();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { width } = useWindowDimensions();
  const numColumns = 4;
  const cardMargin = 10;
  const cardWidth = (width - cardMargin * 3) / numColumns;

  const categories = ["Clothing","Electronics","Shoes","Watches","Jewellery","Beauty"];

  // Load cart on mount
  useEffect(() => {
    (async () => {
      try {
        const savedCart = await AsyncStorage.getItem("cart");
        if (savedCart) setCart(JSON.parse(savedCart));
      } catch (err) {
        console.warn("Cart load error:", err);
      }
    })();
  }, []);

  // Save cart when changed
  useEffect(() => {
    AsyncStorage.setItem("cart", JSON.stringify(cart)).catch(() =>
      console.warn("Cart save error")
    );
  }, [cart]);

  // Fetch products
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        setError("");
        const data = selectedCategory
          ? await getProductsByCategory(selectedCategory, token)
          : await getProducts(token);
        const list = Array.isArray(data)
          ? data
          : data?.content
          ? data.content
          : [];
        setProducts(list);
      } catch (err) {
        console.error("Product fetch error:", err);
        setError("Failed to load products. Please try again.");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsData();
  }, [selectedCategory, token]);

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Let browser body manage scroll
  const containerStyle = {
    flex: 1,
    backgroundColor: "#f6f6f6",
    ...(Platform.OS === "web"
      ? {
          minHeight: "100vh",
          height: "auto",
          overflow: "visible",
          display: "block",
        }
      : {}),
  };

  return (
    <View style={containerStyle}>
      {/* HEADER */}
      <View
        style={{
          backgroundColor: "#007bff",
          paddingVertical: 12,
          paddingHorizontal: 15,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
          E-Commerce Store
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            onPress={() => navigation.navigate(user ? "Account" : "Login")}
          >
            <Text style={{ color: "#fff", marginHorizontal: 10 }}>
              {user ? "My Account" : "Login"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("Cart")}>
            <Text style={{ color: "#fff", marginHorizontal: 10 }}>
              🛒 Cart ({cartCount})
            </Text>
          </TouchableOpacity>
          {user?.role === "ADMIN" && (
            <TouchableOpacity
              onPress={() => navigation.navigate("AdminDashboard")}
            >
              <Text style={{ color: "#fff", marginHorizontal: 10 }}>
                Dashboard
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MAIN CONTENT */}
      {loading ? (
        <View style={{ alignItems: "center", padding: 20 }}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={{ alignItems: "center", padding: 20 }}>
          <Text style={{ color: "red" }}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          contentContainerStyle={{
            paddingBottom: 80,
            backgroundColor: "#f6f6f6",
          }}
          ListHeaderComponent={
            <>
              {/* SEARCH BAR */}
              <View
                style={{
                  backgroundColor: "#fff",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 10,
                  marginVertical: 8,
                }}
              >
                <TextInput
                  placeholder="Search products..."
                  value={search}
                  onChangeText={setSearch}
                  style={{ flex: 1, padding: 10 }}
                />
                <TouchableOpacity style={{ padding: 10 }}>
                  <Text style={{ color: "#007bff", fontWeight: "bold" }}>
                    Search
                  </Text>
                </TouchableOpacity>
              </View>

              {/* CATEGORY BAR */}
              <View
                style={{
                  backgroundColor: "#fff",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  paddingVertical: 10,
                }}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() =>
                      setSelectedCategory(selectedCategory === cat ? null : cat)
                    }
                    style={{
                      backgroundColor:
                        selectedCategory === cat ? "#007bff" : "#f2f2f2",
                      paddingHorizontal: 15,
                      paddingVertical: 8,
                      borderRadius: 20,
                      margin: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 13,
                        color: selectedCategory === cat ? "#fff" : "#000",
                      }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginVertical: 8,
                  paddingHorizontal: 10,
                }}
              >
                {selectedCategory
                  ? `${selectedCategory} Products`
                  : "New Products"}
              </Text>
            </>
          }
          renderItem={({ item }) => (
            <View
              style={{
                width: cardWidth,
                backgroundColor: "#fff",
                borderRadius: 8,
                margin: cardMargin,
                padding: 10,
                ...(Platform.OS === "web"
                  ? { boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }
                  : { elevation: 2 }),
              }}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{
                    width: "100%",
                    height: 150,
                    borderRadius: 8,
                    marginBottom: 10,
                  }}
                  resizeMode="contain"
                />
              ) : (
                <View
                  style={{
                    width: "100%",
                    height: 150,
                    borderRadius: 8,
                    backgroundColor: "#eee",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#777" }}>No Image</Text>
                </View>
              )}

              <Text style={{ fontWeight: "bold", fontSize: 14 }} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={{ color: "#007bff", marginVertical: 4 }}>
                ${item.price}
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: "#28a745",
                  paddingVertical: 6,
                  borderRadius: 5,
                  alignItems: "center",
                  marginBottom: 6,
                }}
                onPress={() =>
                  navigation.navigate("ProductDetails", { product: item })
                }
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  View Details
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  backgroundColor: "#007bff",
                  paddingVertical: 6,
                  borderRadius: 5,
                  alignItems: "center",
                }}
                onPress={() => {
                  addToCart(item);
                  Alert.alert("Added to Cart", `${item.name} added to your cart`);
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>
                  Add to Cart
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}
