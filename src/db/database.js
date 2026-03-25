/**
 * database.js
 * -----------
 * IndexedDB wrapper for persistent client/company storage.
 *
 * WHY IndexedDB instead of localStorage?
 *   - localStorage is limited to ~5MB, strings only, no querying.
 *   - IndexedDB is a real browser database: structured, indexed,
 *     survives browser restarts, never auto-cleared.
 *
 * CLIENT SCHEMA:
 *   {
 *     id        : auto-increment (number)
 *     name      : string  — person or company name
 *     company   : string  — company/firm name
 *     gstin     : string  — 15-char GST number
 *     address   : string  — street address
 *     city      : string
 *     state     : string  — state name
 *     stateCode : string  — 2-digit state code (e.g. "07" for Delhi)
 *     phone     : string
 *     email     : string
 *   }
 *
 * NOTE: HSN code is NOT stored per client. It is a product-level field
 *       entered per line item on each invoice row.
 */

const DB_NAME    = 'GSTBillingDB';
const DB_VERSION = 1;
const STORE_NAME = 'clients';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('name',  'name',  { unique: false });
        store.createIndex('gstin', 'gstin', { unique: false });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

export async function addClient(client) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).add({ ...client });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function updateClient(client) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(client);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function deleteClient(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getAllClients() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function searchClients(query) {
  const all = await getAllClients();
  const q   = query.toLowerCase();
  return all.filter(c =>
    c.name?.toLowerCase().includes(q)    ||
    c.company?.toLowerCase().includes(q) ||
    c.gstin?.toLowerCase().includes(q)
  );
}

// export const getProducts = () => {
//   return JSON.parse(localStorage.getItem("products")) || [];
// };

// export const saveProduct = (product) => {
//   const existing = JSON.parse(localStorage.getItem("products")) || [];
//   localStorage.setItem("products", JSON.stringify([...existing, product]));
// };

// db/database.js

export const getProducts = () => {
  return JSON.parse(localStorage.getItem("products")) || [];
};

export const saveProduct = (product) => {
  const products = getProducts();
  localStorage.setItem("products", JSON.stringify([...products, product]));
};

export const updateProduct = (updated) => {
  const products = getProducts().map(p =>
    p.id === updated.id ? updated : p
  );
  localStorage.setItem("products", JSON.stringify(products));
};

export const deleteProduct = (id) => {
  const products = getProducts().filter(p => p.id !== id);
  localStorage.setItem("products", JSON.stringify(products));
};