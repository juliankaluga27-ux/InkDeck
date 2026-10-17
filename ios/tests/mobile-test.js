const fs = require('fs'), vm = require('vm'), assert = require('assert'), path = require('path');
const base = path.join(__dirname,'../Web');
const app = fs.readFileSync(path.join(base,'app.js'),'utf8');
const html = fs.readFileSync(path.join(base,'index.html'),'utf8');
// Every local script/style in the actual generated bundle must exist.
for (const match of html.matchAll(/(?:src|href)="([^"#:]+)"/g)) {
  assert(fs.existsSync(path.join(base,match[1])), 'Missing resource: '+match[1]);
}
assert(!html.includes('updater.js'));
assert(!html.includes('settings-loader.js'));
const nodes = {};
function node(id) {
  return nodes[id] || (nodes[id] = {id,children:[],style:{},className:'',textContent:'',innerHTML:'',
    getBoundingClientRect:()=>({top:160}), setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},
    appendChild(n){this.children.push(n)},addEventListener(){}});
}
let width = 390, height = 760, hidden = false, active = true;
const document = {getElementById:node,createElement:()=>node('n'+Object.keys(nodes).length),
  querySelector:()=>active?{}:null,get hidden(){return hidden}};
const ctx = {document,InkDeck:{viewportWidth:()=>width,viewportBottom:()=>height,
  settingGet:(k,f)=>f,settingSet(){},isHacked:()=>false},Math,Date,JSON,console,
  localStorage:{getItem:()=>null,setItem(){}},setInterval(){},clearInterval(){},setTimeout(){},clearTimeout(){}};
const fit = app.match(/  function fitGrid\([^\n]+/)[0];
vm.runInNewContext(fit,ctx);
const games = fs.readFileSync(path.join(base,'new-games.js'),'utf8').replace(/\}\(\)\);\s*$/,
  'InkDeck.test={snake:snake,snakeStep:snakeStep,snakeRender:snakeRender,sudokuRender:sudokuRender,sudoku:sudoku};}());');
vm.runInNewContext(games,ctx);
for (const size of [[320,568],[390,760],[844,320],[768,980],[1024,720],[375,720]]) {
  [width,height]=size;
  const b=node('chessBoard'); ctx.fitGrid(b,8,8,190,8,0);
  assert(parseInt(b.style.width)<=width,'Chess fits width '+size);
  ctx.InkDeck.test.snakeRender();
  assert(parseInt(node('snakeBoard').style.width)<=width,'Snake fits width '+size);
  ctx.InkDeck.test.sudoku.grid=Array(81).fill(0);ctx.InkDeck.test.sudoku.given=Array(81).fill(false);
  ctx.InkDeck.test.sudokuRender();
  assert(parseInt(node('sudokuBoard').style.width)<=width,'Sudoku fits width '+size);
}
const snake=ctx.InkDeck.test.snake;snake.body=[78,77,76];snake.dir=[1,0];snake.food=0;
hidden=true;ctx.InkDeck.test.snakeStep();assert.equal(snake.body[0],78,'No movement in background');
hidden=false;active=false;ctx.InkDeck.test.snakeStep();assert.equal(snake.body[0],78,'No movement outside Snake');
active=true;ctx.InkDeck.test.snakeStep();assert.equal(snake.body[0],79);
// Exercise the real JS bridge: room payload, completion, timeout and aborted response.
let payload;
const window={webkit:{messageHandlers:{inkdeckNetwork:{postMessage:p=>payload=p}}},XMLHttpRequest:function(){}};
vm.runInNewContext(fs.readFileSync(path.join(base,'network.js'),'utf8'),{window});
const xhr=new window.XMLHttpRequest();let finished=0;
xhr.open('POST','https://multiplicatingkid.pl/multiplayerinkdeck/api.php',true);
xhr.setRequestHeader('Content-Type','application/json');xhr.onreadystatechange=()=>{if(xhr.readyState===4)finished++};
xhr.send('{"action":"create"}');assert.equal(payload.method,'POST');
window.InkDeckNative.complete(payload.id,200,'{"ok":true}','');assert.equal(xhr.status,200);assert.equal(finished,1);
window.InkDeckNative.complete(payload.id,200,'{}','');assert.equal(finished,1);
let timedOut=false;xhr.ontimeout=()=>{timedOut=true};xhr.send('{}');window.InkDeckNative.complete(payload.id,0,'','timeout');assert(timedOut);
xhr.send('{}');xhr.abort();window.InkDeckNative.complete(payload.id,200,'{}','');assert.equal(xhr.readyState,0);
console.log('Mobile checks passed: assets, six viewport sizes, Snake background/menu pause, network response/timeout/abort');
