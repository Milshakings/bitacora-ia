"use client";

import { createWorker } from "tesseract.js";

// Mejora de contraste adaptativo suave: evita cortar letras finas o tildes en pantallas/slides
export function preprocesarImagenParaOCR(base64Str, maxWidth = 1400) {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Escalar hacia arriba si la imagen es pequeña para mejorar nitidez en OCR
      if (width < 900 && width > 0) {
        const factor = 900 / width;
        width = Math.round(width * factor);
        height = Math.round(height * factor);
      } else if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      // Escala de grises + realce de contraste controlado (sin aplastar a blanco/negro puro)
      const contraste = 1.35;
      const factorContraste = (259 * (contraste * 100 + 255)) / (255 * (259 - contraste * 100));

      for (let i = 0; i < data.length; i += 4) {
        const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        const ajustado = Math.max(0, Math.min(255, factorContraste * (gris - 128) + 128));
        data[i] = ajustado;
        data[i + 1] = ajustado;
        data[i + 2] = ajustado;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
  });
}

export function comprimirImagen(base64Str, maxWidth = 900, quality = 0.75) {
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
}

function limpiarRuidoOCR(texto) {
  return texto
    .replace(/[|]/g, "I")
    .replace(/[©®™]/g, "")
    .replace(/[^\S\r\n]+/g, " ")
    .split("\n")
    .map((linea) => linea.trim())
    // Filtra líneas sueltas de 1-2 caracteres sin sentido que suelen ser ruido de borde/moiré
    .filter((linea) => linea.length >= 3 || /^[A-Z0-9%$]$/.test(linea))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function ejecutarOCRLocal(imageSrc) {
  const imagenOptimizada = await preprocesarImagenParaOCR(imageSrc, 1400);
  const worker = await createWorker("spa");
  await worker.setParameters({
    tessedit_pageseg_mode: "4",
    preserve_interword_spaces: "1"
  });
  const ret = await worker.recognize(imagenOptimizada);
  const crudo = ret.data.text ? ret.data.text.trim() : "";
  await worker.terminate();
  return limpiarRuidoOCR(crudo);
}

export function sintetizarTextoAlgoritmico(textoOriginal, area = "General") {
  if (!textoOriginal || !textoOriginal.trim()) {
    return {
      resumen: `Registro de evento [${area}]: Sin notas adicionales.`,
      puntosClave: ["No se ingresaron notas textuales para analizar."],
      datosYMetricas: [],
      accionesSugeridas: ["Agregar notas o apuntes clave de la charla."]
    };
  }

  // Limpia marcadores markdown para puntuar oraciones con limpieza
  const textoLimpio = textoOriginal
    .replace(/\*\*|__|\*|_|>\s*💡\s*/g, "")
    .replace(/-\s*\[\s*[xX ]?\s*\]/g, "");

  const stopwords = new Set([
    "de", "la", "que", "el", "en", "y", "a", "los", "del", "se", "las", "por", "un", "para", "con", "no", "una",
    "su", "al", "lo", "como", "más", "pero", "sus", "le", "ya", "o", "este", "sí", "porque", "esta", "entre"
  ]);

  const oraciones = textoLimpio
    .split(/[\n.]+|\b(?=[A-Z][a-z])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 5);

  if (oraciones.length === 0) {
    return {
      resumen: textoLimpio.slice(0, 100) + "...",
      puntosClave: [textoLimpio],
      datosYMetricas: [],
      accionesSugeridas: []
    };
  }

  const palabras = textoLimpio.toLowerCase().match(/\b[a-záéíóúñ]{3,}\b/g) || [];
  const frecuencia = {};
  palabras.forEach((word) => {
    if (!stopwords.has(word)) frecuencia[word] = (frecuencia[word] || 0) + 1;
  });

  const oracionesPuntuadas = oraciones.map((oracion) => {
    const palabrasOracion = oracion.toLowerCase().match(/\b[a-záéíóúñ]{3,}\b/g) || [];
    let puntaje = 0;
    palabrasOracion.forEach((w) => {
      if (frecuencia[w]) puntaje += frecuencia[w];
    });
    return {
      texto: oracion,
      puntaje: palabrasOracion.length > 0 ? puntaje / palabrasOracion.length : 0
    };
  });

  oracionesPuntuadas.sort((a, b) => b.puntaje - a.puntaje);

  const patronAccion = /\b(hacer|contactar|revisar|llamar|pedir|enviar|comprar|implementar|cotizar|agendar|coordinar|validar|crear|desarrollar|evaluar|programar)\b/i;
  const patronCifras = /(\d+[\d.,]*%?|\$\d+[\d.,]*|\b(19|20)\d{2}\b)/i;

  const acciones = [];
  const datosMetricas = [];
  const conceptosLimpios = [];

  oraciones.forEach((oracion) => {
    if (patronAccion.test(oracion)) acciones.push(oracion);
    else if (patronCifras.test(oracion)) datosMetricas.push(oracion);
    else conceptosLimpios.push(oracion);
  });

  const mejorOracion = oracionesPuntuadas[0]?.texto || oraciones[0];
  const segundaMejor =
    oracionesPuntuadas[1]?.texto && oracionesPuntuadas[1].texto !== mejorOracion
      ? " " + oracionesPuntuadas[1].texto
      : "";

  return {
    resumen: `[SÍNTESIS ${area.toUpperCase()}]: ${mejorOracion}.${segundaMejor}`,
    puntosClave: conceptosLimpios.slice(0, 4),
    datosYMetricas: datosMetricas,
    accionesSugeridas: acciones.length > 0 ? acciones : ["Revisar seguimiento de los temas abordados."]
  };
}
