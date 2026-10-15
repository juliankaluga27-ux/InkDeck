/* ES5 client: room codes and per-player tokens, never database credentials. */
(function () {
  var endpoint='https://multiplicatingkid.pl/multiplayerinkdeck/api.php',session=null,snapshot=null,timer=null,busy=false,generation=0,selected=-1,failures=0,viewMode={},clockTimer=null,clockSeen=0;
  var games=['ttt','chess','checkers'];
  function byId(id){return document.getElementById(id);}
  function active(game){return !!(session&&session.game===game);}
  function message(game,text){var n=byId(game+'Status');if(n)n.textContent=text;}
  function save(){try{if(session)localStorage.setItem('inkdeck_online_session',JSON.stringify(session));else localStorage.removeItem('inkdeck_online_session');}catch(ignore){}}
  function english(){return InkDeck.settingGet&&InkDeck.settingGet('language','pl')==='en';}
  function label(pl,en){return english()?en:pl;}
  function request(body,done){var xhr=new XMLHttpRequest(),complete=false,stamp=generation;busy=true;
    function finish(error,data){if(complete)return;complete=true;if(stamp!==generation)return;busy=false;done(error,data);}
    try{xhr.open('POST',endpoint,true);xhr.setRequestHeader('Content-Type','application/json');xhr.timeout=15000;
      xhr.onreadystatechange=function(){var data;if(xhr.readyState!==4)return;try{data=JSON.parse(xhr.responseText);}catch(e){finish(label('Serwer nie odpowiedział poprawnie.','The server did not respond correctly.'));return;}if(xhr.status>=200&&xhr.status<300&&data.ok)finish(null,data);else finish(data.error||label('Błąd połączenia.','Connection error.'),{http:xhr.status});};
      xhr.onerror=function(){finish(label('Brak połączenia. Sprawdź Wi-Fi. Pokój pozostaje zapisany.','Connection lost. Check Wi-Fi. Your room is saved.'));};xhr.ontimeout=function(){finish(label('Przekroczono czas. Sprawdzam ponownie stan gry.','Request timed out. Checking game state again.'));};xhr.send(JSON.stringify(body));
    }catch(e){finish(label('Kindle nie obsłużył połączenia z serwerem.','Kindle could not connect to the server.'));}
  }
  function schedule(){if(timer)clearTimeout(timer);if(session)timer=setTimeout(poll,Math.min(30000,2200*Math.pow(2,failures)));}
  function controls(game){var on=active(game),chosen=on||viewMode[game]==='online',ids=game==='ttt'?['tttLevel']:(game==='chess'?['chessUndo','chessTime','chessIncrement']:['checkersRules','checkersLevel']),i,n,page=byId(game);
    for(i=0;i<ids.length;i++){n=byId(ids[i]);if(n)n.disabled=on;}
    byId(game+'OnlineForm').className=on?'hidden':'';
    byId(game+'OnlineActions').className=on?'onlineActions':'onlineActions hidden';
    byId(game+'OnlineBody').className=chosen&&!on?'onlineBody':'onlineBody hidden';
    byId(game+'OnlineToggle').className=chosen?'selected onlineToggle':'onlineToggle';
    byId(game+'AI').className=!chosen&&viewMode[game]==='ai'?'selected':'';
    byId(game+'Two').className=!chosen&&viewMode[game]==='two'?'selected':'';
    page.className=page.className.replace(/\s*onlineSession/g,'')+(on?' onlineSession':'');
    n=byId(game+'New');if(n)n.textContent=on?label('REWANŻ','REMATCH'):label('NOWA','NEW');
  }
  function chooseOnline(game){viewMode[game]='online';if(InkDeck.settingSet)InkDeck.settingSet(game+'mode','online');InkDeck.onlineAdapter.prepare(game);controls(game);InkDeck.onlineAdapter.redraw(game);if(!active(game))message(game,label('Utwórz pokój albo wpisz kod.','Create a room or enter a code.'));}
  function clockTick(){if(!session||!snapshot||session.game!=='chess'||!InkDeck.onlineAdapter.clock)return;var s=snapshot.state,remaining=s.remaining.slice(0),elapsed=(new Date().getTime()-clockSeen)/1000;if(s.clock_started&&!s.over)remaining[s.turn]=Math.max(0,remaining[s.turn]-elapsed);InkDeck.onlineAdapter.clock(remaining,s.turn,s.clock_started);}
  function describe(data){var s=data.state,side=data.side,text=label('Kod: ','Code: ')+data.code+' · '+(data.game==='ttt'?(side===0?'X':'O'):(side===0?label('białe','white'):label('czarne','black')));
    if(!data.joined)return text+' · '+label('czekam na drugą osobę','waiting for another player');
    if(s.over)text+=' · '+(s.winner===null?label('Remis','Draw'):(s.winner===side?label('Wygrano','You won'):label('Przegrano','You lost')))+' ('+s.reason+')';
    else text+=' · '+(s.turn===side?label('Twój ruch','Your move'):label('Ruch przeciwnika','Opponent’s move'));
    if(s.draw_offer!==null&&s.draw_offer!==undefined)text+=' · '+(s.draw_offer===side?label('wysłano propozycję remisu','draw offered'):label('przeciwnik proponuje remis','opponent offers a draw'));
    if(s.rematch_offer!==null&&s.rematch_offer!==undefined)text+=' · '+(s.rematch_offer===side?label('wysłano propozycję rewanżu','rematch offered'):label('przeciwnik proponuje rewanż','opponent offers a rematch'));
    return text;
  }
  function accept(data){var changed;if(!session||data.game!==session.game||data.code!==session.code)return;
    if(!data.state||!data.state.board||data.state.board.length!==(data.game==='ttt'?9:64)||!data.legal){message(session.game,label('Nieprawidłowy stan gry.','Invalid game state.'));return;}
    if(snapshot&&data.revision<snapshot.revision)return;changed=!snapshot||data.revision!==snapshot.revision;snapshot=data;clockSeen=new Date().getTime();if(changed)selected=-1;
    InkDeck.onlineAdapter.apply(data,changed);controls(data.game);message(data.game,describe(data));byId(data.game+'Status').textContent=describe(data);
    byId(data.game+'OnlineDraw').disabled=!data.joined||data.state.over;if(data.game==='chess'&&!clockTimer)clockTimer=setInterval(clockTick,1000);
  }
  function poll(){if(!session)return;if(busy){schedule();return;}var game=session.game;request({action:'state',code:session.code,token:session.token},function(error,data){if(error){failures++;if(data&&data.http===403){detach();message(game,error);return;}message(game,error);}else{failures=0;accept(data);}schedule();});}
  function begin(game,join){var body,code;if(busy)return;if(session){message(game,label('Najpierw opuść obecny pokój: ','Leave your current room first: ')+session.code);return;}
    code=byId(game+'OnlineCode').value.toUpperCase().replace(/\s/g,'');if(join&&!/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code)){message(game,label('Wpisz 8-znakowy kod pokoju.','Enter the 8-character room code.'));return;}
    body={action:join?'join':'create',game:game};if(join)body.code=code;
    if(!join&&game==='checkers')body.rules=byId('checkersRules').value;
    if(!join&&game==='chess'){body.seconds=parseInt(byId('chessTime').value,10)||0;body.increment=parseInt(byId('chessIncrement').value,10)||0;}
    message(game,label('Łączenie…','Connecting…'));request(body,function(error,data){if(error){message(game,error);return;}if(!data.token){message(game,label('Serwer nie zwrócił klucza gracza.','Server returned no player token.'));return;}
      session={game:data.game,code:data.code,token:data.token};snapshot=null;selected=-1;viewMode[game]='online';save();InkDeck.show(game);accept(data);schedule();});
  }
  function command(action,move){var game;if(!session||!snapshot||busy)return;game=session.game;
    if(action==='rematch'&&!snapshot.state.over){message(game,label('Najpierw zakończ obecną grę.','Finish this game first.'));return;}
    request({action:action,code:session.code,token:session.token,revision:snapshot.revision,move:move||null},function(error,data){if(error)message(game,error);else accept(data);schedule();});
  }
  function detach(){var game=session?session.game:null;if(clockTimer)clearInterval(clockTimer);clockTimer=null;generation++;if(timer)clearTimeout(timer);timer=null;busy=false;session=null;snapshot=null;selected=-1;save();if(game){viewMode[game]='ai';if(InkDeck.settingSet)InkDeck.settingSet(game+'mode','ai');controls(game);InkDeck.onlineAdapter.reset(game);message(game,label('Tryb lokalny.','Local mode.'));}}
  function leave(after){var current;function finishLeave(){detach();if(typeof after==='function')after();}if(!session)return;if(!window.confirm(label('Opuścić pokój? Trwająca gra zostanie poddana.','Leave the room? You will resign the active game.')))return;
    if(busy){message(session.game,label('Poczekaj na zakończenie połączenia.','Wait for the request to finish.'));return;}current=session;
    request({action:'leave',code:current.code,token:current.token},function(error,data){if(error){if(data&&data.http===403){finishLeave();message(current.game,error);return;}message(current.game,error+label(' Ponów opuszczenie po odzyskaniu połączenia.',' Retry leaving after reconnecting.'));schedule();return;}finishLeave();});
  }
  function tap(game,i){var moves,j,owner;if(!active(game)||!snapshot){message(game,label('Najpierw utwórz pokój lub dołącz kodem.','Create or join a room first.'));return;}
    if(busy){message(game,label('Trwa synchronizacja.','Synchronizing.'));return;}
    if(!snapshot.joined||snapshot.state.over||snapshot.state.turn!==sessionSide()){message(game,describe(snapshot));return;}
    moves=snapshot.legal;
    if(game==='ttt'){for(j=0;j<moves.length;j++)if(moves[j].to===i){command('move',{to:i});return;}return;}
    if(selected>=0)for(j=0;j<moves.length;j++)if(moves[j].from===selected&&moves[j].to===i){command('move',{from:selected,to:i,promotion:'q'});return;}
    owner=false;for(j=0;j<moves.length;j++)if(moves[j].from===i)owner=true;selected=owner?i:-1;InkDeck.onlineAdapter.select(game,selected);
  }
  function sessionSide(){return snapshot?snapshot.side:-1;}
  function legal(game){return active(game)&&snapshot?snapshot.legal:[];}
  function targets(game,from){var a=legal(game),out=[],j;if(!snapshot||snapshot.side!==snapshot.state.turn)return out;for(j=0;j<a.length;j++)if(a[j].from===from)out.push(a[j].to);return out;}
  InkDeck.online={active:active,selected:function(game){return active(game)||viewMode[game]==='online';},refresh:function(game){if(games.indexOf(game)>=0)controls(game);},tap:tap,legal:legal,targets:targets,command:command,detach:detach};
  games.forEach(function(game){var page=byId(game),panel=document.createElement('div'),toggle=document.createElement('button'),actions=document.createElement('div');
    viewMode[game]=InkDeck.settingGet?InkDeck.settingGet(game+'mode','ai'):'ai';
    toggle.id=game+'OnlineToggle';toggle.className='onlineToggle';toggle.textContent=label('PRZEZ INTERNET','ONLINE');byId(game+'Modes').appendChild(toggle);
    panel.id=game+'OnlineBody';panel.className='onlineBody hidden';panel.innerHTML='<div id="'+game+'OnlineForm"><button id="'+game+'OnlineCreate">'+label('UTWÓRZ GRĘ','CREATE GAME')+'</button><input id="'+game+'OnlineCode" maxlength="8" autocomplete="off" autocapitalize="characters" placeholder="'+label('Kod pokoju','Room code')+'"><button id="'+game+'OnlineJoin">'+label('DOŁĄCZ','JOIN')+'</button></div>';page.insertBefore(panel,byId(game+'Modes').nextSibling);
    actions.id=game+'OnlineActions';actions.className='onlineActions hidden';actions.innerHTML='<button id="'+game+'OnlineDraw">'+label('ZAPROPONUJ / PRZYJMIJ REMIS','OFFER / ACCEPT DRAW')+'</button><button id="'+game+'OnlineLeave">'+label('OPUŚĆ POKÓJ','LEAVE ROOM')+'</button>';byId(game+'Settings').appendChild(actions);
    toggle.onclick=function(){chooseOnline(game);};
    ['AI','Two'].forEach(function(kind){var button=byId(game+kind),original=button.onclick;button.onclick=function(){function choose(){viewMode[game]=kind==='AI'?'ai':'two';if(typeof original==='function')original.call(button);controls(game);InkDeck.onlineAdapter.redraw(game);}if(active(game))leave(choose);else choose();};});
    byId(game+'OnlineCreate').onclick=function(){begin(game,false);};byId(game+'OnlineJoin').onclick=function(){begin(game,true);};byId(game+'OnlineLeave').onclick=leave;byId(game+'OnlineDraw').onclick=function(){command('draw');};
    byId(game+'OnlineCode').onkeydown=function(e){if(e&&e.keyCode===13)begin(game,true);};controls(game);if(viewMode[game]==='online')chooseOnline(game);
  });
  try{var stored=JSON.parse(localStorage.getItem('inkdeck_online_session')||'null');if(stored&&games.indexOf(stored.game)>=0&&/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(stored.code)&&/^[0-9a-f]{64}$/.test(stored.token)){session=stored;controls(session.game);message(session.game,label('Wznawiam połączenie z pokojem ','Reconnecting to room ')+session.code);schedule();}}catch(ignoreRestore){}
}());
