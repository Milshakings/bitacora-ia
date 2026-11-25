"use client";

const DB_NAME = "BitacoraIADB";
const DB_VERSION = 1;
const STORE_NAME = "almacen";

function abrirBD() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB no disponible"));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function leerClaveBD(clave, valorPorDefecto = null) {
  try {
    const db = await abrirBD();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(clave);
      req.onsuccess = () =>
        resolve(req.result !== undefined ? req.result : valorPorDefecto);
      req.onerror = () => resolve(valorPorDefecto);
    });
  } catch (err) {
    console.error("Error leyendo IndexedDB:", err);
    return valorPorDefecto;
  }
}

export async function guardarClaveBD(clave, valor) {
  try {
    const db = await abrirBD();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_NAME], "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(valor, clave);
      req.onsuccess = () => resolve(true);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.error("Error guardando en IndexedDB:", err);
  }
}
