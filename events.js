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
    const height = 560;


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
       Projection
       ===================================================== */

    const projection = d3.geoNaturalEarth1()
        .scale(190)
        .translate([
            width / 2,
            height / 2 + 20
        ]);


    const path = d3.geoPath()
        .projection(projection);


    /* =====================================================
       Count Events by Country
       ===================================================== */

    const countryCounts = {};

    events.forEach(event => {

        const country = event.country;

        if (!countryCounts[country]) {
            countryCounts[country] = 0;
        }

        countryCounts[country]++;
    });


    const maxCount = Math.max(
        ...Object.values(countryCounts),
        1
    );


    /* =====================================================
       Country Name → Map ID
       ===================================================== */

    const countryMap = {

        "대한민국": "Korea",
        "일본": "Japan",
        "태국": "Thailand",
        "필리핀": "Philippines",
        "대만": "Taiwan",
        "홍콩": "Hong Kong",
        "인도네시아": "Indonesia",
        "미국": "United States of America",
        "말레이시아": "Malaysia",
        "싱가포르": "Singapore",
        "이탈리아": "Italy"

    };


    /* =====================================================
       Color Scale
       ===================================================== */

    function getCountryColor(count) {

        if (!count) {
            return "#f1f2f4";
        }

        const ratio = count / maxCount;

        if (ratio <= .2) {
            return "#e5e7ea";
        }

        if (ratio <= .4) {
            return "#c9ccd1";
        }

        if (ratio <= .6) {
            return "#9da2aa";
        }

        if (ratio <= .8) {
            return "#686e78";
        }

        return "#151922";
    }


    /* =====================================================
       Draw Countries
       ===================================================== */

    svg.append("g")
        .selectAll("path")
        .data(countries.features)
        .join("path")
        .attr("class", "country")
        .attr("d", path)
        .attr("fill", feature => {

            const countryName =
                getCountryName(feature);

            const count =
                getEventCount(countryName);

            return getCountryColor(count);
        })
        .classed("active", feature => {

            const countryName =
                getCountryName(feature);

            return getEventCount(countryName) > 0;
        });


    /* =====================================================
       Tooltip
       ===================================================== */

    const tooltip = d3.select("body")
        .append("div")
        .attr("class", "map-tooltip")
        .style("display", "none");


    /* =====================================================
       Country Hover
       ===================================================== */

    svg.selectAll(".country")
        .filter(feature => {

            const countryName =
                getCountryName(feature);

            return getEventCount(countryName) > 0;

        })
        .on("mouseenter", function(event, feature) {

            const countryName =
                getCountryName(feature);

            const count =
                getEventCount(countryName);

            const countryEvents =
                events.filter(item =>
                    item.country === countryName
                );

            const city =
                countryEvents[0]?.city || "";


            tooltip
                .html(`
<strong>${escapeHtml(countryName)}</strong>
<span>${escapeHtml(city)}</span>

<div class="event-count">
    주요 활동 <b>${count}</b>건
</div>
    `)
                .style("display", "block");

            moveTooltip(event);

        })
        .on("mousemove", function(event) {

            moveTooltip(event);

        })
        .on("mouseleave", function() {

            tooltip
                .style("display", "none");

        });


    /* =====================================================
       Country Name
       ===================================================== */

    function getCountryName(feature) {

        const name =
            feature.properties?.name || "";

        const reverseMap = Object.fromEntries(
            Object.entries(countryMap)
                .map(([k, v]) => [v, k])
        );

        return reverseMap[name] || name;
    }


    /* =====================================================
       Event Count
       ===================================================== */

    function getEventCount(countryName) {

        return countryCounts[countryName] || 0;
    }


    /* =====================================================
       Tooltip Position
       ===================================================== */

    function moveTooltip(event) {

        const padding = 14;

        let left =
            event.pageX + padding;

        let top =
            event.pageY + padding;

        const node =
            tooltip.node();

        if (!node) return;

        const rect =
            node.getBoundingClientRect();


        if (
            left + rect.width >
            window.innerWidth - 10
        ) {
            left =
                event.pageX -
                rect.width -
                padding;
        }


        if (
            top + rect.height >
            window.innerHeight - 10
        ) {
            top =
                event.pageY -
                rect.height -
                padding;
        }


        tooltip
            .style("left", `${left}px`)
            .style("top", `${top}px`);
    }
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
            .sort((a, b) => Number(b) - Number(a))
            .map(year => {

                return `
<section class="timeline-year">

    <div class="timeline-year-title">
    ${escapeHtml(year)}
    </div>

<div class="timeline-events">

    ${years[year].map(event => `

                                <article class="timeline-event">

                                    <div class="timeline-date">
                                        ${escapeHtml(event.date)}
                                    </div>

                                    <div class="timeline-location">
                                        ${escapeHtml(event.country)}
                                    </div>

                                    <div class="timeline-title">
                                        ${escapeHtml(event.title)}
                                    </div>

                                    ${
    event.venue
        ? `
                                                <div class="timeline-venue">
                                                    ${escapeHtml(event.venue)}
                                                </div>
                                            `
        : ""
}

                                </article>

                            `).join("")}

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
        .replace(/[&<>"']/g, m => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        }[m]));

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