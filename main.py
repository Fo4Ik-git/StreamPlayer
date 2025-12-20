import eel
import os
import logging
import sys
from threading import Thread
from providers.da_provider import DonationAlertsProvider

# --- Настройка логирования ---
logging.basicConfig(
    level=logging.INFO,
    format='%(name)s  %(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("Инициализация StreamPlayer бэкенда...")

try:
    da_provider = DonationAlertsProvider(logger=logger)
    logger.info("DonationAlertsProvider инициализирован.")
except Exception as e:
    logger.error(f"Ошибка провайдера: {e}")

def get_app_path():
    """Определяет путь к ресурсам (поддерживает и dev-режим, и PyInstaller)"""
    if hasattr(sys, '_MEIPASS'):
        # Путь внутри временной папки PyInstaller
        return sys._MEIPASS
    # Путь в обычном режиме запуска (через python main.py)
    return os.path.dirname(os.path.abspath(__file__))

# 1. Получаем базовый путь
base_path = get_app_path()

# 2. Соединяем его с папкой dist
web_dir = os.path.join(base_path, 'dist')

logger.info(f"[*] Инициализация Eel в папке: {web_dir}")

if os.path.exists(web_dir):
    eel.init(web_dir)
else:
    logger.error(f"Директория {web_dir} не найдена! Убедитесь, что 'npm run build' выполнен.")

# --- Экспортируемые функции ---

@eel.expose
def play_stream(url):
    logger.info(f"Воспроизведение: {url}")

@eel.expose
def start_da_auth(credentials):
    """Запускает OAuth в отдельном потоке, чтобы не блокировать UI"""
    cid = credentials.get('client_id', 'unknown')
    logger.info(f"Запуск OAuth для ID: {cid}")
    
    # Запускаем в Thread, чтобы основной цикл Eel был свободен
    auth_thread = Thread(
        target=da_provider.auth, 
        args=(credentials['client_id'], credentials['client_secret']),
        daemon=True
    )
    auth_thread.start()

@eel.expose
def test_da_connection(credentials):
    logger.info(f"Тест соединения для: {credentials.get('client_id')}")
    return da_provider.test_connection(
        credentials.get('client_id'), 
        credentials.get('client_secret'), 
        credentials.get('access_token')
    )

@eel.expose
def exchange_da_code(code, client_id, client_secret, redirect_uri=None):
    """
    Обменивает OAuth code на access token
    Вызывается из React когда приложение получает code в URL
    """
    logger.info("="*60)
    logger.info("exchange_da_code ВЫЗВАНА!")
    logger.info(f"Code: {code[:20]}...")
    logger.info(f"Client ID: {client_id}")
    logger.info(f"Has Client Secret: {bool(client_secret)}")
    logger.info(f"Redirect URI: {redirect_uri}")
    logger.info("="*60)
    
    result = da_provider.exchange_code_for_token(code, client_id, client_secret, redirect_uri)
    
    logger.info(f"Exchange result: success={result.get('success')}")
    if result.get('success'):
        logger.info(f"User: {result.get('user_name')} (ID: {result.get('user_id')})")
    
    return result

@eel.expose
def connect_with_token(access_token, refresh_token, client_id, client_secret):
    """
    Подключается к DonationAlerts с существующим токеном
    Вызывается из React при загрузке страницы, если токен уже есть в store
    """
    logger.info("="*60)
    logger.info("connect_with_token ВЫЗВАНА!")
    logger.info(f"Has Access Token: {bool(access_token)}")
    logger.info(f"Has Refresh Token: {bool(refresh_token)}")
    logger.info(f"Client ID: {client_id}")
    logger.info("="*60)
    
    try:
        # Устанавливаем токены в провайдер
        da_provider.access_token = access_token
        da_provider.refresh_token = refresh_token
        da_provider.client_id = client_id
        da_provider.client_secret = client_secret
        
        # Проверяем валидность токена
        if da_provider._fetch_user_info():
            logger.info(f"Token valid for user: {da_provider.user_name}")
            
            # Запускаем WebSocket
            da_provider._start_websocket()
            
            return {
                'success': True,
                'message': 'Connected with existing token',
                'user_name': da_provider.user_name,
                'user_id': da_provider.user_id
            }
        else:
            logger.error("Token is invalid or expired")
            return {
                'success': False,
                'message': 'Token is invalid or expired'
            }
        
    except Exception as e:
        logger.error(f"Error connecting with token: {e}")
        return {
            'success': False,
            'message': str(e)
        }

@eel.expose
def get_da_status():
    """Возвращает текущий статус подключения"""
    status = 'connected' if da_provider.is_connected else 'disconnected'
    # Если поток запущен но еще не connected, значит connecting
    if da_provider.ws_thread and da_provider.ws_thread.is_alive() and not da_provider.is_connected:
        status = 'connecting'
    return {'status': status}

# --- Запуск приложения ---

def console_loop():
    import time
    time.sleep(2) # Wait for startup
    print("\n" + "="*50)
    print("CONSOLE COMMANDS AVAILABLE:")
    print("  donate <name> <amount> <message>  - Simulate donation")
    print("  status                            - Show connection info")
    print("  help                              - Show this menu")
    print("="*50 + "\n")
    
    while True:
        try:
            cmd = input(">>> ").strip()
            if not cmd: continue
            
            parts = cmd.split()
            command = parts[0].lower()
            
            if command == "donate":
                # donate User 100 Hello world
                if len(parts) < 3:
                    print("Usage: donate <name> <amount> <message>")
                    continue
                
                name = parts[1]
                try:
                    amount = float(parts[2])
                except ValueError:
                    print("Invalid amount")
                    continue
                    
                message = " ".join(parts[3:]) if len(parts) > 3 else ""
                
                fake_data = {
                    "username": name,
                    "amount": amount,
                    "currency": "RUB",
                    "message": message,
                    "id": 12345,
                    "date_created": "2023-01-01 12:00:00"
                }
                
                print(f"[CONSOLE] Simulating donation from {name}...")
                da_provider._handle_notification(fake_data)
                
            elif command == "status":
                print("\n--- DA PROVIDER STATUS ---")
                print(f"Connected: {da_provider.is_connected}")
                print(f"Client ID: {da_provider.client_id}")
                print(f"Client Secret: {'*' * 5 if da_provider.client_secret else 'None'}")
                print(f"Access Token: {'*' * 10 if da_provider.access_token else 'None'}")
                print(f"User ID: {da_provider.user_id}")
                print(f"User Name: {getattr(da_provider, 'user_name', 'Unknown')}")
                print("--------------------------\n")
                
            elif command == "help":
                print("Commands: donate, status, help")
                
            else:
                print("Unknown command. Type 'help'.")
                
        except EOFError:
            break
        except Exception as e:
            print(f"Console error: {e}")

# Start console thread
console_thread = Thread(target=console_loop, daemon=True)
console_thread.start()

eel_kwargs = {
    'host': 'localhost',
    'port': 8080,
    'shutdown_delay': 5.0, # ОЧЕНЬ ВАЖНО: не закрывать Python сразу при потере связи
}

@eel.expose
def ping():
    return "pong"

try:
    logger.info("Запуск сервера StreamPlayer...")
    
    # Если используете 'chrome', Eel создаст апп-окно. 
    # Если 'None', открывайте http://localhost:8080 вручную.

    browser_modes = ['chrome', 'edge', 'default']

    # Check if mode chrome is available
    for mode in browser_modes:
        try:
            print(f"[*] Попытка запуска в режиме: {mode}")
            eel.start('index.html', mode=mode, **eel_kwargs)
            started = True
            break  # Если запустилось, выходим из цикла
        except Exception as e:
            print(f"[!] Режим {mode} недоступен: {e}")
            continue

    if not started:
        logger.error("Ни один из браузеров не смог запуститься.")
    
except (SystemExit, KeyboardInterrupt):
    logger.info("Приложение штатно остановлено.")
except Exception as e:
    logger.error(f"Критический сбой: {e}")