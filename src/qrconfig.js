/**
 * Creates Address Configuration
 * @param {String} currency CHF | EUR
 * @param {*} amount Amount To Pay
 * @param {String} reference Reference Code
 * @param {String} company Company Name
 * @param {Object} companyAddress Company Address
 * @param {String} companyAddressCode ALPHA-2 Address Code
 * @param {String} iban QR-IBAN
 * @param {String} customer Customer Name
 * @param {Object} customerAddress Customer Address
 * @param {String} customerAddressCode Customer Address Code
 * @returns Address Configuration
 */
export const generateQRConfig = (
  currency,
  amount,
  company,
  companyAddress,
  companyAddressCode,
  iban,
  customer,
  customerAddress,
  customerAddressCode,
  reference
) => ({
  currency,
  amount,
  reference,
  creditor: {
    name: company, //
    address: `${companyAddress.address_line1} ${companyAddress.address_line2}`, // Address Line 1 & line 2
    zip: parseInt(companyAddress.pincode), // Bank Account  Code
    city: companyAddress.city, // Bank Account City
    account: iban, // Bank Account Iban
    country: companyAddressCode, // Bank Country
  },
  debtor: {
    name: customer, // Customer Doctype
    address: `${customerAddress.address_line1} ${customerAddress.address_line2}`, // Address Line 1 & 2
    zip: customerAddress.pincode, // Sales Invoice PCode
    city: customerAddress.city, // Sales Invoice City
    country: customerAddressCode, // Sales Invoice Country
  },
});
