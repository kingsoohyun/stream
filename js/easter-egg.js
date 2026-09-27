
    document.addEventListener('DOMContentLoaded', function () {

    const loveLink = document.querySelector('a[href="tweets.html"]');

    if (!loveLink) {
    console.log('LOVE SH link not found');
    return;
}

    loveLink.addEventListener('click', function (event) {
    event.preventDefault();

    const rect = loveLink.getBoundingClientRect();

    // 하트
    const heart = document.createElement('span');
    heart.className = 'love-heart-effect';
    heart.textContent = '♥';

    heart.style.left = (rect.left + rect.width / 2) + 'px';
    heart.style.top = (rect.top + rect.height / 2) + 'px';

    document.body.appendChild(heart);

    // 반짝이
    ['✦', '✧', '✦', '·'].forEach(function (symbol, i) {

    const spark = document.createElement('span');

    spark.className = 'love-spark';
    spark.textContent = symbol;

    spark.style.left = (rect.left + rect.width / 2) + 'px';
    spark.style.top = (rect.top + rect.height / 2) + 'px';

    const positions = [
    [-20, -18],
    [20, -18],
    [-24, 12],
    [24, 12]
    ];

    spark.style.setProperty('--x', positions[i][0] + 'px');
    spark.style.setProperty('--y', positions[i][1] + 'px');

    document.body.appendChild(spark);

    setTimeout(function () {
    spark.remove();
}, 700);
});

    // 애니메이션 후 기존 링크로 이동
    setTimeout(function () {
    window.location.href = loveLink.href;
}, 500);
});

});