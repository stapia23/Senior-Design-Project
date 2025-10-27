import React, { useEffect, useState } from "react";
import {View,Text,Button,TextInput,Alert,ScrollView,Image,ActivityIndicator,StyleSheet,KeyboardAvoidingView,Platform,TouchableOpacity} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {getAdmins,createAdmin,createProduct,getProducts,deleteProduct,deleteAdmin,uploadImage} from "../services/api";
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

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

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

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

  // API FETCHERS
  const fetchProducts = async (jwt) => {
    try {
      const data = await getProducts(jwt, null, 0, 1000);

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data.content) {
        setProducts(data.content);
      } else {
        setProducts([]);
      }

      setPageInfo({ page: 0, totalPages: 1 });
    } catch (e) {
      console.log("Failed to fetch products:", e.message);
      Alert.alert("Error", "Could not load products. Please try again.");
    }
  };

  const fetchAdmins = async (jwt) => {
    try {
      const data = await getAdmins(jwt);
      setAdmins(Array.isArray(data) ? data : []);
    } catch (e) {
      console.log("Failed to fetch admins:", e.message);
    }
  };

  // IMAGE PICK & UPLOAD
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return Alert.alert("Permission required", "Allow photo access to continue.");
    }
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
      const type = `image/${(filename || "").split(".").pop() || "jpeg"}`;
      const formData = new FormData();
      formData.append("file", { uri, name: filename, type });
      const imageUrl = await uploadImage(formData, token);
      setNewProduct((p) => ({ ...p, image: imageUrl }));
      Alert.alert("Success", "Image uploaded successfully!");
    } catch (err) {
      Alert.alert("Upload failed", err.response?.data?.message || err.message);
    } finally {
      setUploading(false);
    }
  };

  // PRODUCT ACTIONS
  const handleAddOrEditProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      return Alert.alert("Error", "Name and price are required");
    }
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
      Alert.alert("Success", newProduct.id ? "Product updated!" : "Product added!");
      setNewProduct({
        id: null,
        name: "",
        description: "",
        price: "",
        stock: "",
        image: "",
        category: "",
      });
      fetchProducts(token, pageInfo.page);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    }
  };

  const handleEditProduct = (product) => {
    setNewProduct({
      id: product.id,
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
      image: product.imageUrl,
      category: product.category,
    });
  };

  const handleDeleteProduct = async (id) => {
    const confirmed = await confirmDialog("Confirm Delete", "Are you sure you want to delete this product?");
    if (!confirmed) return;

    try {
      await deleteProduct(id, token);
      fetchProducts(token, pageInfo.page);
      Alert.alert("Deleted", "Product deleted successfully");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // ADMIN ACTIONS
  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
      return Alert.alert("Error", "All fields are required");
    }
    try {
      await createAdmin({ ...newAdmin, role: "ADMIN" }, token);
      Alert.alert("Success", "Admin added!");
      setNewAdmin({ id: null, name: "", email: "", password: "" });
      fetchAdmins(token);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || err.message);
    }
  };

  const handleDeleteAdmin = async (id) => {
    const confirmed = await confirmDialog("Confirm Delete", "Are you sure you want to delete this admin?");
    if (!confirmed) return;

    try {
      await deleteAdmin(id, token);
      fetchAdmins(token);
      Alert.alert("Deleted", "Admin deleted successfully");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  // LOGOUT
  const handleLogout = async () => {
    const confirmed = await confirmDialog("Confirm Logout", "Are you sure you want to log out?");
    if (!confirmed) return;

    try {
      await AsyncStorage.multiRemove(["token", "user"]);

      setToken(null);
      setGlobalToken(null);
      setUser(null);
      setProducts([]);
      setAdmins([]);

      if (Platform.OS === "web") {
        navigation.navigate("Home");
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
      }

      Alert.alert("Logged Out", "You have been logged out successfully.");
    } catch (err) {
      console.error("Logout failed:", err);
      Alert.alert("Error", "Something went wrong while logging out.");
    }
  };

  // UI
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Top App Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Admin Dashboard</Text>
        <Button title="Logout" color="#d9534f" onPress={handleLogout} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "products" && styles.tabBtnActive]}
          onPress={() => setActiveTab("products")}
        >
          <Text style={[styles.tabText, activeTab === "products" && styles.tabTextActive]}>
            Manage Products
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === "admins" && styles.tabBtnActive]}
          onPress={() => setActiveTab("admins")}
        >
          <Text style={[styles.tabText, activeTab === "admins" && styles.tabTextActive]}>
            Manage Admins
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area (forces browser scroll on web) */}
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.pageContainer}
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === "products" ? (
          <View>
            <Text style={styles.sectionTitle}>Products</Text>

            {/* Scrollable list box */}
            <View style={styles.listBox}>
              <ScrollView style={styles.innerScroll} contentContainerStyle={{ paddingVertical: 6 }}>
                {products.map((p) => (
                  <View key={p.id} style={styles.itemRow}>
                    {p.imageUrl && <Image source={{ uri: p.imageUrl }} style={styles.productImage} />}
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      <Text style={styles.itemSub}>${p.price} — {p.category}</Text>
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

            <Text style={styles.subTitle}>{newProduct.id ? "Edit Product" : "Add Product"}</Text>
            {["name", "description", "price", "stock", "image"].map((f) => (
              <TextInput
                key={f}
                style={styles.input}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={newProduct[f]}
                keyboardType={["price", "stock"].includes(f) ? "numeric" : "default"}
                onChangeText={(text) => setNewProduct((prev) => ({ ...prev, [f]: text }))}
              />
            ))}

            <Picker
              selectedValue={newProduct.category}
              onValueChange={(v) => setNewProduct({ ...newProduct, category: v })}
              style={styles.input}
            >
              <Picker.Item label="Select category..." value="" />
              {["Clothing", "Electronics", "Shoes", "Watches", "Jewellery", "Beauty"].map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>

            <Button
              title={uploading ? "Uploading..." : "Pick Image"}
              onPress={pickImage}
              disabled={uploading}
            />
            {newProduct.image && (
              <Image source={{ uri: newProduct.image }} style={styles.previewImage} />
            )}
            <Button
              title={newProduct.id ? "Update Product" : "Add Product"}
              onPress={handleAddOrEditProduct}
            />
          </View>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Admins</Text>

            {/* Scrollable list box */}
            <View style={styles.listBox}>
              <ScrollView style={styles.innerScroll} contentContainerStyle={{ paddingVertical: 6 }}>
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

            <Text style={styles.subTitle}>Add Admin</Text>
            {["name", "email", "password"].map((f) => (
              <TextInput
                key={f}
                style={styles.input}
                placeholder={f.charAt(0).toUpperCase() + f.slice(1)}
                value={newAdmin[f]}
                secureTextEntry={f === "password"}
                onChangeText={(t) => setNewAdmin((prev) => ({ ...prev, [f]: t }))}
                autoCapitalize={f === "email" ? "none" : "sentences"}
              />
            ))}
            <Button title="Add Admin" onPress={handleAddAdmin} />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const webScrollFix = Platform.OS === "web" ? { overflowY: "auto", WebkitOverflowScrolling: "touch" } : {};

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
  tabText: {
    color: "#495057",
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#0d6efd",
  },

  pageScroll: {
    flex: 1,
    backgroundColor: "#fff",
    ...webScrollFix, // ✅ scrollbar on web
  },
  pageContainer: {
    padding: 16,
    gap: 10,
  },

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

  listBox: {
    maxHeight: 320,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fafafa",
    ...webScrollFix, // container can scroll if content overflows on web
  },
  innerScroll: {
    ...webScrollFix, // ensures inner list shows scrollbar on web
  },

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
});
