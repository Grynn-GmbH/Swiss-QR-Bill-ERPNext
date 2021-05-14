import { createQRBill } from "./createqrbill";
import { getReferenceCode } from "./utils";

window.frappe.ui.form.on("Sales Invoice", {
  on_submit: (frm) => {
    createQRBill(frm);
  },

  onload: (frm) => {
    frm.doc.esr_reference_code = "";
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
