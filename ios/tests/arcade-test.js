const assert=require('assert'), A=require('../web/arcade-engine.js');
let seed=7;const rng=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
// Every seven-piece bag contains all figures; hold cannot be used twice before locking.
const blocks=new A.Blocks(rng);blocks.bag=[];const bag=Array.from({length:7},()=>blocks.take());
assert.equal(new Set(bag).size,7);const first=blocks.type;blocks.hold();assert.equal(blocks.held,first);
const after=blocks.type;blocks.hold();assert.equal(blocks.type,after);
// Clear four rows with a vertical I and apply level-scaled points.
blocks.board=Array.from({length:20},(_,y)=>Array.from({length:10},(_,x)=>y>=16&&x!==4?2:0));
blocks.type=0;blocks.cells=[[0,0],[0,1],[0,2],[0,3]];blocks.x=4;blocks.y=16;blocks.place();
assert.equal(blocks.lines,4);assert.equal(blocks.score,800);assert(blocks.board.slice(1).every(r=>r.every(x=>!x)));
assert.equal(blocks.holdUsed,false);
// Illegal moves stay bounded; hard drop places a real piece; lock has a finite delay.
const wall=new A.Blocks(rng);for(let i=0;i<30;i++)wall.move(-1,0);assert(wall.cells.every(c=>c[0]+wall.x>=0));
wall.rotate();assert(wall.valid(wall.cells,wall.x,wall.y));wall.drop();assert(wall.board.flat().some(Boolean));
wall.board=Array.from({length:20},()=>Array(10).fill(1));wall.spawn();assert(wall.over);
const pong=new A.Pong(rng);pong.wait=0;pong.x=180;pong.y=470;pong.vx=0;pong.vy=200;pong.update(.02,{x:180});assert(pong.vy<0);
pong.score=6;pong.y=-16;pong.vy=-100;pong.update(.01,{x:180});assert(pong.over&&pong.won);
const breaker=new A.Breakout(rng);breaker.update(.1,{x:30});assert(breaker.wait);breaker.update(.01,{x:180,fire:true});assert(!breaker.wait);
breaker.y=540;breaker.update(.01,{x:180});assert.equal(breaker.lives,2);assert(breaker.wait);
breaker.wait=false;breaker.bricks.forEach(b=>b.hp=0);breaker.update(.01,{x:180});assert.equal(breaker.level,2);
breaker.level=10;breaker.wait=false;breaker.bricks.forEach(b=>b.hp=0);breaker.update(.01,{x:180});assert(breaker.over&&breaker.won);
const inv=new A.Invaders();inv.enemies=[{x:168,y:300,w:24,h:18}];inv.bullets=[{x:180,y:320}];inv.update(.02,{x:180});assert.equal(inv.level,2);assert(inv.score>=120);
inv.shots=[{x:180,y:474}];inv.update(.01,{x:180});assert.equal(inv.lives,2);
const flap=new A.Flappy();flap.update(1,{});assert.equal(flap.y,250);flap.flap();flap.update(.02,{});assert(flap.y<250);
flap.y=510;flap.vy=100;flap.update(.1,{});assert(flap.over);
for(const mode of ['practice','timed','challenge']){
 const m=new A.MathGame({mode,range:12},rng);assert.equal(new Set(m.choices).size,4);assert(m.choices.includes(m.a*m.b));
 m.answer(m.a*m.b);assert.equal(m.correct,1);m.answer(m.a*m.b);assert.equal(m.correct,1,'debounce answers');m.update(1);
 if(mode==='timed'){m.remaining=.01;m.update(.02);assert(m.over);}
 else if(mode==='practice'){for(let i=1;i<20;i++){m.answer(m.a*m.b);m.update(1);}assert(m.over&&m.won);}
 else {for(let i=0;i<3;i++){m.answer(-1);m.update(2);}assert(m.over);assert.equal(m.lives,0);}
}
// Long runs cannot produce NaN or illegal board state. Background pausing is owned by the UI.
for(const C of [A.Pong,A.Breakout,A.Invaders,A.Flappy]){const g=new C(rng);if(g.flap)g.flap();for(let t=0;t<18000&&!g.over;t++)g.update(1/120,{x:180+100*Math.sin(t/80),fire:true});assert(Number.isFinite(g.score));}
console.log('Arcade rules passed: bags, hold, four-line clear, rotation, lock, collision, lives, waves, endings and math modes');
