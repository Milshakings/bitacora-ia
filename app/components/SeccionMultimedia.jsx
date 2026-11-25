"use client";

import React, { useState } from "react";
import { comprimirImagen, ejecutarOCRLocal } from "../lib/nlp-ocr";

export default function SeccionMultimedia({ fotos, setFotos, onTextoOCR, onIncrementarOCR }) {
  const [leyendoOCR, setLeyendoOCR] = useState(false);
  const [fotoModal, setFotoModal] = useState(null);

  const handleArchivos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (fotos.length + files.length > 7) {
      alert("Solo puedes adjuntar un máximo de 7 fotos por sesión.");
      return;
    }

    for (const file of files) {
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

      const comprimida = await comprimirImagen(base64, 900, 0.75);
      setFotos((prev) => [...prev, comprimida].slice(0, 7));

      setLeyendoOCR(true);
      try {
        const texto = await ejecutarOCRLocal(comprimida);
        if (texto && texto.length > 3) {
          onTextoOCR(`\n\n> 📸 **[OCR Pantalla]:** ${texto}`);
          onIncrementarOCR();
        }
      } catch (err) {
        console.error("Error en OCR:", err);
      } finally {
        setLeyendoOCR(false);
      }
    }
    e.target.value = "";
  };

  const eliminarFoto = (idx) => {
    setFotos(fotos.filter((_, i) => i !== idx));
  };

  return (
    <>
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <div className="flex justify-between items-center border-b pb-2">
          <h2 className="text-lg font-semibold text-slate-800">2. Captura de Pantallas y Fotos</h2>
          <div className="flex items-center gap-2">
            {leyendoOCR && (
              <span className="text-xs text-indigo-600 font-semibold animate-pulse">
                🔍 Procesando OCR por bloques...
              </span>
            )}
            <span className="text-xs font-medium text-slate-500">{fotos.length} / 7 fotos</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {fotos.map((fotoUrl, index) => (
            <div key={index} className="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden border shadow-xs">
              <img
                src={fotoUrl}
                alt={`Captura ${index + 1}`}
                onClick={() => setFotoModal(fotoUrl)}
                className="w-full h-full object-cover cursor-pointer hover:scale-105 transition"
              />
              <button
                type="button"
                onClick={() => eliminarFoto(index)}
                className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              >
                ✕
              </button>
              <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                #{index + 1}
              </span>
            </div>
          ))}

          {fotos.length < 7 && (
            <>
              <label className="aspect-square border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition text-indigo-700">
                <span className="text-2xl mb-1">📸</span>
                <span className="text-xs font-semibold text-center px-1">Tomar Foto Pantalla</span>
                <input type="file" accept="image/*" capture="environment" onChange={handleArchivos} className="hidden" />
              </label>

              <label className="aspect-square border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition text-slate-700">
                <span className="text-2xl mb-1">📂</span>
                <span className="text-xs font-semibold text-center px-1">Buscar Archivos</span>
                <input type="file" accept="image/*" multiple onChange={handleArchivos} className="hidden" />
              </label>
            </>
          )}
        </div>
      </section>

      {fotoModal && (
        <div
          onClick={() => setFotoModal(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={fotoModal} alt="Ampliación" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            <button
              type="button"
              onClick={() => setFotoModal(null)}
              className="absolute -top-4 -right-4 bg-white text-slate-900 rounded-full w-8 h-8 flex items-center justify-center font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
