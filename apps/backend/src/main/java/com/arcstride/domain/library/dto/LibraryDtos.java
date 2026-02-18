package com.arcstride.domain.library.dto;

import com.arcstride.common.enums.Enums.AcquisitionType;
import com.arcstride.domain.library.entity.Store;
import com.arcstride.domain.library.entity.UserLibraryItem;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public final class LibraryDtos {
    private LibraryDtos() {}

    public record UpsertRequest(
            @NotNull Long storeId,
            AcquisitionType acquisitionType,
            String note
    ) {}

    public record LibraryItemResponse(
            Long titleId,
            Long storeId,
            AcquisitionType acquisitionType,
            String note,
            LocalDateTime updatedAt
    ) {
        public static LibraryItemResponse from(UserLibraryItem li) {
            return new LibraryItemResponse(
                    li.getTitle().getTitleId(),
                    li.getStore().getStoreId(),
                    li.getAcquisitionType(),
                    li.getNote(),
                    li.getUpdatedAt()
            );
        }
    }

    public record LibraryListItem(
            Long titleId,
            String titleOriginal,
            String titleType,
            Long storeId,
            String storeName,
            AcquisitionType acquisitionType,
            String note,
            LocalDateTime updatedAt
    ) {
        public static LibraryListItem from(UserLibraryItem li) {
            return new LibraryListItem(
                    li.getTitle().getTitleId(),
                    li.getTitle().getOriginalTitle(),
                    li.getTitle().getType().name(),
                    li.getStore().getStoreId(),
                    li.getStore().getName(),
                    li.getAcquisitionType(),
                    li.getNote(),
                    li.getUpdatedAt()
            );
        }
    }

    public record StoreItem(
            Long storeId,
            String name,
            String storeType,
            String url
    ) {
        public static StoreItem from(Store s) {
            return new StoreItem(s.getStoreId(), s.getName(), s.getStoreType(), s.getUrl());
        }
    }
}
