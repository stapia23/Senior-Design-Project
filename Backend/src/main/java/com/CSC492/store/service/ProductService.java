package com.CSC492.store.service;

import com.CSC492.store.model.Product;
import com.CSC492.store.repository.ProductRepository;
import com.CSC492.store.util.ProductAlgorithms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    @Autowired
    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Product createProduct(Product product) {
        if (product.getImageUrl() == null) {
            product.setImageUrl("");
        }
        if (product.getCategory() == null) {
            product.setCategory("Uncategorized");
        }
        return productRepository.save(product);
    }

    public Optional<Product> getProductById(Long id) {
        return productRepository.findById(id);
    }

    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    public void deleteProduct(Long id) {
        productRepository.deleteById(id);
    }

    public Product updateProduct(Product product) {
        if (product.getImageUrl() == null) { 
            product.setImageUrl("");
        }
        return productRepository.save(product);
    }

    // method to get products with filtering, searching, sorting and pagination
    public Page<Product> getProducts( String category, String search, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock, int page,
                    int size, String sortBy, String sortDir) {
        // load all products from the database into a list
        List<Product> rawList = productRepository.findAll();

        // category filter
        // if a category was provided, remove the products that do not match it
        if (category != null && !category.isEmpty()) {
            rawList.removeIf(p -> !p.getCategory().equalsIgnoreCase(category));
        }

        // price range filter
        // remove products with price lower than minPrice
        if (minPrice != null) {
            rawList.removeIf(p -> p.getPrice().compareTo(minPrice) < 0);
        }
        // remove products with price higher than maxPrice
        if (maxPrice != null) {
            rawList.removeIf(p -> p.getPrice().compareTo(maxPrice) > 0);
        }

        // stock filter
        if (inStock != null) {
            // if inStock is true, keep only products that are in stock
            if (inStock) {
                rawList.removeIf(p -> p.getStock() <= 0);
            }
            // if inStock is false, keep only products that are out of stock
            else {
                rawList.removeIf(p -> p.getStock() > 0);
            }
        }

        // Search by using Binary Search, works on list sorted by name
        if (search != null && !search.isEmpty()) {
            // first is to sort products alphabetically before using binary search
            rawList.sort(Comparator.comparing(Product::getName, String.CASE_INSENSITIVE_ORDER));

            // use binarySearch() method to find matching names
            List<Product> results = ProductAlgorithms.binarySearch(rawList, search.toLowerCase());

            // if binary search found nothing then use linear search, for backup
            // helps with partial words
            if ( results.isEmpty()) {
                for (Product p : rawList) {
                    if (p.getName().toLowerCase().contains(search.toLowerCase())) {
                        results.add(p);
                    }
                }
            }
            // replace the rawlist with only the results from the search
            rawList = results;
        }

        // Sort by using Merge Sort
        // create a comparator based on what the user selects for the sort field, price or newest
        Comparator<Product> comparator = null;
        switch (sortBy) {
            case "price":
                comparator = Comparator.comparing(Product::getPrice);
                break;
            case "newest":
                comparator = Comparator.comparing(Product::getId).reversed();
                break;
            default:
                // default sorting to ascending by ID
                comparator = Comparator.comparing(Product::getId);
                break;
        }
        // if the user requested "desc" reverse the comparator
        if (sortDir.equals("desc")) {
            comparator = comparator.reversed();
        }
        // here use mergeSort() method to sort the filtered list
        rawList = ProductAlgorithms.mergeSort(rawList, comparator);

        // pagination
        // convert list to page
        // get where the page begins
        int start = page * size;
        // get where page ends but can not pass the list size
        int end = Math.min(start + size, rawList.size());

        List<Product> pageContent;
        // if the start index is beyond the list size then return an empty list
        if (start > rawList.size()) {
            pageContent = List.of();
        // otherwise, return the sublist for pagination
        } else {
            pageContent = rawList.subList(start, end);
        }
        // return the paginated result as a page object
        return new PageImpl<>(pageContent, PageRequest.of(page, size), rawList.size());
    }

    // get all products of a given category from DB
    public List<Product> getByCategory(String category) {
        return productRepository.findByCategoryIgnoreCase(category);
    }
}
