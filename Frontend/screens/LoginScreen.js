import React, { useState, useContext } from "react"; 
import { View, TextInput, Button, Alert, TouchableOpacity, Text, ActivityIndicator, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { UserContext } from "../context/UserContext";

export default function LoginScreen({ navigation, route }) {
  const { loginUser, registerUser } = useContext(UserContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registerMode, setRegisterMode] = useState(false);
  const [name, setName] = useState("");

  const redirectScreen = route.params?.redirect || "Home";

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Validation Error", "Please enter both email and password.");
      return;
    }
    try {
      setLoading(true);
      await loginUser(email, password);   // stores JWT in AsyncStorage

      // Store for Expo Web reload after Stripe checkout
      const storedToken = await AsyncStorage.getItem("token");
      if (storedToken) {
        localStorage.setItem("token", storedToken);
      }

      navigation.navigate(redirectScreen);
    } catch (err) {
      Alert.alert("Login failed", err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Validation Error", "All fields are required.");
      return;
    }
    try {
      setLoading(true);
      await registerUser({ name, email, password, role: "CUSTOMER" });
      Alert.alert("Success", "Account created! You can now log in.");
      setRegisterMode(false);
      setName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      Alert.alert("Registration failed", err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {registerMode && (
        <TextInput
          placeholder="Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
      )}

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <View style={{ position: "relative", marginBottom: 10 }}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
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

      {registerMode ? (
        <>
          <Button title={loading ? "Registering..." : "Register"} onPress={handleRegister} disabled={loading} />
          <TouchableOpacity onPress={() => setRegisterMode(false)} style={{ marginTop: 10 }}>
            <Text style={{ color: "blue", textAlign: "center" }}>Already have an account? Login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Button title={loading ? "Logging in..." : "Login"} onPress={handleLogin} disabled={loading} />
          <TouchableOpacity onPress={() => setRegisterMode(true)} style={{ marginTop: 10 }}>
            <Text style={{ color: "blue", textAlign: "center" }}>Create new account</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, flex: 1, justifyContent: "center" },
  input: { marginBottom: 10, borderWidth: 1, padding: 8, borderRadius: 5 },
  loadingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.2)" 
  }
});