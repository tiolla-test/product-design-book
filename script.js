(function () {
  var root = document.documentElement;
  try {
    var saved = localStorage.getItem("theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}

  document.querySelectorAll(".theme-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      var dark = root.getAttribute("data-theme")
        ? root.getAttribute("data-theme") === "dark"
        : matchMedia("(prefers-color-scheme: dark)").matches;
      var next = dark ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
    });
  });

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
