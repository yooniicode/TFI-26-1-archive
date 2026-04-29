package com.byby.backend.domain.admin.entity;

import com.byby.backend.common.entity.BaseEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "admin_work_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminWorkLog extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID authUserId;

    @Column(nullable = false)
    private LocalDate workDate;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @ElementCollection
    @CollectionTable(name = "admin_work_log_task", joinColumns = @JoinColumn(name = "work_log_id"))
    private List<AdminWorkLogTask> tasks = new ArrayList<>();

    @Builder
    public AdminWorkLog(UUID authUserId, LocalDate workDate, String memo, List<AdminWorkLogTask> tasks) {
        this.authUserId = authUserId;
        this.workDate = workDate;
        this.memo = memo;
        this.tasks = tasks != null ? new ArrayList<>(tasks) : new ArrayList<>();
    }

    public void update(LocalDate workDate, String memo, List<AdminWorkLogTask> tasks) {
        this.workDate = workDate;
        this.memo = memo;
        this.tasks.clear();
        if (tasks != null) this.tasks.addAll(tasks);
    }
}
