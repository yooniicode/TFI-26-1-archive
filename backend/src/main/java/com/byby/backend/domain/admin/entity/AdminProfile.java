package com.byby.backend.domain.admin.entity;

import com.byby.backend.common.entity.BaseEntity;
import com.byby.backend.domain.center.entity.Center;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "admin_profile")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminProfile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID authUserId;

    @Column(length = 200)
    private String centerName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "center_id")
    private Center center;

    @Column(length = 100)
    private String nickname;

    @Builder
    public AdminProfile(UUID authUserId, String centerName, Center center, String nickname) {
        this.authUserId = authUserId;
        this.centerName = centerName;
        this.center = center;
        this.nickname = nickname;
    }

    public void update(Center center, String nickname) {
        this.center = center;
        this.centerName = center != null ? center.getName() : null;
        this.nickname = nickname;
    }

    public String getEffectiveCenterName() {
        return center != null ? center.getName() : centerName;
    }
}
