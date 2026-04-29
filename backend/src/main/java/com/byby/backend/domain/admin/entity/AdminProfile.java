package com.byby.backend.domain.admin.entity;

import com.byby.backend.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

    @Column(length = 100)
    private String nickname;

    @Builder
    public AdminProfile(UUID authUserId, String centerName, String nickname) {
        this.authUserId = authUserId;
        this.centerName = centerName;
        this.nickname = nickname;
    }

    public void update(String centerName, String nickname) {
        this.centerName = centerName;
        this.nickname = nickname;
    }
}
