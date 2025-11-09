package com.CSC492.store.service;

import com.CSC492.store.dto.CheckoutItemDTO;
import com.CSC492.store.model.Order;
import com.CSC492.store.model.OrderItem;
import com.CSC492.store.model.Product;
import com.CSC492.store.model.User;
import com.CSC492.store.repository.OrderItemRepository;
import com.CSC492.store.repository.OrderRepository;
import com.CSC492.store.repository.ProductRepository;

import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;

    @Autowired
    public OrderService(OrderRepository orderRepository,
                        OrderItemRepository orderItemRepository,
                        ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.productRepository = productRepository;
    }

    // order save
    @Transactional
    public Order createOrder(Order order) {
        if (order.getOrderItems() != null) {
            order.getOrderItems().forEach(item -> item.setOrder(order));
        }
        order.calculateTotalPrice();
        return orderRepository.save(order);
    }

    // Create order from Stripe checkout success
    @Transactional
    public Order createOrderFromItems(User user,
                                      List<CheckoutItemDTO> items,
                                      Order.Status initialStatus) throws Exception {

        if (user == null) throw new Exception("User required");
        if (items == null || items.isEmpty()) throw new Exception("Items required");

        Order order = new Order();
        order.setUser(user);
        order.setStatus(initialStatus);
        order.setOrderItems(new ArrayList<>());

        for (CheckoutItemDTO dto : items) {

            Product product = productRepository.findById(dto.getProductId())
                    .orElseThrow(() -> new Exception("Product not found: " + dto.getProductId()));

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setProduct(product);

            oi.setQuantity(dto.getQuantity() > 0 ? dto.getQuantity() : 1);

            BigDecimal finalPrice =
                    dto.getPrice() != null ? dto.getPrice() : product.getPrice();

            oi.setPrice(finalPrice);

            order.getOrderItems().add(oi);
        }

        order.calculateTotalPrice();
        return orderRepository.save(order);
    }

    // Get orders for a specific user
    @Transactional
    public List<Order> getOrdersByUser(User user) {
        List<Order> orders = orderRepository.findByUser(user);
        orders.forEach(o -> o.getOrderItems().size());
        return orders;
    }

    // Get all orders (admin)
    @Transactional
    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAll();
        orders.forEach(o -> o.getOrderItems().size());
        return orders;
    }

    // Get order by ID
    @Transactional
    public Optional<Order> getOrderById(Long id) {
        Optional<Order> opt = orderRepository.findById(id);
        opt.ifPresent(o -> o.getOrderItems().size());
        return opt;
    }

    // order status
    @Transactional
    public Order updateStatus(Long orderId, Order.Status status) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new Exception("Order not found"));
        order.setStatus(status);
        return orderRepository.save(order);
    }
}