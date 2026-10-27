package com.venuevista.venuevista.repository;

import com.venuevista.venuevista.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    List<Booking> findByEventId(Long eventId);

    List<Booking> findByEventIdAndStatus(Long eventId, String status);

    boolean existsByTicketId(String ticketId);

    boolean existsByEventIdAndSeatIdAndStatus(
            Long eventId,
            Long seatId,
            String status
    );
}
