package com.CSC492.store.controller;

import com.CSC492.store.model.Order;
import com.CSC492.store.model.User;
import com.CSC492.store.service.OrderService;
import com.CSC492.store.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final OrderService orderService;

    @Autowired
    public AdminController(UserService userService, OrderService orderService) {
        this.userService = userService;
        this.orderService = orderService;
    }

    // Get all users, Admin only
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(@AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        List<User> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    // Delete a user by ID, Admin only
    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        userService.delete(id);
        return ResponseEntity.ok("User deleted successfully");
    }

    // Get all orders, Admin only
    @GetMapping("/orders")
    public ResponseEntity<?> getAllOrders(@AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    // Get a specific order by ID, Admin only
    @GetMapping("/orders/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id, @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        Optional<Order> optional = orderService.getOrderById(id);

        if (optional.isPresent()) {
            return ResponseEntity.ok(optional.get());
        } else {
            return ResponseEntity.notFound().build();
        }

    }

    // Update order status, Admin only
    @PatchMapping("/orders/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id, @RequestParam String status, @AuthenticationPrincipal User user) {
        if (user == null || user.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

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

    // Create a new admin (only for existing ADMIN users)
    @PostMapping("/admins")
    public ResponseEntity<?> createAdmin(@RequestBody User newAdmin, @AuthenticationPrincipal User currentUser) {
        if (currentUser == null || currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        if (userService.findByEmail(newAdmin.getEmail()) != null) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        newAdmin.setRole(User.Role.ADMIN);
        User created = userService.save(newAdmin);
        return ResponseEntity.ok(created);
    }
    
    // Delete admin by ID, Admin only
    @DeleteMapping("/admins/{id}")
    public ResponseEntity<?> deleteAdmin(@PathVariable Long id, @AuthenticationPrincipal User currentUser) {
        if (currentUser == null || currentUser.getRole() != User.Role.ADMIN) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        if (currentUser.getId().equals(id)) {
            return ResponseEntity.badRequest().body("You cannot delete yourself.");
        }

        User adminToDelete = userService.findById(id).orElse(null);

        if (adminToDelete == null || adminToDelete.getRole() != User.Role.ADMIN) {
            return ResponseEntity.badRequest().body("Admin not found.");
        }

        userService.delete(id);
        return ResponseEntity.ok("Admin deleted successfully");
    }
}