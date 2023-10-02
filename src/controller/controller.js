var moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db.pool');

class Controller {

    // Получить расписание врачей
    async getSchedules(req, res) {
        console.log("\n----- Получить расписание врачей -----");

        const data = req.body;
        
        console.log("Полученные данные: ", data);

        if(!(data && data.date_time)) {
            console.log('Поле "date_time" не найдено в данных.');

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

            console.log('Расписание получено');

            res.json(slotArray);
        } catch (error) {
            console.log('Ошибка: ', error);

            res.json({error: error});
            process.exit(1);
        }
    }

    // Запись на прием к врачу
    async addAppointment(req, res) {
        console.log("\n----- Запись на прием к врачу -----");

        const data = req.body;

        console.log("Полученные данные: ", data);

        if(!(data && data.userPhone && data.doctorId && data.timeSlot)) {
            console.log("Не корректные данные");

            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }
        if (!data.userPhone.startsWith('+')) {
            data.userPhone = '+' + data.userPhone;
          }

        data.timeSlot = data.timeSlot + "+07:00";

        
        try { 
            const [rows] = await pool.query(`SELECT id FROM Users WHERE phone = '${data.userPhone}'`);
            const userId = rows[0].id;
            // console.log(userId);

            // Проверка на существования пользователя
            const [user] = await pool.query(`SELECT * FROM Users WHERE id = '${userId}'`);
            if(Object.keys(user).length === 0) {
                console.log("Выбранный юзер не найден");

                res.status(400).json({ error: 'Выбранный юзер не найден' });
                return;
            }
            // Проверка на существования доктора
            const [doc] = await pool.query(`SELECT * FROM Doctors WHERE id = '${data.doctorId}'`);
            if(Object.keys(doc).length === 0) {
                console.log("Выбранный доктор не найден");
                
                res.status(400).json({ error: 'Выбранный доктор не найден' });
                return;
            }
            // Проверка на скорректность введения timeslot
            const regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+\d{2}:\d{2}$/;
            if(!(regex.test(data.timeSlot) && moment(data.timeSlot, moment.ISO_8601, true).isValid())) {
                console.log('Время указанно не корректно, введите в формате (2023-01-01T00:00:00+07:00).')

                res.status(400).json({ message: 'Время указанно не корректно', info: 'введите в формате (2023-01-01T00:00:00+07:00).' });
                return;
            }
            // Проверка на скорректность введения timeslot, четен ли он 30 минутам
            if(!this._isEvenTimeSlot(data.timeSlot)) {
                console.log('Time slot указан не корректно, введите в формате (2023-01-01T00:00:00+07:00). Time slot должен быть кртаен 30 минутам')

                res.status(400).json({ message: 'Time slot указан не корректно', info: 'введите в формате (2023-01-01T00:00:00+07:00). Time slot должен быть кртаен 30 минутам' });
                return;
            }
            // Проверка занятости слота
            const [appointments] = await pool.query(`SELECT * FROM Appointments WHERE doctor_id = '${data.doctorId}' AND date_time = '${data.timeSlot}'`);
            if(Object.keys(appointments).length) {
                console.log('Выбранные time slot занят')
                res.status(201).json({ message: 'Выбранные время занято, выберите другое время.' });
                return;
            }
            // Проверяем что полученное время входит в часы работы больницы.
            if(!this._checkTimeSlot(data.timeSlot)) {
                console.log('Выбранные time slot не входит в часы работы больницы')
                res.status(201).json({ message: 'Выбранные время не входит в часы работы больницы, выберите другое время.' });
                return;
            }

            const query = await pool.query(`INSERT INTO Appointments (id, doctor_id, user_id, date_time) VALUES ('${uuidv4()}', '${data.doctorId}', '${userId}', '${data.timeSlot}')`)
            

            const option = {
                doctorName: doc[0].name,
                doctorSpec: doc[0].spec,
                slotTime: data.timeSlot,
                userName: user[0].name
            }

            await this._createTaskToAlert(data.userPhone, JSON.stringify(option), 0);


            console.log('Запрос выполнен');
            res.json({message: 'Успешная регистрация'});
        } catch (error) {
            console.log("Ошибка: ", error);

            res.json({error: error});
            process.exit(1);
        }
    }

    // Регистрация пользователя
    async addUser(req, res) {
        console.log("\n----- Регистрация пользователя -----");
    
        const data = req.body;

        console.log("Полученные данные: ", data);

        if(!(data && data.username && data.phone)) {
            console.log("Не корректные данные");

            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }

        try {
            if (!data.phone.startsWith('+')) {
                data.phone = '+' + data.phone;
              }

            const user_uuid = uuidv4();

            const query = await pool.query(`INSERT INTO Users (id, phone, name) VALUES ('${user_uuid}', '${data.phone}', '${data.username}')`);
        
            console.log("Пользоваель успешно добавлен");

            res.json({message: 'Пользоваель успешно добавлен', user_id: user_uuid});
          } catch (error) {
            res.status(500).json({ error: 'Ошибка при добавление пользователя в базу данных' });
          }
    }

    // Проверка регистрации пользователя
    async checkRegisterUser(req, res) {
        console.log("\n----- Проверка регистрации -----");

        const data = req.body;

        console.log('Полученый номер: ' + data.phone);

        if(!(data && data.phone)) {
            console.log("Не корректные данные");

            res.status(400).json({ error: 'Не корректные данные' });
            return;
        }

        const regex = /^\+?7\d{10}$/;
        if (!regex.test(data.phone)) {
            console.log('Номер телефона не соответствует не формату');

            res.status(400).json({ error: 'Номер телефона не соответствует формату' });
            return;
        }

        try {
            if (!data.phone.startsWith('+')) {
                data.phone = '+' + data.phone;
              }

            const result = await pool.query(`SELECT * FROM Users WHERE phone = '${data.phone}'`);
            
            const rowCount = result[0].length;

            if(rowCount > 0) {
                console.log("Пользоваель зарегистрирован");

                res.json({message: 'Пользоваель зарегистрирован', user: result[0]});
            } else {
                console.log("Пользоваель не найден");

                res.json({message: 'Пользоваель не найден'});
            }
        } catch (error) {
            console.log('Ошибка при обращение к базе данных');

            res.status(500).json({ error: 'Ошибка при обращение к базе данных' });
        }
    }

    // Проверяем кратен ли 
    _isEvenTimeSlot(time) {
        const timeMoment = moment(time, 'YYYY-MM-DDTHH:mm:ss');
        const minutes = timeMoment.minutes();
        return minutes === 0 || minutes === 30;
      };

    // Компануем свободные слоты в многомерный массив для более удобного считывания.
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

    // Создаем массив свободных слотов, убираем из него занятые слоты и компануем все в многомерный массив с помощью функции выше.
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
                id: schedules[i].id,
                name: schedules[i].name,
                spec: schedules[i].spec,
                openSlot: openSlot
            }

            result.push(tmp)
        }        

        return result;
    }

    // Проверяем что полученное время входит в часы работы больницы.
    _checkTimeSlot(time) {
        const timeMoment = moment(time, 'YYYY-MM-DDTHH:mm:ss');
        // const receivedTime = timeMoment.format("HH:mm");
        const receivedTime = moment(timeMoment.format("HH:mm"), 'HH:mm');  // предполагаем, что у вас есть время в формате "часы:минуты"
        
        const startTime = moment('08:00', 'HH:mm');
        const endTime = moment('18:00', 'HH:mm');
        
        const isTimeInRange = receivedTime.isSameOrAfter(startTime) && receivedTime.isSameOrBefore(endTime);
        
        return isTimeInRange;
    }

    // создаем запись в задачах для оповещения
    async _createTaskToAlert(number, data, numCall) {
        try {
            
            const query = await pool.query(`INSERT INTO tasks (phone_number, info_json, call_attempts) VALUES ('${number}', '${data}', '${numCall}')`);
            
            console.log("Таблица 'tasks' успешно обновлена")
        } catch(error) {
            console.log("При обновление таблицы 'tasks' произошла ошибка: ", error);
        }
    }
}

module.exports = new Controller();
