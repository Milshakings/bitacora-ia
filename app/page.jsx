"use client";

import React, { useState, useEffect } from "react";
import "./globals.css";
import { leerClaveBD, guardarClaveBD } from "./lib/db";
import { sintetizarTextoAlgoritmico } from "./lib/nlp-ocr";
import HeaderMetricas from "./components/HeaderMetricas";
import SeccionEvento from "./components/SeccionEvento";
import SeccionMultimedia from "./components/SeccionMultimedia";
import SeccionNotasSintesis from "./components/SeccionNotasSintesis";
import HistorialPanel from "./components/HistorialPanel";

export default function BitacoraIA() {
  const [perfilActivo, setPerfilActivo] = useState("principal");

  const [titulo, setTitulo] = useState("");
  const [expositor, setExpositor] = useState("");
  const [organizacion, setOrganizacion] = useState("");
  const [tipoEvento, setTipoEvento] = useState("Seminario");
  const [areaTematica, setAreaTematica] = useState("IA & Tecnología");
  const [areaPersonalizada, setAreaPersonalizada] = useState("");
  const [fechaEvento, setFechaEvento] = useState(new Date().toISOString().slice(0, 16));
  const [ubicacion, setUbicacion] = useState("");
  const [panelistas, setPanelistas] = useState([]);
  const [notasCrudas, setNotasCrudas] = useState("");

  const [fotos, setFotos] = useState([]);
  const [estrellas, setEstrellas] = useState(0);
  const [valoracion, setValoracion] = useState(null);
  const [opinion, setOpinion] = useState("");

  const [resultadoExperto, setResultadoExperto] = useState(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [cargandoGPS, setCargandoGPS] = useState(false);

  const [historial, setHistorial] = useState([]);
  const [metricasValidacion, setMetricasValidacion] = useState({
    fotosProcesadasOCR: 0,
    busquedasLinkedin: 0,
    bitacorasCreadas: 0
  });

  const claves =
    perfilActivo === "principal"
      ? { historial: "historial", borrador: "borrador", metricas: "metricas_validacion" }
      : { historial: "historial_demo", borrador: "borrador_demo", metricas: "metricas_validacion_demo" };

  useEffect(() => {
    let cancelado = false;
    async function cargarPerfil() {
      const hist = await leerClaveBD(claves.historial, []);
      const met = await leerClaveBD(claves.metricas, {
        fotosProcesadasOCR: 0,
        busquedasLinkedin: 0,
        bitacorasCreadas: 0
      });
      const draft = await leerClaveBD(claves.borrador, null);
      if (cancelado) return;

      setHistorial(Array.isArray(hist) ? hist : []);
      setMetricasValidacion(
        met || { fotosProcesadasOCR: 0, busquedasLinkedin: 0, bitacorasCreadas: 0 }
      );

      setTitulo(draft?.titulo || "");
      setExpositor(draft?.expositor || "");
      setOrganizacion(draft?.organizacion || "");
      setTipoEvento(draft?.tipoEvento || "Seminario");
      setAreaTematica(draft?.areaTematica || "IA & Tecnología");
      setAreaPersonalizada(draft?.areaPersonalizada || "");
      setFechaEvento(draft?.fechaEvento || new Date().toISOString().slice(0, 16));
      setUbicacion(draft?.ubicacion || "");
      setPanelistas(draft?.panelistas || []);
      setNotasCrudas(draft?.notasCrudas || "");
      setFotos(draft?.fotos || []);
      setEstrellas(draft?.estrellas || 0);
      setValoracion(draft?.valoracion || null);
      setOpinion(draft?.opinion || "");
      setResultadoExperto(null);
    }
    cargarPerfil();
    return () => {
      cancelado = true;
    };
  }, [claves.historial, claves.borrador, claves.metricas]);

  useEffect(() => {
    guardarClaveBD(claves.borrador, {
      titulo,
      expositor,
      organizacion,
      tipoEvento,
      areaTematica,
      areaPersonalizada,
      fechaEvento,
      ubicacion,
      panelistas,
      notasCrudas,
      fotos,
      estrellas,
      valoracion,
      opinion
    });
  }, [
    claves.borrador,
    titulo,
    expositor,
    organizacion,
    tipoEvento,
    areaTematica,
    areaPersonalizada,
    fechaEvento,
    ubicacion,
    panelistas,
    notasCrudas,
    fotos,
    estrellas,
    valoracion,
    opinion
  ]);

  const incrementarMetrica = async (campo) => {
    const nuevas = { ...metricasValidacion, [campo]: (metricasValidacion[campo] || 0) + 1 };
    setMetricasValidacion(nuevas);
    await guardarClaveBD(claves.metricas, nuevas);
  };

  const actualizarHistorial = async (nuevo) => {
    setHistorial(nuevo);
    await guardarClaveBD(claves.historial, nuevo);
  };

  const limpiarBorrador = () => {
    setTitulo("");
    setExpositor("");
    setOrganizacion("");
    setUbicacion("");
    setPanelistas([]);
    setNotasCrudas("");
    setAreaTematica("IA & Tecnología");
    setAreaPersonalizada("");
    setTipoEvento("Seminario");
    setFechaEvento(new Date().toISOString().slice(0, 16));
    setFotos([]);
    setEstrellas(0);
    setValoracion(null);
    setOpinion("");
    setResultadoExperto(null);
    guardarClaveBD(claves.borrador, null);
  };

  const resetDemo = async () => {
    if (perfilActivo !== "demo") return;
    if (confirm("¿Vaciar por completo los registros de prueba del Modo Demo?")) {
      await actualizarHistorial([]);
      const cero = { fotosProcesadasOCR: 0, busquedasLinkedin: 0, bitacorasCreadas: 0 };
      setMetricasValidacion(cero);
      await guardarClaveBD(claves.metricas, cero);
      limpiarBorrador();
    }
  };

  const exportarJSON = () => {
    const payload = {
      version: 1,
      perfil: perfilActivo,
      fechaRespaldo: new Date().toISOString(),
      metricasValidacion,
      historial
    };
    const a = document.createElement("a");
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
    a.download = `respaldo_bitacora_${perfilActivo}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importarJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed && Array.isArray(parsed.historial)) {
          if (confirm(`Se encontraron ${parsed.historial.length} registros. ¿Importarlos al perfil actual?`)) {
            const fusion = [...parsed.historial, ...historial];
            const unicos = Array.from(new Map(fusion.map((x) => [x.id, x])).values());
            await actualizarHistorial(unicos);
            if (parsed.metricasValidacion) {
              setMetricasValidacion(parsed.metricasValidacion);
              await guardarClaveBD(claves.metricas, parsed.metricasValidacion);
            }
            alert("¡Respaldo importado con éxito!");
          }
        }
      } catch {
        alert("Error al leer archivo JSON.");
      }
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const insertarTurnoEnNotas = (marcador) => {
    const ta = document.getElementById("textarea-notas");
    if (!ta) {
      setNotasCrudas((prev) => prev + marcador);
      return;
    }
    const start = ta.selectionStart ?? notasCrudas.length;
    const end = ta.selectionEnd ?? notasCrudas.length;
    const texto = notasCrudas.substring(0, start) + marcador + notasCrudas.substring(end);
    setNotasCrudas(texto);
    setTimeout(() => {
      ta.focus();
      ta.setSelectionRange(start + marcador.length, start + marcador.length);
    }, 0);
  };

  const obtenerGPS = () => {
    if (!("geolocation" in navigator)) return alert("Geolocalización no soportada.");
    setCargandoGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const comuna = data.address.suburb || data.address.city_district || data.address.town || "";
          const ciudad = data.address.city || data.address.state || "Chile";
          setUbicacion(`${comuna ? comuna + ", " : ""}${ciudad}`);
        } catch {
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

  const areaFinal = areaTematica === "Otro" ? areaPersonalizada || "General" : areaTematica;

  const sintetizar = () => {
    if (!titulo && fotos.length === 0 && !notasCrudas.trim()) {
      alert("Escribe notas o agrega un título antes de procesar.");
      return;
    }
    setCargandoIA(true);
    setTimeout(() => {
      setResultadoExperto(sintetizarTextoAlgoritmico(notasCrudas, areaFinal));
      setCargandoIA(false);
    }, 300);
  };

  const guardarEntrada = async () => {
    if (!titulo.trim()) {
      alert("Asigna un título antes de guardar.");
      return;
    }
    const analisis = resultadoExperto || sintetizarTextoAlgoritmico(notasCrudas, areaFinal);
    const fechaObj = new Date(fechaEvento);
    const fechaFmt = isNaN(fechaObj.getTime())
      ? new Date().toLocaleString("es-CL")
      : fechaObj.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });

    const entrada = {
      id: Date.now(),
      titulo: titulo.trim(),
      expositor: expositor || "No especificado",
      organizacion: organizacion || "No especificada",
      ubicacion: ubicacion || "Lugar no registrado",
      tipo: tipoEvento,
      area: areaFinal,
      fecha: fechaFmt,
      fechaISO: fechaEvento,
      estrellas,
      valoracion,
      opinion,
      notasCrudas,
      resumen: analisis.resumen,
      puntosClave: analisis.puntosClave,
      datosMetricas: analisis.datosYMetricas,
      tareas: analisis.accionesSugeridas,
      fotos: [...fotos]
    };

    await actualizarHistorial([entrada, ...historial]);
    await incrementarMetrica("bitacorasCreadas");
    alert("¡Entrada guardada correctamente!");
    limpiarBorrador();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        <HeaderMetricas
          perfilActivo={perfilActivo}
          setPerfilActivo={setPerfilActivo}
          metricasValidacion={metricasValidacion}
          totalHistorial={historial.length}
          onExportar={exportarJSON}
          onImportar={importarJSON}
          onLimpiar={limpiarBorrador}
          onResetDemo={resetDemo}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <SeccionEvento
              perfilActivo={perfilActivo}
              titulo={titulo}
              setTitulo={setTitulo}
              expositor={expositor}
              setExpositor={setExpositor}
              organizacion={organizacion}
              setOrganizacion={setOrganizacion}
              fechaEvento={fechaEvento}
              setFechaEvento={setFechaEvento}
              areaTematica={areaTematica}
              setAreaTematica={setAreaTematica}
              areaPersonalizada={areaPersonalizada}
              setAreaPersonalizada={setAreaPersonalizada}
              tipoEvento={tipoEvento}
              setTipoEvento={setTipoEvento}
              ubicacion={ubicacion}
              setUbicacion={setUbicacion}
              panelistas={panelistas}
              setPanelistas={setPanelistas}
              onInsertarTurno={insertarTurnoEnNotas}
              onLinkedin={() => {
                if (!expositor) {
                  alert("Ingresa el nombre del expositor primero.");
                  return;
                }
                incrementarMetrica("busquedasLinkedin");
                window.open(
                  `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(expositor)}`,
                  "_blank"
                );
              }}
              onGoogle={() => {
                if (!organizacion && !titulo && !expositor) {
                  alert("Ingresa datos de búsqueda primero.");
                  return;
                }
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(`${expositor} ${organizacion} ${titulo}`)}`,
                  "_blank"
                );
              }}
              onScholar={() => {
                if (!titulo && !expositor) {
                  alert("Ingresa un tema o expositor primero.");
                  return;
                }
                window.open(
                  `https://scholar.google.com/scholar?q=${encodeURIComponent(`${expositor} ${titulo}`)}`,
                  "_blank"
                );
              }}
              onGPS={obtenerGPS}
              cargandoGPS={cargandoGPS}
            />

            <SeccionMultimedia
              fotos={fotos}
              setFotos={setFotos}
              onTextoOCR={(bloque) => setNotasCrudas((prev) => prev + bloque)}
              onIncrementarOCR={() => incrementarMetrica("fotosProcesadasOCR")}
            />

            <SeccionNotasSintesis
              notasCrudas={notasCrudas}
              setNotasCrudas={setNotasCrudas}
              estrellas={estrellas}
              setEstrellas={setEstrellas}
              valoracion={valoracion}
              setValoracion={setValoracion}
              opinion={opinion}
              setOpinion={setOpinion}
              resultadoExperto={resultadoExperto}
              cargandoIA={cargandoIA}
              onSintetizar={sintetizar}
              onGuardar={guardarEntrada}
            />
          </div>

          <HistorialPanel
            perfilActivo={perfilActivo}
            historial={historial}
            onActualizarHistorial={actualizarHistorial}
          />
        </div>
      </div>
    </div>
  );
}
