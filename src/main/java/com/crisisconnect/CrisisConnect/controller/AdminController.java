package com.crisisconnect.CrisisConnect.controller;

import com.crisisconnect.CrisisConnect.dto.AlertRequest;
import com.crisisconnect.CrisisConnect.dto.AnalyticsResponse;
import com.crisisconnect.CrisisConnect.entity.Alert;
import com.crisisconnect.CrisisConnect.entity.IncidentReport;
import com.crisisconnect.CrisisConnect.service.AlertService;
import com.crisisconnect.CrisisConnect.service.AnalyticsService;
import com.crisisconnect.CrisisConnect.service.IncidentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final IncidentReportService incidentReportService;
    private final AlertService alertService;
    private final AnalyticsService analyticsService;

    @GetMapping("/reports")
    public ResponseEntity<List<IncidentReport>> getAllReports() {
        return ResponseEntity.ok(incidentReportService.getAll());
    }

    @PutMapping("/reports/{id}/verify")
    public ResponseEntity<IncidentReport> verify(@PathVariable Long id) {
        return ResponseEntity.ok(incidentReportService.verify(id));
    }

    @PutMapping("/reports/{id}/reject")
    public ResponseEntity<IncidentReport> reject(@PathVariable Long id) {
        return ResponseEntity.ok(incidentReportService.reject(id));
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<IncidentReport> resolve(@PathVariable Long id) {
        return ResponseEntity.ok(incidentReportService.resolve(id));
    }

    @PostMapping("/alerts")
    public ResponseEntity<Alert> createAlert(@Valid @RequestBody AlertRequest request) {
        return ResponseEntity.ok(alertService.createAlert(request));
    }

    @GetMapping("/analytics")
    public ResponseEntity<AnalyticsResponse> getAnalytics() {
        return ResponseEntity.ok(analyticsService.getAnalytics());
    }

}
