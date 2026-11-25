"use client";

import React, { useState } from "react";

export default function SeccionEvento({
  perfilActivo,
  titulo, setTitulo,
  expositor, setExpositor,
  organizacion, setOrganizacion,
  fechaEvento, setFechaEvento,
  areaTematica, setAreaTematica,
  areaPersonalizada, setAreaPersonalizada,
  tipoEvento, setTipoEvento,
  ubicacion, setUbicacion,
  panelistas, setPanelistas,
  onInsertarTurno,
  onLinkedin,
  onGoogle,
  onScholar,
  onGPS,
  cargandoGPS
}) {
  const [nuevoPanelista, setNuevoPanelista] = useState("");

  const agregarPanelista = () => {
    const limpio = nuevoPanelista.trim();
    if (!limpio) return;
    if (!panelistas.includes(limpio)) {
      setPanelistas([...panelistas, limpio]);
    }
    setNuevoPanelista("");
  };

  return (
    <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-lg font-semibold text-slate-800">1. Datos de la Charla o Panel</h2>
        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
          🔒 DB Segura ({perfilActivo === "principal" ? "Privada" : "Demo"})
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Título de la Charla o Panel
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Pilares de la Gestión Energética"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Expositor Principal / Moderador
          </label>
          <input
            type="text"
            value={expositor}
            onChange={(e) => setExpositor(e.target.value)}
            placeholder="Ej. Juan Pérez"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
          🎙️ Panelistas (toca un nombre para insertar turno en tus notas)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nuevoPanelista}
            onChange={(e) => setNuevoPanelista(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), agregarPanelista())}
            placeholder="Nombre del panelista y Enter..."
            className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
          />
          <button
            type="button"
            onClick={agregarPanelista}
            className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700"
          >
            + Añadir
          </button>
        </div>

        {panelistas.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {panelistas.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onInsertarTurno(`\n**[${p}]:** `)}
                className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg text-xs font-semibold transition"
              >
                🗣️ {p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Organización / Empresa
          </label>
          <input
            type="text"
            value={organizacion}
            onChange={(e) => setOrganizacion(e.target.value)}
            placeholder="Ej. Codelco / Sé Santiago"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            📅 Fecha y Hora
          </label>
          <input
            type="datetime-local"
            value={fechaEvento}
            onChange={(e) => setFechaEvento(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">🏷️ Área</label>
          <select
            value={areaTematica}
            onChange={(e) => setAreaTematica(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="IA & Tecnología">IA & Tecnología</option>
            <option value="Ciencias & Biotecnología">Ciencias & Biotecnología</option>
            <option value="Arquitectura & Urbanismo">Arquitectura & Urbanismo</option>
            <option value="Educación & EdTech">Educación & EdTech</option>
            <option value="Negocios & Innovación">Negocios & Innovación</option>
            <option value="Sustentabilidad & Energía">Sustentabilidad & Energía</option>
            <option value="Otro">Otro</option>
          </select>
          {areaTematica === "Otro" && (
            <input
              type="text"
              value={areaPersonalizada}
              onChange={(e) => setAreaPersonalizada(e.target.value)}
              placeholder="Especifica el área..."
              className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Tipo de Evento
          </label>
          <select
            value={tipoEvento}
            onChange={(e) => setTipoEvento(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="Seminario">Seminario</option>
            <option value="Panel">Panel de Conversación</option>
            <option value="Taller">Taller</option>
            <option value="Conferencia">Conferencia</option>
            <option value="Terreno">Terreno</option>
            <option value="Reunión">Reunión</option>
          </select>
        </div>
      </div>

      <div className="pt-2 flex flex-wrap gap-2 items-center border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Búsquedas:</span>
        <button type="button" onClick={onLinkedin} className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-lg border border-sky-200 hover:bg-sky-100">
          💼 LinkedIn Expositor
        </button>
        <button type="button" onClick={onGoogle} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 hover:bg-slate-200">
          🔍 Google
        </button>
        <button type="button" onClick={onScholar} className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 hover:bg-amber-100">
          🎓 Scholar
        </button>
      </div>

      <div className="pt-1">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
          Lugar / Ubicación
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ej. Santiago"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <button
            type="button"
            onClick={onGPS}
            disabled={cargandoGPS}
            className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border whitespace-nowrap hover:bg-slate-200"
          >
            {cargandoGPS ? "⏳..." : "📍 GPS"}
          </button>
        </div>
      </div>
    </section>
  );
}
