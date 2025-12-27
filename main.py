import eel
import os
import logging
import sys
from threading import Thread
from providers.da_provider import da_provider
from providers.youtube_caption import caption_provider


logging.basicConfig(
    level=logging.INFO,
    format='%(name)s  %(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("Initializing StreamPlayer backend...")

PROVIDERS = {
    'DA': da_provider,
    'YC': caption_provider
}

def get_app_path():
    """Determines the path to resources (supports both dev mode and PyInstaller)"""
    if hasattr(sys, '_MEIPASS'):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

base_path = get_app_path()
web_dir = os.path.join(base_path, 'dist')

logger.info(f"[*] Initializing Eel in directory: {web_dir}")


if os.path.exists(web_dir):
    eel.init(web_dir)
else:
    logger.error(f"Dicrectory {web_dir} not found! Make sure 'npm run build' has been executed.")


eel_kwargs = {
    'host': 'localhost',
    'port': 8080,
    'shutdown_delay': 5.0,
    # 'cmdline_args': ['--auto-open-devtools-for-tabs']
}

@eel.expose
def ping():
    return "pong"


@eel.expose
def connect_provider(provider_id, config):
    """Универсальная функция подключения"""
    if provider_id in PROVIDERS:
        # Для DA мы вызываем connect_with_token, для DX - connect
        # Приводим к общему виду:
        provider = PROVIDERS[provider_id]
        
        if provider_id == 'DA':
            return provider.connect_with_token(
                config.get('token'),
                config.get('refresh_token'),
                config.get('client_id'),
                config.get('client_secret')
            )
        elif provider_id == 'DX':
            return provider.connect(config.get('token'))
            
    return {"success": False, "message": "Provider not found"}

@eel.expose
def get_all_statuses():
    """Получить статусы всех провайдеров сразу"""
    return {p_id: p.get_status() for p_id, p in PROVIDERS.items()}

try:
    logger.info("Starting StreamPlayer server...")
    
    # If you use 'chrome', Eel will create an app window. 
    # If 'None', open http://localhost:8080 manually.

    browser_modes = ['chrome', 'edge', 'default']

    # Check if mode chrome is available
    for mode in browser_modes:
        try:
            print(f"[*] Trying to start in mode: {mode}")
            eel.start('index.html', mode=mode, **eel_kwargs, )
            started = True
            break  # If started, exit the loop
        except Exception as e:
            print(f"[!] Mode {mode} not available: {e}")
            continue

    if not started:
        logger.error("No browsers could be started.")
    
except (SystemExit, KeyboardInterrupt):
    logger.info("Application stopped gracefully.")
except Exception as e:
    logger.error(f"Critical failure: {e}")