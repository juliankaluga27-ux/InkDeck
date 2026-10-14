<?php
require __DIR__.'/rules.php';require __DIR__.'/bootstrap.php';
header('Content-Type: application/json; charset=utf-8');header('Cache-Control: no-store');header('X-Content-Type-Options: nosniff');header('Referrer-Policy: no-referrer');
$origin=isset($_SERVER['HTTP_ORIGIN'])?$_SERVER['HTTP_ORIGIN']:'';
if($origin==='null'||$origin==='https://multiplicatingkid.pl'){header('Access-Control-Allow-Origin: '.$origin);header('Vary: Origin');}
header('Access-Control-Allow-Methods: POST, OPTIONS');header('Access-Control-Allow-Headers: Content-Type');
if($_SERVER['REQUEST_METHOD']==='OPTIONS'){http_response_code(204);exit;}
if($_SERVER['REQUEST_METHOD']!=='POST'){http_response_code(405);echo '{"ok":false,"error":"Użyj aplikacji InkDeck."}';exit;}
$pdo=null;
try {
    $raw=file_get_contents('php://input',false,null,0,16385);if(strlen($raw)>16384)throw new InvalidArgumentException('Żądanie jest za duże.');
    $in=json_decode($raw,true);if(!is_array($in)||!isset($in['action'])||!is_string($in['action']))throw new InvalidArgumentException('Nieprawidłowe żądanie.');
    list($pdo,$rooms,$rates,$config)=idk_database();$action=$in['action'];$ip=isset($_SERVER['REMOTE_ADDR'])?$_SERVER['REMOTE_ADDR']:'unknown';
    if($action==='health'){echo idk_encode(array('ok'=>true,'protocol'=>1,'games'=>array('chess','checkers','ttt')));exit;}
    if(!in_array($action,array('create','join','state','move','leave','draw','rematch'),true))throw new InvalidArgumentException('Nieznana operacja.');
    if($action==='create') {
        idk_rate($pdo,$rates,'create',$ip,10,3600);$game=isset($in['game'])?$in['game']:'';if(!is_string($game))throw new InvalidArgumentException('Nieprawidłowa gra.');
        $rules=isset($in['rules'])?$in['rules']:'polish';if(!in_array($rules,array('polish','english'),true))throw new InvalidArgumentException('Nieprawidłowy wariant.');$s=idk_initial($game,$rules);
        $seconds=isset($in['seconds'])?$in['seconds']:0;$increment=isset($in['increment'])?$in['increment']:0;
        if(!is_int($seconds)||$seconds<0||$seconds>7200||!is_int($increment)||$increment<0||$increment>60)throw new InvalidArgumentException('Nieprawidłowy czas.');
        if($game!=='chess'){$seconds=0;$increment=0;}$s['seconds']=$seconds;$s['increment']=$increment;$s['remaining']=array($seconds,$seconds);$s['clock_started']=false;$s['clock_at']=0;$s['draw_offer']=null;$s['rematch_offer']=null;
        $token=bin2hex(random_bytes(32));$now=time();$row=null;
        for($attempt=0;$attempt<5;$attempt++) { $code=idk_code();try{$q=$pdo->prepare("INSERT INTO `$rooms` (code,game,host_hash,state,created_at,expires_at) VALUES (?,?,?,?,?,?)");$q->execute(array($code,$game,hash('sha256',$token),idk_encode($s),$now,$now+3600));$row=array('code'=>$code,'game'=>$game,'revision'=>0,'guest_hash'=>null);break;}catch(PDOException $e){if(!isset($e->errorInfo[1])||(int)$e->errorInfo[1]!==1062)throw $e;} }
        if($row===null)throw new RuntimeException('Room creation failed');$out=idk_public($row,$s,0);$out['token']=$token;
        if(random_int(0,99)===0){$q=$pdo->prepare("DELETE FROM `$rooms` WHERE expires_at<? LIMIT 100");$q->execute(array($now));$q=$pdo->prepare("DELETE FROM `$rates` WHERE reset_at<? LIMIT 100");$q->execute(array($now));}
        echo idk_encode($out);exit;
    }
    $code=isset($in['code'])&&is_string($in['code'])?strtoupper(trim($in['code'])):'';if(!preg_match('/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/D',$code))throw new InvalidArgumentException('Kod pokoju ma 8 znaków.');
    if($action==='join')idk_rate($pdo,$rates,'join',$ip,30,60);
    else {$token=isset($in['token'])&&is_string($in['token'])?$in['token']:'';if(!preg_match('/^[0-9a-f]{64}$/D',$token))throw new DomainException('Nieprawidłowy klucz gracza.');idk_rate($pdo,$rates,'player',$token,120,60);}
    $pdo->beginTransaction();$q=$pdo->prepare("SELECT * FROM `$rooms` WHERE code=? FOR UPDATE");$q->execute(array($code));$row=$q->fetch(PDO::FETCH_ASSOC);
    if(!$row||(int)$row['expires_at']<time())throw new DomainException('Pokój nie istnieje lub wygasł.');
    $s=json_decode($row['state'],true);if(!is_array($s))throw new RuntimeException('Invalid stored room');$changed=false;
    if($action==='join') {
        if($row['guest_hash']!==null||$s['over'])throw new DomainException('Ten pokój jest już zajęty lub zakończony.');
        if(!isset($in['game'])||$in['game']!==$row['game'])throw new InvalidArgumentException('Kod dotyczy innej gry.');
        $token=bin2hex(random_bytes(32));$row['guest_hash']=hash('sha256',$token);$side=1;$row['expires_at']=time()+86400;$changed=true;
    } else {
        $hash=hash('sha256',$token);if(hash_equals($row['host_hash'],$hash))$side=0;elseif($row['guest_hash']!==null&&hash_equals($row['guest_hash'],$hash))$side=1;else throw new DomainException('Nieprawidłowy klucz gracza.');
        $before=$s['over'];$s=idk_tick($s);if(!$before&&$s['over'])$changed=true;
        if($action!=='state'&&$action!=='leave') {
            if(!isset($in['revision'])||!is_int($in['revision'])||$in['revision']!==(int)$row['revision'])throw new UnexpectedValueException('Plansza się zmieniła. Odświeżam stan gry.');
            if($row['guest_hash']===null)throw new DomainException('Poczekaj, aż dołączy druga osoba.');
        }
        if($action==='move') {
            if(!isset($in['move'])||!is_array($in['move']))throw new InvalidArgumentException('Nieprawidłowy ruch.');
            $s=idk_move($row['game'],$s,$side,$in['move']);$changed=true;
            if($s['seconds']>0){$s['remaining'][$side]+=$s['increment'];$s['clock_started']=true;$s['clock_at']=microtime(true);}
        } elseif($action==='leave') {
            if(!$s['over']){$s['over']=true;$s['winner']=$row['guest_hash']===null?null:1-$side;$s['reason']=$row['guest_hash']===null?'pokój zamknięty':'poddanie';$changed=true;}
        } elseif($action==='draw') {
            if($s['over'])throw new DomainException('Gra jest zakończona.');
            if($s['draw_offer']!==null&&$s['draw_offer']!==$side){$s['over']=true;$s['winner']=null;$s['reason']='remis za zgodą graczy';}else $s['draw_offer']=$side;$changed=true;
        } elseif($action==='rematch') {
            if(!$s['over'])throw new DomainException('Najpierw zakończ obecną grę.');
            if($s['rematch_offer']!==null&&$s['rematch_offer']!==$side){$old=$s;$s=idk_initial($row['game'],$old['rules']);$s['seconds']=$old['seconds'];$s['increment']=$old['increment'];$s['remaining']=array($s['seconds'],$s['seconds']);$s['clock_started']=false;$s['clock_at']=0;$s['draw_offer']=null;$s['rematch_offer']=null;}else $s['rematch_offer']=$side;$changed=true;
        }
    }
    if($changed) { $row['revision']=(int)$row['revision']+1;$q=$pdo->prepare("UPDATE `$rooms` SET guest_hash=?,state=?,revision=?,expires_at=? WHERE code=?");$q->execute(array($row['guest_hash'],idk_encode($s),$row['revision'],$row['expires_at'],$code)); }
    $pdo->commit();$out=idk_public($row,$s,$side);if($action==='join')$out['token']=$token;echo idk_encode($out);
} catch(Exception $e) {
    if($pdo&&$pdo->inTransaction())$pdo->rollBack();
    if($e instanceof UnexpectedValueException)$status=409;elseif($e instanceof OverflowException)$status=429;elseif($e instanceof DomainException)$status=403;elseif($e instanceof InvalidArgumentException)$status=400;else $status=503;
    http_response_code($status);$message=$status===503?'Serwer gry nie jest jeszcze skonfigurowany lub baza jest niedostępna.':$e->getMessage();
    if($status===503)error_log('InkDeck multiplayer: '.$e->getCode().' '.get_class($e));echo idk_encode(array('ok'=>false,'error'=>$message));
}
