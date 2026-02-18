package com.arcstride.domain.library.service;

import com.arcstride.common.enums.Enums.AcquisitionType;
import com.arcstride.common.enums.Enums.TitleType;
import com.arcstride.common.exception.ApiException;
import com.arcstride.domain.library.dto.LibraryDtos;
import com.arcstride.domain.library.entity.Store;
import com.arcstride.domain.library.entity.UserLibraryItem;
import com.arcstride.domain.library.repository.LibraryItemRepository;
import com.arcstride.domain.library.repository.StoreRepository;
import com.arcstride.domain.title.entity.Title;
import com.arcstride.domain.title.repository.TitleRepository;
import com.arcstride.domain.user.entity.User;
import com.arcstride.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryItemRepository libraryItemRepository;
    private final StoreRepository storeRepository;
    private final TitleRepository titleRepository;
    private final UserRepository userRepository;

    @Transactional
    public LibraryDtos.LibraryItemResponse upsert(Long userId, Long titleId, LibraryDtos.UpsertRequest req) {
        Title title = titleRepository.findById(titleId)
                .orElseThrow(() -> ApiException.notFound("작품을 찾을 수 없습니다."));
        Store store = storeRepository.findById(req.storeId())
                .orElseThrow(() -> ApiException.notFound("스토어를 찾을 수 없습니다."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        UserLibraryItem item = libraryItemRepository.findByUser_UserIdAndTitle_TitleId(userId, titleId)
                .orElseGet(() -> UserLibraryItem.builder()
                        .user(user)
                        .title(title)
                        .store(store)
                        .build());

        item.setStore(store);
        item.setAcquisitionType(req.acquisitionType() != null ? req.acquisitionType() : AcquisitionType.PURCHASE);
        item.setNote(req.note());

        item = libraryItemRepository.save(item);
        return LibraryDtos.LibraryItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public LibraryDtos.LibraryItemResponse getOne(Long userId, Long titleId) {
        UserLibraryItem item = libraryItemRepository.findByUser_UserIdAndTitle_TitleId(userId, titleId)
                .orElseThrow(() -> ApiException.notFound("소장 정보를 찾을 수 없습니다."));
        return LibraryDtos.LibraryItemResponse.from(item);
    }

    @Transactional(readOnly = true)
    public Page<LibraryDtos.LibraryListItem> list(Long userId, String type, Pageable pageable) {
        TitleType titleType = parseTitleType(type);
        return libraryItemRepository.findByUserFiltered(userId, titleType, pageable)
                .map(LibraryDtos.LibraryListItem::from);
    }

    @Transactional(readOnly = true)
    public Page<LibraryDtos.LibraryListItem> search(Long userId, String q, String type, Pageable pageable) {
        TitleType titleType = parseTitleType(type);
        return libraryItemRepository.searchByUser(userId, titleType, q, pageable)
                .map(LibraryDtos.LibraryListItem::from);
    }

    @Transactional
    public void delete(Long userId, Long titleId) {
        UserLibraryItem item = libraryItemRepository.findByUser_UserIdAndTitle_TitleId(userId, titleId)
                .orElseThrow(() -> ApiException.notFound("소장 정보를 찾을 수 없습니다."));
        libraryItemRepository.delete(item);
    }

    @Transactional(readOnly = true)
    public List<LibraryDtos.StoreItem> listStores() {
        return storeRepository.findAll().stream()
                .map(LibraryDtos.StoreItem::from)
                .toList();
    }

    private TitleType parseTitleType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return TitleType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("type 값이 올바르지 않습니다: " + type);
        }
    }
}
