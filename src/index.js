// Swiss QR Bill Library
import { BlobStream, PDF } from "swissqrbill";

function main(paymentinfo, papersize, language) {
  const data = paymentinfo;
  // Creating A Stream
  const stream = new BlobStream();
  // Getting PDF
  const pdf = new PDF(data, stream, {
    language: language || "DE",
    size: papersize || "A4",
  });
  // On PDF Generation Attach
  pdf.on("finish", () => {
    const url = stream.toBlobURL("application/pdf");
    triggerDownload(url);
  });
}

function triggerDownload(uri) {
  var evt = new MouseEvent("click", {
    view: window,
    bubbles: false,
    cancelable: true,
  });
  var a = document.createElement("a");
  a.setAttribute("download", "recipt.pdf");
  a.setAttribute("href", uri);
  a.setAttribute("target", "_blank");
  a.dispatchEvent(evt);
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
    return ac.message;
  } catch (error) {
    console.error(error);
  }
};

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm, cdt, ndt) => {
    console.log(frm);

    let customer = frm.doc.customer;
    let amount = frm.doc.grand_total;
    const ref = frm.doc.docname.split("-");
    const padding = "0".repeat(27 - ref.length);
    const reference = `${padding}${ref.pop()}`;

    let company = frm.doc.company;
    let companyAdderss = getAddress("Address", frm.doc.company_address);
    let currency = frm.doc.party_account_currency;
    let customerAddress = getAddress("Address", frm.doc.customer_address);
    let iban = getAccount(company);

    Promise.all([companyAdderss, customerAddress, iban]).then(
      (companyAddress, customerAddress, iban) => {
        const config = {
          currency,
          amount,
          reference,
          creditor: {
            name: company, //
            address: `${companyAddress.address_line1} ${companyAddress.address_line2}`, // Address Line 1 & line 2
            zip: parseInt(companyAddress.pincode), // Bank Account  Code
            city: companyAddress.city, // Bank Account City
            account: iban, // Bank Account Iban
            country: "US", // Bank Country
          },
          debtor: {
            name: customer, // Customer Doctype
            address: `${customerAddress.address_line1} ${customerAddress.address_line2}`, // Address Line 1 & 2
            zip: customerAddress.pincode, // Sales Invoice PCode
            city: customerAddress.city, // Sales Invoice City
            country: "US", // Sales Invoice Country
          },
        };
        main(config);
      }
    );
  },
});

// TODO Step 1: Get Country Both, Account
//TODO  Step 2 : To Find How Acutally Do Attachment
