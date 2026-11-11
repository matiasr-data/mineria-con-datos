/* Minería con Datos: panel de Veladero y detalles de la página.
   Los datos vienen de datos/veladero.js, que genera herramientas/actualizar_web.py a partir del CSV. */
(function () {
  "use strict";

  /* Guía anual de Barrick para su parte (50%) de Veladero, en miles de onzas. */
  var GUIA = { anio: 2026, min: 180, max: 200 };
  /* Próximo informe trimestral de Barrick. Cuando Barrick anuncie la fecha, completar fecha y texto
     (por ejemplo: fecha: new Date(2027, 1, 5), texto: "5 de febrero de 2027"). */
  var PROXIMO = { periodo: "2026-T4", nombre: "cuarto trimestre de 2026", fecha: null, texto: "" };

  var NS = "http://www.w3.org/2000/svg";
  var NB = " "; /* espacio que no se corta entre número y unidad */
  var REDUCE = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
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

  /* ---------- Movimiento ----------
     Cada gráfico se arma una sola vez, en orden cronológico, cuando se ve el 35% de él.
     Después sigue en bucle sin tapar ninguna cifra: una ola de luz en las barras, un pulso que
     recorre las líneas y un reflejo en la barra de la guía. El bucle se frena con el botón de
     pausa, cuando el gráfico sale de pantalla y cuando la pestaña queda en segundo plano.
     Con movimiento reducido todo queda armado y quieto. */
  var E_OUT = "cubic-bezier(.16,1,.3,1)";
  var PAUSA = "mcd-pausa";
  /* Ya no hay botón de pausa: el movimiento se frena solo con movimiento reducido, fuera de pantalla
     o con la pestaña oculta. Se borra la pausa que haya quedado guardada de cuando existía el botón. */
  var paused = false;
  try { localStorage.removeItem(PAUSA); } catch (e) { /* sin almacenamiento: no hay nada que borrar */ }
  var HAS_IO = "IntersectionObserver" in window;
  var armed = [];
  function still() { return REDUCE.matches || !Element.prototype.animate; }
  function bez(x1, y1, x2, y2) {
    function B(a, b, t) { return 3 * a * t * (1 - t) * (1 - t) + 3 * b * t * t * (1 - t) + t * t * t; }
    return function (x) {
      if (x <= 0) return 0; if (x >= 1) return 1;
      var lo = 0, hi = 1, t = x;
      for (var i = 0; i < 24; i++) { t = (lo + hi) / 2; if (B(x1, x2, t) < x) lo = t; else hi = t; }
      return B(y1, y2, t);
    };
  }
  var easeOut = bez(0.16, 1, 0.3, 1);
  function live(m) { return !paused && !still() && !document.hidden && m.visible; }
  function sync(m) { m.loops.forEach(function (a) { if (live(m)) a.play(); else a.pause(); }); }
  function clearLoops(m) { clearTimeout(m.t); m.loops.forEach(function (a) { a.cancel(); }); m.loops = []; }
  function addLoop(m, node, frames, opts) {
    opts.iterations = Infinity;
    var a = node.animate(frames, opts); m.loops.push(a);
    if (!live(m)) a.pause();
  }
  var io2 = HAS_IO ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var m = e.target._m; if (!m) return;
      m.visible = e.isIntersecting;
      if (!m.built && e.intersectionRatio >= 0.35) {
        m.built = true;
        var dur = m.build() || 0;
        m.t = setTimeout(function () { m.loop(); }, dur + 50);
      }
      sync(m);
    });
  }, { threshold: [0, 0.35] }) : null;
  /* Se llama después de cada dibujo. m.pre deja el gráfico en su estado inicial, m.build lo arma
     (devuelve cuánto tarda) y m.loop arranca el bucle. */
  function arm(target, hooks) {
    var m = target._m;
    if (!m) { m = target._m = { visible: !HAS_IO, built: false, loops: [], t: 0 }; armed.push(m); }
    clearLoops(m);
    m.build = hooks.build; m.loop = hooks.loop;
    if (still()) { m.built = true; return; }
    if (!HAS_IO) { m.built = true; m.loop(); return; }
    if (!m.built) hooks.pre(); else m.loop();
    if (!m.obs) { m.obs = true; io2.observe(target); }
  }
  function syncAll() { armed.forEach(sync); }
  document.addEventListener("visibilitychange", syncAll);

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
    var oldMax = svg._max || sc.max; svg._max = sc.max;
    var g = frame(svg, 0, sc.max, sc.step, opts.left || 44, function (t) { return f(t); });
    var bw = g.iw / D.length, pairs = [];
    D.forEach(function (d, i) {
      var cx = g.L + bw * i + bw / 2, w = Math.min(44, bw * 0.6), v = d[key];
      /* Línea vertical de la grilla, una por trimestre, detrás de la barra. */
      el("line", { x1: cx, x2: cx, y1: g.T, y2: g.Y(0), "class": "vgrid" }, svg);
      txt(cx, H - 12, d.q, { "text-anchor": "middle" }, svg);
      if (v == null) {
        txt(cx, g.Y(0) - 10, "sin dato", { "text-anchor": "middle" }, svg);
      } else {
        var y = g.Y(v), h = g.Y(0) - y, r = Math.min(4, h);
        /* Extremo redondeado de 4px arriba, base recta sobre el eje. */
        var shape = "M" + (cx - w / 2) + " " + g.Y(0) + "V" + (y + r) + "Q" + (cx - w / 2) + " " + y + " " + (cx - w / 2 + r) + " " + y +
          "H" + (cx + w / 2 - r) + "Q" + (cx + w / 2) + " " + y + " " + (cx + w / 2) + " " + (y + r) + "V" + g.Y(0) + "Z";
        var bar = el("path", { d: shape, "class": "bar" + (d.pendiente ? " pending" : "") }, svg);
        /* Capa de la ola: misma forma, color del fondo, invisible hasta que pasa la ola. */
        var wave = el("path", { d: shape, "class": "wave" }, svg);
        var lab = txt(cx, y - 7, f(v, opts.dec), { "text-anchor": "middle", "class": "val" }, svg);
        pairs.push({ bar: bar, lab: lab, wave: wave, slot: i });
        /* Proporción entre la altura en pantalla de antes (con la escala vieja) y la de ahora. */
        if (opts.from) morphBar(bar, lab, opts.from[i] == null ? 0 : (opts.from[i] / oldMax) / (v / sc.max));
      }
      var hit = el("rect", { x: g.L + bw * i, y: g.T, width: bw, height: g.ih, "class": "hit", tabindex: 0, role: "img", "aria-label": d.full + ": " + f(v, opts.dec) + " " + opts.unit }, svg);
      el("rect", { x: g.L + bw * i + 2, y: g.T, width: bw - 4, height: g.ih, "class": "hover", rx: 4, "pointer-events": "none" }, svg);
      bindTip(hit, opts.tip(d, i));
    });
    /* Si viene de un cambio de base, el gráfico ya está a la vista: no se vuelve a armar. */
    if (opts.from && svg._m) svg._m.built = true;
    arm(svg, {
      pre: function () { pairs.forEach(function (p) { p.bar.style.transform = "scaleY(0)"; p.lab.style.opacity = "0"; }); },
      /* Barras: suben desde la base trimestre por trimestre (520 ms, 70 ms entre una y otra); la cifra aparece al terminar. */
      build: function () {
        pairs.forEach(function (p, j) {
          p.bar.style.transform = ""; p.lab.style.opacity = "";
          p.bar.animate([{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }], { duration: 520, delay: j * 70, easing: E_OUT, fill: "backwards" });
          p.lab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, delay: j * 70 + 520, easing: "ease-out", fill: "backwards" });
        });
        return (pairs.length - 1) * 70 + 720;
      },
      /* Bucle: una ola de luz pasa por las barras en orden de trimestre, cada 3 s.
         La ola oscurece el violeta (es tinta al 35%), así que la barra nunca pierde contraste contra el fondo. */
      loop: function () {
        pairs.forEach(function (p) {
          addLoop(svg._m, p.wave, [{ opacity: 0, offset: 0 }, { opacity: 0.35, offset: 0.1 }, { opacity: 0, offset: 0.28 }, { opacity: 0, offset: 1 }],
            { duration: 3000, delay: p.slot * 150, easing: "ease-in-out" });
        });
      }
    });
  }

  /* Al cambiar de base, cada barra crece o se achica desde su altura anterior.
     Con movimiento reducido no hay desplazamiento: solo un fundido corto. */
  function morphBar(bar, lab, ratio) {
    if (!bar.animate) return;
    if (REDUCE.matches) {
      bar.animate([{ opacity: 0.35 }, { opacity: 1 }], { duration: 150, easing: "ease-out" });
      return;
    }
    bar.animate([{ transform: "scaleY(" + Math.max(ratio, 0.001) + ")" }, { transform: "scaleY(1)" }], { duration: 520, easing: "cubic-bezier(.16,1,.3,1)" });
    lab.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, delay: 260, easing: "ease-out", fill: "backwards" });
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
    /* La línea, sus puntos y sus cifras van dentro de una máscara que se abre de izquierda a derecha. */
    var cid = "clip-" + svg.id;
    var mask = el("rect", { x: g.L - 4, y: 0, width: g.iw + 8, height: H, "class": "reveal" }, el("clipPath", { id: cid }, el("defs", {}, svg)));
    var plot = el("g", { "clip-path": "url(#" + cid + ")" }, svg);
    el("path", { d: path, "class": "line" }, plot);
    var glint = el("path", { d: path, "class": "glint", pathLength: 1 }, plot);
    var firstI = -1, lastI = -1;
    D.forEach(function (d, i) { if (d[key] != null) { if (firstI < 0) firstI = i; lastI = i; } });
    D.forEach(function (d, i) {
      var v = d[key];
      /* Línea vertical de la grilla, detrás de la línea de datos. */
      svg.insertBefore(el("line", { x1: X(i), x2: X(i), y1: g.T, y2: g.Y(lo), "class": "vgrid" }), plot);
      txt(X(i), H - 12, d.q, { "text-anchor": "middle" }, svg);
      if (v == null) {
        txt(X(i), g.Y(lo) - 10, "sin dato", { "text-anchor": "middle" }, svg);
      } else {
        el("circle", { cx: X(i), cy: g.Y(v), r: 4.5, "class": "dot" + (d.pendiente ? " pending" : "") }, plot);
        if (i === firstI || i === lastI || i === maxI) txt(X(i), g.Y(v) - 12, opts.label(v), { "text-anchor": "middle", "class": "val" }, plot);
      }
      var hit = el("rect", { x: X(i) - step / 2, y: g.T, width: step, height: g.ih, "class": "hit", tabindex: 0, role: "img", "aria-label": d.full + ": " + opts.label(v) }, svg);
      el("rect", { x: X(i) - step / 2 + 2, y: g.T, width: step - 4, height: g.ih, "class": "hover", rx: 4, "pointer-events": "none" }, svg);
      bindTip(hit, opts.tip(d, i));
    });
    arm(svg, {
      pre: function () { mask.style.transform = "scaleX(0)"; },
      /* Línea: se revela de izquierda a derecha en 900 ms, a velocidad constante porque el eje es el tiempo. */
      build: function () {
        mask.style.transform = "";
        mask.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 900, easing: "linear", fill: "backwards" });
        return 900;
      },
      /* Bucle: un pulso recorre la línea en el sentido del tiempo, cada 3 s. */
      loop: function () {
        addLoop(svg._m, glint, [{ strokeDasharray: "0.07 1.2", strokeDashoffset: 0.07 }, { strokeDasharray: "0.07 1.2", strokeDashoffset: -1 }],
          { duration: 3000, easing: "linear" });
      }
    });
  }

  function pend(d) { return d.pendiente ? "<br><i>Pendiente de confirmar con el PDF de Barrick</i>" : ""; }

  /* Producción con selector mina completa / parte de Barrick */
  /* La base elegida queda en la dirección (?base=barrick), así se puede compartir el gráfico tal como se ve. */
  var base = new URLSearchParams(location.search).get("base") === "barrick" ? "pat" : "p100";
  function syncButtons() {
    document.querySelectorAll("[data-base]").forEach(function (o) { o.setAttribute("aria-pressed", o.getAttribute("data-base") === base ? "true" : "false"); });
  }
  function drawProduction(from) {
    var full = base === "p100";
    document.getElementById("t-prod").textContent = full ? "Oro producido, mina completa (100%)" : "Oro producido, parte de Barrick (50%)";
    barChart(document.getElementById("svg-prod"), base, {
      unit: "mil onzas", left: 40, from: from,
      tip: function (d) {
        var h = "<b>" + d.full + "</b><br>";
        if (d.p100 == null) h += "Mina completa: sin dato en los informes revisados<br>";
        else h += "Mina completa: " + f(d.p100) + NB + "mil oz<br>";
        h += "Parte de Barrick (50%): " + f(d.pat) + NB + "mil oz";
        var p = prevOf(d), y = find(d.anio - 1, d.trim);
        if (p && p[base] != null && d[base] != null) h += "<br>" + pf(pct(d[base], p[base])) + " vs trimestre anterior";
        if (y && y[base] != null && d[base] != null) h += "<br>" + pf(pct(d[base], y[base])) + " vs " + y.full;
        return h + pend(d);
      }
    });
  }
  syncButtons();
  document.querySelectorAll("[data-base]").forEach(function (b) {
    b.addEventListener("click", function () {
      var next = b.getAttribute("data-base");
      if (next === base) return;
      var old = base; base = next;
      syncButtons();
      drawProduction(D.map(function (d) { return d[old]; }));
      var u = new URL(location.href);
      if (base === "pat") u.searchParams.set("base", "barrick"); else u.searchParams.delete("base");
      history.replaceState(null, "", u.pathname + u.search + u.hash);
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
        return "<b>" + d.full + "</b><br>Mineral procesado: " + f(d.t) + NB + "mil t" +
          (d.t == null ? "<br>Sin dato en los informes revisados" : "") + pend(d);
      }
    });

    lineChart(document.getElementById("svg-ley"), "ley", {
      lo: 0, left: 44,
      tick: function (t) { return f(t, 2); },
      label: function (v) { return f(v, 2) + NB + "g/t"; },
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
      { l: "Oro producido " + last.full + ", mina completa", v: '<span class="cnt" data-to="' + last.p100 + '">' + f(last.p100) + "</span>", u: NB + "mil oz",
        c: prev && prev.p100 != null ? pf(pct(last.p100, prev.p100)) + " vs " + prev.full : "", bad: prev && last.p100 < prev.p100 },
      { l: "Contra el mismo trimestre del año anterior", v: yoy ? pf(pct(last.p100, yoy.p100)) : "s/d", u: "",
        c: yoy ? yoy.full + ": " + f(yoy.p100) + NB + "mil oz" : "", bad: yoy && last.p100 < yoy.p100 },
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
        '<div class="val"><span class="cnt" data-to="' + ytdSum + '">' + f(ytdSum) + "</span><small>" + NB + "de " + f(GUIA.min) + "–" + f(GUIA.max) + NB + "mil oz</small></div>" +
        '<div class="meter" role="img" aria-label="' + f(ytdSum) + " de " + f(GUIA.min) + " a " + f(GUIA.max) + ' mil onzas de la guía anual"><i style="width:' + (ytdSum / GUIA.max * 100) + '%"><s></s></i><b style="left:' + (GUIA.min / GUIA.max * 100) + '%"></b></div>' +
        '<div class="chg">' + ytd.length + " de 4 trimestres cargados. La raya marca el piso de " + f(GUIA.min) + ".</div>";
      k.appendChild(d);
    }
    /* Las dos cifras de volumen cuentan hasta su valor y la guía se llena (800 ms); después un reflejo la recorre cada 2,8 s. */
    var cnts = Array.prototype.slice.call(k.querySelectorAll(".cnt"));
    var meterI = k.querySelector(".meter i"), sheen = k.querySelector(".meter s");
    arm(k, {
      pre: function () { cnts.forEach(function (c) { c.textContent = "0"; }); if (meterI) meterI.style.transform = "scaleX(0)"; },
      build: function () {
        if (meterI) { meterI.style.transform = ""; meterI.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: 800, easing: E_OUT }); }
        var t0 = performance.now();
        (function tick(now) {
          var p = Math.min(1, (now - t0) / 800), e = easeOut(p);
          cnts.forEach(function (c) { c.textContent = f(Math.round(+c.getAttribute("data-to") * e)); });
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
        return 800;
      },
      loop: function () {
        if (sheen) addLoop(k._m, sheen, [{ transform: "translateX(-100%)" }, { transform: "translateX(300%)" }], { duration: 2800, easing: "ease-in-out" });
      }
    });

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

  /* Franja de la portada: la cifra de oro sale del último trimestre cargado. */
  var lf = D.filter(function (d) { return d.p100 != null; }), ls = lf[lf.length - 1];
  if (ls) {
    var frO = document.getElementById("fr-oro"), frQ = document.getElementById("fr-oro-q");
    if (frO) frO.textContent = f(ls.p100);
    if (frQ) frQ.textContent = ls.full;
  }

  /* Fecha de actualización y próximo informe */
  document.querySelectorAll("[data-actualizado]").forEach(function (e) { e.textContent = BASE.actualizado || "s/d"; });
  var nx = document.getElementById("proximo");
  if (nx && D.length) {
    var lastP = D[D.length - 1].periodo;
    if (lastP >= PROXIMO.periodo) nx.textContent = "";
    else if (!PROXIMO.fecha) nx.textContent = "El próximo informe de Barrick es el del " + PROXIMO.nombre + "; todavía no tiene fecha anunciada. Se agrega cuando salga.";
    else if (new Date() >= PROXIMO.fecha) nx.textContent = "Barrick publicó el " + PROXIMO.nombre + " el " + PROXIMO.texto + ". Falta cargarlo en el panel.";
    else nx.textContent = "Barrick publica el " + PROXIMO.nombre + " el " + PROXIMO.texto + ". Se agrega cuando salga.";
  }
  /* Si no queda ningún trimestre pendiente de confirmar, se ocultan las referencias a "pendiente". */
  if (!D.some(function (d) { return d.pendiente; })) {
    document.querySelectorAll("[data-si-pendiente]").forEach(function (e) { e.hidden = true; });
  }

  /* ---------- Portada: curvas de nivel que se dibujan al cargar, con una veta ocre ----------
     pathLength="1" normaliza cada curva, así el dibujo con stroke-dashoffset no necesita medir nada.
     El CSS solo anima si la persona no pidió movimiento reducido. */
  var s = document.getElementById("contour");
  if (s) for (var i = 0; i < 12; i++) {
    var y = 34 + i * 36, p = "";
    for (var x = 0; x <= 760; x += 16) {
      var yy = y + Math.sin(x / 74 + i * 0.7) * 17 + Math.sin(x / 29 + i) * 5 + Math.sin(x / 190 + i * 0.3) * 10;
      p += (x ? " L" : "M") + x + " " + yy.toFixed(1);
    }
    var c = el("path", { d: p, pathLength: 1, "class": i === 6 ? "vein" : "" }, s);
    c.style.setProperty("--d", i);
    /* Sobre la veta, el brillo que la recorre en bucle (ver estilos.css). */
    if (i === 6) el("path", { d: p, pathLength: 1, "class": "vein-flow" }, s);
  }
  /* Fuera de pantalla, la veta se queda quieta. */
  if (s && HAS_IO) new IntersectionObserver(function (es) { s.classList.toggle("off", !es[0].isIntersecting); }).observe(s);


  /* ---------- Portada: la palabra grande rota entre los temas de la franja ----------
     Cada 3,6 s cambia la palabra y se marca la columna de la franja que le corresponde.
     Sale desenfocándose y la nueva entra subiendo y enfocándose, como el texto de los carruseles.
     Se frena con el botón de pausa, fuera de pantalla y con la pestaña en segundo plano. Con movimiento reducido queda quieta en "Oro". */
  var rotaW = document.getElementById("rota-w"), franja = document.getElementById("franja");
  var cols = franja ? Array.prototype.slice.call(franja.children) : [];
  var PALABRAS = ["Oro", "Dólares", "Empleo", "Proyectos"], ri = 0, heroVis = true;
  /* Sierra: tres filas de cerros con semilla fija, de atrás hacia adelante. */
  var sierra = document.getElementById("sierra");
  if (sierra) {
    [[0.30, 120, 3.1, "s1"], [0.50, 90, 5.3, "s2"], [0.72, 60, 8.7, "s3"]].forEach(function (cfg, k) {
      var base = 360 * cfg[0], amp = cfg[1], seed = cfg[2], d = "M0 360 L0 " + base.toFixed(1), cres = "";
      for (var x = 0; x <= 1440; x += 12) {
        var h = Math.abs(Math.sin(x / 210 + seed)) * amp * 0.6 + Math.sin(x / 63 + seed * 2) * amp * 0.18 + Math.sin(x / 23 + seed) * amp * 0.06;
        var yy = base + amp * 0.35 - h;
        d += " L" + x + " " + yy.toFixed(1);
        cres += (x ? " L" : "M") + x + " " + yy.toFixed(1);
      }
      el("path", { d: d + " L1440 360 Z", "class": cfg[3] }, sierra);
      if (k === 1) el("path", { d: cres, "class": "cresta" }, sierra);
    });
  }
  function marcar(i) { cols.forEach(function (c, k) { c.classList.toggle("on", k === i); }); }
  function rotar() {
    if (paused || still() || document.hidden || !heroVis || !rotaW) return;
    ri = (ri + 1) % PALABRAS.length;
    var out = rotaW.animate([{ opacity: 1, filter: "blur(0)", transform: "translateY(0)" }, { opacity: 0, filter: "blur(12px)", transform: "translateY(-10px)" }],
      { duration: 320, easing: "ease-in", fill: "forwards" });
    out.onfinish = function () {
      rotaW.textContent = PALABRAS[ri]; out.cancel();
      rotaW.animate([{ opacity: 0, filter: "blur(18px)", transform: "translateY(18px)" }, { opacity: 1, filter: "blur(0)", transform: "translateY(0)" }],
        { duration: 720, easing: E_OUT });
      marcar(ri);
    };
  }
  if (rotaW && !still()) {
    marcar(0);
    setInterval(rotar, 3600);
    if (HAS_IO) new IntersectionObserver(function (es) { heroVis = es[0].isIntersecting; }).observe(rotaW);
  }


  /* ---------- Portada: mapa de los proyectos del SIACAM ----------
     Cada punto está en su latitud y longitud reales (proyección simple, corregida por la latitud).
     Recorre los proyectos más avanzados cada 3,8 s; al pasar el mouse por un punto muestra ese proyecto y el
     plano se inclina siguiendo el mouse. Se frena con el mouse encima, fuera de pantalla y con movimiento reducido. */
  var mapaFig = document.getElementById("hero-mapa"), PROY = window.PROYECTOS || [];
  if (mapaFig && PROY.length) {
    var msvg = document.getElementById("mapa-svg"), plano = document.getElementById("mapa-plano"), mficha = document.getElementById("mapa-ficha");
    document.getElementById("mapa-total").textContent = PROY.length;
    var MW = 400, MH = 560, MP = 40;
    var lats = PROY.map(function (p) { return p.lat; }), lons = PROY.map(function (p) { return p.lon; });
    var la0 = Math.min.apply(null, lats), la1 = Math.max.apply(null, lats), lo0 = Math.min.apply(null, lons), lo1 = Math.max.apply(null, lons);
    var kx = Math.cos((la0 + la1) / 2 * Math.PI / 180);
    var esc4 = Math.min((MW - 2 * MP) / ((lo1 - lo0) * kx), (MH - 2 * MP) / (la1 - la0));
    var ox = (MW - (lo1 - lo0) * kx * esc4) / 2, oy = (MH - (la1 - la0) * esc4) / 2;
    function mx(lon) { return ox + (lon - lo0) * kx * esc4; }
    function my(lat) { return oy + (la1 - lat) * esc4; }
    /* Cuadrícula de medio grado, con rótulos en los grados enteros. */
    for (var gl = Math.ceil(la0 * 2) / 2; gl <= la1; gl += 0.5) {
      el("line", { x1: 8, x2: MW - 8, y1: my(gl), y2: my(gl), "class": "grat" }, msvg);
      if (gl % 1 === 0) txt(12, my(gl) - 5, Math.abs(gl) + "°S", { "class": "grat-l" }, msvg);
    }
    for (var gn = Math.ceil(lo0 * 2) / 2; gn <= lo1; gn += 0.5) {
      el("line", { x1: mx(gn), x2: mx(gn), y1: 8, y2: MH - 8, "class": "grat" }, msvg);
      if (gn % 1 === 0) txt(mx(gn) + 4, MH - 14, Math.abs(gn) + "°O", { "class": "grat-l" }, msvg);
    }
    var pulso = el("circle", { r: 9, "class": "pulso" }, msvg);
    var R = { prod: 8, avan: 6, expl: 4 };
    var orden = { expl: 0, avan: 1, prod: 2 };
    var puntos = PROY.map(function (p, i) { return i; }).sort(function (a, b) { return orden[PROY[a].grupo] - orden[PROY[b].grupo]; }).map(function (i) {
      var p = PROY[i], c = el("circle", { cx: mx(p.lon), cy: my(p.lat), r: R[p.grupo], "class": "pt g-" + p.grupo }, msvg);
      c._i = i; return c;
    });
    var porIndice = {}; puntos.forEach(function (c) { porIndice[c._i] = c; });
    var DESTACADOS = ["Veladero", "Gualcamayo / Carbonatos Profundos", "Casposo", "Vicuña", "Los Azules", "El Pachón", "Hualilán", "Altar", "Taguas"]
      .map(function (n) { for (var k = 0; k < PROY.length; k++) if (PROY[k].n === n) return k; return -1; })
      .filter(function (k) { return k >= 0; });
    var di = 0, sobreMapa = false, mapaVis = true, marcado = null;
    function mostrar(i, enSecuencia) {
      var p = PROY[i];
      if (marcado) marcado.classList.remove("on");
      marcado = porIndice[i]; marcado.classList.add("on");
      pulso.setAttribute("cx", mx(p.lon)); pulso.setAttribute("cy", my(p.lat)); pulso.setAttribute("r", R[p.grupo] + 2);
      var emp = p.empresas.length ? p.empresas.join(" y ") : "Sin dato de empresa";
      mficha.innerHTML = '<p class="mf-estado g-' + p.grupo + '">' + p.estado + "</p>" +
        '<div class="mf-nav">' + (enSecuencia ? '<button type="button" data-d="-1" aria-label="Proyecto anterior">‹</button><span>' + (di + 1) + "/" + DESTACADOS.length + '</span><button type="button" data-d="1" aria-label="Proyecto siguiente">›</button>' : "") + "</div>" +
        '<p class="mf-nombre">' + p.n + "</p>" +
        '<p class="mf-det">' + p.mineral + " · " + emp + "</p>" +
        (p.nota ? '<p class="mf-nota">' + p.nota + "</p>" : "");
    }
    function avanzar(d) { di = (di + d + DESTACADOS.length) % DESTACADOS.length; mostrar(DESTACADOS[di], true); }
    mficha.addEventListener("click", function (e) { var b = e.target.closest("button[data-d]"); if (b) avanzar(+b.getAttribute("data-d")); });
    msvg.addEventListener("pointerover", function (e) { if (e.target._i !== undefined) mostrar(e.target._i, false); });
    msvg.addEventListener("pointerout", function (e) { if (e.target._i !== undefined) mostrar(DESTACADOS[di], true); });
    /* Inclinación con el mouse: el plano sigue al puntero unos pocos grados. */
    mapaFig.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse" || still()) return;
      var b = mapaFig.getBoundingClientRect(), rx = (e.clientX - b.left) / b.width - 0.5, ry = (e.clientY - b.top) / b.height - 0.5;
      plano.style.transform = "translateY(-44px) rotateX(" + (52 - ry * 14).toFixed(1) + "deg) rotateZ(" + (-14 + rx * 18).toFixed(1) + "deg)";
    });
    mapaFig.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") sobreMapa = true; });
    mapaFig.addEventListener("pointerleave", function () { sobreMapa = false; plano.style.transform = ""; });
    if (HAS_IO) new IntersectionObserver(function (es) { mapaVis = es[0].isIntersecting; }).observe(mapaFig);
    mostrar(DESTACADOS[0] !== undefined ? DESTACADOS[0] : 0, true);
    setInterval(function () { if (!still() && !sobreMapa && mapaVis && !document.hidden) avanzar(1); }, 3800);
  }

  /* ---------- Publicaciones: óvalo 3D ----------
     Las tarjetas salen de datos/publicaciones.js (lo genera actualizar_web.py desde comunidad/publicaciones.csv).
     Cada tarjeta tiene un ángulo en el óvalo; el giro cambia un solo número (ang) y cada cuadro se recalcula la
     posición de las 13 tarjetas con transform y opacidad. La de adelante reproduce su avance, sin sonido.
     Gira solo cuando nadie lo toca; se frena con el mouse encima, al arrastrar, con foco adentro, fuera de
     pantalla, con la pestaña oculta y con movimiento reducido. */
  var ovalo = document.getElementById("ovalo"), anillo = document.getElementById("ovalo-anillo"), ficha = document.getElementById("ovalo-ficha");
  var PUBS = window.PUBLICACIONES || [];
  var IGURL = "https://www.instagram.com/mineriacondatos/";
  if (ovalo && anillo && PUBS.length) {
    var MESC = ["ene.", "feb.", "mar.", "abr.", "may.", "jun.", "jul.", "ago.", "sep.", "oct.", "nov.", "dic."];
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    var N = PUBS.length, PASO = Math.PI * 2 / N, TAU = Math.PI * 2;
    anillo.innerHTML = PUBS.map(function (p, i) {
      var tipo = p.tipo === "carrusel" ? "Carrusel" : "Reel";
      return '<button type="button" class="oc ' + (p.tipo === "carrusel" ? "carrusel" : "reel") + '" data-i="' + i + '" data-src="reels/' + p.slug + ".mp4?v=" + p.v + '"' +
        ' aria-label="' + tipo + ": " + esc(p.titulo) + '">' +
        '<img src="reels/' + p.slug + ".webp?v=" + p.v + '" alt="" loading="lazy" width="540" height="' + (p.tipo === "carrusel" ? 675 : 960) + '">' +
        '<span class="oc-tipo" aria-hidden="true">' + tipo + "</span></button>";
    }).join("");
    var cards = Array.prototype.slice.call(anillo.children);
    var ang = 0, objetivo = null, frente = -1, visible = false, encima = false, foco = false, arrastre = null, ultimoToque = 0, raf = 0, previo = 0;
    var VEL = TAU / 70000; /* una vuelta cada 70 s: unos 5 s por publicación */
    function norm(a) { a = a % TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; }
    function medidas() {
      var w = ovalo.clientWidth, c = cards[0] ? cards[0].offsetWidth : 180;
      return { rx: Math.min(w * 0.42, 600), alto: c * 0.2 };
    }
    var M = medidas();
    function fichaDe(i) {
      var p = PUBS[i], pub = p.estado === "publicado", fe = p.fecha ? p.fecha.split("-") : null;
      var estado = pub ? (fe ? "Publicado el " + (+fe[2]) + " " + MESC[+fe[1] - 1] : "Publicado") : "Próximamente";
      ficha.innerHTML = '<div><p class="ficha-meta"><span>' + (p.tipo === "carrusel" ? "Carrusel" : "Reel") + "</span>" +
        '<span class="' + (pub ? "" : "prox") + '">' + estado + "</span><span>" + esc(p.tema) + "</span><span>" + (i + 1) + " de " + N + "</span></p>" +
        "<h3>" + esc(p.titulo) + "</h3>" + '<p class="ficha-gancho">' + esc(p.gancho) + "</p>" +
        (pub && p.palabra_clave ? '<p class="ficha-kw">Comentá ' + esc(p.palabra_clave) + "</p>" : "") + "</div>" +
        (pub ? '<a class="ficha-link" href="' + esc(p.url || IGURL) + '" target="_blank" rel="noopener">' + (p.url ? "Ver en Instagram" : "Verlo en el perfil") +
          '<span class="sr-only">: ' + esc(p.titulo) + "</span></a>" : "");
    }
    function videoDe(c) {
      var v = c.querySelector("video");
      if (!v) {
        v = document.createElement("video");
        v.muted = true; v.loop = true; v.playsInline = true; v.setAttribute("playsinline", ""); v.setAttribute("aria-hidden", "true");
        v.preload = "auto"; v.src = c.getAttribute("data-src");
        c.insertBefore(v, c.querySelector(".oc-tipo"));
      }
      return v;
    }
    function reproducir() {
      cards.forEach(function (c, i) {
        var v = c.querySelector("video");
        if (i === frente && visible && !document.hidden && !still()) {
          v = videoDe(c); c.classList.add("play");
          var pr = v.play(); if (pr && pr.catch) pr.catch(function () { c.classList.remove("play"); });
        } else if (v) { v.pause(); c.classList.remove("play"); }
      });
    }
    function dibujar() {
      var mejor = 0, dmin = 9;
      for (var i = 0; i < N; i++) {
        var phi = norm(i * PASO - ang), co = Math.cos(phi);
        /* Óvalo visto un poco desde arriba: las de atrás quedan más chicas, más altas y más apagadas.
           Cada tarjeta lleva su propia perspectiva y su orden (z-index) según la profundidad, así ninguna se cruza con otra. */
        var luz = (co + 1) / 2, esc3 = 0.42 + 0.58 * Math.pow(luz, 4);
        var x = M.rx * Math.sin(phi), y = (co - 1) * M.alto;
        /* Los de los costados miran hacia el centro (como un coverflow) y se achican rápido: el de adelante resalta. */
        var giro = Math.max(-55, Math.min(55, -phi * 0.9 * 57.2958));
        cards[i].style.transform = "translate(" + x.toFixed(1) + "px," + y.toFixed(1) + "px) scale(" + esc3.toFixed(3) + ") perspective(900px) rotateY(" + giro.toFixed(2) + "deg)";
        cards[i].style.opacity = (0.25 + 0.75 * Math.pow(luz, 1.4)).toFixed(3);
        cards[i].style.zIndex = Math.round(50 + 50 * co);
        if (Math.abs(phi) < dmin) { dmin = Math.abs(phi); mejor = i; }
      }
      if (mejor !== frente) {
        if (frente >= 0) cards[frente].classList.remove("frente");
        frente = mejor; cards[frente].classList.add("frente");
        fichaDe(frente); reproducir();
      }
    }
    function gira() { return !still() && !encima && !foco && !arrastre && Date.now() - ultimoToque > 3500; }
    function cuadro(t) {
      raf = 0;
      var dt = previo ? Math.min(t - previo, 64) : 16; previo = t;
      if (arrastre) { /* la posición la pone el arrastre */ }
      else if (objetivo !== null) {
        var resto = objetivo - ang;
        if (still() || Math.abs(resto) < 0.0005) { ang = objetivo; objetivo = null; }
        else ang += resto * (1 - Math.exp(-dt / 110));
      } else if (gira()) ang += VEL * dt;
      dibujar();
      if (visible && !document.hidden && (objetivo !== null || arrastre || gira() || Date.now() - ultimoToque <= 3500)) raf = requestAnimationFrame(cuadro);
      else previo = 0;
    }
    function despertar() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(cuadro); }
    function irA(i) {
      var base = i * PASO, d = norm(base - ang);
      objetivo = ang + d; ultimoToque = Date.now(); despertar();
    }
    function paso(dir) { irA(((frente + dir) % N + N) % N); }
    /* Arrastre con mouse o dedo. Si casi no se movió, cuenta como toque en la tarjeta. */
    ovalo.addEventListener("pointerdown", function (e) {
      if (e.button !== undefined && e.button !== 0) return;
      arrastre = { x: e.clientX, a: ang, movio: false, id: e.pointerId, t: e.target };
      objetivo = null; ovalo.classList.add("arrastrando"); despertar();
    });
    window.addEventListener("pointermove", function (e) {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      var dx = e.clientX - arrastre.x;
      if (Math.abs(dx) > 6 && !arrastre.movio) { arrastre.movio = true; try { ovalo.setPointerCapture(e.pointerId); } catch (er) { /* sin captura */ } }
      if (arrastre.movio) ang = arrastre.a - dx / (M.rx * 0.9);
    });
    function soltar(e) {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      var a = arrastre; arrastre = null; ovalo.classList.remove("arrastrando"); ultimoToque = Date.now();
      if (a.movio) { irA(((Math.round(norm(ang) / PASO) % N) + N) % N); return; }
      var c = a.t && a.t.closest ? a.t.closest(".oc") : null;
      if (!c) return;
      var i = +c.getAttribute("data-i");
      if (i !== frente) irA(i);
      else { var l = ficha.querySelector(".ficha-link"); if (l) window.open(l.href, "_blank", "noopener"); }
    }
    window.addEventListener("pointerup", soltar);
    window.addEventListener("pointercancel", soltar);
    /* Teclado: las tarjetas son botones (Enter las trae adelante) y con el óvalo enfocado giran las flechas. */
    cards.forEach(function (c) {
      c.addEventListener("click", function (e) { if (e.detail === 0) { var i = +c.getAttribute("data-i"); if (i !== frente) irA(i); } });
    });
    ovalo.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { paso(1); e.preventDefault(); }
      else if (e.key === "ArrowLeft") { paso(-1); e.preventDefault(); }
    });
    document.querySelectorAll(".vit-flecha").forEach(function (b) { b.addEventListener("click", function () { paso(+b.getAttribute("data-dir")); }); });
    ovalo.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") { encima = true; } });
    ovalo.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { encima = false; ultimoToque = 0; despertar(); } });
    ovalo.addEventListener("focusin", function () { foco = true; });
    ovalo.addEventListener("focusout", function () { foco = false; despertar(); });
    if (HAS_IO) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; reproducir(); despertar(); }, { threshold: 0.25 }).observe(ovalo);
    else visible = true;
    document.addEventListener("visibilitychange", function () { reproducir(); despertar(); });
    if (REDUCE.addEventListener) REDUCE.addEventListener("change", function () { reproducir(); despertar(); });
    window.addEventListener("resize", function () { M = medidas(); dibujar(); });
    dibujar();
  }

  /* Si la persona activa el movimiento reducido con la página abierta, se frena todo en el momento. */
  if (REDUCE.addEventListener) REDUCE.addEventListener("change", function () {
    if (REDUCE.matches) { armed.forEach(clearLoops); if (rotaW) { rotaW.textContent = PALABRAS[0]; marcar(-1); } }
  });

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

  /* ---------- Subrayados a mano: se dibujan la primera vez que entran en pantalla ---------- */
  var trazos = Array.prototype.slice.call(document.querySelectorAll(".subra"));
  if (trazos.length && "IntersectionObserver" in window && !REDUCE.matches) {
    document.documentElement.classList.add("trazo");
    var io3 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("on"); io3.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -12% 0px" });
    trazos.forEach(function (t) { io3.observe(t); });
  }

  /* ---------- Botón fijo de contacto en el celular ----------
     Aparece cuando la portada ya salió de pantalla y se esconde mientras se ve la sección Contacto. */
  var barra = document.getElementById("barra-movil");
  if (barra && HAS_IO) {
    var portadaVis = true, contactoVis = false;
    var barraSync = function () { barra.hidden = false; barra.classList.toggle("oculta", portadaVis || contactoVis); };
    var portadaEl = document.getElementById("inicio"), contactoEl = document.getElementById("contacto");
    if (portadaEl) new IntersectionObserver(function (es) { portadaVis = es[0].isIntersecting; barraSync(); }).observe(portadaEl);
    if (contactoEl) new IntersectionObserver(function (es) { contactoVis = es[0].isIntersecting; barraSync(); }).observe(contactoEl);
  }

  /* ---------- Copiar correo ---------- */
  var btn = document.getElementById("copy"), mail = document.getElementById("mail");
  if (btn) btn.addEventListener("click", function () {
    var label = btn.textContent;
    function ok() { btn.textContent = "Dirección copiada"; setTimeout(function () { btn.textContent = label; }, 1800); }
    function sel() { var r = document.createRange(); r.selectNodeContents(mail); var w = window.getSelection(); w.removeAllRanges(); w.addRange(r); btn.textContent = "Dirección seleccionada"; }
    try { navigator.clipboard.writeText(btn.getAttribute("data-mail")).then(ok, sel); } catch (e) { sel(); }
  });
})();
