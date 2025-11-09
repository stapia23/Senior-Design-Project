import React, { useContext, useState, useEffect } from "react";
import { View, Text, Button, TextInput, Alert, TouchableOpacity, ActivityIndicator, ScrollView, StyleSheet, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../context/UserContext";
import { API_URL, deleteMyAccount, getWishlist, removeFromWishlist } from "../services/api";
import { useCart } from "../context/CartContext";

export default function AccountScreen({ navigation }) {
  const { user, token, setUser, logout, refreshUserProfile } =
    useContext(UserContext);

  const [activeTab, setActiveTab] = useState("account");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(false);

  const { addToCart } = useCart();

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      setLoadingWishlist(true);
      const t = await AsyncStorage.getItem("token");
      const data = await getWishlist(t);
      setWishlist(Array.isArray(data) ? data : []);
    } catch (err) {
      console.log("Wishlist load error:", err);
    } finally {
      setLoadingWishlist(false);
    }
  };

  useEffect(() => {
    if (activeTab === "account") loadProfile();
    if (activeTab === "orders") fetchOrders();
    if (activeTab === "wishlist") loadWishlist();
  }, [activeTab]);

  // Profile load
  const loadProfile = async () => {
    try {
      setLoading(true);
      await refreshUserProfile();
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
      }
    } catch {
      Alert.alert("Error", "Could not load your profile.");
    } finally {
      setLoading(false);
    }
  };

  // Orders load
  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await fetch(`${API_URL}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setOrders(await res.json());
    } catch {
      Alert.alert("Error", "Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleUpdate = async () => {
    if (!name || !email) {
      return Alert.alert(
        "Validation Error",
        "Name and email cannot be empty."
      );
    }

    try {
      setLoading(true);

      const body = {
        id: user.id,
        name,
        email,
        password: password || null,
        role: user.role,
      };

      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const updated = await res.json();
      setUser(updated);
      await AsyncStorage.setItem("user", JSON.stringify(updated));
      setPassword("");

      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert("Delete Account", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            await deleteMyAccount(token);
            await AsyncStorage.multiRemove(["user", "token"]);
            await logout();
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  const handleLogout = async () => {
    await logout();
    await AsyncStorage.multiRemove(["user", "token"]);
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  // Remove wishlist item
  const handleRemoveWishlist = async (productId) => {
    try {
      await removeFromWishlist(productId, token);
      loadWishlist();
    } catch (err) {
      Alert.alert("Error", "Failed to remove item.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>My Account</Text>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.homeBtnText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "account" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("account")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "account" && styles.tabTextActive,
            ]}
          >
            Manage Account
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "orders" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("orders")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "orders" && styles.tabTextActive,
            ]}
          >
            View Orders
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabBtn,
            activeTab === "wishlist" && styles.tabBtnActive,
          ]}
          onPress={() => setActiveTab("wishlist")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "wishlist" && styles.tabTextActive,
            ]}
          >
            Wishlist
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* ACCOUNT TAB */}
        {activeTab === "account" ? (
          <>
            <Text style={{ fontWeight: "bold" }}>Name:</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={styles.input}
            />

            <Text style={{ fontWeight: "bold" }}>Email:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Text style={{ fontWeight: "bold" }}>Password:</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={true}
              placeholder="Enter new password"
              style={styles.input}
            />

            <Button title="Update Profile" onPress={handleUpdate} />
            <View style={{ height: 10 }} />
            <Button
              title="Delete Account"
              onPress={handleDeleteAccount}
              color="red"
            />
          </>
        ) : null}

        {/* ORDERS TAB */}
        {activeTab === "orders" ? (
          <>
            <Text
              style={{
                fontWeight: "bold",
                fontSize: 18,
                marginBottom: 10,
              }}
            >
              My Orders
            </Text>

            {loadingOrders ? (
              <ActivityIndicator size="large" />
            ) : orders.length === 0 ? (
              <Text>No orders found.</Text>
            ) : (
              orders.map((o) => (
                <TouchableOpacity
                  key={o.id}
                  style={styles.orderBox}
                  onPress={() =>
                    navigation.navigate("OrderDetails", {
                      orderId: o.id,
                    })
                  }
                >
                  <Text style={styles.orderTitle}>Order #{o.id}</Text>
                  <Text>Status: {o.status}</Text>
                  <Text>Total: ${o.totalPrice?.toFixed(2)}</Text>
                  <Text>
                    Date: {new Date(o.createdAt).toLocaleString()}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </>
        ) : null}

        {/* NEW WISHLIST TAB */}
        {activeTab === "wishlist" ? (
          <>
            <Text style={styles.sectionTitle}>My Wishlist</Text>

            {loadingWishlist ? (
              <ActivityIndicator size="large" />
            ) : wishlist.length === 0 ? (
              <Text>No items in wishlist.</Text>
            ) : (
              wishlist.map((item) => (
                <View key={item.id} style={styles.wishlistItem}>
                  {item.imageUrl && (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.wishlistImage}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.wishlistTitle}>{item.name}</Text>
                    <Text style={styles.wishlistPrice}>${item.price}</Text>
                  </View>

                  {/* Add to Cart button */}
                  <TouchableOpacity
                    style={styles.cartBtn}
                    onPress={() => {
                      addToCart(item);
                      Alert.alert("Added to Cart", `${item.name} was added to your cart.`);
                    }}
                  >
                    <Text style={styles.cartBtnText}>Add to Cart</Text>
                  </TouchableOpacity>

                  {/* Remove button */}
                  <TouchableOpacity onPress={() => handleRemoveWishlist(item.id)}>
                    <Text style={styles.removeBtn}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
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
  tabsRow: {
    flexDirection: "row",
    backgroundColor: "#e9ecef",
    padding: 6,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  tabBtnActive: {
    backgroundColor: "#fff",
    borderColor: "#0d6efd",
  },
  tabText: { color: "#495057", fontWeight: "600" },
  tabTextActive: { color: "#0d6efd" },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },

  orderBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  orderTitle: { fontWeight: "bold", color: "#333" },

  wishlistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  wishlistImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    marginRight: 10,
  },
  wishlistTitle: { fontWeight: "bold", fontSize: 16 },
  wishlistPrice: { color: "#0d6efd", marginTop: 4 },
  removeBtn: {
    color: "red",
    fontWeight: "600",
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

  logoutBtn: {
    backgroundColor: "#d9534f",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
  },

  logoutBtnText: {
    color: "#fff",
    fontWeight: "600",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  cartBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 8,
  },
  cartBtnText: {
    color: "#0015fbff",
    fontWeight: "600",
  },
});