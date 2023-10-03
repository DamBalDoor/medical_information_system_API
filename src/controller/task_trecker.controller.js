const moment = require('moment');
const axios = require('axios');
const pool = require('../db.pool');

const apiConfig = require('../../apiConfig');

class TaskTreckerController {
    // Получение открытх задач
    async getTask() {
        try {            
            const [rows] = await pool.query(`SELECT * FROM tasks WHERE status = 'новая' OR status = 'готова к звонку' AND call_attempts <= ${apiConfig.max_call_attempts};`);
            
            return rows;
        } catch (error) {
            console.log('Ошибка: ', error);

            return [error];
        }
    }

    // Оправка задачи в API
    async postTask(data) { // data принимается в формате JSON
        // console.log("\n----- Отправка задачи в API -----");
        try {
            const dataId = data.id;
            const dataTime = moment(data.info_json.slotTime).subtract(1, 'd');

            const max_datetime_to_call = dataTime.add(30, 'm').format('YYYY-MM-DD HH:mm:ss');
            const phone = data.phone_number;

            data = JSON.stringify(data.info_json);
            data = {
                "api_key": apiConfig.api_key,
                "project_id": apiConfig.project_id,
                phone,
                data,
                "max_datetime_to_call": max_datetime_to_call
            };
            
            const response = await axios.post('https://go.robotmia.ru/api/calltask', data);
            const collTaskId = response.data.data.call_task_id;

            await pool.query(`UPDATE tasks SET call_attempts = call_attempts + 1, status = 'в процессе', call_task_id = '${collTaskId}' WHERE id = ${dataId};`);
            await pool.query(`INSERT INTO calls (call_task_id, phone_number) VALUES ('${collTaskId}', '${phone}');`);

            return response;

        } catch(error) {
            console.log(error);
            return [error];
        }
    }

    async checkCalls() {
        try {            
            const [rowsCalls] = await pool.query(`SELECT * FROM calls WHERE status = 'в процессе';`);
            
            // Заврешаем задачу если больше 3х звонков
            await pool.query(`UPDATE tasks SET status = "завершена" WHERE status <> "завершена" AND call_attempts = 3;`);
            
            for (let i = 0; i < rowsCalls.length; i++) {
                const [rowsTasks] = await pool.query(`SELECT * FROM tasks WHERE call_task_id = '${rowsCalls[i].call_task_id}';`);

                const callTaskId = rowsCalls[i].call_task_id;
                const response = await axios.get(`https://go.robotmia.ru/api/calltask/result?api_key=${apiConfig.api_key}&project_id=${apiConfig.project_id}&call_task_id=${callTaskId}`)
                                        .catch(error => {
                                            console.log("Ошибка: ", error);
                                        });

                if(!response) continue;

                if(!Array.isArray(response.data.data.variables)) {

                    const result = response.data.data.variables;
                    if(["Подтверждает", "Не подтверждает", "Опоздание"].includes(result.callResult)) {
                        // console.log("Дозвонились");
                        await this._postCalls(response.data.data, "завершена", callTaskId, rowsTasks[0].call_attempts);
                    } else {
                        // console.log("Не получили ответ");
                        await this._postCalls({message: "Не получили ответ"}, "готова к звонку", callTaskId, rowsTasks[0].call_attempts);
                    }

                } else {
                    // console.log("Не дозвонились");
                    await this._postCalls({message: "Не дозвонились"}, "готова к звонку", callTaskId, rowsTasks[0].call_attempts);
                }
            }

            return rowsCalls;
        } catch (error) {
            console.log('Ошибка: ', error);

            return [error];
        } 
    }

    async _postCalls(data, status, callTaskId, call_attempts) {
        const jsonData = JSON.stringify(data);
        const sql = 'UPDATE calls SET info_json = ?, status = "закончен" WHERE call_task_id = ?';
        const values = [jsonData, callTaskId];
        await pool.query(sql, values);

        if(status == "завершена")
            await pool.query(`UPDATE tasks SET status = "${status}" WHERE call_task_id = ${callTaskId}`);
        else if(call_attempts != 3)
            await pool.query(`UPDATE tasks SET status = "${status}" WHERE call_task_id = ${callTaskId}`);
    }


}

module.exports = new TaskTreckerController();