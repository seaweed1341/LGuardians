// BinBird resource binding for LGuardians.
// Expected files live under ./assets/binbirds/binbird-{1..6}/
(() => {
  const AGENT_TO_BIRD = {
    collect: 1,
    validate: 2,
    attack: 3,
    defense: 4,
    internal: 5,
    opensource: 6,
  };

  const AVAILABLE_STATES = {
    1: ['working', 'waiting', 'sleeping', 'error'],
    2: ['working', 'waiting', 'sleeping', 'error'],
    3: ['working', 'waiting', 'sleeping', 'win', 'lose', 'error'],
    4: ['working', 'waiting', 'sleeping', 'win', 'lose', 'error'],
    5: ['stand', 'working', 'waiting', 'sleeping', 'error'],
    6: ['working', 'waiting', 'sleeping', 'error'],
  };

  const STATE_LABELS = {
    stand: '기본',
    working: '작업 중',
    waiting: '대기',
    sleeping: '수면',
    win: '승리',
    lose: '패배',
    error: '오류',
  };

  const FALLBACK_STATE = {
    1: 'waiting',
    2: 'waiting',
    3: 'waiting',
    4: 'waiting',
    5: 'stand',
    6: 'waiting',
  };

  function normalizeState(number, state) {
    const requested = typeof state === 'string' ? state : state ? 'working' : 'waiting';
    return AVAILABLE_STATES[number].includes(requested) ? requested : FALLBACK_STATE[number];
  }

  function srcFor(number, state) {
    return `./assets/binbirds/binbird-${number}/${state}.webp`;
  }

  // Override the lightweight placeholder renderer from app.js.
  window.bird = bird = function (id, state = true) {
    const agent = agents.find(item => item.id === id) || agents[0];
    const number = AGENT_TO_BIRD[id] || 1;
    const status = normalizeState(number, state);
    const label = STATE_LABELS[status] || status;
    return `<img class="bird binbird-image ${status}" src="${srcFor(number, status)}" alt="빈버드 ${number} · ${agent.name} · ${label}" draggable="false" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'bird bird-placeholder '+this.classList[2],textContent:'이미지'}))">`;
  };

  window.BINBIRD_RESOURCE_MAP = { AGENT_TO_BIRD, AVAILABLE_STATES, srcFor };

  const style = document.createElement('style');
  style.textContent = `
    .binbird-image{object-fit:contain;object-position:center;max-width:100%;border:0;background:transparent;user-select:none;-webkit-user-drag:none}
    .bird-placeholder{display:grid!important;place-items:center;background:#f4f4f4;border:1px dashed #c6c6c6;color:#8d8d8d;font-size:11px}
  `;
  document.head.appendChild(style);

  // app.js renders before this deferred file, so refresh once with the resource-aware renderer.
  if (typeof render === 'function') render();
})();
