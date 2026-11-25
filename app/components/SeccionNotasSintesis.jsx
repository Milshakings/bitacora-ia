"use client";

import React from "react";
import TextoEnriquecido from "./TextoEnriquecido";

export default function SeccionNotasSintesis({
  notasCrudas, setNotasCrudas,
  estrellas, setEstrellas,
  valoracion, setValoracion,
  opinion, setOpinion,
  resultadoExperto,
  cargandoIA,
  onSintetizar,
  onGuardar
}) {
  const insertarFormato = (inicio, fin = "") => {
    const ta = document.getElementById("textarea-notas");
    if (!ta) {
      setNotasCrudas((prev) => prev + inicio + fin);
      return;
    }
    const start = ta.selectionStart ?? notasCrudas.length;
    const end = ta.selectionEnd ?? notasCrudas.length;
    const sel = notasCrudas.substring(start, end);
    const actualizado = notasCrudas.substring(0, start) + inicio + sel + fin + notasCrudas.substring(end);
    setNotasCrudas(actualizado);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + inicio.length, start + inicio.length + sel.length);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">3. Notas y Opciones de Formato</h2>

        <div className="flex flex-wrap gap-2 pb-1">
          <button
            type="button"
            onClick={() => insertarFormato("**", "**")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border"
          >
            B (Negrita)
          </button>
          <button
            type="button"
            onClick={() => insertarFormato("*", "*")}
            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs italic rounded-lg border"
          >
            I (Cursiva)
          </button>
          <button
            type="button"
            onClick={() => insertarFormato("\n> 💡 **Idea Clave:** ")}
            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-medium rounded-lg border border-amber-200"
          >
            📌 Destacar Post-it
          </button>
          <button
            type="button"
            onClick={() => insertarFormato("\n- [ ] ")}
            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-medium rounded-lg border border-emerald-200"
          >
            ☑️ Tarea
          </button>
        </div>

        <textarea
          id="textarea-notas"
          rows={6}
          value={notasCrudas}
          onChange={(e) => setNotasCrudas(e.target.value)}
          placeholder="Escribe tus notas o usa los botones de formato (negrita, post-it, tarea)..."
          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm leading-relaxed text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />

        {notasCrudas.trim() && (
          <div className="bg-slate-50/90 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Vista previa con formato (así se verá al guardar)
            </span>
            <TextoEnriquecido texto={notasCrudas} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Valoración del Evento
            </label>
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setEstrellas(star)}
                  className={`text-2xl transition ${
                    star <= estrellas ? "text-amber-400 scale-110" : "text-slate-200"
                  }`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">({estrellas}/5)</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValoracion("like")}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium ${
                  valoracion === "like"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "bg-white text-slate-600"
                }`}
              >
                👍 Útil
              </button>
              <button
                type="button"
                onClick={() => setValoracion("dislike")}
                className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium ${
                  valoracion === "dislike"
                    ? "bg-rose-50 border-rose-500 text-rose-700"
                    : "bg-white text-slate-600"
                }`}
              >
                👎 Poco útil
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Testimonio / Comentario
            </label>
            <textarea
              rows={3}
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="Comentario personal de uso..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm leading-relaxed"
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSintetizar}
          disabled={cargandoIA}
          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          {cargandoIA ? "⚙️ Sintetizando..." : "🎯 Generar Síntesis Algorítmica"}
        </button>
      </div>

      {resultadoExperto && (
        <section className="bg-white border-2 border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-md">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🎯</span> Síntesis Generada
            </h3>
            <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold">Listo</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resumen Condensado</h4>
            <p className="text-sm text-slate-800 font-medium leading-relaxed">{resultadoExperto.resumen}</p>
          </div>

          {resultadoExperto.puntosClave?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 uppercase">Conceptos Destacados</h4>
              <ul className="list-disc list-inside text-sm text-slate-700 mt-1 space-y-1">
                {resultadoExperto.puntosClave.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {resultadoExperto.datosYMetricas?.length > 0 && (
            <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
              <h4 className="text-xs font-semibold text-amber-900 uppercase mb-1">📊 Cifras y Datos Registrados</h4>
              <ul className="list-disc list-inside text-sm text-amber-950 space-y-1">
                {resultadoExperto.datosYMetricas.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            </div>
          )}

          {resultadoExperto.accionesSugeridas?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-indigo-700 uppercase">✅ Acciones Detectadas</h4>
              <ul className="list-disc list-inside text-sm text-indigo-900 font-medium mt-1 space-y-1">
                {resultadoExperto.accionesSugeridas.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={onGuardar}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm shadow transition"
            >
              💾 Guardar en Bitácora
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
