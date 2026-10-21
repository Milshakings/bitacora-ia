"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";

// Función Experta de Procesamiento de Texto (NLP Avanzado Local)
function procesarTextoExperto(textoCrudo, titulo, organizacion) {
  if (!textoCrudo || !textoCrudo.trim()) {
    return {
      resumen: `Registro de evento: "${titulo || "Sin título"}" ${organizacion ? "con " + organizacion : ""}. Sin notas adicionales ingresadas.`,
      puntosClave: ["No se ingresaron notas textuales para analizar."],
      accionesSugeridas: ["Agregar notas o apuntes clave de la charla."],
      datosYMetricas: []
    };
  }

  // 1. Limpieza y fragmentación de ideas (por saltos de línea, puntos, guiones o viñetas)
  const lineasYFrases = textoCrudo
    .split(/[\n;•\-\u2022]+|\.\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 3);

  const acciones = [];
  const datosMetricas = [];
  const ideasClave = [];

  // Palabras clave para detectar acciones y tareas
  const patronAccion = /\b(hacer|contactar|revisar|llamar|pedir|enviar|comprar|implementar|cotizar|agendar|coordinar|validar|crear|desarrollar|evaluar|programar)\b/i;
  
  // Patrón para detectar cifras, porcentajes, montos o fechas
  const patronCifras = /(\d+[\d.,]*%?|\$\d+[\d.,]*|\b(19|20)\d{2}\b)/i;

  // 2. Clasificación inteligente
  lineasYFrases.forEach((frase) => {
    // Si contiene una acción de trabajo
    if (patronAccion.test(frase)) {
      acciones.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    } 
    // Si contiene datos numéricos, porcentajes o fechas
    else if (patronCifras.test(frase)) {
      datosMetricas.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    } 
    // Ideas y conceptos clave generales
    else {
      ideasClave.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    }
  });

  // 3. Formulación del Resumen Ejecutivo Sintético
  const totalIdeas = ideasClave.length;
  const primeraIdea = ideasClave[0] || lineasYFrases[0] || "Puntos presentados en la sesión";
  const segundaIdea = ideasClave[1] ? ` Además, se abordó: ${ideasClave[1]}.` : "";

  const resumenSintetizado = `SÍNTESIS CORTA: ${primeraIdea}.${segundaIdea}`.trim();

  // Acciones por defecto si no se detectaron verbos explícitos
  if (acciones.length === 0) {
    if (organizacion) acciones.push(`Hacer seguimiento institucional con ${organizacion}.`);
    acciones.push("Revisar y validar los apuntes tomados en el evento.");
  }

  return {
    resumen: resumenSintetizado,
    puntosClave: ideasClave.length > 0 ? ideasClave : lineasYFrases.slice(0, 5),
    datosYMetricas: datosMetricas,
    accionesSugeridas: acciones
  };
}

export default function BitacoraIA() {
  // Estados del formulario / Borrador actual
  const [titulo, setTitulo] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [tipoEvento, setTipoEvento] = useState("Seminario");
  const [ubicacion, setUbicacion] = useState("");
  const [notasCrudas, setNotasCrudas] = useState("");

  // Fotos (Hasta 7)
  const [fotos, setFotos] = useState([]);
  const [fotoModal, setFotoModal] = useState(null);

  // Valoración y Opinión
  const [estrellas, setEstrellas] = useState(0);
  const [valoracion, setValoracion] = useState(null);
  const [opinion, setOpinion] = useState("");

  // Estados de IA / Procesamiento
  const [resultadoExperto, setResultadoExperto] = useState(null);
  const [infoInvestigada, setInfoInvestigada] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [cargandoInvestigacion, setCargandoInvestigacion] = useState(false);
  const [cargandoGPS, setCargandoGPS] = useState(false);

  // Historial con persistencia en localStorage
  const [historial, setHistorial] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState("");

  // Cargar Historial y Borrador previo
  useEffect(() => {
    try {
      const guardadoHistorial = localStorage.getItem("bitacora_ia_historial");
      if (guardadoHistorial) {
        setHistorial(JSON.parse(guardadoHistorial));
      }

      const borradorGuardado = localStorage.getItem("bitacora_ia_borrador");
      if (borradorGuardado) {
        const draft = JSON.parse(borradorGuardado);
        if (draft.titulo) setTitulo(draft.titulo);
        if (draft.organizacion) setOrganizacion(draft.organizacion);
        if (draft.tipoEvento) setTipoEvento(draft.tipoEvento);
        if (draft.ubicacion) setUbicacion(draft.ubicacion);
        if (draft.notasCrudas) setNotasCrudas(draft.notasCrudas);
        if (draft.fotos) setFotos(draft.fotos);
        if (draft.estrellas) setEstrellas(draft.estrellas);
        if (draft.valoracion) setValoracion(draft.valoracion);
        if (draft.opinion) setOpinion(draft.opinion);
      }
    } catch (e) {
      console.error("Error al cargar localStorage:", e);
    }
  }, []);

  // Guardar Borrador automáticamente
  useEffect(() => {
    const borradorActual = {
      titulo,
      organizacion,
      tipoEvento,
      ubicacion,
      notasCrudas,
      fotos,
      estrellas,
      valoracion,
      opinion
    };
    try {
      localStorage.setItem("bitacora_ia_borrador", JSON.stringify(borradorActual));
    } catch (e) {
      console.error("Error al guardar borrador:", e);
    }
  }, [titulo, organizacion, tipoEvento, ubicacion, notasCrudas, fotos, estrellas, valoracion, opinion]);

  const guardarEnLocalStorage = (nuevoHistorial) => {
    setHistorial(nuevoHistorial);
    try {
      localStorage.setItem("bitacora_ia_historial", JSON.stringify(nuevoHistorial));
    } catch (e) {
      console.error("Error al guardar historial:", e);
    }
  };

  const limpiarBorrador = () => {
    setTitulo("");
    setOrganizacion("");
    setUbicacion("");
    setNotasCrudas("");
    setFotos([]);
    setEstrellas(0);
    setValoracion(null);
    setOpinion("");
    setResultadoExperto(null);
    setInfoInvestigada(null);
    localStorage.removeItem("bitacora_ia_borrador");
  };

  // Captura inmediata de fotos
  const handleCapturarFoto = (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 7) {
      alert("Solo puedes adjuntar un máximo de 7 fotos por sesión.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotos((prev) => [...prev, reader.result].slice(0, 7));
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarFoto = (index) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  // Geolocalización OpenStreetMap
  const obtenerUbicacionGPS = () => {
    if (!("geolocation" in navigator)) {
      alert("La geolocalización no está soportada en tu navegador.");
      return;
    }

    setCargandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const comuna = data.address.suburb || data.address.city_district || data.address.town || "";
            const ciudad = data.address.city || data.address.state || "Chile";
            setUbicacion(`${comuna ? comuna + ", " : ""}${ciudad}`);
          } else {
            setUbicacion(`Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`);
          }
        } catch (err) {
          setUbicacion(`Lat: ${latitude.toFixed(3)}, Lon: ${longitude.toFixed(3)}`);
        } finally {
          setCargandoGPS(false);
        }
      },
      () => {
        setCargandoGPS(false);
        alert("No se pudo obtener el GPS automáticamente.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Búsquedas externas
  const abrirLinkedin = () => {
    if (!organizacion && !titulo) {
      alert("Ingresa el nombre de una persona o empresa primero.");
      return;
    }
    window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${organizacion}${titulo}`)}`, "_blank");
  };

  const abrirGoogle = () => {
    if (!organizacion && !titulo) {
      alert("Ingresa el nombre de una persona o empresa primero.");
      return;
    }
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`${organizacion}${titulo}`)}`, "_blank");
  };

  const abrirGoogleScholar = () => {
    if (!organizacion && !titulo) {
      alert("Ingresa el nombre de una persona o empresa primero.");
      return;
    }
    window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(`${organizacion}${titulo}`)}`, "_blank");
  };

  // Procesamiento Experto Real sobre tus notas
  const ejecutarProcesamientoExperto = () => {
    if (!titulo && fotos.length === 0 && !notasCrudas.trim()) {
      alert("Escribe notas, un título o toma una foto antes de procesar.");
      return;
    }

    setCargandoIA(true);
    setTimeout(() => {
      const analisisReal = procesarTextoExperto(notasCrudas, titulo, organizacion);
      setResultadoExperto(analisisReal);
      setCargandoIA(false);
    }, 400);
  };

  const investigarEntidad = () => {
    if (!organizacion) {
      alert("Ingresa el nombre de la organización o persona expositora.");
      return;
    }
    setCargandoInvestigacion(true);
    setTimeout(() => {
      setInfoInvestigada({
        entidad: organizacion,
        perfil: `Búsqueda rápida sugerida para "${organizacion}": Utiliza los botones superiores de LinkedIn o Scholar para revisar el perfil profesional o académico verificado.`,
        sugerencia: "Verificar proyectos activos y publicaciones recientes en los enlaces directos."
      });
      setCargandoInvestigacion(false);
    }, 600);
  };

  const guardarEntrada = () => {
    if (!titulo) {
      alert("Asigna un título antes de guardar.");
      return;
    }

    const analisisFinal = resultadoExperto || procesarTextoExperto(notasCrudas, titulo, organizacion);

    const nuevaEntrada = {
      id: Date.now(),
      titulo,
      organizacion: organizacion || "No especificada",
      ubicacion: ubicacion || "Lugar no registrado",
      tipo: tipoEvento,
      fecha: new Date().toLocaleString("es-CL"),
      estrellas,
      valoracion,
      opinion,
      resumen: analisisFinal.resumen,
      puntosClave: analisisFinal.puntosClave,
      datosMetricas: analisisFinal.datosYMetricas,
      tareas: analisisFinal.accionesSugeridas,
      fotos: [...fotos]
    };

    const actualizado = [nuevaEntrada, ...historial];
    guardarEnLocalStorage(actualizado);
    alert("¡Entrada guardada con éxito en tu historial!");

    limpiarBorrador();
  };

  const borrarEntrada = (id) => {
    if (confirm("¿Estás seguro de eliminar este registro del historial?")) {
      guardarEnLocalStorage(historial.filter((item) => item.id !== id));
    }
  };

  const historialFiltrado = historial.filter(
    (item) =>
      item.titulo.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      item.organizacion.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      item.ubicacion.toLowerCase().includes(busquedaHistorial.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Cabecera */}
        <header className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>📓</span> Bitácora IA: Asistente Experto
            </h1>
            <p className="text-sm text-slate-500">
              Procesamiento sintético estructurado de notas reales sin texto relleno.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={limpiarBorrador}
              type="button"
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full font-medium border transition"
              title="Borrar formulario actual y empezar borrador limpio"
            >
              🧹 Limpiar Borrador
            </button>
            <div className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full font-medium border border-indigo-100">
              {new Date().toLocaleDateString("es-CL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario Principal */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Datos del Evento */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">1. Datos del Evento u Organización</h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                  💾 Borrador autoguardado
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Título de la Charla / Evento</label>
                  <input 
                    type="text" 
                    value={titulo} 
                    onChange={(e) => setTitulo(e.target.value)} 
                    placeholder="Ej. Avances en Bioprocesos e IA"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Organización, Empresa o Persona</label>
                  <input 
                    type="text" 
                    value={organizacion} 
                    onChange={(e) => setOrganizacion(e.target.value)} 
                    placeholder="Ej. Dr. Roberto Silva / CORFO"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Botones de búsqueda */}
              <div className="pt-1 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Buscar Perfil En:</span>
                <button type="button" onClick={abrirLinkedin} className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium rounded-lg border border-sky-200 transition">💼 LinkedIn</button>
                <button type="button" onClick={abrirGoogle} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition">🔍 Google</button>
                <button type="button" onClick={abrirGoogleScholar} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 transition">🎓 Scholar</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Tipo de Evento</label>
                  <select 
                    value={tipoEvento} 
                    onChange={(e) => setTipoEvento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="Seminario">Seminario</option>
                    <option value="Taller">Taller</option>
                    <option value="Conferencia">Conferencia</option>
                    <option value="Terreno">Visita a Terreno</option>
                    <option value="Reunión">Reunión de Negocios</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lugar / Ubicación</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={ubicacion} 
                      onChange={(e) => setUbicacion(e.target.value)} 
                      placeholder="Ej. Providencia, Santiago"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <button 
                      type="button" 
                      onClick={obtenerUbicacionGPS}
                      disabled={cargandoGPS}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 whitespace-nowrap transition"
                    >
                      {cargandoGPS ? "⏳..." : "📍 GPS"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <span className="text-[11px] text-slate-400 mr-2">Comunas comunes:</span>
                {["Providencia, Santiago", "Santiago Centro", "Valparaíso / Viña", "Concepción", "Antofagasta"].map((lugar) => (
                  <button key={lugar} type="button" onClick={() => setUbicacion(lugar)} className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded mr-1.5 transition">
                    + {lugar}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Cámara Inmediata (Hasta 7 Fotos) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">2. Cámara y Fotos Inmediatas (Hasta 7)</h2>
                <span className="text-xs font-medium text-slate-500">{fotos.length} / 7 fotos</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {fotos.map((fotoUrl, index) => (
                  <div key={index} className="relative group aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                    <img src={fotoUrl} alt={`Captura ${index + 1}`} className="w-full h-full object-cover cursor-pointer hover:scale-105 transition" onClick={() => setFotoModal(fotoUrl)} />
                    <button onClick={() => eliminarFoto(index)} className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow">✕</button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">#{index + 1}</span>
                  </div>
                ))}

                {fotos.length < 7 && (
                  <label className="aspect-square border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition text-indigo-700">
                    <span className="text-2xl mb-1">📸</span>
                    <span className="text-xs font-semibold text-center px-2">Tomar Foto / Cámara</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleCapturarFoto} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            {/* 3. Apuntes Reales y Evaluación */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">3. Tus Notas Crudas y Evaluación</h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Escribe tus apuntes aquí (Separados por saltos de línea o puntos)
                </label>
                <textarea 
                  rows="4"
                  value={notasCrudas} 
                  onChange={(e) => setNotasCrudas(e.target.value)} 
                  placeholder="Ejemplo:
- Inversión requerida: $50 millones para el Q3
- Revisar informe técnico con el equipo
- Eficiencia del proceso aumentó un 35%..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm font-mono"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Valoración</label>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setEstrellas(star)} className={`text-2xl transition ${star <= estrellas ? 'text-amber-400 scale-110' : 'text-slate-200 hover:text-amber-200'}`}>★</button>
                    ))}
                    <span className="text-xs text-slate-500 ml-2">({estrellas}/5)</span>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setValoracion('like')} className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition ${valoracion === 'like' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>👍 Útil</button>
                    <button type="button" onClick={() => setValoracion('dislike')} className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition ${valoracion === 'dislike' ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold' : 'bg-white border-slate-200 text-slate-600'}`}>👎 Poco útil</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">¿Por qué? / Comentario Personal</label>
                  <textarea 
                    rows="3"
                    value={opinion}
                    onChange={(e) => setOpinion(e.target.value)}
                    placeholder="Ej. Me pareció útil la cifra de ROI presentada..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Botones de Procesamiento Experto */}
            <div className="flex flex-wrap gap-3">
              <button 
                type="button"
                onClick={ejecutarProcesamientoExperto}
                disabled={cargandoIA}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {cargandoIA ? "⚙️ Analizando tus notas..." : "🎯 Procesamiento Experto Sintético"}
              </button>

              <button 
                type="button"
                onClick={investigarEntidad}
                disabled={cargandoInvestigacion}
                className="bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 font-medium py-3 px-6 rounded-xl shadow-sm transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {cargandoInvestigacion ? "🔍..." : "🏢 Contexto Entidad"}
              </button>
            </div>

            {/* Contexto Entidad */}
            {infoInvestigada && (
              <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2"><span>💡</span> Contexto sobre {infoInvestigada.entidad}:</h3>
                <p className="text-xs text-indigo-800 leading-relaxed">{infoInvestigada.perfil}</p>
              </div>
            )}

            {/* Resultado Sintético Real Basado Exclusivamente en lo Anotado */}
            {resultadoExperto && (
              <div className="bg-white border-2 border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🎯</span> Síntesis Experta Basada en tus Notas
                  </h3>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold">Procesado</span>
                </div>

                {/* Resumen Corto Real */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resumen Ejecutivo Directo</h4>
                  <p className="text-sm text-slate-800 font-medium">{resultadoExperto.resumen}</p>
                </div>

                {/* Ideas Extraídas */}
                {resultadoExperto.puntosClave.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Ideas y Conceptos Extraídos</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-1 space-y-1">
                      {resultadoExperto.puntosClave.map((punto, i) => (<li key={i}>{punto}</li>))}
                    </ul>
                  </div>
                )}

                {/* Cifras / Datos Numéricos Detectados */}
                {resultadoExperto.datosYMetricas && resultadoExperto.datosYMetricas.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="text-xs font-semibold text-amber-900 uppercase mb-1">📊 Cifras y Datos Técnicos Detectados</h4>
                    <ul className="list-disc list-inside text-sm text-amber-950 space-y-1">
                      {resultadoExperto.datosYMetricas.map((dato, i) => (<li key={i}>{dato}</li>))}
                    </ul>
                  </div>
                )}

                {/* Acciones Extradas */}
                {resultadoExperto.accionesSugeridas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-700 uppercase">✅ Acciones / Tareas Detectadas</h4>
                    <ul className="list-disc list-inside text-sm text-indigo-900 font-medium mt-1 space-y-1">
                      {resultadoExperto.accionesSugeridas.map((accion, i) => (<li key={i}>{accion}</li>))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={guardarEntrada} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm shadow transition">
                    💾 Guardar en Bitácora Definitiva
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Historial */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 sticky top-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Historial Guardado</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{historial.length} registros</span>
              </div>
              
              <div>
                <input type="text" value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} placeholder="🔍 Buscar..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white" />
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {historialFiltrado.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay registros guardados aún.</p>
                ) : (
                  historialFiltrado.map((item) => (
                    <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-2 relative group">
                      <button onClick={() => borrarEntrada(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs transition opacity-0 group-hover:opacity-100">🗑️</button>
                      <div className="flex justify-between items-start pr-6">
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{item.tipo}</span>
                        <span className="text-[10px] text-slate-400">{item.fecha}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>
                      {item.organizacion && <p className="text-xs text-slate-600 font-medium">🏢 {item.organizacion}</p>}
                      <p className="text-xs text-slate-500">📍 {item.ubicacion}</p>
                      {item.estrellas > 0 && <div className="text-xs text-amber-400">{"★".repeat(item.estrellas)}{"☆".repeat(5 - item.estrellas)}</div>}
                      <div className="text-xs bg-white p-2 rounded border border-slate-100 text-slate-700">{item.resumen}</div>
                      {item.fotos && item.fotos.length > 0 && (
                        <div className="flex gap-1 overflow-x-auto pt-1">
                          {item.fotos.map((f, idx) => (
                            <img key={idx} src={f} alt="thumb" onClick={() => setFotoModal(f)} className="w-8 h-8 object-cover rounded cursor-pointer border border-slate-200 hover:opacity-80" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Modal Fotos */}
      {fotoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setFotoModal(null)}>
          <div className="relative max-w-4xl max-h-[90vh]">
            <img src={fotoModal} alt="Ampliación" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
            <button onClick={() => setFotoModal(null)} className="absolute -top-4 -right-4 bg-white text-slate-900 rounded-full w-8 h-8 flex items-center justify-center font-bold shadow">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
