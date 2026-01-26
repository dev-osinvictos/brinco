(function () {
  var docId = document.body.getAttribute("data-doc-id");
  var likeBtn = document.getElementById("likeBtn");
  var shareBtn = document.getElementById("shareBtn");
  var countEl = document.getElementById("likeCount");

  if (!docId || !likeBtn || !shareBtn || !countEl) {
    return;
  }

  var apiBase = "https://brincodeourovivo.onrender.com";
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
    var url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url: url });
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      alert("Link copiado!");
      return;
    }
    prompt("Copie o link:", url);
  });

  fetchCount();
})();
