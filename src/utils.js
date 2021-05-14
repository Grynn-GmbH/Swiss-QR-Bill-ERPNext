import { updateMessage } from "./message";

/**
 * Shows Progress Bar For Uploading QR Bill
 * @param {Number} current Current Progress
 * @param {String} description Desciption
 */
export const showProgress = (current, description) => {
  const title = updateMessage;
  const total = 100;
  window.frappe.show_progress(title, current, total, description, true);
};
