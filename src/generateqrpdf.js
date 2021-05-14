import SwissQRBill from "swissqrbill/lib/browser";
import { showError, showProgress, uploadFileAsAttachment } from "./utils";

export const generateQRPDF = (
  paymentinfo,
  docname,
  frm,
  papersize,
  language
) => {
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
};
