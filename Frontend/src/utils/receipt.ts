import { jsPDF } from "jspdf";

export class ReceiptService {
  static generatePDF(order: any, businessInfo: any) {
    const doc = new jsPDF({
      unit: "mm",
      format: [80, 200], // Standard thermal receipt width
    });

    const margin = 5;
    let y = 10;

    // Business Header
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(businessInfo.business_name || "StockConnect Store", 40, y, { align: "center" });
    y += 5;

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    if (businessInfo.address) {
      doc.text(businessInfo.address, 40, y, { align: "center" });
      y += 4;
    }
    if (businessInfo.phone) {
      doc.text(`Tel: ${businessInfo.phone}`, 40, y, { align: "center" });
      y += 4;
    }
    
    y += 2;
    doc.line(margin, y, 75, y);
    y += 5;

    // Order Info
    doc.setFont("helvetica", "bold");
    doc.text(`Receipt #: ${order.id}`, margin, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.created_at || Date.now()).toLocaleString()}`, margin, y);
    y += 4;
    if (order.customer_name) {
      doc.text(`Customer: ${order.customer_name}`, margin, y);
      y += 4;
    }

    y += 2;
    doc.line(margin, y, 75, y);
    y += 5;

    // Items Header
    doc.setFont("helvetica", "bold");
    doc.text("Item", margin, y);
    doc.text("Qty", 45, y);
    doc.text("Total", 75, y, { align: "right" });
    y += 4;
    doc.line(margin, y, 75, y);
    y += 5;

    // Items List
    doc.setFont("helvetica", "normal");
    const items = order.items || [];
    items.forEach((item: any) => {
      const name = item.product_name || `Product #${item.product_id}`;
      // Basic text wrapping for long names
      const splitName = doc.splitTextToSize(name, 35);
      doc.text(splitName, margin, y);
      doc.text(item.quantity.toString(), 45, y);
      doc.text(`N${(item.unit_price * item.quantity).toLocaleString()}`, 75, y, { align: "right" });
      y += (splitName.length * 4);
      
      if (y > 180) { // Safety for very long receipts
        doc.addPage();
        y = 10;
      }
    });

    y += 2;
    doc.line(margin, y, 75, y);
    y += 5;

    // Totals
    doc.setFont("helvetica", "bold");
    doc.text("GRAND TOTAL", margin, y);
    doc.text(`N${order.total_amount.toLocaleString()}`, 75, y, { align: "right" });
    y += 6;

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    const footer = businessInfo.receipt_footer || "Thank you for your business!";
    const splitFooter = doc.splitTextToSize(footer, 70);
    doc.text(splitFooter, 40, y, { align: "center" });
    
    // Save the PDF
    doc.save(`Receipt_${order.id}.pdf`);
  }
}
