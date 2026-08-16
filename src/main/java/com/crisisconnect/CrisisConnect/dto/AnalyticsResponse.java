package com.crisisconnect.CrisisConnect.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {

    private long totalReports;
    private long pendingReports;
    private long verifiedReports;
    private long resolvedReports;
    private long rejectedReports;

    private Map<String, Long> reportsByCategory;
    private List<DailyCount> reportsOverTime;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyCount {
        private String date;
        private long count;
    }

}