import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const isAndroid = Platform.OS === "android";

export const API_URL = isAndroid
  ? "http://10.0.2.2:8080" // Android
  : "http://localhost:8080"; // Web

async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Request failed or timed out: ${err.message}`);
  }
}

async function getFetchOptions(method, body = null, useToken = true, token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (useToken && !token) {
    token = await AsyncStorage.getItem("token");
  }

  if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);
  return options;
}

//  AUTH 
export const login = async (email, password) => {
  const res = await fetchWithTimeout(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();

  const user = data.user || {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
  };

  await AsyncStorage.setItem("token", data.token);
  return { user, token: data.token };
};

export async function register(user) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/auth/register`,
    await getFetchOptions("POST", user, false)
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

//  PRODUCTS 
export async function createProduct(product, token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/products`,
    await getFetchOptions("POST", product, true, token)
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteProduct(productId, token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/products/${productId}`,
    await getFetchOptions("DELETE", null, true, token)
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.text();
}

// Get all products
export async function getProducts(token = null, category = null, page = 0, size = 1000) {
  try {
    let queryParams = `?page=${page}&size=${size}`;
    if (category) queryParams += `&category=${encodeURIComponent(category)}`;
    const url = `${API_URL}/api/products${queryParams}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(url, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();

    if (Array.isArray(data)) {
      return data;
    } else if (data.content) {
      let allProducts = [...data.content];
      const totalPages = data.totalPages || 1;

      for (let i = 1; i < totalPages; i++) {
        const nextUrl = `${API_URL}/api/products?page=${i}&size=${size}`;
        const nextRes = await fetchWithTimeout(nextUrl, { method: "GET", headers });
        if (nextRes.ok) {
          const nextData = await nextRes.json();
          if (nextData.content) allProducts = [...allProducts, ...nextData.content];
        }
      }

      return allProducts;
    }

    return [];
  } catch (err) {
    console.error("getProducts error:", err);
    throw err;
  }
}

export async function getProductsByCategory(category, token = null, page = 0, size = 1000) {
  try {
    const url = `${API_URL}/api/products/category/${encodeURIComponent(category)}?page=${page}&size=${size}`;

    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token && token !== "null" && token !== "undefined" && token.trim() !== "") {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetchWithTimeout(url, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();

    if (Array.isArray(data)) return data;

    if (data.content) {
      let allProducts = [...data.content];
      const totalPages = data.totalPages || 1;

      for (let i = 1; i < totalPages; i++) {
        const nextRes = await fetchWithTimeout(
          `${API_URL}/api/products/category/${encodeURIComponent(category)}?page=${i}&size=${size}`,
          { method: "GET", headers }
        );
        if (nextRes.ok) {
          const nextData = await nextRes.json();
          if (nextData.content) allProducts = [...allProducts, ...nextData.content];
        }
      }

      return allProducts;
    }

    return [];
  } catch (err) {
    console.error("getProductsByCategory error:", err);
    throw err;
  }
}

//  ADMIN 
export async function getAdmins(token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/users`,
    await getFetchOptions("GET", null, true, token)
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const users = await res.json();
  return users.filter((u) => u.role === "ADMIN");
}

export async function createAdmin(admin, token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/admins`,
    await getFetchOptions("POST", { ...admin, role: "ADMIN" }, true, token)
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function deleteAdmin(userId, token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/admin/admins/${userId}`,
    await getFetchOptions("DELETE", null, true, token)
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.text();
}

//  USER PROFILE 
export async function getCurrentUserProfile(token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/users/me`,
    await getFetchOptions("GET", null, true, token)
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function deleteMyAccount(token = null) {
  const res = await fetchWithTimeout(
    `${API_URL}/api/users/delete`,
    await getFetchOptions("DELETE", null, true, token)
  );
  if (!res.ok) throw new Error(await res.text());
  return res.text();
}

//  IMAGE UPLOAD 
export async function uploadImage(formData, token = null) {
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetchWithTimeout(`${API_URL}/api/upload`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
  return res.text();
}
