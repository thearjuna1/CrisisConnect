package com.crisisconnect.CrisisConnect.repository;

import com.crisisconnect.CrisisConnect.entity.IncidentReport;
import com.crisisconnect.CrisisConnect.enums.*;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface IncidentReportRepository extends CrudRepository<IncidentReport, Long> {
    List<IncidentReport> findByStatus(Status status);

    List<IncidentReport> findByCategory(Category category);

    List<IncidentReport> findByUser_Id(Long userId);
    @Query("SELECT FUNCTION('DATE', r.createdAt), COUNT(r) " +
            "FROM IncidentReport r " +
            "GROUP BY FUNCTION('DATE', r.createdAt) " +
            "ORDER BY FUNCTION('DATE', r.createdAt)")
    List<Object[]> countReportsGroupedByDate();

}
