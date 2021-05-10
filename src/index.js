// Swiss QR Bill Library
import { BlobStream, PDF } from "swissqrbill";

function main(paymentinfo) {
  const data = {
    currency: paymentinfo.currency, // Doctype Currency
    amount: parseInt(paymentinfo.amount), // Doctype Amount
    reference: paymentinfo.reference, // No Reference
    creditor: {
      name: paymentinfo.acfullname, //
      address: `${paymentinfo.achousenum} ${paymentinfo.acstreet}`, // Address Line 1 & line 2
      zip: parseInt(paymentinfo.aczipcode), // Bank Account  Code
      city: paymentinfo.actown, // Bank Account City
      account: paymentinfo.iban, // Bank Account Iban
      country: paymentinfo.accountry, // Bank Country
    },
    debtor: {
      name: paymentinfo.payfullname, // Customer Doctype
      address: `${paymentinfo.payhousenum} ${paymentinfo.paystreet}`, // Address Line 1 & 2
      zip: parseInt(paymentinfo.payzipcode), // Sales Invoice PCode
      city: paymentinfo.paytown, // Sales Invoice City
      country: paymentinfo.paycountry, // Sales Invoice Country
    },
  };

  // Creating A Stream
  const stream = new BlobStream();

  // Getting PDF
  const pdf = new PDF(data, stream, {
    language: paymentinfo.language,
    size: paymentinfo.papersize,
  });

  // On PDF Generation Attach
  pdf.on("finish", () => {});
}

const getAddress = async (doctype, docname) => {
  try {
    const address = await window.frappe.db.get_doc(doctype, docname);
    return address;
  } catch (rejectedValue) {
    console.error(rejectedValue);
  }
};

const getAccount = async (companyName) => {
  try {
    const ac = await window.frappe.db.get_value(
      "Bank Account",
      {
        is_default: 1,
        is_company_account: 1,
        company: companyName,
      },
      "iban"
    );
    return ac;
  } catch (error) {
    console.error(error);
  }
};

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm, cdt, ndt) => {
    console.log(frm);
    let customer = frm.doc.customer;
    let currency = frm.doc.currency;
    let grand_total = frm.doc.grand_total;
    let company = frm.doc.company;
    let company_name = frm.doc.company_name;
    let company_address = frm.doc.company_address_name;
    let company_account_currency = frm.doc.party_account_currency;

    // const address = getAddress("Address", frm.doc.customer_address_name);
    // const comapny_address = getAddress(
    //   "Address",
    //   frm.doc.customer_address_name
    // );
    // window.frappe.db
    //   .get_value(
    //     "Bank Account",
    //     {
    //       is_default: 1,
    //       is_company_account: 1,
    //       company: "Grynn Advanced",
    //     },
    //     "iban"
    //   )
    console.log(
      currency,
      customer,
      grand_total,
      company,
      company_name,
      company_address,
      company_account_currency
    );
  },
});

// TODO Step 1: Get Country Both, Account
//TODO  Step 2 : To Find How Acutally Do Attachment
