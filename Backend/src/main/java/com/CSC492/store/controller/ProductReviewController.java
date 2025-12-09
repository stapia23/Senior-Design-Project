package com.CSC492.store.controller;

import com.CSC492.store.model.ProductReview;
import com.CSC492.store.model.User;
import com.CSC492.store.service.ProductReviewService;
import com.CSC492.store.service.UserService;
import com.CSC492.store.security.JwtUtil;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
public class ProductReviewController {

    private final ProductReviewService reviewService;
    private final JwtUtil jwtUtil;
    private final UserService userService;

    public ProductReviewController(ProductReviewService reviewService, JwtUtil jwtUtil, UserService userService) {
        this.reviewService = reviewService;
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    private User getUser(String token) {
        String email = jwtUtil.extractEmail(token.replace("Bearer ", ""));
        return userService.findByEmail(email);
    }

    @GetMapping("/{productId}")
    public List<ProductReview> getReviews(@PathVariable Long productId) {
        return reviewService.getReviews(productId);
    }

    @PostMapping("/{productId}")
    public ProductReview addReview(@RequestHeader("Authorization") String token, @PathVariable Long productId, @RequestBody ReviewRequest req) {
        User user = getUser(token);
        return reviewService.addReview(productId, req.rating, req.comment, user);
    }
    public static class ReviewRequest {
        public int rating;
        public String comment;
    }

    @DeleteMapping("/{reviewId}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteReview(@PathVariable Long reviewId) {
        System.out.println("DELETE REVIEW CALLED: " + reviewId);
        reviewService.deleteReview(reviewId);
    }
}