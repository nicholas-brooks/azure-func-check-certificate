const triggerFunc = require('./triggerFunc');

module.exports = async function(context, myTimer) {

  const toCheck = {
    domain : process.env['CheckDomain'],
    to : process.env['CheckToEmail']
  }
  const mailgun = {
    apiKey: process.env['MailgunApiKey'],
    domain: process.env['MailgunDomain'],
    from: process.env['MailgunFromEmail']
  };

  // future: read list of domains from table

  return triggerFunc(toCheck, mailgun);
};