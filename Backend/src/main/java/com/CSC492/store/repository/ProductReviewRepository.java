package com.CSC492.store.repository;

import com.CSC492.store.model.ProductReview;
import com.CSC492.store.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findByProduct(Product product);
}