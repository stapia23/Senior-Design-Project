import React, { useContext, useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { UserContext } from "../context/UserContext";
import { API_URL, deleteMyAccount } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountScreen({ navigation }) {
  const { user, token, setUser, logout, refreshUserProfile } =
    useContext(UserContext);

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  // Load profile
  useEffect(() => {
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
      } catch (err) {
        console.error("Failed to load profile:", err);
        Alert.alert("Error", "Could not load your profile.");
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [token]);

  // Track unsaved changes
  useEffect(() => {
    setUnsavedChanges(
      name !== user?.name || email !== user?.email || password.length > 0
    );
  }, [name, email, password, user]);

  // Update profile
  const handleUpdate = async () => {
    if (!name || !email) {
      Alert.alert("Validation Error", "Name and email cannot be empty.");
      return;
    }

    try {
      setLoading(true);
      const body = { name, email };
      if (password) body.password = password;

      const res = await fetch(`${API_URL}/api/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error(await res.text());

      const updatedUser = await res.json();
      setUser(updatedUser);
      await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      setPassword("");
      Alert.alert("Success", "Profile updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      Alert.alert("Error", err.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
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

              if (Platform.OS === "web") {
                navigation.navigate("Home");
              } else {
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Home" }],
                });
              }

              Alert.alert("Account Deleted", "Your account has been deleted.");
            } catch (err) {
              console.error("Delete failed:", err);
              Alert.alert("Error", err.message || "Failed to delete account.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Confirm unsaved changes before leaving
  const confirmLeave = () => {
    if (unsavedChanges) {
      Alert.alert(
        "Unsaved Changes",
        "You have unsaved changes. Are you sure you want to leave?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Leave",
            style: "destructive",
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  // Loading UI
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
        <Text>Loading your account...</Text>
      </View>
    );
  }

  // Main UI
  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 20 }}>
        My Account
      </Text>

      <Text style={{ fontWeight: "bold" }}>Name:</Text>
      <TextInput value={name} onChangeText={setName} style={styles.input} />

      <Text style={{ fontWeight: "bold" }}>Email:</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <Text style={{ fontWeight: "bold" }}>Password:</Text>
      <View style={{ position: "relative", marginBottom: 20 }}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          placeholder="Enter new password"
          style={styles.input}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(!showPassword)}
          style={{ position: "absolute", right: 10, top: 10, padding: 4 }}
        >
          <Text style={{ color: "blue", fontWeight: "bold" }}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </TouchableOpacity>
      </View>

      <Button title="Update Profile" onPress={handleUpdate} />

      <View style={{ marginVertical: 20 }}>
        <Button
          title="Delete Account"
          onPress={handleDeleteAccount}
          color="red"
        />
      </View>

      <Button
        title="Logout"
        color="orange"
        onPress={async () => {
          await logout();
          await AsyncStorage.multiRemove(["user", "token"]);

          if (Platform.OS === "web") {
            navigation.navigate("Home");
          } else {
            navigation.reset({
              index: 0,
              routes: [{ name: "Home" }],
            });
          }

          Alert.alert("Logged Out", "You have been logged out successfully.");
        }}
      />

      <View style={{ marginTop: 20 }}>
        <Button title="Back" onPress={confirmLeave} />
      </View>
    </View>
  );
}

const styles = {
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 8,
    marginBottom: 10,
  },
};
