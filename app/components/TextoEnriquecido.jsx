"use client";

import React from "react";

function formatearInline(texto) {
  // Soporta **negrita** y *cursiva* de forma segura sin dangerouslySetInnerHTML
  const partes = texto.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return partes.map((parte, idx) => {
    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
      return (
        <strong key={idx} className="font-bold text-slate-900 bg-amber-100/60 px-1 rounded">
          {parte.slice(2, -2)}
        </strong>
      );
    }
    if (parte.startsWith("*") && parte.endsWith("*") && parte.length > 2) {
      return (
        <em key={idx} className="italic text-slate-700">
          {parte.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{parte}</React.Fragment>;
  });
}

export default function TextoEnriquecido({ texto }) {
  if (!texto || !texto.trim()) return null;

  const lineas = texto.split("\n");

  return (
    <div className="space-y-1.5 text-[13.5px] leading-relaxed text-slate-700">
      {lineas.map((linea, i) => {
        const trim = linea.trim();
        if (!trim) return <div key={i} className="h-1" />;

        // Bloque tipo Post-it (> 💡 ...)
        if (trim.startsWith(">")) {
          const contenido = trim.replace(/^>\s*/, "");
          return (
            <div
              key={i}
              className="bg-amber-50 border-l-4 border-amber-400 px-3 py-2 rounded-r-lg text-amber-950 shadow-2xs"
            >
              {formatearInline(contenido)}
            </div>
          );
        }

        // Ítem tipo Tarea (- [ ] ...)
        if (/^-\s*\[\s*[xX ]?\s*\]/.test(trim)) {
          const marcada = /^-\s*\[\s*[xX]\s*\]/.test(trim);
          const tareaTexto = trim.replace(/^-\s*\[\s*[xX ]?\s*\]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-2 pl-1">
              <span
                className={`mt-0.5 inline-flex w-4 h-4 rounded border items-center justify-center text-[10px] font-bold ${
                  marcada
                    ? "bg-emerald-600 border-emerald-600 text-white"
                    : "bg-white border-slate-400 text-transparent"
                }`}
              >
                ✓
              </span>
              <span className={marcada ? "line-through text-slate-400" : "text-slate-800"}>
                {formatearInline(tareaTexto)}
              </span>
            </div>
          );
        }

        return <p key={i}>{formatearInline(linea)}</p>;
      })}
    </div>
  );
}
