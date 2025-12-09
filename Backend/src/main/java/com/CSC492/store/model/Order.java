package com.CSC492.store.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class Order {

    public enum Status { PENDING, PROCESSING, COMPLETED, CANCELLED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @OneToMany( cascade = CascadeType.ALL, mappedBy = "order", orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    private List<OrderItem> orderItems;

    private BigDecimal totalPrice;

    @Enumerated(EnumType.STRING)
    private Status status;

    private LocalDateTime createdAt;

    public Order() {}

    public Order(User user, List<OrderItem> orderItems, Status status) {
        this.user = user;
        this.orderItems = orderItems;
        this.status = status;

        if (orderItems != null) {
            for (OrderItem item : orderItems) {
                item.setOrder(this);
            }
        }
        calculateTotalPrice();
    }

    @PrePersist
    @PreUpdate
    private void prePersistOrUpdate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        calculateTotalPrice();
    }

    public void calculateTotalPrice() {
        if (orderItems == null || orderItems.isEmpty()) {
            totalPrice = BigDecimal.ZERO;
        } else {
            totalPrice = orderItems.stream().map(OrderItem::calculateTotalPrice).reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }
    public void setUser(User user) {
        this.user = user;
    }

    public List<OrderItem> getOrderItems() {
        return orderItems;
    }
    public void setOrderItems(List<OrderItem> orderItems) {
        this.orderItems = orderItems;
        if (orderItems != null) {
            orderItems.forEach(item -> item.setOrder(this));
        }
        calculateTotalPrice();
    }

    public BigDecimal getTotalPrice() {
        return totalPrice;
    }

    public Status getStatus() {
        return status;
    }
    public void setStatus(Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}