/* Exercise the shipped AI code with deterministic provider responses; no live API calls. */
const fs=require('fs'),vm=require('vm'),assert=require('assert'),{webcrypto}=require('crypto');
const data=new Map(),requests=[];
class Node {
  constructor(id=''){this.id=id;this.value='';this.children=[];this.textContent='';this.style={};this.disabled=false;this.files=[];this.classes=new Set(['hidden']);this.classList={toggle:(name,force)=>force?this.classes.add(name):this.classes.delete(name),contains:name=>this.classes.has(name)};}
  replaceChildren(){this.children=[];this.value='';}
  appendChild(n){this.children.push(n);if(!this.value&&n.value)this.value=n.value;return n;}
  click(){return this.onclick?.({preventDefault(){}});}
}
function boot(){
  const nodes={};const get=id=>nodes[id]||(nodes[id]=new Node(id));
  class XHR {open(method,url){this.method=method;this.url=url;this.headers={};}setRequestHeader(k,v){this.headers[k]=v;}send(body){this.body=body&&JSON.parse(body);requests.push(this);}respond(body,status=200){this.readyState=4;this.status=status;this.responseText=JSON.stringify(body);this.onreadystatechange();}}
  const ctx={document:{getElementById:get,createElement:()=>new Node()},window:{},InkDeck:{settingGet:(k,f)=>f},
    localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)},
    XMLHttpRequest:XHR,TextEncoder,TextDecoder,Uint8Array,crypto:webcrypto,btoa,atob,prompt:()=>null,confirm:()=>true};
  vm.createContext(ctx);vm.runInContext(fs.readFileSync('ios/Web/models.js','utf8'),ctx);vm.runInContext(fs.readFileSync('ios/Web/ai.js','utf8'),ctx);
  return {ctx,get,db:()=>JSON.parse(data.get('inkdeck_ai_chats_v1')),click:id=>get(id).click(),input:(id,value)=>{get(id).value=value;get(id).oninput?.();},provider:p=>{get('aiProvider').value=p;get('aiProvider').onchange();},send:()=>get('aiComposer').onsubmit({preventDefault(){}})};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
  let app=boot();assert.equal(app.db().chats.length,1);
  app.click('aiChooseModel');assert(app.get('aiModelList').children.length>300);
  app.input('aiModelSearch','claude');assert(app.get('aiModelList').children.length>0);assert(app.get('aiModelList').children.every(x=>/claude/i.test(x.textContent)));
  app.click('aiSettingsOpen');app.input('aiKey','unit-only-secret');app.click('aiSettingsClose');
  const first=app.db().active;app.input('aiPrompt','Temat pierwszy');app.send();const firstRequest=requests.at(-1);
  assert.equal(firstRequest.url,'https://openrouter.ai/api/v1/chat/completions');assert.equal(firstRequest.body.messages[0].content,'Temat pierwszy');
  app.click('aiNewChat');const second=app.db().active;assert.notEqual(first,second);
  firstRequest.respond({choices:[{message:{content:'Odpowiedź do pierwszego czatu'}}]});await tick();
  assert.equal(app.db().chats.find(c=>c.id===first).messages.length,2);assert.equal(app.db().chats.find(c=>c.id===second).messages.length,0);
  assert(!app.get('aiMessages').children.some(x=>x.textContent.includes('Odpowiedź do pierwszego')));
  app.get('aiChats').value=first;app.get('aiChats').onchange();app.input('aiPrompt','Dalszy ciąg');app.send();
  assert.equal(requests.at(-1).body.messages.length,3);requests.at(-1).respond({choices:[{message:{content:'Ciąg dalszy'}}]});await tick();
  app.input('aiPrompt','Szkic wiadomości');app=boot();assert.equal(app.get('aiPrompt').value,'Szkic wiadomości');assert.equal(app.db().chats.length,2);
  app.ctx.prompt=()=>'<b>Własny tytuł</b>';app.click('aiRenameChat');assert.equal(app.db().chats.find(c=>c.id===first).title,'<b>Własny tytuł</b>');
  assert(!Array.from(data.values()).some(x=>x.includes('unit-only-secret')),'Session keys must not leak to persistence');
  app.click('aiSettingsOpen');app.provider('google');app.input('aiKey','unit-google-secret');const refresh=app.click('aiRefreshModels');
  assert.equal(requests.at(-1).method,'GET');requests.at(-1).respond({models:[{name:'models/gemini-3.8-flash',displayName:'Gemini Flash',supportedGenerationMethods:['generateContent']},{name:'models/embedding-001',supportedGenerationMethods:['embedContent']}],nextPageToken:'next/+'});await tick();
  assert(requests.at(-1).url.includes('pageToken=next%2F%2B'));requests.at(-1).respond({models:[{name:'models/gemma-4',supportedGenerationMethods:['generateContent']}]});await refresh;
  assert.equal(JSON.parse(data.get('inkdeck_ai_catalogs_v1')).google.models.length,2);
  app.click('aiSettingsClose');app.input('aiPrompt','Google test');app.send();
  assert(requests.at(-1).url.endsWith('/models/gemini-3.8-flash:generateContent'));assert.equal(requests.at(-1).body.contents[0].role,'user');
  requests.at(-1).respond({candidates:[{content:{parts:[{text:'Nie pokazuj',thought:true},{text:'Tekst Gemini'}]}}]});await tick();assert(app.db().chats.find(c=>c.id===first).messages.at(-1).text==='Tekst Gemini');
  app.click('aiSettingsOpen');app.provider('openai');app.input('aiKey','unit-openai-secret');const refreshOpenAI=app.click('aiRefreshModels');
  requests.at(-1).respond({data:[{id:'gpt-4.1'},{id:'text-embedding-3-small'},{id:'gpt-audio'}]});await refreshOpenAI;assert.equal(JSON.parse(data.get('inkdeck_ai_catalogs_v1')).openai.models.length,1);
  app.click('aiSettingsClose');app.input('aiPrompt','OpenAI test');app.send();assert.equal(requests.at(-1).body.store,false);
  requests.at(-1).respond({output:[{content:[{type:'output_text',text:'Tekst Responses'}]}]});await tick();assert.equal(app.db().chats.find(c=>c.id===first).messages.at(-1).text,'Tekst Responses');
  app.click('aiSettingsOpen');app.input('aiVaultPass','test-passphrase');await app.click('aiSaveKey');
  const vault=JSON.parse(data.get('inkdeck_ai_vault_openai'));assert.equal(vault.v,1);assert(!data.get('inkdeck_ai_vault_openai').includes('unit-openai-secret'));
  app=boot();app.click('aiSettingsOpen');assert.equal(app.get('aiKey').value,'');app.input('aiVaultPass','wrong');await app.click('aiUnlockKey');assert.equal(app.get('aiKey').value,'');
  app.input('aiVaultPass','test-passphrase');await app.click('aiUnlockKey');assert.equal(app.get('aiKey').value,'unit-openai-secret');
  app.click('aiSettingsClose');app.input('aiPrompt','Request error');app.send();requests.at(-1).respond({error:{message:'Model unavailable'}},403);await tick();assert.equal(app.get('aiStatus').textContent,'Model unavailable');assert.equal(app.get('aiSend').disabled,false);
  const count=app.db().chats.length;app.click('aiDeleteChat');assert.equal(app.db().chats.length,count-1);app.click('aiDeleteChat');assert.equal(app.db().chats.length,1);
  console.log('AI checks passed: searchable catalogs, separate persistent chats/drafts, pending response isolation, provider payloads/parsing, paginated models, no plaintext keys, encrypted vault reload/unlock, errors and deletion');
})().catch(e=>{console.error(e);process.exitCode=1;});
