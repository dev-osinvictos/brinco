(function () {
  var docId = document.body.getAttribute("data-doc-id");
  var likeBtn = document.getElementById("likeBtn");
  var shareBtn = document.getElementById("shareBtn");
  var countEl = document.getElementById("likeCount");
  var menuToggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");

  if (!docId || !likeBtn || !shareBtn || !countEl) {
    return;
  }

  var apiBase = window.API_BASE || document.body.getAttribute("data-api-base") || "https://brincodeourovivo.onrender.com";
  if (window.location.hostname === "localhost") {
    apiBase = "http://localhost:3000";
  }

  function setCount(n) {
    countEl.textContent = n + " curtidas";
  }

  function fetchCount() {
    fetch(apiBase + "/likes/" + encodeURIComponent(docId))
      .then(function (res) { return res.json(); })
      .then(function (data) { setCount(data.count || 0); })
      .catch(function () { setCount(0); });
  }

  likeBtn.addEventListener("click", function () {
    fetch(apiBase + "/likes/" + encodeURIComponent(docId), { method: "POST" })
      .then(function (res) { return res.json(); })
      .then(function (data) { setCount(data.count || 0); })
      .catch(function () {});
  });

  shareBtn.addEventListener("click", function () {
    var url = "https://brincodeourovivo.com.br";
    var fbUrl = "https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(url);
    window.open(fbUrl, "_blank", "noopener,noreferrer");
  });

  fetchCount();

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      var isOpen = nav.classList.toggle("open");
      menuToggle.classList.toggle("open", isOpen);
      menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    nav.addEventListener("click", function (event) {
      if (event.target && event.target.tagName === "A") {
        nav.classList.remove("open");
        menuToggle.classList.remove("open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("click", function (event) {
      if (!nav.classList.contains("open")) return;
      if (menuToggle.contains(event.target) || nav.contains(event.target)) return;
      nav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });

    window.addEventListener("scroll", function () {
      if (!nav.classList.contains("open")) return;
      nav.classList.remove("open");
      menuToggle.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  }
})();
