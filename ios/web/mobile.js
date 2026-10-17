(function () {
  'use strict';
  var byId = function (id) { return document.getElementById(id); };
  // Mesquite's updater, shell server and filesystem plugins have no iOS equivalent.
  ['files','updates','plugins'].forEach(function (game) {
    document.querySelectorAll('[data-game="'+game+'"], [data-category="plugins"]').forEach(function (node) { node.remove(); });
  });
  byId('exit').remove();
  byId('back').textContent = '‹ MENU';
  function labels() {
    var en = InkDeck.settingGet('language','pl') === 'en';
    ['tttAI','chessAI','checkersAI'].forEach(function (id) { byId(id).textContent = en ? 'VS BOT' : 'Z BOTEM'; });
    document.querySelectorAll('.menuButton span').forEach(function (n) {
      if (/Kindle/.test(n.textContent)) n.textContent = en ? 'against the bot or with two players' : 'gra z botem lub dla dwóch osób';
    });
    var writer = document.querySelector('[data-game="writer"]');
    writer.firstChild.nodeValue = 'InkWriter';
    var ai = document.querySelector('[data-game="kindleai"]');
    ai.firstChild.nodeValue = 'Ink AI';
  }
  labels();
  byId('languageToggle').addEventListener('click', labels);
  var icons = {ttt:'\u2715',mine:'\u2691',g2048:'2048',memory:'\u25d2',chess:'\u265e',checkers:'\u25cf',
    lights:'\u2600',life:'\u2733',snake:'\u219d',sudoku:'\u25a6',nonogram:'\u25a7',mahjongconnect:'\u2637',
    ludo:'\u2684',papersoccer:'\u26bd',wordle:'W',fifteen:'15',mastermind:'\u25c9',hanoi:'\u25b3',
    writer:'Aa',draw:'\u270e',todo:'\u2713',calc:'\u00f7',kindleai:'AI'};
  var palette = [['#2563eb','#eff6ff'],['#dc2626','#fef2f2'],['#7c3aed','#f5f3ff'],['#08916b','#ecfdf5'],['#b45309','#fffbeb'],['#0369a1','#f0f9ff']];
  document.querySelectorAll('.menuButton').forEach(function (button,i) {
    var game=button.getAttribute('data-game'), color=palette[i%palette.length];
    button.setAttribute('data-icon',icons[game]||'\u25c7');
    button.setAttribute('aria-label',button.firstChild.nodeValue.trim());
    button.style.setProperty('--accent',color[0]);button.style.setProperty('--tile-bg',color[1]);
  });
  function fitMenu() {
    var menu=byId('menu'), grid=byId('menuItems');
    if (!menu.classList.contains('active')) return;
    var visible=Array.from(grid.querySelectorAll('.menuButton')).filter(function(n){return !n.classList.contains('hidden');});
    var columns=menu.clientWidth>=700?5:(menu.clientWidth>menu.clientHeight*1.5?6:3);
    grid.style.setProperty('--menu-cols',columns);
    grid.style.setProperty('--menu-rows',Math.max(1,Math.ceil(visible.length/columns)));
    grid.style.maxHeight=(Math.ceil(visible.length/columns)*88)+'px';
  }
  new MutationObserver(fitMenu).observe(byId('menuItems'),{subtree:true,attributes:true,attributeFilter:['class']});
  new MutationObserver(fitMenu).observe(byId('menu'),{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',fitMenu);
  fitMenu();
  var directions = {snakeUp:'↑',snakeDown:'↓',snakeLeft:'←',snakeRight:'→'};
  Object.keys(directions).forEach(function (id) {
    var button = byId(id); button.textContent = directions[id];
    button.setAttribute('aria-label', id.replace('snake',''));
    // React on contact; suppress the follow-up click to avoid double input.
    var original = button.onclick;
    button.onpointerdown = function (e) { if (e.isPrimary) { e.preventDefault(); original(); } };
    button.onclick = function (e) { if (e.detail === 0) original(); };
  });
  var start = null, board = byId('snakeBoard');
  board.addEventListener('touchstart', function (e) { start = e.touches[0]; }, {passive:true});
  board.addEventListener('touchend', function (e) {
    if (!start) return;
    var end = e.changedTouches[0], dx = end.clientX-start.clientX, dy = end.clientY-start.clientY;
    start = null;
    if (Math.max(Math.abs(dx),Math.abs(dy)) < 18) return;
    var id = Math.abs(dx)>Math.abs(dy) ? (dx>0?'snakeRight':'snakeLeft') : (dy>0?'snakeDown':'snakeUp');
    byId(id).onclick({detail:0}); e.preventDefault();
  }, {passive:false});
  ['move2048Up','move2048Left','move2048Down','move2048Right'].forEach(function (id, i) {
    byId(id).textContent = ['↑','←','↓','→'][i];
    byId(id).setAttribute('aria-label', id.replace('move2048',''));
  });
  var resizeTimer;
  function resize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 100);
  }
  // Rotation, iPad multitasking and the software keyboard can all change the viewport.
  if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
}());
