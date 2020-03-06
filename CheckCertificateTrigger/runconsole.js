const triggerFunc = require('./triggerFunc');
const fs = require('fs');

let settings = JSON.parse(fs.readFileSync('../local.settings.json'));

let domain = process.argv.length > 2 ? process.argv[2] : settings.Values.CheckDomain

console.log(`Checking ${domain} ...`)

let toCheck = {
  domain : domain,
  to :  settings.Values.CheckToEmail
};

let mailgun = {
  apiKey: settings.Values.MailgunApiKey,
  domain: settings.Values.MailgunDomain,
  from: settings.Values.MailgunFromEmail
};

triggerFunc(toCheck, mailgun).then(() => console.log('finished'));
