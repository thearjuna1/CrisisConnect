package com.crisisconnect.CrisisConnect.controller;

import com.crisisconnect.CrisisConnect.dto.IncidentRequest;
import com.crisisconnect.CrisisConnect.entity.IncidentReport;
import com.crisisconnect.CrisisConnect.enums.Category;
import com.crisisconnect.CrisisConnect.enums.Status;
import com.crisisconnect.CrisisConnect.security.UserPrincipal;
import com.crisisconnect.CrisisConnect.service.IncidentReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
public class IncidentController {

    private final IncidentReportService incidentReportService;

    // Guest + everyone: browse all incidents
    @GetMapping
    public ResponseEntity<List<IncidentReport>> getAll() {
        return ResponseEntity.ok(incidentReportService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncidentReport> getById(@PathVariable Long id) {
        return ResponseEntity.ok(incidentReportService.getById(id));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<IncidentReport>> getByStatus(@PathVariable Status status) {
        return ResponseEntity.ok(incidentReportService.getByStatus(status));
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<List<IncidentReport>> getByCategory(@PathVariable Category category) {
        return ResponseEntity.ok(incidentReportService.getByCategory(category));
    }

    // Citizen only (enforced by SecurityConfig: anyRequest().authenticated() covers POST here)
    @PostMapping
    public ResponseEntity<IncidentReport> create(@Valid @RequestBody IncidentRequest request,
                                                 @AuthenticationPrincipal UserPrincipal principal) {
        IncidentReport report = incidentReportService.createReport(request, principal.getUser());
        return ResponseEntity.ok(report);
    }

    // Citizen: their own report history
    @GetMapping("/my-reports")
    public ResponseEntity<List<IncidentReport>> myReports(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(incidentReportService.getByUser(principal.getId()));
    }

}