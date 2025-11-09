package com.CSC492.store.controller;

import com.CSC492.store.model.Product;
import com.CSC492.store.model.User;
import com.CSC492.store.service.ProductService;
import com.CSC492.store.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;
    private final UserService userService;

    @Autowired
    public ProductController(ProductService productService, UserService userService) {
        this.productService = productService;
        this.userService = userService;
    }

    // Create product (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping
    public ResponseEntity<?> createProduct(@RequestBody Product product,
                                           @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(productService.createProduct(product));
    }

    // Get product by ID
    @GetMapping("/{id}")
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getProductById(@PathVariable Long id) {
        Optional<Product> product = productService.getProductById(id);
        return product.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    // Get all products
    @GetMapping
    @PreAuthorize("permitAll()")
    public ResponseEntity<?> getProducts(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        Page<Product> products = productService.getProducts(category, search, page, size, sortBy, sortDir);
        return ResponseEntity.ok(products);
    }

    // Get by category
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Product>> getByCategory(@PathVariable String category) {
        return ResponseEntity.ok(productService.getByCategory(category));
    }

    // Update product (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProduct(@PathVariable Long id,
                                           @RequestBody Product product,
                                           @AuthenticationPrincipal User user) {
        product.setId(id);
        return ResponseEntity.ok(productService.updateProduct(product));
    }

    // Delete product (Admin only)
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProduct(@PathVariable Long id,
                                           @AuthenticationPrincipal User user) {
        productService.deleteProduct(id);
        return ResponseEntity.ok("Deleted successfully");
    }

    // Upload image
    @PostMapping("/upload")
    public ResponseEntity<String> uploadImage(@RequestParam("file") MultipartFile file) {
        try {
            String uploadDir = "uploads/";
            String filePath = uploadDir + file.getOriginalFilename();
            File dest = new File(filePath);
            dest.getParentFile().mkdirs();
            file.transferTo(dest);

            String imageUrl = "http://localhost:8080/" + filePath;
            return ResponseEntity.ok(imageUrl);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to upload image");
        }
    }
}