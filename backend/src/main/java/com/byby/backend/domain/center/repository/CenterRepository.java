package com.byby.backend.domain.center.repository;

import com.byby.backend.domain.center.entity.Center;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CenterRepository extends JpaRepository<Center, UUID> {

    Optional<Center> findByNameIgnoreCase(String name);
    Optional<Center> findByNameIgnoreCaseAndActiveTrue(String name);
    List<Center> findByActiveTrue();

    @Query("""
            SELECT c FROM Center c
            WHERE c.active = true
              AND (
                  :query IS NULL
                  OR :query = ''
                  OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(c.address, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR LOWER(COALESCE(c.phone, '')) LIKE LOWER(CONCAT('%', :query, '%'))
                  OR (
                      :compactQuery IS NOT NULL
                      AND :compactQuery <> ''
                      AND (
                          REPLACE(LOWER(c.name), ' ', '') LIKE CONCAT('%', :compactQuery, '%')
                          OR REPLACE(LOWER(COALESCE(c.address, '')), ' ', '') LIKE CONCAT('%', :compactQuery, '%')
                          OR REPLACE(REPLACE(LOWER(COALESCE(c.phone, '')), '-', ''), ' ', '') LIKE CONCAT('%', :compactQuery, '%')
                      )
                  )
              )
            ORDER BY c.name ASC
            """)
    Page<Center> searchActive(@Param("query") String query,
                              @Param("compactQuery") String compactQuery,
                              Pageable pageable);
}
