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
    writer.firstChild.nodeValue = 'INKWRITER';
    var ai = document.querySelector('[data-game="kindleai"]');
    ai.firstChild.nodeValue = 'INKDECK AI';
  }
  labels();
  byId('languageToggle').addEventListener('click', labels);
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
