async function loadData() {
    const [youtube, instagram, twitter] = await Promise.all([
        fetch("data/youtube.json").then(r => r.json()),
        fetch("data/instagram.json").then(r => r.json()),
        fetch("data/twitter.json").then(r => r.json())
    ]);
    renderYoutube(youtube);
    renderInstagram(instagram);
    renderTwitter(twitter);
    const updated = [youtube.updatedAt, instagram.updatedAt, twitter.updatedAt].filter(Boolean).sort().pop();
    document.querySelector("#updated").textContent = updated || "-";
}

function renderYoutube(data) {
    document.querySelector("#youtube-cards").innerHTML = data.items.slice(0, 5).map((v, i) => `
    <a class="card" href="${v.url}" target="_blank" rel="noopener">
      <img class="thumb" src="${v.thumbnail}" alt="">
      <div class="card-body">
        <div class="rank">${i + 1}</div>
        <div class="title">${escapeHtml(v.title)}</div>
        <div class="meta"><span>${v.date}</span><span>◉ ${formatNumber(v.views)}</span></div>
      </div>
    </a>`).join("");
}

function renderInstagram(data) {
    document.querySelector("#instagram-cards").innerHTML = data.items.slice(0, 6).map(v => `
    <a class="card" href="${v.url}" target="_blank" rel="noopener">
      <img class="thumb ig-thumb" src="${v.thumbnail}" alt="">
      <div class="card-body"><div class="meta"><span>${v.date}</span><span>♥ ${formatNumber(v.likes)}</span></div></div>
    </a>`).join("");
}

function renderTwitter(data) {
    document.querySelector("#twitter-cards").innerHTML =
        data.items.slice(0, 5).map(v => `
      <a class="card tweet" href="${escapeHtml(v.url)}" target="_blank" rel="noopener">

        <img class="thumb" src="${escapeHtml(v.thumbnail)}" alt="" loading="lazy">
        <div class="card-body"><div class="tweet-head"><span class="avatar">𝕏</span><div style="min-width:0;flex:1">
              <b>${escapeHtml(v.displayName)}</b>

              </div>
        </div></div></a>
    `).join("");
}

function formatNumber(n) {
    return Number(n || 0).toLocaleString("ko-KR")
}

function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]))
}

loadData().catch(err => {
    console.error(err);
    document.querySelectorAll(".cards").forEach(el => el.innerHTML = "<p>데이터를 불러오지 못했습니다.</p>");
});
