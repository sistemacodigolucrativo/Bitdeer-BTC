#!/usr/bin/env python3
"""Isolated HTTP integration checks for the SQLite storage changes."""
import base64, http.cookiejar, json, os, pathlib, shutil, socket, subprocess, tempfile, time, urllib.error, urllib.parse, urllib.request

ROOT=pathlib.Path(__file__).resolve().parents[1]

def main():
    with tempfile.TemporaryDirectory(prefix='bitdeer-storage-test-') as temp:
        temp=pathlib.Path(temp);db=temp/'app.sqlite';key=temp/'kyc.key';backup=temp/'backups'
        key.write_bytes(os.urandom(32));key.chmod(0o600)
        env={**os.environ,'BITDEER_DB_PATH':str(db),'BITDEER_KYC_KEY_FILE':str(key)}
        bootstrap="require 'server/schema.php'; provision('testadmin','AdminPassword123!','support@example.test');"
        subprocess.run(['php','-r',bootstrap],cwd=ROOT,env=env,check=True,capture_output=True,text=True)
        sock=socket.socket();sock.bind(('127.0.0.1',0));port=sock.getsockname()[1];sock.close()
        server=subprocess.Popen(['php','-S',f'127.0.0.1:{port}','-t',str(ROOT),str(ROOT/'scripts/php-router.php')],cwd=ROOT,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        base=f'http://127.0.0.1:{port}/api/index.php'
        def opener():
            jar=http.cookiejar.CookieJar();return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
        def request(client,action,body=None,query=None,headers=None,raw=None):
            url=base+'?'+urllib.parse.urlencode({'action':action,**(query or {})})
            request_headers=dict(headers or {})
            data=raw
            if body is not None:
                data=json.dumps(body).encode();request_headers['Content-Type']='application/json'
            req=urllib.request.Request(url,data=data,headers=request_headers,method='POST' if data is not None else 'GET')
            with client.open(req,timeout=10) as response:return response.status,response.headers,response.read()
        try:
            for _ in range(50):
                try:
                    client=opener();request(client,'health');break
                except Exception:time.sleep(.1)
            admin=opener();_,_,raw=request(admin,'login',{'login':'testadmin','password':'AdminPassword123!'})
            login=json.loads(raw);csrf=login['csrfToken'];admin_headers={'X-CSRF-Token':csrf}
            request(admin,'admin.legit-preview.settings',{'days':2},headers=admin_headers)
            shared=opener();_,_,raw=request(shared,'legit-preview.settings')
            state=json.loads(raw);assert state['enabled'] and state['expiresAt']>int(time.time())
            request(admin,'admin.legit-preview.settings',{'days':0},headers=admin_headers)
            _,_,raw=request(shared,'legit-preview.settings');assert not json.loads(raw)['enabled']

            request(admin,'register',{'login':'memberone','password':'MemberPassword123!','displayName':'Member One'})
            member=opener();_,_,raw=request(member,'login',{'login':'memberone','password':'MemberPassword123!'})
            login=json.loads(raw);csrf=login['csrfToken'];mh={'X-CSRF-Token':csrf}
            assert login['rememberPreference'] is None
            request(member,'session.remember',{'enabled':True},headers=mh)
            request(member,'language.preference',{'language':'es'},headers=mh)
            request(member,'member.preferences',{'firstHomeVisit':True,'welcomeDismissed':True},headers=mh)
            request(member,'profile.update',{'displayName':'Member One','email':'one@example.test','phone':'','walletAddress':'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'},headers=mh)
            _,_,raw=request(member,'profile');profile=json.loads(raw)['profile']
            assert profile['walletAddress']=='bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
            other_device=opener();_,_,raw=request(other_device,'login',{'login':'memberone','password':'MemberPassword123!'})
            other_login=json.loads(raw);assert other_login['rememberPreference'] is True
            other_headers={'X-CSRF-Token':other_login['csrfToken']}
            _,_,raw=request(other_device,'language.preference');assert json.loads(raw)['language']=='es'
            _,_,raw=request(other_device,'member.preferences');prefs=json.loads(raw)['preferences']
            assert prefs['firstHomeVisit'] is True and prefs['welcomeDismissed'] is True
            _,_,raw=request(other_device,'profile');assert json.loads(raw)['profile']['walletAddress']==profile['walletAddress']

            pdf=b'%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF\n'
            png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/s3sAAAAASUVORK5CYII=')
            boundary='----bitdeer-test-boundary'
            def part(name,filename,mime,data):
                return (f'--{boundary}\r\nContent-Disposition: form-data; name="{name}"; filename="{filename}"\r\nContent-Type: {mime}\r\n\r\n').encode()+data+b'\r\n'
            body=(f'--{boundary}\r\nContent-Disposition: form-data; name="documentType"\r\n\r\npassport\r\n').encode()
            body+=part('document','id.pdf','application/pdf',pdf)+part('photo','selfie.png','image/png',png)+f'--{boundary}--\r\n'.encode()
            _,_,raw=request(other_device,'kyc.submit',headers={**other_headers,'Content-Type':f'multipart/form-data; boundary={boundary}'},raw=body)
            kyc=json.loads(raw)['record'];assert kyc['status']=='pending' and kyc['simulation'] is True
            _,_,raw=request(other_device,'kyc.mine');assert json.loads(raw)['record']['id']==kyc['id']
            _,_,raw=request(other_device,'kyc.file',query={'kind':'document'});assert raw==pdf
            _,_,raw=request(other_device,'kyc.file',query={'kind':'photo'});assert raw==png
            import sqlite3
            with sqlite3.connect(db) as connection:
                encrypted=connection.execute('SELECT document_ciphertext,photo_ciphertext FROM member_kyc_submissions').fetchone()
                assert pdf not in encrypted[0] and png not in encrypted[1]
                assert connection.execute('PRAGMA quick_check').fetchone()[0]=='ok'
                assert connection.execute('SELECT COUNT(*) FROM admin_audit WHERE action LIKE "settings.legit_preview.%"').fetchone()[0]==2

            env['BITDEER_BACKUP_DIR']=str(backup)
            subprocess.run(['php',str(ROOT/'scripts/backup-sqlite.php')],cwd=ROOT,env=env,check=True,capture_output=True,text=True)
            files=list(backup.glob('bitdeer-*.sqlite'));keys=list((backup/'key-recovery').glob('*.key'))
            assert len(files)==1 and len(keys)==1 and keys[0].read_bytes()==key.read_bytes()
            with sqlite3.connect(files[0]) as connection:assert connection.execute('PRAGMA quick_check').fetchone()[0]=='ok'
            print('PASS: preview global/audit, preferences, remember-session, profile/wallet cross-session, encrypted KYC, and SQLite backup/key recovery')
        finally:
            server.terminate();server.wait(timeout=5)

if __name__=='__main__':main()
