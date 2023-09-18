const Router = require('express');
const router = new Router();
const controller = require('../controller/controller');

router.post('/schedules', async (req, res) => controller.getSchedules(req, res));
router.post('/add_Appointment', async (req, res) => controller.addAppointment(req, res));

module.exports = router;

