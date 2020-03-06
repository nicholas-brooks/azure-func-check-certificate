const https = require('https');

//
// Check the certificate at domain.
// Returns either Certificate or ErrorResult instance.
// 
// socket.authorizationError returns a constant from openssl.  For details of what it means, see:
// https://github.com/nodejs/node/blob/01504904f3b220b68666d9c2d37e13615e0a2fc1/deps/openssl/openssl/crypto/x509/x509_txt.c#L21
//
async function checkCertificate(domain) {
  return httpsHeadPromise(domain).then(
    conn => {
      if (!conn.authorized) {
        return new ErrorResult(domain, "unauthorized", conn.authorizationError);
      }
      let cert = conn.getPeerCertificate();
      return new Certificate(
        domain,
        cert.subject,
        cert.issuer,
        new Date(cert.valid_from),
        new Date(cert.valid_to)
      );
    },
    err => {
      return new ErrorResult(domain, "rejected", err.code);
    }
  );
}

class Certificate {
  constructor(domain, subject, issuer, validFrom, validTo) {
    this.domain = domain;
    this.subject = subject;
    this.issuer = issuer;
    this.validFrom = validFrom;
    this.validTo = validTo;
  }

  hasExpired() {
    return this.validTo != null && this.validTo <= Date.now;
  }

  daysToExpire() {
    return daysBetween(this.validTo, new Date());
  }
}

class ErrorResult {
  constructor(domain, errorType, errorCode) {
    this.domain = domain;
    this.errorType = errorType;
    this.errorCode = errorCode;
    this.msg = this.errorMsg(errorType, errorCode);
  }

  errorMsg(type, code) {
    if (type === "unauthorized") {
      return x509codeToMsg(code);
    }
    if (type === "rejected") {
      switch (code) {
        case "EPROTO":
          return "Error trying to make TLS connection.  It could be incorrect or old cypher being used.";
        case "ENOTFOUND":
          return "Unable to find requested domain";
        default:
          return `Unknown error - ${code}`;
      }
      return code;
    }
    return "";
  }
}

function daysBetween(date1, date2) {
  const ONE_DAY = 86_400_000;
  return Math.trunc(Math.round(date1.getTime() - date2.getTime()) / ONE_DAY);
}

// 'res' in https.request(.., res => ) is a TLSSocket.
// Find out more about it at https://nodejs.org/api/tls.html#tls_class_tls_tlssocket
//
function httpsHeadPromise(domain, port = 443) {
  let options = {
    host: domain,
    rejectUnauthorized: false,
    agent: false,
    method: "HEAD",
    port: port
  };
  return new Promise(function(resolve, reject) {
    let request = https.request(options, res => {
      resolve(res.connection);
    });
    request.on("error", reject);
    request.end();
  });
}

function x509codeToMsg(code) {
  // These were taken from:
  // https://github.com/nodejs/node/blob/01504904f3b220b68666d9c2d37e13615e0a2fc1/deps/openssl/openssl/crypto/x509/x509_txt.c
  switch (code) {
    case "UNSPECIFIED":
      return "unspecified certificate verification error";
    case "UNABLE_TO_GET_ISSUER_CERT":
      return "unable to get issuer certificate";
    case "UNABLE_TO_GET_CRL":
      return "unable to get certificate CRL";
    case "UNABLE_TO_DECRYPT_CERT_SIGNATURE":
      return "unable to decrypt certificate's signature";
    case "UNABLE_TO_DECRYPT_CRL_SIGNATURE":
      return "unable to decrypt CRL's signature";
    case "UNABLE_TO_DECODE_ISSUER_PUBLIC_KEY":
      return "unable to decode issuer public key";
    case "CERT_SIGNATURE_FAILURE":
      return "certificate signature failure";
    case "CRL_SIGNATURE_FAILURE":
      return "CRL signature failure";
    case "CERT_NOT_YET_VALID":
      return "certificate is not yet valid";
    case "CERT_HAS_EXPIRED":
      return "certificate has expired";
    case "CRL_NOT_YET_VALID":
      return "CRL is not yet valid";
    case "CRL_HAS_EXPIRED":
      return "CRL has expired";
    case "ERROR_IN_CERT_NOT_BEFORE_FIELD":
      return "format error in certificate's notBefore field";
    case "ERROR_IN_CERT_NOT_AFTER_FIELD":
      return "format error in certificate's notAfter field";
    case "ERROR_IN_CRL_LAST_UPDATE_FIELD":
      return "format error in CRL's lastUpdate field";
    case "ERROR_IN_CRL_NEXT_UPDATE_FIELD":
      return "format error in CRL's nextUpdate field";
    case "OUT_OF_MEM":
      return "out of memory";
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
      return "self signed certificate";
    case "SELF_SIGNED_CERT_IN_CHAIN":
      return "self signed certificate in certificate chain";
    case "UNABLE_TO_GET_ISSUER_CERT_LOCALLY":
      return "unable to get local issuer certificate";
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
      return "unable to verify the first certificate";
    case "CERT_CHAIN_TOO_LONG":
      return "certificate chain too long";
    case "CERT_REVOKED":
      return "certificate revoked";
    case "INVALID_CA":
      return "invalid CA certificate";
    case "PATH_LENGTH_EXCEEDED":
      return "path length constraint exceeded";
    case "INVALID_PURPOSE":
      return "unsupported certificate purpose";
    case "CERT_UNTRUSTED":
      return "certificate not trusted";
    case "CERT_REJECTED":
      return "certificate rejected";
    case "SUBJECT_ISSUER_MISMATCH":
      return "subject issuer mismatch";
    case "AKID_SKID_MISMATCH":
      return "authority and subject key identifier mismatch";
    case "AKID_ISSUER_SERIAL_MISMATCH":
      return "authority and issuer serial number mismatch";
    case "KEYUSAGE_NO_CERTSIGN":
      return "key usage does not include certificate signing";
    case "UNABLE_TO_GET_CRL_ISSUER":
      return "unable to get CRL issuer certificate";
    case "UNHANDLED_CRITICAL_EXTENSION":
      return "unhandled critical extension";
    case "KEYUSAGE_NO_CRL_SIGN":
      return "key usage does not include CRL signing";
    case "UNHANDLED_CRITICAL_CRL_EXTENSION":
      return "unhandled critical CRL extension";
    case "INVALID_NON_CA":
      return "invalid non-CA certificate (has CA markings)";
    case "PROXY_PATH_LENGTH_EXCEEDED":
      return "proxy path length constraint exceeded";
    case "KEYUSAGE_NO_DIGITAL_SIGNATURE":
      return "key usage does not include digital signature";
    case "PROXY_CERTIFICATES_NOT_ALLOWED":
      return "proxy certificates not allowed, please set the appropriate flag";
    case "INVALID_EXTENSION":
      return "invalid or inconsistent certificate extension";
    case "INVALID_POLICY_EXTENSION":
      return "invalid or inconsistent certificate policy extension";
    case "NO_EXPLICIT_POLICY":
      return "no explicit policy";
    case "DIFFERENT_CRL_SCOPE":
      return "Different CRL scope";
    case "UNSUPPORTED_EXTENSION_FEATURE":
      return "Unsupported extension feature";
    case "UNNESTED_RESOURCE":
      return "RFC 3779 resource not subset of parent's resources";
    case "PERMITTED_VIOLATION":
      return "permitted subtree violation";
    case "EXCLUDED_VIOLATION":
      return "excluded subtree violation";
    case "SUBTREE_MINMAX":
      return "name constraints minimum and maximum not supported";
    case "APPLICATION_VERIFICATION":
      return "application verification failure";
    case "UNSUPPORTED_CONSTRAINT_TYPE":
      return "unsupported name constraint type";
    case "UNSUPPORTED_CONSTRAINT_SYNTAX":
      return "unsupported or invalid name constraint syntax";
    case "UNSUPPORTED_NAME_SYNTAX":
      return "unsupported or invalid name syntax";
    case "CRL_PATH_VALIDATION_ERROR":
      return "CRL path validation error";
    case "PATH_LOOP":
      return "Path Loop";
    case "SUITE_B_INVALID_VERSION":
      return "Suite B: certificate version invalid";
    case "SUITE_B_INVALID_ALGORITHM":
      return "Suite B: invalid public key algorithm";
    case "SUITE_B_INVALID_CURVE":
      return "Suite B: invalid ECC curve";
    case "SUITE_B_INVALID_SIGNATURE_ALGORITHM":
      return "Suite B: invalid signature algorithm";
    case "SUITE_B_LOS_NOT_ALLOWED":
      return "Suite B: curve not allowed for this LOS";
    case "SUITE_B_CANNOT_SIGN_P_384_WITH_P_256":
      return "Suite B: cannot sign P-384 with P-256";
    case "HOSTNAME_MISMATCH":
      return "Hostname mismatch";
    case "EMAIL_MISMATCH":
      return "Email address mismatch";
    case "IP_ADDRESS_MISMATCH":
      return "IP address mismatch";
    case "DANE_NO_MATCH":
      return "No matching DANE TLSA records";
    case "EE_KEY_TOO_SMALL":
      return "EE certificate key too weak";
    case "CA_KEY_TOO_SMALL":
      return "CA certificate key too weak";
    case "CA_MD_TOO_WEAK":
      return "CA signature digest algorithm too weak";
    case "INVALID_CALL":
      return "Invalid certificate verification context";
    case "STORE_LOOKUP":
      return "Issuer certificate lookup error";
    case "NO_VALID_SCTS":
      return "Certificate Transparency required, but no valid SCTs found";
    case "PROXY_SUBJECT_NAME_VIOLATION":
      return "proxy subject name violation";
    case "OCSP_VERIFY_NEEDED":
      return "OCSP verification needed";
    case "OCSP_VERIFY_FAILED":
      return "OCSP verification failed";
    case "OCSP_CERT_UNKNOWN":
      return "OCSP unknown cert";
    default:
      return "unknown certificate verification error";
  }
}


module.exports = {
    checkCertificate : checkCertificate,
    Certificate : Certificate,
    ErrorResult : ErrorResult
}