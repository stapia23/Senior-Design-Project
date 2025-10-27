package com.CSC492.store.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

    // Get current user's profile (Admin or Customer)
    @GetMapping("/me")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        return ResponseEntity.ok(currentUser);
    }
}