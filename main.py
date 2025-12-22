import eel
import os
import logging
import sys
from threading import Thread
from providers.da_provider import DonationAlertsProvider

logging.basicConfig(
    level=logging.INFO,
    format='%(name)s  %(asctime)s [%(levelname)s] %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger(__name__)

logger.info("Initializing StreamPlayer backend...")


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
}

@eel.expose
def ping():
    return "pong"

try:
    logger.info("Starting StreamPlayer server...")
    
    # If you use 'chrome', Eel will create an app window. 
    # If 'None', open http://localhost:8080 manually.

    browser_modes = ['chrome', 'edge', 'default']

    # Check if mode chrome is available
    for mode in browser_modes:
        try:
            print(f"[*] Trying to start in mode: {mode}")
            eel.start('index.html', mode=mode, **eel_kwargs)
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