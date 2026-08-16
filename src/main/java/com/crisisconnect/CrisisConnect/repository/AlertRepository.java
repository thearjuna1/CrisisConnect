package com.crisisconnect.CrisisConnect.repository;

import com.crisisconnect.CrisisConnect.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {
    List<Alert> findByExpiresAtAfter(LocalDateTime now);
}
