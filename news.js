let news = [];


/* =========================================================
   HTML Escape
   ========================================================= */

function escapeHtml(value) {

    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

}


/* =========================================================
   Date
   ========================================================= */

function parseDate(date) {

    if (!date) {
        return 0;
    }

    const time = new Date(String(date).replace(' ', 'T'));

    return Number.isNaN(time.getTime())
        ? 0
        : time.getTime();

}


function formatDate(date) {

    if (!date) {
        return '';
    }

    const value = String(date);

    if (value.length >= 16) {

        return value
            .substring(0, 16)
            .replace('-', '.')
            .replace('-', '.')
            .replace(' ', ' ');

    }

    return value;

}


/* =========================================================
   Load
   ========================================================= */

async function loadNews() {

    try {

        const response =
            await fetch('data/news.json');


        if (!response.ok) {

            throw new Error(
                'news.json을 불러오지 못했습니다.'
            );

        }


        const data =
            await response.json();


        news =
            Array.isArray(data.items)
                ? data.items
                : [];


        buildTagFilter();

        renderNews();


    } catch (error) {

        console.error(error);


        document
            .getElementById('news-list')
            .innerHTML = `
                <div class="news-loading">
                    기사를 불러오지 못했습니다.
                </div>
            `;

    }

}


/* =========================================================
   Tag Filter
   ========================================================= */

function buildTagFilter() {

    const select =
        document.getElementById('tag-select');


    const tags = new Set();


    news.forEach(item => {

        if (!Array.isArray(item.tags)) {
            return;
        }

        item.tags.forEach(tag => {

            const value =
                String(tag || '').trim();

            if (value) {
                tags.add(value);
            }

        });

    });


    const sortedTags =
        [...tags].sort((a, b) =>
            a.localeCompare(b, 'ko')
        );


    select.innerHTML =
        '<option value="all">전체</option>';


    sortedTags.forEach(tag => {

        const option =
            document.createElement('option');

        option.value = tag;
        option.textContent = tag;

        select.appendChild(option);

    });

}


/* =========================================================
   Filter
   ========================================================= */

function filterNews() {

    const selectedTag =
        document.getElementById('tag-select').value;


    let filtered = [...news];


    if (selectedTag !== 'all') {

        filtered =
            filtered.filter(item =>
                Array.isArray(item.tags) &&
                item.tags.includes(selectedTag)
            );

    }


    return filtered;

}


/* =========================================================
   Sort
   ========================================================= */

function sortNews(list, type) {

    return [...list].sort((a, b) => {

        const dateA =
            parseDate(a.date);

        const dateB =
            parseDate(b.date);


        if (type === 'oldest') {
            return dateA - dateB;
        }


        return dateB - dateA;

    });

}


/* =========================================================
   Render
   ========================================================= */

function renderNews() {

    const container =
        document.getElementById('news-list');


    const sortType =
        document.getElementById('sort-select').value;


    const filtered =
        filterNews();


    const sorted =
        sortNews(
            filtered,
            sortType
        );


    document
        .getElementById('news-count')
        .textContent =
        sorted.length.toLocaleString('ko-KR');


    if (!sorted.length) {

        container.innerHTML = `
            <div class="news-loading">
                등록된 기사가 없습니다.
            </div>
        `;

        return;

    }


    container.innerHTML =
        sorted.map(item => {


            const source =
                item.source || '';


            const reporter =
                item.reporter || '';


            const title =
                item.title || '';


            const url =
                item.url || '#';


            const tags =
                Array.isArray(item.tags)
                    ? item.tags
                    : [];


            const tagHtml =
                tags
                    .map(tag => `
                        <span class="news-tag">
                            ${escapeHtml(tag)}
                        </span>
                    `)
                    .join('');


            return `

                <article class="news-item">

                    <time class="news-date">
                        ${escapeHtml(
                formatDate(item.date)
            )}
                    </time>


                    <a
                        href="${escapeHtml(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="news-source"
                        data-reporter="${escapeHtml(reporter)}"
                        onclick="filterBySource(event, '${escapeHtml(source)}')"
                    >
                        ${escapeHtml(source)}
                    </a>


                    <a
                        href="${escapeHtml(url)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="news-title"
                    >
                        ${escapeHtml(title)}
                    </a>


                    <div class="news-tags-inline">

                        ${tagHtml}

                    </div>

                </article>

            `;

        }).join('');

}


/* =========================================================
   Source Filter
   ========================================================= */

function filterBySource(event, source) {

    event.stopPropagation();

    if (!source) {
        return;
    }

    const items =
        news.filter(item =>
            String(item.source || '') === source
        );


    const sortType =
        document.getElementById('sort-select').value;


    const sorted =
        sortNews(items, sortType);


    const container =
        document.getElementById('news-list');


    document
        .getElementById('news-count')
        .textContent =
        sorted.length.toLocaleString('ko-KR');


    container.innerHTML =
        sorted.map(item => {

            const tags =
                Array.isArray(item.tags)
                    ? item.tags
                    : [];


            return `

                <article class="news-item">

                    <time class="news-date">
                        ${escapeHtml(
                formatDate(item.date)
            )}
                    </time>


                    <a
                        href="${escapeHtml(item.url || '#')}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="news-source"
                        data-reporter="${escapeHtml(item.reporter || '')}"
                    >
                        ${escapeHtml(item.source || '')}
                    </a>


                    <a
                        href="${escapeHtml(item.url || '#')}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="news-title"
                    >
                        ${escapeHtml(item.title || '')}
                    </a>


                    <div class="news-tags-inline">

                        ${
                tags.map(tag => `
                                <span class="news-tag">
                                    ${escapeHtml(tag)}
                                </span>
                            `).join('')
            }

                    </div>

                </article>

            `;

        }).join('');

}


/* =========================================================
   Events
   ========================================================= */

document
    .getElementById('tag-select')
    .addEventListener(
        'change',
        renderNews
    );


document
    .getElementById('sort-select')
    .addEventListener(
        'change',
        renderNews
    );


/* =========================================================
   Start
   ========================================================= */

loadNews();