const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const nodes={},requests=[],timers=[],storage={};
function node(id){return nodes[id]||(nodes[id]={id,className:'',value:'',textContent:'',innerHTML:'',disabled:false,children:[],appendChild(n){this.children.push(n);},insertBefore(n){this.children.push(n);},getAttribute(k){return this[k]||null;},setAttribute(k,v){this[k]=v;}});}
function XHR(){this.open=()=>{};this.setRequestHeader=()=>{};this.send=body=>requests.push({xhr:this,body:JSON.parse(body)});}
let finalState=null;
const InkDeck={settingGet:(k,f)=>f,settingSet(){},show(){},onlineAdapter:{apply(data){finalState=data;},redraw(){},prepare(){},select(){},clock(){},reset(){}}};
const document={getElementById:node,createElement:()=>node('dynamic'+Object.keys(nodes).length)};
const ctx={InkDeck,document,localStorage:{setItem(k,v){storage[k]=v;},getItem(k){return storage[k]||null;},removeItem(k){delete storage[k];}},XMLHttpRequest:XHR,window:{confirm:()=>true},confirm:()=>true,setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},setInterval(){return 1;},clearInterval(){},Math,JSON,Date};
ctx.window=ctx;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../Web/multiplayer.js'),'utf8'),ctx);
function reply(data,status=200){const req=requests.shift();assert(req,'Expected pending multiplayer request');req.xhr.status=status;req.xhr.responseText=JSON.stringify(data);req.xhr.readyState=4;req.xhr.onreadystatechange();return req.body;}
const code='ABCD2345',token='a'.repeat(64),board=Array(64).fill('');
node('chessOnlineCreate').onclick();assert.equal(requests[0].body.action,'create');
reply({ok:true,code,game:'chess',revision:0,side:0,joined:true,token,state:{board,turn:0,over:false,winner:null,reason:'',remaining:[0,0],clock_started:false,draw_offer:null,rematch_offer:null},legal:[]});
assert(ctx.InkDeck.online.active('chess'));assert(storage.inkdeck_online_session);
timers.shift()();assert.equal(requests[0].body.action,'state');
const ended={ok:true,code,game:'chess',revision:1,side:0,joined:true,state:{board,turn:0,over:true,winner:0,reason:'mat',remaining:[0,0],clock_started:false,draw_offer:null,rematch_offer:null},legal:[]};
reply(ended);
assert.equal(finalState.revision,ended.revision,'Keep the completed board visible');
assert(!ctx.InkDeck.online.active('chess'),'Automatically leave the ended room');
assert(!storage.inkdeck_online_session,'Clear the saved room token');
assert.notEqual(node('chessOnlineForm').className,'hidden','Show create/join controls after game end');
assert(/Pokój zakończony/.test(node('chessStatus').textContent),'Tell the player a new room can be started');
node('checkersOnlineCreate').onclick();assert.equal(requests[0].body.action,'create','Allow an immediate new game with another player');
reply({ok:true,code:'EFGH2345',game:'checkers',revision:0,side:1,joined:true,token:'b'.repeat(64),state:{board,turn:1,over:false,winner:null,reason:'',draw_offer:null,rematch_offer:null},legal:[]});
assert(ctx.InkDeck.online.active('checkers'));
timers.shift()();
reply({ok:true,code:'EFGH2345',game:'checkers',revision:1,side:1,joined:true,state:{board,turn:1,over:true,winner:1,reason:'brak ruchów',draw_offer:null,rematch_offer:null},legal:[]});
assert(!ctx.InkDeck.online.active('checkers'),'Checkers also leaves its ended room automatically');
assert(!storage.inkdeck_online_session,'Checkers clears the saved room token');
assert.notEqual(node('checkersOnlineForm').className,'hidden','Checkers offers another room after the result');
console.log('Multiplayer checks passed: terminal state releases the room locally and permits a new room');
