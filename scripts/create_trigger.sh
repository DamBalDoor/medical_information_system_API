#!/bin/bash

password='root'

# При изменение базы данных в файле "dbConfig.js", необходимо так же изменить название бд ниже
mysql -u root -p$password medical_information_system <<EOF
DELIMITER //
CREATE TRIGGER after_appointment_insert
AFTER INSERT ON Appointments
FOR EACH ROW
BEGIN
    DECLARE schedule_id VARCHAR(36);
    
    -- Проверяем наличие записи в таблице Schedule
    SELECT id INTO schedule_id
    FROM Schedule
    WHERE doctor_id = NEW.doctor_id AND DATE(date) = DATE(NEW.date_time);
    
    -- Если записи нет, создаем новую запись
    IF schedule_id IS NULL THEN
        SET schedule_id = UUID();
        INSERT INTO Schedule (id, doctor_id, date, slots)
        VALUES (schedule_id, NEW.doctor_id, DATE(NEW.date_time), 
                JSON_ARRAY(JSON_OBJECT('appointment_id', NEW.id, 'date_time', NEW.date_time)));
    -- Если запись есть, обновляем поле slots
    ELSE
        UPDATE Schedule
        SET slots = JSON_ARRAY_APPEND(slots, '$', JSON_OBJECT('appointment_id', NEW.id, 'date_time', NEW.date_time))
        WHERE id = schedule_id;
    END IF;
END //
DELIMITER ;
EOF
