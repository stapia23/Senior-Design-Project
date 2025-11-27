import React, { useEffect, useState, useContext } from "react";
import { View, Text, FlatList, Image, TouchableOpacity, TextInput, Alert, ActivityIndicator, Platform, useWindowDimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getProducts } from "../services/api";
import { useCart } from "../context/CartContext";
import { UserContext } from "../context/UserContext";

export default function HomeScreen({ navigation }) {
  const { user, token } = useContext(UserContext);
  const { cart, addToCart, setCart } = useCart();

  const [products, setProducts] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("id");  // "id" or "price" or "newest"
  const [sortDir, setSortDir] = useState("asc"); // "asc" or "desc"
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { width } = useWindowDimensions();
  const numColumns = 4;
  const cardMargin = 5;
  const cardWidth = (width - cardMargin * 3) / numColumns;

  const categories = [
    "Clothing",
    "Electronics",
    "Shoes",
    "Watches",
    "Jewellery",
    "Beauty",
  ];

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

  // Fetch products whenever filters/sort/search change
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts(
          token,
          search,                        // search keyword
          selectedCategory || "",        // category
          sortBy,                        // sort field
          sortDir,                       // sort direction
          minPrice,                      // min price
          maxPrice,                      // max price
          inStockOnly ? "true" : ""      // inStock filter
        );

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
  }, [token, search, selectedCategory, sortBy, sortDir, minPrice, maxPrice, inStockOnly]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Let browser body manage scroll on web
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

  const handleClearFilters = () => {
    setSearch("");
    setSearchInput("");
    setSelectedCategory("");
    setSortBy("id");
    setSortDir("asc");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
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
          data={products}
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
                  value={searchInput}
                  onChangeText={setSearchInput}
                  style={{ flex: 1, padding: 10 }}
                />
                <TouchableOpacity
                  style={{ padding: 10 }}
                  onPress={() => setSearch(searchInput.trim())}
                >
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
                      setSelectedCategory(
                        selectedCategory === cat ? "" : cat
                      )
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

              {/* FILTERS ROW: PRICE + IN STOCK */}
              <View
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                {/* Price range */}
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={{ marginRight: 4 }}>Price:</Text>
                  <TextInput
                    placeholder="Min"
                    value={minPriceInput}
                    onChangeText={setMinPriceInput}
                    keyboardType="numeric"
                    onSubmitEditing={() => setMinPrice(minPriceInput)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                      width: 60,
                      marginRight: 4,
                    }}
                  />
                  <Text> - </Text>
                  <TextInput
                    placeholder="Max"
                    value={maxPriceInput}
                    onChangeText={setMaxPriceInput}
                    keyboardType="numeric"
                    onSubmitEditing={() => setMaxPrice(maxPriceInput)}
                    style={{
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderRadius: 6,
                      paddingHorizontal: 6,
                      paddingVertical: 4,
                      width: 60,
                      marginLeft: 4,
                    }}
                  />
                </View>

                {/* In-stock toggle */}
                <TouchableOpacity
                  onPress={() => setInStockOnly((prev) => !prev)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: inStockOnly ? "#28a745" : "#ccc",
                    backgroundColor: inStockOnly ? "#d4edda" : "#f8f9fa",
                    marginTop: 6,
                  }}
                >
                  <Text
                    style={{
                      color: inStockOnly ? "#155724" : "#333",
                      fontSize: 13,
                    }}
                  >
                    {inStockOnly ? "In Stock Only ✓" : "In Stock Only"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* SORT ROW */}
              <View
                style={{
                  backgroundColor: "#fff",
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  flexDirection: "row",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ fontWeight: "600", marginRight: 8 }}>Sort:</Text>

                <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                  <TouchableOpacity
                    onPress={() => {
                      setSortBy("newest");
                      setSortDir("asc");
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 6,
                      marginBottom: 4,
                      backgroundColor:
                        sortBy === "newest" ? "#007bff" : "#f2f2f2",
                    }}
                  >
                    <Text
                      style={{
                        color: sortBy === "newest" ? "#fff" : "#000",
                        fontSize: 13,
                      }}
                    >
                      Newest
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSortBy("price");
                      setSortDir("asc");
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 6,
                      marginBottom: 4,
                      backgroundColor:
                        sortBy === "price" && sortDir === "asc"
                          ? "#007bff"
                          : "#f2f2f2",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          sortBy === "price" && sortDir === "asc"
                            ? "#fff"
                            : "#000",
                        fontSize: 13,
                      }}
                    >
                      Price Low-High
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setSortBy("price");
                      setSortDir("desc");
                    }}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 16,
                      marginRight: 6,
                      marginBottom: 4,
                      backgroundColor:
                        sortBy === "price" && sortDir === "desc"
                          ? "#007bff"
                          : "#f2f2f2",
                    }}
                  >
                    <Text
                      style={{
                        color:
                          sortBy === "price" && sortDir === "desc"
                            ? "#fff"
                            : "#000",
                        fontSize: 13,
                      }}
                    >
                      Price High-Low
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Clear filters */}
                <TouchableOpacity
                  onPress={handleClearFilters}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 16,
                    backgroundColor: "#e9ecef",
                    marginTop: 4,
                  }}
                >
                  <Text style={{ fontSize: 13 }}>Clear Filters</Text>
                </TouchableOpacity>
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
                  : "Products"}
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
