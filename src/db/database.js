/**
 * database.js
 * -----------
 * Two storage mechanisms:
 *
 * 1. CLIENTS → IndexedDB (async, structured, survives refresh)
 * 2. PRODUCTS → localStorage (sync, simple list, fast reads in InvoiceForm)
 */

// ─── INDEXEDDB: CLIENTS ───────────────────────────────────────────────────────

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

// ─── LOCALSTORAGE: PRODUCTS ───────────────────────────────────────────────────

const PRODUCTS_KEY = 'gst_products';

export function getProducts() {
  try {
    return JSON.parse(localStorage.getItem(PRODUCTS_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveProduct(product) {
  const list = getProducts();
  list.push(product);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

export function updateProduct(updated) {
  const list = getProducts().map(p => p.id === updated.id ? updated : p);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

export function deleteProduct(id) {
  const list = getProducts().filter(p => p.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(list));
}

export function clearAllProducts() {
  localStorage.removeItem(PRODUCTS_KEY);
}