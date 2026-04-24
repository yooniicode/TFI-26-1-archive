package com.byby.backend.domain.hospital.repository;

import com.byby.backend.domain.hospital.entity.Hospital;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface HospitalRepository extends JpaRepository<Hospital, UUID> {

    Page<Hospital> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
