package com.byby.backend.common.response;

public record PageInfo(
        int page,
        int size,
        boolean hasNext,
        long totalElements,
        int totalPages
) {}