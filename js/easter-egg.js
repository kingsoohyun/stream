document.addEventListener('DOMContentLoaded', function () {
    const loveLink = document.querySelector('a[href="tweets.html"]');

    if (!loveLink) {
        console.log('LOVE SH link not found');
        return;
    }

    // --------------------------------------------------
    // 날짜 설정
    // --------------------------------------------------

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();


    // 추석 날짜는 양력 기준으로 입력
    const chuseokDates = {
        2026: ['2026-09-23', '2026-09-24', '2026-09-25', '2026-09-26', '2026-09-27'],
        2027: ['2027-09-13', '2027-09-14', '2027-09-15', '2027-09-16', '2027-09-17'],
        2028: ['2028-10-01', '2028-10-02', '2028-10-03', '2028-10-04', '2028-10-05'],
        2029: ['2029-09-20', '2029-09-21', '2029-09-22', '2029-09-23', '2029-09-24'],
        2030: ['2030-09-10', '2030-09-11', '2030-09-12', '2030-09-13', '2030-09-14'],
        2031: ['2031-09-29', '2031-09-30', '2031-10-01', '2031-10-02', '2031-10-03'],
        2032: ['2032-09-17', '2032-09-18', '2032-09-19', '2032-09-20', '2032-09-21'],
        2033: ['2033-09-06', '2033-09-07', '2033-09-08', '2033-09-09', '2033-09-10'],
        2034: ['2034-09-25', '2034-09-26', '2034-09-27', '2034-09-28', '2034-09-29'],
        2035: ['2035-09-14', '2035-09-15', '2035-09-16', '2035-09-17', '2035-09-18'],
    };

    const todayKey =
        year + '-' +
        String(month).padStart(2, '0') + '-' +
        String(day).padStart(2, '0');

    const isChuseok = chuseokDates[year]?.includes(todayKey);
    const isNewYear = month === 1 && day === 1;
    const isBirthday = month === 2 && day === 16;
    const isWhiteDay = month === 3 && day === 14;
    const isDebutDay = month === 7 && day === 24;
    const isChristmas = month === 12 && day === 25;
    const isNewYearEve = month === 12 && day === 31;


    // --------------------------------------------------
    // 효과 설정
    // --------------------------------------------------

    let effect = {
        symbol: '♥',
        className: 'love-heart-effect',
        duration: 650
    };

    if (isChuseok) {
        effect = {
            symbol: '🌕',
            className: 'love-moon-effect',
            duration: 700
        };
    } else if (isNewYear) {
        effect = {
            symbol: '🧧',
            className: 'love-newyear-effect',
            duration: 700
        };
    } else if (isBirthday) {
        effect = {
            symbol: '🎂',
            className: 'love-cake-effect',
            duration: 700
        };
    } else if (isWhiteDay) {
        effect = {
            symbol: '🍭',
            className: 'love-candy-effect',
            duration: 700
        };
    } else if (isDebutDay) {
        effect = {
            symbol: '🎬',
            className: 'love-debut-effect',
            duration: 700
        };
    } else if (isChristmas) {
        effect = {
            symbol: '🎄',
            className: 'love-tree-effect',
            duration: 750
        };
    } else if (isNewYearEve) {
        effect = {
            symbol: '⛄',
            className: 'love-snowman-effect',
            duration: 700
        };
    }


    // --------------------------------------------------
    // LOVE SH 클릭
    // --------------------------------------------------

    let navigating = false;

    loveLink.addEventListener('click', function (event) {
        event.preventDefault();

        const rect = loveLink.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        // 메인 이펙트
        const mainEffect = document.createElement('span');

        mainEffect.className = effect.className;
        mainEffect.textContent = effect.symbol;
        mainEffect.style.left = x + 'px';
        mainEffect.style.top = y + 'px';

        document.body.appendChild(mainEffect);

        setTimeout(function () {
            mainEffect.remove();
        }, effect.duration);


        // 반짝이
        ['✦', '✧', '✦', '·'].forEach(function (symbol, i) {
            const spark = document.createElement('span');

            spark.className = 'love-spark';
            spark.textContent = symbol;
            spark.style.left = x + 'px';
            spark.style.top = y + 'px';

            const positions = [
                [-20, -18],
                [20, -18],
                [-24, 12],
                [24, 12]
            ];

            spark.style.setProperty('--love-spark-x', positions[i][0] + 'px');
            spark.style.setProperty('--love-spark-y', positions[i][1] + 'px');

            document.body.appendChild(spark);

            setTimeout(function () {
                spark.remove();
            }, 700);
        });


        // 첫 클릭에서만 페이지 이동 예약
        if (!navigating) {
            navigating = true;

            setTimeout(function () {
                window.location.href = loveLink.href;
            }, effect.duration);
        }
    });
});