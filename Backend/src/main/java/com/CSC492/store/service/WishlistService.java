package com.CSC492.store.service;

import com.CSC492.store.model.User;
import com.CSC492.store.model.Product;
import com.CSC492.store.model.Wishlist;
import com.CSC492.store.repository.WishlistRepository;
import com.CSC492.store.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private final WishlistRepository wishlistRepository;
    @Autowired
    private final ProductRepository productRepository;

    public WishlistService(WishlistRepository wishlistRepository, ProductRepository productRepository) {
        this.wishlistRepository = wishlistRepository;
        this.productRepository = productRepository;
    }

    public List<Product> getWishlist(User user) {
        return wishlistRepository.findByUser(user).stream().map(Wishlist::getProduct).collect(Collectors.toList());
    }

    public void addToWishlist(User user, Long productId) {
        Optional<Product> optionalP = productRepository.findById(productId);
        Product product;
        if (optionalP.isPresent()) {
            product = optionalP.get();
        } else {
            throw new RuntimeException("Product not found");
        }

        Optional<Wishlist> optionalW = wishlistRepository.findByUserAndProduct(user, product);

        Wishlist wishlist;
        if (optionalW.isPresent()) {
            wishlist = optionalW.get();
        } else {
            wishlist = wishlistRepository.save(new Wishlist(null, user, product));
        }
    }

    public void removeFromWishlist(User user, Long productId) {
        Optional<Product> optional = productRepository.findById(productId);
        Product product;
        if (optional.isPresent()) {
            product = optional.get();
        } else {
            throw new RuntimeException("Product not found");
        }
        wishlistRepository.deleteByUserAndProduct(user, product);
    }
}