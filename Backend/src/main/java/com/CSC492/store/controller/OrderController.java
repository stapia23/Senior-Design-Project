package com.CSC492.store.controller;

import com.CSC492.store.model.Order;
import com.CSC492.store.model.User;
import com.CSC492.store.service.OrderService;
import com.CSC492.store.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    @Autowired
    public OrderController(OrderService orderService, UserService userService) {
        this.orderService = orderService;
        this.userService = userService;
    }

    // Create a new order, customer only
    @PostMapping
    public ResponseEntity<?> createOrder(@RequestBody Order order, 
                                         @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (user.getRole() != User.Role.CUSTOMER) {
            return ResponseEntity.status(403).body("Only customers can place orders.");
        }

        order.setUser(user);
        Order savedOrder = orderService.createOrder(order);
        return ResponseEntity.ok(savedOrder);
    }

    // get all orders for the authenticated customer
    @GetMapping
    public ResponseEntity<?> getUserOrders(@AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        if (user.getRole() != User.Role.CUSTOMER) {
            return ResponseEntity.status(403).body("Only customers can view their orders.");
        }

        List<Order> orders = orderService.getOrdersByUser(user);
        return ResponseEntity.ok(orders);
    }

    // get a single order by ID, for customer(their own order) or admin
    @GetMapping("/{id}")
    public ResponseEntity<?> getOrderById(@PathVariable Long id,
                                          @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return orderService.getOrderById(id)
                .map(order -> {
                    // Allow access if user owns the order or is admin
                    if (order.getUser().getId().equals(user.getId()) || user.getRole() == User.Role.ADMIN) {
                        return ResponseEntity.ok(order);
                    } else {
                        return ResponseEntity.status(403).body("Forbidden");
                    }
                })
                .orElse(ResponseEntity.notFound().build());
    }

    //Update order status, Admin only
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateOrderStatus(@PathVariable Long id,
                                               @RequestParam String status,
                                               @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.findByEmail(userDetails.getUsername());
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
}