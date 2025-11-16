package com.CSC492.store.controller;

import com.CSC492.store.model.Product;
import com.CSC492.store.model.User;
import com.CSC492.store.security.JwtUtil;
import com.CSC492.store.service.UserService;
import com.CSC492.store.service.WishlistService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistService wishlistService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public WishlistController(WishlistService wishlistService, UserService userService, JwtUtil jwtUtil) {
        this.wishlistService = wishlistService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }
    private User getUserFromToken(String header) {
        String token = header.replace("Bearer ", "").trim();
        String email = jwtUtil.extractEmail(token.replace("Bearer ", "").trim());
        return userService.findByEmail(email);
    }

    @GetMapping
    public List<Product> getWishlist(@RequestHeader("Authorization") String token) {
        return wishlistService.getWishlist(getUserFromToken(token));
    }

    @PostMapping("/add/{productId}")
    public String addToWishlist(@RequestHeader("Authorization") String token, @PathVariable Long productId) {
        wishlistService.addToWishlist(getUserFromToken(token), productId);
        return "Added";
    }

    @DeleteMapping("/remove/{productId}")
    public String removeFromWishlist(@RequestHeader("Authorization") String token, @PathVariable Long productId) {
        wishlistService.removeFromWishlist(getUserFromToken(token), productId);
        return "Removed";
    }
}