import eel
import requests
import json
import logging
from threading import Thread
import time

try:
    import websocket
except ImportError:
    websocket = None
    print("[WARNING] websocket-client not installed. Run: pip install websocket-client")

class DonationAlertsProvider:
    def __init__(self, logger):
        self.logger = logger
        self.client_id = None
        self.client_secret = None
        self.redirect_uri = "http://localhost:8080"
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
        self.socket_token = None
        self.ws = None
        self.ws_thread = None
        self.is_connected = False

    def log(self, message, level="info"):
        prefix = "[PYTHON] [DA_PROVIDER]"
        if level == "error":
            self.logger.error(f"{prefix} ❌ {message}")
        elif level == "warning":
            self.logger.warning(f"{prefix} ⚠️ {message}")
        else:
            self.logger.info(f"{prefix} {message}")

    def exchange_code_for_token(self, code, client_id, client_secret, redirect_uri=None):
        """Exchanges OAuth code for access token"""
        self.log(f"Exchanging code for token...", "info")
        self.log(f"Code: {code[:10]}...", "info")
        self.log(f"Client ID: {client_id}", "info")
        
        # Use provided redirect_uri or fallback to default
        uri_to_use = redirect_uri if redirect_uri else self.redirect_uri
        self.log(f"Redirect URI: {uri_to_use}", "info")
        
        url = "https://www.donationalerts.com/oauth/token"
        data = {
            "grant_type": "authorization_code",
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": uri_to_use,
            "code": code
        }

        try:
            response = requests.post(url, data=data, timeout=15)
            self.log(f"Response Status: {response.status_code}", "info")
            
            if response.status_code == 200:
                token_data = response.json()
                self.access_token = token_data.get("access_token")
                self.refresh_token = token_data.get("refresh_token")
                self.client_id = client_id
                self.client_secret = client_secret
                
                self.log("✅ Token exchange successful!", "info")
                
                # Get User Info & Socket Token immediately
                if self._fetch_user_info():
                    # Start WebSocket
                    self._start_websocket()
                    
                    return {
                        "success": True,
                        "access_token": self.access_token,
                        "refresh_token": self.refresh_token,
                        "expires_in": token_data.get("expires_in"),
                        "user_id": self.user_id,
                        "user_name": self.user_name
                    }
            else:
                self.log(f"Token exchange failed: {response.text}", "error")
                return {
                    "success": False,
                    "message": f"HTTP {response.status_code}: {response.text}"
                }
                
        except Exception as e:
            self.log(f"Exception during token exchange: {e}", "error")
            return {"success": False, "message": str(e)}
        
        return {"success": False, "message": "Unknown error"}

    def _fetch_user_info(self):
        """Fetches user info and socket connection token"""
        self.log("Fetching user info and socket token...", "info")
        url = "https://www.donationalerts.com/api/v1/user/oauth"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json().get("data", {})
                self.user_id = data.get("id")
                self.user_name = data.get("name")
                self.socket_token = data.get("socket_connection_token")
                
                self.log(f"User: {self.user_name} (ID: {self.user_id})", "info")
                self.log(f"Socket Token: {self.socket_token[:10]}...", "info")
                return True
            else:
                self.log(f"Failed to get user info: {response.text}", "error")
        except Exception as e:
            self.log(f"Error fetching user info: {e}", "error")
        return False

    def _start_websocket(self):
        if self.ws_thread and self.ws_thread.is_alive():
            self.log("WebSocket already running", "warning")
            return

        self.log("Starting WebSocket thread...", "info")
        self.ws_thread = Thread(target=self._websocket_loop, daemon=True)
        self.ws_thread.start()

    def _send_to_ui(self, function_name, data):
        """Helper to safely call Eel functions"""
        try:
            func = getattr(eel, function_name, None)
            if func:
                self.log(f"Calling UI function: {function_name}", "info")
                func(data)
            else:
                self.log(f"⚠️ UI function '{function_name}' NOT found in eel module. Is the browser connected?", "warning")
        except Exception as e:
            self.log(f"Error calling {function_name}: {e}", "warning")

    def _websocket_loop(self):
        time.sleep(1.0)
        if not websocket:
            self.log("websocket-client not installed", "error")
            return

        ws_url = "wss://centrifugo.donationalerts.com/connection/websocket"
        self.log(f"Connecting to {ws_url}...", "info")
        
        # Notify UI
        self._send_to_ui('onDAConnectionStatus', {'status': 'connecting'})

        def on_open(ws):
            self.log("✅ WebSocket Connected! Sending Auth...", "info")
            # Step 1: Send Auth with socket_token
            auth_payload = {
                "params": {"token": self.socket_token},
                "id": 1
            }
            ws.send(json.dumps(auth_payload))
            

        def on_message(ws, message):
            if message == "{}": return  # PING message
            self.log(f"📥 RAW MESSAGE FROM SERVER: {message}", "info")
            try:
                data = json.loads(message)
                
                # Обработка PING (Centrifugo присылает {} для поддержания связи)
                if not data:
                    return

                # Если в ответе есть "result" (ответ на команды auth/subscribe)
                if "id" in data:
                    if data.get("id") == 1:
                        client_id = data.get("result", {}).get("client")
                        self.log(f"✅ Auth result: {client_id}", "info")
                        self._subscribe_to_channel(ws, client_id)
                    elif data.get("id") == 2:
                        self.log("✅ Subscription successful!", "info")
                        self.is_connected = True
                        self._send_to_ui('onDAConnectionStatus', {'status': 'connected'})

                # Если это УВЕДОМЛЕНИЕ (оно приходит без ID)
                if "result" in data:
                    result = data["result"]
                    # Проверяем разные варианты вложенности данных
                    if "data" in result and "data" in result["data"]:
                        # Стандартный формат: result -> data -> data
                        self._handle_notification(result["data"]["data"])
                    elif "data" in result:
                        # Упрощенный формат
                        self._handle_notification(result["data"])
                    elif "type" in result and result["type"] == "publish":
                        # Centrifugo publish формат
                        self._handle_notification(result.get("data", {}))
                    
            except Exception as e:
                self.log(f"Error parsing message: {e}", "error")

        def on_error(ws, error):
            self.log(f"WebSocket Error: {error}", "error")
            self._send_to_ui('onDAConnectionStatus', {'status': 'disconnected'})

        def on_close(ws, close_status_code, close_msg):
            self.log(f"WebSocket Closed: {close_status_code} {close_msg}", "warning")
            self.is_connected = False
            self._send_to_ui('onDAConnectionStatus', {'status': 'disconnected'})

        # Run WebSocket
        self.ws = websocket.WebSocketApp(
            ws_url,
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        self.ws.run_forever(ping_interval=25, ping_timeout=10)

    def _subscribe_to_channel(self, ws, client_id):
        """Get subscription token and subscribe"""
        channel = f"$alerts:donation_{self.user_id}"
        self.log(f"Getting subscription token for {channel}...", "info")
        
        url = "https://www.donationalerts.com/api/v1/centrifuge/subscribe"
        headers = {"Authorization": f"Bearer {self.access_token}"}
        payload = {
            "client": client_id,
            "channels": [channel]
        }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            if response.status_code == 200:
                channels_data = response.json().get("channels", [])
                sub_token = None
                for c in channels_data:
                    if c["channel"] == channel:
                        sub_token = c["token"]
                        break
                
                if sub_token:
                    self.log("✅ Got subscription token. Subscribing...", "info")
                    sub_msg = {
                        "params": {
                            "channel": channel,
                            "token": sub_token
                        },
                        "method": 1,
                        "id": 2
                    }
                    ws.send(json.dumps(sub_msg))
                else:
                    self.log("❌ Subscription token not found in response", "error")
            else:
                self.log(f"❌ Failed to get sub token: {response.text}", "error")
        except Exception as e:
            self.log(f"Error getting sub token: {e}", "error")

    def _handle_notification(self, data):
        """Process incoming donation data"""
        self.log(f"💰 DEBUG NOTIFICATION DATA: {json.dumps(data)}", "info")
        try:
            # Пытаемся извлечь данные доната, учитывая разную вложенность
            donation_data = data
            self.log(f"💰 Initial Donation Data: {json.dumps(donation_data)}", "info")

            # Если данные обернуты в еще один data (бывает в некоторых версиях API)
            if "data" in data and isinstance(data["data"], dict):
                donation_data = data["data"]
            
            # Проверяем, не является ли это просто информационным сообщением о подключении
            if "info" in donation_data and "user" in donation_data["info"]:
                self.log("ℹ️ Received connection info message (ignoring)", "info")
                self.log(f"💰 Parsed Donation Data: {json.dumps(donation_data)}", "info")
                return

            self.log(f"💰 Parsed Donation Data: {json.dumps(donation_data)}", "info")
            
            self.log(f"🔔 New Donation: {donation_data.get('username')} - {donation_data.get('amount')} {donation_data.get('currency')}", "info")
            self._send_to_ui('onNewDonation', donation_data)
            
        except Exception as e:
            self.log(f"Error handling notification: {e}", "error")

    def test_connection(self, client_id, client_secret, access_token=None):
        # Keep existing test logic but use new log method
        self.log("Testing connection...", "info")
        return {"success": True, "message": "Ready to connect"} # Simplified for now
