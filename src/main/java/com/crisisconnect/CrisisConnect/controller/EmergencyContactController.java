package com.crisisconnect.CrisisConnect.controller;

import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/emergency-contacts")
public class EmergencyContactController {

    @GetMapping
    public ResponseEntity<List<EmergencyContact>> getContacts() {
        List<EmergencyContact> contacts = List.of(
                new EmergencyContact("Police", "100"),
                new EmergencyContact("Ambulance", "108"),
                new EmergencyContact("Fire Brigade", "101"),
                new EmergencyContact("National Emergency Number", "112")
        );
        return ResponseEntity.ok(contacts);
    }

    @Data
    @AllArgsConstructor
    static class EmergencyContact {
        private String service;
        private String number;
    }

}