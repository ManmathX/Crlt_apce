#!/usr/bin/env python3
"""
Combined server for the Space Satellite website that serves static files 
and handles Solar System API calls securely.
"""

import json
import os
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import urlopen, Request
from urllib.parse import urlparse
import threading
import time

class SpaceSatelliteHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path)
        else:
            # Handle static file serving
            self.handle_static_file(parsed_path.path)
    
    def handle_api_request(self, parsed_path):
        """Handle API requests for Solar System data"""
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        
        if parsed_path.path == '/api/solar-system/bodies':
            try:
                # Get API key from environment
                api_key = os.environ.get('SOLAR_SYSTEM_API_KEY')
                api_url = "https://api.le-systeme-solaire.net/rest/bodies/"
                
                # Create request with headers
                headers = {}
                if api_key:
                    headers['Authorization'] = f'Bearer {api_key}'
                
                req = Request(api_url, headers=headers)
                
                # Make API request
                with urlopen(req, timeout=10) as response:
                    data = response.read()
                    
                # Send successful response
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(data)
                
            except Exception as e:
                # Send error response
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    "error": "Failed to fetch solar system data",
                    "message": str(e)
                })
                self.wfile.write(error_response.encode())
        else:
            self.send_error(404, "API endpoint not found")
    
    def handle_static_file(self, path):
        """Handle static file serving"""
        # Default to index.html for root
        if path == '/':
            path = '/index.html'
        
        # Remove leading slash
        file_path = path.lstrip('/')
        
        try:
            # Check if file exists
            with open(file_path, 'rb') as f:
                content = f.read()
            
            # Determine content type
            content_type, _ = mimetypes.guess_type(file_path)
            if content_type is None:
                content_type = 'application/octet-stream'
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Cache-Control', 'no-cache')  # Prevent caching for development
            self.end_headers()
            self.wfile.write(content)
            
        except FileNotFoundError:
            self.send_error(404, f"File not found: {file_path}")
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_server():
    """Run the combined server on port 5000"""
    server = HTTPServer(('0.0.0.0', 5000), SpaceSatelliteHandler)
    print("🚀 Space Satellite Website running on http://0.0.0.0:5000")
    print("📡 Solar System API integrated and ready!")
    server.serve_forever()

if __name__ == "__main__":
    run_server()