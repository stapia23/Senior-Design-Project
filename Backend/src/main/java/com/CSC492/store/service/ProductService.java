package com.CSC492.store.service;

import com.CSC492.store.model.Order;
import com.CSC492.store.model.OrderItem;
import com.CSC492.store.model.Product;
import com.CSC492.store.model.ProductReview;
import com.CSC492.store.repository.OrderRepository;
import com.CSC492.store.repository.ProductRepository;
import com.CSC492.store.repository.ProductReviewRepository;
import com.CSC492.store.util.ProductAlgorithms;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductReviewRepository productReviewRepository;
    private final OrderRepository orderRepository;

    @Autowired
    public ProductService(ProductRepository productRepository, ProductReviewRepository productReviewRepository, OrderRepository orderRepository) {
        this.productRepository = productRepository;
        this.productReviewRepository = productReviewRepository;
        this.orderRepository = orderRepository;
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
    public Page<Product> getProducts( String category, String search, BigDecimal minPrice, BigDecimal maxPrice, Boolean inStock, int page, int size, String sortBy, String sortDir) {
        // load all products from the database into a list
        List<Product> rawList = productRepository.findAll();

        // category filter
        // if a category was provided, remove the products that do not match it
        if (category != null && !category.isEmpty()) {
            for (int i = 0; i < rawList.size(); i++) {
                Product p = rawList.get(i);
                if (!p.getCategory().equalsIgnoreCase(category)) {
                    rawList.remove(i);
                    i--; // step back since list shrinks
                }
            }
        }

        // price range filter
        // remove products with price lower than minPrice
        if (minPrice != null) {
            for (int i = 0; i < rawList.size(); i++) {
                Product p = rawList.get(i);
                if (p.getPrice().compareTo(minPrice) < 0) {
                    rawList.remove(i);
                    i--;
                }
            }
        }

        // remove products with price higher than maxPrice
        if (maxPrice != null) {
            for (int i = 0; i < rawList.size(); i++) {
                Product p = rawList.get(i);
                if (p.getPrice().compareTo(maxPrice) > 0) {
                    rawList.remove(i);
                    i--;
                }
            }
        }

        // stock filter
        if (inStock != null) {
            // if inStock is true, keep only products that are in stock
            if (inStock) {
                for (int i = 0; i < rawList.size(); i++) {
                    Product p = rawList.get(i);
                    if (p.getStock() <= 0) {
                        rawList.remove(i);
                        i--;
                    }
                }
            }
            // if inStock is false, keep only products that are out of stock
            else {
                for (int i = 0; i < rawList.size(); i++) {
                    Product p = rawList.get(i);
                    if (p.getStock() > 0) {
                        rawList.remove(i);
                        i--;
                    }
                }
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
        // Sort by price
        if (sortBy != null && sortBy.equals("price")) {
            comparator = Comparator.comparing(Product::getPrice);
        }
        // Sort by newest
        else if (sortBy != null && sortBy.equals("newest")) {
            comparator = Comparator.comparing(Product::getId).reversed();
        }
        // Default: sort by ID
        else {
            comparator = Comparator.comparing(Product::getId);
        }

        // If the user requested "desc", reverse the comparator
        if (sortDir != null && sortDir.equals("desc")) {
            comparator = comparator.reversed();
        }

        // Sort the filtered list using mergeSort()
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


    // Recommendation Algorithms

    // Rating-Based/Popuplarity-Based
    // first, get all reviews
    // second, for each product, get the avgerage rating
    // third, sort products by average rating using Merge Sort descend
    // then return top n products
    // Time Complexity: O(n log n)
    public List<Product> getTopRatedProducts (int n) {
        // get all products from the database
        List<Product> products = productRepository.findAll();

        if (products.isEmpty()) {
            return List.of();
        }
        // get all product reviews from databse to calculate average rating for each product
        List<ProductReview> allReviews = productReviewRepository.findAll();

        // use Map because we can to get product ID and track how many reviews that product has
        Map<Long, Integer> count = new HashMap<>();

        // this Map is to hold the Sum of all ratings for each product, helps to get the average
        Map<Long, Integer> sum = new HashMap<>();

        // loop to go through each review
        for (ProductReview review : allReviews) {
            // ignore reviews that are missing a product ID
            if (review.getProduct() == null || review.getProduct().getId() == null) {
                continue;
            }
            // get the product ID, which is used for the map key
            Long productId = review.getProduct().getId();

            // get the rating value
            int rating = review.getRating();

            // Add rating to the sum for that product
            // using getORDefault helps start from 0 if the product is not yet in the map
            sum.put(productId, sum.getOrDefault(productId, 0) + rating);

            // increase the number of reviews counted for that product
            count.put(productId, count.getOrDefault(productId, 0) + 1);
        }

        // after getting the sums and counts, get the average rating
        // use map to store the productId and that product's average rating
        Map<Long, Double> avgRating = new HashMap<>();

        // loop through all productIds in sum Map to get the averages
        for (Map.Entry<Long, Integer> entry : sum.entrySet()) {
            Long productId = entry.getKey(); // gets productId
            int sumRating = entry.getValue();      // gets rating sum
            int countRating = count.get(productId); // number of reviews
            avgRating.put(productId, (double)sumRating / countRating); // get average for that product
        }

        // sort products by average rating
        // use comparator to sort, 
        // first higher average rating first(descending)
        // second if the same average rating then by newer product first, higher Id
        Comparator<Product> ratingDescending = new Comparator<Product>() {
            @Override
            public int compare(Product product1, Product product2) {

                // get average rating or 0 if none
                double rating1 = avgRating.getOrDefault(product1.getId(), 0.0);
                double rating2 = avgRating.getOrDefault(product2.getId(), 0.0);

                // compare ratings descending
                int compare = Double.compare(rating2, rating1);
                if (compare != 0) {
                    return compare;
                }

                // If ratings equal, sort by ID descending (newer first)
                Long id1;
                if (product1.getId() != null) {
                    id1 = product1.getId();
                } else {
                    id1 = 0L;
                }

                Long id2;
                if (product2.getId() != null) {
                    id2 = product2.getId();
                } else {
                    id2 = 0L;
                }

                return Long.compare(id2, id1);
            }
        };

        // use MergeSort to sort
        List<Product> sorted = ProductAlgorithms.mergeSort(products, ratingDescending);

        // return the top n products
        // if the limit is invalid or too large, return all sorting products
        if (n <= 0 || n >= sorted.size()) {
            return sorted;
        }

        // otherwise return only the top N highest rated products
        return sorted.subList(0, n);
    }

    // Personalized Recommendations for a customer
    // first, looks at the user's past orders and order items
    // second, count how many times each category appears in their purchases
    // third, build a potential list of products, not already purchased by user, and stock > 0
    // fourth, check the products by higher category check count, higher average rating, newer productId
    // fifth, sort and return top n products
    // for the time complexity, it would be O(n log n)
    public List<Product> getRecommendationsForUser(Long userId, int n) {
        // if no user id was provided fall back to other recommendations
        if (userId == null) {
            return getTopRatedProducts(n);
        }

        // get all orders for the given user to see what they have purchased
        List<Order> userOrders = orderRepository.findByUserId(userId);

        // if user has no purchase history, fall back
        if (userOrders == null || userOrders.isEmpty()) {
            return getTopRatedProducts(n);
        }

        // get build sets and maps
        // use Set because it helps avoid duplicates(user may buy the same product)
        Set<Long> purchasedProductIds = new HashSet<>();

        // use Map because helps for counting category in orders
        // uses category name for key and stores value of how many times user bought from that category
        Map<String, Integer> categoryMap = new HashMap<>();

        // loop throught each order to see and get user purchase behavior
        for (Order order : userOrders) {
            if (order.getOrderItems() == null) {
                continue;
            }
            for (OrderItem item : order.getOrderItems()) {
                Product product = item.getProduct();

                // skip invalid items to avoid null
                if (product == null || product.getId() == null) {
                    continue;
                }

                // track product ids so we do not recommened already purchased products
                purchasedProductIds.add(product.getId());
                String category;
                if (product.getCategory() != null){
                    category = product.getCategory();
                } else {
                    category = "Uncategorized";
                }

                // count how often the user buys from each category
                categoryMap.put(category, categoryMap.getOrDefault(category, 0) + 1);
            }
        }

        // build average rating map
        // get all product reviews to calculate average rating for each product
        List<ProductReview> allReviews = productReviewRepository.findAll();

        // use Map because we can to get product ID and track how many reviews that product has
        Map<Long, Integer> countMap = new HashMap<>();

        // this Map is to hold the Sum of all ratings for each product, helps to get the average
        Map<Long, Integer> sumMap = new HashMap<>();

        // loop to go through each review
        for (ProductReview review : allReviews) {
            // ignore reviews that are missing a product ID
            if (review.getProduct() == null || review.getProduct().getId() == null) {
                continue;
            }

            // get the product ID, which is used for the map key
            Long productId = review.getProduct().getId();

            // get the rating value
            int rating = review.getRating();

            // Add rating to the sum for that product
            // using getORDefault helps start from 0 if the product is not yet in the map
            sumMap.put(productId, sumMap.getOrDefault(productId, 0) + rating);

            // increase the number of reviews counted for that product
            countMap.put(productId, countMap.getOrDefault(productId, 0) + 1);
        }

        // after getting the sums and counts, get the average rating
        // use map to store the productId and that product's average rating
        Map<Long, Double> avgRatingMap = new HashMap<>();

        // loop through all productIds in sum Map to get the averages, average rating = sum / count
        for (Map.Entry<Long, Integer> entry : sumMap.entrySet()) {
            Long productId = entry.getKey(); // gets productId
            int sum = entry.getValue();      // gets rating sum
            int count = countMap.get(productId); // number of reviews
            avgRatingMap.put(productId, (double)sum / count); // get average for that product
        }

        // build list of potential products
        // get all products to filter which ones to consider
        List<Product> allProducts = productRepository.findAll();

        // filter by exclude products already purchased and out of stock products
        List<Product> potentials = new ArrayList<>();
        for (Product p : allProducts) {
            // make sure product is valid
            if (p.getId() == null) {
                continue;
            }

            // avoid already purchased products
            if (purchasedProductIds.contains(p.getId())) {
                continue;
            }

            // product must be in stock
            if (p.getStock() == null || p.getStock() <= 0) {
                continue;
            }

            // if all checks passed, add to result list
            potentials.add(p);
        }

        // if no potentails exit, fall back
        if (potentials.isEmpty()) {
            return getTopRatedProducts(n);
        }

        // sort potential products by category, average rating, and newer productId
        Comparator<Product> userScore = new Comparator<Product>() {
            @Override
            public int compare(Product product1, Product product2) {

                // Extract category (or default)
                String category1;
                if (product1.getCategory() != null) {
                    category1 = product1.getCategory();
                } else {
                    category1 = "Uncategorized";
                }

                String category2;
                if (product2.getCategory() != null) {
                    category2 = product2.getCategory();
                } else {
                    category2 = "Uncategorized";
                }

                // Category count (how many times user bought from this category)
                int cM1 = categoryMap.getOrDefault(category1, 0);
                int cM2 = categoryMap.getOrDefault(category2, 0);

                // Sort category descending
                int compare = Integer.compare(cM2, cM1);
                if (compare != 0) {
                    return compare;
                }

                // Sort average rating descending
                double rating1 = avgRatingMap.getOrDefault(product1.getId(), 0.0);
                double rating2 = avgRatingMap.getOrDefault(product2.getId(), 0.0);

                compare = Double.compare(rating2, rating1);
                if (compare != 0) {
                    return compare;
                }

                // Sort by newer product ID first
                Long id1;
                if (product1.getId() != null) {
                    id1 = product1.getId();
                } else {
                    id1 = 0L;
                }

                Long id2;
                if (product2.getId() != null) {
                    id2 = product2.getId();
                } else {
                    id2 = 0L;
                }

                return Long.compare(id2, id1);
            }
        };

        // sort potential products using the merge sort
        List<Product> sortedPotentials = ProductAlgorithms.mergeSort(potentials, userScore);

        // return top n products
        // if n is larger than list size or invalid, return all products
        if (n <= 0 || n >= sortedPotentials.size()) {
            return sortedPotentials;
        }

        // return only the n number of top product recommendations
        return sortedPotentials.subList(0, n);
    }
}