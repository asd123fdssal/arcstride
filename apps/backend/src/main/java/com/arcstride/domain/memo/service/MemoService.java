package com.arcstride.domain.memo.service;

import com.arcstride.common.enums.Enums.TargetType;
import com.arcstride.common.enums.Enums.Visibility;
import com.arcstride.common.exception.ApiException;
import com.arcstride.common.util.TargetResolver;
import com.arcstride.domain.memo.dto.MemoDtos;
import com.arcstride.domain.memo.entity.UserMemo;
import com.arcstride.domain.memo.repository.MemoRepository;
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
public class MemoService {

    private final MemoRepository memoRepository;
    private final UserRepository userRepository;
    private final TargetResolver targetResolver;

    @Transactional
    public MemoDtos.CreateResponse create(Long userId, MemoDtos.CreateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다."));

        TargetResolver.Resolved resolved = targetResolver.resolve(req.target().type(), req.target().id());

        UserMemo memo = UserMemo.builder()
                .user(user)
                .title(resolved.title())
                .unit(resolved.unit())
                .memoText(req.memoText())
                .spoilerFlag(req.spoilerFlag() != null ? req.spoilerFlag() : false)
                .visibility(req.visibility() != null ? req.visibility() : Visibility.PRIVATE)
                .build();
        memo = memoRepository.save(memo);

        return new MemoDtos.CreateResponse(memo.getMemoId());
    }

    @Transactional(readOnly = true)
    public List<MemoDtos.MemoItem> list(Long userId, String targetType, Long targetId) {
        if (targetType != null && targetId != null) {
            TargetType tt = TargetType.valueOf(targetType.toUpperCase());
            return switch (tt) {
                case TITLE -> memoRepository.findByUser_UserIdAndTitle_TitleId(userId, targetId)
                        .stream().map(MemoDtos.MemoItem::from).toList();
                case UNIT -> memoRepository.findByUser_UserIdAndUnit_UnitId(userId, targetId)
                        .stream().map(MemoDtos.MemoItem::from).toList();
            };
        }
        return memoRepository.findByUser_UserIdOrderByUpdatedAtDesc(userId)
                .stream().map(MemoDtos.MemoItem::from).toList();
    }

    /** 페이지네이션 목록 (targetType 필터 지원) */
    @Transactional(readOnly = true)
    public Page<MemoDtos.MemoItem> pagedList(Long userId, String targetType, Pageable pageable) {
        if (targetType != null && !targetType.isBlank()) {
            TargetType tt;
            try {
                tt = TargetType.valueOf(targetType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("targetType 값이 올바르지 않습니다: " + targetType);
            }
            return switch (tt) {
                case TITLE -> memoRepository.findByUserIdAndTargetTitle(userId, pageable)
                        .map(MemoDtos.MemoItem::from);
                case UNIT -> memoRepository.findByUserIdAndTargetUnit(userId, pageable)
                        .map(MemoDtos.MemoItem::from);
            };
        }
        return memoRepository.findByUser_UserIdOrderByUpdatedAtDesc(userId, pageable)
                .map(MemoDtos.MemoItem::from);
    }

    /** 텍스트 검색 + 페이지네이션 (targetType 필터 지원) */
    @Transactional(readOnly = true)
    public Page<MemoDtos.MemoItem> searchPagedList(Long userId, String q, String targetType, Pageable pageable) {
        if (targetType != null && !targetType.isBlank()) {
            TargetType tt;
            try {
                tt = TargetType.valueOf(targetType.toUpperCase());
            } catch (IllegalArgumentException e) {
                throw ApiException.badRequest("targetType 값이 올바르지 않습니다: " + targetType);
            }
            return switch (tt) {
                case TITLE -> memoRepository.searchByUserAndTargetTitle(userId, q, pageable)
                        .map(MemoDtos.MemoItem::from);
                case UNIT -> memoRepository.searchByUserAndTargetUnit(userId, q, pageable)
                        .map(MemoDtos.MemoItem::from);
            };
        }
        return memoRepository.searchByUser(userId, q, pageable)
                .map(MemoDtos.MemoItem::from);
    }

    @Transactional
    public MemoDtos.MemoItem patch(Long userId, Long memoId, MemoDtos.PatchRequest req) {
        UserMemo memo = findOwned(userId, memoId);
        if (req.memoText() != null) memo.setMemoText(req.memoText());
        if (req.spoilerFlag() != null) memo.setSpoilerFlag(req.spoilerFlag());
        if (req.visibility() != null) memo.setVisibility(req.visibility());
        return MemoDtos.MemoItem.from(memo);
    }

    @Transactional
    public void delete(Long userId, Long memoId) {
        UserMemo memo = findOwned(userId, memoId);
        memoRepository.delete(memo);
    }

    private UserMemo findOwned(Long userId, Long memoId) {
        return memoRepository.findByMemoIdAndUser_UserId(memoId, userId)
                .orElseThrow(() -> ApiException.notFound("메모를 찾을 수 없거나 권한이 없습니다."));
    }
}
