package com.crisisconnect.CrisisConnect.dto;

import com.crisisconnect.CrisisConnect.enums.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String description;

    @NotNull
    private Category category;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    @NotBlank
    private String address;

    private String photoUrl;

}