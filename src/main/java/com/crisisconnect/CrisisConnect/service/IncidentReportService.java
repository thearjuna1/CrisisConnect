package com.crisisconnect.CrisisConnect.service;

import com.crisisconnect.CrisisConnect.dto.AiAnalysisResult;
import com.crisisconnect.CrisisConnect.dto.IncidentRequest;
import com.crisisconnect.CrisisConnect.entity.IncidentReport;
import com.crisisconnect.CrisisConnect.entity.User;
import com.crisisconnect.CrisisConnect.enums.Category;
import com.crisisconnect.CrisisConnect.enums.Status;
import com.crisisconnect.CrisisConnect.exception.ResourceNotFoundException;
import com.crisisconnect.CrisisConnect.repository.IncidentReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentReportService {

    private final IncidentReportRepository incidentReportRepository;
    private final GeminiService geminiService;

    public IncidentReport createReport(IncidentRequest request, User reporter) {
        AiAnalysisResult aiResult = geminiService.analyzeIncident(request.getTitle(), request.getDescription());

        IncidentReport report = IncidentReport.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(request.getCategory() != null ? request.getCategory() : aiResult.getCategory())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .address(request.getAddress())
                .photoUrl(request.getPhotoUrl())
                .priority(aiResult.getPriority())
                .aiSummary(aiResult.getSummary())
                .safetyAdvice(aiResult.getSafetyAdvice())
                .status(Status.PENDING)
                .createdAt(LocalDateTime.now())
                .user(reporter)
                .build();

        return incidentReportRepository.save(report);
    }

    public List<IncidentReport> getAll() {
        return (List<IncidentReport>) incidentReportRepository.findAll();
    }

    public IncidentReport getById(Long id) {
        return incidentReportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found: " + id));
    }

    public List<IncidentReport> getByStatus(Status status) {
        return incidentReportRepository.findByStatus(status);
    }

    public List<IncidentReport> getByCategory(Category category) {
        return incidentReportRepository.findByCategory(category);
    }

    public List<IncidentReport> getByUser(Long userId) {
        return incidentReportRepository.findByUser_Id(userId);
    }

    public IncidentReport verify(Long id) {
        return updateStatus(id, Status.VERIFIED);
    }

    public IncidentReport reject(Long id) {
        return updateStatus(id, Status.REJECTED);
    }

    public IncidentReport resolve(Long id) {
        IncidentReport report = getById(id);
        report.setStatus(Status.RESOLVED);
        report.setResolvedAt(LocalDateTime.now());
        report.setUpdatedAt(LocalDateTime.now());
        return incidentReportRepository.save(report);
    }

    private IncidentReport updateStatus(Long id, Status status) {
        IncidentReport report = getById(id);
        report.setStatus(status);
        report.setUpdatedAt(LocalDateTime.now());
        return incidentReportRepository.save(report);
    }

}