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
html = html.replace(/<img src="assets\/inkdeck-logo.png" alt="InkDeck">/, '<h1>INKDECK</h1>');
html = html.replace('<script src="settings-loader.js"></script>', '<script src="platform.js"></script><script src="network.js"></script>');
html = html.replace('<script src="updater.js"></script>','').replace('<script src="plugins-loader.js"></script>','');
html = html.replace('</body>','<script src="mobile.js"></script></body>');
fs.writeFileSync(path.join(out,'index.html'), html);
for (const name of fs.readdirSync(path.join(__dirname,'web'))) {
  fs.copyFileSync(path.join(__dirname,'web',name),path.join(out,name));
}
console.log('Prepared iOS web assets from Kindle 3.11.2');
