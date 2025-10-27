package com.CSC492.store.repository;

import com.CSC492.store.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Case-insensitive email lookup
    User findByEmailIgnoreCase(String email);
}