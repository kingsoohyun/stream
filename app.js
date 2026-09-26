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
            await fetch("data/social.json");

        if (!socialResponse.ok) {
            throw new Error(
                "social.json을 불러오지 못했습니다."
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
            <a class="card" href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer">
            <img class="thumb" src="${escapeHtml(v.thumbnail)}" alt="">
            <div class="card-body">
                <div class="title">${escapeHtml(v.title)}</div>
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
        document.querySelector("#social-cards");

    if (!container) return;

    const items =
        Array.isArray(data.items)
            ? data.items
                .filter(item =>
                    item.pick === true &&
                    item.url &&
                    item.date &&
                    item.platform
                )
                .slice(0, 8)
            : [];

    const platformNames = {
        instagram: "INSTAGRAM",
        tiktok: "TIKTOK",
        x: "X",
        weibo: "WEIBO"
    };

    container.innerHTML = items.map(item => {
        const [year, month, day] =
            String(item.date).split(".");

        const date = new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        );

        const monthName =
            date
                .toLocaleString("en-US", {
                    month: "short"
                })
                .toUpperCase();

        const platform =
            platformNames[item.platform] ||
            item.platform.toUpperCase();

        return `
            <a
                class="social-card"
                href="${escapeHtml(item.url)}"
                target="_blank"
                rel="noopener noreferrer"
            >
                <div class="social-date">
                    <span class="social-month">
                        ${monthName}
                    </span>

                    <strong class="social-day">
                        ${escapeHtml(day)}
                    </strong>
                </div>

       
                
                <div class="social-info">
                    <span class="social-account">
                        ${escapeHtml(item.desc || item.account || "")}
                    </span>
                
                    <span class="social-label">
                        ${escapeHtml(platform)}
                    </span>
                </div>

                <span
                    class="social-arrow"
                    aria-hidden="true"
                >↗</span>
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
        el.innerHTML = "<p>데이터를 불러오지 못했습니다.</p>";
    });
});


const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    backToTop.classList.toggle("show", window.scrollY > 600);
});

backToTop.addEventListener("click", () => {
    const prefersReducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "auto" : "smooth"
    });
});