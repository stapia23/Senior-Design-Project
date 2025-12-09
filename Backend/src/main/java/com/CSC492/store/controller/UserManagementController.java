package com.CSC492.store.controller;

import com.CSC492.store.model.User;
import com.CSC492.store.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")  // base path for user management
public class UserManagementController {

    private final UserService userService;

    public UserManagementController(UserService userService) {
        this.userService = userService;
    }

    // Get all users
    @GetMapping
    public List<User> getAllUsers() {
        return userService.findAll();
    }

    // Get a user by ID
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        Optional<User> optional = userService.findById(id);
        if (optional.isPresent()) {
            return optional.get();
        } else {
            throw new RuntimeException("User not found");
        }
    }

    // Delete a user by ID
    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        userService.delete(id);
        return "User with ID " + id + " deleted successfully.";
    }

    // Update a user
    @PutMapping("/{id}")
    public User updateUser(@PathVariable Long id, @RequestBody User updatedUser) {
        Optional<User> optional = userService.findById(id);
        User user;
        if (optional.isPresent()) {
            user = optional.get();
        } else {
            throw new RuntimeException("User not found");
        }
        user.setName(updatedUser.getName());
        user.setEmail(updatedUser.getEmail());

        // Optional: update password if provided
        if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
            user.setPassword(updatedUser.getPassword());
        }
        return userService.save(user);
    }
}
