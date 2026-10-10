async function loadData() {
    const [youtubeResponse, socialResponse] =
        await Promise.all([
            fetch("data/youtube.json"),
            fetch("data/social_pick.json")
        ]);

    if (!youtubeResponse.ok) {
        throw new Error(
            "Failed to load YouTube content."
        );
    }

    if (!socialResponse.ok) {
        throw new Error(
            "Failed to load Social Pick content."
        );
    }

    const [youtube, social] =
        await Promise.all([
            youtubeResponse.json(),
            socialResponse.json()
        ]);

    renderYoutube(youtube);
    renderSocial(social);
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

async function loadRandomMessage() {
    const container = document.querySelector(".random-message-inner");
    const yearEl = document.getElementById("random-message-year");
    const textEl = document.getElementById("random-message-text");
    const refreshBtn = document.getElementById("random-message-refresh");

    if (!container || !yearEl || !textEl || !refreshBtn) {
        return;
    }

    try {
        const response = await fetch("data/random_messages.json");

        if (!response.ok) {
            throw new Error("Failed to load random messages.");
        }

        const data = await response.json();

        const messages = Array.isArray(data)
            ? data.filter(item =>
                item &&
                item.pick === true &&
                typeof item.text === "string" &&
                item.text.trim()
            )
            : [];

        if (!messages.length) {
            container.hidden = true;
            return;
        }

        let currentIndex = -1;
        let changeTimer;

        function pickRandomIndex() {
            if (messages.length <= 1) return 0;

            let nextIndex;

            do {
                nextIndex = Math.floor(Math.random() * messages.length);
            } while (nextIndex === currentIndex);

            return nextIndex;
        }

        function renderMessage(index, animate = false) {
            const item = messages[index];

            clearTimeout(changeTimer);

            const reducedMotion = window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

            const update = () => {
                currentIndex = index;

                yearEl.textContent = item.year
                    ? `[${item.year}]`
                    : "";

                textEl.textContent = item.text;
            };

            if (!animate || reducedMotion) {
                update();
                container.classList.remove(
                    "is-changing",
                    "is-entering"
                );
                return;
            }

            container.classList.remove("is-entering");
            container.classList.add("is-changing");

            changeTimer = setTimeout(() => {
                update();

                container.classList.remove("is-changing");
                container.classList.add("is-entering");

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        container.classList.remove("is-entering");
                    });
                });
            }, 240);
        }

        refreshBtn.addEventListener("click", () => {
            renderMessage(pickRandomIndex(), true);
        });

        renderMessage(pickRandomIndex());

    } catch (error) {
        console.error("Random message:", error);
        container.hidden = true;
    }
}

loadData().catch(err => {
    console.error(err);

    document.querySelectorAll(".cards").forEach(el => {
        el.innerHTML =
            "<p>데이터를 불러오지 못했습니다.</p>";
    });
});

loadRandomMessage();

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