import { Suspense, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContainer, toast } from 'react-toastify';
import './App.css';
import Player from './components/Player';
import QueueList from './components/QueueList';
import SettingsDashboard from './components/SettingsDashboard';
import StatusIndicator from './components/StatusIndicator';
import i18n from './i18n';
import { useStore } from './store/useStore';

// --- Global Eel Exposure ---

const extractVideoId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Define callbacks globally so Eel can find them during initialization
// @ts-ignore
window.onNewDonation = async (donation: { username: string; amount: number; currency: string; message: string; id: number; timestamp: string; is_test?: boolean }) => {
  console.log('[App] 💰 New donation received:', donation);
  
  // 1. Show notification
  if (donation.is_test) {
    toast.info(i18n.t('notifications.test_donation', { username: donation.username, amount: donation.amount, currency: donation.currency }), {
      autoClose: 3000
    });
  } else {
    toast.success(i18n.t('notifications.new_donation', { username: donation.username, amount: donation.amount, currency: donation.currency }), {
      autoClose: 5000
    });
  }

  // 2. Process Video Request
  const store = useStore.getState();
  const { youtubeApiKey, minDonationAmount, minViewCount, minLikeCount, blacklistedKeywords, addToQueue } = store;

  // Check if message exists
  if (!donation.message) return;

  // Check minimum donation amount for video request
  if (donation.amount < minDonationAmount) {
    console.log(`[App] Donation amount ${donation.amount} is less than minimum ${minDonationAmount} for video request.`);
    return;
  }

  // Find YouTube URL
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = donation.message.match(urlRegex);
  
  if (!urls) return;

  let videoId = null;

  for (const url of urls) {
    const id = extractVideoId(url);
    if (id) {
      videoId = id;
      break; // Take the first valid YouTube link
    }
  }

  if (!videoId) return;

  console.log(`[App] Found YouTube Video ID: ${videoId}. Validating...`);

  if (!youtubeApiKey) {
    console.warn('[App] YouTube API Key is missing. Cannot validate video.');
    toast.warning(i18n.t('notifications.video_not_found')); // Using generic error or add specific key
    return;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch video details");
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      toast.error(i18n.t('notifications.video_not_found'));
      return;
    }

    const video = data.items[0];
    const stats = video.statistics;
    const snippet = video.snippet;

    const viewCount = parseInt(stats.viewCount || '0', 10);
    const likeCount = parseInt(stats.likeCount || '0', 10);
    const title = snippet.title;

    // Check Constraints
    if (viewCount < minViewCount) {
      toast.warning(i18n.t('notifications.video_rejected_views', { current: viewCount.toLocaleString(), min: minViewCount.toLocaleString() }));
      return;
    }

    if (likeCount < minLikeCount) {
      toast.warning(i18n.t('notifications.video_rejected_likes', { current: likeCount.toLocaleString(), min: minLikeCount.toLocaleString() }));
      return;
    }

    const isBlacklisted = blacklistedKeywords.some(keyword => 
      title.toLowerCase().includes(keyword.toLowerCase())
    );

    if (isBlacklisted) {
      toast.warning(i18n.t('notifications.video_rejected_blacklist'));
      return;
    }

    // Add to Queue
    const videoItem = {
      id: videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      title: title,
      requester: donation.username,
      amount: donation.amount,
      duration: video.contentDetails.duration,
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url,
      addedAt: Date.now()
    };

    addToQueue(videoItem);
    toast.success(i18n.t('notifications.video_added', { title: title }));

  } catch (error) {
    console.error("[App] Video processing error:", error);
    toast.error("Error processing video");
  }
};

// @ts-ignore
window.onDAConnectionStatus = (data: { status: string; channel?: string }) => {
  console.log('[App] 🔌 DA Connection status changed:', data);
  
  // Access store outside of component
  const store = useStore.getState();
  
  if (data.status === 'connected') {
    store.setDAConnectionStatus('connected');
    toast.success(i18n.t('status.connected'), { autoClose: 3000 });
  } else if (data.status === 'connecting') {
    store.setDAConnectionStatus('connecting');
  } else if (data.status === 'disconnected') {
    store.setDAConnectionStatus('disconnected');
    toast.warning(i18n.t('status.disconnected'), { autoClose: 3000 });
  }
};

// Expose to Eel immediately if available
if (window.eel) {
  // @ts-ignore
  window.eel.expose(window.onNewDonation, 'onNewDonation');
  // @ts-ignore
  window.eel.expose(window.onDAConnectionStatus, 'onDAConnectionStatus');
} else {
  console.warn('[App] window.eel not found during initial load. Callbacks might not be registered correctly if not using global window functions.');
}
// ---------------------------

const waitForEel = (timeout = 5000) => {
  return new Promise((resolve, reject) => {
    if (window.eel) return resolve(true);
    const start = Date.now();
    const interval = setInterval(() => {
      if (window.eel) {
        clearInterval(interval);
        resolve(true);
      } else if (Date.now() - start > timeout) {
        clearInterval(interval);
        reject(new Error("Eel timeout"));
      }
    }, 100);
  });
};



function App() {
  const { t } = useTranslation();
  const [hasWindow, setHasWindow] = useState(false);
  const store = useStore();
  const isProcessingOAuth = useRef(false);
  const [isEelReady, setIsEelReady] = useState(false);

  // Apply theme
  useEffect(() => {
    if (store.theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }
  }, [store.theme]);

  useEffect(() => {
    waitForEel().then(() => {
      console.log('[App] ✅ Eel is ready');
      setIsEelReady(true);
      setHasWindow(true);
    }).catch(() => {
      console.error('[App] ❌ Eel failed to load');
      toast.error("Критическая ошибка: Бэкенд не отвечает");
    });
  }, []);

  // useEffect(() => {
  //   console.log('[App] Component mounted');
  //   const timer = setTimeout(() => {
  //     console.log('[App] Setting hasWindow to true');
  //     setHasWindow(true);
      
  //     // Проверяем window.eel
  //     setTimeout(() => {
  //       console.log('[App] Checking window.eel availability...');
  //       console.log('[App] window.eel exists:', !!window.eel);
  //       if (window.eel) {
  //         console.log('[App] ✅ window.eel is available');
  //         console.log('[App] window.eel.exchange_da_code:', typeof window.eel.exchange_da_code);
  //       } else {
  //         console.error('[App] ❌ window.eel is NOT available!');
  //       }
  //     }, 100);
  //   }, 0);
  //   return () => clearTimeout(timer);
  // }, []);

  // Обработка OAuth code из URL - ОДИН раз при загрузке
  // useEffect(() => {
  //   if (!hasWindow) return;
    
  //   const urlParams = new URLSearchParams(window.location.search);
  //   const code = urlParams.get('code');
    
  //   // Если нет code или уже обрабатываем - выход
  //   if (!code || isProcessingOAuth.current) {
  //     return;
  //   }
    
  //   // Помечаем что начали обработку
  //   isProcessingOAuth.current = true;
    
  //   const logPrefix = '[VITE] [APP] [OAuth]';
  //   console.log(`${logPrefix} 🔄 Code detected: ${code.substring(0, 10)}...`);
    
  //   const handleOAuthCallback = async () => {
  //     // Ждем window.eel
  //     let attempts = 0;
  //     while (!window.eel && attempts < 20) { // Increased attempts
  //       console.log(`${logPrefix} Waiting for window.eel... (${attempts + 1}/20)`);
  //       await new Promise(resolve => setTimeout(resolve, 250));
  //       attempts++;
  //     }
      
  //     if (!window.eel) {
  //       console.error(`${logPrefix} ❌ window.eel NOT found! Are you running via Python?`);
  //       toast.error('Ошибка: Eel не загружен. Запустите через python main.py');
  //       isProcessingOAuth.current = false;
  //       return;
  //     }
      
  //     console.log(`${logPrefix} ✅ window.eel is ready`);
      
  //     const clientId = store.donationAlertsClientId;
  //     const clientSecret = store.donationAlertsClientSecret;
      
  //     if (!clientId || !clientSecret) {
  //       console.error(`${logPrefix} ❌ Missing credentials in Store!`);
  //       toast.error('Введите Client ID и Secret в настройках');
  //       isProcessingOAuth.current = false;
  //       return;
  //     }
      
  //     console.log(`${logPrefix} 📞 Calling Python exchange_da_code...`);
  //     toast.info('Обмен кода на токен...');
      
  //     try {
  //       const redirectUri = `${window.location.protocol}//${window.location.host}`;
  //       const result = await window.eel.exchange_da_code(code, clientId, clientSecret, redirectUri)();
        
  //       console.log(`${logPrefix} 📦 Result from Python:`, result);
        
  //       if (result.success && result.access_token) {
  //         console.log(`${logPrefix} ✅ Token exchange successful!`);
          
  //         // Сохраняем в store
  //         store.setSettings({
  //           donationAlertsToken: result.access_token,
  //           donationAlertsRefreshToken: result.refresh_token || '',
  //           donationAlertsTokenExpiry: Date.now() + (result.expires_in || 3600) * 1000,
  //           donationAlertsUserId: String(result.user_id || '')
  //         });
          
  //         toast.success(`✅ Подключено: ${result.user_name}`);
          
  //         // Убираем code из URL
  //         window.history.replaceState({}, document.title, window.location.pathname);
  //         console.log(`${logPrefix} 🧹 Code removed from URL`);
  //       } else {
  //         console.error(`${logPrefix} ❌ Exchange failed:`, result.message);
  //         toast.error(result.message || 'Ошибка авторизации');
  //       }
  //     } catch (error) {
  //       console.error(`${logPrefix} ❌ Exception:`, error);
  //       toast.error('Ошибка при обмене кода');
  //     } finally {
  //       isProcessingOAuth.current = false;
  //     }
  //   };
    
  //   handleOAuthCallback();
  // }, [hasWindow, store]);

  useEffect(() => {
    if (!isEelReady || isProcessingOAuth.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      isProcessingOAuth.current = true;
      const handleAuth = async () => {
        try {
          // Ждем еще немного для регистрации всех экспортов
          await new Promise(r => setTimeout(r, 500));
          
          const clientId = store.donationAlertsClientId;
          const clientSecret = store.donationAlertsClientSecret;
          const redirectUri = `${window.location.protocol}//${window.location.host}/`;

          const result = await window.eel.exchange_da_code(code, clientId, clientSecret, redirectUri)();
          
          if (result.success) {
            store.setSettings({
              donationAlertsToken: result.access_token,
              donationAlertsUserId: String(result.user_id)
            });
            toast.success("Подключено успешно!");
          }
          // Очистка URL БЕЗ перезагрузки страницы
          window.history.replaceState({}, document.title, "/");
        } catch (err) {
          console.error("OAuth Error:", err);
        } finally {
          isProcessingOAuth.current = false;
        }
      };
      handleAuth();
    }
  }, [isEelReady]);

  // Запрашиваем актуальный статус при подключении
  useEffect(() => {
    if (!isEelReady) return;

    // Запрашиваем актуальный статус
    // @ts-ignore
    window.eel.get_da_status()().then((res: {status: string}) => {
      if (res.status === 'connected') store.setDAConnectionStatus('connected');
      else if (res.status === 'connecting') store.setDAConnectionStatus('connecting');
      else store.setDAConnectionStatus('disconnected');
    }).catch(console.error);

  }, [isEelReady, store]);

  // Автоматическое подключение при загрузке если токен есть
  useEffect(() => {
    if (!hasWindow || !window.eel) return;
    
    // Если токен уже есть в store, подключаемся автоматически
    if (store.donationAlertsToken && store.donationAlertsClientId) {
      console.log('[App] 🔄 Token found, auto-connecting...');
      
      const connectWithExistingToken = async () => {
        try {
          const result = await window.eel.connect_with_token(
            store.donationAlertsToken,
            store.donationAlertsRefreshToken,
            store.donationAlertsClientId,
            store.donationAlertsClientSecret
          )();
          
          if (result.success) {
            console.log('[App] ✅ Auto-connected successfully');
          } else {
            console.warn('[App] ⚠️ Auto-connect failed:', result.message);
            // Возможно токен истек, не показываем ошибку пользователю
          }
        } catch (error) {
          console.error('[App] ❌ Auto-connect error:', error);
        }
      };
      
      connectWithExistingToken();
    }
  }, [hasWindow, store.donationAlertsToken, store.donationAlertsClientId, store.donationAlertsRefreshToken, store.donationAlertsClientSecret]);

  if (!hasWindow) return null;


  return (
    <main className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-white p-4 md:p-6 lg:p-8 flex flex-col gap-6 transition-colors duration-300">
      <header className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {t('app.title')} <span className="text-zinc-500 text-sm font-normal">{t('app.version')}</span>
        </h1>
        <StatusIndicator />
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 flex flex-col min-h-[400px]">
            <Player />
        </div>
        <div className="h-[500px] lg:h-auto">
            <QueueList />
        </div>
      </div>

      <SettingsDashboard />
      <Suspense fallback={null}>
      </Suspense>
      <ToastContainer/>
    </main>
  );
}

export default App
