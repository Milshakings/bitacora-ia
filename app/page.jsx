"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";

// Función Experta de Procesamiento de Texto (NLP Avanzado Local)
function procesarTextoExperto(textoCrudo, titulo, organizacion, area) {
  if (!textoCrudo || !textoCrudo.trim()) {
    return {
      resumen: `Registro de evento [${area || "General"}]: "${titulo || "Sin título"}" ${organizacion ? "con " + organizacion : ""}. Sin notas adicionales ingresadas.`,
      puntosClave: ["No se ingresaron notas textuales para analizar."],
      accionesSugeridas: ["Agregar notas o apuntes clave de la charla."],
      datosYMetricas: []
    };
  }

  // Limpieza y fragmentación por saltos de línea, puntos, guiones o viñetas
  const lineasYFrases = textoCrudo
    .split(/[\n;•\-\u2022]+|\.\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 3);

  const acciones = [];
  const datosMetricas = [];
  const ideasClave = [];

  const patronAccion = /\b(hacer|contactar|revisar|llamar|pedir|enviar|comprar|implementar|cotizar|agendar|coordinar|validar|crear|desarrollar|evaluar|programar)\b/i;
  const patronCifras = /(\d+[\d.,]*%?|\$\d+[\d.,]*|\b(19|20)\d{2}\b)/i;

  lineasYFrases.forEach((frase) => {
    if (patronAccion.test(frase)) {
      acciones.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    } else if (patronCifras.test(frase)) {
      datosMetricas.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    } else {
      ideasClave.push(frase.charAt(0).toUpperCase() + frase.slice(1));
    }
  });

  const primeraIdea = ideasClave[0] || lineasYFrases[0] || "Puntos presentados en la sesión";
  const segundaIdea = ideasClave[1] ? ` Además, se abordó: ${ideasClave[1]}.` : "";

  const resumenSintetizado = `SÍNTESIS CORTA [${area}]: ${primeraIdea}.${segundaIdea}`.trim();

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
  const [areaTematica, setAreaTematica] = useState("IA & Tecnología");
  const [areaPersonalizada, setAreaPersonalizada] = useState("");
  const [fechaEvento, setFechaEvento] = useState(new Date().toISOString().slice(0, 16));
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
  const [filtroArea, setFiltroArea] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  // Estados para expandir y editar ítems del historial
  const [expandidos, setExpandidos] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

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
        if (draft.areaTematica) setAreaTematica(draft.areaTematica);
        if (draft.areaPersonalizada) setAreaPersonalizada(draft.areaPersonalizada);
        if (draft.fechaEvento) setFechaEvento(draft.fechaEvento);
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
      areaTematica,
      areaPersonalizada,
      fechaEvento,
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
  }, [titulo, organizacion, tipoEvento, areaTematica, areaPersonalizada, fechaEvento, ubicacion, notasCrudas, fotos, estrellas, valoracion, opinion]);

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
    setAreaTematica("IA & Tecnología");
    setAreaPersonalizada("");
    setFechaEvento(new Date().toISOString().slice(0, 16));
    setFotos([]);
    setEstrellas(0);
    setValoracion(null);
    setOpinion("");
    setResultadoExperto(null);
    setInfoInvestigada(null);
    localStorage.removeItem("bitacora_ia_borrador");
  };

  // Captura de fotos
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

  // Procesamiento Experto Real
  const areaFinal = areaTematica === "Otro" ? (areaPersonalizada || "General") : areaTematica;

  const ejecutarProcesamientoExperto = () => {
    if (!titulo && fotos.length === 0 && !notasCrudas.trim()) {
      alert("Escribe notas, un título o toma una foto antes de procesar.");
      return;
    }

    setCargandoIA(true);
    setTimeout(() => {
      const analisisReal = procesarTextoExperto(notasCrudas, titulo, organizacion, areaFinal);
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
        perfil: `Búsqueda sugerida para "${organizacion}" [${areaFinal}]: Utiliza los accesos de LinkedIn o Scholar para revisar publicaciones y antecedentes.`,
        sugerencia: "Verificar proyectos activos y publicaciones recientes."
      });
      setCargandoInvestigacion(false);
    }, 600);
  };

  const guardarEntrada = () => {
    if (!titulo) {
      alert("Asigna un título antes de guardar.");
      return;
    }

    const analisisFinal = resultadoExperto || procesarTextoExperto(notasCrudas, titulo, organizacion, areaFinal);

    const fechaObj = new Date(fechaEvento);
    const fechaFormateada = isNaN(fechaObj.getTime())
      ? new Date().toLocaleString("es-CL")
      : fechaObj.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

    const nuevaEntrada = {
      id: Date.now(),
      titulo,
      organizacion: organizacion || "No especificada",
      ubicacion: ubicacion || "Lugar no registrado",
      tipo: tipoEvento,
      area: areaFinal,
      fecha: fechaFormateada,
      fechaISO: fechaEvento,
      estrellas,
      valoracion,
      opinion,
      notasCrudas,
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

  // Funciones para expandir y editar historial
  const toggleExpandir = (id) => {
    setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setEditForm({ ...item });
  };

  const guardarEdicion = (id) => {
    const actualizado = historial.map((item) => {
      if (item.id === id) {
        // Recalcular síntesis si cambiaron las notas crudas
        const analisisActualizado = procesarTextoExperto(
          editForm.notasCrudas || "",
          editForm.titulo,
          editForm.organizacion,
          editForm.area
        );

        return {
          ...editForm,
          resumen: editForm.resumen || analisisActualizado.resumen,
          puntosClave: analisisActualizado.puntosClave,
          datosMetricas: analisisActualizado.datosYMetricas,
          tareas: analisisActualizado.accionesSugeridas
        };
      }
      return item;
    });

    guardarEnLocalStorage(actualizado);
    setEditandoId(null);
    setEditForm({});
    alert("¡Registro actualizado correctamente!");
  };

  // Filtrado de Historial
  const historialFiltrado = historial.filter((item) => {
    const coincideTexto = 
      item.titulo.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      item.organizacion.toLowerCase().includes(busquedaHistorial.toLowerCase()) ||
      item.ubicacion.toLowerCase().includes(busquedaHistorial.toLowerCase());

    const coincideArea = filtroArea === "TODOS" || item.area === filtroArea;
    const coincideTipo = filtroTipo === "TODOS" || item.tipo === filtroTipo;

    return coincideTexto && coincideArea && coincideTipo;
  });

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
              Captura charlas pasadas y presentes, clasifica por área y edita o expande tus apuntes guardados.
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
                <h2 className="text-lg font-semibold text-slate-800">1. Datos del Evento / Charla</h2>
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
                    placeholder="Ej. Métodos de Extracción en Bioprocesos"
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

              {/* Fecha y Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">📅 Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    value={fechaEvento}
                    onChange={(e) => setFechaEvento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">🏷️ Área de Conocimiento</label>
                  <select 
                    value={areaTematica} 
                    onChange={(e) => setAreaTematica(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  >
                    <option value="IA & Tecnología">IA & Tecnología</option>
                    <option value="Ciencias & Biotecnología">Ciencias & Biotecnología</option>
                    <option value="Arquitectura & Urbanismo">Arquitectura & Urbanismo</option>
                    <option value="Educación & EdTech">Educación & EdTech</option>
                    <option value="Negocios & Innovación">Negocios & Innovación</option>
                    <option value="Economía & Finanzas">Economía & Finanzas</option>
                    <option value="Sustentabilidad & Reciclaje">Sustentabilidad & Reciclaje</option>
                    <option value="Otro">Otro (Especificar)</option>
                  </select>
                </div>

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
              </div>

              {areaTematica === "Otro" && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Especifica el Área Personalizada</label>
                  <input 
                    type="text"
                    value={areaPersonalizada}
                    onChange={(e) => setAreaPersonalizada(e.target.value)}
                    placeholder="Ej. Neurociencia, Minería..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              )}

              {/* Botones de búsqueda */}
              <div className="pt-1 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Buscar Perfil En:</span>
                <button type="button" onClick={abrirLinkedin} className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-medium rounded-lg border border-sky-200 transition">💼 LinkedIn</button>
                <button type="button" onClick={abrirGoogle} className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition">🔍 Google</button>
                <button type="button" onClick={abrirGoogleScholar} className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 transition">🎓 Scholar</button>
              </div>

              {/* Ubicación */}
              <div className="pt-2">
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

            {/* Resultado Sintético Real */}
            {resultadoExperto && (
              <div className="bg-white border-2 border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🎯</span> Síntesis Experta [{areaFinal}]
                  </h3>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold">Procesado</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resumen Ejecutivo Directo</h4>
                  <p className="text-sm text-slate-800 font-medium">{resultadoExperto.resumen}</p>
                </div>

                {resultadoExperto.puntosClave.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Ideas y Conceptos Extraídos</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-1 space-y-1">
                      {resultadoExperto.puntosClave.map((punto, i) => (<li key={i}>{punto}</li>))}
                    </ul>
                  </div>
                )}

                {resultadoExperto.datosYMetricas && resultadoExperto.datosYMetricas.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="text-xs font-semibold text-amber-900 uppercase mb-1">📊 Cifras y Datos Técnicos Detectados</h4>
                    <ul className="list-disc list-inside text-sm text-amber-950 space-y-1">
                      {resultadoExperto.datosYMetricas.map((dato, i) => (<li key={i}>{dato}</li>))}
                    </ul>
                  </div>
                )}

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

          {/* Historial con Expandir y Edición Directa */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 sticky top-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Historial Guardado</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{historialFiltrado.length} registros</span>
              </div>
              
              {/* Controles de Filtros */}
              <div className="space-y-2">
                <input 
                  type="text" 
                  value={busquedaHistorial} 
                  onChange={(e) => setBusquedaHistorial(e.target.value)} 
                  placeholder="🔍 Buscar por palabra clave..." 
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white" 
                />

                <div className="grid grid-cols-2 gap-2">
                  <select 
                    value={filtroArea} 
                    onChange={(e) => setFiltroArea(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  >
                    <option value="TODOS">Todas las Áreas</option>
                    <option value="IA & Tecnología">IA & Tecnología</option>
                    <option value="Ciencias & Biotecnología">Ciencias & Biotecnología</option>
                    <option value="Arquitectura & Urbanismo">Arquitectura & Urbanismo</option>
                    <option value="Educación & EdTech">Educación & EdTech</option>
                    <option value="Negocios & Innovación">Negocios & Innovación</option>
                    <option value="Sustentabilidad & Reciclaje">Sustentabilidad</option>
                  </select>

                  <select 
                    value={filtroTipo} 
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50"
                  >
                    <option value="TODOS">Todos los Tipos</option>
                    <option value="Seminario">Seminario</option>
                    <option value="Taller">Taller</option>
                    <option value="Conferencia">Conferencia</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Reunión">Reunión</option>
                  </select>
                </div>
              </div>

              {/* Lista de Tarjetas del Historial */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {historialFiltrado.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No se encontraron registros con los filtros seleccionados.</p>
                ) : (
                  historialFiltrado.map((item) => {
                    const estaExpandido = !!expandidos[item.id];
                    const estaEditando = editandoId === item.id;

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3 relative group shadow-2xs">
                        
                        {/* Botón Borrar */}
                        <button onClick={() => borrarEntrada(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs transition">🗑️</button>

                        {!estaEditando ? (
                          <>
                            {/* Cabecera Tarjeta */}
                            <div className="flex flex-wrap items-center gap-1 pr-6">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{item.tipo}</span>
                              {item.area && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
                                  🏷️ {item.area}
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 ml-auto">📅 {item.fecha}</span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>
                            {item.organizacion && <p className="text-xs text-slate-600 font-medium">🏢 {item.organizacion}</p>}
                            <p className="text-xs text-slate-500">📍 {item.ubicacion}</p>

                            {/* Resumen Vista Previa */}
                            <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
                              {item.resumen}
                            </div>

                            {/* Fotos miniaturas */}
                            {item.fotos && item.fotos.length > 0 && (
                              <div className="flex gap-1 overflow-x-auto pt-1">
                                {item.fotos.map((f, idx) => (
                                  <img key={idx} src={f} alt="thumb" onClick={() => setFotoModal(f)} className="w-8 h-8 object-cover rounded cursor-pointer border border-slate-200 hover:opacity-80" />
                                ))}
                              </div>
                            )}

                            {/* Detalle Expandido */}
                            {estaExpandido && (
                              <div className="pt-2 border-t border-slate-200 space-y-3 text-xs bg-slate-100/70 p-3 rounded-lg mt-2">
                                {item.notasCrudas && (
                                  <div>
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Apuntes Crudos Originales:</span>
                                    <p className="font-mono text-slate-700 whitespace-pre-wrap mt-0.5">{item.notasCrudas}</p>
                                  </div>
                                )}

                                {item.puntosClave && item.puntosClave.length > 0 && (
                                  <div>
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Ideas Principales Extraídas:</span>
                                    <ul className="list-disc list-inside text-slate-700 mt-0.5 space-y-0.5">
                                      {item.puntosClave.map((p, i) => <li key={i}>{p}</li>)}
                                    </ul>
                                  </div>
                                )}

                                {item.datosMetricas && item.datosMetricas.length > 0 && (
                                  <div>
                                    <span className="font-bold text-amber-800 uppercase text-[10px]">📊 Cifras y Datos Técnicos:</span>
                                    <ul className="list-disc list-inside text-amber-950 mt-0.5 space-y-0.5">
                                      {item.datosMetricas.map((d, i) => <li key={i}>{d}</li>)}
                                    </ul>
                                  </div>
                                )}

                                {item.opinion && (
                                  <div>
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Comentario / Opinión:</span>
                                    <p className="text-slate-700 italic mt-0.5">"{item.opinion}"</p>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Botones de Acción Tarjeta */}
                            <div className="flex justify-between items-center pt-1 text-xs">
                              <button 
                                onClick={() => toggleExpandir(item.id)}
                                className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px] flex items-center gap-1"
                              >
                                {estaExpandido ? "▲ Ocultar Detalle" : "📖 Ver todo y notas"}
                              </button>

                              <button 
                                onClick={() => iniciarEdicion(item)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium transition"
                              >
                                ✏️ Editar
                              </button>
                            </div>
                          </>
                        ) : (
                          /* Formulario de Edición Directa */
                          <div className="space-y-3 pt-1">
                            <span className="text-xs font-bold text-indigo-700 block border-b pb-1">✏️ Editando Registro</span>
                            
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500">Título</label>
                              <input 
                                type="text" 
                                value={editForm.titulo || ""} 
                                onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })}
                                className="w-full text-xs p-1.5 border rounded bg-white"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Organización</label>
                                <input 
                                  type="text" 
                                  value={editForm.organizacion || ""} 
                                  onChange={(e) => setEditForm({ ...editForm, organizacion: e.target.value })}
                                  className="w-full text-xs p-1.5 border rounded bg-white"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] uppercase font-bold text-slate-500">Ubicación</label>
                                <input 
                                  type="text" 
                                  value={editForm.ubicacion || ""} 
                                  onChange={(e) => setEditForm({ ...editForm, ubicacion: e.target.value })}
                                  className="w-full text-xs p-1.5 border rounded bg-white"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500">Editar Apuntes Crudos</label>
                              <textarea 
                                rows="3"
                                value={editForm.notasCrudas || ""} 
                                onChange={(e) => setEditForm({ ...editForm, notasCrudas: e.target.value })}
                                className="w-full text-xs p-1.5 border rounded bg-white font-mono"
                              ></textarea>
                            </div>

                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500">Editar Síntesis Corta</label>
                              <textarea 
                                rows="2"
                                value={editForm.resumen || ""} 
                                onChange={(e) => setEditForm({ ...editForm, resumen: e.target.value })}
                                className="w-full text-xs p-1.5 border rounded bg-white font-medium"
                              ></textarea>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                              <button 
                                onClick={() => setEditandoId(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg font-medium"
                              >
                                Cancelar
                              </button>
                              <button 
                                onClick={() => guardarEdicion(item.id)}
                                className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-medium shadow hover:bg-emerald-700"
                              >
                                💾 Guardar Cambios
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