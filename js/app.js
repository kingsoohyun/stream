async function loadData() {
    const youtubeResponse =
        await fetch("data/youtube.json");

    if (!youtubeResponse.ok) {
        throw new Error(
            "youtube.json을 불러오지 못했습니다."
        );
    }

    const youtube =
        await youtubeResponse.json();

    renderYoutube(youtube);

    try {
        const socialResponse =
            await fetch("data/social_pick.json");

        if (!socialResponse.ok) {
            throw new Error(
                "social_pick.json을 불러오지 못했습니다."
            );
        }

        const social =
            await socialResponse.json();

        renderSocial(social);

    } catch (error) {
        console.error("Social:", error);
    }
}


function renderYoutube(data) {
    document.querySelector("#youtube-cards").innerHTML =
        data.items.slice(0, 10).map(v => `
            <a
                class="card"
                href="${escapeHtml(v.url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    class="thumb"
                    src="${escapeHtml(v.thumbnail)}"
                    alt=""
                    loading="lazy"
                >
                <div class="card-body">
                    <div class="title">
                        ${escapeHtml(v.title)}
                    </div>
                    <div class="meta">
                        <span>${v.date}</span>
                        <span>◉ ${formatNumber(v.views)}</span>
                    </div>
                </div>
            </a>
        `).join("");
}


function renderSocial(data) {
    const container =
        document.querySelector("#social-home-cards");

    if (!container) return;

    const platformNames = {
        instagram: "◎ INSTAGRAM",
        x: "𝕏 X",
        tiktok: "♪ TIKTOK",
        weibo: "◉ WEIBO"
    };

    const items =
        Array.isArray(data.items)
            ? data.items.filter(item =>
                item &&
                item.url &&
                item.thumbnail &&
                item.platform
            )
            : [];

    container.innerHTML = items.map(item => {
        const platform =
            platformNames[
                String(item.platform).toLowerCase()
                ] ||
            String(item.platform).toUpperCase();

        return `
            <a
                class="social-home-card"
                href="${escapeHtml(item.url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                <img
                    class="social-home-thumb"
                    src="${escapeHtml(item.thumbnail)}"
                    alt=""
                    loading="lazy"
                >

                <div class="social-home-card-body">
                    <span class="social-home-platform">
                        ${escapeHtml(platform)}
                    </span>
                </div>
            </a>
        `;
    }).join("");
}


function formatNumber(n) {
    return Number(n || 0).toLocaleString("ko-KR");
}


function escapeHtml(s) {
    return String(s ?? "").replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[m]));
}


loadData().catch(err => {
    console.error(err);

    document.querySelectorAll(".cards").forEach(el => {
        el.innerHTML =
            "<p>데이터를 불러오지 못했습니다.</p>";
    });
});


const backToTop =
    document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    backToTop.classList.toggle(
        "show",
        window.scrollY > 600
    );
});


backToTop.addEventListener("click", () => {
    const prefersReducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    window.scrollTo({
        top: 0,
        behavior:
            prefersReducedMotion
                ? "auto"
                : "smooth"
    });
});