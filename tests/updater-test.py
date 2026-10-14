from pathlib import Path
import tempfile,hashlib,os,subprocess
repo=Path(__file__).resolve().parent.parent
script=(repo/'extensions/InkDeck/bin/update.sh').read_text()
paths=['documents/InkDeck.sh','extensions/InkDeck/app/main.page','extensions/InkDeck/app/app.js','extensions/InkDeck/app/style.css','extensions/InkDeck/app/new-games.js','extensions/InkDeck/app/extra-games.js','extensions/InkDeck/app/config.xml','extensions/InkDeck/bin/update.sh']
for scenario in ['staged_offline','unchanged','bad_hash','network_failure','timeout','broken_cache']:
 with tempfile.TemporaryDirectory(prefix='inkdeck-test-') as tmp:
  root=Path(tmp);device=root/'device';fixture=root/'fixture';binpath=root/'bin';binpath.mkdir();fixture.mkdir();(device/'extensions/InkDeck/data').mkdir(parents=True);(device/'documents').mkdir()
  records=[]
  for name in paths:
   p=fixture/name;p.parent.mkdir(parents=True,exist_ok=True)
   if name.endswith('config.xml'):p.write_text('<widget version="9.9.9" />')
   elif name.endswith('.sh'):p.write_text('#!/bin/sh\nexit 0\n')
   else:p.write_text('new fixture '+name)
   records.append(hashlib.sha256(p.read_bytes()).hexdigest()+' '+name+' https://raw.githubusercontent.com/juliankaluga27-ux/InkDeck/v9.9.9/'+name)
   dest=device/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(p.read_bytes() if scenario=='unchanged' else b'#!/bin/sh\n# old files\n')
  (fixture/'manifest.txt').write_text('\n'.join(records)+'\n')
  if scenario=='bad_hash':(fixture/'extensions/InkDeck/app/style.css').write_text('corrupt')
  downloader='''#!/bin/sh
url='';target=''
while [ "$#" -gt 0 ]; do
 case "$1" in -o|-O) shift;target="$1" ;; https://*) url="$1" ;; esac
 shift
done
case "$SCENARIO" in offline) exit 1 ;; esac
case "$url" in *manifest.txt) cp "$FIXTURE/manifest.txt" "$target" ;; *)
 case "$SCENARIO" in network_failure|offline) exit 1 ;; timeout) sleep 10;exit 1 ;; esac
 path="${url#*v9.9.9/}"
 cp "$FIXTURE/$path" "$target" ;;
esac
'''
  for cmd in ['curl','wget']:
   p=binpath/cmd;p.write_text(downloader);p.chmod(0o755)
  worker=root/'worker.sh';worker.write_text(script.replace('/tmp/inkdeck-',tmp+'/inkdeck-').replace('/mnt/us',str(device)).replace('sleep 40;', 'sleep 1;'))
  env=os.environ.copy();env.update(PATH=str(binpath)+':'+env['PATH'],FIXTURE=str(fixture),SCENARIO=scenario)
  def run(mode):return subprocess.run(['sh',str(worker),'--worker',mode],env=env,capture_output=True,timeout=20)
  result=run('--download-only')
  ready=device/'extensions/InkDeck/data/update-ready.txt';cache=device/'extensions/InkDeck/data/update-cache';status=device/'extensions/InkDeck/update-status.txt'
  if scenario in ['staged_offline','broken_cache']:
   assert result.returncode==0,(scenario,result.stderr,status.read_text())
   assert ready.read_text().strip()=='9.9.9'
   assert (device/'extensions/InkDeck/app/style.css').read_bytes()==b'#!/bin/sh\n# old files\n','Downloading must not install'
   if scenario=='broken_cache':(cache/'files/extensions/InkDeck/app/style.css').write_text('broken')
   env['SCENARIO']='offline';result=run('--install')
   if scenario=='staged_offline':
    assert result.returncode==0,(result.stderr,status.read_text())
    assert (device/'extensions/InkDeck/app/style.css').read_bytes()==(fixture/'extensions/InkDeck/app/style.css').read_bytes()
    assert not ready.exists() and not cache.exists(),'Readiness must be cleared after install'
    env['SCENARIO']='normal';result=run('--install');assert result.returncode==0 and 'Masz najnowsze' in status.read_text(),'Must not offer/install same update again'
   else:
    assert result.returncode!=0 and not ready.exists() and not cache.exists()
    assert (device/'extensions/InkDeck/app/style.css').read_bytes()==b'#!/bin/sh\n# old files\n'
  elif scenario=='unchanged':assert result.returncode==0 and not ready.exists() and 'Masz najnowsze' in status.read_text()
  else:
   assert result.returncode!=0,(scenario,status.read_text())
   assert 'nieudana' in status.read_text() and not ready.exists()
   assert (device/'extensions/InkDeck/app/style.css').read_bytes()==b'#!/bin/sh\n# old files\n'
  assert not (root/'inkdeck-update.lock').exists()
  print(scenario,': passed')
