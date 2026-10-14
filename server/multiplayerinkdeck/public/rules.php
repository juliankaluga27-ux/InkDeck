<?php
/* Pure game rules. Boards use the same 0..63 positions as the Kindle UI. */
function idk_initial($game, $rules = 'polish') {
    $s = array('board'=>array(), 'turn'=>0, 'over'=>false, 'winner'=>null, 'reason'=>'', 'last'=>null, 'rules'=>$rules, 'forced'=>-1);
    if ($game === 'ttt') $s['board'] = array_fill(0,9,'');
    elseif ($game === 'checkers') {
        $s['board'] = array_fill(0,64,0);
        for ($y=0;$y<8;$y++) for ($x=0;$x<8;$x++) if (($x+$y)%2) $s['board'][$y*8+$x]=$y<3?-1:($y>4?1:0);
    } elseif ($game === 'chess') {
        $s['board'] = array_fill(0,64,''); $row='rnbqkbnr';
        for($i=0;$i<8;$i++) { $s['board'][$i]=$row[$i]; $s['board'][8+$i]='p'; $s['board'][48+$i]='P'; $s['board'][56+$i]=strtoupper($row[$i]); }
        $s['castle']=array(true,true,true,true); $s['ep']=-1; $s['halfmove']=0;
    } else throw new InvalidArgumentException('Nieznana gra.');
    return $s;
}
function idk_square($v,$max=63) { if(!is_int($v)||$v<0||$v>$max)throw new InvalidArgumentException('Nieprawidłowe pole.'); return $v; }
function idk_color($p) {return $p===''?-1:($p===strtoupper($p)?0:1);}
function idk_chess_raw($s,$from,$attack=false) {
    $b=$s['board'];$p=$b[$from];if($p==='')return array();$color=idk_color($p);$x=$from%8;$y=intdiv($from,8);$out=array();$kind=strtolower($p);
    if($kind==='p') {
        $d=$color===0?-1:1;$ny=$y+$d;
        if($ny<0||$ny>7)return $out;
        foreach(array(-1,1) as $dx) if($x+$dx>=0&&$x+$dx<8) { $to=$ny*8+$x+$dx; if($attack||($b[$to]!==''&&idk_color($b[$to])!==$color)||$to===$s['ep'])$out[]=$to; }
        if(!$attack&&$b[$ny*8+$x]==='') { $out[]=$ny*8+$x; $start=$color===0?6:1;if($y===$start&&$b[($y+2*$d)*8+$x]==='')$out[]=($y+2*$d)*8+$x; }
        return $out;
    }
    $diagonal=array(array(1,1),array(1,-1),array(-1,1),array(-1,-1));$straight=array(array(1,0),array(-1,0),array(0,1),array(0,-1));
    if($kind==='n')$dirs=array(array(1,2),array(2,1),array(-1,2),array(-2,1),array(1,-2),array(2,-1),array(-1,-2),array(-2,-1));
    elseif($kind==='b')$dirs=$diagonal;elseif($kind==='r')$dirs=$straight;else $dirs=array_merge($diagonal,$straight);
    $limit=($kind==='k'||$kind==='n')?1:7;
    foreach($dirs as $dir)for($step=1;$step<=$limit;$step++) { $nx=$x+$dir[0]*$step;$ny=$y+$dir[1]*$step;if($nx<0||$nx>7||$ny<0||$ny>7)break;$to=$ny*8+$nx;
        if($b[$to]===''||idk_color($b[$to])!==$color)$out[]=$to;if($b[$to]!=='')break;
    }
    return $out;
}
function idk_check($s,$color) {
    $king=array_search($color===0?'K':'k',$s['board'],true);if($king===false)return true;
    foreach($s['board'] as $i=>$p)if($p!==''&&idk_color($p)!==$color&&in_array($king,idk_chess_raw($s,$i,true),true))return true;
    return false;
}
function idk_chess_apply($s,$from,$to,$promotion='q') {
    $p=$s['board'][$from];$color=idk_color($p);$captured=$s['board'][$to];
    if(strtolower($p)==='p'&&$to===$s['ep']&&$captured===''&&$from%8!==$to%8) { $s['board'][$to+($color===0?8:-8)]='';$captured=$color===0?'p':'P'; }
    if($p==='K'){$s['castle'][0]=false;$s['castle'][1]=false;}if($p==='k'){$s['castle'][2]=false;$s['castle'][3]=false;}
    foreach(array(63=>0,56=>1,7=>2,0=>3) as $square=>$flag)if($from===$square||$to===$square)$s['castle'][$flag]=false;
    $s['board'][$to]=$p;$s['board'][$from]='';
    if(strtolower($p)==='k'&&abs($to-$from)===2) { if($to>$from){$s['board'][$to-1]=$s['board'][$to+1];$s['board'][$to+1]='';}else{$s['board'][$to+1]=$s['board'][$to-2];$s['board'][$to-2]='';} }
    $s['ep']=strtolower($p)==='p'&&abs($to-$from)===16?intdiv($to+$from,2):-1;
    if(strtolower($p)==='p'&&($to<8||$to>=56))$s['board'][$to]=$color===0?strtoupper($promotion):$promotion;
    $s['halfmove']=strtolower($p)==='p'||$captured!==''?0:$s['halfmove']+1;
    return $s;
}
function idk_chess_moves($s,$from) {
    $p=$s['board'][$from];if($p==='')return array();$color=idk_color($p);$raw=idk_chess_raw($s,$from);
    $home=$color===0?60:4;$rook=$color===0?'R':'r';$base=$color===0?0:2;
    if(strtolower($p)==='k'&&$from===$home&&!idk_check($s,$color)) {
        foreach(array(array(2,3,$base,array(1,2)),array(-2,-4,$base+1,array(-1,-2,-3))) as $castle) {
            if(!$s['castle'][$castle[2]]||$s['board'][$home+$castle[1]]!==$rook)continue;
            $empty=true;foreach($castle[3] as $offset)if($s['board'][$home+$offset]!=='')$empty=false;if(!$empty)continue;
            $mid=$s;$mid['board'][$home]='';$mid['board'][$home+($castle[0]>0?1:-1)]=$p;
            if(!idk_check($mid,$color))$raw[]=$home+$castle[0];
        }
    }
    $out=array();foreach($raw as $to)if(strtolower($s['board'][$to])!=='k'&&!idk_check(idk_chess_apply($s,$from,$to),$color))$out[]=$to;
    return $out;
}
function idk_chess_all($s,$color) {$out=array();foreach($s['board'] as $i=>$p)if($p!==''&&idk_color($p)===$color)foreach(idk_chess_moves($s,$i) as $to)$out[]=array('from'=>$i,'to'=>$to);return $out;}
function idk_checker_moves($s,$from,$captureOnly=false) {
    $b=$s['board'];$p=$b[$from];if(!$p)return array();$x=$from%8;$y=intdiv($from,8);$king=abs($p)===2;$polish=$s['rules']==='polish';$dirs=array(array(-1,-1),array(1,-1),array(-1,1),array(1,1));$out=array();
    if($king&&$polish) {
        foreach($dirs as $d) { $enemy=-1;for($step=1;$step<8;$step++){ $nx=$x+$d[0]*$step;$ny=$y+$d[1]*$step;if($nx<0||$nx>7||$ny<0||$ny>7)break;$to=$ny*8+$nx;
            if(!$b[$to]){if($enemy>=0||!$captureOnly)$out[]=array('from'=>$from,'to'=>$to,'cap'=>$enemy);}elseif($b[$to]*$p>0||$enemy>=0)break;else $enemy=$to;
        }}return $out;
    }
    foreach($dirs as $d) { $nx=$x+$d[0];$ny=$y+$d[1];if($nx<0||$nx>7||$ny<0||$ny>7)continue;$to=$ny*8+$nx;$forward=$d[1]===($p>0?-1:1);
        if(!$captureOnly&&!$b[$to]&&($king||$forward))$out[]=array('from'=>$from,'to'=>$to,'cap'=>-1);
        if($b[$to]*$p<0&&($king||$polish||$forward)){ $jx=$nx+$d[0];$jy=$ny+$d[1];if($jx>=0&&$jx<8&&$jy>=0&&$jy<8&&!$b[$jy*8+$jx])$out[]=array('from'=>$from,'to'=>$jy*8+$jx,'cap'=>$to); }
    }
    return $out;
}
function idk_checker_all($s,$player) {
    if($s['forced']>=0)return idk_checker_moves($s,$s['forced'],true);
    $caps=array();$normal=array();foreach($s['board'] as $i=>$p)if($p*$player>0)foreach(idk_checker_moves($s,$i) as $m){if($m['cap']>=0)$caps[]=$m;else $normal[]=$m;}return count($caps)?$caps:$normal;
}
function idk_legal($game,$s) {
    if($s['over'])return array();if($game==='chess')return idk_chess_all($s,$s['turn']);if($game==='checkers')return idk_checker_all($s,$s['turn']===0?1:-1);
    $out=array();foreach($s['board'] as $i=>$p)if($p==='')$out[]=array('to'=>$i);return $out;
}
function idk_move($game,$s,$player,$move) {
    if($s['over'])throw new InvalidArgumentException('Gra jest zakończona.');if($player!==$s['turn'])throw new InvalidArgumentException('Teraz ruch przeciwnika.');
    $to=idk_square(isset($move['to'])?$move['to']:null,$game==='ttt'?8:63);$from=$game==='ttt'?-1:idk_square(isset($move['from'])?$move['from']:null);$chosen=null;
    foreach(idk_legal($game,$s) as $m)if($m['to']===$to&&($game==='ttt'||$m['from']===$from)){$chosen=$m;break;}
    if($chosen===null)throw new InvalidArgumentException('Ruch niezgodny z zasadami.');
    if($game==='ttt') {
        $mark=$player===0?'X':'O';$s['board'][$to]=$mark;
        foreach(array(array(0,1,2),array(3,4,5),array(6,7,8),array(0,3,6),array(1,4,7),array(2,5,8),array(0,4,8),array(2,4,6)) as $line)if($s['board'][$line[0]]===$mark&&$s['board'][$line[1]]===$mark&&$s['board'][$line[2]]===$mark){$s['over']=true;$s['winner']=$player;$s['reason']='wygrana';}
        if(!$s['over']&&!in_array('',$s['board'],true)){$s['over']=true;$s['reason']='remis';}$s['turn']=1-$player;
    } elseif($game==='chess') {
        $promo=isset($move['promotion'])?$move['promotion']:'q';if(!in_array($promo,array('q','r','b','n'),true))throw new InvalidArgumentException('Nieprawidłowa promocja.');
        $s=idk_chess_apply($s,$from,$to,$promo);$s['turn']=1-$player;
        if(!idk_chess_all($s,$s['turn'])){$s['over']=true;$s['winner']=idk_check($s,$s['turn'])?$player:null;$s['reason']=$s['winner']===null?'pat':'mat';}
        $minor=array();foreach($s['board'] as $p)if($p!==''&&strtolower($p)!=='k')$minor[]=strtolower($p);
        if(!$s['over']&&(count($minor)===0||(count($minor)===1&&in_array($minor[0],array('b','n'),true)))){$s['over']=true;$s['reason']='brak materiału do mata';}
    } else {
        $p=$s['board'][$from];$s['board'][$from]=0;$s['board'][$to]=$p;if($chosen['cap']>=0)$s['board'][$chosen['cap']]=0;$promoted=false;
        if($p===1&&$to<8){$s['board'][$to]=2;$promoted=true;}if($p===-1&&$to>=56){$s['board'][$to]=-2;$promoted=true;}
        $s['forced']=-1;
        if($chosen['cap']>=0&&!($promoted&&$s['rules']==='english')&&idk_checker_moves($s,$to,true))$s['forced']=$to;else $s['turn']=1-$player;
        if($s['forced']<0&&!idk_checker_all($s,$s['turn']===0?1:-1)){$s['over']=true;$s['winner']=$player;$s['reason']='brak ruchów';}
    }
    $s['last']=array('from'=>$from,'to'=>$to);$s['draw_offer']=null;return $s;
}
