package com.byby.backend.domain.interpreter.repository;

import com.byby.backend.domain.interpreter.entity.Interpreter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface InterpreterRepository extends JpaRepository<Interpreter, UUID> {

    Optional<Interpreter> findByAuthUserId(UUID authUserId);

    boolean existsByAuthUserId(UUID authUserId);
}
