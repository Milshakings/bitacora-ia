"use client";

import React, { useState, useRef } from "react";

export default function HeaderMetricas({
  perfilActivo,
  setPerfilActivo,
  metricasValidacion,
  totalHistorial,
  onExportar,
  onImportar,
  onLimpiar,
  onResetDemo
}) {
  const [mostrarMetricas, setMostrarMetricas] = useState(false);
  const fileInputRef = useRef(null);

  return (
    <div className="space-y-4">
      {perfilActivo === "demo" && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2.5 rounded-xl shadow-sm flex flex-wrap justify-between items-center gap-2 text-xs font-bold">
          <span>🧪 MODO DEMO / EVALUADOR ACTIVO: Tus datos personales están ocultos y protegidos.</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onResetDemo}
              className="bg-slate-900 text-white px-2.5 py-1 rounded-lg hover:bg-slate-800"
            >
              🗑️ Resetear Demo a Cero
            </button>
            <button
              type="button"
              onClick={() => setPerfilActivo("principal")}
              className="bg-white text-slate-900 px-2.5 py-1 rounded-lg hover:bg-slate-100"
            >
              Volver a Mi Bitácora
            </button>
          </div>
        </div>
      )}

      <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>📓</span> Bitácora IA
          </h1>
          <p className="text-sm text-slate-500">
            Captura offline-first, OCR local de diapositivas, paneles y síntesis ejecutiva.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => setPerfilActivo("principal")}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                perfilActivo === "principal"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              👤 Mi Bitácora
            </button>
            <button
              type="button"
              onClick={() => setPerfilActivo("demo")}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition ${
                perfilActivo === "demo"
                  ? "bg-amber-400 text-slate-950 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              🧪 Modo Prueba
            </button>
          </div>

          <button
            type="button"
            onClick={() => setMostrarMetricas((prev) => !prev)}
            className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold border border-indigo-200 transition"
          >
            📊 Métricas ({metricasValidacion.bitacorasCreadas || 0})
          </button>

          <button
            type="button"
            onClick={onExportar}
            className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-medium border border-sky-200"
          >
            📥 Respaldar
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium border border-emerald-200"
          >
            📤 Cargar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={onImportar}
            className="hidden"
          />

          <button
            type="button"
            onClick={onLimpiar}
            className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg border hover:bg-slate-200"
          >
            🧹 Limpiar
          </button>
        </div>
      </header>

      {mostrarMetricas && (
        <section className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-700 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-700 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400">
              🚀 Módulo de Validación de Campo ({perfilActivo === "principal" ? "Perfil Principal" : "Entorno Demo"})
            </h3>
            <button
              type="button"
              onClick={() => setMostrarMetricas(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕ Cerrar
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Bitácoras Creadas</span>
              <span className="text-2xl font-black text-emerald-400">{metricasValidacion.bitacorasCreadas || 0}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Fotos Leídas con OCR</span>
              <span className="text-2xl font-black text-sky-400">{metricasValidacion.fotosProcesadasOCR || 0}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Clicks LinkedIn</span>
              <span className="text-2xl font-black text-indigo-400">{metricasValidacion.busquedasLinkedin || 0}</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
              <span className="text-[10px] text-slate-400 font-semibold block uppercase">Registros en Historial</span>
              <span className="text-2xl font-black text-amber-400">{totalHistorial}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
