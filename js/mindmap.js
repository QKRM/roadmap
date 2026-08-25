/* 방사형 마인드맵 렌더러
 * - 노드는 한 번만 만들고, 위치/투명도만 매 프레임 보간해서 움직인다.
 * - 접힌 자식은 부모 좌표에 겹쳐 두고 투명도 0으로 숨긴다 → 펼칠 때 자연스럽게 뻗어 나온다.
 */
const MindMap = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  const CFG = {
    rootR: 84,
    domainRadius: 215,        // 주제가 펼쳐져 있을 때 — 안쪽 그룹 라벨
    domainRadiusAlone: 350,   // 전부 접혔을 때 — 도메인이 주인공이 된다
    /* 주제는 일부러 촘촘하게 시작시킨다.
     * 겹친 상태에서 시작해도 separate()가 밀어내며 빈틈 없이 채운다. */
    childRadius: 300,
    childStagger: 92,
    childArc: 40,        // 도메인 하나가 자식에게 쓰는 각도(도)
    minZoom: 0.18,
    maxZoom: 2.4,
    ease: 0.16
  };

  /* 화면이 좁을수록 글자를 키운다. CSS의 폰트 크기와 짝을 이루는 값이라
   * 한쪽만 바꾸면 텍스트가 상자를 넘친다 (style.css의 @media 블록 참고). */
  const FS = window.matchMedia('(max-width: 820px)').matches ? 1.18
           : window.matchMedia('(max-width: 1100px)').matches ? 1.07
           : 1;
  CFG.rootR = Math.round(CFG.rootR * FS);

  let svg, gViewport, gEdges, gNodes;
  let nodes = [];
  let edges = [];
  const byId = new Map();

  const expanded = new Set();
  let levelFilter = new Set([1, 2, 3]);
  let query = '';
  let selectedId = null;
  let onSelect = () => {};

  const view = { k: 1, x: 0, y: 0, tk: 1, tx: 0, ty: 0 };
  let running = false;

  /* ── 유틸 ────────────────────────────────────────── */
  const el = (tag, attrs = {}) => {
    const n = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const rad = d => (d * Math.PI) / 180;

  function wrap(text, max) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        if (!line) { line = word; continue; }
        if ((line + ' ' + word).length <= max) line += ' ' + word;
        else { out.push(line); line = word; }
      }
      out.push(line);
    }
    return out.filter(Boolean);
  }

  /* ── 노드 생성 ───────────────────────────────────── */
  function buildNodes(data) {
    const root = {
      id: 'root', type: 'root', data: data.center,
      lines: wrap(data.center.label, 12),
      color: '#7c9cff', parent: null, w: CFG.rootR * 2, h: CFG.rootR * 2,
      x: 0, y: 0, tx: 0, ty: 0, o: 1, to: 1
    };
    nodes = [root];
    byId.clear();
    byId.set('root', root);

    const step = 360 / data.domains.length;
    data.domains.forEach((d, i) => {
      const angle = -90 + step * i;
      /* 도메인 노드는 그 분야의 대표 주제로 표시한다.
       * 첫 화면에 "자료구조"가 아니라 "배열·연결 리스트 직접 구현"이 보여야 한다. */
      const lead = d.projects.find(p => p.lead) || d.projects[0];
      const lines = wrap(lead.name, 9);
      const dn = {
        id: d.id, type: 'domain', data: d, lead, lines,
        sub: d.label.replace(/\n/g, ' '),
        color: d.color, parent: root, angle,
        w: clamp(Math.max(...lines.map(l => l.length)) * 15 * FS + 46, 178 * FS, 250 * FS),
        h: lines.length * 21 * FS + 44 * FS,
        lh: 21 * FS, yOff: 10 * FS,
        x: 0, y: 0, tx: 0, ty: 0, o: 0, to: 1
      };
      nodes.push(dn);
      byId.set(dn.id, dn);

      d.projects.filter(p => p !== lead).forEach(p => {
        const pl = wrap(p.name, 9);
        const pn = {
          id: p.id, type: 'project', data: p, lines: pl, color: d.color,
          parent: dn, domain: d, level: p.level,
          w: clamp(Math.max(...pl.map(l => l.length)) * 13.5 * FS + 42, 124 * FS, 210 * FS),
          h: pl.length * 19 * FS + 26 * FS,
          lh: 18 * FS, yOff: 0,
          x: 0, y: 0, tx: 0, ty: 0, o: 0, to: 1
        };
        nodes.push(pn);
        byId.set(pn.id, pn);
      });
    });

    edges = nodes.filter(n => n.parent).map(n => ({ from: n.parent, to: n }));
  }

  /* ── 화면 요소 생성 ──────────────────────────────── */
  function drawNodes() {
    gEdges.textContent = '';
    gNodes.textContent = '';

    edges.forEach(e => {
      e.el = el('path', {
        class: 'edge',
        stroke: e.to.color,
        'stroke-width': e.to.type === 'domain' ? 2.4 : 1.4
      });
      gEdges.appendChild(e.el);
    });

    nodes.forEach(n => {
      const g = el('g', { class: `node node-${n.type}`, tabindex: '0', role: 'button' });
      g.dataset.id = n.id;

      if (n.type === 'root') {
        g.appendChild(el('circle', { class: 'box', r: CFG.rootR, filter: 'url(#glow)' }));
      } else {
        g.appendChild(el('rect', {
          class: 'box',
          x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h,
          rx: 12,
          fill: n.type === 'domain' ? shade(n.color, 0.17) : 'rgba(20,27,43,.96)',
          stroke: n.type === 'domain' ? n.color : shade(n.color, 0.55)
        }));
      }

      // 도메인 노드는 위에 분야명, 아래에 대표 주제 이름
      if (n.type === 'domain') {
        const sub = el('text', { class: 'label sublabel', x: 0, y: -n.h / 2 + 17 * FS });
        sub.style.fill = n.color;
        sub.textContent = n.sub;
        g.appendChild(sub);
      }

      // 라벨
      const t = el('text', { class: 'label' });
      const total = n.lines.length;
      const lh = n.type === 'root' ? 24 * FS : n.lh;
      const yOff = n.type === 'root' ? -10 * FS : n.yOff;
      n.lines.forEach((line, i) => {
        const ts = el('tspan', { x: 0, y: yOff + (i - (total - 1) / 2) * lh });
        ts.textContent = line;
        t.appendChild(ts);
      });
      g.appendChild(t);

      if (n.type === 'root') {
        const total = ROADMAP.domains.reduce((a, d) => a + d.projects.length, 0);
        const sub = el('text', { class: 'label sub', x: 0, y: 32 * FS });
        sub.textContent = `${ROADMAP.domains.length}개 분야 · ${total}개 주제`;
        g.appendChild(sub);

        const act = el('text', { class: 'label sub act', x: 0, y: 51 * FS });
        g.appendChild(act);
        n.actionEl = act;
      }

      // 접힌 도메인에만 "+N개 더" 배지를 띄운다
      if (n.type === 'domain') {
        const bx = el('rect', {
          class: 'badge-bg',
          x: n.w / 2 - 34 * FS, y: n.h / 2 - 9.5 * FS,
          width: 44 * FS, height: 20 * FS, rx: 10 * FS, fill: n.color
        });
        const bt = el('text', {
          class: 'label count', x: n.w / 2 - 12 * FS, y: n.h / 2 + 0.5 * FS, fill: '#0b0f1a'
        });
        g.appendChild(bx);
        g.appendChild(bt);
        n.countEl = bt;
        n.badgeEl = bx;

        g.appendChild(el('circle', {
          class: 'lvdot', cx: -n.w / 2 + 13 * FS, cy: -n.h / 2 + 13 * FS, r: 4 * FS,
          fill: LEVELS[n.lead.level].color
        }));
      }

      if (n.type === 'project') {
        g.appendChild(el('circle', {
          class: 'lvdot', cx: -n.w / 2 + 12 * FS, cy: -n.h / 2 + 11 * FS, r: 4 * FS,
          fill: LEVELS[n.level].color
        }));
      }

      g.addEventListener('click', ev => { ev.stopPropagation(); activate(n); });
      g.addEventListener('keydown', ev => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); activate(n); }
      });

      n.el = g;
      gNodes.appendChild(g);
    });
  }

  function shade(hex, alpha) {
    const h = hex.replace('#', '');
    const r = parseInt(h.slice(0, 2), 16),
          g = parseInt(h.slice(2, 4), 16),
          b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* ── 표시 여부 & 레이아웃 ────────────────────────── */
  const projectVisible = n =>
    n.type === 'project' && levelFilter.has(n.level) && expanded.has(n.parent.id);

  /* 대표 주제는 별도 노드가 없고 도메인 노드가 대신한다.
   * 주제 id로 들어온 요청을 실제 노드 id로 옮겨 준다. */
  function resolve(id) {
    if (byId.has(id)) return id;
    const d = nodes.find(n => n.type === 'domain' && n.lead && n.lead.id === id);
    return d ? d.id : id;
  }

  function matches(n) {
    if (!query) return true;
    const p = n.type === 'domain' ? n.lead : n.data;
    const hay = [
      p.name, p.tag, p.why, p.goal,
      (p.stack || []).join(' '),
      (p.deliver || []).join(' '),
      (p.concepts || []).map(c => c.t + ' ' + c.d).join(' '),
      (p.focus || []).map(f => f.t).join(' ')
    ].join(' ').toLowerCase();
    return hay.includes(query);
  }

  function layout() {
    const root = byId.get('root');
    root.tx = 0; root.ty = 0; root.to = 1;

    /* 화면 비율에 맞춰 타원으로 편다.
     * 화면 비율만 보면 안 된다 — 노드 상자에는 고정 폭이 있어서,
     * 가로 여유와 세로 여유가 같아지는 지점을 상자 크기까지 넣어 계산한다. */
    const rect = svg.getBoundingClientRect();
    const availW = Math.max(200, rect.width - panelPad() - padFor() * 2);
    const availH = Math.max(200, rect.height - topPadFor() - botPadFor());
    const open = expanded.size > 0;
    const R = open ? CFG.childRadius + 6 * 14 + CFG.childStagger : CFG.domainRadiusAlone;
    const bw = (open ? 200 : 230) * FS, bh = (open ? 74 : 92) * FS;
    const sx = clamp((availW * (2 * R + bh) / availH - bw) / (2 * R), 0.45, 2.0);

    const dr = expanded.size ? CFG.domainRadius : CFG.domainRadiusAlone;

    nodes.filter(n => n.type === 'domain').forEach(d => {
      const a = rad(d.angle);
      d.tx = Math.cos(a) * dr * sx;
      d.ty = Math.sin(a) * dr;
      d.to = 1;

      const kids = nodes.filter(n => n.parent === d && levelFilter.has(n.level));
      const open = expanded.has(d.id);
      const n = kids.length;

      kids.forEach((c, i) => {
        if (!open || n === 0) {
          c.tx = d.tx; c.ty = d.ty; c.to = 0;
          return;
        }
        // 자식이 적으면 부채꼴을 좁게 — 넓게 벌리면 부모와 끊어져 보인다
        const arc = Math.min(CFG.childArc, 9.5 * (n - 1));
        const off = n === 1 ? 0 : (i / (n - 1) - 0.5) * arc;
        const ca = rad(d.angle + off);
        const r = CFG.childRadius + n * 14 + (n >= 3 ? (i % 2) * CFG.childStagger : 0);
        c.tx = Math.cos(ca) * r * sx;
        c.ty = Math.sin(ca) * r;
        c.to = 1;
      });

      // 필터로 빠진 자식은 완전히 숨김
      nodes.filter(x => x.parent === d && !levelFilter.has(x.level))
        .forEach(x => { x.tx = d.tx; x.ty = d.ty; x.to = 0; });

      // 배지는 접었을 때만 — 펼친 상태에선 주제가 다 보이므로 군더더기
      if (d.countEl) {
        d.countEl.textContent = open ? '' : '+' + kids.length;
        d.badgeEl.style.opacity = open || !kids.length ? 0 : .95;
      }
    });

    const rootNode = byId.get('root');
    if (rootNode.actionEl) {
      rootNode.actionEl.textContent =
        expanded.size >= ROADMAP.domains.length ? '클릭 · 전부 접기' : '클릭 · 전부 펼치기';
    }

    separate();

    // 검색 강조 (투명도는 tick에서 곱해 준다 — 인라인 style이 클래스를 이기기 때문)
    nodes.forEach(n => {
      if (n.type === 'root') { n.dim = false; return; }
      const hit = query && matches(n);
      n.dim = !!query && !hit;
      n.el.classList.toggle('hit', !!hit);
    });

    kick();
  }

  /* 각도 배치만으로는 넓은 상자끼리 겹칠 수 있다.
   * 보이는 노드끼리 AABB 충돌을 검사해 침투가 적은 축으로 밀어낸다.
   * 도메인·중심 노드는 고정, 주제 노드만 움직인다. */
  function separate(iterations = 90, pad = 13) {
    // 중심 노드만 고정. 도메인도 밀릴 수 있어야 좁은 화면에서 라벨이 겹치지 않는다.
    const movable = nodes.filter(n => n.type !== 'root' && n.to > .5);
    if (!movable.length) return;
    const root = byId.get('root');
    const all = movable.concat([{
      tx: root.tx, ty: root.ty,
      w: CFG.rootR * 2, h: CFG.rootR * 2, fixed: true
    }]);

    for (let it = 0; it < iterations; it++) {
      let hit = false;
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i], b = all[j];
          if (a.fixed && b.fixed) continue;
          const dx = b.tx - a.tx, dy = b.ty - a.ty;
          const ox = (a.w + b.w) / 2 + pad - Math.abs(dx);
          const oy = (a.h + b.h) / 2 + pad - Math.abs(dy);
          if (ox <= 0 || oy <= 0) continue;
          hit = true;
          const sx = dx === 0 ? (i % 2 ? 1 : -1) : Math.sign(dx);
          const sy = dy === 0 ? (i % 2 ? 1 : -1) : Math.sign(dy);
          // 침투가 얕은 축으로만 민다 → 원래 배치가 최대한 유지된다
          const useX = ox < oy;
          const push = (useX ? ox : oy) * 0.5;
          const px = useX ? sx * push : 0;
          const py = useX ? 0 : sy * push;
          if (a.fixed) { b.tx += px * 2; b.ty += py * 2; }
          else if (b.fixed) { a.tx -= px * 2; a.ty -= py * 2; }
          else { a.tx -= px; a.ty -= py; b.tx += px; b.ty += py; }
        }
      }
      if (!hit) break;
    }
  }

  /* ── 애니메이션 루프 ─────────────────────────────── */
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }

  function tick() {
    let moving = false;
    const e = CFG.ease;

    for (const n of nodes) {
      const dx = n.tx - n.x, dy = n.ty - n.y, doo = n.to - n.o;
      if (Math.abs(dx) > .3 || Math.abs(dy) > .3 || Math.abs(doo) > .004) moving = true;
      n.x += dx * e; n.y += dy * e; n.o += doo * e;
      const dimF = n.dim ? .14 : 1;
      if (Math.abs((n.df ?? 1) - dimF) > .004) { n.df = (n.df ?? 1) + (dimF - (n.df ?? 1)) * e; moving = true; }
      n.el.setAttribute('transform', `translate(${n.x.toFixed(1)},${n.y.toFixed(1)})`);
      n.el.style.opacity = (n.o * (n.df ?? 1)).toFixed(3);
      n.el.style.pointerEvents = n.o < .35 ? 'none' : 'auto';
    }

    for (const ed of edges) {
      const o = Math.min(ed.from.o, ed.to.o) * (ed.to.df ?? 1);
      ed.el.setAttribute('d', curve(ed.from, ed.to));
      ed.el.setAttribute('opacity', (o * (ed.to.type === 'domain' ? .5 : .38)).toFixed(3));
    }

    const dk = view.tk - view.k, dvx = view.tx - view.x, dvy = view.ty - view.y;
    if (Math.abs(dk) > .0008 || Math.abs(dvx) > .4 || Math.abs(dvy) > .4) moving = true;
    view.k += dk * 0.2; view.x += dvx * 0.2; view.y += dvy * 0.2;
    gViewport.setAttribute('transform',
      `translate(${view.x.toFixed(2)},${view.y.toFixed(2)}) scale(${view.k.toFixed(4)})`);

    if (moving) requestAnimationFrame(tick);
    else running = false;
  }

  function curve(a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const cx = mx + (-dy / len) * len * 0.09;
    const cy = my + (dx / len) * len * 0.09;
    return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }

  /* ── 상호작용 ────────────────────────────────────── */
  let dragMoved = 0;   // 드래그 직후의 click 이벤트를 무시하기 위한 값

  function activate(n) {
    if (dragMoved > 8) return;

    // 중심 노드 = 전체 펼치기 / 접기 스위치
    if (n.type === 'root') {
      setAll(expanded.size < ROADMAP.domains.length);
    }

    if (n.type === 'domain') {
      expanded.has(n.id) ? expanded.delete(n.id) : expanded.add(n.id);
      layout();
      setTimeout(() => fit(), 60);
    }
    select(n.id);
    onSelect(n);
  }

  function setAll(on) {
    expanded.clear();
    if (on) ROADMAP.domains.forEach(d => expanded.add(d.id));
    layout();
    setTimeout(() => fit(), 60);
  }

  function select(id) {
    selectedId = id ? resolve(id) : null;
    nodes.forEach(n => n.el.classList.toggle('selected', n.id === selectedId));
  }

  function bounds() {
    const vis = nodes.filter(n => n.to > .5);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const n of vis) {
      const hw = n.type === 'root' ? CFG.rootR : n.w / 2;
      const hh = n.type === 'root' ? CFG.rootR : n.h / 2;
      x0 = Math.min(x0, n.tx - hw); x1 = Math.max(x1, n.tx + hw);
      y0 = Math.min(y0, n.ty - hh); y1 = Math.max(y1, n.ty + hh);
    }
    return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
  }

  /* 데스크탑에서 패널이 열려 있으면 그만큼 오른쪽을 비워 둔다 */
  function panelPad() {
    if (window.innerWidth <= 820) return 0;
    if (!document.body.classList.contains('panel-open')) return 0;
    return Math.min(460, window.innerWidth * 0.92);
  }

  /* 화면이 좁을수록 가장자리 여백을 줄인다 — 좁은 화면에서 여백은 사치다 */
  function padFor() {
    return clamp(window.innerWidth * 0.045, 11, 54);
  }

  /* 상단바 높이는 화면 폭에 따라 달라진다. 상수로 박아 두면 좁은 화면에서
   * 노드가 바 밑으로 들어가거나 아래 공간이 남는다 — 실제로 재서 쓴다. */
  function topPadFor() {
    const bar = document.querySelector('.topbar');
    return (bar ? bar.getBoundingClientRect().height : 64) + 10;
  }
  function botPadFor() {
    // 데스크탑은 힌트 바, 모바일은 하단의 설치 버튼을 피한다
    return window.innerWidth <= 820 ? 54 : 52;
  }

  function fit(pad = padFor()) {
    const r = svg.getBoundingClientRect();
    const b = bounds();
    if (!isFinite(b.w) || b.w <= 0) return;
    const topPad = topPadFor();
    const botPad = botPadFor();
    const availW = Math.max(240, r.width - panelPad());
    const availH = Math.max(200, r.height - topPad - botPad);
    const k = clamp(Math.min((availW - pad * 2) / b.w, (availH - pad) / b.h),
                    CFG.minZoom, 1.1);
    view.tk = k;
    view.tx = availW / 2 - (b.x0 + b.w / 2) * k;
    view.ty = topPad + availH / 2 - (b.y0 + b.h / 2) * k;
    kick();
  }

  /* 확대 배율은 그대로 두고, 노드가 가려졌을 때만 그만큼 밀어 준다.
   * 패널이 열릴 때마다 전체를 다시 맞추면 글자가 작아져서 읽기 나빠진다. */
  function ensureVisible(id, margin = 30) {
    const n = byId.get(resolve(id));
    if (!n) return;
    const r = svg.getBoundingClientRect();
    const k = view.tk;
    const left = margin, right = r.width - panelPad() - margin;
    const top = topPadFor() + margin, bottom = r.height - botPadFor() - margin;

    const x0 = view.tx + (n.tx - n.w / 2) * k, x1 = view.tx + (n.tx + n.w / 2) * k;
    const y0 = view.ty + (n.ty - n.h / 2) * k, y1 = view.ty + (n.ty + n.h / 2) * k;

    if (x1 - x0 > right - left || y1 - y0 > bottom - top) { fit(); return; }
    if (x1 > right) view.tx -= x1 - right; else if (x0 < left) view.tx += left - x0;
    if (y1 > bottom) view.ty -= y1 - bottom; else if (y0 < top) view.ty += top - y0;
    kick();
  }

  function focus(id, scale = 0.85) {
    const n = byId.get(resolve(id));
    if (!n) return;
    const r = svg.getBoundingClientRect();
    const availW = Math.max(240, r.width - panelPad());
    view.tk = scale;
    view.tx = availW / 2 - n.tx * scale;
    view.ty = (r.height + topPadFor() - botPadFor()) / 2 - n.ty * scale;
    kick();
  }

  function zoomBy(f) {
    const r = svg.getBoundingClientRect();
    zoomAt(r.width / 2, r.height / 2, f);
  }

  function zoomAt(px, py, f) {
    const k2 = clamp(view.tk * f, CFG.minZoom, CFG.maxZoom);
    const real = k2 / view.tk;
    view.tx = px - (px - view.tx) * real;
    view.ty = py - (py - view.ty) * real;
    view.tk = k2;
    kick();
  }

  function bindPanZoom() {
    let dragging = false, lx = 0, ly = 0, pid = null;
    const pts = new Map();
    let pinchDist = 0;

    // setPointerCapture는 쓰지 않는다 — 캡처하면 click 이벤트가 svg로 가로채여
    // 노드의 클릭 핸들러가 호출되지 않는다. 대신 window에서 move/up을 듣는다.
    svg.addEventListener('pointerdown', e => {
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        dragging = true; dragMoved = 0; pid = e.pointerId;
        lx = e.clientX; ly = e.clientY;
        svg.classList.add('grabbing');
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        dragging = false;
      }
    });

    window.addEventListener('pointermove', e => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) {
          const r = svg.getBoundingClientRect();
          zoomAt((a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top, d / pinchDist);
        }
        pinchDist = d;
        return;
      }
      if (!dragging || e.pointerId !== pid) return;
      const dx = e.clientX - lx, dy = e.clientY - ly;
      lx = e.clientX; ly = e.clientY;
      dragMoved += Math.abs(dx) + Math.abs(dy);
      view.tx += dx; view.ty += dy;
      view.x += dx; view.y += dy;
      kick();
    });

    const end = e => {
      pts.delete(e.pointerId);
      if (pts.size < 2) pinchDist = 0;
      if (e.pointerId === pid) { dragging = false; svg.classList.remove('grabbing'); }
    };
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    svg.addEventListener('wheel', e => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * 0.0016));
    }, { passive: false });
  }

  /* ── 공개 API ────────────────────────────────────── */
  function init(opts) {
    svg = document.getElementById('map');
    gViewport = document.getElementById('viewport');
    gEdges = document.getElementById('edges');
    gNodes = document.getElementById('nodes');
    onSelect = opts.onSelect || onSelect;

    buildNodes(ROADMAP);
    drawNodes();
    // 첫 화면은 도메인별 대표 주제만 — 클릭하면 나머지가 펼쳐진다
    layout();

    // 초기 진입 애니메이션: 확대 상태에서 펼쳐지듯 들어온다
    view.k = 0.25; view.x = 0; view.y = 0;
    fit();
    bindPanZoom();
    // 비율이 바뀌면 배치 자체를 다시 잡아야 한다
    let rt;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => { layout(); fit(); }, 120);
    });
  }

  return {
    init,
    layout,
    fit,
    focus,
    ensureVisible,
    select,
    zoomBy,
    get expanded() { return expanded; },
    setLevels(set) { levelFilter = set; layout(); },
    setQuery(q) {
      query = (q || '').trim().toLowerCase();
      if (query) {
        ROADMAP.domains.forEach(d => {
          if (d.projects.some(p => byId.get(p.id) && matches(byId.get(p.id)))) expanded.add(d.id);
        });
      }
      layout();
      fit();
    },
    expandAll: setAll,
    get allExpanded() { return expanded.size >= ROADMAP.domains.length; },
    node: id => byId.get(id)
  };
})();
