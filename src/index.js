// Swiss QR Bill Library
import SwissQRBill from "swissqrbill/lib/browser";

function main(paymentinfo, docname, frm, papersize, language) {
  const data = paymentinfo;
  // Creating A Stream
  const stream = new SwissQRBill.BlobStream();
  // Getting PDF
  const pdf = new SwissQRBill.PDF(data, stream, {
    language: language || "DE",
    size: papersize || "A4",
  });
  // On PDF Generation Attach
  pdf.on("finish", () => {
    // const url = stream.toBlobURL("application/pdf");
    // const triggerDownload()
    // let reader = new FileReader();
    // reader.readAsBinaryString(stream.toBlob());
    // reader.onload(() => {
    console.log(stream, pdf);
    triggerAttachment(stream.toBlob(), docname, frm);
    // });
  });
}

function triggerAttachment(file, docname, frm) {
  let formdata = new FormData();
  formdata.append("is_private", 1);
  formdata.append("folder", "Home/Attachments");
  formdata.append("doctype", "Sales Invoice");
  formdata.append("docname", docname);
  formdata.append("file", file, `${docname}-QRBILL.pdf`);
  fetch("/api/method/upload_file", {
    headers: {
      Accept: "application/json",
      "X-Frappe-CSRF-Token": window.frappe.csrf_token,
    },
    method: "POST",
    body: formdata,
  }).then(() => {
    frm.reload_doc();
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

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm, cdt, ndt) => {
    console.log(frm);

    let customer = frm.doc.customer;
    let amount = frm.doc.grand_total;
    const ref = frm.docname.split("-");
    const padding = "0".repeat(27 - ref.length);
    const reference = `${padding}${ref.pop()}`;

    let company = frm.doc.company;
    let companyAdderss = window.frappe.db.get_doc(
      "Address",
      frm.doc.company_address
    );
    let currency = frm.doc.party_account_currency;
    let customerAddress = window.frappe.db.get_doc(
      "Address",
      frm.doc.customer_address
    );
    let iban = window.frappe.db.get_value(
      "Bank Account",
      {
        is_default: 1,
        is_company_account: 1,
        company: company,
      },
      "iban"
    );

    companyAdderss.then((val) => console.log(val));
    customerAddress.then((val) => console.log(val));
    iban.then((val) => console.log(val));

    Promise.all([companyAdderss, customerAddress, iban]).then((values) => {
      const companyAddress = values[0];
      const customerAddress = values[1];
      const iban = values[2];

      console.log(iban.message.iban);

      const config = {
        currency: "CHF",
        amount,
        reference: "210000000003139471430009017",
        creditor: {
          name: company, //
          address: `${companyAddress.address_line1} ${companyAddress.address_line2}`, // Address Line 1 & line 2
          zip: parseInt(companyAddress.pincode), // Bank Account  Code
          city: companyAddress.city, // Bank Account City
          account: "CH4431999123000889012", // Bank Account Iban
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
      main(config, frm.docname, frm);
    });
  },
});
