package com.venuevista.venuevista.repository;

import com.venuevista.venuevista.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventRepository extends JpaRepository<Event, Long> {
}