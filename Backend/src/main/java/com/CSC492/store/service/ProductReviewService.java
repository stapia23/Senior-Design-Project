package com.CSC492.store.service;

import com.CSC492.store.model.Product;
import com.CSC492.store.model.ProductReview;
import com.CSC492.store.model.User;
import com.CSC492.store.repository.ProductRepository;
import com.CSC492.store.repository.ProductReviewRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductReviewService {

    private final ProductReviewRepository reviewRepo;
    private final ProductRepository productRepo;

    public ProductReviewService(ProductReviewRepository reviewRepo, ProductRepository productRepo) {
        this.reviewRepo = reviewRepo;
        this.productRepo = productRepo;
    }

    public List<ProductReview> getReviews(Long productId) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        return reviewRepo.findByProduct(product);
    }

    public ProductReview addReview(Long productId, int rating, String comment, User user) {
        Product product = productRepo.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        ProductReview review = new ProductReview(rating, comment, product, user);
        return reviewRepo.save(review);
    }

    public void deleteReview(Long reviewId) {
        reviewRepo.deleteById(reviewId);
    }

}