import "./app.css";

import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import CartScreen from "./screens/CartScreen";
import LoginScreen from "./screens/LoginScreen";
import AdminLoginScreen from "./screens/AdminLoginScreen";
import AdminDashboard from "./screens/AdminDashboard";
import AccountScreen from "./screens/AccountScreen";
import ProductDetailsScreen from "./screens/ProductDetailsScreen";
import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";

const Stack = createStackNavigator();

export default function App() {
  const [token, setToken] = useState(null);

  return (
    <UserProvider>
      <CartProvider>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: "#007bff" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
            }}
          >
            <Stack.Screen
              name="Home"
              options={{ title: "E-Commerce Store" }}
            >
              {(props) => <HomeScreen {...props} token={token} />}
            </Stack.Screen>

            <Stack.Screen
              name="ProductDetails"
              component={ProductDetailsScreen}
              options={{ title: "Product Details" }}
            />

            <Stack.Screen
              name="Cart"
              component={CartScreen}
              options={{ title: "Your Cart" }}
            />

            <Stack.Screen
              name="Account"
              component={AccountScreen}
              options={{ title: "My Account" }}
            />

            <Stack.Screen
              name="Login"
              options={{ title: "Login" }}
            >
              {(props) => <LoginScreen {...props} setToken={setToken} />}
            </Stack.Screen>

            <Stack.Screen
              name="AdminLogin"
              component={AdminLoginScreen}
              options={{ title: "Admin Login" }}
            />

            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboard}
              options={{ title: "Admin Dashboard" }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </UserProvider>
  );
}