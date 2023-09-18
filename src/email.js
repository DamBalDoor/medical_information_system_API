const moment = require('moment');
const { sendEmail, calculateNotificationTime } = require('./controller/email.controller')
const pool = require('./db.pool');


const calculateNextHourDelay = () => {
  const now = moment();
  const nextHour = moment().startOf('minutes').add(1, 'minutes'); // проверка каждую минуту
  const delay = nextHour.diff(now);
  return delay;
};


const getAppointments = async () => {
    try {
        const [rows] = await pool.query(`SELECT app.id, app.user_id, us.name, us.email, app.doctor_id, doc.name, doc.spec, app.date_time
                                            FROM Appointments AS app
                                            LEFT JOIN Doctors AS doc ON app.doctor_id = doc.id
                                            LEFT JOIN Users AS us ON app.user_id = us.id
                                            WHERE app.date_time >= NOW()
                                            ORDER BY app.date_time;`
                                      );
        return rows;
      } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server Error');
      }
}

const emailInterface = () => {
  const delay = calculateNextHourDelay();
  setTimeout(async () => {
    const schedules = await getAppointments();
    for(var schedule of schedules) {
        const appointmentDateTime2 = moment(schedule['date_time']);
        const appointmentDateTime24 = moment(schedule['date_time']);

        // Напоминание за 2 часа
        const notificationTime = calculateNotificationTime(appointmentDateTime2, 2);
        if(moment(notificationTime).format('YYYY-MM-DDTHH:mm') === moment().format('YYYY-MM-DDTHH:mm')) {
          sendEmail(schedule['email'], 'Напоминание о приеме к врачу', `[${moment().format("DD.MM.YYYY")}] | Привет ${schedule['name']}! Через 2 часа у вас приём у ${schedule['spec']} в ${moment(schedule['date_time']).format('HH:mm')}!`);
        }

        // Напоминание за сутки
        const notificationTimeOneDayBefore = calculateNotificationTime(appointmentDateTime24, 1 * 24);
        if(moment(notificationTimeOneDayBefore).format('YYYY-MM-DDTHH:mm') === moment().format('YYYY-MM-DDTHH:mm')) {
          sendEmail(schedule['email'], 'Напоминание о приеме к врачу', `[${moment().format("DD.MM.YYYY")}] | Привет ${schedule['name']}! Напоминаем что вы записаны к ${schedule['spec']} завтра в ${moment(schedule['date_time']).format('HH:mm')}!`);
        }

    }
    emailInterface();
  }, delay);
};

module.exports = emailInterface;
