package com.CSC492.store.controller;

import com.CSC492.store.dto.LoginRequest;
import com.CSC492.store.dto.LoginResponse;
import com.CSC492.store.model.User;
import com.CSC492.store.security.JwtUtil;
import com.CSC492.store.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthController(UserService userService, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userService = userService;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping(value = "/login", consumes = "application/json", produces = "application/json")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("Login request received:");
        System.out.println("Email: " + loginRequest.getEmail());
        System.out.println("Password (raw): " + loginRequest.getPassword());

        try {
            User user = userService.findByEmail(loginRequest.getEmail());
            System.out.println("User found: " + (user != null));

            if (user == null || !passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
                System.out.println("Login failed: invalid credentials");
                return ResponseEntity.status(403).body("Invalid email or password");
            }

            String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
            LoginResponse response = new LoginResponse(user.getId(), user.getName(), user.getEmail(), user.getRole().name(), token);
            System.out.println("Login successful, returning token");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Login error: " + e.getMessage());
        }
    }

}