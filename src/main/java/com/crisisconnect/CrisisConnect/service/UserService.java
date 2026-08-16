package com.crisisconnect.CrisisConnect.service;

import com.crisisconnect.CrisisConnect.dto.LoginRequest;
import com.crisisconnect.CrisisConnect.dto.RegisterRequest;
import com.crisisconnect.CrisisConnect.entity.User;
import com.crisisconnect.CrisisConnect.enums.Role;
import com.crisisconnect.CrisisConnect.exception.DuplicateResourceException;
import com.crisisconnect.CrisisConnect.exception.ResourceNotFoundException;
import com.crisisconnect.CrisisConnect.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public User register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CITIZEN)
                .createdAt(LocalDateTime.now())
                .build();

        return userRepository.save(user);
    }

    public User login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResourceNotFoundException("Invalid email or password");
        }

        return user;
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
    }

}