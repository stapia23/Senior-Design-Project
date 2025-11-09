package com.CSC492.store.controller;

import com.CSC492.store.dto.CheckoutItemDTO;
import com.CSC492.store.dto.CheckoutRequest;
import com.CSC492.store.model.User;
import com.stripe.Stripe;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    @Value("${stripe.success.url}")
    private String successUrl;

    @Value("${stripe.cancel.url}")
    private String cancelUrl;

    @PostMapping("/create-checkout-session")
    public ResponseEntity<?> createCheckoutSession(
            @RequestBody CheckoutRequest request,
            @AuthenticationPrincipal User user) {

        if (user == null) {
            return ResponseEntity.status(401).body("Unauthorized");
        }

        try {
            Stripe.apiKey = stripeSecretKey;

            if (request.getItems() == null || request.getItems().isEmpty()) {
                return ResponseEntity.badRequest().body("Items required");
            }

            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.PAYMENT)
                    .setSuccessUrl(successUrl)
                    .setCancelUrl(cancelUrl);

            for (CheckoutItemDTO item : request.getItems()) {

                if (item.getPrice() == null) {
                    return ResponseEntity.badRequest()
                            .body("Invalid price for productId=" + item.getProductId());
                }

                if (item.getQuantity() <= 0) {
                    return ResponseEntity.badRequest()
                            .body("Invalid quantity for productId=" + item.getProductId());
                }

                long unitAmountCents = item.getPrice()
                        .multiply(new BigDecimal("100"))
                        .longValue();

                builder.addLineItem(
                        SessionCreateParams.LineItem.builder()
                                .setQuantity((long) item.getQuantity())
                                .setPriceData(
                                        SessionCreateParams.LineItem.PriceData.builder()
                                                .setCurrency("usd")
                                                .setUnitAmount(unitAmountCents)
                                                .setProductData(
                                                        SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                                .setName(item.getName())
                                                                .build()
                                                )
                                                .build()
                                )
                                .build()
                );
            }

            Session session = Session.create(builder.build());

            return ResponseEntity.ok(
                    Map.of(
                            "url", session.getUrl(),
                            "sessionID", session.getId()
                    )
            );

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("Stripe error: " + e.getMessage());
        }
    }
}