package com.CSC492.store.service;

import com.CSC492.store.model.User;
import com.CSC492.store.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // Create or update a user
    public User save(User user) {
        if (!user.getPassword().startsWith("$2a$")) {
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        return userRepository.save(user);
    }

    // Get all users
    public List<User> findAll() {
        return userRepository.findAll();
    }

    // Find user by ID
    public Optional<User> findById(Long id) {
        return userRepository.findById(id);
    }

    // Delete user
    public void delete(Long id) {
        userRepository.deleteById(id);
    }

    // Find user by email,case-insensitive
    public User findByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }
}