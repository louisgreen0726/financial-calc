import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { logger } from "@/lib/logger";

interface ExportToPDFOptions {
  filename?: string;
  elementId?: string;
  title?: string;
  orientation?: "portrait" | "landscape";
}

export async function exportToPDF({
  filename = "export",
  elementId,
  title = "Financial Calculation Report",
  orientation = "portrait",
}: ExportToPDFOptions): Promise<void> {
  try {
    const doc = new jsPDF({
      orientation,
      unit: "mm",
      format: "a4",
    });

    if (elementId) {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pageWidth = orientation === "portrait" ? 210 : 297;
      const pageHeight = orientation === "portrait" ? 297 : 210;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add title at the top
      doc.setFontSize(16);
      doc.setTextColor(40);
      doc.text(title, 14, 15);

      // Add timestamp
      doc.setFontSize(10);
      doc.setTextColor(128);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

      // Add the captured element below the header
      const headerHeight = 28;
      const firstPageContentHeight = pageHeight - headerHeight;
      doc.addImage(imgData, "PNG", 0, headerHeight, imgWidth, imgHeight);

      let remainingHeight = imgHeight - firstPageContentHeight;
      while (remainingHeight > 0) {
        doc.addPage();
        const renderedHeight = imgHeight - remainingHeight;
        doc.addImage(imgData, "PNG", 0, -renderedHeight, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }
    } else {
      // Add title and timestamp
      doc.setFontSize(20);
      doc.text(title, 20, 20);

      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 30);
    }

    doc.save(`${filename}.pdf`);
  } catch (error) {
    logger.error("PDF export error:", error);
    throw error;
  }
}

export function generatePDFReport(title: string, content: Array<{ label: string; value: string }>): jsPDF {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(24);
  doc.text(title, 20, 30);

  // Timestamp
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 40);

  // Content
  doc.setTextColor(0);
  let y = 60;

  content.forEach((item) => {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(item.label, 20, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(item.value, 20, y + 7);

    y += 20;

    // Add new page if needed
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
  });

  return doc;
}
