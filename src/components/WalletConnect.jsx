import React, { useEffect } from 'react';
import { useAppKit, useAppKitAccount, useDisconnect } from '@reown/appkit/react';

const WalletConnect = ({ showToast }) => {
  const { open, close } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { disconnect } = useDisconnect();
  

  const handleConnect = () => {
    try {
      console.log('Відкриваємо модалку підключення...');
      
      // Очищуємо стару сесію WalletConnect якщо є
      if (localStorage.getItem('walletconnect')) {
        localStorage.removeItem('walletconnect');
        console.log('Очищено стару сесію WalletConnect');
      }
      
      // Відкриваємо модалку з усіма доступними гаманцями
      open();
    } catch (error) {
      console.error('Помилка підключення гаманця:', error);
      // Додаткова обробка помилок
      if (error.message?.includes('User rejected')) {
        console.log('Користувач відхилив підключення - це нормально');
        return; // Не показувати помилку для відхилення
      } else if (error.message?.includes('No matching key')) {
        console.log('Проблема з сесією WalletConnect - очищуємо кеш');
        // Очищуємо кеш та перезапускаємо
        localStorage.removeItem('walletconnect');
        sessionStorage.clear();
        setTimeout(() => {
          open();
        }, 2000);
      }
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      try {
        await navigator.clipboard.writeText(address);
        console.log('Address copied:', address);
        // Show success toast using the shared toast system
        showToast('Address copied', 'success');
      } catch (err) {
        console.error('Copy error:', err);
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Address copied', 'success');
      }
    }
  };

  // Handle connection status
  useEffect(() => {
    console.log('=== WalletConnect Debug ===');
    console.log('Connection status:', status);
    console.log('isConnected:', isConnected);
    console.log('address:', address);
    console.log('User Agent:', navigator.userAgent);
    console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    console.log('========================');
    
    if (status === 'error') {
      console.log('Wallet connection error');
      
      // Check if it's a "No matching key" error
      if (localStorage.getItem('walletconnect')) {
        console.log('Found problematic WalletConnect session - clearing');
        localStorage.removeItem('walletconnect');
        sessionStorage.clear();
      }
    } else if (status === 'disconnected') {
      console.log('Wallet disconnected');
    } else if (status === 'connecting') {
      console.log('Connecting to wallet...');
    } else if (status === 'connected') {
      console.log('Wallet successfully connected!');
      console.log('Address to display:', address);
      console.log('Formatted address:', formatAddress(address));
      showToast('Wallet connected', 'success');
    }
  }, [status, isConnected, address]);


  const clearCache = () => {
    localStorage.removeItem('walletconnect');
    sessionStorage.clear();
    console.log('Cache cleared');
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <button 
        className="connect-wallet"
        onClick={isConnected ? copyAddress : handleConnect}
        disabled={status === 'connecting'}
        title={isConnected ? "Click to copy address" : "Connect wallet"}
      >
        {status === 'connecting' ? 'Connecting...' : 
         isConnected && address ? formatAddress(address) : 'Connect Wallet'}
      </button>
       {isConnected && address && (
         <button 
           className="disconnect-btn"
           onClick={async () => {
             try {
               console.log('Відключаємо гаманець...');
               await disconnect();
               console.log('Гаманець успішно відключений');
               showToast('Wallet disconnected', 'info');
             } catch (error) {
               console.error('Помилка відключення:', error);
               // Fallback - очищуємо localStorage та перезавантажуємо
               localStorage.removeItem('walletconnect');
               sessionStorage.clear();
               window.location.reload();
             }
           }}
           style={{ 
             width: '32px',
             height: '32px',
             fontSize: '14px', 
             color: '#ef4444',
             background: 'rgba(239, 68, 68, 0.1)',
             border: '1px solid rgba(239, 68, 68, 0.3)',
             borderRadius: '8px',
             cursor: 'pointer',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             transition: 'all 0.2s ease',
             backdropFilter: 'blur(10px)',
             boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)'
           }}
           onMouseEnter={(e) => {
             e.target.style.background = 'rgba(239, 68, 68, 0.2)';
             e.target.style.borderColor = 'rgba(239, 68, 68, 0.5)';
             e.target.style.transform = 'scale(1.05)';
           }}
           onMouseLeave={(e) => {
             e.target.style.background = 'rgba(239, 68, 68, 0.1)';
             e.target.style.borderColor = 'rgba(239, 68, 68, 0.3)';
             e.target.style.transform = 'scale(1)';
           }}
           title="Disconnect wallet"
         >
           ✕
         </button>
       )}
      {status === 'connecting' && (
        <div style={{ 
          marginTop: '10px', 
          fontSize: '12px', 
          color: '#888',
          textAlign: 'center' 
        }}>
        </div>
      )}
      {status === 'error' && (
        <button 
          onClick={clearCache}
          style={{ 
            marginTop: '10px', 
            fontSize: '12px', 
            color: '#ef4444',
            background: 'transparent',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            padding: '4px 8px',
            cursor: 'pointer'
          }}
        >
          Clear Cache
        </button>
      )}
    </div>
  );
};

export default WalletConnect;
