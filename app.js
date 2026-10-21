(function () {
  $('#t-o').innerHTML = ICON.list; $('#t-m').innerHTML = ICON.user;
  let filter = 'new', flashIds = new Set();
  const F = [
    ['new', 'Naye', o => o.status === 'placed'],
    ['kitchen', 'Kitchen', o => o.status === 'accepted' || o.status === 'preparing'],
    ['ready', 'Ready', o => o.status === 'ready' || o.status === 'out_for_delivery'],
    ['done', 'Done', o => o.status === 'completed' || o.status === 'cancelled']
  ];
  function tab(n) { $$('.view').forEach(v => v.classList.toggle('active', v.id === 'v-' + n)); $$('.tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === n)); $('#fab').classList.toggle('hide', n !== 'orders'); scrollTo(0, 0); }
  $('.tabbar').onclick = e => { const b = e.target.closest('button'); if (b) tab(b.dataset.tab); };

  function render(orders, fresh) {
    (fresh || []).forEach(o => flashIds.add(o.id));
    const todayStart = startOfDay(dayStr()).getTime();
    $('#filters').innerHTML = F.map(([k, l, fn]) => { const n = orders.filter(fn).filter(o => k !== 'done' || new Date(o.created_at).getTime() >= todayStart).length; return `<button data-f="${k}" class="${filter === k ? 'on' : ''}">${l}${k !== 'done' && n ? ` <span class="pill red" style="padding:1px 6px">${n}</span>` : ''}</button>`; }).join('');
    const nNew = orders.filter(F[0][2]).length, dot = $('#new-dot'); dot.textContent = nNew; dot.classList.toggle('hide', !nNew);
    document.title = (nNew ? `(${nNew}) ` : '') + 'Sone · Waiter';
    const fn = F.find(x => x[0] === filter)[2];
    let list = orders.filter(fn); if (filter === 'done') list = list.filter(o => new Date(o.created_at).getTime() >= todayStart);
    if (filter !== 'done') list = list.slice().reverse();   // purane pehle (kitchen queue)
    $('#olist').innerHTML = list.length ? list.map(o => Staff.card(o, { flash: flashIds.has(o.id) })).join('') : `<div class="empty"><div class="big">${filter === 'new' ? '😌' : '🍽️'}</div>${filter === 'new' ? 'Koi naya order nahi' : 'Yahan abhi kuch nahi'}</div>`;
    setTimeout(() => flashIds.clear(), 4000);
  }
  $('#filters').onclick = e => { const b = e.target.closest('[data-f]'); if (!b) return; filter = b.dataset.f; render(Staff.orders, []); };
  Staff.bindCards($('#olist'));
  Staff.onOrders = render;
  $('#fab').onclick = () => Staff.takeOrder();

  /* settings */
  $('#sw-sound').checked = !ls.get('sone_mute', false); $('#sw-sound').onchange = e => ls.set('sone_mute', !e.target.checked);
  $('#test-sound').onclick = () => { chime(2); speak('Naya order aaya hai'); };
  $('#logout').onclick = () => Staff.logout();
  let lock = null;
  async function wake(on) { try { if (on && 'wakeLock' in navigator) lock = await navigator.wakeLock.request('screen'); else if (lock) { lock.release(); lock = null; } } catch (e) {} }
  $('#sw-wake').checked = ls.get('sone_wake', true); $('#sw-wake').onchange = e => { ls.set('sone_wake', e.target.checked); wake(e.target.checked); };
  document.addEventListener('visibilitychange', () => { if (!document.hidden && ls.get('sone_wake', true)) wake(true); });

  Staff.init({
    roles: ['waiter', 'owner'], title: 'Waiter & Kitchen', subtitle: 'Sone Restaurant · staff login',
    onReady(me) { $('#me-name').textContent = me.name; $('#me-role').textContent = me.role === 'owner' ? 'Owner' : 'Waiter'; Staff.startLive(); if (ls.get('sone_wake', true)) wake(true); }
  });
  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
