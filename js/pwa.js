/* 앱으로 설치하기 (PWA)
 *
 * - Chrome/Edge/Android: beforeinstallprompt 를 잡아 뒀다가 버튼을 눌렀을 때 띄운다.
 *   (이벤트는 한 번만 오므로 반드시 붙잡아 둬야 한다)
 * - iOS Safari: 그 이벤트가 없다. 대신 "공유 → 홈 화면에 추가" 안내를 띄운다.
 * - 이미 설치돼 실행 중이면 버튼을 아예 보여 주지 않는다.
 */
(() => {
  const btn = document.getElementById('installBtn');
  const sheet = document.getElementById('installHelp');
  if (!btn) return;

  const isStandalone = () =>
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  const isIOS = () =>
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // 아이패드는 데스크탑 사파리로 위장한다
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  let deferred = null;

  const show = mode => {
    btn.hidden = false;
    btn.dataset.mode = mode;
  };
  const hide = () => { btn.hidden = true; };

  if (isStandalone()) {
    hide();
  } else if (isIOS()) {
    show('ios');                       // 설치 프롬프트가 없는 환경 → 안내로 대체
  }

  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();                // 브라우저 기본 배너를 막고 우리 버튼으로 유도
    deferred = e;
    if (!isStandalone()) show('prompt');
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    hide();
    closeSheet();
  });

  btn.addEventListener('click', async () => {
    if (btn.dataset.mode === 'prompt' && deferred) {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      deferred = null;                 // 프롬프트는 재사용할 수 없다
      if (outcome === 'accepted') hide();
      return;
    }
    openSheet();
  });

  function openSheet() {
    if (!sheet) return;
    sheet.hidden = false;
    requestAnimationFrame(() => sheet.classList.add('on'));
  }
  function closeSheet() {
    if (!sheet) return;
    sheet.classList.remove('on');
    setTimeout(() => { sheet.hidden = true; }, 260);
  }

  sheet?.addEventListener('click', e => {
    if (e.target === sheet || e.target.closest('[data-close]')) closeSheet();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet && !sheet.hidden) closeSheet();
  });

  // 설치 상태가 바뀌면(설치 후 실행 등) 버튼도 따라간다
  window.matchMedia('(display-mode: standalone)').addEventListener?.('change', ev => {
    if (ev.matches) hide();
  });

  /* 서비스 워커 — file:// 에서는 등록되지 않는다 */
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).catch(() => {});
    });
  }
})();
