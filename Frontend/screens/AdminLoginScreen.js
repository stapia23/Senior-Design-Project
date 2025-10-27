import React, { useState } from "react";
import { View, TextInput, Button, Alert, TouchableOpacity, Text, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login } from "../services/api";

export default function AdminLoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      const data = await login(email, password);

      // Adjust for backend response structure
      const token = data.token;
      const role = data.user?.role; // <-- check inside user object

      if (!token || !role) {
        throw new Error("Invalid response from server");
      }

      if (role !== "ADMIN") {
        Alert.alert("Access Denied", "You are not an admin.");
        return;
      }

      await AsyncStorage.setItem("token", token);
      navigation.replace("AdminDashboard");
    } catch (err) {
      console.error("Login Error:", err);
      Alert.alert("Login Failed", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <View style={{ padding: 20, flex: 1, justifyContent: "center" }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{ marginBottom: 10, borderWidth: 1, padding: 8, borderRadius: 5 }}
      />

      <View style={{ position: "relative", marginBottom: 10 }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={{ borderWidth: 1, padding: 8, borderRadius: 5 }}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: "absolute", right: 10, top: 4, padding: 4 }}
        >
          <Text style={{ color: "blue", fontWeight: "bold" }}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

      <Button
        title={loading ? "Logging in..." : "Login as Admin"}
        onPress={handleAdminLogin}
        disabled={loading}
      />
    </View>
  );
}
