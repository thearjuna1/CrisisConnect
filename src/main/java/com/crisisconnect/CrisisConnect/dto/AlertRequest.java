package com.crisisconnect.CrisisConnect.dto;

import com.crisisconnect.CrisisConnect.enums.Severity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AlertRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotBlank
    private String area;

    @NotNull
    private Severity severity;

    @NotNull
    private Integer validForHours;

}