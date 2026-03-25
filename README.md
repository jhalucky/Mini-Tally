# Simple GST Billing System

A fast, clean, daily-use GST billing web app for small businesses.
Built with React + Vite + Tailwind CSS. No backend required.

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser at http://localhost:5173
```

---

## 📁 Project Structure

```
src/
├── data/
│   └── items.js          ← Edit your items & company info here
├── hooks/
│   └── useBillNumber.js  ← Auto-increment bill number logic
├── utils/
│   └── gstUtils.js       ← GST calculation functions
├── components/
│   ├── ItemForm.jsx       ← Item selection + cart UI
│   └── Invoice.jsx        ← Printable A4 invoice (2 copies)
├── pages/
│   └── Home.jsx           ← Main billing page
├── App.jsx
└── main.jsx
```

---

## 🧾 Bill Number Logic

- Stored in `localStorage` under key `gst_bill_counter`
- Auto-increments on each confirmed bill: INV-001, INV-002, INV-003...
- Counter increments ONLY when "Generate Invoice" is clicked (not on cancel)
- Survives page refresh / browser restart
- Format: `INV-` + 3-digit zero-padded number

---

## 📊 GST Calculation

- Intra-state: GST split 50/50 → CGST + SGST
- Example: 18% GST → CGST 9% + SGST 9%
- GST breakdown table on invoice groups by tax rate

---

## 🖨️ Print Logic

- CSS `@media print` hides everything except `#print-area`
- Invoice renders **2 copies**: Client Copy + Office Copy
- A `page-break` CSS class separates them on paper
- Click "Print (2 Copies)" → browser print dialog opens

---

## 📥 PDF Download

- Uses `html2pdf.js` (loaded from CDN in index.html)
- Captures `#invoice-content` div as high-res canvas → A4 PDF
- Filename: `INV-001.pdf` (uses bill number)
- Scale 2x for crisp output

---

## ✏️ Customization

### Change your items (src/data/items.js):
```js
export const ITEMS = [
  { id: 1, name: "Your Product", price: 500, gst: 18 },
  ...
];
```

### Change company details (src/data/items.js):
```js
export const COMPANY = {
  name:    "Your Business Name",
  address: "Your Address",
  gstin:   "YOUR_GSTIN_HERE",
  ...
};
```

---

## 🛠️ Build for Production

```bash
npm run build
# Output in dist/ folder — deploy anywhere (Netlify, Vercel, etc.)
```
