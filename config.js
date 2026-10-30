// =============================================================
//  CONFIGURACIÓN  —  lo único que tienes que editar
// =============================================================
// 1. En Google Sheets: Archivo > Compartir > Publicar en la web
// 2. Elige la pestaña "Salidas", formato "Valores separados por comas (.csv)"
//    y copia el enlace aquí. Haz lo mismo con la pestaña "Trabajadores".
// 3. Si dejas los enlaces vacíos, la app usa los DATOS DE EJEMPLO.

const CONFIG = {
  URL_SALIDAS: "",        // ej: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv"
  URL_TRABAJADORES: "",   // ej: "https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=123456&single=true&output=csv"

  // Enlace normal de tu hoja (para editar). Solo lo ve el administrador.
  URL_HOJA_EDITAR: "",

  // Cada cuánto avisar que los datos están "viejos" (en horas)
  HORAS_AVISO_DESACTUALIZADO: 24
};
