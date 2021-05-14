import { generateQRPDF } from "./generateqrpdf";
import { generateQRConfig } from "./qrconfig";
import {
  getCurrency,
  getDocument,
  getLanguageCode,
  getReferenceCode,
  showError,
  showProgress,
} from "./utils";

export const createQRBill = async (frm) => {
  showProgress(10, "getting data...");
  const customer = frm.doc.customer;
  const amount = frm.doc.grand_total;
  const reference = getReferenceCode(frm.doc.name);
  const company = frm.doc.company;
  const language = getLanguageCode(frm.doc.language);
  const bank = await getDocument("Swiss QR Bill Settings", company);
  const bankAccount = bank.bank_account;
  const currency = getCurrency(frm.doc.currency);
  if (!currency) return;

  const companyAddress = await getDocument("Address", frm.doc.company_address);
  const customerAddress = await getDocument(
    "Address",
    frm.doc.customer_address
  );
  const { iban } = await getDocument("Bank Account", bankAccount);

  showProgress(40, "generating pdf...");
  if (companyAddress.country !== "Switzerland") {
    showError("Company Should Be Switzerland");
    return;
  }
  const companyCountry = await getDocument("Country", companyAddress.country);
  const customerCountry = await getDocument("Country", customerAddress.country);

  const companyAddressCode = companyCountry.code.toUpperCase();
  const customerAddressCode = customerCountry.code.toUpperCase();

  const config = generateQRConfig(
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
  );

  generateQRPDF(config, frm.docname, frm, "A4", language);
};
