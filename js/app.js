/* UI 배선: 상세 패널, 검색, 학년 필터, 해시 라우팅 */
(() => {
  const panel = document.getElementById('panel');
  const body = document.getElementById('panelBody');
  const scrim = document.getElementById('scrim');
  const searchInput = document.getElementById('search');
  const hint = document.getElementById('hint');

  const esc = s => String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const domainOf = id => ROADMAP.domains.find(d => d.projects.some(p => p.id === id));

  /* ── 패널 ────────────────────────────────────────── */
  function openPanel(html, keepId) {
    body.innerHTML = html;
    body.scrollTop = 0;
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    scrim.classList.add('on');
    document.body.classList.add('panel-open');
    // 배율은 유지하고, 패널에 가려졌을 때만 밀어 준다
    if (keepId) setTimeout(() => MindMap.ensureVisible(keepId), 60);
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    scrim.classList.remove('on');
    document.body.classList.remove('panel-open');
    MindMap.select(null);
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  function list(items) {
    return `<ul class="p-list">${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>`;
  }

  function renderRoot() {
    const total = ROADMAP.domains.reduce((a, d) => a + d.projects.length, 0);
    openPanel(`
      <div class="p-kicker">시작하기</div>
      <h2>다음에 뭘 공부할까?</h2>
      <p class="p-tag">${esc(ROADMAP.center.desc)}</p>

      <div class="p-section">
        <h3>이 로드맵 쓰는 법</h3>
        ${list([
          '가운데를 둘러싼 10개가 전공 분야별 대표 주제다. 클릭하면 상세가 열린다.',
          '동시에 같은 분야의 다른 주제가 펼쳐진다 (+N 배지가 그 개수).',
          '한 번 더 클릭하면 다시 접힌다. "전체 펼치기"로 50개를 한꺼번에 볼 수도 있다.',
          '학년 필터로 지금 감당되는 것만 골라 볼 수 있다.',
          '학기 시간표에 있는 과목부터 열고, 거기서 연결된 분야로 넘어간다.'
        ])}
      </div>

      <div class="p-section">
        <h3>주제를 열면 나오는 것</h3>
        ${list([
          '무엇을 할 수 있으면 끝인가 — 완료 판정 체크리스트. 이게 다 되면 그 주제는 끝난 것이다.',
          '공부하면서 중점적으로 볼 것 — 대부분이 막히는 지점과 그 이유.',
          '같이 공부하면 좋은 개념 — 검색할 키워드와 한 줄 정의.',
          '이 순서로 시작한다 — 첫날부터의 진행 순서.'
        ])}
      </div>

      <div class="p-section">
        <h3>자습 요령</h3>
        ${list([
          '읽기만으로는 끝나지 않는다. 모든 주제에 손으로 만드는 산출물이 하나씩 있다.',
          '개념을 설명해 보고 막히는 문장이 나오면 거기가 진짜 모르는 지점이다.',
          '과제·시험 범위와 로드맵이 겹치면 로드맵을 시험 준비로 쓴다. 두 번 하지 않는다.',
          '막히면 분야를 바꾸지 말고 난이도를 낮춘다 — 같은 분야의 아래 학년 주제로 내려간다.',
          '구현한 코드와 정리 노트는 전부 하나의 저장소에 모은다. 그게 3학년 이후의 이력서다.'
        ])}
      </div>

      <div class="p-section">
        <h3>규모</h3>
        <p>${ROADMAP.domains.length}개 분야 · ${total}개 주제</p>
      </div>

      <div class="p-section">
        <h3>분야 바로가기</h3>
        <div class="p-jump">
          ${ROADMAP.domains.map(d =>
            `<button data-goto="${d.id}">${esc(d.label.replace(/\n/g, ' '))}</button>`).join('')}
        </div>
      </div>
    `);
  }

  function renderDomain(d) {
    const byLevel = n => d.projects.filter(p => p.level === n);
    openPanel(`
      <div class="p-kicker" style="--k:${d.color}">도메인</div>
      <h2>${esc(d.label.replace(/\n/g, ' '))}</h2>
      <p class="p-tag">${esc(d.summary)}</p>
      <div class="chips">
        <span class="chip">★ 대표 주제 · ${esc((d.projects.find(p => p.lead) || d.projects[0]).name)}</span>
      </div>

      <div class="p-section">
        <h3>먼저 알아 둘 것</h3>
        ${list(d.knowledge)}
      </div>

      ${[1, 2, 3].map(lv => {
        const ps = byLevel(lv);
        if (!ps.length) return '';
        return `
        <div class="p-section">
          <h3><span class="badge" style="--c:${LEVELS[lv].color}">${LEVELS[lv].label}</span></h3>
          <div class="p-jump">
            ${ps.map(p => `<button data-goto="${p.id}">${p.lead ? '★ ' : ''}${esc(p.name)}</button>`).join('')}
          </div>
        </div>`;
      }).join('')}
    `);
  }

  function renderProject(p) {
    const d = domainOf(p.id);
    const lv = LEVELS[p.level];
    openPanel(`
      <div class="p-kicker" style="--k:${d.color}">${esc(d.label.replace(/\n/g, ' '))}</div>
      <h2>${esc(p.name)}</h2>
      <p class="p-tag">${esc(p.tag)}</p>
      <div class="chips">
        <span class="badge" style="--c:${lv.color}">${lv.label}</span>
        ${p.stack.map(s => `<span class="chip">${esc(s)}</span>`).join('')}
      </div>

      <div class="prompt-box" style="--k:${d.color}">
        <div class="prompt-head">
          <span>이걸 답할 수 있으면 안다</span>
          <button class="copy-btn" data-copy="${esc(p.check)}">복사</button>
        </div>
        <p>${esc(p.check)}</p>
      </div>

      <div class="p-section">
        <h3>왜 배우나</h3>
        <p>${esc(p.why)}</p>
      </div>

      <div class="p-section" style="--k:${d.color}">
        <h3>무엇을 할 수 있으면 끝인가</h3>
        <p class="p-goal">${esc(p.goal)}</p>
        <ul class="p-deliver">${p.deliver.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      </div>

      <div class="p-section" style="--k:${d.color}">
        <h3>공부하면서 중점적으로 볼 것</h3>
        <div class="cards">
          ${p.focus.map(f => `
            <div class="card">
              <b>${esc(f.t)}</b>
              <span>${esc(f.d)}</span>
            </div>`).join('')}
        </div>
      </div>

      <div class="p-section">
        <h3>같이 공부하면 좋은 개념</h3>
        <dl class="p-concepts">
          ${p.concepts.map(c => `
            <div>
              <dt>${esc(c.t)}</dt>
              <dd>${esc(c.d)}</dd>
            </div>`).join('')}
        </dl>
      </div>

      <div class="p-section" style="--k:${d.color}">
        <h3>이 순서로 시작한다</h3>
        <ol class="p-steps">${p.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      </div>

      <div class="p-section">
        <h3>여기까지 됐다면 다음은</h3>
        <div class="p-next">${p.next.map(n => `<span>${esc(n)}</span>`).join('')}</div>
      </div>

      ${p.note ? `<div class="callout"><strong>주의 ·</strong> ${esc(p.note)}</div>` : ''}

      <div class="p-section">
        <h3>같은 분야의 다른 주제</h3>
        <div class="p-jump">
          ${d.projects.filter(x => x.id !== p.id)
            .map(x => `<button data-goto="${x.id}">${esc(x.name)}</button>`).join('')}
          <button data-goto="${d.id}">${esc(d.label.replace(/\n/g, ' '))} 분야 개요 →</button>
        </div>
      </div>
    `, p.id);
  }

  /* ── 선택 처리 ───────────────────────────────────── */
  function show(id, { focus = false } = {}) {
    if (id === 'root') { renderRoot(); MindMap.select('root'); return; }

    const d = ROADMAP.domains.find(x => x.id === id);
    if (d) {
      if (focus && !MindMap.expanded.has(d.id)) {
        MindMap.expanded.add(d.id);
        MindMap.layout();
      }
      renderDomain(d);
      MindMap.select(id);
      if (focus) setTimeout(() => MindMap.fit(), 80);
      return;
    }
    const dom = domainOf(id);
    if (!dom) return;
    const p = dom.projects.find(x => x.id === id);

    // 대표 주제는 분야 노드 자체이므로 펼칠 필요가 없다.
    // (여기서 펼치면 노드를 눌러 접는 동작이 곧바로 되돌려진다)
    if (!p.lead && !MindMap.expanded.has(dom.id)) {
      MindMap.expanded.add(dom.id);
      MindMap.layout();
    }
    renderProject(p);
    MindMap.select(id);
    history.replaceState(null, '', '#' + id);
    if (focus) setTimeout(() => MindMap.focus(id), 80);
  }

  /* ── 초기화 ──────────────────────────────────────── */
  MindMap.init({
    onSelect(n) {
      hint?.classList.add('gone');
      // 분야 노드는 그 분야의 대표 주제를 대신 보여 준다
      show(n.type === 'domain' ? n.lead.id : n.id);
      syncExpandBtn();
    }
  });

  body.addEventListener('click', e => {
    const copy = e.target.closest('[data-copy]');
    if (copy) {
      navigator.clipboard.writeText(copy.dataset.copy).then(() => {
        copy.textContent = '복사됨';
        copy.classList.add('done');
        setTimeout(() => { copy.textContent = '복사'; copy.classList.remove('done'); }, 1600);
      }).catch(() => { copy.textContent = '복사 실패'; });
      return;
    }
    const btn = e.target.closest('[data-goto]');
    if (btn) show(btn.dataset.goto, { focus: true });
  });

  document.getElementById('panelClose').addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closePanel(); searchInput.blur(); }
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  /* 검색 */
  let t;
  searchInput.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => MindMap.setQuery(searchInput.value), 180);
    hint?.classList.add('gone');
  });

  /* 학년 필터 */
  const chips = [...document.querySelectorAll('.lv-chip')];
  chips.forEach(c => c.addEventListener('click', () => {
    c.classList.toggle('on');
    const on = chips.filter(x => x.classList.contains('on'));
    if (!on.length) { c.classList.add('on'); return; }   // 최소 하나는 켜 둔다
    MindMap.setLevels(new Set(on.map(x => +x.dataset.level)));
  }));

  /* 전체 펼치기 */
  const expandBtn = document.getElementById('expandAll');
  function syncExpandBtn() {
    expandBtn.textContent = MindMap.allExpanded ? '전체 접기' : '전체 펼치기';
  }
  syncExpandBtn();
  expandBtn.addEventListener('click', () => {
    MindMap.expandAll(!MindMap.allExpanded);
    syncExpandBtn();
    hint?.classList.add('gone');
  });

  /* 줌 버튼 */
  document.querySelector('.zoom-controls').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.zoom === 'in') MindMap.zoomBy(1.25);
    else if (b.dataset.zoom === 'out') MindMap.zoomBy(0.8);
    else MindMap.fit();
  });

  /* 딥링크 (#topic-id) */
  if (location.hash.length > 1) {
    const id = decodeURIComponent(location.hash.slice(1));
    setTimeout(() => show(id, { focus: true }), 400);
  }

  setTimeout(() => hint?.classList.add('gone'), 9000);
})();
