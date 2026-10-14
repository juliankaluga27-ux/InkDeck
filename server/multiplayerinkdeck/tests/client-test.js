const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements={},requests=[],timers=[],storage={};
function node(id){return elements[id]||(elements[id]={id,children:[{}],className:'',value:'',disabled:false,textContent:'',style:{},insertBefore(){},appendChild(){},getAttribute(){return null;}});}
let applied=null,resets=0;
const InkDeck={settingGet(){return'pl';},show(){},onlineAdapter:{apply(x){applied=x;},redraw(){},select(){},reset(){resets++;}}};
function XHR(){this.open=()=>{};this.setRequestHeader=()=>{};this.send=body=>requests.push({xhr:this,body:JSON.parse(body)});}
const context={InkDeck,document:{getElementById:node,createElement:()=>node('element'+Object.keys(elements).length)},localStorage:{setItem(k,v){storage[k]=v;},getItem(k){return storage[k]||null;},removeItem(k){delete storage[k];}},XMLHttpRequest:XHR,setTimeout(fn){timers.push(fn);return timers.length;},clearTimeout(){},Math,JSON};
context.window=context;context.confirm=()=>true;
vm.runInNewContext(fs.readFileSync('extensions/InkDeck/app/multiplayer.js','utf8'),context);
function reply(data,status=200){const req=requests.shift();assert(req);req.xhr.status=status;req.xhr.responseText=JSON.stringify(data);req.xhr.readyState=4;req.xhr.onreadystatechange();return req.body;}
const start={ok:true,code:'ABCD2345',game:'ttt',revision:0,side:0,joined:false,token:'a'.repeat(64),state:{board:Array(9).fill(''),turn:0,over:false,winner:null,reason:'',draw_offer:null,rematch_offer:null},legal:Array.from({length:9},(_,to)=>({to}))};
node('tttOnlineCreate').onclick();assert.equal(requests[0].body.action,'create');reply(start);assert(InkDeck.online.active('ttt'));assert(storage.inkdeck_online_session);
InkDeck.online.tap('ttt',0);assert.equal(requests.length,0,'Cannot move before guest joins');
timers.pop()();const joined={...start,joined:true,revision:1};delete joined.token;reply(joined);
InkDeck.online.tap('ttt',0);assert.equal(requests[0].body.action,'move');assert.equal(requests[0].body.move.to,0);assert.equal(requests[0].body.revision,1);
const after={...joined,revision:2,state:{...joined.state,board:['X',...Array(8).fill('')],turn:1},legal:Array.from({length:8},(_,i)=>({to:i+1}))};reply(after);
InkDeck.online.tap('ttt',1);assert.equal(requests.length,0,'Cannot move for opponent');
timers.pop()();reply(joined);assert.equal(applied.revision,2,'Old poll cannot roll board back');
node('tttOnlineLeave').onclick();assert.equal(requests[0].body.action,'leave');reply({ok:false,error:'Pokój wygasł.'},403);assert(!InkDeck.online.active('ttt'));assert.equal(resets,1);assert(!storage.inkdeck_online_session);
node('chessOnlineCode').value='wrong';node('chessOnlineJoin').onclick();assert.equal(requests.length,0,'Reject malformed room codes locally');
console.log('Client checks passed: create, persist, wait, turn guard, move revision, stale response, expired room, invalid code');
