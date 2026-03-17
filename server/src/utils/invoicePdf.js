import PDFDocument from 'pdfkit';

function money(n) {
  const v = Number(n || 0);
  return v.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' });
}

function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-AU');
}

export async function renderInvoicePdfBuffer(invoice) {
  return await new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const supplier = invoice.supplier || {};
      const customer = invoice.customer || {};

      const title = invoice.gstEnabled ? 'TAX INVOICE' : 'INVOICE';

      // Header
      doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'right' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Invoice No: ${invoice.invoiceNumber}`, { align: 'right' });
      doc.text(`Issue Date: ${fmtDate(invoice.issueDate)}`, { align: 'right' });
      if (invoice.dueDate) doc.text(`Due Date: ${fmtDate(invoice.dueDate)}`, { align: 'right' });

      doc.moveDown(1.2);

      // Supplier / Customer blocks
      const leftX = doc.x;
      const topY = doc.y;
      const colGap = 30;
      const colW = (doc.page.width - doc.page.margins.left - doc.page.margins.right - colGap) / 2;

      doc.font('Helvetica-Bold').fontSize(11).text('Supplier', leftX, topY, { width: colW });
      doc.font('Helvetica').fontSize(10);
      doc.text(supplier.name || '', { width: colW });
      if (supplier.abn) doc.text(`ABN: ${supplier.abn}`, { width: colW });
      if (supplier.email) doc.text(supplier.email, { width: colW });
      if (supplier.phone) doc.text(supplier.phone, { width: colW });
      const sAddr = supplier.address || {};
      const sAddrLine = [sAddr.street, sAddr.city, sAddr.state, sAddr.postcode, sAddr.country].filter(Boolean).join(', ');
      if (sAddrLine) doc.text(sAddrLine, { width: colW });

      const rightX = leftX + colW + colGap;
      doc.font('Helvetica-Bold').fontSize(11).text('Bill To', rightX, topY, { width: colW });
      doc.font('Helvetica').fontSize(10);
      doc.text(customer.name || '', rightX, doc.y, { width: colW });
      if (customer.abn) doc.text(`ABN: ${customer.abn}`, { width: colW });
      if (customer.email) doc.text(customer.email, { width: colW });
      if (customer.phone) doc.text(customer.phone, { width: colW });
      const cAddr = customer.address || {};
      const cAddrLine = [cAddr.street, cAddr.city, cAddr.state, cAddr.postcode, cAddr.country].filter(Boolean).join(', ');
      if (cAddrLine) doc.text(cAddrLine, { width: colW });

      doc.moveDown(1.5);

      // Period
      if (invoice.period?.from || invoice.period?.to) {
        const periodText = `Period: ${fmtDate(invoice.period?.from)} - ${fmtDate(invoice.period?.to)}`;
        doc.font('Helvetica-Bold').fontSize(10).text(periodText);
        doc.moveDown(0.5);
      }

      // Table header
      const tableX = doc.x;
      const tableW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const col1 = Math.floor(tableW * 0.52);
      const col2 = Math.floor(tableW * 0.12);
      const col3 = Math.floor(tableW * 0.18);
      const col4 = tableW - col1 - col2 - col3;

      doc.font('Helvetica-Bold').fontSize(10);
      doc.text('Description', tableX, doc.y, { width: col1 });
      doc.text('Qty', tableX + col1, doc.y, { width: col2, align: 'right' });
      doc.text('Unit Price', tableX + col1 + col2, doc.y, { width: col3, align: 'right' });
      doc.text('Amount', tableX + col1 + col2 + col3, doc.y, { width: col4, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(tableX, doc.y).lineTo(tableX + tableW, doc.y).strokeColor('#E2E8F0').stroke();
      doc.moveDown(0.4);

      // Rows
      doc.font('Helvetica').fontSize(10);
      (invoice.lineItems || []).forEach((li) => {
        const y = doc.y;
        doc.text(li.description || '', tableX, y, { width: col1 });
        doc.text(String(li.quantity ?? ''), tableX + col1, y, { width: col2, align: 'right' });
        doc.text(money(li.unitPrice), tableX + col1 + col2, y, { width: col3, align: 'right' });
        doc.text(money(li.amount), tableX + col1 + col2 + col3, y, { width: col4, align: 'right' });
        doc.moveDown(0.6);
      });

      doc.moveDown(0.3);
      doc.moveTo(tableX, doc.y).lineTo(tableX + tableW, doc.y).strokeColor('#E2E8F0').stroke();
      doc.moveDown(0.6);

      // Totals
      const totalsX = tableX + col1 + col2;
      const totalsW = col3 + col4;
      doc.font('Helvetica').fontSize(10);
      doc.text('Subtotal', totalsX, doc.y, { width: col3, align: 'right' });
      doc.text(money(invoice.subtotal), totalsX + col3, doc.y, { width: col4, align: 'right' });
      doc.moveDown(0.3);
      if (invoice.gstEnabled) {
        doc.text(`GST (${Math.round((invoice.gstRate || 0.1) * 100)}%)`, totalsX, doc.y, { width: col3, align: 'right' });
        doc.text(money(invoice.gstAmount), totalsX + col3, doc.y, { width: col4, align: 'right' });
        doc.moveDown(0.3);
      }
      doc.font('Helvetica-Bold');
      doc.text('Total', totalsX, doc.y, { width: col3, align: 'right' });
      doc.text(money(invoice.total), totalsX + col3, doc.y, { width: col4, align: 'right' });
      doc.font('Helvetica');

      if (invoice.notes) {
        doc.moveDown(1.2);
        doc.font('Helvetica-Bold').text('Notes');
        doc.font('Helvetica').text(invoice.notes);
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor('#64748B').text('Generated by BIGFEW Invoice Manager', { align: 'center' });
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

