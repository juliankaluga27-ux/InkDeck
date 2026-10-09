(function () {
  var wordleMenu=document.createElement('button'),wordlePage=document.createElement('div');
  wordleMenu.className='menuButton';wordleMenu.setAttribute('data-category','games');wordleMenu.setAttribute('data-game','wordle');wordleMenu.innerHTML='WORDLE<span>odgadnij polskie słowo</span>';document.getElementById('menuItems').appendChild(wordleMenu);
  wordlePage.id='wordle';wordlePage.className='page';wordlePage.innerHTML='<div class="bar"><span id="wordleStatus">Próba 1 z 6</span><button id="wordleNew" class="small">NOWE</button></div><div class="wordleControls"><select id="wordleLevel"><option value="veryeasy">BARDZO ŁATWY</option><option value="easy">ŁATWY</option><option value="medium" selected>ŚREDNI</option><option value="hard">TRUDNY</option></select><button id="wordleHint">PODPOWIEDŹ</button><span id="wordleHintText"></span></div><p class="hint">Czarne: dobre miejsce. Szare: litera jest w słowie.</p><div id="wordleBoard" class="wordleBoard"></div><div id="wordleKeys" class="wordleKeys"></div>';document.body.insertBefore(wordlePage,document.getElementsByTagName('script')[0]);
  function requestFullscreen(){try{if(window.kindle&&kindle.messaging)kindle.messaging.sendStringMessage('com.lab126.mfa','switchViewMode','fullscreen');}catch(e){}}
  requestFullscreen();
  try{if(window.kindle&&kindle.appmgr)kindle.appmgr.ongo=requestFullscreen;}catch(ignoreFullscreen){}
  var pages = document.getElementsByClassName('page');
  var back = document.getElementById('back');
  var levelBoxes=document.getElementsByClassName('levelSelect'),levelIndex,masterOption;
  for(levelIndex=0;levelIndex<levelBoxes.length;levelIndex++){masterOption=document.createElement('option');masterOption.value='master';masterOption.innerHTML='mistrz';levelBoxes[levelIndex].appendChild(masterOption);}
  var chessLevelBox=document.getElementById('chessLevel');if(chessLevelBox){chessLevelBox.options[0].text='bardzo łatwy (200)';chessLevelBox.options[1].text='łatwy (450)';chessLevelBox.options[2].text='średni (700)';chessLevelBox.options[3].text='trudny (900)';chessLevelBox.options[4].text='mistrz (1100)';}
  function fitGrid(board,cols,rows,usedHeight,frame,gap){var rect=board.getBoundingClientRect(),maxW=Math.max(120,window.innerWidth-18),top=rect.top>50?rect.top:usedHeight,maxH=Math.max(120,window.innerHeight-top-12),total=Math.floor(Math.min((maxW-frame)/cols,(maxH-frame)/rows)),cell=Math.max(8,total-gap);board.style.width=(cols*(cell+gap)+frame)+'px';board.style.height=(rows*(cell+gap)+frame)+'px';return cell;}
  function renderPage(id){if(id==='ttt')renderTtt();else if(id==='mine')renderMine();else if(id==='g2048')render2048();else if(id==='memory')renderMemory();else if(id==='chess')renderChess();else if(id==='checkers')renderCheckers();else if(id==='connect')renderConnect();else if(id==='lights')renderLights();else if(id==='life')renderLife();else if(id==='wordle')renderWordle();else if(id==='draw')resizeDrawCanvas();}
  function show(id) {
    var i, panels = document.getElementsByClassName('settingsPanel');
    for (i = 0; i < pages.length; i++) pages[i].className = 'page';
    for (i = 0; i < panels.length; i++) if (panels[i].className.indexOf('hidden') < 0) panels[i].className += ' hidden';
    document.getElementById('settingsCloseGlobal').className='hidden';
    document.getElementById(id).className = 'page active';
    back.className = id === 'menu' ? 'small hidden' : 'small';
    var menuLink=document.querySelector('[data-game="' + id + '"]');
    document.getElementById('title').innerHTML = id === 'menu' ? 'INKDECK' : (menuLink?menuLink.firstChild.nodeValue:'PLUGIN');
    setTimeout(function(){renderPage(id);},0);
  }
  back.onclick = function () { show('menu'); };
  document.getElementById('exit').onclick = function () {
    try { if (window.kindle && kindle.appmgr) { kindle.appmgr.start('com.lab126.booklet.home'); return; } } catch (e) {}
    try { window.close(); } catch (ignore) {}
  };
  var settingsButtons = document.getElementsByClassName('settingsToggle'), sb;
  function closeAllSettings(){var panels=document.getElementsByClassName('settingsPanel'),i;for(i=0;i<panels.length;i++)if(panels[i].className.indexOf('hidden')<0)panels[i].className+=' hidden';document.getElementById('settingsCloseGlobal').className='hidden';}
  for (sb = 0; sb < settingsButtons.length; sb++) settingsButtons[sb].onclick = function () {
    var panel = document.getElementById(this.getAttribute('data-panel'));
    var opening=panel.className.indexOf('hidden')>=0;closeAllSettings();panel.className=opening?'settingsPanel':'settingsPanel hidden';document.getElementById('settingsCloseGlobal').className=opening?'':'hidden';
  };
  document.getElementById('settingsCloseGlobal').onclick=closeAllSettings;
  document.getElementById('settingsCloseGlobal').ontouchend=function(e){if(e&&e.preventDefault)e.preventDefault();closeAllSettings();};
  var closeSettings=document.getElementsByClassName('closeSettings'),cs;
  for(cs=0;cs<closeSettings.length;cs++){closeSettings[cs].onclick=closeAllSettings;closeSettings[cs].ontouchend=function(e){if(e&&e.preventDefault)e.preventDefault();closeAllSettings();};}
  var allPanels=document.getElementsByClassName('settingsPanel'),ap,closeButton;
  for(ap=0;ap<allPanels.length;ap++)if(!allPanels[ap].getElementsByClassName('closeSettings').length){closeButton=document.createElement('button');closeButton.className='closeSettings';closeButton.innerHTML='ZAMKNIJ';closeButton.onclick=closeAllSettings;allPanels[ap].insertBefore(closeButton,allPanels[ap].firstChild);}
  var menuButtons = document.getElementsByClassName('menuButton');
  var mi;
  for (mi = 0; mi < menuButtons.length; mi++) menuButtons[mi].onclick = function () { show(this.getAttribute('data-game')); };
  var categoryButtons=document.getElementsByClassName('category'),ci;
  for(ci=0;ci<categoryButtons.length;ci++)categoryButtons[ci].onclick=function(){var wanted=this.getAttribute('data-category'),j;for(j=0;j<categoryButtons.length;j++)categoryButtons[j].className='category'+(categoryButtons[j]===this?' selected':'');for(j=0;j<menuButtons.length;j++)menuButtons[j].className='menuButton'+(menuButtons[j].getAttribute('data-category')===wanted?'':' hidden');};

  var ttt = [], tttOver = false, tttVsAI = true, tttTurn = 'X';
  function tttWinner(a) {
    var w = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]], i;
    for (i = 0; i < w.length; i++) if (a[w[i][0]] && a[w[i][0]] === a[w[i][1]] && a[w[i][1]] === a[w[i][2]]) return a[w[i][0]];
    return '';
  }
  function tttWinLine(a){var w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]],i;for(i=0;i<w.length;i++)if(a[w[i][0]]&&a[w[i][0]]===a[w[i][1]]&&a[w[i][1]]===a[w[i][2]])return w[i];return [];}
  function tttMinimax(a,isBot){var win=tttWinner(a),open=[],i,best,score;if(win==='O')return 10;if(win==='X')return -10;for(i=0;i<9;i++)if(!a[i])open.push(i);if(!open.length)return 0;best=isBot?-100:100;for(i=0;i<open.length;i++){a[open[i]]=isBot?'O':'X';score=tttMinimax(a,!isBot);a[open[i]]='';if(isBot&&score>best)best=score;if(!isBot&&score<best)best=score;}return best;}
  function tttBestMove(open){var i,score,best=-100,moves=[];for(i=0;i<open.length;i++){ttt[open[i]]='O';score=tttMinimax(ttt,false);ttt[open[i]]='';if(score>best){best=score;moves=[open[i]];}else if(score===best)moves.push(open[i]);}return moves[Math.floor(Math.random()*moves.length)];}
  function renderTtt() {
    var b = document.getElementById('tttBoard'), i, c,line=tttWinLine(ttt),cell=fitGrid(b,3,3,190,0,0);
    b.innerHTML = '';
    for (i = 0; i < 9; i++) {
      c = document.createElement('div'); c.className = 'tttCell'+(line.indexOf(i)>=0?' win':'');c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-6)+'px';c.style.fontSize=Math.floor(cell*0.58)+'px'; c.setAttribute('data-i', i); c.innerHTML = ttt[i] || '';
      c.onclick = function () { tttMove(parseInt(this.getAttribute('data-i'), 10)); };
      b.appendChild(c);
    }
  }
  function tttMove(i) {
    var open = [], k, pick, win;
    if (tttOver || ttt[i]) return;
    ttt[i] = tttTurn; win = tttWinner(ttt);
    if (!tttVsAI) {
      if (win) { tttOver = true; document.getElementById('tttStatus').innerHTML = 'Wygrywa: ' + win; }
      else {
        open = []; for (k = 0; k < 9; k++) if (!ttt[k]) open.push(k);
        if (!open.length) { tttOver = true; document.getElementById('tttStatus').innerHTML = 'Remis'; }
        else { tttTurn = tttTurn === 'X' ? 'O' : 'X'; document.getElementById('tttStatus').innerHTML = 'Ruch: ' + tttTurn; }
      }
      renderTtt(); return;
    }
    if (!win) {
      for (k = 0; k < 9; k++) if (!ttt[k]) open.push(k);
      if (open.length) {
        pick = -1;
        var level=document.getElementById('tttLevel').value,skill=level==='veryeasy'?0:(level==='easy'?0.35:(level==='medium'?0.7:(level==='hard'?0.9:1)));
        if(Math.random()<skill)pick=tttBestMove(open);
        if(pick<0)pick=open[Math.floor(Math.random()*open.length)];
        ttt[pick] = 'O';
      }
    }
    win = tttWinner(ttt);
    if (win) { tttOver = true; document.getElementById('tttStatus').innerHTML = win === 'X' ? 'Wygrałeś!' : 'Kindle wygrał'; }
    else {
      open = [];
      for (k = 0; k < 9; k++) if (!ttt[k]) open.push(k);
      if (!open.length) { tttOver = true; document.getElementById('tttStatus').innerHTML = 'Remis'; }
    }
    renderTtt();
  }
  function newTtt() { ttt = ['','','','','','','','','']; tttOver = false; tttTurn = 'X'; document.getElementById('tttStatus').innerHTML = tttVsAI ? 'Twój ruch: X' : 'Ruch: X'; renderTtt(); }
  document.getElementById('tttNew').onclick = newTtt;
  document.getElementById('tttAI').onclick = function () { tttVsAI = true; this.className = 'selected'; document.getElementById('tttTwo').className = ''; newTtt(); };
  document.getElementById('tttTwo').onclick = function () { tttVsAI = false; this.className = 'selected'; document.getElementById('tttAI').className = ''; newTtt(); };
  document.getElementById('tttAI').className = 'selected';

  var mines = [], mineOpen = [], mineFlag = [], mineOver = false, mineFlagMode = false, minePressAt = 0, minePressIndex = -1, mineLastFlagAt = 0, mineLastFlagIndex = -1, mineIgnoreMouseUntil = 0, mineHandledUntil = 0, mineSize = 10, mineCount = 10, mineStarted = false, mineSeconds = 0, mineClock = null;
  function mineStatusText(message) {
    var flags = 0, i, min, sec;
    for (i = 0; i < mineFlag.length; i++) if (mineFlag[i]) flags++;
    min = Math.floor(mineSeconds / 60); sec = mineSeconds % 60;
    document.getElementById('mineStatus').innerHTML = message || ('⚑ ' + Math.max(0, mineCount - flags) + ' &nbsp; ' + (min < 10 ? '0' : '') + min + ':' + (sec < 10 ? '0' : '') + sec);
  }
  function newMine() {
    var i, p, total;
    mineSize = parseInt(document.getElementById('mineSize').value, 10);
    mineCount = parseInt(document.getElementById('mineCount').value, 10);
    total = mineSize * mineSize; if (mineCount >= total) mineCount = total - 1;
    if (mineClock) { clearInterval(mineClock); mineClock = null; }
    mines = []; mineOpen = []; mineFlag = []; mineOver = false; mineStarted = false; mineSeconds = 0;
    for (i = 0; i < total; i++) { mines[i] = 0; mineOpen[i] = false; mineFlag[i] = false; }
    i = 0; while (i < mineCount) { p = Math.floor(Math.random() * total); if (!mines[p]) { mines[p] = 1; i++; } }
    mineStatusText(); renderMine();
  }
  function nearby(i) {
    var x = i % mineSize, y = Math.floor(i / mineSize), dx, dy, n = 0, j;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < mineSize && y + dy >= 0 && y + dy < mineSize) { j = (y + dy) * mineSize + x + dx; if (mines[j]) n++; }
    return n;
  }
  function reveal(i) {
    var x, y, dx, dy, j;
    if (i < 0 || i >= mineSize * mineSize || mineOpen[i] || mineFlag[i]) return;
    mineOpen[i] = true;
    if (!mines[i] && nearby(i) === 0) {
      x = i % mineSize; y = Math.floor(i / mineSize);
      for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) if (x + dx >= 0 && x + dx < mineSize && y + dy >= 0 && y + dy < mineSize) { j = (y + dy) * mineSize + x + dx; if (!mineOpen[j]) reveal(j); }
    }
  }
  function mineSafeStart(i){var x=i%mineSize,y=Math.floor(i/mineSize),dx,dy,j,removed=0,p,safe={};for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++)if(x+dx>=0&&x+dx<mineSize&&y+dy>=0&&y+dy<mineSize){j=(y+dy)*mineSize+x+dx;safe[j]=true;if(mines[j]){mines[j]=0;removed++;}}while(removed>0){p=Math.floor(Math.random()*mines.length);if(!mines[p]&&!safe[p]){mines[p]=1;removed--;}}}
  function mineTap(i) {
    var opened = 0, k;
    if (mineOver || mineFlag[i]) return;
    if (!mineStarted) { mineStarted = true; mineSafeStart(i); mineClock = setInterval(function(){mineSeconds++;mineStatusText();},1000); }
    if (mines[i]) { for (k = 0; k < mines.length; k++) if (mines[k]) mineOpen[k] = true; mineOver = true; if(mineClock){clearInterval(mineClock);mineClock=null;} mineStatusText('✹  BUM!  ✹'); }
    else { reveal(i); for (k = 0; k < mines.length; k++) if (mineOpen[k]) opened++; if (opened === mines.length - mineCount) { mineOver = true; if(mineClock){clearInterval(mineClock);mineClock=null;} mineStatusText('WYGRANA!  ' + mineSeconds + ' s'); } }
    renderMine();
  }
  function mineToggleFlag(i) {
    var now = new Date().getTime();
    if (mineOver || mineOpen[i]) return;
    mineFlag[i] = !mineFlag[i]; mineLastFlagIndex = i; mineLastFlagAt = now; mineHandledUntil = now + 700;
    mineStatusText(); renderMine();
  }
  function minePressStart(el, e, touch) {
    var now = new Date().getTime();
    if (!touch && now < mineIgnoreMouseUntil) return false;
    if (touch) mineIgnoreMouseUntil = now + 1800;
    minePressAt = now; minePressIndex = parseInt(el.getAttribute('data-i'), 10);
    if (e && e.preventDefault) e.preventDefault(); return false;
  }
  function minePressEnd(el, e, touch) {
    var now = new Date().getTime(), n = minePressIndex >= 0 ? minePressIndex : parseInt(el.getAttribute('data-i'), 10), held = now - minePressAt;
    minePressIndex = -1;
    if (!touch && now < mineIgnoreMouseUntil) return false;
    if (now < mineHandledUntil) return false;
    if (mineFlagMode || held >= 600) mineToggleFlag(n); else mineTap(n);
    if (e && e.preventDefault) e.preventDefault(); return false;
  }
  function renderMine() {
    var b = document.getElementById('mineBoard'), i, c, rect=b.getBoundingClientRect(),top=rect.top>50?rect.top:145,available=Math.min(window.innerWidth-18,window.innerHeight-top-12),cell = Math.max(16,Math.floor((available-10) / mineSize));
    b.innerHTML = '';
    b.style.width = (cell * mineSize + 10) + 'px'; b.style.height = (cell * mineSize + 10) + 'px';
    for (i = 0; i < mines.length; i++) {
      c = document.createElement('div'); c.className = 'mineCell' + (mineOpen[i] ? ' open' : '') + (mineFlag[i] ? ' flag' : '') + (mineOpen[i] && mines[i] ? ' mine' : '') + (mineOpen[i] && !mines[i] && nearby(i) ? ' n' + nearby(i) : ''); c.setAttribute('data-i', i);
      c.style.width = cell + 'px'; c.style.height = cell + 'px'; c.style.lineHeight = (cell - 4) + 'px'; c.style.fontSize = Math.max(18, Math.floor(cell * 0.45)) + 'px';
      c.innerHTML = mineFlag[i] ? '⚑' : (mineOpen[i] ? (mines[i] ? '✹' : (nearby(i) || '')) : '');
      c.ontouchstart = function(e){return minePressStart(this,e,true);};
      c.ontouchend = function(e){return minePressEnd(this,e,true);};
      c.ontouchcancel = function(e){minePressIndex=-1;if(e&&e.preventDefault)e.preventDefault();return false;};
      c.onmousedown = function(e){return minePressStart(this,e,false);};
      c.onmouseup = function(e){return minePressEnd(this,e,false);};
      c.oncontextmenu = function(e){mineToggleFlag(parseInt(this.getAttribute('data-i'),10));if(e&&e.preventDefault)e.preventDefault();return false;};
      b.appendChild(c);
    }
  }
  document.getElementById('mineNew').onclick = newMine;
  document.getElementById('mineSize').onchange = newMine;
  document.getElementById('mineCount').onchange = newMine;
  document.getElementById('mineFlagMode').onclick = function(){mineFlagMode=!mineFlagMode;this.innerHTML=mineFlagMode?'TRYB: FLAGOWANIE':'TRYB: ODKRYWANIE';this.className=mineFlagMode?'selected':'';};

  var grid = [], score = 0;
  function addTile() { var e = [], i; for (i = 0; i < 16; i++) if (!grid[i]) e.push(i); if (e.length) grid[e[Math.floor(Math.random()*e.length)]] = Math.random() < 0.9 ? 2 : 4; }
  function new2048() { var i; grid=[]; score=0; for(i=0;i<16;i++)grid[i]=0; addTile(); addTile(); render2048(); }
  function slide(line) { var a=[], i; for(i=0;i<4;i++)if(line[i])a.push(line[i]); for(i=0;i<a.length-1;i++)if(a[i]===a[i+1]){a[i]*=2;score+=a[i];a.splice(i+1,1);} while(a.length<4)a.push(0); return a; }
  function move2048(dir) {
    var old=grid.join(','), r,c,line,out;
    for(r=0;r<4;r++) { line=[]; for(c=0;c<4;c++) {
      if(dir==='left') line.push(grid[r*4+c]); if(dir==='right') line.push(grid[r*4+(3-c)]); if(dir==='up') line.push(grid[c*4+r]); if(dir==='down') line.push(grid[(3-c)*4+r]);
    } out=slide(line); for(c=0;c<4;c++) {
      if(dir==='left') grid[r*4+c]=out[c]; if(dir==='right') grid[r*4+(3-c)]=out[c]; if(dir==='up') grid[c*4+r]=out[c]; if(dir==='down') grid[(3-c)*4+r]=out[c];
    }}
    if(old!==grid.join(','))addTile(); render2048();
  }
  function render2048(){var b=document.getElementById('board2048'),i,c,rect=b.getBoundingClientRect(),maxW=window.innerWidth-26,maxH=window.innerHeight-(rect.top>50?rect.top:150)-145,cell=Math.max(54,Math.floor((Math.min(maxW,maxH)-48)/4));b.style.width=(cell*4+48)+'px';b.style.height=(cell*4+48)+'px';b.innerHTML='';for(i=0;i<16;i++){c=document.createElement('div');c.className='tile2048'+(grid[i]>=128?' dark':'');c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-4)+'px';c.style.fontSize=Math.max(24,Math.floor(cell*0.3))+'px';c.innerHTML=grid[i]||'';b.appendChild(c);}document.getElementById('score2048').innerHTML='Wynik: '+score;}
  var move2048TouchAt=0;
  function bind2048Button(id,dir){var b=document.getElementById(id);b.ontouchend=function(e){move2048TouchAt=new Date().getTime();move2048(dir);if(e&&e.preventDefault)e.preventDefault();return false;};b.onclick=function(){if(new Date().getTime()-move2048TouchAt<900)return false;move2048(dir);return false;};}
  bind2048Button('move2048Up','up');bind2048Button('move2048Left','left');bind2048Button('move2048Down','down');bind2048Button('move2048Right','right');
  var board2048Touch=document.getElementById('board2048'),swipe2048X=0,swipe2048Y=0;board2048Touch.ontouchstart=function(e){var t=e.touches&&e.touches[0];if(t){swipe2048X=t.clientX;swipe2048Y=t.clientY;}if(e.preventDefault)e.preventDefault();};board2048Touch.ontouchend=function(e){var t=e.changedTouches&&e.changedTouches[0],dx,dy;if(!t)return;dx=t.clientX-swipe2048X;dy=t.clientY-swipe2048Y;if(Math.abs(dx)<25&&Math.abs(dy)<25)return;move2048(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'));if(e.preventDefault)e.preventDefault();};
  document.getElementById('new2048').onclick=new2048;

  var cards=[], first=-1, lock=false, memoryMoves=0, memoryPairs=0, memoryTarget=8;
  function newMemory(){var i,j,t;memoryTarget=parseInt(document.getElementById('memoryPairsSelect').value,10);cards=[];for(i=1;i<=memoryTarget;i++){cards.push({v:i,up:false,done:false});cards.push({v:i,up:false,done:false});}for(i=cards.length-1;i>0;i--){j=Math.floor(Math.random()*(i+1));t=cards[i];cards[i]=cards[j];cards[j]=t;}first=-1;lock=false;memoryMoves=0;memoryPairs=0;renderMemory();}
  function memoryTap(i){if(lock||cards[i].up||cards[i].done)return;cards[i].up=true;if(first<0){first=i;renderMemory();return;}memoryMoves++;if(cards[first].v===cards[i].v){cards[first].done=true;cards[i].done=true;memoryPairs++;first=-1;renderMemory();if(memoryPairs===memoryTarget)document.getElementById('memoryStatus').innerHTML='Wygrana! Ruchy: '+memoryMoves;}else{lock=true;renderMemory();setTimeout(function(){cards[first].up=false;cards[i].up=false;first=-1;lock=false;renderMemory();},800);}}
  function renderMemory(){var b=document.getElementById('memoryBoard'),i,c,cols=memoryTarget===10?5:4,rows=Math.ceil(cards.length/cols),size=fitGrid(b,cols,rows,145,0,8);b.innerHTML='';for(i=0;i<cards.length;i++){c=document.createElement('div');c.className='memoryCell'+(cards[i].done?' done':'');c.style.width=size+'px';c.style.height=size+'px';c.style.lineHeight=(size-6)+'px';c.style.fontSize=Math.max(28,Math.floor(size*0.38))+'px';c.setAttribute('data-i',i);c.innerHTML=(cards[i].up||cards[i].done)?cards[i].v:'?';c.onclick=function(){memoryTap(parseInt(this.getAttribute('data-i'),10));};b.appendChild(c);}document.getElementById('memoryStatus').innerHTML='Ruchy: '+memoryMoves;}
  document.getElementById('memoryNew').onclick=newMemory;
  document.getElementById('memoryPairsSelect').onchange=newMemory;

  var chess=[], chessTurn='w', chessSelected=-1, chessVsAI=true, chessOver=false, chessHistory=[], chessEnPassant=-1,chessLastFrom=-1,chessLastTo=-1,chessWhiteTime=0,chessBlackTime=0,chessClock=null,chessClockStarted=false,chessAITimer=null,chessEngineDeadline=0;
  function chessClockText(seconds){var m=Math.floor(Math.max(0,seconds)/60),s=Math.max(0,seconds)%60;return(m<10?'0':'')+m+':'+(s<10?'0':'')+s;}
  function renderChessClock(){var panel=document.getElementById('chessClockPanel'),enabled=!chessVsAI&&parseInt(document.getElementById('chessTime').value,10)>0;panel.className=chessVsAI?'chessClockPanel hidden':'chessClockPanel';document.getElementById('chessWhiteClock').innerHTML='BIAŁE '+chessClockText(chessWhiteTime);document.getElementById('chessBlackClock').innerHTML='CZARNE '+chessClockText(chessBlackTime);document.getElementById('chessWhiteClock').className=enabled&&chessClockStarted&&chessTurn==='w'?'activeClock':'';document.getElementById('chessBlackClock').className=enabled&&chessClockStarted&&chessTurn==='b'?'activeClock':'';}
  function stopChessClock(){if(chessClock){clearInterval(chessClock);chessClock=null;}}
  function startChessClock(){if(chessVsAI||chessClockStarted||!parseInt(document.getElementById('chessTime').value,10))return;chessClockStarted=true;stopChessClock();chessClock=setInterval(function(){if(chessOver)return;if(chessTurn==='w')chessWhiteTime--;else chessBlackTime--;if(chessWhiteTime<=0||chessBlackTime<=0){chessOver=true;stopChessClock();document.getElementById('chessStatus').innerHTML='CZAS — WYGRYWAJĄ '+(chessWhiteTime<=0?'CZARNE':'BIAŁE');}renderChessClock();},1000);}
  var chessCastle={wK:true,wQ:true,bK:true,bQ:true};
  var chessGlyph={K:'♚',Q:'♛',R:'♜',B:'♝',N:'♞',P:'♟',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
  function chessColor(p){return !p?'':(p===p.toUpperCase()?'w':'b');}
  function chessPseudo(from,b,attackOnly){
    var p=b[from],color=chessColor(p),x=from%8,y=Math.floor(from/8),out=[],dirs,i,nx,ny,to,step,dir,start;
    if(!p)return out;
    function add(tx,ty,slide){var t;if(tx<0||tx>7||ty<0||ty>7)return false;t=ty*8+tx;if(!b[t]){out.push(t);return slide;}if(chessColor(b[t])!==color)out.push(t);return false;}
    switch(p.toLowerCase()){
      case 'p':
        dir=color==='w'?-1:1;start=color==='w'?6:1;
        if(attackOnly){if(x>0)out.push((y+dir)*8+x-1);if(x<7)out.push((y+dir)*8+x+1);}
        else{to=(y+dir)*8+x;if(y+dir>=0&&y+dir<8&&!b[to]){out.push(to);to=(y+2*dir)*8+x;if(y===start&&!b[to])out.push(to);}if(x>0){to=(y+dir)*8+x-1;if((b[to]&&chessColor(b[to])!==color)||to===chessEnPassant)out.push(to);}if(x<7){to=(y+dir)*8+x+1;if((b[to]&&chessColor(b[to])!==color)||to===chessEnPassant)out.push(to);}}
        break;
      case 'n': dirs=[[1,2],[2,1],[-1,2],[-2,1],[1,-2],[2,-1],[-1,-2],[-2,-1]];for(i=0;i<dirs.length;i++)add(x+dirs[i][0],y+dirs[i][1],false);break;
      case 'b': dirs=[[1,1],[-1,1],[1,-1],[-1,-1]];for(i=0;i<dirs.length;i++)for(step=1;step<8;step++)if(!add(x+dirs[i][0]*step,y+dirs[i][1]*step,true))break;break;
      case 'r': dirs=[[1,0],[-1,0],[0,1],[0,-1]];for(i=0;i<dirs.length;i++)for(step=1;step<8;step++)if(!add(x+dirs[i][0]*step,y+dirs[i][1]*step,true))break;break;
      case 'q': dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];for(i=0;i<dirs.length;i++)for(step=1;step<8;step++)if(!add(x+dirs[i][0]*step,y+dirs[i][1]*step,true))break;break;
      case 'k': dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];for(i=0;i<dirs.length;i++)add(x+dirs[i][0],y+dirs[i][1],false);break;
    }
    return out;
  }
  function chessChecked(color,b){var king=color==='w'?'K':'k',ks=b.indexOf(king),i,m,j;if(ks<0)return true;for(i=0;i<64;i++)if(b[i]&&chessColor(b[i])!==color){m=chessPseudo(i,b,true);for(j=0;j<m.length;j++)if(m[j]===ks)return true;}return false;}
  function chessMoves(from,b){
    var raw=chessPseudo(from,b,false),out=[],i,copy,p=b[from],color=chessColor(p),to,mid;
    if(p==='K'&&from===60&&!chessChecked('w',b)){
      if(chessCastle.wK&&b[63]==='R'&&!b[61]&&!b[62]){mid=b.slice(0);mid[61]='K';mid[60]='';if(!chessChecked('w',mid))raw.push(62);}
      if(chessCastle.wQ&&b[56]==='R'&&!b[57]&&!b[58]&&!b[59]){mid=b.slice(0);mid[59]='K';mid[60]='';if(!chessChecked('w',mid))raw.push(58);}
    }
    if(p==='k'&&from===4&&!chessChecked('b',b)){
      if(chessCastle.bK&&b[7]==='r'&&!b[5]&&!b[6]){mid=b.slice(0);mid[5]='k';mid[4]='';if(!chessChecked('b',mid))raw.push(6);}
      if(chessCastle.bQ&&b[0]==='r'&&!b[1]&&!b[2]&&!b[3]){mid=b.slice(0);mid[3]='k';mid[4]='';if(!chessChecked('b',mid))raw.push(2);}
    }
    for(i=0;i<raw.length;i++){
      to=raw[i];copy=b.slice(0);
      if(p.toLowerCase()==='p'&&to===chessEnPassant&&!copy[to]&&from%8!==to%8)copy[to+(color==='w'?8:-8)]='';
      copy[to]=copy[from];copy[from]='';
      if(p.toLowerCase()==='k'&&Math.abs(to-from)===2){if(to>from){copy[to-1]=copy[to+1];copy[to+1]='';}else{copy[to+1]=copy[to-2];copy[to-2]='';}}
      if(!chessChecked(color,copy))out.push(to);
    }
    return out;
  }
  function chessAll(color,b){var all=[],i,m,j;for(i=0;i<64;i++)if(chessColor(b[i])===color){m=chessMoves(i,b);for(j=0;j<m.length;j++)all.push({from:i,to:m[j]});}return all;}
  function chessDo(from,to){var p=chess[from],color=chessColor(p),enemy,moves,isEP=p.toLowerCase()==='p'&&to===chessEnPassant&&!chess[to]&&from%8!==to%8;chessHistory.push({board:chess.slice(0),turn:chessTurn,ep:chessEnPassant,castle:{wK:chessCastle.wK,wQ:chessCastle.wQ,bK:chessCastle.bK,bQ:chessCastle.bQ}});if(isEP)chess[to+(color==='w'?8:-8)]='';if(p==='K'){chessCastle.wK=false;chessCastle.wQ=false;}if(p==='k'){chessCastle.bK=false;chessCastle.bQ=false;}if(from===63||to===63)chessCastle.wK=false;if(from===56||to===56)chessCastle.wQ=false;if(from===7||to===7)chessCastle.bK=false;if(from===0||to===0)chessCastle.bQ=false;chess[to]=p;chess[from]='';if(p.toLowerCase()==='k'&&Math.abs(to-from)===2){if(to>from){chess[to-1]=chess[to+1];chess[to+1]='';}else{chess[to+1]=chess[to-2];chess[to-2]='';}}chessEnPassant=p.toLowerCase()==='p'&&Math.abs(to-from)===16?(from+to)/2:-1;if(p==='P'&&to<8)chess[to]='Q';if(p==='p'&&to>=56)chess[to]='q';chessSelected=-1;chessTurn=chessTurn==='w'?'b':'w';enemy=chessTurn;moves=chessAll(enemy,chess);if(!moves.length){chessOver=true;document.getElementById('chessStatus').innerHTML=chessChecked(enemy,chess)?'Mat — wygrywają '+(enemy==='w'?'czarne':'białe'):'Pat';}else document.getElementById('chessStatus').innerHTML='Ruch: '+(enemy==='w'?'białe':'czarne')+(chessChecked(enemy,chess)?' — szach':'');renderChess();if(chessVsAI&&chessTurn==='b'&&!chessOver)setTimeout(chessAIMove,350);}
  function chessTap(i){var moves,j;if(chessOver||(chessVsAI&&chessTurn==='b'))return;if(chessSelected>=0){moves=chessMoves(chessSelected,chess);for(j=0;j<moves.length;j++)if(moves[j]===i){chessLastFrom=chessSelected;chessLastTo=i;startChessClock();chessDo(chessSelected,i);renderChessClock();return;}}chessSelected=chessColor(chess[i])===chessTurn?i:-1;renderChess();}
  function engineBoardMove(b,m){var n=b.slice(0),p=n[m.from];n[m.to]=p;n[m.from]='';if(p==='P'&&m.to<8)n[m.to]='Q';if(p==='p'&&m.to>=56)n[m.to]='q';return n;}
  function engineEval(b){var val={p:100,n:320,b:330,r:500,q:900,k:20000},s=0,i,p,x,y;for(i=0;i<64;i++)if(b[i]){p=b[i];x=i%8;y=Math.floor(i/8);s+=(chessColor(p)==='b'?1:-1)*(val[p.toLowerCase()]+Math.floor(8-Math.abs(3.5-x)-Math.abs(3.5-y)));}return s;}
  function engineSearch(b,color,depth,alpha,beta){var moves,i,v,best=color==='b'?-999999:999999;if(new Date().getTime()>=chessEngineDeadline)return engineEval(b);moves=chessAll(color,b);if(!depth||!moves.length)return engineEval(b);for(i=0;i<moves.length;i++){if(new Date().getTime()>=chessEngineDeadline)break;v=engineSearch(engineBoardMove(b,moves[i]),color==='b'?'w':'b',depth-1,alpha,beta);if(color==='b'){if(v>best)best=v;if(best>alpha)alpha=best;}else{if(v<best)best=v;if(best<beta)beta=best;}if(beta<=alpha)break;}return best===999999||best===-999999?engineEval(b):best;}
  function chessAIMove(){var all,pick,i,scored=[],level,depth,mistake,score;chessAITimer=null;if(!chessVsAI||chessTurn!=='b'||chessOver)return;all=chessAll('b',chess);if(!all.length)return;level=document.getElementById('chessLevel').value;depth=level==='master'?3:(level==='hard'?3:(level==='medium'?2:(level==='easy'?2:1)));mistake=level==='veryeasy'?.7:(level==='easy'?.3:(level==='medium'?.08:(level==='hard'?.02:0)));chessEngineDeadline=new Date().getTime()+1100;for(i=0;i<all.length;i++){score=engineSearch(engineBoardMove(chess,all[i]),'w',depth-1,-999999,999999);scored.push({move:all[i],score:score});}scored.sort(function(a,b){return b.score-a.score;});pick=Math.random()<mistake?scored[Math.floor(Math.random()*Math.min(scored.length,6))].move:scored[0].move;if(!pick||!chessVsAI||chessTurn!=='b'||chessOver)return;chessLastFrom=pick.from;chessLastTo=pick.to;chessDo(pick.from,pick.to);}
  function renderChess(){var b=document.getElementById('chessBoard'),i,c,m=[],j,p,cell=fitGrid(b,8,8,190,8,0),piece=Math.max(30,cell-12),style=document.getElementById('chessStyle').value,letters={K:'K',Q:'H',R:'W',B:'G',N:'S',P:'P',k:'K',q:'H',r:'W',b:'G',n:'S',p:'P'},simple={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};if(chessSelected>=0)m=chessMoves(chessSelected,chess);b.innerHTML='';for(i=0;i<64;i++){c=document.createElement('div');c.className='boardCell'+(((Math.floor(i/8)+i%8)%2)?' dark':'')+(i===chessSelected?' selected':'')+(i===chessLastFrom?' lastFrom':'')+(i===chessLastTo?' lastTo':'');c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-2)+'px';for(j=0;j<m.length;j++)if(m[j]===i)c.className+=' target';c.setAttribute('data-i',i);p=chess[i];c.innerHTML=p?'<span class="chessPiece '+(style==='simple'?'simplePiece ':'')+(chessColor(p)==='b'?'black':'')+'" style="width:'+piece+'px;height:'+piece+'px;line-height:'+(piece-6)+'px;font-size:'+Math.max(24,Math.floor(piece*0.68))+'px;margin-top:'+Math.max(3,Math.floor((cell-piece)/2))+'px">'+(style==='letters'?letters[p]:(style==='simple'?simple[p]:chessGlyph[p]))+'</span>':'';c.onclick=function(){chessTap(parseInt(this.getAttribute('data-i'),10));};b.appendChild(c);}}
  function newChess(){var row='rnbqkbnr',i,seconds=parseInt(document.getElementById('chessTime').value,10)||0;stopChessClock();chessClockStarted=false;chessWhiteTime=seconds;chessBlackTime=seconds;chess=[];chessHistory=[];chessEnPassant=-1;chessLastFrom=-1;chessLastTo=-1;chessCastle={wK:true,wQ:true,bK:true,bQ:true};for(i=0;i<64;i++)chess[i]='';for(i=0;i<8;i++){chess[i]=row.charAt(i);chess[8+i]='p';chess[48+i]='P';chess[56+i]=row.charAt(i).toUpperCase();}chessTurn='w';chessSelected=-1;chessOver=false;document.getElementById('chessStatus').innerHTML='RUCH: BIAŁE';renderChessClock();renderChess();}
  document.getElementById('chessNew').onclick=newChess;
  document.getElementById('chessAI').onclick=function(){chessVsAI=true;this.className='selected';document.getElementById('chessTwo').className='';newChess();};
  document.getElementById('chessTwo').onclick=function(){chessVsAI=false;this.className='selected';document.getElementById('chessAI').className='';newChess();};
  document.getElementById('chessUndo').onclick=function(){var state;if(!chessHistory.length)return;state=chessHistory.pop();if(chessVsAI&&state.turn==='b'&&chessHistory.length)state=chessHistory.pop();chess=state.board.slice(0);chessTurn=state.turn;chessEnPassant=state.ep;chessCastle={wK:state.castle.wK,wQ:state.castle.wQ,bK:state.castle.bK,bQ:state.castle.bQ};chessSelected=-1;chessOver=false;document.getElementById('chessStatus').innerHTML='Ruch: '+(chessTurn==='w'?'białe':'czarne');renderChess();};
  document.getElementById('chessAI').className='selected';
  document.getElementById('chessStyle').onchange=renderChess;
  document.getElementById('chessTime').onchange=newChess;

  var checkers=[],checkersTurn=1,checkersSelected=-1,checkersVsAI=true,checkersOver=false,checkersLastFrom=-1,checkersLastTo=-1;
  function checkerMovesFrom(from,onlyCapture){var p=checkers[from],x=from%8,y=Math.floor(from/8),dirs=p===2||p===-2?[[-1,-1],[1,-1],[-1,1],[1,1]]:(p>0?[[-1,-1],[1,-1]]:[[-1,1],[1,1]]),out=[],i,nx,ny,to,jx,jy,jump;for(i=0;i<dirs.length;i++){nx=x+dirs[i][0];ny=y+dirs[i][1];if(nx<0||nx>7||ny<0||ny>7)continue;to=ny*8+nx;if(!checkers[to]&&!onlyCapture)out.push({to:to,cap:-1});else if(checkers[to]&&checkers[to]*p<0){jx=nx+dirs[i][0];jy=ny+dirs[i][1];if(jx>=0&&jx<8&&jy>=0&&jy<8){jump=jy*8+jx;if(!checkers[jump])out.push({to:jump,cap:to});}}}return out;}
  function checkerAll(player){var caps=[],normal=[],i,m,j;for(i=0;i<64;i++)if(checkers[i]*player>0){m=checkerMovesFrom(i,false);for(j=0;j<m.length;j++)(m[j].cap>=0?caps:normal).push({from:i,to:m[j].to,cap:m[j].cap});}return caps.length?caps:normal;}
  function checkerDo(move,aiChain){var p=checkers[move.from],more,all;checkers[move.to]=p;checkers[move.from]=0;if(move.cap>=0)checkers[move.cap]=0;if(p===1&&move.to<8)checkers[move.to]=2;if(p===-1&&move.to>=56)checkers[move.to]=-2;if(move.cap>=0){more=checkerMovesFrom(move.to,true);if(more.length){checkersSelected=move.to;renderCheckers();if(aiChain)setTimeout(function(){var n=more[Math.floor(Math.random()*more.length)];checkerDo({from:move.to,to:n.to,cap:n.cap},true);},300);return;}}checkersSelected=-1;checkersTurn=-checkersTurn;all=checkerAll(checkersTurn);if(!all.length){checkersOver=true;document.getElementById('checkersStatus').innerHTML='Wygrywają '+(checkersTurn===1?'czarne':'białe');}else document.getElementById('checkersStatus').innerHTML='Ruch: '+(checkersTurn===1?'białe':'czarne');renderCheckers();if(checkersVsAI&&checkersTurn===-1&&!checkersOver)setTimeout(checkersAIMove,350);}
  function checkerTap(i){var all,j;if(checkersOver||(checkersVsAI&&checkersTurn===-1))return;all=checkerAll(checkersTurn);if(checkersSelected>=0)for(j=0;j<all.length;j++)if(all[j].from===checkersSelected&&all[j].to===i){checkersLastFrom=checkersSelected;checkersLastTo=i;checkerDo(all[j],false);return;}checkersSelected=checkers[i]*checkersTurn>0?i:-1;renderCheckers();}
  function checkersAIMove(){var all=checkerAll(-1),m,i,j,best=[],score,bestScore=-999,level=document.getElementById('checkersLevel').value,skill=level==='veryeasy'?0:(level==='easy'?.45:(level==='medium'?.92:(level==='hard'?.98:1))),backup,p,replies,danger;if(!all.length)return;if(Math.random()<skill){for(i=0;i<all.length;i++){score=(all[i].cap>=0?14:0)+(Math.floor(all[i].to/8)===7?10:0)+(3-Math.abs(3.5-all[i].to%8));backup=checkers.slice(0);p=checkers[all[i].from];checkers[all[i].to]=p;checkers[all[i].from]=0;if(all[i].cap>=0)checkers[all[i].cap]=0;replies=checkerAll(1);danger=0;for(j=0;j<replies.length;j++)if(replies[j].cap>=0){danger++;if(replies[j].cap===all[i].to)danger+=2;}score-=danger*9;checkers=backup;if(score>bestScore){bestScore=score;best=[all[i]];}else if(score===bestScore)best.push(all[i]);}}m=(best.length?best:all)[Math.floor(Math.random()*(best.length?best.length:all.length))];checkersLastFrom=m.from;checkersLastTo=m.to;checkerDo(m,true);}
  function renderCheckers(){var b=document.getElementById('checkersBoard'),all=checkerAll(checkersTurn),i,j,c,p,targets=[],cell=fitGrid(b,8,8,190,8,0),piece=Math.max(28,cell-18),style=document.getElementById('checkersStyle').value;if(checkersSelected>=0)for(j=0;j<all.length;j++)if(all[j].from===checkersSelected)targets.push(all[j].to);b.innerHTML='';for(i=0;i<64;i++){c=document.createElement('div');c.className='boardCell'+(((Math.floor(i/8)+i%8)%2)?' dark':'')+(i===checkersSelected?' selected':'')+(i===checkersLastFrom?' lastFrom':'')+(i===checkersLastTo?' lastTo':'');c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-2)+'px';for(j=0;j<targets.length;j++)if(targets[j]===i)c.className+=' target';c.setAttribute('data-i',i);p=checkers[i];if(p)c.innerHTML='<span class="checkerPiece '+(p<0?'black':'')+(style==='flat'?' flat':'')+'" style="width:'+piece+'px;height:'+piece+'px;line-height:'+(piece-8)+'px;margin-top:'+Math.max(3,Math.floor((cell-piece)/2))+'px">'+(Math.abs(p)===2?'K':'')+'</span>';c.onclick=function(){checkerTap(parseInt(this.getAttribute('data-i'),10));};b.appendChild(c);}}
  function newCheckers(){var i,x,y;checkers=[];for(i=0;i<64;i++)checkers[i]=0;for(y=0;y<3;y++)for(x=0;x<8;x++)if((x+y)%2)checkers[y*8+x]=-1;for(y=5;y<8;y++)for(x=0;x<8;x++)if((x+y)%2)checkers[y*8+x]=1;checkersTurn=1;checkersSelected=-1;checkersOver=false;document.getElementById('checkersStatus').innerHTML='Ruch: białe';renderCheckers();}
  document.getElementById('checkersNew').onclick=newCheckers;
  document.getElementById('checkersAI').onclick=function(){checkersVsAI=true;this.className='selected';document.getElementById('checkersTwo').className='';newCheckers();};
  document.getElementById('checkersTwo').onclick=function(){checkersVsAI=false;this.className='selected';document.getElementById('checkersAI').className='';newCheckers();};
  document.getElementById('checkersAI').className='selected';
  document.getElementById('checkersStyle').onchange=renderCheckers;

  var connect = [], connectTurn = 'X', connectOver = false, connectVsAI=true;
  function newConnect(){var i;connect=[];for(i=0;i<42;i++)connect[i]='';connectTurn='X';connectOver=false;document.getElementById('connectStatus').innerHTML='Ruch: X';renderConnect();}
  function connectWin(){var r,c,v;for(r=0;r<6;r++)for(c=0;c<7;c++){v=connect[r*7+c];if(!v)continue;if(c<4&&v===connect[r*7+c+1]&&v===connect[r*7+c+2]&&v===connect[r*7+c+3])return v;if(r<3&&v===connect[(r+1)*7+c]&&v===connect[(r+2)*7+c]&&v===connect[(r+3)*7+c])return v;if(c<4&&r<3&&v===connect[(r+1)*7+c+1]&&v===connect[(r+2)*7+c+2]&&v===connect[(r+3)*7+c+3])return v;if(c>2&&r<3&&v===connect[(r+1)*7+c-1]&&v===connect[(r+2)*7+c-2]&&v===connect[(r+3)*7+c-3])return v;}return '';}
  function connectDrop(col,fromAI){var r,win,full=true,i;if(connectOver||(connectVsAI&&connectTurn==='O'&&!fromAI))return;for(r=5;r>=0;r--)if(!connect[r*7+col]){connect[r*7+col]=connectTurn;break;}if(r<0)return;win=connectWin();if(win){connectOver=true;document.getElementById('connectStatus').innerHTML='Wygrywa: '+win;}else{for(i=0;i<42;i++)if(!connect[i])full=false;if(full){connectOver=true;document.getElementById('connectStatus').innerHTML='Remis';}else{connectTurn=connectTurn==='X'?'O':'X';document.getElementById('connectStatus').innerHTML='Ruch: '+connectTurn;}}renderConnect();if(connectVsAI&&connectTurn==='O'&&!connectOver&&!fromAI)setTimeout(connectAIMove,300);}
  function connectSearch(depth,maximizing,alpha,beta){var win=connectWin(),c,r,score,best=maximizing?-9999:9999,any=false;if(win==='O')return 1000+depth;if(win==='X')return-1000-depth;if(depth<=0)return 0;for(c=0;c<7;c++){for(r=5;r>=0&&connect[r*7+c];r--);if(r<0)continue;any=true;connect[r*7+c]=maximizing?'O':'X';score=connectSearch(depth-1,!maximizing,alpha,beta);connect[r*7+c]='';score+=(3-Math.abs(3-c))*(maximizing?1:-1);if(maximizing){if(score>best)best=score;if(best>alpha)alpha=best;}else{if(score<best)best=score;if(best<beta)beta=best;}if(beta<=alpha)break;}return any?best:0;}
  function connectAIMove(){var cols=[],scored=[],c,r,level=document.getElementById('connectLevel').value,depth=level==='veryeasy'?1:(level==='easy'?2:(level==='medium'?4:(level==='hard'?5:6))),mistake=level==='veryeasy'?.65:(level==='easy'?.3:(level==='medium'?.06:(level==='hard'?.02:0))),score,pick;for(c=0;c<7;c++){for(r=5;r>=0&&connect[r*7+c];r--);if(r>=0){cols.push(c);connect[r*7+c]='O';score=connectSearch(depth-1,false,-9999,9999);connect[r*7+c]='';scored.push({col:c,score:score});}}if(!cols.length)return;scored.sort(function(a,b){return b.score-a.score;});pick=Math.random()<mistake?scored[Math.floor(Math.random()*Math.min(4,scored.length))].col:scored[0].col;connectDrop(pick,true);}
  function renderConnect(){var b=document.getElementById('connectBoard'),i,c,cell=fitGrid(b,7,6,190,8,2);b.innerHTML='';for(i=0;i<42;i++){c=document.createElement('div');c.className='connectCell';c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-6)+'px';c.style.fontSize=Math.max(24,Math.floor(cell*0.46))+'px';c.setAttribute('data-col',i%7);c.innerHTML=connect[i];c.onclick=function(){connectDrop(parseInt(this.getAttribute('data-col'),10));};b.appendChild(c);}}
  document.getElementById('connectNew').onclick=newConnect;
  document.getElementById('connectAI').onclick=function(){connectVsAI=true;this.className='selected';document.getElementById('connectTwo').className='';newConnect();};
  document.getElementById('connectTwo').onclick=function(){connectVsAI=false;this.className='selected';document.getElementById('connectAI').className='';newConnect();};
  document.getElementById('connectAI').className='selected';

  var lights=[], lightsMoves=0;
  function toggleLight(i){if(i>=0&&i<25)lights[i]=!lights[i];}
  function lightPress(i){var x=i%5,y=Math.floor(i/5),on=false,k;toggleLight(i);if(x>0)toggleLight(i-1);if(x<4)toggleLight(i+1);if(y>0)toggleLight(i-5);if(y<4)toggleLight(i+5);lightsMoves++;for(k=0;k<25;k++)if(lights[k])on=true;document.getElementById('lightsStatus').innerHTML=on?'Ruchy: '+lightsMoves:'Wygrana! Ruchy: '+lightsMoves;renderLights();}
  function newLights(){var i,j;lights=[];for(i=0;i<25;i++)lights[i]=false;lightsMoves=0;for(j=0;j<12;j++){i=Math.floor(Math.random()*25);toggleLight(i);if(i%5>0)toggleLight(i-1);if(i%5<4)toggleLight(i+1);if(i>=5)toggleLight(i-5);if(i<20)toggleLight(i+5);}document.getElementById('lightsStatus').innerHTML='Ruchy: 0';renderLights();}
  function renderLights(){var b=document.getElementById('lightsBoard'),i,c,cell=fitGrid(b,5,5,150,10,0);b.innerHTML='';for(i=0;i<25;i++){c=document.createElement('div');c.className='lightCell'+(lights[i]?' on':'');c.style.width=cell+'px';c.style.height=cell+'px';c.setAttribute('data-i',i);c.onclick=function(){lightPress(parseInt(this.getAttribute('data-i'),10));};b.appendChild(c);}}
  document.getElementById('lightsNew').onclick=newLights;

  var life=[],lifeGeneration=0,lifeTimer=null,lifeSize=16;
  function renderLife(){var b=document.getElementById('lifeBoard'),i,c,cell=fitGrid(b,lifeSize,lifeSize,150,8,0);b.innerHTML='';for(i=0;i<lifeSize*lifeSize;i++){c=document.createElement('div');c.className='lifeCell'+(life[i]?' alive':'');c.style.width=cell+'px';c.style.height=cell+'px';c.setAttribute('data-i',i);c.onclick=function(){var n=parseInt(this.getAttribute('data-i'),10);life[n]=!life[n];renderLife();};b.appendChild(c);}document.getElementById('lifeStatus').innerHTML='Pokolenie: '+lifeGeneration;}
  function lifeNext(){var next=[],x,y,dx,dy,n,i,alive=0,goal=parseInt(document.getElementById('lifeGoal').value,10)||0;for(y=0;y<lifeSize;y++)for(x=0;x<lifeSize;x++){n=0;for(dy=-1;dy<=1;dy++)for(dx=-1;dx<=1;dx++)if((dx||dy)&&x+dx>=0&&x+dx<lifeSize&&y+dy>=0&&y+dy<lifeSize&&life[(y+dy)*lifeSize+x+dx])n++;i=y*lifeSize+x;next[i]=life[i]?(n===2||n===3):(n===3);if(next[i])alive++;}life=next;lifeGeneration++;if(alive===0){lifeStop();renderLife();document.getElementById('lifeStatus').innerHTML='PRZEGRANA — populacja wymarła';}else if(goal&&lifeGeneration>=goal){lifeStop();renderLife();document.getElementById('lifeStatus').innerHTML='WYGRANA — '+goal+' pokoleń';}else{renderLife();document.getElementById('lifeStatus').innerHTML='Pokolenie: '+lifeGeneration+' | Żywe: '+alive;}}
  function lifeStop(){if(lifeTimer){clearInterval(lifeTimer);lifeTimer=null;}document.getElementById('lifeRun').innerHTML='START';}
  document.getElementById('lifeStep').onclick=function(){lifeStop();lifeNext();};document.getElementById('lifeRun').onclick=function(){if(lifeTimer){lifeStop();return;}this.innerHTML='STOP';lifeTimer=setInterval(lifeNext,700);};document.getElementById('lifeClear').onclick=function(){var i;lifeStop();lifeGeneration=0;life=[];for(i=0;i<lifeSize*lifeSize;i++)life[i]=false;renderLife();};
  document.getElementById('lifeLoadPreset').onclick=function(){var preset=document.getElementById('lifePreset').value,i,x,y,points=[],pulsar=[[-4,-6],[-3,-6],[-2,-6],[2,-6],[3,-6],[4,-6],[-6,-4],[-1,-4],[1,-4],[6,-4],[-6,-3],[-1,-3],[1,-3],[6,-3],[-6,-2],[-1,-2],[1,-2],[6,-2],[-4,-1],[-3,-1],[-2,-1],[2,-1],[3,-1],[4,-1],[-4,1],[-3,1],[-2,1],[2,1],[3,1],[4,1],[-6,2],[-1,2],[1,2],[6,2],[-6,3],[-1,3],[1,3],[6,3],[-6,4],[-1,4],[1,4],[6,4],[-4,6],[-3,6],[-2,6],[2,6],[3,6],[4,6]];lifeStop();lifeGeneration=0;life=[];for(i=0;i<lifeSize*lifeSize;i++)life[i]=false;if(preset==='glider')points=[[0,-1],[1,0],[-1,1],[0,1],[1,1]];else if(preset==='beacon')points=[[-2,-2],[-1,-2],[-2,-1],[-1,-1],[1,1],[2,1],[1,2],[2,2]];else if(preset==='pulsar')points=pulsar;else if(preset==='random'){for(i=0;i<life.length;i++)life[i]=Math.random()<0.28;}if(points.length){for(i=0;i<points.length;i++){x=8+points[i][0];y=8+points[i][1];if(x>=0&&x<lifeSize&&y>=0&&y<lifeSize)life[y*lifeSize+x]=true;}}renderLife();closeAllSettings();};

  var wordleVeryEasy=['BANAN','CHLEB','KARTA','KWIAT','LAMPA','RADIO','SERCE','TORBA','WAGON','WIATR','ZEGAR'],wordleEasy=['BILET','BRAMA','DOMKI','DROGA','EKRAN','FOTEL','MIAST','MORZE','OBRAZ','PALEC','PISMO','ROBOT','SKLEP','SPORT','TRAWA'],wordleMedium=['GRUPA','LASER','NOCEK','PLAMA','POCIK','SLOWO','STAWY','AGORA','ASTER','FASON','KREDA','MOTYW','OPERA','RUBIN','TANGO','WIRUS'],wordleHard=['AMFOR','BULWA','KAPER','KLIKA','KNOTY','NURTY','PIAST','SZRON','TRAKT','ZATOR','ZEFIR','ZWROT'],wordleAnswer='',wordleGuess='',wordleRows=[],wordleOver=false,wordleHints=0,wordleHintPositions=[];
  function wordlePool(){var level=document.getElementById('wordleLevel').value;if(level==='veryeasy')return wordleVeryEasy;if(level==='easy')return wordleVeryEasy.concat(wordleEasy);if(level==='medium')return wordleVeryEasy.concat(wordleEasy,wordleMedium);return wordleVeryEasy.concat(wordleEasy,wordleMedium,wordleHard);}
  function newWordle(){var pool=wordlePool(),level=document.getElementById('wordleLevel').value;wordleAnswer=pool[Math.floor(Math.random()*pool.length)];wordleGuess='';wordleRows=[];wordleOver=false;wordleHints=level==='veryeasy'?3:(level==='easy'?2:(level==='medium'?1:0));wordleHintPositions=[];document.getElementById('wordleHintText').innerHTML='';document.getElementById('wordleStatus').innerHTML='Próba 1 z 6';document.getElementById('wordleHint').innerHTML='PODPOWIEDŹ ('+wordleHints+')';renderWordle();}
  function wordleGiveHint(){var available=[],i,p;if(wordleOver||wordleHints<=0)return;for(i=0;i<5;i++)if(wordleHintPositions.indexOf(i)<0)available.push(i);if(!available.length)return;p=available[Math.floor(Math.random()*available.length)];wordleHintPositions.push(p);wordleHints--;document.getElementById('wordleHintText').innerHTML=(p+1)+'. litera: '+wordleAnswer.charAt(p);document.getElementById('wordleHint').innerHTML='PODPOWIEDŹ ('+wordleHints+')';}
  function wordleResult(guess){var out=['bad','bad','bad','bad','bad'],left={},i,ch;for(i=0;i<5;i++)if(guess.charAt(i)===wordleAnswer.charAt(i))out[i]='right';else{ch=wordleAnswer.charAt(i);left[ch]=(left[ch]||0)+1;}for(i=0;i<5;i++)if(out[i]!=='right'){ch=guess.charAt(i);if(left[ch]){out[i]='near';left[ch]--;}}return out;}
  function wordlePress(v){if(wordleOver)return;if(v==='DEL'){wordleGuess=wordleGuess.slice(0,-1);}else if(v==='OK'){if(wordleGuess.length!==5){document.getElementById('wordleStatus').innerHTML='Wpisz 5 liter';renderWordle();return;}var result=wordleResult(wordleGuess);wordleRows.push({word:wordleGuess,result:result});if(wordleGuess===wordleAnswer){wordleOver=true;document.getElementById('wordleStatus').innerHTML='Brawo!';}else if(wordleRows.length===6){wordleOver=true;document.getElementById('wordleStatus').innerHTML='Słowo: '+wordleAnswer;}else document.getElementById('wordleStatus').innerHTML='Próba '+(wordleRows.length+1)+' z 6';wordleGuess='';}else if(wordleGuess.length<5)wordleGuess+=v;renderWordle();}
  function renderWordle(){var board=document.getElementById('wordleBoard'),keys=document.getElementById('wordleKeys'),r,i,c,row,letter,cell=Math.max(40,Math.min(64,Math.floor((window.innerWidth-32)/5)));board.innerHTML='';board.style.width=(cell*5)+'px';for(r=0;r<6;r++){row=r<wordleRows.length?wordleRows[r].word:(r===wordleRows.length?wordleGuess:'');for(i=0;i<5;i++){c=document.createElement('div');c.className='wordleCell'+(r<wordleRows.length?' '+wordleRows[r].result[i]:'');c.style.width=cell+'px';c.style.height=cell+'px';c.style.lineHeight=(cell-6)+'px';c.style.fontSize=Math.floor(cell*.48)+'px';c.innerHTML=row.charAt(i)||'';board.appendChild(c);}}if(!keys.innerHTML){var chars='QWERTYUIOPASDFGHJKLZXCVBNM'.split('');chars.push('DEL');chars.push('OK');for(i=0;i<chars.length;i++){letter=document.createElement('button');letter.innerHTML=chars[i];letter.setAttribute('data-v',chars[i]);letter.onclick=function(){wordlePress(this.getAttribute('data-v'));};keys.appendChild(letter);}}}
  document.getElementById('wordleNew').onclick=newWordle;
  document.getElementById('wordleLevel').onchange=newWordle;
  document.getElementById('wordleHint').onclick=wordleGiveHint;

  var canvas=document.getElementById('drawCanvas'),ctx=canvas.getContext('2d'),drawing=false,lastX=0,lastY=0,drawColor='#000000',drawEraser=false;
  function drawPrepare(){ctx.lineWidth=parseInt(document.getElementById('drawWidth').value,10)||6;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=drawEraser?'#ffffff':drawColor;ctx.fillStyle=ctx.strokeStyle;}
  function resizeDrawCanvas(){var rect=canvas.getBoundingClientRect(),w=Math.max(300,window.innerWidth-12),h=Math.max(360,window.innerHeight-(rect.top>80?rect.top:170)-8),old;if(canvas.width===w&&canvas.height===h)return;try{old=canvas.toDataURL('image/png');}catch(e){old='';}canvas.width=w;canvas.height=h;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.fillStyle='#ffffff';ctx.fillRect(0,0,w,h);drawPrepare();if(old){var img=new Image();img.onload=function(){ctx.drawImage(img,0,0,w,h);};img.src=old;}}
  function drawPos(e){var rect=canvas.getBoundingClientRect(),p=(e.touches&&e.touches.length?e.touches[0]:(e.targetTouches&&e.targetTouches.length?e.targetTouches[0]:(e.changedTouches&&e.changedTouches.length?e.changedTouches[0]:e)));return{x:(p.clientX-rect.left)*(canvas.width/rect.width),y:(p.clientY-rect.top)*(canvas.height/rect.height)};}
  function drawStart(e){var p=drawPos(e);drawing=true;drawPrepare();lastX=p.x;lastY=p.y;ctx.beginPath();ctx.arc(lastX,lastY,ctx.lineWidth/2,0,Math.PI*2,false);ctx.fill();if(e&&e.preventDefault)e.preventDefault();return false;}
  function drawMove(e){var p,dx,dy,steps,n,x,y;if(!drawing)return false;p=drawPos(e);dx=p.x-lastX;dy=p.y-lastY;steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/5));drawPrepare();ctx.beginPath();ctx.moveTo(lastX,lastY);for(n=1;n<=steps;n++){x=lastX+dx*n/steps;y=lastY+dy*n/steps;ctx.lineTo(x,y);}ctx.stroke();lastX=p.x;lastY=p.y;if(e&&e.preventDefault)e.preventDefault();return false;}
  function drawEnd(e){if(drawing&&e&&((e.changedTouches&&e.changedTouches.length)||typeof e.clientX==='number'))drawMove(e);drawing=false;if(e&&e.preventDefault)e.preventDefault();return false;}
  function drawCancel(e){drawing=false;if(e&&e.preventDefault)e.preventDefault();return false;}
  canvas.setAttribute('unselectable','on');canvas.onmousedown=drawStart;canvas.onmousemove=drawMove;canvas.onmouseup=drawEnd;canvas.onmouseout=function(e){if(e&&typeof e.buttons==='number'&&e.buttons===0)drawEnd(e);};canvas.ontouchstart=drawStart;canvas.ontouchmove=drawMove;canvas.ontouchend=drawEnd;canvas.ontouchcancel=drawCancel;canvas.onpointerdown=drawStart;canvas.onpointermove=drawMove;canvas.onpointerup=drawEnd;canvas.onmspointerdown=drawStart;canvas.onmspointermove=drawMove;canvas.onmspointerup=drawEnd;if(document.addEventListener){document.addEventListener('touchmove',drawMove,true);document.addEventListener('touchend',drawEnd,true);document.addEventListener('mousemove',drawMove,true);document.addEventListener('mouseup',drawEnd,true);}
  document.getElementById('drawClear').onclick=function(){ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);};
  var drawButtons=document.querySelectorAll('#drawTools button[data-color]'),db;for(db=0;db<drawButtons.length;db++)drawButtons[db].onclick=function(){var i;drawColor=this.getAttribute('data-color');drawEraser=false;for(i=0;i<drawButtons.length;i++)drawButtons[i].className='';this.className='selected';document.getElementById('drawEraser').className='';};
  document.getElementById('drawEraser').onclick=function(){var i;drawEraser=true;for(i=0;i<drawButtons.length;i++)drawButtons[i].className='';this.className='selected';};
  function drawLoadSaved(){var a;try{a=JSON.parse(localStorage.getItem('inkdeck_drawings')||'[]');}catch(e){a=[];}return a;}
  function drawRenderSaved(){var box=document.getElementById('drawSaved'),a=drawLoadSaved(),i,row,open,del;box.innerHTML='';for(i=0;i<a.length;i++){row=document.createElement('div');row.className='drawRow';row.appendChild(document.createTextNode(a[i].name));open=document.createElement('button');open.innerHTML='OTWÓRZ';open.setAttribute('data-i',i);open.onclick=function(){var item=drawLoadSaved()[parseInt(this.getAttribute('data-i'),10)],img;if(item){img=new Image();img.onload=function(){ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);};img.src=item.png;}};del=document.createElement('button');del.innerHTML='USUŃ';del.setAttribute('data-i',i);del.onclick=function(){var list=drawLoadSaved();list.splice(parseInt(this.getAttribute('data-i'),10),1);localStorage.setItem('inkdeck_drawings',JSON.stringify(list));drawRenderSaved();};row.appendChild(del);row.appendChild(open);box.appendChild(row);}}
  document.getElementById('drawSave').onclick=function(){var png=canvas.toDataURL('image/png'),name='InkDeck-szkic-'+new Date().getTime()+'.png',list=drawLoadSaved(),a;list.unshift({name:name,png:png});if(list.length>5)list.pop();try{localStorage.setItem('inkdeck_drawings',JSON.stringify(list));}catch(e){alert('Brak miejsca — usuń starszy szkic.');}drawRenderSaved();try{a=document.createElement('a');a.href=png;a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);}catch(ignoreDownload){alert('Szkic zapisano w InkDeck.');}};drawRenderSaved();

  var writerCurrent='';
  function writerLoadAll(){var raw;try{raw=localStorage.getItem('inkdeck_docs');return raw?JSON.parse(raw):{};}catch(e){return {};}}
  function writerRenderDocs(){var docs=writerLoadAll(),box=document.getElementById('writerDocs'),key,row,open,del;box.innerHTML='';for(key in docs)if(docs.hasOwnProperty(key)){row=document.createElement('div');row.className='docRow';row.appendChild(document.createTextNode(docs[key].title||'Bez tytułu'));open=document.createElement('button');open.innerHTML='OTWÓRZ';open.setAttribute('data-key',key);open.onclick=function(){var d=writerLoadAll()[this.getAttribute('data-key')];if(d){writerCurrent=this.getAttribute('data-key');document.getElementById('writerTitle').value=d.title;document.getElementById('writerEditor').innerHTML=d.body;}};del=document.createElement('button');del.innerHTML='USUŃ';del.setAttribute('data-key',key);del.onclick=function(){var all=writerLoadAll();delete all[this.getAttribute('data-key')];localStorage.setItem('inkdeck_docs',JSON.stringify(all));writerRenderDocs();};row.appendChild(del);row.appendChild(open);box.appendChild(row);}}
  document.getElementById('writerNew').onclick=function(){writerCurrent='';document.getElementById('writerTitle').value='';document.getElementById('writerEditor').innerHTML='';};
  document.getElementById('writerSave').onclick=function(){var docs=writerLoadAll(),title=document.getElementById('writerTitle').value||'Bez tytułu';if(!writerCurrent)writerCurrent='d'+new Date().getTime();docs[writerCurrent]={title:title,body:document.getElementById('writerEditor').innerHTML};try{localStorage.setItem('inkdeck_docs',JSON.stringify(docs));}catch(e){alert('Brak miejsca na zapis.');}writerRenderDocs();};
  document.getElementById('writerExport').onclick=function(){var title=document.getElementById('writerTitle').value||'InkDeck-dokument',editor=document.getElementById('writerEditor'),text=editor.innerText||editor.textContent||'',a,name=title.replace(/[^a-zA-Z0-9_-]/g,'_')+'.txt';try{a=document.createElement('a');a.href='data:text/plain;charset=utf-8,'+encodeURIComponent(text);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);}catch(e){alert('Najpierw zapisz dokument w InkDeck.');}};
  var formatButtons=document.querySelectorAll('.formatBar button'),fi;for(fi=0;fi<formatButtons.length;fi++)formatButtons[fi].onclick=function(){document.execCommand(this.getAttribute('data-cmd'),false,this.getAttribute('data-value')||null);document.getElementById('writerEditor').focus();};

  var todos=[];function todoLoad(){try{todos=JSON.parse(localStorage.getItem('inkdeck_todos')||'[]');}catch(e){todos=[];}todoRender();}function todoSave(){localStorage.setItem('inkdeck_todos',JSON.stringify(todos));todoRender();}function todoRender(){var box=document.getElementById('todoList'),i,row,btn;box.innerHTML='';for(i=0;i<todos.length;i++){row=document.createElement('div');row.className='todoRow'+(todos[i].done?' done':'');row.appendChild(document.createTextNode(todos[i].text));btn=document.createElement('button');btn.innerHTML=todos[i].done?'COFNIJ':'GOTOWE';btn.setAttribute('data-i',i);btn.onclick=function(){var n=parseInt(this.getAttribute('data-i'),10);todos[n].done=!todos[n].done;todoSave();};row.appendChild(btn);box.appendChild(row);}}
  document.getElementById('todoAdd').onclick=function(){var input=document.getElementById('todoInput'),v=input.value;if(v){todos.push({text:v,done:false});input.value='';todoSave();}};document.getElementById('todoClear').onclick=function(){var keep=[],i;for(i=0;i<todos.length;i++)if(!todos[i].done)keep.push(todos[i]);todos=keep;todoSave();};

  var calcValue='',calcChars=['C','DEL','%','/','7','8','9','*','4','5','6','-','1','2','3','+','±','0','.','='],calcSci=['(',')','sin','cos','tan','√','x²','1/x','log','ln','π','e'],calcBox=document.getElementById('calcKeys'),calcSciBox=document.getElementById('calcScientific'),ck,cb;
  function calcNumber(){var n;try{if(!/^[0-9+\-*/. ()]+$/.test(calcValue))throw 0;n=eval(calcValue);if(typeof n!=='number'||!isFinite(n))throw 0;return n;}catch(e){return null;}}
  function calcShow(){document.getElementById('calcDisplay').value=calcValue||'0';}
  function calcPress(v){var n;if(v==='C')calcValue='';else if(v==='DEL')calcValue=calcValue.slice(0,-1);else if(v==='='){n=calcNumber();calcValue=n===null?'BŁĄD':String(n);}else if(v==='π')calcValue+=(Math.PI);else if(v==='e')calcValue+=(Math.E);else if(v==='±'){n=calcNumber();calcValue=n===null?'BŁĄD':String(-n);}else if(v==='%'){n=calcNumber();calcValue=n===null?'BŁĄD':String(n/100);}else if(v==='sin'||v==='cos'||v==='tan'||v==='√'||v==='x²'||v==='1/x'||v==='log'||v==='ln'){n=calcNumber();if(n===null)calcValue='BŁĄD';else if(v==='sin')calcValue=String(Math.sin(n*Math.PI/180));else if(v==='cos')calcValue=String(Math.cos(n*Math.PI/180));else if(v==='tan')calcValue=String(Math.tan(n*Math.PI/180));else if(v==='√')calcValue=n<0?'BŁĄD':String(Math.sqrt(n));else if(v==='x²')calcValue=String(n*n);else if(v==='1/x')calcValue=n===0?'BŁĄD':String(1/n);else if(v==='log')calcValue=n<=0?'BŁĄD':String(Math.log(n)/Math.LN10);else calcValue=n<=0?'BŁĄD':String(Math.log(n));}else{if(calcValue==='BŁĄD')calcValue='';calcValue+=v;}calcShow();}
  function makeCalcButton(box,v){var b=document.createElement('button'),labels={'DEL':'⌫','/':'÷','*':'×','-':'−'};b.innerHTML=labels[v]||v;b.setAttribute('data-v',v);b.onclick=function(){calcPress(this.getAttribute('data-v'));};box.appendChild(b);}
  for(ck=0;ck<calcChars.length;ck++)makeCalcButton(calcBox,calcChars[ck]);for(ck=0;ck<calcSci.length;ck++)makeCalcButton(calcSciBox,calcSci[ck]);
  document.getElementById('calcMode').onclick=function(){var hidden=calcSciBox.className.indexOf('hidden')>=0;calcSciBox.className=hidden?'calcScientific':'calcScientific hidden';this.innerHTML=hidden?'ZWYKŁY':'NAUKOWY';};calcShow();

  function loadFileServerStatus(){var info=document.getElementById('filesInfo'),xhr=new XMLHttpRequest();try{xhr.open('GET','file:///mnt/us/extensions/InkDeck/filebrowser-status.txt?'+new Date().getTime(),true);xhr.onreadystatechange=function(){if(xhr.readyState===4){if(xhr.status===0||xhr.status===200)info.innerHTML=String(xhr.responseText||'').replace(/\n/g,'<br>');else info.innerHTML='Nie udało się odczytać statusu. Adres jest także pokazany na ekranie Kindle.';}};xhr.send(null);}catch(e){info.innerHTML='Adres i PIN są pokazane na ekranie Kindle.';}}
  document.getElementById('filesStart').onclick=function(){document.getElementById('filesInfo').innerHTML='Uruchamianie serwera...';try{if(window.kindle&&kindle.appmgr){kindle.appmgr.start('app://com.codex.inkdeck.files.start');setTimeout(loadFileServerStatus,1800);return;}}catch(e){}document.getElementById('filesInfo').innerHTML='Nie znaleziono modułu extensions/InkDeck.';};
  document.getElementById('filesStatus').onclick=loadFileServerStatus;
  document.getElementById('filesStop').onclick=function(){try{if(window.kindle&&kindle.appmgr)kindle.appmgr.start('app://com.codex.inkdeck.files.stop');}catch(e){}setTimeout(loadFileServerStatus,700);};

  var inkDeckVersion='3.5.4',latestReleaseUrl='https://api.github.com/repos/juliankaluga27-ux/InkDeck/releases/latest';
  document.getElementById('updateCheck').onclick=function(){var status=document.getElementById('updateStatus'),xhr=new XMLHttpRequest();status.innerHTML='Sprawdzanie GitHuba...';try{xhr.open('GET',latestReleaseUrl,true);xhr.timeout=20000;xhr.onreadystatechange=function(){var data,tag;if(xhr.readyState!==4)return;if(xhr.status>=200&&xhr.status<300){try{data=JSON.parse(xhr.responseText);tag=String(data.tag_name||'').replace(/^v/,'');status.innerHTML=tag&&tag!==inkDeckVersion?'Dostępna wersja: '+tag+'. Możesz ją zainstalować.':'Masz najnowszą wersję: '+inkDeckVersion+'.';}catch(e){status.innerHTML='GitHub odpowiedział, ale nie udało się odczytać wersji.';}}else status.innerHTML='Nie udało się połączyć z GitHubem. Sprawdź Wi-Fi.';};xhr.ontimeout=function(){status.innerHTML='Przekroczono czas połączenia. Sprawdź Wi-Fi.';};xhr.send(null);}catch(e){status.innerHTML='Sprawdzanie nie jest obsługiwane przez ten firmware. Instalator nadal może zadziałać.';}};
  document.getElementById('updateInstall').onclick=function(){var status=document.getElementById('updateStatus');if(!window.confirm||window.confirm('Pobrać i zainstalować najnowszy InkDeck z GitHuba?')){status.innerHTML='Uruchamiam aktualizator. Nie wyłączaj Kindle.';try{if(window.kindle&&kindle.appmgr){kindle.appmgr.start('app://com.codex.inkdeck.updater');setTimeout(function(){status.innerHTML='Aktualizator został uruchomiony.';},800);return;}}catch(e){}status.innerHTML='Nie znaleziono modułu aktualizacji. Zainstaluj pełną paczkę z folderem extensions.';}};

  InkDeck.hooks={};InkDeck.chessPieces={};
  InkDeck.on=function(event,fn){if(!this.hooks[event])this.hooks[event]=[];this.hooks[event].push(fn);};
  InkDeck.emit=function(event,data){var list=this.hooks[event]||[],i;for(i=0;i<list.length;i++)try{list[i](data);}catch(ignorePlugin){}};
  InkDeck.getChessState=function(){return{board:chess.slice(0),turn:chessTurn,lastMove:{from:chessLastFrom,to:chessLastTo}};};
  InkDeck.setChessPiece=function(square,piece){if(square>=0&&square<64&&/^[prnbqkPRNBQK]?$/.test(piece)){chess[square]=piece;renderChess();return true;}return false;};
  InkDeck.registerChessPiece=function(id,definition){this.chessPieces[id]=definition;};
  InkDeck.addChessAction=function(label,fn){var b=document.createElement('button');b.innerHTML=label;b.onclick=fn;document.querySelector('#chess .gameControls').appendChild(b);};
  function pluginEnabled(id){return localStorage.getItem('inkdeck_plugin_'+id)!=='off';}
  function openPlugin(index){var plug=InkDeck.plugins[index],id='plugin_'+plug.id,page=document.getElementById(id);if(!page){page=document.createElement('div');page.id=id;page.className='page';document.body.insertBefore(page,document.getElementsByTagName('script')[0]);plug.open(page,{back:function(){show('menu');},storage:localStorage});}show(id);document.getElementById('title').innerHTML=plug.name;}
  InkDeck.renderPlugins=function(){var box=document.getElementById('pluginList'),menu=document.getElementById('menuItems'),old=document.getElementsByClassName('pluginDynamic'),i,row,toggle,p,button,category,selected='games';while(old.length)old[0].parentNode.removeChild(old[0]);for(i=0;i<categoryButtons.length;i++)if(categoryButtons[i].className.indexOf('selected')>=0)selected=categoryButtons[i].getAttribute('data-category');box.innerHTML='';if(!InkDeck.plugins.length){box.innerHTML='<div class="pluginRow">Brak dodatkowych pluginów.</div>';return;}for(i=0;i<InkDeck.plugins.length;i++){p=InkDeck.plugins[i];row=document.createElement('div');row.className='pluginRow';row.appendChild(document.createTextNode(p.name+(p.kind?' — '+p.kind:'')));toggle=document.createElement('button');toggle.className='pluginToggle';toggle.setAttribute('data-i',i);toggle.innerHTML=pluginEnabled(p.id)?'WŁ.':'WYŁ.';toggle.onclick=function(){var plug=InkDeck.plugins[parseInt(this.getAttribute('data-i'),10)],on=pluginEnabled(plug.id);localStorage.setItem('inkdeck_plugin_'+plug.id,on?'off':'on');InkDeck.renderPlugins();};row.appendChild(toggle);box.appendChild(row);if(pluginEnabled(p.id)){category=(p.kind&&String(p.kind).toLowerCase().indexOf('narz')>=0)||(p.kind&&String(p.kind).toLowerCase().indexOf('tool')>=0)?'tools':'games';button=document.createElement('button');button.className='menuButton pluginDynamic'+(selected===category?'':' hidden');button.setAttribute('data-category',category);button.setAttribute('data-plugin-index',i);button.innerHTML=p.name+'<span class="pluginBadge">PLUGIN</span><span>'+(p.description||p.kind||'dodatek')+'</span>';button.onclick=function(){openPlugin(parseInt(this.getAttribute('data-plugin-index'),10));};menu.appendChild(button);}}};

  newTtt(); newMine(); new2048(); newMemory(); newChess(); newCheckers(); newConnect(); newLights(); document.getElementById('lifeClear').onclick(); newWordle(); writerRenderDocs(); todoLoad();
  window.onresize=function(){var active=document.querySelector('.page.active');if(active)renderPage(active.id);};
}());
