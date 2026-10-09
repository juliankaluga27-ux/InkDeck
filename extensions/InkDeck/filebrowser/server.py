#!/usr/bin/env python
from __future__ import print_function
try:
    from http.server import BaseHTTPRequestHandler, HTTPServer
except ImportError:
    from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer
import os, sys, time
try:
    from urllib.parse import parse_qs, urlsplit
except ImportError:
    from urlparse import parse_qs, urlsplit

ROOT = '/mnt/us/extensions/InkDeck/filebrowser'
DEST = '/mnt/us/documents/Uploads'
PINFILE = '/tmp/inkdeck-filebrowser.pin'
MAX_BYTES = 50 * 1024 * 1024

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        try:
            with open('/tmp/inkdeck-filebrowser.log', 'a') as log:
                log.write((fmt % args) + '\n')
        except Exception:
            pass
    def send_text(self, code, text, kind='text/plain; charset=utf-8'):
        data = text.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', kind)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(data)
    def do_GET(self):
        if urlsplit(self.path).path not in ('/', '/index.html', '/cgi-bin/home.sh'):
            return self.send_text(404, 'Nie znaleziono strony.')
        try:
            with open(os.path.join(ROOT, 'home.page'), 'rb') as page:
                data = page.read()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:
            self.send_text(500, 'Nie mozna odczytac strony: ' + str(exc))
    def do_POST(self):
        if urlsplit(self.path).path not in ('/cgi-bin/upload.sh', '/upload'):
            return self.send_text(404, 'Nie znaleziono adresu uploadu.')
        query = parse_qs(urlsplit(self.path).query)
        try:
            with open(PINFILE, 'r') as pinfile:
                expected = pinfile.read().strip()
        except Exception:
            expected = ''
        if not expected or query.get('pin', [''])[0] != expected:
            return self.send_text(403, 'BLAD: zly PIN')
        try:
            size = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            size = 0
        if size <= 0 or size > MAX_BYTES:
            return self.send_text(413, 'BLAD: plik musi miec rozmiar do 50 MB')
        name = query.get('name', [''])[0]
        name = os.path.basename(name).replace('/', '_').replace('\\', '_')
        name = ''.join(c if c.isalnum() or c in '._-' else '_' for c in name)
        if not name or name.startswith('.'):
            name = 'plik-%d.bin' % int(time.time())
        try:
            if not os.path.isdir(DEST):
                os.makedirs(DEST)
            path = os.path.join(DEST, name)
            with open(path, 'wb') as output:
                remaining = size
                while remaining:
                    chunk = self.rfile.read(min(65536, remaining))
                    if not chunk:
                        raise IOError('niekompletny upload')
                    output.write(chunk)
                    remaining -= len(chunk)
            self.send_text(200, 'OK: ' + name)
        except Exception as exc:
            self.send_text(500, 'BLAD zapisu: ' + str(exc))

if __name__ == '__main__':
    try:
        HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()
    except Exception as exc:
        print('Nie mozna uruchomic serwera: %s' % exc)
        sys.exit(1)
