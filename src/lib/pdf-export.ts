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
        onclone: (clonedDocument) => {
          const style = clonedDocument.createElement("style");
          style.textContent = `
            html, body {
              background: #ffffff !important;
              color: #111827 !important;
            }
            * {
              text-shadow: none !important;
              box-shadow: none !important;
              animation: none !important;
              transition: none !important;
            }
            .dark, .dark * {
              color-scheme: light !important;
            }
            [data-slot="card"], .bg-card, .card {
              background: #ffffff !important;
              color: #111827 !important;
              border-color: #d1d5db !important;
            }
          `;
          clonedDocument.head.appendChild(style);
        },
      });

      const pageWidth = orientation === "portrait" ? 210 : 297;
      const pageHeight = orientation === "portrait" ? 297 : 210;
      const marginX = 10;
      const contentWidth = pageWidth - marginX * 2;

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
      const bottomMargin = 10;
      let sourceY = 0;
      let pageIndex = 0;

      while (sourceY < canvas.height) {
        const y = pageIndex === 0 ? headerHeight : bottomMargin;
        const availableHeightMm = pageHeight - y - bottomMargin;
        const availableHeightPx = Math.floor((availableHeightMm * canvas.width) / contentWidth);
        const sliceHeightPx = Math.min(canvas.height - sourceY, availableHeightPx);
        const sliceHeightMm = (sliceHeightPx * contentWidth) / canvas.width;

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;
        const context = pageCanvas.getContext("2d");
        if (!context) {
          throw new Error("Unable to create PDF page canvas");
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        context.drawImage(canvas, 0, sourceY, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx);

        const pageImgData = pageCanvas.toDataURL("image/png");
        doc.addImage(pageImgData, "PNG", marginX, y, contentWidth, sliceHeightMm);

        sourceY += sliceHeightPx;
        if (sourceY < canvas.height) {
          doc.addPage();
        }
        pageIndex += 1;
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
