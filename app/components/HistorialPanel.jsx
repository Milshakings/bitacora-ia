"use client";

import React, { useState } from "react";
import { sintetizarTextoAlgoritmico } from "../lib/nlp-ocr";
import TextoEnriquecido from "./TextoEnriquecido";

export default function HistorialPanel({
  perfilActivo,
  historial,
  onActualizarHistorial
}) {
  const [busqueda, setBusqueda] = useState("");
  const [expandidos, setExpandidos] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [drawerMovilAbierto, setDrawerMovilAbierto] = useState(false);

  const filtrados = historial.filter((item) => {
    const q = busqueda.toLowerCase();
    return (
      (item.titulo || "").toLowerCase().includes(q) ||
      (item.organizacion || "").toLowerCase().includes(q) ||
      (item.expositor || "").toLowerCase().includes(q)
    );
  });

  const borrar = (id) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      onActualizarHistorial(historial.filter((item) => item.id !== id));
    }
  };

  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setEditForm({ ...item });
  };

  const guardarEdicion = (id) => {
    const actualizado = historial.map((item) => {
      if (item.id !== id) return item;
      const analisis = sintetizarTextoAlgoritmico(
        editForm.notasCrudas || "",
        editForm.area || "General"
      );
      return {
        ...editForm,
        resumen: analisis.resumen,
        puntosClave: analisis.puntosClave,
        datosMetricas: analisis.datosYMetricas,
        tareas: analisis.accionesSugeridas
      };
    });
    onActualizarHistorial(actualizado);
    setEditandoId(null);
    setEditForm({});
  };

  const contenidoHistorial = (
    <div className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold text-slate-800">
          {perfilActivo === "principal" ? "Mi Historial" : "Historial Demo"}
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            {filtrados.length} registros
          </span>
          <button
            type="button"
            onClick={() => setDrawerMovilAbierto(false)}
            className="lg:hidden text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-md font-bold"
          >
            ✕
          </button>
        </div>
      </div>

      <input
        type="text"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="🔍 Buscar por título, expositor..."
        className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50"
      />

      <div className="space-y-3 max-h-[70vh] lg:max-h-[600px] overflow-y-auto pr-1">
        {filtrados.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">
            {perfilActivo === "principal"
              ? "No hay registros guardados."
              : "Entorno de prueba limpio. Listo para demostrar en vivo."}
          </p>
        ) : (
          filtrados.map((item) => {
            const expandido = !!expandidos[item.id];
            const editando = editandoId === item.id;

            return (
              <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                <button
                  type="button"
                  onClick={() => borrar(item.id)}
                  className="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs"
                >
                  🗑️
                </button>

                {!editando ? (
                  <>
                    <div className="flex flex-wrap items-center gap-1 pr-6">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                        {item.tipo || "Evento"}
                      </span>
                      <span className="text-[10px] text-slate-400 ml-auto">📅 {item.fecha}</span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      🗣️ {item.expositor} ({item.organizacion})
                    </p>
                    <p className="text-xs text-slate-500">📍 {item.ubicacion}</p>

                    <div className="text-xs bg-white p-3 rounded-lg border text-slate-800 font-medium leading-relaxed">
                      {item.resumen}
                    </div>

                    {expandido && item.notasCrudas && (
                      <div className="pt-2 border-t space-y-2 bg-white p-3 rounded-lg border-slate-200 mt-2">
                        <span className="font-bold text-slate-500 uppercase text-[10px] block">
                          Notas y Destacados:
                        </span>
                        <TextoEnriquecido texto={item.notasCrudas} />
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setExpandidos((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                        className="text-indigo-600 font-semibold text-[11px]"
                      >
                        {expandido ? "▲ Ocultar notas" : "📖 Ver notas formateadas"}
                      </button>
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(item)}
                        className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px]"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-indigo-700 block border-b pb-1">✏️ Editando Registro</span>
                    <input
                      type="text"
                      value={editForm.titulo || ""}
                      onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                    />
                    <input
                      type="text"
                      value={editForm.expositor || ""}
                      onChange={(e) => setEditForm({ ...editForm, expositor: e.target.value })}
                      className="w-full text-xs p-1.5 border rounded bg-white"
                    />
                    <textarea
                      rows={4}
                      value={editForm.notasCrudas || ""}
                      onChange={(e) => setEditForm({ ...editForm, notasCrudas: e.target.value })}
                      className="w-full text-xs p-2 border rounded bg-white font-sans leading-relaxed"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditandoId(null)}
                        className="px-3 py-1 bg-slate-200 text-xs rounded-lg"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => guardarEdicion(item.id)}
                        className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg"
                      >
                        💾 Guardar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Pestaña lateral fija en móvil para acceder al historial sin scroll largo */}
      <button
        type="button"
        onClick={() => setDrawerMovilAbierto(true)}
        aria-label="Abrir historial"
        className="lg:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-3.5 rounded-l-xl shadow-lg border border-indigo-400/40 flex flex-col items-center gap-1 text-[11px] font-bold"
      >
        <span>📜</span>
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-wider">
          HISTORIAL ({filtrados.length})
        </span>
      </button>

      {/* Cajón deslizante en móvil */}
      {drawerMovilAbierto && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[1px]">
          <div className="w-[90vw] max-w-md h-full bg-slate-100 p-4 overflow-y-auto shadow-2xl">
            {contenidoHistorial}
          </div>
        </div>
      )}

      {/* Columna lateral en escritorio */}
      <aside className="hidden lg:block space-y-6">
        <div className="sticky top-6">{contenidoHistorial}</div>
      </aside>
    </>
  );
}
