/**
 * gstUtils.js
 * -----------
 * GST calculation utilities supporting all three GST types:
 *
 *   CGST + SGST  →  Intra-state supply (same state)
 *   IGST         →  Inter-state supply (different states)
 *
 * Per line item the user enters:
 *   - particulars (description)
 *   - hsnCode
 *   - qty
 *   - rate (unit price excl. GST)
 *   - gstType: 'cgst_sgst' | 'igst'
 *   - gstRate: number (e.g. 18 means 18%)
 *
 * The app auto-calculates amount, GST amounts, and total the moment
 * any of those fields change.
 */

export const round2 = (n) => Math.round((n || 0) * 100) / 100;

/**
 * Calculate a single invoice line item.
 *
 * @param {number} qty
 * @param {number} rate       - unit price excluding GST
 * @param {string} gstType    - 'cgst_sgst' or 'igst'
 * @param {number} gstRate    - total GST % (e.g. 18)
 * @returns {object}
 */
export function calcLine(qty, rate, gstType, gstRate) {
  const amount   = round2((qty || 0) * (rate || 0));       // taxable value
  const totalGST = round2((amount * (gstRate || 0)) / 100);

  if (gstType === 'igst') {
    return {
      amount,
      igst:      totalGST,
      cgst:      0,
      sgst:      0,
      lineTotal: round2(amount + totalGST),
    };
  }

  // CGST + SGST: split equally
  const half = round2(totalGST / 2);
  return {
    amount,
    igst:      0,
    cgst:      half,
    sgst:      half,
    lineTotal: round2(amount + totalGST),
  };
}

/**
 * Aggregate totals across all invoice rows.
 * @param {Array} rows - array of row objects (each with qty, rate, gstType, gstRate)
 */
export function calcInvoiceTotals(rows) {
  let subtotal   = 0;
  let totalIGST  = 0;
  let totalCGST  = 0;
  let totalSGST  = 0;

  rows.forEach(row => {
    const line = calcLine(row.qty, row.rate, row.gstType, row.gstRate);
    subtotal  += line.amount;
    totalIGST += line.igst;
    totalCGST += line.cgst;
    totalSGST += line.sgst;
  });

  return {
    subtotal:   round2(subtotal),
    totalIGST:  round2(totalIGST),
    totalCGST:  round2(totalCGST),
    totalSGST:  round2(totalSGST),
    grandTotal: round2(subtotal + totalIGST + totalCGST + totalSGST),
  };
}

/** Format as Indian Rupees */
export const formatINR = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', minimumFractionDigits: 2,
  }).format(n || 0);

/** Number to Indian words */
export function numberToWords(num) {
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine',
    'Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen',
    'Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];

  if (!num || num === 0) return 'Zero Rupees Only';

  const inWords = (n) => {
    if (n < 20)       return ones[n];
    if (n < 100)      return tens[Math.floor(n/10)] + (n%10 ? ' '+ones[n%10] : '');
    if (n < 1000)     return ones[Math.floor(n/100)]+' Hundred'+(n%100?' '+inWords(n%100):'');
    if (n < 100000)   return inWords(Math.floor(n/1000))+' Thousand'+(n%1000?' '+inWords(n%1000):'');
    if (n < 10000000) return inWords(Math.floor(n/100000))+' Lakh'+(n%100000?' '+inWords(n%100000):'');
    return inWords(Math.floor(n/10000000))+' Crore'+(n%10000000?' '+inWords(n%10000000):'');
  };

  const rupees = Math.floor(num);
  const paise  = Math.round((num - rupees) * 100);
  let result   = inWords(rupees) + ' Rupees';
  if (paise > 0) result += ' and ' + inWords(paise) + ' Paise';
  return result + ' Only';
}
