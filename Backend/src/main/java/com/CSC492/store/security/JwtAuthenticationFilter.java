package com.CSC492.store.security;

import com.CSC492.store.model.User;
import com.CSC492.store.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserService userService;

    public JwtAuthenticationFilter(JwtUtil jwtUtil, UserService userService) {
        this.jwtUtil = jwtUtil;
        this.userService = userService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        System.out.println("Incoming request: " + request.getMethod() + " " + request.getRequestURI());
        final String authHeader = request.getHeader("Authorization");
        System.out.println("Authorization header: " + authHeader);

        try {
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                final String token = authHeader.substring(7);
                final String email = jwtUtil.extractEmail(token);
                System.out.println("Extracted email from token: " + email);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    User user = userService.findByEmail(email);
                    if (user != null) {
                        System.out.println("User found: " + user.getEmail());
                    } else {
                        System.out.println("User found: null");
                    }

                    if (user != null && jwtUtil.validateToken(token, user.getEmail())) {
                        System.out.println("Token valid for user: " + user.getEmail());
                        System.out.println("Assigning authority: ROLE_" + user.getRole().name());

                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

                        UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);

                        System.out.println("Authentication context set for " + email);
                    } else {
                        System.out.println("Token invalid or user mismatch");
                    }
                }
            } else {
                System.out.println("No Bearer token found");
            }
        } catch (Exception e) {
            System.out.println("JWT validation failed: " + e.getMessage());
        }
        filterChain.doFilter(request, response);
    }
}