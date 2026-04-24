package com.byby.backend.domain.Interpreter.service;

import com.byby.backend.common.exception.BusinessException;
import com.byby.backend.common.exception.GeneralException;
import com.byby.backend.common.response.code.BusinessErrorCode;
import com.byby.backend.common.response.code.GeneralErrorCode;
import com.byby.backend.common.security.UserPrincipal;
import com.byby.backend.domain.Interpreter.dto.InterpreterRequest;
import com.byby.backend.domain.Interpreter.dto.InterpreterResponse;
import com.byby.backend.domain.Interpreter.entity.Interpreter;
import com.byby.backend.domain.Interpreter.repository.InterpreterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InterpreterService {

    private final InterpreterRepository interpreterRepository;

    @Transactional
    public InterpreterResponse.Detail create(InterpreterRequest.Create req, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        if (interpreterRepository.existsByAuthUserId(req.authUserId())) {
            throw new BusinessException(BusinessErrorCode.INTERPRETER_ALREADY_EXISTS);
        }
        Interpreter interpreter = Interpreter.builder()
                .authUserId(req.authUserId())
                .name(req.name())
                .phone(req.phone())
                .role(req.role())
                .languages(req.languages())
                .build();
        return InterpreterResponse.Detail.from(interpreterRepository.save(interpreter));
    }

    public Page<InterpreterResponse.Summary> getAll(Pageable pageable, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        return interpreterRepository.findAll(pageable).map(InterpreterResponse.Summary::from);
    }

    public InterpreterResponse.Detail getById(UUID id, UserPrincipal principal) {
        Interpreter interpreter = findInterpreter(id);
        if (!principal.isAdmin() && !interpreter.getAuthUserId().equals(principal.getAuthUserId())) {
            throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        }
        return InterpreterResponse.Detail.from(interpreter);
    }

    @Transactional
    public void deactivate(UUID id, UserPrincipal principal) {
        if (!principal.isAdmin()) throw new GeneralException(GeneralErrorCode.FORBIDDEN);
        findInterpreter(id).deactivate();
    }

    public Interpreter findInterpreter(UUID id) {
        return interpreterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(BusinessErrorCode.INTERPRETER_NOT_FOUND));
    }
}
