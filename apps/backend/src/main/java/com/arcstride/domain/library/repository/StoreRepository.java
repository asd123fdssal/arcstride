package com.arcstride.domain.library.repository;

import com.arcstride.domain.library.entity.Store;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StoreRepository extends JpaRepository<Store, Long> {
}
