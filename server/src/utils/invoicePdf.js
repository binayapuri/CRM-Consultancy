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
      const payment = invoice.payment || {};

      const title = invoice.gstEnabled ? 'TAX INVOICE' : 'INVOICE';

      const pageW = doc.page.width;
      const left = doc.page.margins.left;
      const right = pageW - doc.page.margins.right;
      const contentW = right - left;

      // Header band (sample-like)
      const bandH = 70;
      doc.save();
      doc.rect(0, 0, pageW, bandH).fill('#0B4F8A');
      doc.fillColor('white');
      doc.font('Helvetica-Bold').fontSize(28).text(title === 'TAX INVOICE' ? 'TAX INVOICE' : 'INVOICE', left, 22, { width: contentW });
      doc.font('Helvetica-Bold').fontSize(10).text(`Invoice No: ${invoice.invoiceNumber}`, left, 18, { width: contentW, align: 'right' });
      doc.font('Helvetica').fontSize(9).text(`Date: ${fmtDate(invoice.issueDate)}`, left, 34, { width: contentW, align: 'right' });
      if (invoice.dueDate) doc.font('Helvetica').fontSize(9).text(`Due: ${fmtDate(invoice.dueDate)}`, left, 48, { width: contentW, align: 'right' });
      doc.restore();

      doc.y = bandH + 18;

      // Subtle separator line
      doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#E2E8F0').lineWidth(1).stroke();
      doc.moveDown(0.8);

      // From / To blocks
      const colGap = 26;
      const colW = (contentW - colGap) / 2;
      const fromX = left;
      const toX = left + colW + colGap;
      const blockY = doc.y;

      const drawParty = (label, party, x) => {
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text(label, x, blockY, { width: colW });
        doc.font('Helvetica-Bold').fontSize(12).text(party.name || '—', x, doc.y + 6, { width: colW });
        doc.font('Helvetica').fontSize(10).fillColor('#334155');
        if (party.abn) doc.text(`ABN: ${party.abn}`, x, doc.y + 3, { width: colW });
        if (party.phone) doc.text(party.phone, x, doc.y + 2, { width: colW });
        if (party.email) doc.text(party.email, x, doc.y + 2, { width: colW });
        const addr = party.address || {};
        const addrLine = [addr.street, addr.suburb, addr.city, addr.state, addr.postcode, addr.country].filter(Boolean).join(', ');
        if (addrLine) doc.text(addrLine, x, doc.y + 2, { width: colW });
      };

      drawParty('From', supplier, fromX);
      drawParty('To', customer, toX);

      doc.y = Math.max(doc.y, blockY + 110);
      doc.moveDown(0.2);

      doc.moveDown(1.5);

      // Period
      if (invoice.period?.from || invoice.period?.to) {
        const periodText = `${fmtDate(invoice.period?.from)} - ${fmtDate(invoice.period?.to)}`;
        doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text(`Period: ${periodText}`);
        doc.moveDown(0.5);
      }

      // Table header
      const tableX = left;
      const tableW = contentW;
      const c1 = Math.floor(tableW * 0.54);
      const c2 = Math.floor(tableW * 0.12);
      const c3 = Math.floor(tableW * 0.16);
      const c4 = tableW - c1 - c2 - c3;

      // header row background
      const headerY = doc.y;
      doc.save();
      doc.rect(tableX, headerY - 2, tableW, 22).fill('#EEF2FF');
      doc.rect(tableX, headerY - 2, tableW, 22).stroke('#CBD5E1');
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A');
      doc.text('Description', tableX + 6, headerY + 4, { width: c1 - 6 });
      doc.text('Qty', tableX + c1, headerY + 4, { width: c2, align: 'right' });
      doc.text('Rate (AUD)', tableX + c1 + c2, headerY + 4, { width: c3, align: 'right' });
      doc.text('Amount', tableX + c1 + c2 + c3, headerY + 4, { width: c4, align: 'right' });
      doc.y = headerY + 26;

      // Rows
      doc.font('Helvetica').fontSize(10).fillColor('#0F172A');
      (invoice.lineItems || []).forEach((li) => {
        // light row separator
        doc.moveTo(tableX, doc.y - 2).lineTo(tableX + tableW, doc.y - 2).strokeColor('#F1F5F9').lineWidth(1).stroke();
        const y = doc.y;
        doc.text(li.description || '', tableX + 6, y, { width: c1 - 6 });
        doc.text(String(li.quantity ?? ''), tableX + c1, y, { width: c2, align: 'right' });
        doc.text(money(li.unitPrice), tableX + c1 + c2, y, { width: c3, align: 'right' });
        doc.text(money(li.amount), tableX + c1 + c2 + c3, y, { width: c4, align: 'right' });
        doc.moveDown(0.7);
      });

      doc.moveDown(0.4);

      // Totals
      const totalsBoxW = 230;
      const totalsBoxX = right - totalsBoxW;
      const totalsY = doc.y;
      doc.save();
      doc.rect(totalsBoxX, totalsY, totalsBoxW, invoice.gstEnabled ? 78 : 56).fill('#0B4F8A');
      doc.restore();
      doc.fillColor('white').font('Helvetica-Bold').fontSize(10);
      doc.text('Sub Total', totalsBoxX + 12, totalsY + 10, { width: 120 });
      doc.text(money(invoice.subtotal), totalsBoxX + 12, totalsY + 10, { width: totalsBoxW - 24, align: 'right' });
      if (invoice.gstEnabled) {
        doc.font('Helvetica').fontSize(9);
        doc.text('GST', totalsBoxX + 12, totalsY + 30, { width: 120 });
        doc.text(money(invoice.gstAmount), totalsBoxX + 12, totalsY + 30, { width: totalsBoxW - 24, align: 'right' });
      }
      doc.font('Helvetica-Bold').fontSize(12);
      doc.text('Total', totalsBoxX + 12, totalsY + (invoice.gstEnabled ? 50 : 30), { width: 120 });
      doc.text(money(invoice.total), totalsBoxX + 12, totalsY + (invoice.gstEnabled ? 50 : 30), { width: totalsBoxW - 24, align: 'right' });
      doc.fillColor('#0F172A');

      if (invoice.notes) {
        doc.y = Math.max(doc.y, totalsY + (invoice.gstEnabled ? 86 : 64));
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fillColor('#0F172A').text('Notes');
        doc.font('Helvetica').fillColor('#334155').text(invoice.notes);
      }

      // Payment info box
      doc.moveDown(1.0);
      const payY = doc.y;
      const boxH = 92;
      doc.save();
      doc.roundedRect(left, payY, contentW, boxH, 10).fill('#F8FAFC').stroke('#E2E8F0');
      doc.restore();
      doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F172A').text('Payment information', left + 14, payY + 10);
      doc.font('Helvetica').fontSize(9).fillColor('#334155');
      const linesL = [];
      const linesR = [];
      if (payment.bankName) linesL.push(`Bank: ${payment.bankName}`);
      if (payment.bsb) linesL.push(`BSB: ${payment.bsb}`);
      if (payment.accountNumber) linesL.push(`Account: ${payment.accountNumber}`);
      if (payment.accountName) linesL.push(`Account name: ${payment.accountName}`);
      if (payment.payId) linesR.push(`PayID (${payment.payIdType || '—'}): ${payment.payId}`);
      if (payment.reference) linesR.push(`Reference: ${payment.reference}`);
      if (!linesL.length && !linesR.length) linesL.push('Add bank/PayID details in Student Settings → Invoices.');
      const mid = left + Math.floor(contentW * 0.52);
      doc.text(linesL.join('\n'), left + 14, payY + 30, { width: mid - left - 20 });
      doc.text(linesR.join('\n'), mid, payY + 30, { width: right - mid - 14 });

      doc.moveDown(2.2);
      doc.font('Helvetica-Bold').fontSize(18).fillColor('#0B4F8A').text('Thank you!', { align: 'right' });

      doc.moveDown(0.2);
      doc.font('Helvetica').fontSize(9).fillColor('#334155').text(
        'Thank you for your business. Please make payment by the due date to the account listed above. If you have any questions regarding this invoice, feel free to contact me.',
        left,
        doc.y,
        { width: contentW }
      );

      doc.moveDown(0.8);
      doc.fontSize(8).fillColor('#64748B').text('Generated by BIGFEW Invoice Manager', { align: 'center' });
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

