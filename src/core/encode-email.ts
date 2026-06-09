// Encode the email to prevent XSS while leaving valid characters intact,
// per https://en.wikipedia.org/wiki/Email_address#Syntax
export function encodeEmail(email: string): string {
  return encodeURI(email)
    .replace("%20", " ")
    .replace("%25", "%")
    .replace("%5E", "^")
    .replace("%60", "`")
    .replace("%7B", "{")
    .replace("%7C", "|")
    .replace("%7D", "}");
}
