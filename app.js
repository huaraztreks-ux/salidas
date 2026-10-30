/* =============================================================
   Salidas · Peruvian Andes Adventures
   App offline para guías, cocineros, choferes, asistentes y arrieros
   ============================================================= */
(() => {
  "use strict";

  // ---------- Constantes ----------
  const ROLES = {
    admin: "Administrador", guia: "Guía", cocinero: "Cocinero",
    chofer: "Chofer", asistente: "Asistente", arriero: "Arriero"
  };
  // Columna de la hoja "Salidas" donde se anota a cada rol
  const COLUMNA_ROL = {
    guia: "guia", cocinero: "cocinero", chofer: "chofer",
    asistente: "asistentes", arriero: "arrieros"
  };
  // Qué secciones ve cada rol en el detalle de una salida
  const SECCIONES_POR_ROL = {
    admin:     ["resumen", "traslados", "comida", "logistica", "equipo", "notas"],
    guia:      ["resumen", "traslados", "comida", "logistica", "equipo", "notas"],
    cocinero:  ["resumen", "comida", "equipo", "notas"],
    chofer:    ["resumen", "traslados", "equipo", "notas"],
    asistente: ["resumen", "traslados", "comida", "equipo", "notas"],
    arriero:   ["resumen", "traslados", "logistica", "equipo", "notas"]
  };
  const LS = { datos: "pa_datos", sync: "pa_ultima_sync", usuario: "pa_usuario" };
  const DIA_MS = 86400000;

  // ---------- Estado ----------
  const st = {
    salidas: [], trabajadores: [], usuario: null,
    verComo: "",           // admin: nombre del trabajador a ver ("" = todos)
    vista: "lista",
    mes: primerDiaMes(new Date()),
    diaSel: null
  };

  // ---------- Utilidades ----------
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const norm = (s) => String(s ?? "").trim().toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");
  const claveCol = (s) => norm(s).replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const listaNombres = (s) => String(s ?? "").split(/[;,\n]/).map((x) => x.trim()).filter(Boolean);

  function primerDiaMes(d) { return new Date(d.getFullYear(), d.getMonth(), 1); }
  function hoy() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function diasEntre(a, b) { return Math.round((b - a) / DIA_MS); }
  function mismoDia(a, b) { return a && b && a.getTime() === b.getTime(); }

  // Acepta 2026-11-05, 05/11/2026 y 5/11/26 (formato de Sheets en Perú)
  function parseFecha(s) {
    s = String(s ?? "").trim();
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})/);
    if (m) {
      let y = +m[3]; if (y < 100) y += 2000;
      return new Date(y, +m[2] - 1, +m[1]);
    }
    return null;
  }
  const fmtCorta = (d) => d.toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" });
  const fmtLarga = (d) => d.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Parser CSV que respeta comillas y saltos de línea dentro de celdas
  function parseCSV(texto) {
    const filas = []; let fila = [], celda = "", comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"') { if (texto[i + 1] === '"') { celda += '"'; i++; } else comillas = false; }
        else celda += c;
      } else if (c === '"') comillas = true;
      else if (c === ",") { fila.push(celda); celda = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(celda); filas.push(fila); fila = []; celda = "";
      } else celda += c;
    }
    if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
    const vacia = (f) => f.every((x) => x.trim() === "");
    const datos = filas.filter((f) => !vacia(f));
    if (!datos.length) return [];
    const cab = datos[0].map(claveCol);
    return datos.slice(1).map((f) => {
      const o = {}; cab.forEach((k, i) => { if (k) o[k] = (f[i] ?? "").trim(); }); return o;
    });
  }

  // Color estable por ruta
  function colorRuta(ruta) {
    const r = norm(ruta);
    if (r.includes("santa")) return "#2e8b57";
    if (r.includes("huayhuash")) return "#3b5bdb";
    const pal = ["#c2410c", "#7c3aed", "#0e7490", "#b45309", "#be185d"];
    let h = 0; for (const c of r) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return pal[h % pal.length];
  }

  function toast(msg) {
    if (!msg) return;
    const t = $("#toast"); t.textContent = msg; t.classList.add("visible");
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove("visible"), 2600);
  }

  // ---------- Datos ----------
  function prepararSalidas(filas) {
    return filas.map((r, i) => {
      const fs = parseFecha(r.fecha_salida);
      if (!fs) return null;
      let fl = parseFecha(r.fecha_llegada);
      const diasN = parseInt(r.dias, 10);
      if (!fl && diasN > 0) fl = new Date(fs.getTime() + (diasN - 1) * DIA_MS);
      if (!fl) fl = fs;
      const equipo = {};
      for (const rol in COLUMNA_ROL) equipo[rol] = listaNombres(r[COLUMNA_ROL[rol]]);
      return {
        ...r,
        id: r.id || "S" + (i + 1),
        fs, fl,
        diasTotal: diasN > 0 ? diasN : diasEntre(fs, fl) + 1,
        equipo
      };
    }).filter(Boolean).sort((a, b) => a.fs - b.fs);
  }

  function cargarLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS.datos) || "null");
      if (!raw) return false;
      st.trabajadores = (raw.trabajadores || []).filter((t) => t.nombre)
        .map((t) => ({ nombre: t.nombre.trim(), rol: norm(t.rol) || "guia", pin: String(t.pin ?? "").trim() }));
      st.salidas = prepararSalidas(raw.salidas || []);
      return true;
    } catch { return false; }
  }

  async function fetchTexto(url) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12000);
    try {
      const sep = url.includes("?") ? "&" : "?";
      const res = await fetch(url + sep + "t=" + Date.now(), { signal: ctrl.signal, cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return await res.text();
    } finally { clearTimeout(t); }
  }

  let sincronizando = false;
  async function sincronizar(manual) {
    if (sincronizando) return;
    sincronizando = true;
    $("#btn-sync")?.classList.add("girando");
    try {
      let salidas, trabajadores;
      if (CONFIG.URL_SALIDAS && CONFIG.URL_TRABAJADORES) {
        const [a, b] = await Promise.all([fetchTexto(CONFIG.URL_SALIDAS), fetchTexto(CONFIG.URL_TRABAJADORES)]);
        salidas = parseCSV(a); trabajadores = parseCSV(b);
        if (!trabajadores.length) throw new Error("Hoja de trabajadores vacía");
      } else {
        salidas = DATOS_EJEMPLO.salidas; trabajadores = DATOS_EJEMPLO.trabajadores;
      }
      localStorage.setItem(LS.datos, JSON.stringify({ salidas, trabajadores }));
      localStorage.setItem(LS.sync, String(Date.now()));
      cargarLocal();
      if (manual) toast("✓ Datos actualizados");
      return true;
    } catch (e) {
      if (manual) toast(navigator.onLine ? "No se pudo actualizar. Se muestra lo guardado." : "Sin señal: se muestra lo guardado");
      return false;
    } finally {
      sincronizando = false;
      $("#btn-sync")?.classList.remove("girando");
      render();
    }
  }

  function textoSync() {
    const t = +localStorage.getItem(LS.sync);
    if (!t) return { txt: "Nunca actualizado", viejo: true };
    const min = Math.round((Date.now() - t) / 60000);
    let hace;
    if (min < 1) hace = "hace un momento";
    else if (min < 60) hace = `hace ${min} min`;
    else if (min < 1440) hace = `hace ${Math.round(min / 60)} h`;
    else hace = `hace ${Math.round(min / 1440)} días`;
    const viejo = min > (CONFIG.HORAS_AVISO_DESACTUALIZADO || 24) * 60;
    return { txt: `Actualizado ${hace}`, viejo };
  }

  // ---------- Usuario y filtros ----------
  function rolEnSalida(s, nombre) {
    const n = norm(nombre);
    for (const rol in s.equipo) if (s.equipo[rol].some((x) => norm(x) === n)) return rol;
    return null;
  }

  // Devuelve [{salida, rol}] visibles para el usuario actual
  function salidasVisibles() {
    const u = st.usuario;
    if (!u) return [];
    if (u.rol === "admin" && !st.verComo) return st.salidas.map((s) => ({ s, rol: "admin" }));
    const nombre = u.rol === "admin" ? st.verComo : u.nombre;
    return st.salidas.map((s) => ({ s, rol: rolEnSalida(s, nombre) })).filter((x) => x.rol);
  }

  // ---------- Render general ----------
  function render() {
    const hayDatos = st.trabajadores.length > 0;
    if (!st.usuario) { mostrarLogin(hayDatos); return; }
    // Si el usuario ya no existe en la hoja, cerrar sesión
    const existe = st.trabajadores.find((t) => norm(t.nombre) === norm(st.usuario.nombre));
    if (hayDatos && !existe) { cerrarSesion(); return; }
    if (existe) st.usuario.rol = existe.rol;

    $("#login").classList.add("oculto");
    $("#app").classList.remove("oculto");
    $("#usuario-nombre").textContent = st.usuario.nombre;
    $("#usuario-rol").textContent = ROLES[st.usuario.rol] || st.usuario.rol;

    const sy = textoSync();
    const est = $("#estado-sync");
    est.textContent = (navigator.onLine ? "" : "● Sin señal · ") + sy.txt +
      (sy.viejo ? " · Conéctate y toca ↻ antes de salir" : "");
    est.className = "estado-sync" + (sy.viejo ? " viejo" : "") + (navigator.onLine ? "" : " offline");

    renderAdminBarra();
    document.querySelectorAll(".nav-inferior button").forEach((b) =>
      b.classList.toggle("activo", b.dataset.vista === st.vista));
    if (st.vista === "calendario") renderCalendario(); else renderLista();
  }

  function renderAdminBarra() {
    const barra = $("#admin-barra");
    if (st.usuario.rol !== "admin") { barra.classList.add("oculto"); return; }
    barra.classList.remove("oculto");
    const sel = $("#sel-ver-como");
    const opciones = ['<option value="">Todas las salidas</option>'];
    for (const rol of Object.keys(COLUMNA_ROL)) {
      const del = st.trabajadores.filter((t) => t.rol === rol);
      if (!del.length) continue;
      opciones.push(`<optgroup label="${esc(ROLES[rol])}">` +
        del.map((t) => `<option value="${esc(t.nombre)}">${esc(t.nombre)}</option>`).join("") + "</optgroup>");
    }
    sel.innerHTML = opciones.join("");
    sel.value = st.verComo;
    const lnk = $("#lnk-hoja");
    if (CONFIG.URL_HOJA_EDITAR) { lnk.href = CONFIG.URL_HOJA_EDITAR; lnk.classList.remove("oculto"); }
    else lnk.classList.add("oculto");
  }

  // ---------- Login ----------
  function mostrarLogin(hayDatos) {
    $("#app").classList.add("oculto");
    $("#detalle").classList.add("oculto");
    $("#login").classList.remove("oculto");
    $("#login-form").classList.toggle("oculto", !hayDatos);
    $("#login-sin-datos").classList.toggle("oculto", hayDatos);
    if (!hayDatos) return;
    llenarNombres();
  }

  // Llena "Nombre" solo con los trabajadores del puesto elegido
  function llenarNombres() {
    const rol = $("#sel-rol").value;
    const sel = $("#sel-trabajador");
    const previo = sel.value;
    const del = st.trabajadores.filter((t) => t.rol === rol);
    sel.disabled = !rol;
    sel.innerHTML = `<option value="">${rol ? "— Elige tu nombre —" : "— Primero elige tu puesto —"}</option>` +
      del.map((t) => `<option>${esc(t.nombre)}</option>`).join("");
    sel.value = del.some((t) => t.nombre === previo) ? previo : "";
  }

  function entrar() {
    const rol = $("#sel-rol").value;
    const nombre = $("#sel-trabajador").value;
    const pin = $("#inp-pin").value.trim();
    const t = st.trabajadores.find((x) => x.nombre === nombre && x.rol === rol);
    const err = $("#login-error");
    if (!rol) { err.textContent = "Selecciona tu puesto."; return; }
    if (!t) { err.textContent = "Elige tu nombre."; return; }
    if (t.pin && t.pin !== pin) { err.textContent = "Contraseña incorrecta."; return; }
    err.textContent = "";
    st.usuario = { nombre: t.nombre, rol: t.rol };
    localStorage.setItem(LS.usuario, JSON.stringify(st.usuario));
    $("#inp-pin").value = "";
    st.vista = "lista"; st.verComo = "";
    render();
  }

  function cerrarSesion() {
    st.usuario = null; st.verComo = "";
    localStorage.removeItem(LS.usuario);
    $("#menu").classList.add("oculto");
    render();
  }

  // ---------- Vista lista ----------
  function textoEstado(s, rol) {
    const h = hoy();
    if (h >= s.fs && h <= s.fl) return { txt: `En curso · día ${diasEntre(s.fs, h) + 1} de ${s.diasTotal}`, cls: "encurso" };
    if (h < s.fs) {
      const n = diasEntre(h, s.fs);
      return { txt: n === 1 ? "Sale mañana" : `Sale en ${n} días`, cls: n <= 2 ? "pronto" : "" };
    }
    return { txt: "Terminada", cls: "pasada" };
  }

  function tarjeta({ s, rol }) {
    const e = textoEstado(s, rol);
    const esChofer = rol === "chofer";
    const color = colorRuta(s.ruta);
    const lineaChofer = esChofer ? `
      <div class="t-chofer">
        <div>🚐 <b>Ida:</b> ${esc(fmtCorta(s.fs))}${s.hora_recojo ? " · " + esc(s.hora_recojo) : ""}${s.punto_inicio ? " → " + esc(s.punto_inicio) : ""}</div>
        <div>🏁 <b>Recojo:</b> ${esc(fmtCorta(s.fl))}${s.punto_final ? " · " + esc(s.punto_final) : ""}${s.hora_retorno ? " · " + esc(s.hora_retorno) : ""}</div>
      </div>` : "";
    return `
      <button class="tarjeta ${e.cls}" data-id="${esc(s.id)}" data-rol="${esc(rol)}" style="--c:${color}">
        <div class="t-top">
          <span class="chip" style="background:${color}">${esc(s.ruta)} · ${s.diasTotal}D</span>
          <span class="t-estado">${esc(e.txt)}</span>
        </div>
        <div class="t-grupo">${esc(s.grupo || "Sin nombre de grupo")}</div>
        <div class="t-fechas">${esc(fmtCorta(s.fs))} → ${esc(fmtCorta(s.fl))}</div>
        <div class="t-meta">
          ${s.pax ? `<span>👥 ${esc(s.pax)} pax</span>` : ""}
          ${s.tipo_grupo ? `<span>${esc(s.tipo_grupo)}</span>` : ""}
          ${st.usuario.rol === "admin" && !st.verComo ? "" : `<span class="rol-badge">${esc(ROLES[rol] || rol)}</span>`}
        </div>
        ${lineaChofer}
      </button>`;
  }

  function renderLista() {
    const vis = salidasVisibles();
    const h = hoy();
    const enCurso = vis.filter(({ s }) => h >= s.fs && h <= s.fl);
    const proximas = vis.filter(({ s }) => s.fs > h);
    const pasadas = vis.filter(({ s }) => s.fl < h).reverse().slice(0, 15);

    // Resumen del mes para el trabajador
    const finMes = new Date(h.getFullYear(), h.getMonth() + 1, 0);
    let diasMes = 0;
    for (const { s } of vis) {
      const a = s.fs > primerDiaMes(h) ? s.fs : primerDiaMes(h);
      const b = s.fl < finMes ? s.fl : finMes;
      if (b >= a) diasMes += diasEntre(a, b) + 1;
    }
    const nombreMes = h.toLocaleDateString("es-PE", { month: "long" });

    let html = `
      <div class="resumen">
        <div><b>${proximas.length}</b><span>próximas</span></div>
        <div><b>${enCurso.length}</b><span>en curso</span></div>
        <div><b>${diasMes}</b><span>días en ${esc(nombreMes)}</span></div>
      </div>`;
    if (!vis.length) html += `<p class="vacio">No tienes salidas asignadas por ahora.</p>`;
    if (enCurso.length) html += `<h2>En curso</h2>` + enCurso.map(tarjeta).join("");
    if (proximas.length) html += `<h2>Próximas</h2>` + proximas.map(tarjeta).join("");
    if (pasadas.length) html += `<details class="pasadas"><summary>Anteriores (${pasadas.length})</summary>${pasadas.map(tarjeta).join("")}</details>`;
    $("#contenido").innerHTML = html;
  }

  // ---------- Vista calendario ----------
  function salidasDelDia(dia, vis) {
    return vis.filter(({ s, rol }) => {
      if (rol === "chofer") return mismoDia(dia, s.fs) || mismoDia(dia, s.fl);
      return dia >= s.fs && dia <= s.fl;
    });
  }

  function etiquetaDia(dia, s, rol) {
    if (mismoDia(dia, s.fs) && mismoDia(dia, s.fl)) return "Salida y llegada";
    if (mismoDia(dia, s.fs)) return rol === "chofer" ? "Llevar al inicio" : "Día de salida";
    if (mismoDia(dia, s.fl)) return rol === "chofer" ? "Recoger al final" : "Día de llegada";
    return `Día ${diasEntre(s.fs, dia) + 1} de ${s.diasTotal}`;
  }

  function renderCalendario() {
    const vis = salidasVisibles();
    const m = st.mes;
    const anio = m.getFullYear(), mes = m.getMonth();
    const diasEnMes = new Date(anio, mes + 1, 0).getDate();
    const offset = (new Date(anio, mes, 1).getDay() + 6) % 7; // semana empieza lunes
    const h = hoy();
    const titulo = m.toLocaleDateString("es-PE", { month: "long", year: "numeric" });

    let celdas = "";
    for (let i = 0; i < offset; i++) celdas += `<div class="dia vacio-dia"></div>`;
    for (let d = 1; d <= diasEnMes; d++) {
      const dia = new Date(anio, mes, d);
      const del = salidasDelDia(dia, vis);
      const barras = del.slice(0, 3).map(({ s }) => {
        const ini = mismoDia(dia, s.fs), fin = mismoDia(dia, s.fl);
        return `<i class="barra${ini ? " ini" : ""}${fin ? " fin" : ""}" style="background:${colorRuta(s.ruta)}"></i>`;
      }).join("") + (del.length > 3 ? `<em>+${del.length - 3}</em>` : "");
      const cls = ["dia", mismoDia(dia, h) ? "hoy" : "", mismoDia(dia, st.diaSel) ? "sel" : "", del.length ? "ocupado" : ""].join(" ");
      celdas += `<button class="${cls}" data-dia="${d}"><span class="num">${d}</span><span class="barras">${barras}</span></button>`;
    }

    let detalleDia = "";
    if (st.diaSel && st.diaSel.getMonth() === mes && st.diaSel.getFullYear() === anio) {
      const del = salidasDelDia(st.diaSel, vis);
      detalleDia = `<h2>${esc(fmtLarga(st.diaSel))}</h2>` + (del.length
        ? del.map(({ s, rol }) => `
          <button class="item-dia" data-id="${esc(s.id)}" data-rol="${esc(rol)}" style="--c:${colorRuta(s.ruta)}">
            <b>${esc(s.ruta)} ${s.diasTotal}D · ${esc(s.grupo || "")}</b>
            <span>${esc(etiquetaDia(st.diaSel, s, rol))}</span>
          </button>`).join("")
        : `<p class="vacio">Día libre 🙂</p>`);
    } else {
      detalleDia = `<p class="ayuda">Toca un día para ver qué salidas tienes.</p>`;
    }

    $("#contenido").innerHTML = `
      <div class="cal">
        <div class="cal-cab">
          <button class="btn-icono oscuro" data-mes="-1" aria-label="Mes anterior">‹</button>
          <h2>${esc(titulo)}</h2>
          <button class="btn-icono oscuro" data-mes="1" aria-label="Mes siguiente">›</button>
        </div>
        <div class="cal-sem"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>
        <div class="cal-grid">${celdas}</div>
        <div class="leyenda">
          <span><i style="background:${colorRuta("Santa Cruz")}"></i>Santa Cruz</span>
          <span><i style="background:${colorRuta("Huayhuash")}"></i>Huayhuash</span>
        </div>
      </div>
      <div class="cal-detalle">${detalleDia}</div>`;
  }

  // ---------- Detalle de salida ----------
  function campo(etq, val) {
    if (!val) return "";
    return `<div class="campo"><span>${esc(etq)}</span><b>${esc(val)}</b></div>`;
  }

  function abrirDetalle(id, rol) {
    const s = st.salidas.find((x) => x.id === id);
    if (!s) return;
    const secc = SECCIONES_POR_ROL[rol] || SECCIONES_POR_ROL.guia;
    const e = textoEstado(s, rol);
    const bloques = {
      resumen: `
        <section class="bloque">
          <h3>Resumen</h3>
          ${campo("Ruta", `${s.ruta} · ${s.diasTotal} días`)}
          ${campo("Salida", fmtLarga(s.fs))}
          ${campo("Llegada", fmtLarga(s.fl))}
          ${campo("Grupo", s.grupo)}
          ${campo("Tipo de clientes", s.tipo_grupo)}
          ${campo("Pasajeros", s.pax)}
          ${campo("Idioma", s.idioma)}
          ${campo("Código", s.id)}
        </section>`,
      traslados: `
        <section class="bloque">
          <h3>🚐 Traslados</h3>
          ${campo("Recojo en", s.hotel_recojo)}
          ${campo("Hora de recojo", s.hora_recojo)}
          ${campo("Inicio del trek", s.punto_inicio)}
          ${campo("Fin del trek", s.punto_final)}
          ${campo("Hora de recojo al final", s.hora_retorno)}
        </section>`,
      comida: `
        <section class="bloque comida">
          <h3>🍲 Comida</h3>
          ${campo("Lo que más les gusta", s.comida_gusta)}
          ${campo("Lo que NO les gusta", s.comida_no_gusta)}
          ${s.restricciones ? `<div class="alerta">⚠ ${esc(s.restricciones)}</div>` : ""}
          ${!s.comida_gusta && !s.comida_no_gusta && !s.restricciones ? '<p class="vacio">Sin indicaciones especiales.</p>' : ""}
        </section>`,
      logistica: `
        <section class="bloque">
          <h3>🐴 Logística</h3>
          ${campo("Burros / caballos", s.burros)}
        </section>`,
      equipo: `
        <section class="bloque">
          <h3>Equipo de esta salida</h3>
          ${Object.keys(COLUMNA_ROL).map((r) => campo(ROLES[r], s.equipo[r].join(", "))).join("")}
        </section>`,
      notas: s.notas ? `<section class="bloque"><h3>📝 Notas</h3><p>${esc(s.notas)}</p></section>` : ""
    };

    $("#detalle-titulo").innerHTML = `${esc(s.ruta)} ${s.diasTotal}D<small>${esc(e.txt)}</small>`;
    $("#detalle-contenido").innerHTML =
      `<div class="det-cab" style="--c:${colorRuta(s.ruta)}">
         <div class="det-grupo">${esc(s.grupo || "")}</div>
         <div>${esc(fmtCorta(s.fs))} → ${esc(fmtCorta(s.fl))}</div>
         ${rol !== "admin" ? `<div class="rol-badge claro">Vas como: ${esc(ROLES[rol])}</div>` : ""}
       </div>` +
      secc.map((k) => bloques[k]).join("");
    $("#detalle").classList.remove("oculto");
    $("#detalle-contenido").scrollTop = 0;
    history.pushState({ detalle: true }, "");
  }

  function cerrarDetalle() { $("#detalle").classList.add("oculto"); }

  // ---------- Eventos ----------
  function eventos() {
    $("#sel-rol").addEventListener("change", () => { $("#login-error").textContent = ""; llenarNombres(); });
    $("#btn-entrar").addEventListener("click", entrar);
    $("#inp-pin").addEventListener("keydown", (e) => { if (e.key === "Enter") entrar(); });
    $("#btn-reintentar").addEventListener("click", () => sincronizar(true));
    $("#btn-sync").addEventListener("click", () => sincronizar(true));
    $("#btn-menu").addEventListener("click", () => $("#menu").classList.remove("oculto"));
    $("#btn-cerrar-menu").addEventListener("click", () => $("#menu").classList.add("oculto"));
    $("#btn-salir").addEventListener("click", cerrarSesion);
    $("#btn-volver").addEventListener("click", () => history.back());
    window.addEventListener("popstate", cerrarDetalle);
    $("#sel-ver-como").addEventListener("change", (e) => { st.verComo = e.target.value; render(); });

    document.querySelector(".nav-inferior").addEventListener("click", (e) => {
      const b = e.target.closest("button[data-vista]");
      if (!b) return;
      st.vista = b.dataset.vista;
      if (st.vista === "calendario" && !st.diaSel) st.diaSel = hoy();
      render();
      window.scrollTo(0, 0);
    });

    $("#contenido").addEventListener("click", (e) => {
      const t = e.target.closest("[data-id]");
      if (t) { abrirDetalle(t.dataset.id, t.dataset.rol); return; }
      const m = e.target.closest("[data-mes]");
      if (m) { st.mes = new Date(st.mes.getFullYear(), st.mes.getMonth() + +m.dataset.mes, 1); render(); return; }
      const d = e.target.closest("[data-dia]");
      if (d) { st.diaSel = new Date(st.mes.getFullYear(), st.mes.getMonth(), +d.dataset.dia); render(); }
    });

    window.addEventListener("online", () => { render(); sincronizar(false); });
    window.addEventListener("offline", render);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && navigator.onLine) sincronizar(false);
    });
  }

  // ---------- Inicio ----------
  function iniciar() {
    try { st.usuario = JSON.parse(localStorage.getItem(LS.usuario) || "null"); } catch { st.usuario = null; }
    cargarLocal();
    eventos();
    render();
    sincronizar(false); // intenta actualizar en segundo plano

    // Service Worker (modo offline). En el APK (Capacitor) no hace falta.
    if ("serviceWorker" in navigator && !window.Capacitor && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    }
  }

  iniciar();
})();
