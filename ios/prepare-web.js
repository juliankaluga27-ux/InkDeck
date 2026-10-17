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
      // Document-level draw listeners must not cancel taps outside a drawing gesture.
      for (const fn of ['drawEnd','drawCancel']) {
        const signature = 'function '+fn+'(e){';
        if (!text.includes(signature)) throw new Error('Missing drawing handler: '+fn);
        text = text.replace(signature, signature+'if(!drawing&&!drawTouching)return;');
      }
      text = text.replace("c.innerHTML = ttt[i] || '';", "c.innerHTML = ttt[i] || '';c.className += ttt[i]?' ttt'+ttt[i]:'';c.setAttribute('role','button');c.setAttribute('aria-label','Pole '+(i+1)+': '+(ttt[i]||'puste'));");
      text = text.replace("c.innerHTML=grid[i]||'';", "c.setAttribute('data-value',grid[i]);c.innerHTML=grid[i]||'';");
      text = text.replace('cell=Math.max(72,Math.min(94,Math.floor((InkDeck.viewportWidth()-30)/5)))',
        'cell=Math.max(40,Math.min(72,Math.floor((InkDeck.viewportWidth()-30)/5)))');
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
html = html.replace('</body>','<script src="mobile.js"></script></body>');
fs.writeFileSync(path.join(out,'index.html'), html);
fs.mkdirSync(path.join(out,'assets'), {recursive:true});
fs.copyFileSync(path.join(source,'assets/inkdeck-logo.png'),path.join(out,'assets/inkdeck-logo.png'));
// Explicit names also work on Windows, where Web and web refer to the same folder.
for (const name of ['platform.js','network.js','mobile.js','mobile.css']) {
  fs.copyFileSync(path.join(__dirname,'web',name),path.join(out,name));
}
console.log('Prepared iOS web assets from Kindle 3.11.2');
