/* Offline arcade rules. No DOM, clocks, network, or platform dependencies. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.InkArcade = factory();
}(typeof window === 'object' ? window : this, function () {
  'use strict';
  var W=360,H=520;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function hit(x,y,r,b){return Math.pow(x-clamp(x,b.x,b.x+b.w),2)+Math.pow(y-clamp(y,b.y,b.y+b.h),2)<=r*r;}
  function Base(){this.score=0;this.over=false;this.won=false;this.level=1;}
  function Pong(random){Base.call(this);this.random=random||Math.random;this.player=180;this.bot=180;this.enemy=0;this.serve();}
  Pong.prototype.serve=function(){this.x=180;this.y=260;this.vx=(this.random()-.5)*200;this.vy=(this.enemy+this.score)%2?-205:205;this.wait=.7;};
  Pong.prototype.update=function(dt,input){if(this.over)return;this.player=clamp(input.x===undefined?this.player:input.x,42,318);var target=this.x+(this.vx*.10);this.bot+=clamp(target-this.bot,-160*dt,160*dt);this.bot=clamp(this.bot,42,318);if(this.wait>0){this.wait-=dt;return;}
    this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x<7||this.x>353){this.x=clamp(this.x,7,353);this.vx*=-1;}
    if(this.vy>0&&this.y>=472&&this.y<=490&&Math.abs(this.x-this.player)<49){this.y=472;this.bounce(this.player,-1);}
    if(this.vy<0&&this.y<=48&&this.y>=30&&Math.abs(this.x-this.bot)<49){this.y=48;this.bounce(this.bot,1);}
    if(this.y>535||this.y< -15){if(this.y<0)this.score++;else this.enemy++;if(this.score===7||this.enemy===7){this.over=true;this.won=this.score===7;}else this.serve();}
  };
  Pong.prototype.bounce=function(p,dir){var speed=Math.min(430,Math.hypot(this.vx,this.vy)+16),angle=clamp((this.x-p)/44,-1,1)*1.05;this.vx=Math.sin(angle)*speed;this.vy=dir*Math.cos(angle)*speed;};
  function Breakout(random){Base.call(this);this.random=random||Math.random;this.lives=3;this.player=180;this.bricks=[];this.makeLevel();}
  Breakout.prototype.makeLevel=function(){this.bricks=[];for(var y=0;y<5;y++)for(var x=0;x<8;x++)this.bricks.push({x:10+x*43,y:60+y*23,w:39,h:18,hp:this.level>2&&y<2?2:1});this.serve();};
  Breakout.prototype.serve=function(){this.x=this.player;this.y=465;this.vx=110;this.vy=-230-this.level*12;this.wait=true;};
  Breakout.prototype.update=function(dt,input){if(this.over)return;this.player=clamp(input.x===undefined?this.player:input.x,40,320);if(this.wait){this.x=this.player;if(input.fire)this.wait=false;return;}var ox=this.x,oy=this.y;this.x+=this.vx*dt;this.y+=this.vy*dt;
    if(this.x<6||this.x>354){this.x=clamp(this.x,6,354);this.vx*=-1;}if(this.y<6){this.y=6;this.vy=Math.abs(this.vy);}
    if(this.vy>0&&oy<=474&&this.y>=474&&Math.abs(this.x-this.player)<46){this.y=474;var a=clamp((this.x-this.player)/42,-1,1)*1.05,s=Math.min(430,Math.hypot(this.vx,this.vy)+4);this.vx=Math.sin(a)*s;this.vy=-Math.cos(a)*s;}
    for(var i=0;i<this.bricks.length;i++){var b=this.bricks[i];if(b.hp&&hit(this.x,this.y,6,b)){b.hp--;this.score+=b.hp?5:10;if(ox<b.x||ox>b.x+b.w)this.vx*=-1;else this.vy*=-1;this.x=ox;this.y=oy;break;}}
    if(this.y>535){this.lives--;if(!this.lives)this.over=true;else this.serve();}
    if(!this.bricks.some(function(b){return b.hp>0;})){this.score+=100;this.level++;if(this.level>10){this.over=true;this.won=true;}else this.makeLevel();}
  };
  var shapes=[[[0,1],[1,1],[2,1],[3,1]],[[1,0],[2,0],[1,1],[2,1]],[[1,0],[0,1],[1,1],[2,1]],[[1,0],[2,0],[0,1],[1,1]],[[0,0],[1,0],[1,1],[2,1]],[[0,0],[0,1],[1,1],[2,1]],[[2,0],[0,1],[1,1],[2,1]]];
  function Blocks(random){Base.call(this);this.random=random||Math.random;this.board=Array.from({length:20},function(){return Array(10).fill(0);});this.bag=[];this.queue=[];this.lines=0;this.combo=-1;this.held=null;this.holdUsed=false;this.fall=0;this.lock=0;this.lockMoves=0;for(var i=0;i<4;i++)this.queue.push(this.take());this.spawn();}
  Blocks.prototype.take=function(){if(!this.bag.length){this.bag=[0,1,2,3,4,5,6];for(var i=6;i>0;i--){var j=Math.floor(this.random()*(i+1)),v=this.bag[i];this.bag[i]=this.bag[j];this.bag[j]=v;}}return this.bag.pop();};
  Blocks.prototype.spawn=function(type){if(type===undefined){type=this.queue.shift();this.queue.push(this.take());}this.type=type;this.cells=shapes[type].map(function(c){return c.slice();});this.x=3;this.y=0;this.fall=0;this.lock=0;this.lockMoves=0;if(!this.valid(this.cells,this.x,this.y))this.over=true;};
  Blocks.prototype.valid=function(cells,x,y){var board=this.board;return cells.every(function(c){var xx=x+c[0],yy=y+c[1];return xx>=0&&xx<10&&yy<20&&(yy<0||!board[yy][xx]);});};
  Blocks.prototype.move=function(dx,dy){if(this.over)return false;if(!this.valid(this.cells,this.x+dx,this.y+dy))return false;this.x+=dx;this.y+=dy;if(this.lockMoves<15){this.lock=0;this.lockMoves++;}return true;};
  Blocks.prototype.rotate=function(){if(this.over||this.type===1)return;var size=this.type===0?4:3,c=this.cells.map(function(p){return [size-1-p[1],p[0]];});var kicks=[[0,0],[-1,0],[1,0],[-2,0],[2,0],[0,-1],[0,-2]];for(var i=0;i<kicks.length;i++){var k=kicks[i];if(this.valid(c,this.x+k[0],this.y+k[1])){this.cells=c;this.x+=k[0];this.y+=k[1];if(this.lockMoves<15){this.lock=0;this.lockMoves++;}return;}}};
  Blocks.prototype.hold=function(){if(this.over||this.holdUsed)return;var old=this.held;this.held=this.type;this.spawn(old===null?undefined:old);this.holdUsed=true;};
  Blocks.prototype.ghostY=function(){var y=this.y;while(this.valid(this.cells,this.x,y+1))y++;return y;};
  Blocks.prototype.drop=function(){if(this.over)return;var y=this.ghostY();this.score+=(y-this.y)*2;this.y=y;this.place();};
  Blocks.prototype.place=function(){var self=this,top=false;this.cells.forEach(function(c){var y=self.y+c[1];if(y<0)top=true;else self.board[y][self.x+c[0]]=self.type+1;});if(top){this.over=true;return;}var rows=this.board.filter(function(r){return r.some(function(v){return !v;});}),n=20-rows.length;while(rows.length<20)rows.unshift(Array(10).fill(0));this.board=rows;if(n){this.combo++;this.score+=([0,100,300,500,800][n]+Math.max(0,this.combo)*50)*this.level;this.lines+=n;this.level=1+Math.floor(this.lines/10);}else this.combo=-1;this.holdUsed=false;this.spawn();};
  Blocks.prototype.update=function(dt,input){if(this.over)return;this.fall+=dt;var period=input.soft?.045:Math.max(.07,.8*Math.pow(.82,this.level-1));if(this.fall>=period){this.fall=0;if(this.valid(this.cells,this.x,this.y+1)){this.y++;if(input.soft)this.score++;}}
    if(!this.valid(this.cells,this.x,this.y+1)){this.lock+=dt;if(this.lock>=.45)this.place();}else this.lock=0;};
  function Invaders(){Base.call(this);this.lives=3;this.player=180;this.bullets=[];this.shots=[];this.cool=0;this.elapsed=0;this.makeLevel();}
  Invaders.prototype.makeLevel=function(){this.enemies=[];for(var y=0;y<4;y++)for(var x=0;x<7;x++)this.enemies.push({x:28+x*43,y:48+y*31,w:24,h:18});this.dir=1;this.shotTimer=0;this.bullets=[];this.shots=[];};
  Invaders.prototype.update=function(dt,input){if(this.over)return;this.player=clamp(input.x===undefined?this.player:input.x,16,344);this.cool-=dt;if(input.fire&&this.cool<=0){this.bullets.push({x:this.player,y:475});this.cool=.22;}this.elapsed+=dt;this.shotTimer+=dt;var speed=14+this.level*5+(28-this.enemies.length)*1.2,turn=false;this.enemies.forEach(function(e){e.x+=this.dir*speed*dt;if(e.x<8||e.x+e.w>352)turn=true;},this);if(turn){this.dir*=-1;this.enemies.forEach(function(e){e.x=clamp(e.x,8,328);e.y+=13;});}
    if(this.shotTimer>Math.max(.25,1.1-this.level*.08)&&this.enemies.length){this.shotTimer=0;var e=this.enemies[Math.floor((this.elapsed*7)%this.enemies.length)];this.shots.push({x:e.x+12,y:e.y+18});}
    for(var i=this.bullets.length-1;i>=0;i--){var b=this.bullets[i];b.y-=360*dt;var k=this.enemies.findIndex(function(e){return b.x>=e.x&&b.x<=e.x+e.w&&b.y>=e.y&&b.y<=e.y+e.h;});if(k>=0){this.enemies.splice(k,1);this.bullets.splice(i,1);this.score+=20;}else if(b.y<0)this.bullets.splice(i,1);}
    this.shield=Math.max(0,(this.shield||0)-dt);for(var j=this.shots.length-1;j>=0;j--){var shot=this.shots[j];shot.y+=(165+this.level*12)*dt;if(shot.y>=473&&shot.y<=495&&Math.abs(shot.x-this.player)<19){this.shots.splice(j,1);if(!this.shield){this.lives--;this.shield=1.5;if(!this.lives)this.over=true;}}else if(shot.y>530)this.shots.splice(j,1);}
    if(this.enemies.some(function(e){return e.y+e.h>=465;}))this.over=true;if(!this.enemies.length&&!this.over){this.level++;this.score+=100;this.makeLevel();}
  };
  function Flappy(){Base.call(this);this.y=250;this.vy=0;this.pipes=[];this.clock=0;this.started=false;}
  Flappy.prototype.flap=function(){if(!this.over){this.started=true;this.vy=-220;}};
  Flappy.prototype.update=function(dt,input){if(this.over||!this.started)return;this.vy+=620*dt;this.y+=this.vy*dt;this.clock+=dt;if(this.clock>=1.75){this.clock=0;this.pipes.push({x:380,gap:130+Math.random()*240,passed:false});}var self=this;this.pipes.forEach(function(p){p.x-=(105+Math.min(50,self.score*2))*dt;if(!p.passed&&p.x+48<86){p.passed=true;self.score++;}if(hit(86,self.y,11,{x:p.x,y:0,w:48,h:p.gap-78})||hit(86,self.y,11,{x:p.x,y:p.gap+78,w:48,h:520-p.gap-78}))self.over=true;});this.pipes=this.pipes.filter(function(p){return p.x> -60;});if(this.y<11||this.y>509)this.over=true;};
  function MathGame(options,random){Base.call(this);options=options||{};this.random=random||Math.random;this.range=options.range||10;this.table=options.table||0;this.mode=options.mode||'practice';this.correct=0;this.errors=0;this.answered=0;this.streak=0;this.remaining=60;this.lives=3;this.mistakes=[];this.feedback='';this.delay=0;this.question();}
  MathGame.prototype.question=function(){var retry=this.mistakes.length&&this.answered%3===2?this.mistakes.shift():null;this.a=retry?retry[0]:(this.table||1+Math.floor(this.random()*this.range));this.b=retry?retry[1]:1+Math.floor(this.random()*this.range);var result=this.a*this.b,choices=[result];while(choices.length<4){var n=clamp(result+Math.floor(this.random()*31)-15,0,Math.max(result+10,this.range*this.range));if(choices.indexOf(n)<0)choices.push(n);}for(var i=3;i>0;i--){var j=Math.floor(this.random()*(i+1)),v=choices[i];choices[i]=choices[j];choices[j]=v;}this.choices=choices;this.feedback='';this.selected=null;};
  MathGame.prototype.answer=function(n){if(this.over||this.delay)return;this.answered++;this.selected=n;var yes=n===this.a*this.b;if(yes){this.correct++;this.streak++;this.score+=10+Math.min(10,this.streak);this.feedback='correct';}else{this.errors++;this.streak=0;this.lives--;this.mistakes.push([this.a,this.b]);this.feedback='wrong';}this.delay=yes?.35:1.2;};
  MathGame.prototype.update=function(dt){if(this.over)return;if(this.mode==='timed'){this.remaining=Math.max(0,this.remaining-dt);if(!this.remaining){this.over=true;return;}}if(this.delay){this.delay=Math.max(0,this.delay-dt);if(!this.delay){if((this.mode==='practice'&&this.answered>=20)||(this.mode==='challenge'&&!this.lives)){this.over=true;this.won=this.mode==='practice';}else this.question();}}};
  return {width:W,height:H,clamp:clamp,hit:hit,shapes:shapes,Pong:Pong,Breakout:Breakout,Blocks:Blocks,Invaders:Invaders,Flappy:Flappy,MathGame:MathGame};
}));
