// Generate an iOS-only copy. Never edit the Kindle source files.
const fs = require('fs'), path = require('path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'extensions/InkDeck/app');
const out = path.join(__dirname, 'Web');
fs.mkdirSync(out, {recursive:true});
for (const name of ['app.js','style.css','new-games.js','extra-games.js','multiplayer.js']) {
  let text = fs.readFileSync(path.join(source,name),'utf8');
  if (name.endsWith('.js')) {
    // Keep every original renderer, but size it against the current page column.
    text = text.replace(/window\.innerWidth/g, 'InkDeck.viewportWidth()')
      .replace(/window\.innerHeight/g, 'InkDeck.viewportBottom()');
    if (name === 'app.js') {
      const aiStart = text.indexOf('  var aiConversation=');
      const aiEnd = text.indexOf('  InkDeck.onlineAdapter=',aiStart);
      if(aiStart<0||aiEnd<0)throw new Error('Cannot isolate legacy AI');
      text=text.slice(0,aiStart)+text.slice(aiEnd);
      // Document-level draw listeners must not cancel taps outside a drawing gesture.
      for (const fn of ['drawEnd','drawCancel']) {
        const signature = 'function '+fn+'(e){';
        if (!text.includes(signature)) throw new Error('Missing drawing handler: '+fn);
        text = text.replace(signature, signature+'if(!drawing&&!drawTouching)return;');
      }
      text = text.replace("c.innerHTML = ttt[i] || '';", "c.innerHTML = ttt[i] || '';c.className += ttt[i]?' ttt'+ttt[i]:'';c.setAttribute('role','button');c.setAttribute('aria-label','Pole '+(i+1)+': '+(ttt[i]||'puste'));");
      text = text.replace("c.innerHTML=grid[i]||'';", "c.setAttribute('data-value',grid[i]);c.innerHTML=grid[i]||'';");
      text = text.replace("rows=inkDeckLanguage==='en'?['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']:inkDeckLanguage==='en'?['QWERTYU','IOPASDF','GHJKLZX','CVBNM']:['QWERTYU','IOPASDF','GHJKLZX','CVBNMĄĘ','ŁŃÓŚŹŻ']", "rows=inkDeckLanguage==='en'?['QWERTYUIOP','ASDFGHJKL','ZXCVBNM']:['QWERTYUIOP','ASDFGHJKL','ZXCVBNM','ĄĆĘŁŃÓŚŹŻ']");
      text = text.replace('cell=Math.max(72,Math.min(94,Math.floor((InkDeck.viewportWidth()-30)/5)))', 'cell=InkDeck.wordleCellSize()');
      // Font metrics and vertical alignment must scale with the square, including after moves.
      text=text.replace('piece=Math.max(30,cell-12)', 'piece=Math.max(8,Math.floor(cell*.82))');
      text=text.replaceAll("b.innerHTML='';for(i=0;i<64;i++){", "b.style.setProperty('--chess-cell',cell+'px');b.innerHTML='';for(i=0;i<64;i++){");
    }
    if (name === 'new-games.js') {
      text = text.replace('function snakeStep(){',
        "function snakeStep(){if(document.hidden||!document.querySelector('#snake.active'))return;");
    }
  }
  fs.writeFileSync(path.join(out,name), text);
}
let html = fs.readFileSync(path.join(source,'main.page'),'utf8');
html = html.replace('initial-scale=1,user-scalable=no','initial-scale=1,viewport-fit=cover');
html = html.replace('</head>','<link rel="stylesheet" href="mobile.css"></head>');
html = html.replace(/<img src="assets\/inkdeck-logo.png" alt="InkDeck">/, '<img src="assets/inkdeck-logo.png" alt="InkDeck"><div class="brandText"><h1>INKDECK</h1></div>');
html = html.replace('data-color="#555555">CIEMNY', 'data-color="#2563eb">NIEBIESKI')
  .replace('data-color="#999999">SZARY', 'data-color="#16a34a">ZIELONY')
  .replace('data-color="#dddddd">JASNY', 'data-color="#dc2626">CZERWONY');
html = html.replace('<script src="settings-loader.js"></script>', '<script src="platform.js"></script><script src="network.js"></script>');
html = html.replace('<script src="updater.js"></script>','').replace('<script src="plugins-loader.js"></script>','');
html=html.replace(/<div id="kindleai"[\s\S]*?(?=<div id="plugins")/,fs.readFileSync(path.join(__dirname,'web/ai.html'),'utf8'));
html = html.replace('</body>','<script src="mobile.js"></script><script src="models.js"></script><script src="ai.js"></script></body>');
fs.writeFileSync(path.join(out,'index.html'), html);
fs.mkdirSync(path.join(out,'assets'), {recursive:true});
fs.copyFileSync(path.join(source,'assets/inkdeck-logo.png'),path.join(out,'assets/inkdeck-logo.png'));
// Explicit names also work on Windows, where Web and web refer to the same folder.
for (const name of ['platform.js','network.js','mobile.js','mobile.css','ai.js','models.js']) {
  fs.copyFileSync(path.join(__dirname,'web',name),path.join(out,name));
}
console.log('Prepared iOS web assets from Kindle 3.11.2');
