const Mailgun = require("mailgun-js");

class EmailService {
  constructor(apiKey, domain, from) {
    this.from = from;
    this.mailgun = new Mailgun({ apiKey: apiKey, domain: domain });
  }

  async sendOkEmail(to, certificate) {
    this.sendEmail({
      from: this.from,
      to: to,
      subject: `CERT_CHECK - ${certificate.domain} is valid`,
      html: `${certificate.domain} is valid<br>
subject: ${JSON.stringify(certificate.subject)}<br>
issuer: ${JSON.stringify(certificate.issuer)}<br>
Expiry: ${certificate.validTo} (days: ${certificate.daysToExpire()})`
    });
  }

  async sendExpiredEmail(to, certificate) {
    this.sendEmail({
      from: this.from,
      to: to,
      subject: `CERT_CHECK - ${certificate.domain} - has expired!`,
      html: `${certificate.domain} has expired!<br>
subject: ${JSON.stringify(certificate.subject)}<br>
issuer: ${JSON.stringify(certificate.issuer)}<br>
Expiry: ${certificate.validTo}`
    });
  }

  async send7DayEmail(to, certificate) {
    this.sendEmail({
      from: this.from,
      to: to,
      subject: `CERT_CHECK - ${certificate.domain} expires in ${certificate.daysToExpire()} days`,
      html: `${certificate.domain} expires in ${certificate.daysToExpire()} days<br>
subject: ${JSON.stringify(certificate.subject)}<br>
issuer: ${JSON.stringify(certificate.issuer)}<br>
Expiry: ${certificate.validTo}`
    });
  }

  async sendErrorEmail(to, error) {
    this.sendEmail({
      from: this.from,
      to: to,
      subject: `CERT_CHECK - ${error.domain} - Error - ${error.msg}`,
      html: `${error.domain} - error checking domain.  ${error.msg}<br>
subject: ${error.errorType}<br>
issuer: ${error.errorCode}`
    });
  }

  async sendEmail(email) {
    await this.mailgun.messages().send(email, err => {
      if (err) {
        console.error("error sending email: ", err);
      }
    });
  }
}

class Email {
  constructor(from, to, subject, html) {
    this.from = from;
    this.to = to;
    this.subject = subject;
    this.html = html;
  }
}

module.exports = {
  EmailService: EmailService
}