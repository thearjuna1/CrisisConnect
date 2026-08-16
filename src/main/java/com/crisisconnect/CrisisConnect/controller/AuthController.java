package com.crisisconnect.CrisisConnect.controller;

import com.crisisconnect.CrisisConnect.dto.AuthResponse;
import com.crisisconnect.CrisisConnect.dto.LoginRequest;
import com.crisisconnect.CrisisConnect.dto.RegisterRequest;
import com.crisisconnect.CrisisConnect.entity.User;
import com.crisisconnect.CrisisConnect.security.JwtUtil;
import com.crisisconnect.CrisisConnect.security.UserPrincipal;
import com.crisisconnect.CrisisConnect.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(request);
        String token = jwtUtil.generateToken(new UserPrincipal(user));
        return ResponseEntity.ok(new AuthResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userService.login(request);
        String token = jwtUtil.generateToken(new UserPrincipal(user));
        return ResponseEntity.ok(new AuthResponse(token));
    }

}