const nodemailer = require('nodemailer');
const pug = require('pug');
const juice = require('juice');
const htmlToText = require('html-to-text');
const promisify = require('es6-promisify');

// Postmark
const postmark = require('postmark');
const postmarkClient = new postmark.Client(process.env.MAIL_USER);

// const transport = nodemailer.createTransport({
//   host: process.env.MAIL_HOST,
//   port: process.env.MAIL_PORT,
//   auth: {
//     user: process.env.MAIL_USER,
//     pass: process.env.MAIL_PASS
//   }
// });

const generateHTML = (filename, options = {}) => {
  const html = pug.renderFile(`${__dirname}/../views/email/${filename}.pug`, options);
  const inlined = juice(html);
  return inlined;
}

exports.send = async (options) => {
  const html = generateHTML(options.filename, options);
  const text = htmlToText.fromString(html);

  // const mailOptions = {
  //   from: `David Chapman <noreply@dachapman.com>`,
  //   to: options.user.email,
  //   subject: options.subject,
  //   html,
  //   text
  // };

  // Postmark
  const mailOptions = {
    from: `David Chapman <david@dachapman.com>`,
    // to: options.user.email,
    // For testing only
    to: "test@blackhole.postmarkapp.com",
    subject: options.subject,
    "HtmlBody": html,
    "TextBody": text
  };

  // const sendMail = promisify(transport.sendMail, transport);
  const sendMail = promisify(postmarkClient.sendEmail, postmarkClient);
  return sendMail(mailOptions);
}