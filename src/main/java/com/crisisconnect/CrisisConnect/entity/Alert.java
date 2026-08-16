package com.crisisconnect.CrisisConnect.entity;

import com.crisisconnect.CrisisConnect.enums.Severity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(nullable = false)
    private String area;

    @Enumerated(EnumType.STRING)
    private Severity severity;

    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

}