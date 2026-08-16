package com.crisisconnect.CrisisConnect.controller;

import com.crisisconnect.CrisisConnect.dto.AlertRequest;
import com.crisisconnect.CrisisConnect.entity.Alert;
import com.crisisconnect.CrisisConnect.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    @GetMapping
    public ResponseEntity<List<Alert>> getActive() {
        return ResponseEntity.ok(alertService.getActiveAlerts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getById(@PathVariable Long id) {
        return ResponseEntity.ok(alertService.getById(id));
    }

}