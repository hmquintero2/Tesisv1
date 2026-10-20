package com.retosonline.repository;

import com.retosonline.entity.BenchmarkConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BenchmarkConfigRepository extends JpaRepository<BenchmarkConfig, Long> {
}