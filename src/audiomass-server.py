import http.server
import socketserver
PORT = 5055
Handler = http.server.SimpleHTTPRequestHandler
httpd = socketserver.TCPServer(("", PORT), Handler)
print('Open the link below in your browser')
print('http://localhost:5055')
httpd.serve_forever()