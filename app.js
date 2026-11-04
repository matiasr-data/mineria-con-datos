/* Minería con Datos: panel de Veladero y detalles de la página.
   Los datos vienen de datos/veladero.js, que genera herramientas/actualizar_web.py a partir del CSV. */
(function () {
  "use strict";

  /* Guía anual de Barrick para su parte (50%) de Veladero, en miles de onzas. */
  var GUIA = { anio: 2026, min: 180, max: 200 };
  /* Próximo informe trimestral de Barrick (anuncio del 9/10/2026). */
  var PROXIMO = { periodo: "2026-T3", fecha: new Date(2026, 10, 9), texto: "9 de noviembre de 2026" };

  var NS = "http://www.w3.org/2000/svg";
  var BASE = window.VELADERO || { filas: [], actualizado: "" };
  var D = BASE.filas.map(function (r) {
    var o = {}; for (var k in r) o[k] = r[k];
    o.q = "T" + r.trim + " " + String(r.anio).slice(2);
    o.full = "T" + r.trim + " " + r.anio;
    return o;
  });

  function el(n, a, p) { var e = document.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
  function txt(x, y, s, attrs, p) { var a = { x: x, y: y }; for (var k in attrs) a[k] = attrs[k]; var t = el("text", a, p); t.textContent = s; return t; }
  function f(n, d) { return n == null ? "s/d" : n.toLocaleString("es-AR", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }); }
  function pct(a, b) { return (a / b - 1) * 100; }
  function pf(x) { return (x > 0 ? "+" : "") + f(x, 1) + "%"; }
  function find(anio, trim) { for (var i = 0; i < D.length; i++) if (D[i].anio === anio && D[i].trim === trim) return D[i]; return null; }
  function prevOf(d) { return d.trim === 1 ? find(d.anio - 1, 4) : find(d.anio, d.trim - 1); }
  function niceMax(v) {
    var steps = [0.1, 0.2, 0.25, 0.5, 1, 2, 2.5, 5, 10, 20, 25, 40, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000];
    for (var i = 0; i < steps.length; i++) if (v / steps[i] <= 5) return { max: Math.ceil(v / steps[i]) * steps[i], step: steps[i] };
    return { max: v, step: v / 4 };
  }

  /* ---------- Tooltip ---------- */
  var tip = document.getElementById("tip");
  function showTip(html, x, y) {
    tip.innerHTML = html; tip.classList.add("on");
    var left = Math.max(8, Math.min(x + 14, document.documentElement.clientWidth - tip.offsetWidth - 8));
    tip.style.left = left + window.scrollX + "px";
    tip.style.top = y + 16 + window.scrollY + "px";
  }
  function hideTip() { tip.classList.remove("on"); }
  function bindTip(hit, html) {
    hit.addEventListener("mousemove", function (e) { showTip(html, e.clientX, e.clientY); });
    hit.addEventListener("mouseleave", hideTip);
    hit.addEventListener("focus", function () { var b = hit.getBoundingClientRect(); showTip(html, b.left + b.width / 2, b.top + 24); });
    hit.addEventListener("blur", hideTip);
  }

  /* ---------- Gráficos ---------- */
  var W = 520, H = 300;

  function frame(svg, lo, hi, step, L, fmtTick) {
    var T = 26, R = 12, B = 36, ih = H - T - B;
    function Y(v) { return T + ih - ((v - lo) / (hi - lo)) * ih; }
    for (var t = lo; t <= hi + 1e-9; t += step) {
      el("line", { x1: L, x2: W - R, y1: Y(t), y2: Y(t), "class": t === lo && lo === 0 ? "base" : "grid" }, svg);
      txt(L - 6, Y(t) + 4, fmtTick(t), { "text-anchor": "end" }, svg);
    }
    return { Y: Y, T: T, L: L, R: R, B: B, ih: ih, iw: W - L - R };
  }

  /* Cada gráfico se dibuja al ancho real que ocupa, así el texto no se achica en el celular. */
  function size(svg) {
    W = Math.max(300, Math.min(560, Math.round(svg.getBoundingClientRect().width) || 520));
    H = W < 420 ? 250 : 300;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  }

  function barChart(svg, key, opts) {
    svg.innerHTML = ""; size(svg);
    var vals = D.map(function (d) { return d[key]; }).filter(function (v) { return v != null; });
    var sc = niceMax(Math.max.apply(null, vals) * 1.08);
    var g = frame(svg, 0, sc.max, sc.step, opts.left || 44, function (t) { return f(t); });
    var bw = g.iw / D.length;
    D.forEach(function (d, i) {
      var cx = g.L + bw * i + bw / 2, w = Math.min(44, bw * 0.6), v = d[key];
      txt(cx, H - 12, d.q, { "text-anchor": "middle" }, svg);
      if (v == null) {
        txt(cx, g.Y(0) - 10, "sin dato", { "text-anchor": "middle" }, svg);
      } else {
        var y = g.Y(v), h = g.Y(0) - y, r = Math.min(4, h);
        /* Extremo redondeado de 4px arriba, base recta sobre el eje. */
        el("path", { d: "M" + (cx - w / 2) + " " + g.Y(0) + "V" + (y + r) + "Q" + (cx - w / 2) + " " + y + " " + (cx - w / 2 + r) + " " + y +
          "H" + (cx + w / 2 - r) + "Q" + (cx + w / 2) + " " + y + " " + (cx + w / 2) + " " + (y + r) + "V" + g.Y(0) + "Z",
          "class": "bar" + (d.pendiente ? " pending" : "") }, svg);
        txt(cx, y - 7, f(v, opts.dec), { "text-anchor": "middle", "class": "val" }, svg);
      }
      var hit = el("rect", { x: g.L + bw * i, y: g.T, width: bw, height: g.ih, "class": "hit", tabindex: 0, role: "img", "aria-label": d.full + ": " + f(v, opts.dec) + " " + opts.unit }, svg);
      el("rect", { x: g.L + bw * i + 2, y: g.T, width: bw - 4, height: g.ih, "class": "hover", rx: 4, "pointer-events": "none" }, svg);
      bindTip(hit, opts.tip(d, i));
    });
  }

  function lineChart(svg, key, opts) {
    svg.innerHTML = ""; size(svg);
    var vals = D.map(function (d) { return d[key]; }).filter(function (v) { return v != null; });
    var lo = opts.lo, top = niceMax((Math.max.apply(null, vals) - lo) * 1.12);
    var g = frame(svg, lo, lo + top.max, top.step, opts.left || 52, opts.tick);
    var step = g.iw / D.length;
    function X(i) { return g.L + step * i + step / 2; }
    var path = "", pen = false, maxI = -1;
    D.forEach(function (d, i) {
      var v = d[key];
      if (v == null) { pen = false; return; }
      path += (pen ? " L" : " M") + X(i) + " " + g.Y(v); pen = true;
      if (maxI < 0 || v > D[maxI][key]) maxI = i;
    });
    el("path", { d: path, "class": "line" }, svg);
    var firstI = -1, lastI = -1;
    D.forEach(function (d, i) { if (d[key] != null) { if (firstI < 0) firstI = i; lastI = i; } });
    D.forEach(function (d, i) {
      var v = d[key];
      txt(X(i), H - 12, d.q, { "text-anchor": "middle" }, svg);
      if (v == null) {
        txt(X(i), g.Y(lo) - 10, "sin dato", { "text-anchor": "middle" }, svg);
      } else {
        el("circle", { cx: X(i), cy: g.Y(v), r: 4.5, "class": "dot" + (d.pendiente ? " pending" : "") }, svg);
        if (i === firstI || i === lastI || i === maxI) txt(X(i), g.Y(v) - 12, opts.label(v), { "text-anchor": "middle", "class": "val" }, svg);
      }
      var hit = el("rect", { x: X(i) - step / 2, y: g.T, width: step, height: g.ih, "class": "hit", tabindex: 0, role: "img", "aria-label": d.full + ": " + opts.label(v) }, svg);
      el("rect", { x: X(i) - step / 2 + 2, y: g.T, width: step - 4, height: g.ih, "class": "hover", rx: 4, "pointer-events": "none" }, svg);
      bindTip(hit, opts.tip(d, i));
    });
  }

  function pend(d) { return d.pendiente ? "<br><i>Pendiente de confirmar con el PDF de Barrick</i>" : ""; }

  /* Producción con selector mina completa / parte de Barrick */
  var base = "p100";
  function drawProduction() {
    var full = base === "p100";
    document.getElementById("t-prod").textContent = full ? "Oro producido, mina completa (100%)" : "Oro producido, parte de Barrick (50%)";
    barChart(document.getElementById("svg-prod"), base, {
      unit: "mil onzas", left: 40,
      tip: function (d) {
        var h = "<b>" + d.full + "</b><br>";
        if (d.p100 == null) h += "Mina completa: sin dato en los informes revisados<br>";
        else h += "Mina completa: " + f(d.p100) + " mil oz<br>";
        h += "Parte de Barrick (50%): " + f(d.pat) + " mil oz";
        var p = prevOf(d), y = find(d.anio - 1, d.trim);
        if (p && p[base] != null && d[base] != null) h += "<br>" + pf(pct(d[base], p[base])) + " vs trimestre anterior";
        if (y && y[base] != null && d[base] != null) h += "<br>" + pf(pct(d[base], y[base])) + " vs " + y.full;
        return h + pend(d);
      }
    });
  }
  document.querySelectorAll("[data-base]").forEach(function (b) {
    b.addEventListener("click", function () {
      base = b.getAttribute("data-base");
      document.querySelectorAll("[data-base]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      drawProduction();
    });
  });

  function drawAll() {
    drawProduction();

    lineChart(document.getElementById("svg-aisc"), "aisc", {
      lo: 1000, left: 52,
      tick: function (t) { return f(t); },
      label: function (v) { return "US$" + f(v); },
      tip: function (d) {
        var p = prevOf(d);
        return "<b>" + d.full + "</b><br>AISC: US$" + f(d.aisc) + "/oz" +
          (p ? "<br>" + pf(pct(d.aisc, p.aisc)) + " vs trimestre anterior" : "") +
          "<br>Costo de ventas: US$" + f(d.cv) + "/oz<br>Costo de caja total: US$" + f(d.cct) + "/oz" + pend(d);
      }
    });

    barChart(document.getElementById("svg-ton"), "t", {
      unit: "mil toneladas", left: 48,
      tip: function (d) {
        return "<b>" + d.full + "</b><br>Mineral procesado: " + f(d.t) + " mil t" +
          (d.t == null ? "<br>Sin dato en los informes revisados" : "") + pend(d);
      }
    });

    lineChart(document.getElementById("svg-ley"), "ley", {
      lo: 0, left: 44,
      tick: function (t) { return f(t, 2); },
      label: function (v) { return f(v, 2) + " g/t"; },
      tip: function (d) {
        return "<b>" + d.full + "</b><br>Ley: " + f(d.ley, 2) + " gramos de oro por tonelada" +
          (d.ley == null ? "<br>Sin dato en los informes revisados" : "") + pend(d);
      }
    });
  }

  if (D.length) {
    drawAll();
    var lastW = innerWidth, rt;
    window.addEventListener("resize", function () {
      if (innerWidth === lastW) return; lastW = innerWidth;
      clearTimeout(rt); rt = setTimeout(drawAll, 150);
    });

    /* KPIs */
    var withFull = D.filter(function (d) { return d.p100 != null; });
    var last = withFull[withFull.length - 1], prev = prevOf(last), yoy = find(last.anio - 1, last.trim);
    var lastC = D[D.length - 1], prevC = prevOf(lastC);
    var ytd = D.filter(function (d) { return d.anio === GUIA.anio && d.pat != null; });
    var ytdSum = ytd.reduce(function (s, d) { return s + d.pat; }, 0);
    var kpis = [
      { l: "Oro producido " + last.full + ", mina completa", v: f(last.p100), u: " mil oz",
        c: prev && prev.p100 != null ? pf(pct(last.p100, prev.p100)) + " vs " + prev.full : "", bad: prev && last.p100 < prev.p100 },
      { l: "Contra el mismo trimestre del año anterior", v: yoy ? pf(pct(last.p100, yoy.p100)) : "s/d", u: "",
        c: yoy ? yoy.full + ": " + f(yoy.p100) + " mil oz" : "", bad: yoy && last.p100 < yoy.p100 },
      { l: "AISC " + lastC.full + " (costo total por onza)", v: "US$" + f(lastC.aisc), u: "",
        c: prevC ? pf(pct(lastC.aisc, prevC.aisc)) + " vs " + prevC.full : "", bad: prevC && lastC.aisc > prevC.aisc }
    ];
    var k = document.getElementById("kpis");
    kpis.forEach(function (it) {
      var d = document.createElement("div"); d.className = "kpi";
      d.innerHTML = '<div class="lbl">' + it.l + '</div><div class="val">' + it.v + "<small>" + it.u + '</small></div><div class="chg ' + (it.bad ? "down" : "up") + '">' + it.c + "</div>";
      k.appendChild(d);
    });
    if (ytd.length) {
      var d = document.createElement("div"); d.className = "kpi";
      d.innerHTML = '<div class="lbl">Parte de Barrick en ' + GUIA.anio + " contra su guía anual</div>" +
        '<div class="val">' + f(ytdSum) + "<small> de " + f(GUIA.min) + "–" + f(GUIA.max) + " mil oz</small></div>" +
        '<div class="meter" role="img" aria-label="' + f(ytdSum / GUIA.max * 100) + '% del techo de la guía"><i style="width:' + (ytdSum / GUIA.max * 100) + '%"></i><b style="left:' + (GUIA.min / GUIA.max * 100) + '%"></b></div>' +
        '<div class="chg">' + ytd.length + " de 4 trimestres cargados · la raya marca " + f(GUIA.min) + "</div>";
      k.appendChild(d);
    }

    /* Tabla */
    var t = document.getElementById("tbl");
    var h = "<thead><tr><th>Trimestre</th><th>Oro, mina completa (mil oz)</th><th>Oro, parte de Barrick (mil oz)</th><th>Mineral procesado (mil t)</th><th>Ley (g/t)</th><th>Costo de ventas (US$/oz)</th><th>Costo de caja total (US$/oz)</th><th>AISC (US$/oz)</th></tr></thead><tbody>";
    D.forEach(function (d) {
      function c(v, dd) { return v == null ? '<td class="na">s/d</td>' : "<td>" + f(v, dd) + "</td>"; }
      h += "<tr><td>" + d.full + (d.pendiente ? " *" : "") + "</td>" + c(d.p100) + c(d.pat) + c(d.t) + c(d.ley, 2) + c(d.cv) + c(d.cct) + c(d.aisc) + "</tr>";
    });
    t.innerHTML = h + "</tbody>";
  }

  /* Estado de error: sin datos */
  if (!D.length) {
    document.getElementById("panel-error").hidden = false;
    document.getElementById("panel-body").hidden = true;
  }

  /* Ficha de la portada: último dato cargado y la serie de producción */
  var snap = document.getElementById("snap-body");
  if (snap && D.length) {
    var lf = D.filter(function (d) { return d.p100 != null; }), ls = lf[lf.length - 1], lp = prevOf(ls);
    snap.innerHTML = '<div class="snap-q">Veladero · ' + ls.full + " · oro, mina completa</div>" +
      '<div class="snap-v">' + f(ls.p100) + "<small> mil onzas</small></div>" +
      (lp && lp.p100 != null ? '<div class="chg ' + (ls.p100 < lp.p100 ? "down" : "up") + '" style="font-family:var(--font-mono);font-size:12.5px">' + pf(pct(ls.p100, lp.p100)) + " vs " + lp.full + "</div>" : "") +
      '<svg viewBox="0 0 300 64" role="img" aria-label="Evolución de la producción trimestral"></svg>' +
      '<div class="snap-f">Fuente: Barrick, informes trimestrales · act. ' + (BASE.actualizado || "s/d") + "</div>";
    var sv = snap.querySelector("svg"), mx = Math.max.apply(null, lf.map(function (d) { return d.p100; }));
    var pts = D.map(function (d, i) { return d.p100 == null ? null : [8 + i * (284 / (D.length - 1)), 50 - (d.p100 / mx) * 40]; });
    var dpath = "", on = false;
    pts.forEach(function (p) { if (!p) { on = false; return; } dpath += (on ? " L" : " M") + p[0].toFixed(1) + " " + p[1].toFixed(1); on = true; });
    el("path", { d: dpath, "class": "sp-line" }, sv);
    pts.forEach(function (p, i) { if (p && (i === 0 || i === pts.length - 1)) el("circle", { cx: p[0], cy: p[1], r: 3.5, "class": "sp-dot" }, sv); });
    txt(8, 63, D[0].q, { "class": "sp-lbl" }, sv);
    txt(292, 63, D[D.length - 1].q, { "class": "sp-lbl", "text-anchor": "end" }, sv);
  }

  /* Entrada suave de bloques al hacer scroll */
  var rv = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var groups = new Map();
    rv.forEach(function (n) { var p = n.parentNode, c = groups.get(p) || 0; n.style.setProperty("--i", Math.min(c, 5)); groups.set(p, c + 1); });
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    rv.forEach(function (n) { ro.observe(n); });
  } else rv.forEach(function (n) { n.classList.add("in"); });

  /* Fecha de actualización y próximo informe */
  document.querySelectorAll("[data-actualizado]").forEach(function (e) { e.textContent = BASE.actualizado || "s/d"; });
  var nx = document.getElementById("proximo");
  if (nx && D.length) {
    var lastP = D[D.length - 1].periodo;
    if (lastP >= PROXIMO.periodo) nx.textContent = "";
    else if (new Date() >= PROXIMO.fecha) nx.textContent = "Barrick publicó el " + PROXIMO.periodo.replace("-", " ") + " el " + PROXIMO.texto + ". Falta cargarlo en el panel.";
    else nx.textContent = "Barrick publica el tercer trimestre de 2026 el " + PROXIMO.texto + ". Se agrega cuando salga.";
  }

  /* ---------- Decoración: curvas de nivel ---------- */
  var s = document.getElementById("contour");
  if (s) for (var i = 0; i < 11; i++) {
    var y = 40 + i * 34, p = "M0 " + y;
    for (var x = 0; x <= 680; x += 20) p += " L" + x + " " + (y + Math.sin(x / 70 + i * 0.7) * 16 + Math.sin(x / 31 + i) * 5).toFixed(1);
    el("path", { d: p, fill: "none", stroke: "var(--line)", "stroke-width": 1.2 }, s);
  }

  /* ---------- Navegación: marca la sección visible ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll("nav a"));
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + e.target.id ? "true" : "false"); });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    links.forEach(function (a) { var t = document.querySelector(a.getAttribute("href")); if (t) io.observe(t); });
  }

  /* ---------- Copiar correo ---------- */
  var btn = document.getElementById("copy"), mail = document.getElementById("mail");
  if (btn) btn.addEventListener("click", function () {
    function ok() { btn.textContent = "Copiado"; setTimeout(function () { btn.textContent = "Copiar correo"; }, 1800); }
    function sel() { var r = document.createRange(); r.selectNodeContents(mail); var w = window.getSelection(); w.removeAllRanges(); w.addRange(r); btn.textContent = "Seleccionado"; }
    try { navigator.clipboard.writeText(mail.textContent).then(ok, sel); } catch (e) { sel(); }
  });
})();
