import React, { useState, useEffect } from 'react';

const DonationAlerts = () => {
  const [status, setStatus] = useState('disconnected');
  const [donations, setDonations] = useState([]);

  useEffect(() => {
    // Регистрация коллбэков от Python
    window.eel.expose(onDAStatusUpdate, "onDAStatusUpdate");
    window.eel.expose(onNewDonation, "onNewDonation");

    function onDAStatusUpdate(data) {
      setStatus(data.status);
      console.log("DA Connected!");
    }

    function onNewDonation(donation) {
      setDonations(prev => [donation, ...prev]);
      // Можно запустить звук или анимацию
    }
  }, []);

  const handleConnect = () => {
    const credentials = {
      client_id: localStorage.getItem('da_id'),
      client_secret: localStorage.getItem('da_secret')
    };
    window.eel.start_da_auth(credentials)();
  };

  return (
    <div className="p-4 bg-zinc-900 rounded-lg border border-zinc-800">
      <h2 className="text-xl mb-4 font-bold">DonationAlerts</h2>
      
      {status !== 'connected' ? (
        <button 
          onClick={handleConnect}
          className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded shadow-lg transition"
        >
          Connect Account
        </button>
      ) : (
        <div className="text-green-500 font-medium flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Active
        </div>
      )}

      <div className="mt-4 space-y-2 max-h-40 overflow-y-auto">
        {donations.map((d, i) => (
          <div key={i} className="bg-zinc-800 p-2 rounded text-sm animate-bounce">
            <b>{d.username}</b>: {d.amount} {d.currency}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonationAlerts;