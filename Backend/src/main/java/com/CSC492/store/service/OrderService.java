package com.CSC492.store.service;

import com.CSC492.store.model.Order;
import com.CSC492.store.model.OrderItem;
import com.CSC492.store.model.User;
import com.CSC492.store.repository.OrderRepository;
import com.CSC492.store.repository.OrderItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Autowired
    public OrderService (OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public Order createOrder (Order order) {
        // makes sure each OrderItem connects back to the order
        if (order.getOrderItems() != null) {
            order.getOrderItems().forEach(item -> item.setOrder(order));
        }
        order.calculateTotalPrice();
        return orderRepository.save(order);
    }

    // get all orders for a user
    public List<Order> getOrdersByUser(User user) {
        return orderRepository.findByUser(user);
    }

    // get all orders for admin
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    // get order by ID
    public Optional<Order> getOrderById(Long id) {
        return orderRepository.findById(id);
    }

    // update order status
    public Order updateStatus (Long orderId, Order.Status status) throws Exception {
        Order order = orderRepository.findById(orderId).orElseThrow( () -> new Exception("Order not found"));
        return orderRepository.save(order);
    }
}