package com.CSC492.store.repository;

import com.CSC492.store.model.Wishlist;
import com.CSC492.store.model.User;
import com.CSC492.store.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;


import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {

    List<Wishlist> findByUser(User user);

    Optional<Wishlist> findByUserAndProduct(User user, Product product);

    @Modifying
    @Transactional
    @Query("DELETE FROM Wishlist w WHERE w.user = :user AND w.product = :product")
    void deleteByUserAndProduct(User user, Product product);
}
