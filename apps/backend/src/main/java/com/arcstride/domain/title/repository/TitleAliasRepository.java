package com.arcstride.domain.title.repository;

import com.arcstride.domain.title.entity.TitleAlias;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TitleAliasRepository extends JpaRepository<TitleAlias, Long> {
    List<TitleAlias> findByTitle_TitleId(Long titleId);
    boolean existsByTitle_TitleIdAndAliasText(Long titleId, String aliasText);
}
