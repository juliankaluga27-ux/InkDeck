const fs=require('fs'),vm=require('vm'),assert=require('assert');
function boot(autoEnabled=false){
 const elements={},requests=[],prefs={autoupdate:autoEnabled?'true':'false'},started=[],timeouts=[],store={};
 function node(id){return elements[id]||(elements[id]={id,textContent:id==='updateCurrent'?'3.11.1':'',className:'',checked:false,disabled:false});}
 function XHR(){this.open=(method,url)=>{this.url=url;};this.setRequestHeader=()=>{};this.send=()=>requests.push(this);}
 const InkDeck={settingGet(k,f){return prefs[k]||f;},settingSet(k,v){prefs[k]=v;}};
 const ctx={InkDeck,document:{getElementById:node},XMLHttpRequest:XHR,Date,JSON,Math,setTimeout(fn){timeouts.push(fn);},setInterval(){return 1;},clearInterval(){},localStorage:{getItem(k){return store[k]||null;},setItem(k,v){store[k]=v;}},kindle:{appmgr:{start(id){started.push(id);}}}};ctx.window=ctx;
 vm.runInNewContext(fs.readFileSync('extensions/InkDeck/app/updater.js','utf8'),ctx);
 function reply(text,status=0){const x=requests.shift();assert(x);x.responseText=text;x.status=status;x.readyState=4;x.onreadystatechange();}
 return {node,reply,InkDeck,prefs,started,timeouts};
}
const a=boot();a.reply('3.11.1');a.reply('InkDeck: aktualizacja zakonczona.');assert(a.node('updateReadyNotice').className.includes('hidden'),'Same version must not be offered');assert.equal(a.started.length,0,'Auto download is opt-in');
assert(a.InkDeck.updates.newer('3.11.1','3.11.0'));assert(!a.InkDeck.updates.newer('3.11.0','3.11.1'));assert(a.InkDeck.updates.newer('3.11.0','3.10.9.3'));
a.node('updateAuto').checked=true;a.node('updateAuto').onchange();a.reply('3.12.0');a.reply(JSON.stringify({tag_name:'v3.12.0'}),200);assert.equal(a.prefs.autoupdate,'true');assert.equal(a.started.length,0,'Already staged updates must not download again');
assert.equal(a.node('updateInstall').textContent,'ZAINSTALUJ 3.12.0');a.node('updateInstall').onclick();assert.equal(a.started[0],'app://com.codex.inkdeck.updater');
const b=boot(true);b.reply('');b.reply('');b.timeouts.shift()();b.reply(JSON.stringify({tag_name:'v3.12.0'}),200);assert.equal(b.started.length,0,'Must not interrupt an active game');b.node('menu').className='page active';b.InkDeck.updates.onShow('menu');assert.equal(b.started[0],'app://com.codex.inkdeck.updater.download','Returning to menu starts download only');
const c=boot(true);c.reply('');c.reply('');c.timeouts.shift()();c.reply(JSON.stringify({tag_name:'v3.11.0'}),200);assert.equal(c.started.length,0,'Must never auto-download an older release');
console.log('Updater client checks passed: versions, no repeated notice, opt-in, staged install, deferred auto-download, no downgrade');
