(function () {
  var root = document.documentElement;

  // хранилище браузера может быть недоступно (приватный режим) — всё работает и без него
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  var theme = load("theme", null);
  if (theme) root.setAttribute("data-theme", theme);
  document.querySelectorAll(".theme-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      save("theme", next);
    });
  });

  // оглавление на телефоне
  var side = document.getElementById("side");
  var btn = document.querySelector(".menu-btn");
  function setOpen(open) {
    side.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (btn) {
    btn.addEventListener("click", function () { setOpen(!side.classList.contains("open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && side.classList.contains("open")) { setOpen(false); btn.focus(); } });
    document.getElementById("main").addEventListener("click", function () { setOpen(false); });
  }

  // отметка «прочитано»
  var read = load("read", {});
  function paintRead() {
    document.querySelectorAll(".toc a[data-page]").forEach(function (a) {
      a.classList.toggle("read", !!read[a.getAttribute("data-page")]);
    });
  }
  var readBtn = document.querySelector(".read-btn");
  if (readBtn) {
    var pageId = readBtn.getAttribute("data-page");
    var setBtn = function () {
      var on = !!read[pageId];
      readBtn.setAttribute("aria-pressed", on ? "true" : "false");
      readBtn.textContent = on ? "Глава прочитана ✓" : "Отметить главу прочитанной";
    };
    readBtn.addEventListener("click", function () {
      if (read[pageId]) delete read[pageId]; else read[pageId] = 1;
      save("read", read); setBtn(); paintRead();
    });
    setBtn();
  }
  paintRead();

  // пункты чек-листов
  var article = document.querySelector("article[data-page]");
  if (article) {
    var key = "check:" + article.getAttribute("data-page");
    var checks = load(key, {});
    article.querySelectorAll("ul.check input").forEach(function (box, i) {
      box.checked = !!checks[i];
      box.addEventListener("change", function () {
        if (box.checked) checks[i] = 1; else delete checks[i];
        save(key, checks);
      });
    });
  }

  // поиск
  var q = document.getElementById("q");
  var res = document.querySelector(".search-res");
  var data = null;
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(s) { return s.toLowerCase().replace(/ё/g, "е"); }
  function run() {
    var term = norm(q.value.trim());
    if (term.length < 2) { res.innerHTML = ""; return; }
    var hits = [];
    for (var i = 0; i < data.length && hits.length < 12; i++) {
      var d = data[i], text = norm(d.x), pos = text.indexOf(term);
      if (pos < 0 && norm(d.s).indexOf(term) < 0) continue;
      var from = Math.max(0, pos - 40), snip = pos < 0 ? d.x.slice(0, 90) : d.x.slice(from, pos + term.length + 50);
      var sp = norm(snip).indexOf(term);
      var html = sp < 0 ? esc(snip) : esc(snip.slice(0, sp)) + "<mark>" + esc(snip.slice(sp, sp + term.length)) + "</mark>" + esc(snip.slice(sp + term.length));
      hits.push('<li><a href="' + d.p + (d.a ? "#" + d.a : "") + '"><small>' + esc(d.t) + " · " + esc(d.s) + "</small>" + (from > 0 ? "…" : "") + html + "…</a></li>");
    }
    res.innerHTML = hits.length ? hits.join("") : '<li class="empty">Ничего не нашлось. Попробуйте другое слово</li>';
  }
  if (q) {
    q.addEventListener("input", function () {
      if (data) { run(); return; }
      fetch("search.json").then(function (r) { return r.json(); }).then(function (j) { data = j; run(); })
        .catch(function () { res.innerHTML = '<li class="empty">Поиск недоступен без сервера. Откройте сайт по ссылке</li>'; });
    });
  }

  // подсветка текущего раздела в оглавлении главы
  var links = document.querySelectorAll(".local a");
  if (links.length && "IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.classList.remove("on"); });
          var a = map[en.target.id];
          if (a) a.classList.add("on");
        }
      });
    }, { rootMargin: "0px 0px -70% 0px" });
    document.querySelectorAll("article h2[id]").forEach(function (h) { io.observe(h); });
  }
})();
