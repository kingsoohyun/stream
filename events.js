async function loadEvents() {

    const data = await fetch("data/events.json").then(r => {

        if (!r.ok) {
            throw new Error("events.json을 불러오지 못했습니다.");
        }

        return r.json();
    });

    renderMap(data.items);
    renderTimeline(data.items);
}


/* =========================================================
   World Map
   ========================================================= */

async function renderMap(events) {

    const container = document.querySelector("#world-map");

    if (!container) return;


    /* =====================================================
       Load World Map
       ===================================================== */

    const world = await fetch(
        "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
    ).then(r => {

        if (!r.ok) {
            throw new Error("세계지도 데이터를 불러오지 못했습니다.");
        }

        return r.json();
    });


    /* =====================================================
       Map Size
       ===================================================== */

    const width = 1160;
    const height = 520;

    const svg = d3.select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");


    /* =====================================================
       Countries
       ===================================================== */

    const countries = topojson.feature(
        world,
        world.objects.countries
    );


    /* =====================================================
       Remove Polar Regions
       ===================================================== */

    /*
     * 010 = Antarctica
     * 304 = Greenland
     *
     * 남극과 그린란드를 지도에서 제외한다.
     */

    const visibleCountries = {
        type: "FeatureCollection",

        features: countries.features
            .filter(feature => {

                const code = String(feature.id);

                return code !== "010" && code !== "304";
            })

            .map(feature => {

                /* ---------------------------------------------
                   미국 서쪽의 작은 알류샨 열도 일부 제외
                   --------------------------------------------- */

                if (String(feature.id) !== "840") {
                    return feature;
                }

                if (feature.geometry.type !== "MultiPolygon") {
                    return feature;
                }

                const polygons = feature.geometry.coordinates
                    .filter(polygon => {

                        const centroid = d3.geoCentroid({
                            type: "Feature",
                            geometry: {
                                type: "Polygon",
                                coordinates: polygon
                            }
                        });

                        /*
                         * 알래스카 서쪽으로 길게 이어지는 작은 섬들을
                         * 지도에서 제외한다. 미국 본토/알래스카는 유지한다.
                         */

                        return !(
                            centroid[0] < -165 &&
                            centroid[1] > 45
                        );
                    });

                return {
                    ...feature,

                    geometry: {
                        ...feature.geometry,
                        coordinates: polygons
                    }
                };
            })
    };


    /* =====================================================
       Projection
       ===================================================== */

    const projection = d3.geoNaturalEarth1()
        .fitExtent(
            [
                [20, 20],
                [width - 20, height - 20]
            ],
            visibleCountries
        );

    const path = d3.geoPath()
        .projection(projection);


    /* =====================================================
       Country Codes
       ===================================================== */

    const countryCodes = {

        "대한민국": "410",
        "독일": "276",
        "일본": "392",
        "태국": "764",
        "필리핀": "608",
        "대만": "158",
        "미국": "840",
        "홍콩": "344",
        "인도네시아": "360",
        "말레이시아": "458",
        "싱가포르": "702",
        "이탈리아": "380",
        "중국": "156",
        "프랑스": "250",
        "영국": "826",
        "뉴질랜드": "554",
        "모로코": "504",
        "스페인": "724"
    };


    function getCountryCode(country) {

        const countryName =
            String(country).replace(
                /^[\u{1F1E6}-\u{1F1FF}]{2}\s*/u,
                ""
            );

        return countryCodes[countryName];
    }


    /* =====================================================
       Count Events
       ===================================================== */

    const countryCounts = {};

    events.forEach(event => {

        const code =
            getCountryCode(event.country);

        if (!code) return;

        countryCounts[code] =
            (countryCounts[code] || 0) + 1;
    });


    const maxCount = Math.max(
        ...Object.values(countryCounts),
        1
    );


    /* =====================================================
       Gold → Brown Color Scale
       ===================================================== */

    const goldScale = d3.scaleLinear()
        .domain([
            1,
            maxCount
        ])
        .range([
            "#E8D6A3",
            "#74351F"
        ])
        .interpolate(d3.interpolateRgb);


    /* =====================================================
       Draw Countries
       ===================================================== */

    svg.append("g")
        .selectAll("path")
        .data(visibleCountries.features)
        .join("path")

        .attr("class", feature => {

            const code =
                String(feature.id);

            return countryCounts[code]
                ? "country active"
                : "country";
        })

        .attr("d", path)

        .style("fill", feature => {

            const code =
                String(feature.id);

            const count =
                countryCounts[code] || 0;

            return count
                ? goldScale(count)
                : "#f1f2f4";
        });


    /* =====================================================
       Tooltip
       ===================================================== */

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip")
        .style("display", "none")
        .style("pointer-events", "auto");


    let hideTimer = null;
    let activeCountry = null;


    function cancelHide() {

        clearTimeout(hideTimer);
    }


    function scheduleHide() {

        clearTimeout(hideTimer);

        hideTimer = setTimeout(() => {

            tooltip
                .style("display", "none");

            if (activeCountry) {

                d3.select(activeCountry)
                    .style("stroke", null)
                    .style("stroke-width", null);

                activeCountry = null;
            }

        }, 180);
    }


    /* =====================================================
       Tooltip Mouse Interaction
       ===================================================== */

    tooltip

        .on("mouseenter", function () {

            cancelHide();
        })

        .on("mouseleave", function () {

            scheduleHide();
        });


    /* =====================================================
       Country Hover
       ===================================================== */

    svg.selectAll(".country.active")

        .on("mouseenter", function (event, feature) {

            cancelHide();

            activeCountry = this;


            const code =
                String(feature.id);


            const countryEvents =
                events.filter(item =>
                    getCountryCode(item.country) === code
                );


            if (!countryEvents.length) {
                return;
            }


            const countryName =
                countryEvents[0].country;


            const count =
                countryEvents.length;


            /* ---------------------------------------------
               모든 활동 표시
               --------------------------------------------- */

            const eventList =
                countryEvents.map(item => {

                    const city =
                        item.city
                            ? ` · ${escapeHtml(item.city)}`
                            : "";


                    return `
                        <div class="event-item">

                            <span class="event-date">
                                ${escapeHtml(item.date)}${city}
                            </span>

                            <span class="event-title">
                                ${escapeHtml(item.title)}
                            </span>

                        </div>
                    `;

                }).join("");


            tooltip
                .html(`
                    <strong>
                        ${escapeHtml(countryName)}
                    </strong>

                    <div class="event-count">
                        총 ${count}건
                    </div>

                    <div class="event-list">
                        ${eventList}
                    </div>
                `)
                .style("display", "block");


            /* ---------------------------------------------
               현재 국가 강조
               --------------------------------------------- */

            d3.select(this)
                .style("stroke", "#8a6500")
                .style("stroke-width", 1.2);


            /* ---------------------------------------------
               국가 영역 옆에 Tooltip 고정
               --------------------------------------------- */

            const countryRect =
                this.getBoundingClientRect();

            const node =
                tooltip.node();

            if (!node) return;


            const padding = 12;


            let left =
                countryRect.right +
                padding +
                window.scrollX;


            let top =
                countryRect.top +
                window.scrollY;


            /* ---------------------------------------------
               오른쪽 공간이 부족하면 왼쪽으로
               --------------------------------------------- */

            if (
                left + node.offsetWidth >
                window.scrollX +
                window.innerWidth -
                10
            ) {

                left =
                    countryRect.left -
                    node.offsetWidth -
                    padding +
                    window.scrollX;
            }


            /* ---------------------------------------------
               아래쪽 공간이 부족하면 위로 조정
               --------------------------------------------- */

            const maxTop =
                window.scrollY +
                window.innerHeight -
                node.offsetHeight -
                10;


            top =
                Math.min(top, maxTop);


            /* ---------------------------------------------
               화면 위쪽을 벗어나지 않도록 조정
               --------------------------------------------- */

            top =
                Math.max(
                    top,
                    window.scrollY + 10
                );


            tooltip
                .style("left", `${left}px`)
                .style("top", `${top}px`);
        })


        /* ---------------------------------------------
           커서를 움직여도 Tooltip은 따라오지 않는다.
           --------------------------------------------- */

        .on("mouseleave", function () {

            scheduleHide();
        });
}


/* =========================================================
   Timeline
   ========================================================= */

function renderTimeline(events) {

    const container =
        document.querySelector("#event-timeline");

    if (!container) return;


    const years = {};


    events.forEach(event => {

        const year =
            String(event.date).substring(0, 4);

        if (!years[year]) {
            years[year] = [];
        }

        years[year].push(event);
    });


    container.innerHTML =
        Object.keys(years)

            .sort(
                (a, b) =>
                    Number(b) - Number(a)
            )

            .map(year => {

                return `
                    <section class="timeline-year">

                        <div class="timeline-year-title">
                            ${escapeHtml(year)}
                        </div>

                        <div class="timeline-events">

                            ${years[year]
                    .map(event => `

                                    <article class="timeline-event">

                                        <div class="timeline-main">

                                            <span
                                                class="timeline-date"
                                                title="${escapeHtml(event.date)}"
                                            >
                                                ${escapeHtml(event.date.slice(0, 7))}
                                            </span>

                                            <span class="timeline-location">
                                                ${escapeHtml(event.country)}
                                            </span>

                                            <span class="timeline-title">

                                                ${escapeHtml(event.title)}

                                                ${
                        Array.isArray(event.links) && event.links.length
                            ? `
                                                            <span class="timeline-links">

                                                                ${event.links.map(link => `

                                                                    <a
                                                                        href="${escapeHtml(link.url)}"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                    >
                                                                        ${escapeHtml(link.label)}
                                                                    </a>

                                                                `).join("")}

                                                            </span>
                                                        `
                            : ""
                    }

                                            </span>

                                        </div>


                                        ${
                        event.venue
                            ? `

                                                    <div class="timeline-venue">

                                                        <span></span>
                                                        <span></span>

                                                        <span>
                                                            ${escapeHtml(event.venue)}
                                                        </span>

                                                    </div>

                                                `
                            : ""
                    }

                                    </article>

                                `)
                    .join("")}

                        </div>

                    </section>
                `;

            })

            .join("");
}


/* =========================================================
   HTML Escape
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,

            m => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[m])
        );
}


/* =========================================================
   Start
   ========================================================= */

loadEvents().catch(err => {

    console.error(err);

    const map =
        document.querySelector("#world-map");

    if (map) {

        map.innerHTML =
            "<p>지도를 불러오지 못했습니다.</p>";
    }
});

const backToTop = document.getElementById("backToTop");

window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
        backToTop.classList.add("show");
    } else {
        backToTop.classList.remove("show");
    }
});

backToTop.addEventListener("click", () => {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});