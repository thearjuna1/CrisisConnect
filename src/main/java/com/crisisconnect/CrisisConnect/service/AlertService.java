package com.crisisconnect.CrisisConnect.service;

import com.crisisconnect.CrisisConnect.dto.AlertRequest;
import com.crisisconnect.CrisisConnect.entity.Alert;
import com.crisisconnect.CrisisConnect.exception.ResourceNotFoundException;
import com.crisisconnect.CrisisConnect.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AlertService {

    private final AlertRepository alertRepository;

    public Alert createAlert(AlertRequest request) {
        Alert alert = Alert.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .area(request.getArea())
                .severity(request.getSeverity())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusHours(request.getValidForHours()))
                .build();

        return alertRepository.save(alert);
    }

    public List<Alert> getActiveAlerts() {
        return alertRepository.findByExpiresAtAfter(LocalDateTime.now());
    }

    public List<Alert> getAll() {
        return alertRepository.findAll();
    }

    public Alert getById(Long id) {
        return alertRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Alert not found: " + id));
    }

}