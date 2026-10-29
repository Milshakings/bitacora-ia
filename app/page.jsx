"use client";

import React, { useState, useEffect, useRef } from "react";
import "./globals.css";
import { createWorker } from 'tesseract.js';

// Compresión de imágenes para optimizar espacio en IndexedDB
const comprimirImagen = (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
  });
};

// NLP Local de Asistente Experto
function sintetizarTextoAlgoritmico(textoOriginal, area) {
  if (!textoOriginal || !textoOriginal.trim()) {
    return {
      resumen: `Registro de evento [${area || "General"}]: Sin notas adicionales.`,
      puntosClave: ["No se ingresaron notas textuales para analizar."],
      datosYMetricas: [],
      accionesSugeridas: ["Agregar notas o apuntes clave de la charla."]
    };
  }

  const stopwords = new Set([
    "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una",
    "su", "al", "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este", "sí", "porque", "esta", "entre"
  ]);

  const oraciones = textoOriginal
    .split(/[\n.]+/|\b(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (oraciones.length === 0) {
    return {
      resumen: textoOriginal.slice(0, 100) + "...",
      puntosClave: [textoOriginal],
      datosYMetricas: [],
      accionesSugeridas: []
    };
  }

  const palabras = textoOriginal.toLowerCase().match(/\b[a-záéíóúñ]{3,}\b/g) || [];
  const frecuencia = {};
  
  palabras.forEach((word) => {
    if (!stopwords.has(word)) {
      frecuencia[word] = (frecuencia[word] || 0) + 1;
    }
  });

  const oracionesPuntuadas = oraciones.map((oracion) => {
    const palabrasOracion = oracion.toLowerCase().match(/\b[a-záéíóúñ]{3,}\b/g) || [];
    let puntaje = 0;
    palabrasOracion.forEach((w) => {
      if (frecuencia[w]) puntaje += frecuencia[w];
    });
    const puntajeNormalizado = palabrasOracion.length > 0 ? puntaje / palabrasOracion.length : 0;
    return { texto: oracion, puntaje: puntajeNormalizado };
  });

  oracionesPuntuadas.sort((a, b) => b.puntaje - a.puntaje);

  const patronAccion = /\b(hacer|contactar|revisar|llamar|pedir|enviar|comprar|implementar|cotizar|agendar|coordinar|validar|crear|desarrollar|evaluar|programar)\b/i;
  const patronCifras = /(\d+[\d.,]*%?|\$\d+[\d.,]*|\b(19|20)\d{2}\b)/i;

  const acciones = [];
  const datosMetricas = [];
  const conceptosLimpios = [];

  oraciones.forEach((oracion) => {
    if (patronAccion.test(oracion)) {
      acciones.push(oracion);
    } else if (patronCifras.test(oracion)) {
      datosMetricas.push(oracion);
    } else {
      conceptosLimpios.push(oracion);
    }
  });

  const mejorOracion = oracionesPuntuadas[0]?.texto || oraciones[0];
  const segundaMejor = oracionesPuntuadas[1]?.texto && oracionesPuntuadas[1].texto !== mejorOracion
    ? " " + oracionesPuntuadas[1].texto
    : "";

  const resumenCondensado = `[SÍNTESIS SINTÉTICA ${area.toUpperCase()}]: ${mejorOracion}.${segundaMejor}`;

  return {
    resumen: resumenCondensado,
    puntosClave: conceptosLimpios.slice(0, 4),
    datosYMetricas: datosMetricas,
    accionesSugeridas: acciones.length > 0 ? acciones : ["Revisar seguimiento de los temas abordados."]
  };
}

export default function BitacoraIA() {
  const [titulo, setTitulo] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [tipoEvento, setTipoEvento] = useState("Seminario");
  const [areaTematica, setAreaTematica] = useState("IA & Tecnología");
  const [areaPersonalizada, setAreaPersonalizada] = useState("");
  const [fechaEvento, setFechaEvento] = useState(new Date().toISOString().slice(0, 16));
  const [ubicacion, setUbicacion] = useState("");
  const [notasCrudas, setNotasCrudas] = useState("");

  const [fotos, setFotos] = useState([]);
  const [fotoModal, setFotoModal] = useState(null);
  const [leyendoOCR, setLeyendoOCR] = useState(false);

  const [estrellas, setEstrellas] = useState(0);
  const [valoracion, setValoracion] = useState(null);
  const [opinion, setOpinion] = useState("");

  const [resultadoExperto, setResultadoExperto] = useState(null);
  const [infoInvestigada, setInfoInvestigada] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [cargandoInvestigacion, setCargandoInvestigacion] = useState(false);
  const [cargandoGPS, setCargandoGPS] = useState(false);

  const [historial, setHistorial] = useState([]);
  const [busquedaHistorial, setBusquedaHistorial] = useState("");
  const [filtroArea, setFiltroArea] = useState("TODOS");
  const [filtroTipo, setFiltroTipo] = useState("TODOS");

  const [expandidos, setExpandidos] = useState({});
  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fileInputRestaurarRef = useRef(null);

  // Cargar datos de IndexedDB
  useEffect(() => {
    async function cargarDatosBD() {
      try {
        const dbReq = indexedDB.open("BitacoraIADB", 1);
        dbReq.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains("almacen")) {
            db.createObjectStore("almacen");
          }
        };

        dbReq.onsuccess = (e) => {
          const db = e.target.result;
          const transaction = db.transaction(["almacen"], "readonly");
          const store = transaction.objectStore("almacen");

          const reqHistorial = store.get("historial");
          reqHistorial.onsuccess = () => {
            if (reqHistorial.result) setHistorial(reqHistorial.result);
          };

          const reqBorrador = store.get("borrador");
          reqBorrador.onsuccess = () => {
            const draft = reqBorrador.result;
            if (draft) {
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
          };
        };
      } catch (err) {
        console.error("Error IndexedDB:", err);
      }
    }
    cargarDatosBD();
  }, []);

  const guardarEnBD = (clave, valor) => {
    try {
      const dbReq = indexedDB.open("BitacoraIADB", 1);
      dbReq.onsuccess = (e) => {
        const db = e.target.result;
        const transaction = db.transaction(["almacen"], "readwrite");
        const store = transaction.objectStore("almacen");
        store.put(valor, clave);
      };
    } catch (err) {
      console.error("Error al guardar:", err);
    }
  };

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
    guardarEnBD("borrador", borradorActual);
  }, [titulo, organizacion, tipoEvento, areaTematica, areaPersonalizada, fechaEvento, ubicacion, notasCrudas, fotos, estrellas, valoracion, opinion]);

  const actualizarHistorialBD = (nuevoHistorial) => {
    setHistorial(nuevoHistorial);
    guardarEnBD("historial", nuevoHistorial);
  };

  // Función OCR local con Tesseract.js
  const reconocerTextoFoto = async (imageSrc) => {
    setLeyendoOCR(true);
    try {
      const worker = await createWorker('spa');
      const ret = await worker.recognize(imageSrc);
      const textoDetectado = ret.data.text;
      await worker.terminate();

      if (textoDetectado && textoDetectado.trim().length > 3) {
        setNotasCrudas((prev) => prev + "\n[OCR Imagen]: " + textoDetectado.trim());
      }
    } catch (err) {
      console.error("Error en OCR:", err);
    } finally {
      setLeyendoOCR(false);
    }
  };

  // Funciones de Respaldo y Restauración JSON
  const exportarRespaldoJSON = () => {
    const datosRespaldo = {
      version: 1,
      fechaRespaldo: new Date().toISOString(),
      historial: historial
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosRespaldo, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `respaldo_bitacora_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importarRespaldoJSON = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsedData = JSON.parse(event.target.result);
          if (parsedData && Array.isArray(parsedData.historial)) {
            if (confirm(`Se encontraron ${parsedData.historial.length} registros en el respaldo. ¿Deseas importarlos?`)) {
              const fusionados = [...parsedData.historial, ...historial];
              const unicos = Array.from(new Map(fusionados.map(item => [item.id, item])).values());
              actualizarHistorialBD(unicos);
              alert("¡Respaldo importado con éxito!");
            }
          } else {
            alert("Formato de respaldo inválido.");
          }
        } catch (error) {
          alert("Error al leer archivo JSON.");
        }
      };
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
    guardarEnBD("borrador", null);
  };

  const handleProcesarArchivos = (e) => {
    const files = Array.from(e.target.files);
    if (fotos.length + files.length > 7) {
      alert("Solo puedes adjuntar un máximo de 7 fotos por sesión.");
      return;
    }

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imagenComprimida = await comprimirImagen(reader.result, 800, 0.7);
        setFotos((prev) => [...prev, imagenComprimida].slice(0, 7));
        // Ejecutar OCR en segundo plano sobre la foto cargada
        reconocerTextoFoto(imagenComprimida);
      };
      reader.readAsDataURL(file);
    });
  };

  const eliminarFoto = (index) => {
    setFotos(fotos.filter((_, i) => i !== index));
  };

  const obtenerUbicacionGPS = () => {
    if (!("geolocation" in navigator)) return alert("Geolocalización no soportada.");
    setCargandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
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
        alert("No se obtuvo el GPS.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const abrirLinkedin = () => {
    if (!organizacion && !titulo) return alert("Ingresa persona u organización primero.");
    window.open(`https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(`${organizacion} ${titulo}`)}`, "_blank");
  };

  const abrirGoogle = () => {
    if (!organizacion && !titulo) return alert("Ingresa persona u organización primero.");
    window.open(`https://www.google.com/search?q=${encodeURIComponent(`${organizacion} ${titulo}`)}`, "_blank");
  };

  const abrirGoogleScholar = () => {
    if (!organizacion && !titulo) return alert("Ingresa persona u organización primero.");
    window.open(`https://scholar.google.com/scholar?q=${encodeURIComponent(`${organizacion} ${titulo}`)}`, "_blank");
  };

  const areaFinal = areaTematica === "Otro" ? (areaPersonalizada || "General") : areaTematica;

  const ejecutarProcesamientoExperto = () => {
    if (!titulo && fotos.length === 0 && !notasCrudas.trim()) {
      alert("Escribe notas o agrega un título antes de procesar.");
      return;
    }

    setCargandoIA(true);
    setTimeout(() => {
      const analisisReal = sintetizarTextoAlgoritmico(notasCrudas, areaFinal);
      setResultadoExperto(analisisReal);
      setCargandoIA(false);
    }, 400);
  };

  const guardarEntrada = () => {
    if (!titulo) return alert("Asigna un título antes de guardar.");

    const analisisFinal = resultadoExperto || sintetizarTextoAlgoritmico(notasCrudas, areaFinal);

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
    actualizarHistorialBD(actualizado);
    alert("¡Entrada guardada correctamente en tu historial!");
    limpiarBorrador();
  };

  const borrarEntrada = (id) => {
    if (confirm("¿Estás seguro de eliminar este registro?")) {
      actualizarHistorialBD(historial.filter((item) => item.id !== id));
    }
  };

  const toggleExpandir = (id) => setExpandidos((prev) => ({ ...prev, [id]: !prev[id] }));

  const iniciarEdicion = (item) => {
    setEditandoId(item.id);
    setEditForm({ ...item });
  };

  const guardarEdicion = (id) => {
    const actualizado = historial.map((item) => {
      if (item.id === id) {
        const analisisActualizado = sintetizarTextoAlgoritmico(
          editForm.notasCrudas || "",
          editForm.area || "General"
        );

        return {
          ...editForm,
          resumen: analisisActualizado.resumen,
          puntosClave: analisisActualizado.puntosClave,
          datosMetricas: analisisActualizado.datosYMetricas,
          tareas: analisisActualizado.accionesSugeridas
        };
      }
      return item;
    });

    actualizarHistorialBD(actualizado);
    setEditandoId(null);
    setEditForm({});
    alert("¡Registro actualizado correctamente!");
  };

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
              <span>📓</span> Bitácora IA: Asistente Experto (OCR + DB)
            </h1>
            <p className="text-sm text-slate-500">
              Captura charlas, lee texto de imágenes con OCR local y mantén respaldos seguros.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={exportarRespaldoJSON} type="button" className="text-xs bg-sky-50 hover:bg-sky-100 text-sky-700 px-3 py-1.5 rounded-lg font-medium border border-sky-200 transition">
              📥 Respaldar Datos
            </button>
            <button onClick={() => fileInputRestaurarRef.current.click()} type="button" className="text-xs bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-medium border border-emerald-200 transition">
              📤 Cargar Respaldo
            </button>
            <input type="file" ref={fileInputRestaurarRef} onChange={importarRespaldoJSON} accept=".json" className="hidden" />

            <button onClick={limpiarBorrador} type="button" className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg font-medium border transition">
              🧹 Limpiar
            </button>
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
                  🔒 DB Protegida
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Título de la Charla / Evento</label>
                  <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej. Métodos de Extracción en Bioprocesos" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Organización / Persona</label>
                  <input type="text" value={organizacion} onChange={(e) => setOrganizacion(e.target.value)} placeholder="Ej. Dr. Roberto Silva / CORFO" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">📅 Fecha y Hora</label>
                  <input type="datetime-local" value={fechaEvento} onChange={(e) => setFechaEvento(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">🏷️ Área de Conocimiento</label>
                  <select value={areaTematica} onChange={(e) => setAreaTematica(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
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
                  <select value={tipoEvento} onChange={(e) => setTipoEvento(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white">
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
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Especifica Área</label>
                  <input type="text" value={areaPersonalizada} onChange={(e) => setAreaPersonalizada(e.target.value)} placeholder="Ej. Minería, Agronomía..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                </div>
              )}

              <div className="pt-1 flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-slate-400 uppercase mr-1">Perfil:</span>
                <button type="button" onClick={abrirLinkedin} className="px-3 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded-lg border border-sky-200">💼 LinkedIn</button>
                <button type="button" onClick={abrirGoogle} className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-lg border border-slate-200">🔍 Google</button>
                <button type="button" onClick={abrirGoogleScholar} className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-medium rounded-lg border border-amber-200">🎓 Scholar</button>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Lugar / Ubicación</label>
                <div className="flex gap-2">
                  <input type="text" value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} placeholder="Ej. Providencia, Santiago" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm" />
                  <button type="button" onClick={obtenerUbicacionGPS} disabled={cargandoGPS} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-300 whitespace-nowrap">
                    {cargandoGPS ? "⏳..." : "📍 GPS"}
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Sección Multimedia con OCR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">2. Multimedia y OCR (Lectura Automática)</h2>
                <div className="flex items-center gap-2">
                  {leyendoOCR && <span className="text-xs text-indigo-600 font-semibold animate-pulse">🔍 Leyendo texto de foto...</span>}
                  <span className="text-xs font-medium text-slate-500">{fotos.length} / 7 fotos</span>
                </div>
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
                  <>
                    <label className="aspect-square border-2 border-dashed border-indigo-300 bg-indigo-50/40 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition text-indigo-700">
                      <span className="text-2xl mb-1">📸</span>
                      <span className="text-xs font-semibold text-center px-1">Tomar Foto</span>
                      <input type="file" accept="image/*" capture="environment" onChange={handleProcesarArchivos} className="hidden" />
                    </label>

                    <label className="aspect-square border-2 border-dashed border-slate-300 bg-slate-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 transition text-slate-700">
                      <span className="text-2xl mb-1">📂</span>
                      <span className="text-xs font-semibold text-center px-1">Buscar Archivos</span>
                      <input type="file" accept="image/*" multiple onChange={handleProcesarArchivos} className="hidden" />
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* 3. Apuntes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-lg font-semibold text-slate-800 border-b pb-2">3. Tus Notas Crudas y Texto Extraído</h2>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                  Ingresa o complementa tus notas (El OCR agregará texto de fotos aquí)
                </label>
                <textarea 
                  rows="5"
                  value={notasCrudas} 
                  onChange={(e) => setNotasCrudas(e.target.value)} 
                  placeholder="Escribe tus apuntes o toma una foto para extraer texto automáticamente..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Valoración</label>
                  <div className="flex items-center gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} type="button" onClick={() => setEstrellas(star)} className={`text-2xl transition ${star <= estrellas ? 'text-amber-400 scale-110' : 'text-slate-200'}`}>★</button>
                    ))}
                    <span className="text-xs text-slate-500 ml-2">({estrellas}/5)</span>
                  </div>

                  <div className="flex gap-2">
                    <button type="button" onClick={() => setValoracion('like')} className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium ${valoracion === 'like' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-white border-slate-200 text-slate-600'}`}>👍 Útil</button>
                    <button type="button" onClick={() => setValoracion('dislike')} className={`flex-1 py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium ${valoracion === 'dislike' ? 'bg-rose-50 border-rose-500 text-rose-700' : 'bg-white border-slate-200 text-slate-600'}`}>👎 Poco útil</button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Comentario Personal</label>
                  <textarea rows="3" value={opinion} onChange={(e) => setOpinion(e.target.value)} placeholder="Comentario personal..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"></textarea>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex flex-wrap gap-3">
              <button 
                type="button"
                onClick={ejecutarProcesamientoExperto}
                disabled={cargandoIA}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-6 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {cargandoIA ? "⚙️ Sintetizando..." : "🎯 Generar Síntesis Algorítmica"}
              </button>
            </div>

            {resultadoExperto && (
              <div className="bg-white border-2 border-indigo-500/40 p-6 rounded-2xl space-y-4 shadow-md">
                <div className="flex justify-between items-center border-b pb-2">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>🎯</span> Síntesis Generada
                  </h3>
                  <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-semibold">Listo</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Resumen Condensado</h4>
                  <p className="text-sm text-slate-800 font-medium">{resultadoExperto.resumen}</p>
                </div>

                {resultadoExperto.puntosClave.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase">Conceptos Destacados</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 mt-1 space-y-1">
                      {resultadoExperto.puntosClave.map((punto, i) => (<li key={i}>{punto}</li>))}
                    </ul>
                  </div>
                )}

                {resultadoExperto.datosYMetricas.length > 0 && (
                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <h4 className="text-xs font-semibold text-amber-900 uppercase mb-1">📊 Cifras y Datos Registrados</h4>
                    <ul className="list-disc list-inside text-sm text-amber-950 space-y-1">
                      {resultadoExperto.datosYMetricas.map((dato, i) => (<li key={i}>{dato}</li>))}
                    </ul>
                  </div>
                )}

                {resultadoExperto.accionesSugeridas.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-indigo-700 uppercase">✅ Acciones Detectadas</h4>
                    <ul className="list-disc list-inside text-sm text-indigo-900 font-medium mt-1 space-y-1">
                      {resultadoExperto.accionesSugeridas.map((accion, i) => (<li key={i}>{accion}</li>))}
                    </ul>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button type="button" onClick={guardarEntrada} className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-6 rounded-xl text-sm shadow transition">
                    💾 Guardar en Bitácora
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Historial */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-4 sticky top-6">
              <div className="flex justify-between items-center border-b pb-2">
                <h2 className="text-lg font-semibold text-slate-800">Historial</h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">{historialFiltrado.length} registros</span>
              </div>
              
              <div className="space-y-2">
                <input type="text" value={busquedaHistorial} onChange={(e) => setBusquedaHistorial(e.target.value)} placeholder="🔍 Buscar..." className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50" />

                <div className="grid grid-cols-2 gap-2">
                  <select value={filtroArea} onChange={(e) => setFiltroArea(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs bg-slate-50">
                    <option value="TODOS">Todas las Áreas</option>
                    <option value="IA & Tecnología">IA & Tecnología</option>
                    <option value="Ciencias & Biotecnología">Ciencias & Biotecnología</option>
                    <option value="Arquitectura & Urbanismo">Arquitectura & Urbanismo</option>
                    <option value="Educación & EdTech">Educación & EdTech</option>
                    <option value="Negocios & Innovación">Negocios & Innovación</option>
                    <option value="Sustentabilidad & Reciclaje">Sustentabilidad</option>
                  </select>

                  <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className="w-full px-2 py-1.5 border rounded text-xs bg-slate-50">
                    <option value="TODOS">Todos los Tipos</option>
                    <option value="Seminario">Seminario</option>
                    <option value="Taller">Taller</option>
                    <option value="Conferencia">Conferencia</option>
                    <option value="Terreno">Terreno</option>
                    <option value="Reunión">Reunión</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {historialFiltrado.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No hay registros guardados.</p>
                ) : (
                  historialFiltrado.map((item) => {
                    const estaExpandido = !!expandidos[item.id];
                    const estaEditando = editandoId === item.id;

                    return (
                      <div key={item.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition space-y-3 relative group">
                        <button onClick={() => borrarEntrada(item.id)} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 text-xs">🗑️</button>

                        {!estaEditando ? (
                          <>
                            <div className="flex flex-wrap items-center gap-1 pr-6">
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">{item.tipo}</span>
                              {item.area && <span className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">🏷️ {item.area}</span>}
                              <span className="text-[10px] text-slate-400 ml-auto">📅 {item.fecha}</span>
                            </div>

                            <h3 className="text-sm font-bold text-slate-900">{item.titulo}</h3>
                            {item.organizacion && <p className="text-xs text-slate-600 font-medium">🏢 {item.organizacion}</p>}
                            <p className="text-xs text-slate-500">📍 {item.ubicacion}</p>

                            <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 text-slate-800 font-medium">
                              {item.resumen}
                            </div>

                            {item.fotos && item.fotos.length > 0 && (
                              <div className="flex gap-1 overflow-x-auto pt-1">
                                {item.fotos.map((f, idx) => (
                                  <img key={idx} src={f} alt="thumb" onClick={() => setFotoModal(f)} className="w-8 h-8 object-cover rounded cursor-pointer border hover:opacity-80" />
                                ))}
                              </div>
                            )}

                            {estaExpandido && (
                              <div className="pt-2 border-t space-y-3 text-xs bg-slate-100/70 p-3 rounded-lg mt-2">
                                {item.notasCrudas && (
                                  <div>
                                    <span className="font-bold text-slate-600 uppercase text-[10px]">Apuntes Crudos:</span>
                                    <p className="font-mono text-slate-700 whitespace-pre-wrap mt-0.5">{item.notasCrudas}</p>
                                  </div>
                                )}
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-1 text-xs">
                              <button onClick={() => toggleExpandir(item.id)} className="text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]">
                                {estaExpandido ? "▲ Ocultar" : "📖 Ver todo"}
                              </button>
                              <button onClick={() => iniciarEdicion(item)} className="bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[11px] font-medium">
                                ✏️ Editar
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-3 pt-1">
                            <span className="text-xs font-bold text-indigo-700 block border-b pb-1">✏️ Editando Registro</span>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500">Título</label>
                              <input type="text" value={editForm.titulo || ""} onChange={(e) => setEditForm({ ...editForm, titulo: e.target.value })} className="w-full text-xs p-1.5 border rounded bg-white" />
                            </div>
                            <div>
                              <label className="text-[10px] uppercase font-bold text-slate-500">Notas</label>
                              <textarea rows="3" value={editForm.notasCrudas || ""} onChange={(e) => setEditForm({ ...editForm, notasCrudas: e.target.value })} className="w-full text-xs p-1.5 border rounded bg-white font-mono"></textarea>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <button onClick={() => setEditandoId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg">Cancelar</button>
                              <button onClick={() => guardarEdicion(item.id)} className="px-3 py-1 bg-emerald-600 text-white text-xs rounded-lg font-medium">💾 Guardar</button>
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