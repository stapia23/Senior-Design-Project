import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as apiLogin, register as apiRegister, getCurrentUserProfile } from "../services/api";
import { API_URL } from "../services/api";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const safeJSON = (value) => {
    try {
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  // Load user/token on startup
  useEffect(() => {
    const loadUser = async () => {
      try {
        let storedUser = await AsyncStorage.getItem("user");
        let storedToken = await AsyncStorage.getItem("token");

        if (!storedToken && typeof window !== "undefined") {
          storedToken = localStorage.getItem("token");
          storedUser = localStorage.getItem("user");
        }

        if (storedUser && storedToken) {
          const parsed = safeJSON(storedUser);

          if (!parsed) {
            await logout();
          } else {
            setUser(parsed);
            setToken(storedToken);

            // Refresh profile from backend
            await refreshUserProfile(storedToken);
          }
        } else {
          await logout();
        }
      } catch (err) {
        console.log("Failed to load user:", err);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Refresh profile
  const refreshUserProfile = async (jwt) => {
    if (!jwt) return;

    try {
      const profile = await getCurrentUserProfile(jwt);
      setUser(profile);

      // Sync both storages
      await AsyncStorage.setItem("user", JSON.stringify(profile));
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(profile));
      }
    } catch (err) {
      console.log("Token invalid → Logging out");
      await logout();
    }
  };

  // Login
  const loginUser = async (email, password) => {
    const data = await apiLogin(email, password);

    setUser(data.user);
    setToken(data.token);

    await AsyncStorage.setItem("user", JSON.stringify(data.user));
    await AsyncStorage.setItem("token", data.token);

    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(data.user));
      localStorage.setItem("token", data.token);
    }

    return data;
  };

  // Register
  const registerUser = async (user) => {
    const res = await fetch(`${API_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  // Logout
  const logout = async () => {
    setUser(null);
    setToken(null);

    await AsyncStorage.multiRemove(["user", "token"]);

    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        token,
        loading,
        setUser,
        setToken,
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