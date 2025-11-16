import React, { useEffect, useState, useContext } from "react";
import { View, Text, Button, TextInput, Alert, ScrollView, Image, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAdmins, createAdmin, createProduct, getProducts, deleteProduct, deleteAdmin, uploadImage } from "../services/api";
import { UserContext } from "../context/UserContext";

const API_URL = "http://localhost:8080";

const confirmDialog = async (title, message) => {
  if (Platform.OS === "web") {
    return window.confirm(`${title}\n\n${message}`);
  } else {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: "OK", onPress: () => resolve(true) },
      ]);
    });
  }
};

export default function AdminDashboard({ navigation }) {
  const { setUser, setToken: setGlobalToken } = useContext(UserContext);

  const [activeTab, setActiveTab] = useState("products");
  const [token, setToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 1 });

  const [newProduct, setNewProduct] = useState({
    id: null,
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    category: "",
  });

  const [newAdmin, setNewAdmin] = useState({
    id: null,
    name: "",
    email: "",
    password: "",
  });

  // INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      const t = await AsyncStorage.getItem("token");
      if (!t) return navigation.replace("Login");
      setToken(t);
      await Promise.all([fetchProducts(t), fetchAdmins(t)]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (activeTab === "orders" && token) fetchOrders(token);
  }, [activeTab]);

  // FETCH DATA
  const fetchProducts = async (jwt) => {
    try {
      const data = await getProducts(jwt, null, 0, 1000);
      if (Array.isArray(data)) setProducts(data);
      else if (data.content) setProducts(data.content);
      else setProducts([]);
      setPageInfo({ page: 0, totalPages: 1 });
    } catch (e) {
      console.log("Fetch products error:", e);
    }
  };

  const fetchAdmins = async (jwt) => {
    try {
      const data = await getAdmins(jwt);
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Fetch admins error:", e);
    }
  };

  const fetchOrders = async (jwt) => {
    try {
      setLoadingOrders(true);
      const res = await fetch(`${API_URL}/api/orders/admin/all`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      Alert.alert("Error", "Failed to load orders.");
    } finally {
      setLoadingOrders(false);
    }
  };

  // IMAGE PICKER
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return Alert.alert("Permission required", "Allow photo access to continue.");

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) uploadPickedImage(result.assets[0].uri);
  };

  const uploadPickedImage = async (uri) => {
    try {
      setUploading(true);
      const filename = uri.split("/").pop();
      const type = `image/${(filename || "").split(".").pop()}`;
      const formData = new FormData();
      formData.append("file", { uri, name: filename, type });
      const imageUrl = await uploadImage(formData, token);
      setNewProduct((p) => ({ ...p, image: imageUrl }));
    } catch (err) {
      Alert.alert("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  };

  // PRODUCTS
  const handleAddOrEditProduct = async () => {
    if (!newProduct.name || !newProduct.price)
      return Alert.alert("Error", "Name and price required");

    try {
      const payload = {
        id: newProduct.id || undefined,
        name: newProduct.name,
        description: newProduct.description,
        price: parseFloat(newProduct.price),
        stock: parseInt(newProduct.stock || "0"),
        category: newProduct.category || "General",
        imageUrl: newProduct.image,
      };
      await createProduct(payload, token);
      setNewProduct({
        id: null,
        name: "",
        description: "",
        price: "",
        stock: "",
        image: "",
        category: "",
      });
      fetchProducts(token);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleEditProduct = (p) => {
    setNewProduct({
      id: p.id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      image: p.imageUrl,
      category: p.category,
    });
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await confirmDialog("Confirm", "Delete this product?");
    if (!confirmed) return;
    await deleteProduct(id, token);
    fetchProducts(token);
  };

  // ADMINS
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password)
      return Alert.alert("Error", "Fill all fields");

    await createAdmin({ ...newAdmin, role: "ADMIN" }, token);
    setNewAdmin({ id: null, name: "", email: "", password: "" });
    fetchAdmins(token);
  };

  const handleDeleteAdmin = async (id) => {
    const confirmed = await confirmDialog("Confirm", "Delete this admin?");
    if (!confirmed) return;
    await deleteAdmin(id, token);
    fetchAdmins(token);
  };

  // ORDERS
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(
        `${API_URL}/api/orders/admin/${orderId}/status?status=${newStatus}`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(await res.text());
      fetchOrders(token);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    const confirmed = await confirmDialog("Confirm", "Logout?");
    if (!confirmed) return;

    await AsyncStorage.multiRemove(["token", "user"]);
    setUser(null);
    setGlobalToken(null);
    navigation.reset({ index: 0, routes: [{ name: "Home" }] });
  };

  // LOADING
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Admin Dashboard</Text>

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

      {/* TABS */}
      <View style={styles.tabsRow}>
        {["products", "admins", "orders"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === "products"
                ? "Manage Products"
                : tab === "admins"
                ? "Manage Admins"
                : "Manage Orders"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.pageScroll} contentContainerStyle={styles.pageContainer}>
        {/* PRODUCTS TAB */}
        {activeTab === "products" ? (
          <View>
            <Text style={styles.sectionTitle}>Products</Text>

            <View style={styles.listBox}>
              <ScrollView style={styles.innerScroll}>
                {products.map((p) => (
                  <View key={p.id} style={styles.itemRow}>
                    {p.imageUrl && (
                      <Image source={{ uri: p.imageUrl }} style={styles.productImage} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      <Text style={styles.itemSub}>
                        ${p.price} — {p.category}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={() => handleEditProduct(p)}>
                      <Text style={styles.editBtn}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => handleDeleteProduct(p.id)}>
                      <Text style={styles.deleteBtn}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ADD/EDIT PRODUCT FORM */}
            <Text style={styles.subTitle}>
              {newProduct.id ? "Edit Product" : "Add Product"}
            </Text>

            {["name", "description", "price", "stock"].map((f) => (
              <TextInput
                key={f}
                style={styles.input}
                placeholder={f.toUpperCase()}
                value={newProduct[f]}
                onChangeText={(t) => setNewProduct((prev) => ({ ...prev, [f]: t }))}
              />
            ))}

            <Picker
              selectedValue={newProduct.category}
              onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
              style={styles.input}
            >
              <Picker.Item label="Select category..." value="" />
              {["Clothing", "Electronics", "Shoes", "Watches", "Jewellery", "Beauty"].map(
                (cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                )
              )}
            </Picker>

            <TextInput
              style={styles.input}
              placeholder="Paste Image URL"
              value={newProduct.image}
              onChangeText={(url) =>
                setNewProduct((prev) => ({ ...prev, image: url.trim() }))
              }
            />

            {/* PICK IMAGE FROM DEVICE */}
            <Button title="Pick Image From Device" onPress={pickImage} />

            {/* REVIEW */}
            {newProduct.image ? (
              <Image source={{ uri: newProduct.image }} style={styles.previewImage} />
            ) : null}

            <Button
              title={newProduct.id ? "Update Product" : "Add Product"}
              onPress={handleAddOrEditProduct}
            />
          </View>
        ) : null}

        {/* ADMINS TAB */}
        {activeTab === "admins" ? (
          <View>
            <Text style={styles.sectionTitle}>Admins</Text>

            <View style={styles.listBox}>
              <ScrollView style={styles.innerScroll}>
                {admins.map((a) => (
                  <View key={a.id} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{a.name}</Text>
                      <Text style={styles.itemSub}>{a.email}</Text>
                    </View>

                    <TouchableOpacity onPress={() => handleDeleteAdmin(a.id)}>
                      <Text style={styles.deleteBtn}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* ADD ADMIN FORM */}
            <Text style={styles.subTitle}>Add Admin</Text>

            {["name", "email", "password"].map((f) => (
              <TextInput
                key={f}
                style={styles.input}
                placeholder={f.toUpperCase()}
                value={newAdmin[f]}
                secureTextEntry={f === "password"}
                onChangeText={(t) => setNewAdmin((prev) => ({ ...prev, [f]: t }))}
              />
            ))}

            <Button title="Add Admin" onPress={handleAddAdmin} />
          </View>
        ) : null}

        {/* ORDERS TAB */}
        {activeTab === "orders" ? (
          <View>
            <Text style={styles.sectionTitle}>Orders</Text>

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
                    navigation.navigate("AdminOrderDetails", { orderId: o.id })
                  }
                >
                  <Text style={styles.itemTitle}>Order #{o.id}</Text>
                  <Text>User: {o.user?.email || "N/A"}</Text>
                  <Text>Status: {o.status}</Text>
                  <Text>Total: ${o.totalPrice?.toFixed(2)}</Text>
                  <Text>Date: {new Date(o.createdAt).toLocaleString()}</Text>

                  <View style={{ flexDirection: "row", marginTop: 5 }}>
                    {["PENDING", "PROCESSING", "COMPLETED", "CANCELLED"].map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => handleUpdateOrderStatus(o.id, s)}
                      >
                        <Text
                          style={[
                            styles.statusBtn,
                            {
                              backgroundColor:
                                s === o.status ? "#0d6efd" : "#e9ecef",
                            },
                          ]}
                        >
                          {s}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webScrollFix =
  Platform.OS === "web"
    ? { overflowY: "auto", WebkitOverflowScrolling: "touch" }
    : {};

const styles = StyleSheet.create({
  topBar: {
    backgroundColor: "#0d6efd",
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBarTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  tabsRow: { flexDirection: "row", backgroundColor: "#e9ecef", padding: 6, gap: 8 },
  tabBtn: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  tabBtnActive: { backgroundColor: "#fff", borderColor: "#0d6efd" },
  tabText: { color: "#495057", fontWeight: "600" },
  tabTextActive: { color: "#0d6efd" },
  pageScroll: { flex: 1, backgroundColor: "#fff", ...webScrollFix },
  pageContainer: { padding: 16, gap: 10 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { marginTop: 6, fontWeight: "bold", fontSize: 20, color: "#333" },
  subTitle: { marginTop: 10, fontSize: 16, fontWeight: "600" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    padding: 10,
    marginVertical: 6,
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
  listBox: {
    maxHeight: 320,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    ...webScrollFix,
  },
  innerScroll: { ...webScrollFix },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderColor: "#eee",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  itemTitle: { fontWeight: "600", color: "#222" },
  itemSub: { color: "#6c757d" },
  editBtn: { color: "#0275d8", fontWeight: "600", paddingHorizontal: 6, paddingVertical: 4 },
  deleteBtn: { color: "#d9534f", fontWeight: "600", paddingHorizontal: 6, paddingVertical: 4 },
  productImage: { width: 44, height: 44, borderRadius: 6, backgroundColor: "#eee" },
  previewImage: {
    width: 140,
    height: 140,
    marginVertical: 10,
    borderRadius: 10,
    alignSelf: "center",
    backgroundColor: "#eee",
  },
  orderBox: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f8f9fa",
    marginBottom: 10,
  },
  statusBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginRight: 6,
    color: "#000",
    fontWeight: "600",
  },
});