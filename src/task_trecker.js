const cron = require('node-cron');
const moment = require('moment');

const tasksTreckerController = require('./controller/task_trecker.controller');
const apiConfig = require('..//apiConfig');

console.log("Task Trecker Started");

cron.schedule('* * * * *', async () => {
  try {
    const rowTasks = await tasksTreckerController.getTask();
    const rowCalls = await tasksTreckerController.checkCalls();

    for (let i = 0; i < rowTasks.length; i++) {
      const taskSlotTime = moment(rowTasks[i].info_json.slotTime).subtract(1, 'd');
      const endTime = taskSlotTime.clone().add(30, 'minutes');

      if(moment().isBetween(taskSlotTime, endTime) && rowTasks[i].call_attempts < apiConfig.max_call_attempts) {
        console.log("Отправляем зарос");

        const result = await tasksTreckerController.postTask(rowTasks[i]);
      }
      
    }
      
  } catch(error) {
    console.log(error);
  }
  
});