<?php
require dirname(__DIR__).'/public/rules.php';
$count=0;
function check($condition,$message){global $count;$count++;if(!$condition)throw new RuntimeException($message);}
function rejected($fn,$message){try{$fn();}catch(InvalidArgumentException $e){check(true,$message);return;}check(false,$message);}
$s=idk_initial('ttt');$s=idk_move('ttt',$s,0,array('to'=>0));
rejected(function()use($s){idk_move('ttt',$s,0,array('to'=>1));},'Wrong turn rejected');
rejected(function()use($s){idk_move('ttt',$s,1,array('to'=>0));},'Occupied square rejected');
foreach(array(array(1,3),array(0,1),array(1,4),array(0,2)) as $m)$s=idk_move('ttt',$s,$m[0],array('to'=>$m[1]));check($s['over']&&$s['winner']===0,'TTT win');
$s=idk_initial('ttt');foreach(array(0,1,2,4,3,5,7,6,8) as $to)$s=idk_move('ttt',$s,$s['turn'],array('to'=>$to));check($s['over']&&$s['winner']===null,'TTT draw');
$s=idk_initial('chess');check(count(idk_legal('chess',$s))===20,'20 initial chess moves');
rejected(function()use($s){idk_move('chess',$s,0,array('from'=>60,'to'=>62));},'Castling through pieces rejected');
foreach(array(array(53,45),array(12,28),array(54,38),array(3,39)) as $m)$s=idk_move('chess',$s,$s['turn'],array('from'=>$m[0],'to'=>$m[1]));check($s['over']&&$s['winner']===1&&$s['reason']==='mat','Fools mate');
$s=idk_initial('chess');$s['board']=array_fill(0,64,'');$s['board'][60]='K';$s['board'][4]='k';$s['board'][63]='R';$s['board'][56]='R';check(in_array(62,idk_chess_moves($s,60),true),'Kingside castling available');check(in_array(58,idk_chess_moves($s,60),true),'Queenside castling available');
$c=idk_move('chess',$s,0,array('from'=>60,'to'=>62));check($c['board'][61]==='R'&&$c['board'][63]===''&&!$c['castle'][0],'Castling moves rook and rights');
$s['board'][5]='r';check(!in_array(62,idk_chess_moves($s,60),true),'Cannot castle through check');
$s=idk_initial('chess');foreach(array(array(52,36),array(8,16),array(36,28),array(11,27)) as $m)$s=idk_move('chess',$s,$s['turn'],array('from'=>$m[0],'to'=>$m[1]));$s=idk_move('chess',$s,0,array('from'=>28,'to'=>19));check($s['board'][27]===''&&$s['board'][19]==='P','En passant');
$s=idk_initial('chess');$s['board']=array_fill(0,64,'');$s['board'][60]='K';$s['board'][4]='k';$s['board'][8]='P';$s=idk_move('chess',$s,0,array('from'=>8,'to'=>0,'promotion'=>'n'));check($s['board'][0]==='N','Underpromotion supported');
$s=idk_initial('chess');$s['board']=array_fill(0,64,'');$s['board'][60]='K';$s['board'][4]='k';$s['board'][52]='R';$s['board'][12]='r';check(!in_array(51,idk_chess_moves($s,52),true),'Pinned piece cannot expose king');
$s=idk_initial('checkers');check(count(idk_legal('checkers',$s))===7,'Initial checkers moves');
$s['board']=array_fill(0,64,0);$s['board'][26]=1;$s['board'][35]=-1;$s['board'][53]=-1;
$s=idk_move('checkers',$s,0,array('from'=>26,'to'=>44));check($s['board'][35]===0&&$s['forced']===44&&$s['turn']===0,'Backward capture and forced continuation');
rejected(function()use($s){idk_move('checkers',$s,0,array('from'=>44,'to'=>37));},'Cannot skip continuation');
$s=idk_move('checkers',$s,0,array('from'=>44,'to'=>62));check($s['over']&&$s['winner']===0,'Capture chain wins');
$s=idk_initial('checkers');$s['board']=array_fill(0,64,0);$s['board'][42]=2;$s['board'][28]=-1;$s['board'][1]=-1;
check(count(idk_legal('checkers',$s))===3,'Flying king has three landing squares past capture');
$s=idk_move('checkers',$s,0,array('from'=>42,'to'=>7));check($s['board'][28]===0&&$s['board'][7]===2,'Flying king capture');
$s=idk_initial('checkers','english');$s['board']=array_fill(0,64,0);$s['board'][26]=1;$s['board'][35]=-1;$s['board'][53]=-1;
rejected(function()use($s){idk_move('checkers',$s,0,array('from'=>26,'to'=>44));},'English man cannot capture backwards');
echo 'Game rule checks: '.$count." passed\n";
