
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
        features: countries.features.filter(feature => {

            const code = String(feature.id);

            return code !== "010" && code !== "304";

        })
    };


    /* =====================================================
       Projection
       ===================================================== */

    const projection = d3.geoNaturalEarth1()
        .scale(220)
        .translate([
            width / 2,
            height / 2 + 20
        ])
        .clipExtent([
            [0, 55],
            [width, 505]
        ]);


    const path = d3.geoPath()
        .projection(projection);


    /* =====================================================
       Country Codes
       ===================================================== */

    const countryCodes = {

        "대한민국": "410",
        "일본": "392",
        "태국": "764",
        "필리핀": "608",
        "대만": "158",
        "미국": "840",
        "홍콩": "344",
        "인도네시아": "360",
        "말레이시아": "458",
        "싱가포르": "702",
        "이탈리아": "380"

    };


    /* =====================================================
       Count Events
       ===================================================== */

    const countryCounts = {};

    events.forEach(event => {

        const code =
            countryCodes[event.country];

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
        .style("display", "none");


    /* =====================================================
       Hover
       ===================================================== */

    svg.selectAll(".country.active")

        .on("mouseenter", function(event, feature) {

            const code =
                String(feature.id);


            const countryEvents =
                events.filter(item =>
                    countryCodes[item.country] === code
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


            d3.select(this)
                .style("stroke", "#8a6500")
                .style("stroke-width", 1.2);


            moveTooltip(event);

        })


        .on("mousemove", function(event) {

            moveTooltip(event);

        })


        .on("mouseleave", function() {

            tooltip
                .style("display", "none");


            d3.select(this)
                .style("stroke", null)
                .style("stroke-width", null);

        });


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
