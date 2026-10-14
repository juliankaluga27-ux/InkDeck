import concurrent.futures,json,time,urllib.request,urllib.error
URL='http://127.0.0.1:8090/api.php'
def call(data):
    req=urllib.request.Request(URL,data=json.dumps(data).encode(),headers={'Content-Type':'application/json','Origin':'null'})
    try:
        with urllib.request.urlopen(req,timeout=15) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)
for i in range(30):
    try:
        if call({'action':'health'})[0]==200:break
    except Exception:pass
    time.sleep(.2)
else:raise RuntimeError('PHP API not ready')
def create(game):
    status,data=call({'action':'create','game':game})
    assert status==200,(status,data)
    assert len(data['code'])==8 and len(data['token'])==64
    return data
def player(action,data,**kwargs):
    status,out=call(dict(action=action,code=data['code'],token=data['token'],revision=data['revision'],**kwargs))
    if out.get('ok'):out['token']=data['token']
    return status,out
host=create('ttt')
with concurrent.futures.ThreadPoolExecutor(2) as pool:
    replies=list(pool.map(call,[{'action':'join','game':'ttt','code':host['code']}]*2))
assert sorted(x[0] for x in replies)==[200,403],replies
guest=next(data for status,data in replies if status==200)
assert guest['token']!=host['token'] and guest['side']==1
status,host=player('state',host)
assert status==200 and host['joined'] and 'host_hash' not in json.dumps(host)
assert player('move',guest,move={'to':0})[0]==400
status,after=player('move',host,move={'to':0})
assert status==200 and after['state']['board'][0]=='X'
assert player('move',host,move={'to':1})[0]==409
status,guest=player('state',guest)
assert status==200 and guest['revision']==after['revision']
assert player('move',guest,move={'to':0})[0]==400
bad=dict(guest,token='0'*64)
assert player('state',bad)[0]==403
assert player('state',guest)[0]==200
status,after=player('draw',guest)
assert status==200 and after['state']['draw_offer']==1
status,host=player('state',host)
status,after=player('draw',host)
assert status==200 and after['state']['over'] and after['state']['winner'] is None
status,guest=player('state',guest)
status,after=player('rematch',guest)
assert status==200 and after['state']['rematch_offer']==1
status,host=player('state',host)
status,after=player('rematch',host)
assert status==200 and after['state']['board']==['']*9 and not after['state']['over']
status,guest=player('state',guest)
status,after=player('leave',guest)
assert status==200 and after['state']['winner']==0
for game,move in [('chess',{'from':52,'to':36}),('checkers',{'from':40,'to':33})]:
    host=create(game)
    assert call({'action':'join','game':'ttt','code':host['code']})[0]==400
    status,guest=call({'action':'join','game':game,'code':host['code']})
    assert status==200,(game,status,guest)
    status,host=player('state',host)
    status,after=player('move',host,move=move)
    assert status==200,(game,status,after)
    assert after['state']['last']==move and len(after['state']['board'])==64
print('API checks passed: concurrent joins, turn/legality, stale revisions, auth, draw, rematch, resignation, all 3 games')
