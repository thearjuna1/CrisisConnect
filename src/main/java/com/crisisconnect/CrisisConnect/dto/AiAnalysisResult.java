package com.crisisconnect.CrisisConnect.dto;

import com.crisisconnect.CrisisConnect.enums.Category;
import com.crisisconnect.CrisisConnect.enums.Priority;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AiAnalysisResult {

    private Category category;
    private Priority priority;
    private String summary;
    private String safetyAdvice;

}