package com.CSC492.store.controller;

import com.CSC492.store.dto.CheckoutItemDTO;
import com.CSC492.store.model.Order;
import com.CSC492.store.model.User;
import com.CSC492.store.service.OrderService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;

    @Autowired
    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    // Create order after Stripe success
    @PostMapping("/create")
    public ResponseEntity<?> createOrder(@RequestBody List<CheckoutItemDTO> items, @AuthenticationPrincipal User user) {
        if (user == null){
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (user.getRole() != User.Role.CUSTOMER) {
            return ResponseEntity.status(403).body("Only customers can place orders.");
        }

        try {
            Order saved = orderService.createOrderFromItems(user, items, Order.Status.COMPLETED);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to create order: " + e.getMessage());
        }
    }

    // Customer view own orders
    @GetMapping("/my")
    public ResponseEntity<?> getMyOrders(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(orderService.getOrdersByUser(user));
    }

    // Customer or Admin view single order
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        Optional<Order> optional = orderService.getOrderById(id);

        if (optional.isPresent()) {
            Order order = optional.get();
            // User owns order OR is admin
            if (order.getUser().getId().equals(user.getId()) || user.getRole() == User.Role.ADMIN) {
                return ResponseEntity.ok(order);
            } else {
                return ResponseEntity.status(403).body("Forbidden");
            }
        }
        // Order does not exist
        return ResponseEntity.notFound().build();
    }

    // Admin — get all orders
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllOrders() {
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    // Admin — update order status
    @PatchMapping("/admin/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status) {
        try {
            Order.Status newStatus = Order.Status.valueOf(status.toUpperCase());
            Order updated = orderService.updateStatus(id, newStatus);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid status value.");
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}