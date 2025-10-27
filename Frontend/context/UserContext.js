import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as apiLogin, register as apiRegister, getCurrentUserProfile } from "../services/api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load saved user + token on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        const storedToken = await AsyncStorage.getItem("token");

        if (
          storedUser &&
          storedUser !== "undefined" &&
          storedToken &&
          storedToken !== "undefined" &&
          storedToken !== "null"
        ) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
          await refreshUserProfile(storedToken); // Try to refresh profile
        } else {
          await AsyncStorage.multiRemove(["user", "token"]);
        }
      } catch (err) {
        console.log("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Refresh user profile (with auto-logout on expired/invalid token)
  const refreshUserProfile = async (jwt = token) => {
    if (!jwt || jwt === "null" || jwt === "undefined") return;

    try {
      const profile = await getCurrentUserProfile(jwt);
      if (profile) {
        setUser(profile);
        await AsyncStorage.setItem("user", JSON.stringify(profile));
      }
    } catch (err) {
      console.log("Failed to refresh profile:", err.message);
      if (err.message.includes("403") || err.message.includes("401")) {
        console.log("Token invalid or expired — logging out...");
        await logout();
      }
    }
  };

  // Login
  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    setToken(data.token);
    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    await AsyncStorage.setItem("token", data.token);
    return data;
  };

  // Register
  const registerUser = async (userData) => {
    return await apiRegister(userData);
  };

  // Logout, clear everything
  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["user", "token"]);
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        setUser,
        loginUser,
        registerUser,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};