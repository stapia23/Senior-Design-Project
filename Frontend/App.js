import "./app.css";

import React from "react";
import "./ignoreWarnings";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import HomeScreen from "./screens/HomeScreen";
import CartScreen from "./screens/CartScreen";
import LoginScreen from "./screens/LoginScreen";
import AdminDashboard from "./screens/AdminDashboard";
import AccountScreen from "./screens/AccountScreen";
import ProductDetailsScreen from "./screens/ProductDetailsScreen";
import CheckoutSuccessScreen from "./screens/CheckoutSuccessScreen";

import OrderDetailsScreen from "./screens/OrderDetailsScreen";
import AdminOrderDetailsScreen from "./screens/AdminOrderDetailsScreen";

import { UserProvider } from "./context/UserContext";
import { CartProvider } from "./context/CartContext";

const Stack = createStackNavigator();

const linking = {
  prefixes: ["http://localhost:8081"],
  config: {
    screens: {
      CheckoutSuccess: "CheckoutSuccess",
      Cart: "Cart",
      Home: "Home",
    },
  },
};

export default function App() {
  return (
    <UserProvider>
      <CartProvider>
        <NavigationContainer linking={linking} fallback={<Text>Loading...</Text>}>

          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: "#007bff" },
              headerTintColor: "#fff",
              headerTitleStyle: { fontWeight: "bold" },
            }}
          >
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "E-Commerce Store" }} />
            <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: "Product Details" }} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ title: "Your Cart" }} />
            <Stack.Screen name="CheckoutSuccess" component={CheckoutSuccessScreen} options={{ title: "Order Complete" }} />
            <Stack.Screen name="Account" component={AccountScreen} options={{ title: "My Account" }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
            <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ title: "Admin Dashboard" }} />
            <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} options={{ title: "Order Details" }} />
            <Stack.Screen name="AdminOrderDetails" component={AdminOrderDetailsScreen} options={{ title: "Order Details (Admin)" }} />
          </Stack.Navigator>
        </NavigationContainer>
      </CartProvider>
    </UserProvider>
  );
}