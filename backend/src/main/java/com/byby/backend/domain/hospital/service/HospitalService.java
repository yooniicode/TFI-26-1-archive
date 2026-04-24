package com.byby.backend.domain.hospital.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.domain.hospital.dto.HospitalRequest;
import com.byby.backend.domain.hospital.dto.HospitalResponse;
import com.byby.backend.domain.hospital.entity.Hospital;
import com.byby.backend.domain.hospital.repository.HospitalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HospitalService {

    private final HospitalRepository hospitalRepository;

    @Transactional
    public HospitalResponse.Summary create(HospitalRequest.Create req) {
        Hospital hospital = Hospital.builder()
                .name(req.name())
                .address(req.address())
                .phone(req.phone())
                .build();
        return HospitalResponse.Summary.from(hospitalRepository.save(hospital));
    }

    public Page<HospitalResponse.Summary> search(String name, Pageable pageable) {
        if (StringUtils.hasText(name)) {
            return hospitalRepository.findByNameContainingIgnoreCase(name, pageable)
                    .map(HospitalResponse.Summary::from);
        }
        return hospitalRepository.findAll(pageable).map(HospitalResponse.Summary::from);
    }

    public HospitalResponse.Summary getById(UUID id) {
        return HospitalResponse.Summary.from(hospitalRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.HOSPITAL_NOT_FOUND)));
    }
}
