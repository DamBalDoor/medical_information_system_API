var moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db.pool');

class Controller {

    async getSchedules(req, res) {
        const data = req.body;

        if(!(data && data.date_time)) {
            res.status(400).json({ error: 'Поле "date_time" не найдено в данных.' });
            return;
        }
        try {
            const selected_data = moment(data.date_time).startOf('day').format("YYYY-MM-DD"); 
            
            const [rows] = await pool.query(`SELECT 
                                                doc.*, 
                                                COALESCE(sch.date, '${selected_data}') AS date,
                                                IFNULL(sch.slots, JSON_ARRAY()) AS slots
                                            FROM Doctors AS doc
                                            LEFT JOIN Schedule AS sch ON doc.id = sch.doctor_id AND sch.date = '${selected_data}';`
                                            );
        
            const slotArray = this._createSlotArray(rows);
                        
            res.json(slotArray);
        } catch (error) {
            res.json({error: error});
            process.exit(1);
        }
    }

    async addAppointment(req, res) {
        const data = req.body;

        if(!(data && data.user_id && data.doctor_id && data.slot)) {
            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }
        try { 
            // Проверка на существования пользователя
            const [user] = await pool.query(`SELECT * FROM Users WHERE id = '${data.user_id}'`);
            if(Object.keys(user).length === 0) {
                res.status(400).json({ error: 'Выбранный юзер не найден' });
                return;
            }
            // Проверка на существования доктора
            const [doc] = await pool.query(`SELECT * FROM Doctors WHERE id = '${data.doctor_id}'`);
            if(Object.keys(doc).length === 0) {
                res.status(400).json({ error: 'Выбранный доктор не найден' });
                return;
            }
            // Проверка на скорректность введения timeslot
            const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/;
            if(!(regex.test(data.slot) && moment(data.slot, moment.ISO_8601, true).isValid())) {
                res.status(400).json({ error: 'Time slot указан не корректно, введите в формате (2023-01-01T00:00:00+07:00).' });
                return;
            }
            // Проверка на скорректность введения timeslot, четен ли он 30 минутам
            if(!this._isEvenTimeSlot(data.slot)) {
                res.status(400).json({ error: 'Time slot указан не корректно, введите в формате (2023-01-01T00:00:00+07:00). Time slot должен быть кртаен 30 минутам' });
                return;
            }
            // Проверка занятости слота
            const [appointments] = await pool.query(`SELECT * FROM Appointments WHERE doctor_id = '${data.doctor_id}' AND date_time = '${data.slot}'`);
            if(Object.keys(appointments).length) {
                res.status(400).json({ error: 'Выбранные time slot занят' });
                return;
            }

            const query = await pool.query(`INSERT INTO Appointments (id, doctor_id, user_id, date_time) VALUES ('${uuidv4()}', '${data.doctor_id}', '${data.user_id}', '${data.slot}')`)
            
            res.json({message: 'Запрос выполнен'});
        } catch (error) {
            res.json({error: error});
            process.exit(1);
        }
    }

    async addUser(req, res) {
        const data = req.body;
        if(!(data && data.username && data.gender && data.phone)) {
            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }

        try {
            const user_uuid = uuidv4();

            const query = await pool.query(`INSERT INTO Users (id, phone, name) VALUES ('${user_uuid}', '${data.phone}', '${data.username}')`);
        
            res.json({message: 'Пользоваель успешно добавлен', user_id: user_uuid});
          } catch (error) {
            res.status(500).json({ error: 'Ошибка при добавление пользователя в базу данных' });
          }
    }

    async checkRegisterUser(req, res) {
        const data = req.body;

        if(!(data && data.phone)) {
            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }

        const regex = /^7\d{10}$/;
        if (!regex.test(data.phone)) {
            res.status(400).json({ error: 'Номер телефона соответствует формату' });
            return;
        }

        try {
            const result = await pool.query(`SELECT * FROM Users WHERE phone = '${data.phone}'`);
            
            const rowCount = result[0].length;

            if(rowCount > 0) {
                res.json({message: 'Пользоваель зарегистрирован', user: result[0]});
            } else {
                res.json({message: 'Пользоваель не найден'});
            }
        } catch (error) {
            res.status(500).json({ error: 'Ошибка при обращение к базе данных' });
        }
    }

    _isEvenTimeSlot(time) {
        const timeMoment = moment(time, 'YYYY-MM-DDTHH:mm:ss');
        const minutes = timeMoment.minutes();
        return minutes === 0 || minutes === 30;
      };

    _splitTimeIntoPeriods(timeArray) {
        const periods = [];
        let currentPeriod = [];
      
        for (let i = 0; i < timeArray.length; i++) {
          if (i === 0 || moment(timeArray[i], 'HH:mm').diff(moment(timeArray[i - 1], 'HH:mm'), 'minutes') > 30) {
            if (currentPeriod.length > 0) {
              periods.push([...currentPeriod]);
            }
            currentPeriod = [timeArray[i]];
          } else {
            currentPeriod.push(timeArray[i]);
          }
        }
      
        if (currentPeriod.length > 0) {
          periods.push([...currentPeriod]);
        }
      
        return periods;
    }

    _createSlotArray(schedules) {
        const startTime = moment('08:00', 'HH:mm');
        const endTime = moment('18:00', 'HH:mm');
        const intervalMinutes = 30;

        const timeArray = [];
        let currentTime = moment(startTime, 'HH:mm');
        
        while (currentTime.isBefore(endTime, 'HH:mm')) {
            timeArray.push(currentTime.format('HH:mm'));
            currentTime.add(intervalMinutes, 'minutes');
        }

        const result = [];
        
        for (let i = 0; i < schedules.length; i++) {
            const tmpAllOpenSlot = timeArray.concat();
            for (let j = 0; j < schedules[i].slots.length; j++) {
                const timeTmp = moment(schedules[i].slots[j].date_time);

                const indexRemove = tmpAllOpenSlot.indexOf(timeTmp.format('HH:mm'));
                if (indexRemove !== -1) {
                    tmpAllOpenSlot.splice(indexRemove, 1);
                }
            }

            const openSlot = [];
            openSlot.push(this._splitTimeIntoPeriods(tmpAllOpenSlot));

            let tmp = {
                name: schedules[i].name,
                spec: schedules[i].spec,
                openSlot: openSlot
            }

            result.push(tmp)
        }        

        return result;
    }
}

module.exports = new Controller()