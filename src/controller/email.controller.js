const nodemailer = require('nodemailer');
const emailConfig = require('../../emailConfig');

const transporter = nodemailer.createTransport({
  service: emailConfig.service,
  auth: {
    user: emailConfig.auth.user,
    pass: emailConfig.auth.pass
  }
});

function sendEmail(to, subject, text) {
  const mailOptions = {
    from: emailConfig.auth.user,
    to,
    subject,
    text
  };

  return transporter.sendMail(mailOptions);
}

function calculateNotificationTime(appointmentDateTime, notificationHours) {
  const notificationTime = appointmentDateTime.subtract(notificationHours, 'hours');
  return notificationTime;
}

module.exports = { sendEmail, calculateNotificationTime };
