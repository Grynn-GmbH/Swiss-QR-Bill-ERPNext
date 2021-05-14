import SwissQRBill from "swissqrbill/lib/browser";
import {
  showProgress,
  uploadFileAsAttachment,
  showError,
  getLanguageCode,
  getDocument,
  getReferenceCode,
  getCurrency,
} from "./utils";

function main(paymentinfo, docname, frm, papersize, language) {
  const data = paymentinfo;
  const stream = new SwissQRBill.BlobStream();
  try {
    const pdf = new SwissQRBill.PDF(data, stream, {
      language: language || "DE",
      size: papersize || "A4",
    });

    showProgress(60, "generating pdf...");
    pdf.on("finish", () => {
      // const url = stream.toBlobURL("application/pdf");
      // const triggerDownload()
      showProgress(80, "uploading pdf...");
      uploadFileAsAttachment(stream.toBlob(), docname, frm);
    });
  } catch (error) {
    showError(error);
  }
}

const createQRBill = async (frm) => {
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
  const iban = await getDocument("Bank Account", bankAccount);

  showProgress(40, "generating pdf...");
  if (companyAddress.country !== "Switzerland") {
    showError("Company Should Be Switzerland");
    return;
  }
  const companyCountry = await getDocument("Country", companyAddress.country);
  const customerCountry = await getDocument("Country", customerAddress.country);

  const companyCode = companyCountry.code.toUpperCase();
  const customerCode = customerCountry.code.toUpperCase();

  const config = {
    currency,
    amount,
    reference,
    creditor: {
      name: company, //
      address: `${companyAddress.address_line1} ${companyAddress.address_line2}`, // Address Line 1 & line 2
      zip: parseInt(companyAddress.pincode), // Bank Account  Code
      city: companyAddress.city, // Bank Account City
      account: iban.iban, // Bank Account Iban
      country: companyCode, // Bank Country
    },
    debtor: {
      name: customer, // Customer Doctype
      address: `${customerAddress.address_line1} ${customerAddress.address_line2}`, // Address Line 1 & 2
      zip: customerAddress.pincode, // Sales Invoice PCode
      city: customerAddress.city, // Sales Invoice City
      country: customerCode, // Sales Invoice Country
    },
  };
  main(config, frm.docname, frm, "A4", language);
};

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm) => {
    createQRBill(frm);
  },

  before_submit: (frm) => {
    const reference = getReferenceCode(frm.doc.name);
    frm.doc.esr_reference_code = reference;
  },
  refresh: (frm) => {
    frm.add_custom_button("Create QR Bill", function () {
      createQRBill(frm);
    });
  },
});
