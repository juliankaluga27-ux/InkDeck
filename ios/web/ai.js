(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const read = (key,fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const storeKey='inkdeck_ai_chats_v1', catalogKey='inkdeck_ai_catalogs_v1';
  const keys={}, pending={};
  const defaults={openrouter:'openai/gpt-4o-mini',openai:'gpt-4o-mini',google:'gemini-3.8-flash'};
  const db=read(storeKey,{chats:[],active:''});
  if(!Array.isArray(db.chats))db.chats=[];
  const catalogs=read(catalogKey,{});
  const providerName=p=>({openrouter:'OpenRouter',openai:'OpenAI',google:'Gemini'}[p]||p);
  const current=()=>db.chats.find(c=>c.id===db.active);
  function status(text){$('aiStatus').textContent=text;}
  function save(){try{localStorage.setItem(storeKey,JSON.stringify(db));}catch(_){status('Nie udało się zapisać czatów: brak miejsca na urządzeniu.');}}
  function makeChat(provider,model){
    const c={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),title:'Nowy czat',customTitle:false,
      provider:provider||InkDeck.settingGet('aiprovider','openrouter'),model:model||'',messages:[],draft:'',updated:Date.now()};
    if(!defaults[c.provider])c.provider='openrouter';
    c.model=c.model||InkDeck.settingGet('aimodel',defaults[c.provider]); db.chats.unshift(c);db.active=c.id;save();return c;
  }
  if(!db.chats.length)makeChat();
  if(!current())db.active=db.chats[0].id;
  function renderList(){
    const list=$('aiChats');list.replaceChildren();
    db.chats.forEach(c=>{const option=document.createElement('option');option.value=c.id;option.textContent=(pending[c.id]?'⏳ ':'')+c.title;list.appendChild(option);});
    list.value=db.active;
  }
  function render(){
    const c=current(), box=$('aiMessages');renderList();box.replaceChildren();
    if(!c.messages.length){const welcome=document.createElement('div');welcome.className='aiWelcome';welcome.textContent='W czym mogę pomóc?';box.appendChild(welcome);}
    c.messages.forEach(m=>{const item=document.createElement('div');item.className='aiMessage '+m.role;item.textContent=m.text;box.appendChild(item);});
    box.scrollTop=box.scrollHeight;
    $('aiPrompt').value=c.draft||'';
    $('aiChooseModel').textContent=providerName(c.provider)+' · '+c.model+' ▾';
    $('aiSend').disabled=!!pending[c.id];
    $('aiChooseModel').disabled=!!pending[c.id];
    status(pending[c.id]?'Oczekiwanie na odpowiedź…':(c.error||''));
  }
  $('aiChats').onchange=()=>{const old=current();old.draft=$('aiPrompt').value;db.active=$('aiChats').value;save();render();};
  $('aiNewChat').onclick=()=>{const old=current();old.draft=$('aiPrompt').value;makeChat(old.provider,old.model);render();};
  $('aiRenameChat').onclick=()=>{const c=current(),name=prompt('Nazwa czatu',c.title);if(name&&name.trim()){c.title=name.trim().slice(0,100);c.customTitle=true;save();renderList();}};
  $('aiDeleteChat').onclick=()=>{const c=current();if(!confirm('Usunąć czat „'+c.title+'”?'))return;db.chats=db.chats.filter(x=>x.id!==c.id);db.active=db.chats[0]?.id||'';if(!db.chats.length)makeChat(c.provider,c.model);save();render();};
  $('aiPrompt').oninput=()=>{current().draft=$('aiPrompt').value;save();};
  function request(method,url,key,provider,body){return new Promise((resolve,reject)=>{
    const xhr=new XMLHttpRequest();xhr.open(method,url,true);xhr.timeout=90000;
    if(key)xhr.setRequestHeader(provider==='google'?'x-goog-api-key':'Authorization',provider==='google'?key:'Bearer '+key);
    if(body)xhr.setRequestHeader('Content-Type','application/json');
    xhr.onreadystatechange=()=>{if(xhr.readyState!==4)return;let data;try{data=JSON.parse(xhr.responseText);}catch(_){reject(new Error('Nieprawidłowa odpowiedź serwera (HTTP '+xhr.status+').'));return;}
      if(xhr.status>=200&&xhr.status<300)resolve(data);else {let message=data.error?.message||'Błąd HTTP '+xhr.status+'. Sprawdź klucz i dostęp do modelu.';if(key)message=message.split(key).join('[ukryty klucz]');reject(new Error(message));}};
    xhr.onerror=()=>reject(new Error('Brak połączenia z dostawcą AI. Sprawdź internet.'));
    xhr.ontimeout=()=>reject(new Error('Przekroczono czas oczekiwania.'));
    try{xhr.send(body?JSON.stringify(body):null);}catch(e){reject(e);}
  });}
  async function send(){
    const c=current(), text=$('aiPrompt').value.trim(), provider=c.provider, model=c.model, key=keys[provider];
    if(pending[c.id]||!text)return;
    if(!key){status('Otwórz Ustawienia API i wpisz lub odblokuj klucz.');$('aiSettingsOpen').click();return;}
    c.messages.push({role:'user',text});c.draft='';c.error='';
    if(!c.customTitle&&c.messages.length===1)c.title=text.slice(0,48);
    pending[c.id]=true;save();render();
    const history=c.messages.map(m=>({role:m.role,content:m.text}));let url,body;
    if(provider==='google'){
      url='https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent';
      body={contents:history.map(m=>({role:m.role==='assistant'?'model':'user',parts:[{text:m.content}]}))};
    }else if(provider==='openrouter'){
      url='https://openrouter.ai/api/v1/chat/completions';body={model,messages:history};
    }else{
      url='https://api.openai.com/v1/responses';body={model,input:history,store:false};
    }
    try{
      const data=await request('POST',url,key,provider,body);let answer='';
      if(provider==='google')answer=(data.candidates?.[0]?.content?.parts||[]).filter(x=>!x.thought).map(x=>x.text||'').join('');
      else if(provider==='openrouter')answer=data.choices?.[0]?.message?.content||'';
      else answer=data.output_text||(data.output||[]).flatMap(x=>x.content||[]).map(x=>x.text||'').join('');
      if(typeof answer!=='string'||!answer.trim())throw new Error('Model nie zwrócił tekstu. Wybierz model do rozmów tekstowych.');
      if(db.chats.includes(c))c.messages.push({role:'assistant',text:answer});
    }catch(e){if(db.chats.includes(c))c.error=e.message;}
    finally{delete pending[c.id];c.updated=Date.now();save();if(db.active===c.id)render();else renderList();}
  }
  $('aiComposer').onsubmit=e=>{e.preventDefault();send();};
  $('aiPrompt').onkeydown=e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();send();}};
  const panel=(id,open)=>$(id).classList.toggle('hidden',!open);
  $('aiSettingsOpen').onclick=()=>{const c=current();$('aiProvider').value=c.provider;$('aiProvider').disabled=!!pending[c.id];$('aiKey').value=keys[c.provider]||'';$('aiVaultPass').value='';panel('aiSettingsPanel',true);};
  $('aiSettingsClose').onclick=()=>{panel('aiSettingsPanel',false);render();};
  $('aiKey').oninput=()=>{keys[$('aiProvider').value]=$('aiKey').value.trim();};
  $('aiProvider').onchange=()=>{const c=current();c.provider=$('aiProvider').value;c.model=defaults[c.provider];$('aiKey').value=keys[c.provider]||'';$('aiSettingsStatus').textContent='';save();render();};
  $('aiKeyFile').onchange=async function(){const file=this.files?.[0];if(file){keys[$('aiProvider').value]=(await file.text()).trim();$('aiKey').value=keys[$('aiProvider').value];$('aiSettingsStatus').textContent='Klucz wczytany na czas sesji.';}this.value='';};
  const bytes=new TextEncoder(), decode=new TextDecoder();
  const to64=a=>btoa(Array.from(a,x=>String.fromCharCode(x)).join(''));
  const from64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  async function derive(pass,salt){const raw=await crypto.subtle.importKey('raw',bytes.encode(pass),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:150000,hash:'SHA-256'},raw,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
  function settingsStatus(text){$('aiSettingsStatus').textContent=text;}
  $('aiSaveKey').onclick=async()=>{const p=$('aiProvider').value,pass=$('aiVaultPass').value,key=keys[p];
    if(!key||!pass){settingsStatus('Wpisz klucz i hasło do sejfu.');return;}
    try{const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await derive(pass,salt),bytes.encode(key));
      localStorage.setItem('inkdeck_ai_vault_'+p,JSON.stringify({v:1,salt:to64(salt),iv:to64(iv),data:to64(new Uint8Array(cipher))}));$('aiVaultPass').value='';settingsStatus('Klucz zapisany szyfrowany.');
    }catch(_){settingsStatus('Nie udało się zaszyfrować klucza.');}};
  $('aiUnlockKey').onclick=async()=>{const p=$('aiProvider').value,pass=$('aiVaultPass').value,vault=read('inkdeck_ai_vault_'+p,null);
    if(!vault||!pass){settingsStatus('Wpisz hasło. Klucz musi być wcześniej zapisany.');return;}
    try{const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:from64(vault.iv)},await derive(pass,from64(vault.salt)),from64(vault.data));keys[p]=decode.decode(clear);if($('aiProvider').value===p)$('aiKey').value=keys[p];$('aiVaultPass').value='';settingsStatus('Klucz odblokowany na czas sesji.');}
    catch(_){settingsStatus('Nieprawidłowe hasło albo uszkodzony sejf.');}};
  $('aiForget').onclick=()=>{const p=$('aiProvider').value;delete keys[p];localStorage.removeItem('inkdeck_ai_vault_'+p);$('aiKey').value='';$('aiVaultPass').value='';settingsStatus('Klucz usunięty.');};
  function modelOptions(){
    const c=current(), source=catalogs[c.provider]?.models||window.InkDeckModels[c.provider]||[],q=$('aiModelSearch').value.toLowerCase();
    const filtered=source.filter(m=>(m.id+' '+m.name).toLowerCase().includes(q));const list=$('aiModelList');list.replaceChildren();
    filtered.forEach(m=>{const opt=document.createElement('option');opt.value=m.id;opt.textContent=m.name+' — '+m.id;list.appendChild(opt);});
    if(filtered.some(m=>m.id===c.model))list.value=c.model;
    $('aiModelCount').textContent=filtered.length+' / '+source.length+' modeli';
    $('aiCatalogNote').textContent=catalogs[c.provider]?'Lista pobrana od dostawcy. Dostęp zależy od klucza i konta.':'Wbudowany katalog startowy. Odśwież listę w Ustawieniach API, aby sprawdzić aktualną ofertę dostawcy.';
  }
  $('aiChooseModel').onclick=()=>{$('aiModelSearch').value='';modelOptions();panel('aiModelsPanel',true);};
  $('aiModelsClose').onclick=()=>panel('aiModelsPanel',false);
  $('aiModelSearch').oninput=modelOptions;
  $('aiApplyModel').onclick=()=>{if($('aiModelList').value){current().model=$('aiModelList').value;save();render();panel('aiModelsPanel',false);}};
  $('aiRefreshModels').onclick=async()=>{
    const p=$('aiProvider').value,key=keys[p];if(p!=='openrouter'&&!key){settingsStatus('Najpierw wpisz lub odblokuj klucz API.');return;}
    $('aiRefreshModels').disabled=true;settingsStatus('Pobieranie katalogu…');
    try{let models=[];
      if(p==='google'){let token='';do{const data=await request('GET','https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000'+(token?'&pageToken='+encodeURIComponent(token):''),key,p);
        models.push(...(data.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes('generateContent')&&!/image|audio|tts|embedding/i.test(m.name)).map(m=>({id:m.name.replace(/^models\//,''),name:m.displayName||m.name})));token=data.nextPageToken||'';
      }while(token);}
      else{const data=await request('GET',p==='openai'?'https://api.openai.com/v1/models':'https://openrouter.ai/api/v1/models',key,p);
        models=(data.data||[]).filter(m=>p==='openai'?/^(gpt-|chatgpt-|o[134](?:-|$))/.test(m.id)&&!/image|audio|realtime|transcri|tts|search|instruct|oss/i.test(m.id):(!m.architecture?.output_modalities||m.architecture.output_modalities.includes('text'))&&!/:batch$/.test(m.id)).map(m=>({id:m.id,name:m.name||m.id}));}
      if(!models.length)throw new Error('Dostawca nie zwrócił modeli tekstowych dla tego klucza.');
      const unique=Array.from(new Map(models.map(m=>[m.id,m])).values()).sort((a,b)=>a.name.localeCompare(b.name));
      catalogs[p]={models:unique,updated:Date.now()};localStorage.setItem(catalogKey,JSON.stringify(catalogs));settingsStatus('Pobrano '+unique.length+' modeli.');
      if(current().provider===p)modelOptions();
    }catch(e){settingsStatus(e.message);}finally{$('aiRefreshModels').disabled=false;}
  };
  render();
}());
