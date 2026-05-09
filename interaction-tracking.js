(function () {
  var sc = document.currentScript;
  if (!sc) return;
  var page = sc.getAttribute('data-track-page');
  if (!page) return;

  var params = new URLSearchParams(window.location.search);
  var trackedUserId = params.get('userId');
  var clickSel =
    page === 'homepage' ? 'a, button, .arr, .dot' : 'a, button';

  function trackEvent(eventType, payload) {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: trackedUserId ? Number(trackedUserId) : null,
        eventType: eventType,
        payload: payload
      })
    }).catch(function () {});
  }

  trackEvent('page_view', { page: page, title: document.title });

  document.addEventListener('click', function (event) {
    var clickable = event.target.closest(clickSel);
    if (!clickable) return;
    trackEvent('click', {
      page: page,
      tag: clickable.tagName.toLowerCase(),
      id: clickable.id || null,
      className: clickable.className || null,
      text: (clickable.textContent || '').trim().slice(0, 80),
      href: clickable.getAttribute('href')
    });
  });

  if (page === 'homepage') {
    var slideRoot = document.getElementById('ss');
    if (!slideRoot) return;
    var slideEls = slideRoot.querySelectorAll('.slide');
    var lastIdx = -1;
    function activeIndex() {
      for (var i = 0; i < slideEls.length; i++) {
        if (slideEls[i].classList.contains('active')) return i;
      }
      return -1;
    }
    var mo = new MutationObserver(function () {
      var idx = activeIndex();
      if (idx !== -1 && idx !== lastIdx) {
        lastIdx = idx;
        trackEvent('slide_change', { slideIndex: idx });
      }
    });
    for (var j = 0; j < slideEls.length; j++) {
      mo.observe(slideEls[j], {
        attributes: true,
        attributeFilter: ['class']
      });
    }
  }
})();
