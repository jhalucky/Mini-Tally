import React from "react";
import jsPDF from "jspdf";
import { numberToWords } from "../utils/amountToWords";
import { COMPANY } from "../data/items";

const f2  = (n) => (parseFloat(n) || 0).toFixed(2);
const fN  = (n) => (parseFloat(n) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

function splitText(pdf, text, maxW) {
  return pdf.splitTextToSize(String(text || ""), maxW);
}

// Draw a bordered rectangle outline
function box(pdf, x, y, w, h) {
  pdf.setDrawColor(0,0,0);
  pdf.rect(x, y, w, h, "S");
}

// Draw a cell: bordered rect + text inside
function cell(pdf, x, y, w, h, text, opts = {}) {
  box(pdf, x, y, w, h);
  const {
    align = "left",
    bold  = false,
    size  = 8,
    pad   = 1.5,
    valign = "top",
  } = opts;
  pdf.setFont("helvetica", bold ? "bold" : "normal");
  pdf.setFontSize(size);
  const lines = splitText(pdf, String(text || ""), w - pad * 2);
  const textX = align === "right" ? x + w - pad : align === "center" ? x + w / 2 : x + pad;
  const textY = valign === "middle" ? y + h / 2 + size * 0.18 : y + size * 0.35 + pad;
  pdf.text(lines, textX, textY, { align });
}

// Horizontal line
function hLine(pdf, x1, x2, y) {
  pdf.setDrawColor(0,0,0);
  pdf.line(x1, y, x2, y);
}

// Vertical line
function vLine(pdf, x, y1, y2) {
  pdf.setDrawColor(0,0,0);
  pdf.line(x, y1, x, y2);
}

// ─── MAIN PDF DRAW ────────────────────────────────────────────────────────────
function drawInvoicePage(pdf, bill, copyLabel) {
  const { billNumber, date, client, rows, gstType, gstRate } = bill;

  const PW  = 210;
  const ML  = 8;
  const MR  = 8;
  const RX  = PW - MR;
  const CW  = RX - ML;

  const isIGST = gstType === "igst";
  const gstPct = parseFloat(gstRate) || 0;

  // totals
  let subtotal = 0;
  rows.forEach(r => {
    const qty = r.qty===""||r.qty===undefined ? 1 : parseFloat(r.qty)||1;
    subtotal += qty * (parseFloat(r.rate)||0);
  });
  const gstAmt    = (subtotal * gstPct) / 100;
  const cgst      = isIGST ? 0 : gstAmt / 2;
  const sgst      = isIGST ? 0 : gstAmt / 2;
  const igst      = isIGST ? gstAmt : 0;
  const grandTotal = subtotal + gstAmt;

  let y = 8;

  // ── TITLE ROW ──────────────────────────────────────────────────────────────
  pdf.setFont("helvetica","bold"); pdf.setFontSize(13);
  pdf.text("Tax Invoice", PW/2, y+5, { align:"center" });
  pdf.setFont("helvetica","normal"); pdf.setFontSize(9);
  pdf.text("(" + copyLabel + ")", PW/2, y+10, { align:"center" });
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9);
  pdf.text("e-Invoice", RX, y+5, { align:"right" });
  y += 14;

  // outer border of the whole invoice
  box(pdf, ML, y, CW, 195);

  // ── SUPPLIER BOX (left half of top section) ────────────────────────────────
  const topH   = 30;
  const halfW  = CW / 2;

  // supplier box outline
  box(pdf, ML, y, halfW, topH);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(9.5);
  pdf.text(COMPANY.name, ML+2, y+5);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7.5);
  const supLines = [
    COMPANY.address,
    COMPANY.city,
    "GSTIN/UIN : " + COMPANY.gstin,
    "State Name : " + COMPANY.state + ",  Code : " + COMPANY.stateCode,
  ];
  let sy = y + 9;
  supLines.forEach(l => { pdf.text(l, ML+2, sy); sy += 3.8; });

  // ── INVOICE META BOX (right half of top section) ──────────────────────────
  const metaX = ML + halfW;
  box(pdf, metaX, y, halfW, topH);

  // Invoice No + Date
  const rowH = topH / 3;
  // row 1: Invoice No | Dated
  hLine(pdf, metaX, RX, y + rowH);
  hLine(pdf, metaX, RX, y + rowH * 2);
  vLine(pdf, metaX + halfW/2, y, y + topH);

  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  pdf.text("Invoice No.", metaX+2, y+3.5);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  pdf.text(billNumber, metaX+2, y+8);

  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  pdf.text("Dated", metaX + halfW/2 + 2, y+3.5);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  pdf.text(date, metaX + halfW/2 + 2, y+8);

  // row 2: Delivery Note | Mode of Payment
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  pdf.text("Delivery Note", metaX+2, y+rowH+3);
  pdf.text("Mode/Terms of Payment", metaX+halfW/2+2, y+rowH+3);

  // row 3: Reference No | Other References
  pdf.text("Reference No. & Date.", metaX+2, y+rowH*2+3);
  pdf.text("Other References", metaX+halfW/2+2, y+rowH*2+3);

  y += topH;

  // ── CONSIGNEE / BUYER BOXES ───────────────────────────────────────────────
  const partyH = 32;

  // consignee label
  box(pdf, ML, y, CW, partyH);
  vLine(pdf, ML+halfW, y, y+partyH);
  hLine(pdf, ML, RX, y + 4);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(7);
  pdf.text("Consignee (Ship to)", ML+2, y+3);

  const clientName = client?.company || client?.name || "Walk-in Customer";
  pdf.setFont("helvetica","bold"); pdf.setFontSize(9);
  pdf.text(clientName, ML+2, y+9);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7.5);
  let cy = y + 14;
  if (client?.address) { const al = splitText(pdf, client.address, halfW-6); pdf.text(al, ML+2, cy); cy += al.length*3.5; }
  if (client?.gstin)   { pdf.text("GSTIN/UIN : " + client.gstin, ML+2, cy); cy += 3.5; }
  if (client?.state)   { pdf.text("State Name : " + client.state + (client.stateCode?",  Code : "+client.stateCode:""), ML+2, cy); }

  // right half: buyer's order / dispatch info
  const rx2 = ML + halfW;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  pdf.text("Buyer's Order No.",        rx2+2, y+3);
  pdf.text("Dated",                    rx2+2, y+9);
  pdf.text("Dispatch Doc No.",         rx2+2, y+15);
  pdf.text("Delivery Note Date",       rx2+2, y+21);
  pdf.text("Dispatched through",       rx2+2, y+27);

  y += partyH;

  // ── BUYER (Bill to) ───────────────────────────────────────────────────────
  const buyerH = 28;
  box(pdf, ML, y, CW, buyerH);
  vLine(pdf, ML+halfW, y, y+buyerH);
  hLine(pdf, ML, RX, y+4);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(7);
  pdf.text("Buyer (Bill to)", ML+2, y+3);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(9);
  pdf.text(clientName, ML+2, y+9);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7.5);
  let by = y+14;
  if (client?.address) { const al = splitText(pdf, client.address, halfW-6); pdf.text(al, ML+2, by); by += al.length*3.5; }
  if (client?.gstin)   { pdf.text("GSTIN/UIN : " + client.gstin, ML+2, by); by += 3.5; }
  if (client?.state)   { pdf.text("State Name : " + client.state + (client.stateCode?",  Code : "+client.stateCode:""), ML+2, by); }

  // right: terms of delivery
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  pdf.text("Terms of Delivery", rx2+2, y+3);

  y += buyerH;

  // ── ITEMS TABLE HEADER ────────────────────────────────────────────────────
  // Columns: SI | Description | HSN/SAC | Qty | Rate | per | Disc.% | Amount
  const cols = {
    si:   { x: ML,       w: 8   },
    desc: { x: ML+8,     w: 68  },
    hsn:  { x: ML+76,    w: 22  },
    qty:  { x: ML+98,    w: 18  },
    rate: { x: ML+116,   w: 22  },
    per:  { x: ML+138,   w: 12  },
    disc: { x: ML+150,   w: 14  },
    amt:  { x: ML+164,   w: CW-164 },
  };

  const thH = 10;
  // header bg
  pdf.setFillColor(240,240,240);
  pdf.rect(ML, y, CW, thH, "F");
  box(pdf, ML, y, CW, thH);

  // vertical dividers in header
  Object.values(cols).forEach(c => {
    vLine(pdf, c.x, y, y + thH);
  });
  vLine(pdf, RX, y, y + thH);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5);
  const hdrs = ["SI\nNo", "Description of Goods", "HSN/SAC", "Quantity", "Rate", "per", "Disc.%", "Amount"];
  const cKeys = Object.keys(cols);
  hdrs.forEach((h, i) => {
    const c = cols[cKeys[i]];
    const lines = h.split("\n");
    const tx = c.x + c.w / 2;
    lines.forEach((l, li) => pdf.text(l, tx, y + 4 + li * 3.5, { align:"center" }));
  });

  y += thH;

  // ── ITEM ROWS ─────────────────────────────────────────────────────────────
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8);

  rows.forEach((row, idx) => {
    const qty    = row.qty===""||row.qty===undefined ? 1 : parseFloat(row.qty)||1;
    const rate   = parseFloat(row.rate)||0;
    const amount = qty * rate;
    const rowH   = 10;

    // row border
    box(pdf, ML, y, CW, rowH);
    Object.values(cols).forEach(c => vLine(pdf, c.x, y, y + rowH));
    vLine(pdf, RX, y, y + rowH);

    pdf.setFont("helvetica","normal"); pdf.setFontSize(8);
    pdf.text(String(idx+1),    cols.si.x   + cols.si.w/2,   y+6, { align:"center" });
    const dl = splitText(pdf, row.particulars||"", cols.desc.w-2);
    pdf.text(dl,               cols.desc.x + 1.5,            y+5);
    pdf.text(row.hsnCode||"",  cols.hsn.x  + cols.hsn.w/2,  y+6, { align:"center" });
    pdf.text(f2(qty),          cols.qty.x  + cols.qty.w-1.5, y+6, { align:"right" });
    pdf.text(f2(rate),         cols.rate.x + cols.rate.w-1.5,y+6, { align:"right" });
    pdf.text("Nos",            cols.per.x  + cols.per.w/2,   y+6, { align:"center" });
    pdf.text("",               cols.disc.x + cols.disc.w/2,  y+6, { align:"center" });
    pdf.text(fN(amount),       cols.amt.x  + cols.amt.w-1.5, y+6, { align:"right" });

    y += rowH;
  });

  // ── GST ROWS inside the table ─────────────────────────────────────────────
  const gstRowH = 8;

  if (!isIGST) {
    // CGST row
    box(pdf, ML, y, CW, gstRowH);
    Object.values(cols).forEach(c => vLine(pdf, c.x, y, y + gstRowH));
    vLine(pdf, RX, y, y + gstRowH);
    pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
    pdf.text("CGST", cols.desc.x + cols.desc.w/2, y+5, { align:"center" });
    pdf.text(fN(cgst), cols.amt.x + cols.amt.w-1.5, y+5, { align:"right" });
    y += gstRowH;

    // SGST row
    box(pdf, ML, y, CW, gstRowH);
    Object.values(cols).forEach(c => vLine(pdf, c.x, y, y + gstRowH));
    vLine(pdf, RX, y, y + gstRowH);
    pdf.text("SGST", cols.desc.x + cols.desc.w/2, y+5, { align:"center" });
    pdf.text(fN(sgst), cols.amt.x + cols.amt.w-1.5, y+5, { align:"right" });
    y += gstRowH;
  } else {
    // IGST row
    box(pdf, ML, y, CW, gstRowH);
    Object.values(cols).forEach(c => vLine(pdf, c.x, y, y + gstRowH));
    vLine(pdf, RX, y, y + gstRowH);
    pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
    pdf.text("IGST", cols.desc.x + cols.desc.w/2, y+5, { align:"center" });
    pdf.text(fN(igst), cols.amt.x + cols.amt.w-1.5, y+5, { align:"right" });
    y += gstRowH;
  }

  // ── TOTAL ROW ─────────────────────────────────────────────────────────────
  const totRowH = 9;
  box(pdf, ML, y, CW, totRowH);
  Object.values(cols).forEach(c => vLine(pdf, c.x, y, y + totRowH));
  vLine(pdf, RX, y, y + totRowH);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.text("Total", cols.desc.x + 2, y+6);
  // qty total
  const totalQty = rows.reduce((s,r) => s + (r.qty===""||r.qty===undefined?1:parseFloat(r.qty)||1), 0);
  pdf.text(f2(totalQty)+" Nos", cols.qty.x + cols.qty.w-1.5, y+6, { align:"right" });
  pdf.text("\u20B9 " + fN(grandTotal), cols.amt.x + cols.amt.w-1.5, y+6, { align:"right" });

  y += totRowH + 2;

  // ── AMOUNT IN WORDS ───────────────────────────────────────────────────────
  box(pdf, ML, y, CW, 10);
  hLine(pdf, ML, RX, y+5);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5);
  pdf.text("Amount Chargeable (in words)", ML+2, y+4);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8.5);
  pdf.text("Indian Rupee " + numberToWords(grandTotal).replace(" Rupees Only","") + " Only", ML+2, y+8.5);
  pdf.setFont("helvetica","italic"); pdf.setFontSize(7.5);
  pdf.text("E. & O.E", RX-2, y+8.5, { align:"right" });

  y += 12;

  // ── GST SUMMARY TABLE ─────────────────────────────────────────────────────
  const gsH = 16;
  box(pdf, ML, y, CW, gsH);

  // columns: HSN/SAC | Taxable Value | Central Tax Rate | Central Tax Amt | State Tax Rate | State Tax Amt | Total
  const gc = {
    hsn:   { x: ML,       w: 22  },
    tax:   { x: ML+22,    w: 28  },
    cRate: { x: ML+50,    w: 18  },
    cAmt:  { x: ML+68,    w: 26  },
    sRate: { x: ML+94,    w: 18  },
    sAmt:  { x: ML+112,   w: 26  },
    tot:   { x: ML+138,   w: CW-138 },
  };

  // header row of GST table
  hLine(pdf, ML, RX, y+8);
  Object.values(gc).forEach(c => {
    vLine(pdf, c.x, y, y+gsH);
  });
  vLine(pdf, RX, y, y+gsH);

  // merged header cells for Central Tax / State Tax
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7);
  pdf.text("HSN/SAC",       gc.hsn.x  + gc.hsn.w/2,               y+4, { align:"center" });
  pdf.text("Taxable\nValue",gc.tax.x  + gc.tax.w/2,               y+3, { align:"center" });
  pdf.text("Central Tax",   gc.cRate.x + (gc.cRate.w+gc.cAmt.w)/2, y+4, { align:"center" });
  pdf.text("State Tax",     gc.sRate.x + (gc.sRate.w+gc.sAmt.w)/2, y+4, { align:"center" });
  pdf.text("Total",         gc.tot.x  + gc.tot.w/2,               y+4, { align:"center" });

  // sub-headers
  pdf.text("Rate",   gc.cRate.x + gc.cRate.w/2, y+7, { align:"center" });
  pdf.text("Amount", gc.cAmt.x  + gc.cAmt.w/2,  y+7, { align:"center" });
  pdf.text("Rate",   gc.sRate.x + gc.sRate.w/2, y+7, { align:"center" });
  pdf.text("Amount", gc.sAmt.x  + gc.sAmt.w/2,  y+7, { align:"center" });
  pdf.text("Tax Amount", gc.tot.x + gc.tot.w/2, y+7, { align:"center" });

  // data row
  pdf.setFont("helvetica","normal"); pdf.setFontSize(8);
  const rowY = y + 12;
  // group by HSN if available, else show single row
  const hsnVal = rows[0]?.hsnCode || "";
  pdf.text(hsnVal,          gc.hsn.x  + gc.hsn.w/2,  rowY, { align:"center" });
  pdf.text(fN(subtotal),    gc.tax.x  + gc.tax.w-1.5, rowY, { align:"right" });
  pdf.text((gstPct/2)+"%",  gc.cRate.x+ gc.cRate.w/2, rowY, { align:"center" });
  pdf.text(fN(cgst),        gc.cAmt.x + gc.cAmt.w-1.5,rowY, { align:"right" });
  pdf.text((gstPct/2)+"%",  gc.sRate.x+ gc.sRate.w/2, rowY, { align:"center" });
  pdf.text(fN(sgst),        gc.sAmt.x + gc.sAmt.w-1.5,rowY, { align:"right" });
  pdf.text(fN(cgst+sgst+igst), gc.tot.x+gc.tot.w-1.5, rowY, { align:"right" });

  y += gsH;

  // total row of GST table
  box(pdf, ML, y, CW, 8);
  Object.values(gc).forEach(c => vLine(pdf, c.x, y, y+8));
  vLine(pdf, RX, y, y+8);
  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  pdf.text("Total", gc.hsn.x+2, y+5.5);
  pdf.text(fN(subtotal),   gc.tax.x  + gc.tax.w-1.5,  y+5.5, { align:"right" });
  pdf.text(fN(cgst),       gc.cAmt.x + gc.cAmt.w-1.5, y+5.5, { align:"right" });
  pdf.text(fN(sgst),       gc.sAmt.x + gc.sAmt.w-1.5, y+5.5, { align:"right" });
  pdf.text(fN(cgst+sgst+igst), gc.tot.x+gc.tot.w-1.5, y+5.5, { align:"right" });

  y += 10;

  // ── TAX IN WORDS ──────────────────────────────────────────────────────────
  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5);
  pdf.text("Tax Amount (in words) :  Indian Rupee " + numberToWords(cgst+sgst+igst).replace(" Rupees Only","") + " Only", ML, y+4);

  y += 10;

  // ── DECLARATION + SIGNATORY ───────────────────────────────────────────────
  box(pdf, ML, y, CW, 28);
  vLine(pdf, ML+halfW, y, y+28);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(7.5);
  pdf.text("Declaration", ML+2, y+4);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7);
  const decl = "We declare that this invoice shows the actual price of the\ngoods described and that all particulars are true and correct.";
  pdf.text(decl, ML+2, y+9);

  pdf.setFont("helvetica","bold"); pdf.setFontSize(8);
  pdf.text("for " + COMPANY.name, ML+halfW+2, y+4);
  pdf.setFont("helvetica","normal"); pdf.setFontSize(7.5);
  pdf.text("Authorised Signatory", ML+halfW+2, y+24);

  y += 30;

  // ── FOOTER ────────────────────────────────────────────────────────────────
  pdf.setFont("helvetica","italic"); pdf.setFontSize(7.5);
  pdf.text("This is a Computer Generated Invoice", PW/2, y+2, { align:"center" });
}

// ─── SCREEN COMPONENT ─────────────────────────────────────────────────────────
export default function Invoice({ bill, onClose, onNewBill }) {
  const { billNumber, date, client, rows, gstType, gstRate } = bill;

  const isIGST = gstType === "igst";
  const gstPct = parseFloat(gstRate) || 0;

  const subtotal = rows.reduce((s,r) => {
    const qty = r.qty===""||r.qty===undefined?1:parseFloat(r.qty)||1;
    return s + qty*(parseFloat(r.rate)||0);
  }, 0);
  const gstAmt   = (subtotal * gstPct) / 100;
  const cgst     = isIGST ? 0 : gstAmt/2;
  const sgst     = isIGST ? 0 : gstAmt/2;
  const igst     = isIGST ? gstAmt : 0;
  const grandTotal = subtotal + gstAmt;
  const fN = (n) => (parseFloat(n)||0).toLocaleString("en-IN",{minimumFractionDigits:2});

  const handleDownloadPDF = () => {
    const pdf = new jsPDF("p","mm","a4");
    drawInvoicePage(pdf, bill, "CLIENT COPY");
    pdf.addPage();
    drawInvoicePage(pdf, bill, "OFFICE COPY");
    pdf.save("Invoice-"+billNumber+".pdf");
  };

  const S = {
    table: { width:"100%", borderCollapse:"collapse", fontSize:"10px" },
    th:    { border:"1px solid #000", padding:"4px 5px", textAlign:"center", background:"#f0f0f0", fontWeight:"bold" },
    td:    { border:"1px solid #000", padding:"3px 5px", fontSize:"10px" },
    tdr:   { border:"1px solid #000", padding:"3px 5px", fontSize:"10px", textAlign:"right" },
    tdc:   { border:"1px solid #000", padding:"3px 5px", fontSize:"10px", textAlign:"center" },
  };

  const InvoiceContent = ({ title }) => (
    <div style={{ width:"210mm", minHeight:"297mm", background:"#fff", color:"#000", fontFamily:"Arial,sans-serif", fontSize:"10px", padding:"6mm 8mm", boxSizing:"border-box", border:"1px solid #000" }}>

      {/* title row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"4px" }}>
        <div style={{ width:"60px" }}></div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontWeight:"bold", fontSize:"14px" }}>Tax Invoice</div>
          <div style={{ fontSize:"9px", color:"#555" }}>({title})</div>
        </div>
        <div style={{ fontWeight:"bold", fontSize:"10px" }}>e-Invoice</div>
      </div>

      {/* supplier + invoice meta */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
              <div style={{ fontWeight:"bold", fontSize:"12px" }}>{COMPANY.name}</div>
              <div style={{ fontSize:"9px", lineHeight:"1.6", marginTop:"2px" }}>
                {COMPANY.address}<br/>
                {COMPANY.city}<br/>
                GSTIN/UIN : {COMPANY.gstin}<br/>
                State Name : {COMPANY.state},&nbsp; Code : {COMPANY.stateCode}
              </div>
            </td>
            <td style={{ ...S.td, width:"50%", padding:"0", verticalAlign:"top" }}>
              <table style={{ ...S.table, height:"100%" }}>
                <tbody>
                  <tr>
                    <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
                      <div style={{ fontSize:"8px", color:"#555" }}>Invoice No.</div>
                      <div style={{ fontWeight:"bold" }}>{billNumber}</div>
                    </td>
                    <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
                      <div style={{ fontSize:"8px", color:"#555" }}>Dated</div>
                      <div style={{ fontWeight:"bold" }}>{date}</div>
                    </td>
                  </tr>
                  <tr>
                    <td style={S.td}><span style={{ fontSize:"8px", color:"#555" }}>Delivery Note</span></td>
                    <td style={S.td}><span style={{ fontSize:"8px", color:"#555" }}>Mode/Terms of Payment</span></td>
                  </tr>
                  <tr>
                    <td style={S.td}><span style={{ fontSize:"8px", color:"#555" }}>Reference No. & Date.</span></td>
                    <td style={S.td}><span style={{ fontSize:"8px", color:"#555" }}>Other References</span></td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* consignee + dispatch */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
              <div style={{ fontSize:"8px", color:"#555", marginBottom:"2px" }}>Consignee (Ship to)</div>
              <div style={{ fontWeight:"bold", fontSize:"11px" }}>{client?.company||client?.name||"Walk-in Customer"}</div>
              <div style={{ fontSize:"9px", lineHeight:"1.6" }}>
                {client?.address && <>{client.address}<br/></>}
                {client?.gstin   && <>GSTIN/UIN : {client.gstin}<br/></>}
                {client?.state   && <>State Name : {client.state}{client.stateCode?",  Code : "+client.stateCode:""}</>}
              </div>
            </td>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top", fontSize:"9px", color:"#555", lineHeight:"2" }}>
              <div>Buyer's Order No.</div>
              <div>Dated</div>
              <div>Dispatch Doc No.</div>
              <div>Delivery Note Date</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* buyer */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
              <div style={{ fontSize:"8px", color:"#555", marginBottom:"2px" }}>Buyer (Bill to)</div>
              <div style={{ fontWeight:"bold", fontSize:"11px" }}>{client?.company||client?.name||"Walk-in Customer"}</div>
              <div style={{ fontSize:"9px", lineHeight:"1.6" }}>
                {client?.address && <>{client.address}<br/></>}
                {client?.gstin   && <>GSTIN/UIN : {client.gstin}<br/></>}
                {client?.state   && <>State Name : {client.state}{client.stateCode?",  Code : "+client.stateCode:""}</>}
              </div>
            </td>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top", fontSize:"9px", color:"#555" }}>
              <div>Terms of Delivery</div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* items table */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <thead>
          <tr>
            <th style={{ ...S.th, width:"24px" }}>SI<br/>No</th>
            <th style={S.th}>Description of Goods</th>
            <th style={{ ...S.th, width:"50px" }}>HSN/SAC</th>
            <th style={{ ...S.th, width:"50px" }}>Quantity</th>
            <th style={{ ...S.th, width:"55px" }}>Rate</th>
            <th style={{ ...S.th, width:"28px" }}>per</th>
            <th style={{ ...S.th, width:"32px" }}>Disc.%</th>
            <th style={{ ...S.th, width:"60px" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row,i) => {
            const qty = row.qty===""||row.qty===undefined?1:parseFloat(row.qty)||1;
            const rate = parseFloat(row.rate)||0;
            const amount = qty*rate;
            return (
              <tr key={i}>
                <td style={S.tdc}>{i+1}</td>
                <td style={S.td}>{row.particulars||"—"}</td>
                <td style={S.tdc}>{row.hsnCode||""}</td>
                <td style={S.tdr}>{f2(qty)} Nos</td>
                <td style={S.tdr}>{f2(rate)}</td>
                <td style={S.tdc}>Nos</td>
                <td style={S.tdc}></td>
                <td style={S.tdr}>{fN(amount)}</td>
              </tr>
            );
          })}

          {/* GST rows inside table */}
          {!isIGST && <>
            <tr>
              <td style={S.td} colSpan={7}>
                <div style={{ textAlign:"center", fontWeight:"bold" }}>CGST</div>
              </td>
              <td style={{ ...S.tdr, fontWeight:"bold" }}>{fN(cgst)}</td>
            </tr>
            <tr>
              <td style={S.td} colSpan={7}>
                <div style={{ textAlign:"center", fontWeight:"bold" }}>SGST</div>
              </td>
              <td style={{ ...S.tdr, fontWeight:"bold" }}>{fN(sgst)}</td>
            </tr>
          </>}
          {isIGST &&
            <tr>
              <td style={S.td} colSpan={7}>
                <div style={{ textAlign:"center", fontWeight:"bold" }}>IGST</div>
              </td>
              <td style={{ ...S.tdr, fontWeight:"bold" }}>{fN(igst)}</td>
            </tr>
          }

          {/* total row */}
          <tr style={{ fontWeight:"bold" }}>
            <td style={S.td} colSpan={3}><strong>Total</strong></td>
            <td style={S.tdr}>
              {f2(rows.reduce((s,r)=>s+(r.qty===""||r.qty===undefined?1:parseFloat(r.qty)||1),0))} Nos
            </td>
            <td style={S.td} colSpan={3}></td>
            <td style={{ ...S.tdr, fontSize:"11px" }}>₹ {fN(grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* amount in words */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <tbody>
          <tr>
            <td style={S.td}>
              <div style={{ fontSize:"8px", color:"#555" }}>Amount Chargeable (in words)</div>
              <div style={{ fontWeight:"bold", fontSize:"9px" }}>
                Indian Rupee {numberToWords(grandTotal).replace(" Rupees Only","")} Only
              </div>
            </td>
            <td style={{ ...S.tdr, fontSize:"9px", fontStyle:"italic", width:"60px" }}>E. &amp; O.E</td>
          </tr>
        </tbody>
      </table>

      {/* gst summary */}
      <table style={{ ...S.table, marginBottom:"0" }}>
        <thead>
          <tr>
            <th style={{ ...S.th, width:"55px" }} rowSpan={2}>HSN/SAC</th>
            <th style={{ ...S.th, width:"65px" }} rowSpan={2}>Taxable<br/>Value</th>
            <th style={{ ...S.th }} colSpan={2}>Central Tax</th>
            <th style={{ ...S.th }} colSpan={2}>State Tax</th>
            <th style={{ ...S.th, width:"60px" }} rowSpan={2}>Total<br/>Tax Amount</th>
          </tr>
          <tr>
            <th style={S.th}>Rate</th>
            <th style={S.th}>Amount</th>
            <th style={S.th}>Rate</th>
            <th style={S.th}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={S.tdc}>{rows[0]?.hsnCode||""}</td>
            <td style={S.tdr}>{fN(subtotal)}</td>
            <td style={S.tdc}>{gstPct/2}%</td>
            <td style={S.tdr}>{fN(cgst)}</td>
            <td style={S.tdc}>{gstPct/2}%</td>
            <td style={S.tdr}>{fN(sgst)}</td>
            <td style={S.tdr}>{fN(cgst+sgst+igst)}</td>
          </tr>
          <tr style={{ fontWeight:"bold" }}>
            <td style={S.td}>Total</td>
            <td style={S.tdr}>{fN(subtotal)}</td>
            <td style={S.td}></td>
            <td style={S.tdr}>{fN(cgst)}</td>
            <td style={S.td}></td>
            <td style={S.tdr}>{fN(sgst)}</td>
            <td style={S.tdr}>{fN(cgst+sgst+igst)}</td>
          </tr>
        </tbody>
      </table>

      {/* tax in words */}
      <table style={{ ...S.table, marginBottom:"4px" }}>
        <tbody>
          <tr>
            <td style={S.td}>
              <span style={{ fontWeight:"bold" }}>Tax Amount (in words) : </span>
              <span style={{ fontWeight:"bold" }}>Indian Rupee {numberToWords(cgst+sgst+igst).replace(" Rupees Only","")} Only</span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* declaration + signatory */}
      <table style={S.table}>
        <tbody>
          <tr>
            <td style={{ ...S.td, width:"50%", verticalAlign:"top" }}>
              <div style={{ fontWeight:"bold", marginBottom:"3px" }}>Declaration</div>
              <div style={{ fontSize:"9px" }}>
                We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.
              </div>
            </td>
            <td style={{ ...S.td, width:"50%", textAlign:"right", verticalAlign:"bottom", height:"50px" }}>
              <div style={{ marginBottom:"2px" }}>for {COMPANY.name}</div>
              <div style={{ fontSize:"9px", color:"#555" }}>Authorised Signatory</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ textAlign:"center", fontSize:"9px", fontStyle:"italic", marginTop:"6px" }}>
        This is a Computer Generated Invoice
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 overflow-y-auto">
      <div className="py-6 px-4">
        <div style={{ maxWidth:"210mm", margin:"0 auto 12px" }} className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="bg-black text-white px-5 py-2 text-sm font-semibold hover:bg-gray-800">
              ⬇ Download PDF
            </button>
            <button onClick={() => window.print()} className="border border-white text-white px-5 py-2 text-sm font-semibold hover:bg-white hover:text-black">
              🖨 Print
            </button>
            {onNewBill && (
              <button onClick={onNewBill} className="border border-white text-white px-5 py-2 text-sm font-semibold hover:bg-white hover:text-black">
                + New Bill
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-white text-2xl px-2">✕</button>
        </div>

        <div id="print-area" style={{ maxWidth:"210mm", margin:"0 auto" }} className="space-y-4">
          <InvoiceContent title="CLIENT COPY" />
          <div className="no-print text-center text-gray-400 text-xs font-mono py-1">✂ ── cut here ──</div>
          <InvoiceContent title="OFFICE COPY" />
        </div>
      </div>
    </div>
  );
}
