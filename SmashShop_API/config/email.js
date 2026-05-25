const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'hoanganhdao2k3@gmail.com',
    pass: 'bbfl fwxp lfbn nflp',
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: 'SmashShop <hoanganhdao2k3@gmail.com>',
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

module.exports = { transporter, sendEmail };
