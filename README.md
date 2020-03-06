# Check HTTPS Certificate Azure Function App

This is a Azure Function App that will check the validity of a HTTPS Certificate, then email a report using mailgun:

A valid certificate is one that:

 - Does not return any errors with the tls library in nodejs.
 - Has not expired.

I've configured this to check my nbrooks.id.au domain on a weekly basis.  But it wouldn't be too difficult to modify this to check multiple domains.

## Local Debugging

Before you run this locally, you need to create or update `./local.settings.json` file with the following (obviously replacing the `<...>` values with correct data:

	{
	  "Values": {
	    "CheckDomain": "<domain to check>",
	    "CheckToEmail": "<email address to send report to>",
	    "MailgunApiKey": "<mailgun api key>",
	    "MailgunDomain": "<domain in mailgun to use>",
	    "MailgunFromEmail": "<from address to use for report>"
	  }
	}

You can debug via Azure Functions debugging in VS Code, or you can run runconsole.js under CheckCertificateTrigger:

	node runconsole.js
