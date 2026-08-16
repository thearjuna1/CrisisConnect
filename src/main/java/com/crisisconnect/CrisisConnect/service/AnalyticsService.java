package com.crisisconnect.CrisisConnect.service;

import com.crisisconnect.CrisisConnect.dto.AnalyticsResponse;
import com.crisisconnect.CrisisConnect.entity.IncidentReport;
import com.crisisconnect.CrisisConnect.enums.Category;
import com.crisisconnect.CrisisConnect.enums.Status;
import com.crisisconnect.CrisisConnect.repository.IncidentReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.sql.Date;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final IncidentReportRepository incidentReportRepository;

    public AnalyticsResponse getAnalytics() {
        List<IncidentReport> allReports = (List<IncidentReport>) incidentReportRepository.findAll();

        long total = allReports.size();
        long pending = countByStatus(allReports, Status.PENDING);
        long verified = countByStatus(allReports, Status.VERIFIED);
        long resolved = countByStatus(allReports, Status.RESOLVED);
        long rejected = countByStatus(allReports, Status.REJECTED);

        Map<String, Long> byCategory = buildCategoryCounts(allReports);
        List<AnalyticsResponse.DailyCount> overTime = buildDailyCounts();

        return new AnalyticsResponse(total, pending, verified, resolved, rejected, byCategory, overTime);
    }

    private long countByStatus(List<IncidentReport> reports, Status status) {
        return reports.stream().filter(r -> r.getStatus() == status).count();
    }

    private Map<String, Long> buildCategoryCounts(List<IncidentReport> reports) {
        Map<String, Long> counts = new LinkedHashMap<>();

        for (Category category : Category.values()) {
            counts.put(category.name(), 0L);
        }

        Map<String, Long> actual = reports.stream()
                .filter(r -> r.getCategory() != null)
                .collect(Collectors.groupingBy(r -> r.getCategory().name(), Collectors.counting()));

        counts.putAll(actual);
        return counts;
    }

    private List<AnalyticsResponse.DailyCount> buildDailyCounts() {
        List<Object[]> raw = incidentReportRepository.countReportsGroupedByDate();

        return raw.stream()
                .map(row -> new AnalyticsResponse.DailyCount(
                        row[0].toString(),
                        ((Number) row[1]).longValue()
                ))
                .collect(Collectors.toList());
    }

}