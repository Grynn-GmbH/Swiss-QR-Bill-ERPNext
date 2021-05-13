import SwissQRBill from "swissqrbill/lib/browser";

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
      triggerAttachment(stream.toBlob(), docname, frm);
    });
  } catch (error) {
    showError(error);
  }
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
    showProgress(100, "done");
    frm.reload_doc();
  });
}

// function triggerDownload(uri) {
//   var evt = new MouseEvent("click", {
//     view: window,
//     bubbles: false,
//     cancelable: true,
//   });
//   var a = document.createElement("a");
//   a.setAttribute("download", "recipt.pdf");
//   a.setAttribute("href", uri);
//   a.setAttribute("target", "_blank");
//   a.dispatchEvent(evt);
// }

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm) => {
    showProgress(10, "getting data...");
    let customer = frm.doc.customer;
    let amount = frm.doc.grand_total;
    const reference = getReference(frm.doc.name);
    let company = frm.doc.company;
    const language = getLanguage(frm.doc.language);
    let companyAdderss = window.frappe.db
      .get_doc("Address", frm.doc.company_address)
      .catch(() => showError("Company Address Not Found"));
    let currency = getCurrency(frm.doc.party_account_currency);

    let customerAddress = window.frappe.db
      .get_doc("Address", frm.doc.customer_address)
      .catch(() => showError("Customer Address Not Found"));
    let iban = window.frappe.db.get_value(
      "Bank Account",
      {
        is_default: 1,
        is_company_account: 1,
        company: company,
      },
      "iban"
    );

    Promise.all([companyAdderss, customerAddress, iban])
      .then((values) => {
        showProgress(40, "generating pdf...");
        const companyAddress = values[0];
        const customerAddress = values[1];
        const iban = values[2];

        const config = {
          currency,
          amount,
          reference,
          creditor: {
            name: company, //
            address: `${companyAddress.address_line1} ${companyAddress.address_line2}`, // Address Line 1 & line 2
            zip: parseInt(companyAddress.pincode), // Bank Account  Code
            city: companyAddress.city, // Bank Account City
            account: iban.message.iban, // Bank Account Iban
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
        main(config, frm.docname, frm, "A4", language);
      })
      .catch((error) => {
        showError(error);
      });
  },

  before_submit: (frm) => {
    const reference = getReference(frm.doc.name);
    frm.doc.esr_reference_code = reference;
  },
});

const showProgress = (current, description) => {
  const title = "Uploading Swiss QR Bill";
  const total = 100;
  window.frappe.show_progress(title, current, total, description, true);
};

const getCurrency = (currency) => {
  if (currency === "CHF" || currency === "EUR") {
    return currency;
  }
  return "CHF";
};

const getReference = (docname) => {
  const _ref = docname.split("-").join("");
  const ref = _ref.substr(_ref.length - 7);
  const _reference = `000000000000000000${ref}0`;
  const checksum = SwissQRBill.utils.calculateQRReferenceChecksum(_reference);
  return `${_reference}${checksum}`;
};

const showError = (error) => {
  window.frappe.hide_progress();
  window.frappe.throw(error);
};

const getLanguage = (language) => {
  if (language === "en-US" || language === "en-GB") {
    return "EN";
  }

  if (
    (language === "en") |
    (language === "fr") |
    (language === "it") |
    (language === "de")
  ) {
    return language.toUpperCase();
  }
  return "DE";
};
