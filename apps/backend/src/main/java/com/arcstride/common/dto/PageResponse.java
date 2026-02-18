package com.arcstride.common.dto;

import java.util.List;

public record PageResponse<T>(
        PageMeta page,
        List<T> items
) {
    public record PageMeta(int number, int size, long totalElements, int totalPages) {}

    public static <T> PageResponse<T> of(org.springframework.data.domain.Page<T> springPage) {
        return new PageResponse<>(
                new PageMeta(
                        springPage.getNumber(),
                        springPage.getSize(),
                        springPage.getTotalElements(),
                        springPage.getTotalPages()
                ),
                springPage.getContent()
        );
    }

    public static <T, S> PageResponse<T> of(org.springframework.data.domain.Page<S> springPage, List<T> mappedItems) {
        return new PageResponse<>(
                new PageMeta(
                        springPage.getNumber(),
                        springPage.getSize(),
                        springPage.getTotalElements(),
                        springPage.getTotalPages()
                ),
                mappedItems
        );
    }
}
