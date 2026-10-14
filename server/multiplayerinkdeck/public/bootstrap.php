<?php
function idk_database() {
    $file=getenv('INKDECK_CONFIG_PATH');
    if(!$file){$file=dirname(__DIR__,2).'/inkdeck-private/config.php';if(!is_file($file))$file=__DIR__.'/config.php';}
    if(!is_file($file))throw new RuntimeException('Missing private configuration');
    $c=require $file;if(!is_array($c))throw new RuntimeException('Invalid private configuration');
    foreach(array('db_host','db_name','db_user','db_password') as $key)if(!isset($c[$key])||!is_string($c[$key])||$c[$key]==='')throw new RuntimeException('Incomplete private configuration');
    $prefix=isset($c['table_prefix'])?$c['table_prefix']:'inkdeck_';if(!preg_match('/^[a-z][a-z0-9_]{0,31}$/D',$prefix))throw new RuntimeException('Invalid table prefix');
    $port=isset($c['db_port'])?(int)$c['db_port']:3306;if($port<1||$port>65535)throw new RuntimeException('Invalid database port');
    if(preg_match('/[;\x00-\x20]/',$c['db_host'].$c['db_name']))throw new RuntimeException('Invalid database address');
    $pdo=new PDO('mysql:host='.$c['db_host'].';port='.$port.';dbname='.$c['db_name'].';charset=utf8mb4',$c['db_user'],$c['db_password'],array(PDO::ATTR_ERRMODE=>PDO::ERRMODE_EXCEPTION,PDO::ATTR_EMULATE_PREPARES=>false,PDO::ATTR_TIMEOUT=>10));
    $rooms=$prefix.'rooms';$rates=$prefix.'rates';
    foreach(array($rooms,$rates) as $table) {
        try{$pdo->query("SELECT 1 FROM `$table` LIMIT 1");}
        catch(PDOException $e){if(!isset($e->errorInfo[1])||(int)$e->errorInfo[1]!==1146)throw $e;
            if($table===$rooms)$pdo->exec("CREATE TABLE IF NOT EXISTS `$rooms` (code CHAR(8) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,game VARCHAR(16) NOT NULL,host_hash CHAR(64) NOT NULL,guest_hash CHAR(64) DEFAULT NULL,state MEDIUMTEXT NOT NULL,revision INT UNSIGNED NOT NULL DEFAULT 0,created_at BIGINT NOT NULL,expires_at BIGINT NOT NULL,INDEX expires_idx(expires_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            else $pdo->exec("CREATE TABLE IF NOT EXISTS `$rates` (bucket CHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,hits INT UNSIGNED NOT NULL,reset_at BIGINT NOT NULL,INDEX reset_idx(reset_at)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
        }
    }
    return array($pdo,$rooms,$rates,$c);
}
function idk_rate($pdo,$table,$scope,$identity,$limit,$window) {
    $key=hash('sha256',$scope.'|'.$identity);$now=time();$reset=$now+$window;
    $q=$pdo->prepare("INSERT INTO `$table` (bucket,hits,reset_at) VALUES (?,1,?) ON DUPLICATE KEY UPDATE hits=IF(reset_at<=?,1,hits+1),reset_at=IF(reset_at<=?,VALUES(reset_at),reset_at)");$q->execute(array($key,$reset,$now,$now));
    $q=$pdo->prepare("SELECT hits FROM `$table` WHERE bucket=?");$q->execute(array($key));if((int)$q->fetchColumn()>$limit)throw new OverflowException('Za dużo prób. Spróbuj później.');
}
function idk_encode($value) {$json=json_encode($value,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);if($json===false)throw new RuntimeException('JSON serialization failed');return $json;}
function idk_code() {$alphabet='23456789ABCDEFGHJKLMNPQRSTUVWXYZ';$s='';for($i=0;$i<8;$i++)$s.=$alphabet[random_int(0,strlen($alphabet)-1)];return $s;}
function idk_tick($s) {
    if(!empty($s['clock_started'])&&!$s['over']) {
        $side=$s['turn'];$s['remaining'][$side]=max(0,$s['remaining'][$side]-(microtime(true)-$s['clock_at']));$s['clock_at']=microtime(true);
        if($s['remaining'][$side]<=0){$s['over']=true;$s['winner']=1-$side;$s['reason']='czas';}
    }return $s;
}
function idk_public($row,$s,$side) {
    return array('ok'=>true,'code'=>$row['code'],'game'=>$row['game'],'revision'=>(int)$row['revision'],'side'=>$side,'joined'=>$row['guest_hash']!==null,'state'=>$s,'legal'=>idk_legal($row['game'],$s));
}
