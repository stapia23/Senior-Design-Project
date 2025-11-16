import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// PLATFORM API URL HANDLING
export const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8080" // Android
    : "http://localhost:8080"; // Web

async function fetchWithTimeout(resource, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw new Error(`Request failed or timed out: ${err.message}`);
  }
}

async function getFetchOptions(method, body = null, needsAuth = true, token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (needsAuth) {
    if (!token) token = await AsyncStorage.getItem("token");

    if (token && token !== "null" && token !== "undefined") {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  return opts;
}

// AUTH
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
  await AsyncStorage.setItem("user", JSON.stringify(user));

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

// PRODUCTS
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

export async function getProducts(token = null, category = null, page = 0, size = 1000) {
  try {
    let url = `${API_URL}/api/products?page=${page}&size=${size}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (token && token !== "null" && token !== "undefined")
      headers["Authorization"] = `Bearer ${token}`;

    const res = await fetchWithTimeout(url, { method: "GET", headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

    const data = await res.json();

    if (data.content) {
      let products = [...data.content];
      const totalPages = data.totalPages || 1;

      for (let i = 1; i < totalPages; i++) {
        const nextRes = await fetchWithTimeout(
          `${API_URL}/api/products?page=${i}&size=${size}`,
          { method: "GET", headers }
        );
        if (nextRes.ok) {
          const more = await nextRes.json();
          if (more.content) products = [...products, ...more.content];
        }
      }

      return products;
    }

    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("getProducts error:", err);
    throw err;
  }
}

// products by category
export async function getProductsByCategory(category, token = null) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token && token !== "null" && token !== "undefined") {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetchWithTimeout(
    `${API_URL}/api/products/category/${encodeURIComponent(category)}`,
    { method: "GET", headers }
  );

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);

  return await res.json();
}


// ADMIN USERS
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

// USER PROFILE
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

// IMAGE UPLOAD
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

// STRIPE CHECKOUT
export async function createCheckoutSession(cartItems, token = null) {
  console.log("➡️ Stripe Checkout → Payload:", cartItems);
  console.log("➡️ API:", `${API_URL}/api/payments/create-checkout-session`);

  const res = await fetchWithTimeout(
    `${API_URL}/api/payments/create-checkout-session`,
    await getFetchOptions("POST", { items: cartItems }, true, token)
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Wishlist functions
export async function addToWishlist(productId, token=null) {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}/api/wishlist/add/${productId}`, {
    method: "POST",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function removeFromWishlist(productId, token=null) {
  const headers = { Authorization: `Bearer ${token}` };
  const res = await fetch(`${API_URL}/api/wishlist/remove/${productId}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) throw new Error(await res.text());
  return true;
}

export async function getWishlist(token=null) {
  const headers = { 
    "Accept": "application/json",
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  const res = await fetch(`${API_URL}/api/wishlist`, { headers });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getReviews(productId) {
  const res = await fetch(`${API_URL}/api/reviews/${productId}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function addReview(productId, rating, comment, token) {
  const res = await fetch(`${API_URL}/api/reviews/${productId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating, comment }),
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const deleteReview = async (id, token) => {
  console.log("API: Sending DELETE", `${API_URL}/api/reviews/${id}`);

  const res = await fetch(`${API_URL}/api/reviews/${id}`, {
    method: "DELETE",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  }).catch(err => {
    console.log("FETCH ERROR:", err);
    throw err;
  });

  console.log("Delete response status:", res.status);

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Failed to delete");
  }

  return true;
};