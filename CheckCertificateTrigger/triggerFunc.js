const { Certificate, checkCertificate } = require("./checkCertificate");
const { EmailService } = require ("./sendEmail");

module.exports = async function(toCheck, mailgun) {

  let result = await checkCertificate(toCheck.domain);

  if (result instanceof Certificate) {
    await handleValidCheck(result, toCheck, mailgun);
  } else {// we're assuming - res instanceof ErrorResult
    await handleError(result, toCheck, mailgun);
  }
};

async function handleValidCheck(certificate, toCheck, mailgun) {
  let service = new EmailService(mailgun.apiKey, mailgun.domain, mailgun.from);

  if (certificate.hasExpired()) {
    service.sendExpiredEmail(toCheck.to, certificate);
  } else if (certificate.daysToExpire() <= 7) {
    service.send7DayEmail(toCheck.to, certificate);
  } else {
    service.sendOkEmail(toCheck.to, certificate);
  }
}

async function handleError(error, toCheck, mailgun) {
  let service = new EmailService(mailgun.apiKey, mailgun.domain, mailgun.from);
  await service.sendErrorEmail(toCheck.to, error);
}