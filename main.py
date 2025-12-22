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

# --- Запуск приложения ---

eel_kwargs = {
    'host': 'localhost',
    'port': 8080,
    'shutdown_delay': 5.0,
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