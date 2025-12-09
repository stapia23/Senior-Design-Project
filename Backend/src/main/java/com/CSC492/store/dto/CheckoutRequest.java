package com.CSC492.store.dto;

import java.util.List;
public class CheckoutRequest {
    private List<CheckoutItemDTO> items;

    public List<CheckoutItemDTO> getItems() {
        return items;
    }
    public void setItems(List<CheckoutItemDTO> items) {
        this.items = items;
    }
}