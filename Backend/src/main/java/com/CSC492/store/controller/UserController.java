package com.CSC492.store.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.CSC492.store.model.User;
import com.CSC492.store.service.UserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public UserController(UserService userService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
    }

    // Register new user (public)
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody User user) {
        try {
            if (userService.findByEmail(user.getEmail()) != null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Email is already in use.");
            }

            if (user.getRole() == null) {
                user.setRole(User.Role.CUSTOMER);
            }

            user.setPassword(passwordEncoder.encode(user.getPassword()));
            User savedUser = userService.save(user);

            return ResponseEntity.ok(savedUser);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred during registration");
        }
    }

    // Delete own account (Customer only)
    @DeleteMapping("/delete")
    public ResponseEntity<?> deleteOwnAccount(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null || currentUser.getRole() != User.Role.CUSTOMER) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        userService.delete(currentUser.getId());
        return ResponseEntity.ok("Your account has been deleted successfully.");
    }

    // Get current user's profile
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }
        return ResponseEntity.ok(currentUser);
    }

    // UPDATE profile for Customer and Admin
    @PutMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody User updatedUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            currentUser.setName(updatedUser.getName());
            currentUser.setEmail(updatedUser.getEmail());

            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                currentUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }

            User saved = userService.save(currentUser);
            return ResponseEntity.ok(saved);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error updating profile");
        }
    }
}