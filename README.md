# medical_information_system_API

## Использование

### Настройка

Перед запуском необходимо выполнить настройку в файлах 'dbConfig.js' и 'emailConfig.js'

### Установка и запуск

*Для запуска, у вас должен быть запущен 'mysql' и создана база дынных, указанная в 'dbConfig.js'*

Чтобы установить зависимости проекта и запустить его, выполните следующую команду:

```bash
npm i && npm run dev
```

### Получение расписания врачей

Для получения расписания врачей выполните POST запрос по следующему адресу:

```bash
http://localhost:3000/api/schedules
```

В качестве параметров передайте запрос со следующими параметрам:

```bash
{
    date_time: 'date',
}
```

*Дата должна передаваться в формате: '2023-09-18'*



### Запись на прием к врачу

Для записи на прием к врачу POST запрос по следующему адресу:

```bash
http://localhost:3000/api/add_appointment
```

В качестве параметров передайте запрос со следующими параметрам:

```bash
{
    user_id: 'uuid',    
    doctor_id: 'uuid',
    slot: 'timestamp'
}
```

* Слот должен передаваться в формате: '2023-09-18T10:00:00+07:00'
* Слот для записи должен быть кратен 30 минутам
* На один слот может записаться только один человек

