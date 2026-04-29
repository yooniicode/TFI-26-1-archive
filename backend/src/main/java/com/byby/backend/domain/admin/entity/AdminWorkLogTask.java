package com.byby.backend.domain.admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AdminWorkLogTask {

    @Column(name = "content", nullable = false, length = 500)
    private String content;

    @Column(name = "checked", nullable = false)
    private boolean checked;

    public AdminWorkLogTask(String content, boolean checked) {
        this.content = content;
        this.checked = checked;
    }
}
