import React, { useState, useEffect, useCallback } from 'react';
import { useAppKit, useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import { Contract, BrowserProvider, ethers } from 'ethers';
import './AdminPanel.css';

const AdminPanel = () => {
  const { open } = useAppKit();
  const { address, isConnected, status } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  const [contract, setContract] = useState(null);
  const [contractBalances, setContractBalances] = useState({
    USDT: '0',
    USDC: '0'
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('USDT');
  const [showTokenSelector, setShowTokenSelector] = useState(false);

  // Адреса токенов
  const tokenAddresses = {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
  };

  // Информация о токенах
  const tokens = [
    { 
      symbol: 'USDT', 
      name: 'Tether USD', 
      icon: 'https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png', 
      color: '#26a17b' 
    },
    { 
      symbol: 'USDC', 
      name: 'USD Coin', 
      icon: 'https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png', 
      color: '#2775ca' 
    }
  ];

  // Инициализация контракта
  const initializeContract = useCallback(async () => {
    if (!walletProvider || !address) {
      return;
    }
    
    try {
      const ethersProvider = new BrowserProvider(walletProvider, 'mainnet', {
        polling: true,
        pollingInterval: 1000,
        batchStallTime: 100,
        batchMaxCount: 10
      });
      const signer = await ethersProvider.getSigner();
      
      // ABI контракта
      const contractABI = [
        "function getContractBalance(address token) view returns (uint256)",
        "function adminWithdraw(address token, uint256 amount) external",
        "function adminWithdrawAll(address token) external",
        "function emergencyWithdraw() external",
        "function owner() view returns (address)",
        "function USDT_ADDRESS() view returns (address)",
        "function USDC_ADDRESS() view returns (address)"
      ];
      
      const contractAddress = "0xb49b24a84c4C0Cbb9e70289853DE06CaBEfC67e7";
      
      // Проверка существования контракта
      try {
        const code = await ethersProvider.getCode(contractAddress);
        if (code === '0x') {
          setContract(null);
          return;
        }
      } catch (error) {
        setContract(null);
        return;
      }
      
      const contractInstance = new Contract(contractAddress, contractABI, signer);
      
      // Проверка владельца контракта
      try {
        const owner = await contractInstance.owner();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        showToast('Вы не являетесь владельцем контракта', 'error');
        setContract(null);
        return;
      }
        setContract(contractInstance);
      } catch (error) {
        setContract(null);
      }
      
    } catch (error) {
      console.error('Помилка ініціалізації контракту:', error);
      setContract(null);
    }
  }, [walletProvider, address]);

  // Получение балансов контракта
  const fetchContractBalances = useCallback(async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const balances = {};
      
      for (const [tokenName, tokenAddress] of Object.entries(tokenAddresses)) {
        try {
          const balance = await contract.getContractBalance(tokenAddress);
          balances[tokenName] = ethers.formatUnits(balance, 6);
        } catch (error) {
          balances[tokenName] = '0';
        }
      }
      
      setContractBalances(balances);
    } catch (error) {
      console.error('Помилка отримання балансів:', error);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  // Вывод средств
  const handleWithdraw = async () => {
    if (!contract || !withdrawAmount) return;
    
    try {
      setLoading(true);
      const tokenAddress = tokenAddresses[selectedToken];
      const amount = ethers.parseUnits(withdrawAmount, 6);
      
      const tx = await contract.adminWithdraw(tokenAddress, amount, {
        gasLimit: 200000,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      });
      
      await tx.wait(1);
      showToast('Средства успешно выведены', 'success');
      setWithdrawAmount('');
      fetchContractBalances();
      
    } catch (error) {
      console.error('Ошибка вывода:', error);
      if (error.message.includes('insufficient funds')) {
        showToast('Недостаточно средств', 'error');
      } else if (error.message.includes('user rejected')) {
        showToast('Транзакция отклонена', 'error');
      } else {
        showToast('Ошибка вывода', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Вывод всех средств
  const handleWithdrawAll = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const tokenAddress = tokenAddresses[selectedToken];
      
      const tx = await contract.adminWithdrawAll(tokenAddress, {
        gasLimit: 200000,
        maxFeePerGas: ethers.parseUnits('20', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei')
      });
      
      await tx.wait(1);
      showToast('Все средства успешно выведены', 'success');
      fetchContractBalances();
      
    } catch (error) {
      console.error('Ошибка вывода всех средств:', error);
      showToast('Ошибка вывода', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Получение информации о токене
  const getTokenInfo = (symbol) => {
    return tokens.find(token => token.symbol === symbol) || { symbol, name: symbol, icon: '', color: '#6b7280' };
  };

  // Выбор токена
  const handleTokenSelect = (token) => {
    setSelectedToken(token.symbol);
    setShowTokenSelector(false);
  };

  // Toast функции
  const showToast = (message, type = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'error' });
    }, 3000);
  };

  // Инициализация при подключении кошелька
  useEffect(() => {
    if (isConnected && address && walletProvider) {
      initializeContract();
    }
  }, [isConnected, address, walletProvider, initializeContract]);

  // Обновление балансов при изменении контракта
  useEffect(() => {
    if (contract) {
      fetchContractBalances();
    }
  }, [contract, fetchContractBalances]);

  return (
    <div className="sushi-app">
      {/* Заголовок */}
      <header className="header">
        <div className="logo-section">
          <img 
            src={process.env.PUBLIC_URL + '/logo-png/logo.png'} 
            alt="Aether Admin Logo" 
            className="logo-image"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iOCIgZmlsbD0iIzNiODJmNiIvPgo8cGF0aCBkPSJNMTIgMjRIMjRWMzZIMTJWMjRaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNMjQgMTJIMzZWMjRIMjRWMTJaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K';
            }}
          />
          <div className="logo">
            <span className="logo-first">Aether</span><span className="logo-second">Admin</span>
          </div>
        </div>
        <div className="wallet-section">
          <div className="network-badge">
            <div className="network-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="#ffffff" strokeWidth="2"/>
                <path d="M9 9H15M9 15H15" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <span>Админ панель</span>
          </div>
          {!isConnected ? (
            <button 
              className="connect-wallet"
              onClick={() => open()}
            >
              Подключить кошелек
            </button>
          ) : (
            <div className="wallet-connected">
              <div className="wallet-address">
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="admin-unified-section">
          <div className="admin-section-header">
            <div className="admin-tabs">
              <button className="admin-tab active">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="admin-tab-icon">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Админ панель
              </button>
            </div>
          </div>

          <div className="admin-content-grid">
            {/* Балансы контракта */}
            <div className="admin-balances-section">
              <div className="admin-section-title">Балансы контракта</div>
              <div className="admin-balance-cards">
                <div className="admin-balance-card">
                  <div className="admin-balance-header">
                    <div className="admin-balance-token">
                      <div className="admin-balance-icon">
                        <img 
                          src={getTokenInfo('USDT').icon} 
                          alt="USDT"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                            e.target.nextSibling.style.display = 'none';
                          }}
                        />
                        <div style={{ 
                          display: 'none', 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: getTokenInfo('USDT').color, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'white', 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          boxShadow: `0 0 0 2px ${getTokenInfo('USDT').color}20`
                        }}>
                          U
                        </div>
                      </div>
                      <span>USDT</span>
                    </div>
                  </div>
                  <div className="admin-balance-amount">
                    {loading ? 'Загрузка...' : `${parseFloat(contractBalances.USDT).toFixed(2)} USDT`}
                  </div>
                </div>

                <div className="admin-balance-card">
                  <div className="admin-balance-header">
                    <div className="admin-balance-token">
                      <div className="admin-balance-icon">
                        <img 
                          src={getTokenInfo('USDC').icon} 
                          alt="USDC"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                            e.target.nextSibling.style.display = 'none';
                          }}
                        />
                        <div style={{ 
                          display: 'none', 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          background: getTokenInfo('USDC').color, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'white', 
                          fontSize: '14px', 
                          fontWeight: 'bold',
                          boxShadow: `0 0 0 2px ${getTokenInfo('USDC').color}20`
                        }}>
                          U
                        </div>
                      </div>
                      <span>USDC</span>
                    </div>
                  </div>
                  <div className="admin-balance-amount">
                    {loading ? 'Загрузка...' : `${parseFloat(contractBalances.USDC).toFixed(2)} USDC`}
                  </div>
                </div>
              </div>
            </div>

            {/* Вывод средств */}
            {contract && (
              <div className="admin-withdraw-section">
                <div className="admin-section-title">Вывод средств</div>
                <div className="admin-withdraw-form">
                  <div className="admin-token-input">
                    <div className="admin-amount-section">
                      <input
                        type="number"
                        className="admin-token-amount"
                        placeholder="0.0"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div className="admin-token-selector" onClick={() => setShowTokenSelector(true)}>
                      <div className="admin-token-icon">
                        <img 
                          src={getTokenInfo(selectedToken).icon} 
                          alt={getTokenInfo(selectedToken).symbol}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                          onLoad={(e) => {
                            e.target.style.display = 'block';
                            e.target.nextSibling.style.display = 'none';
                          }}
                        />
                        <div style={{ 
                          display: 'none', 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: getTokenInfo(selectedToken).color, 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          color: 'white', 
                          fontSize: '12px', 
                          fontWeight: 'bold',
                          boxShadow: `0 0 0 2px ${getTokenInfo(selectedToken).color}20`
                        }}>
                          {getTokenInfo(selectedToken).symbol.charAt(0)}
                        </div>
                      </div>
                      <span className="admin-token-symbol">{selectedToken}</span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M8 6L12 10L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 18L12 14L16 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                    </div>
                  </div>
                  <div className="admin-bottom-row">
                    <div className="admin-usd-value">
                      {selectedToken === 'USDT' ? 'Tether USD' : 'USD Coin'}
                    </div>
                    <div className="admin-balance-section">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>{parseFloat(contractBalances[selectedToken]).toFixed(2)} {selectedToken}</span>
                    </div>
                  </div>
                </div>

                <div className="admin-withdraw-buttons">
                  <button 
                    className="admin-withdraw-btn"
                    onClick={handleWithdraw}
                    disabled={loading || !withdrawAmount}
                  >
                    {loading ? 'Обработка...' : 'Вывести'}
                  </button>
                  
                  <button 
                    className="admin-withdraw-all-btn"
                    onClick={handleWithdrawAll}
                    disabled={loading}
                  >
                    {loading ? 'Обработка...' : 'Вывести все'}
                  </button>
                </div>
              </div>
            )}

            {!contract && isConnected && (
              <div className="admin-error-section">
                <div className="admin-error-content">
                  <div className="admin-error-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" style={{ color: '#ef4444' }}>
                      <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h3>Нет доступа</h3>
                  <p>Вы не являетесь владельцем контракта или контракт не найден</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast.show && (
        <div className="toast-overlay">
          <div className={`toast ${toast.type}`}>
            <div className="toast-icon">
              {toast.type === 'error' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <div className="toast-content">
              <div className="toast-title">
                {toast.type === 'error' ? 'Ошибка' : 'Успех'}
              </div>
              <div className="toast-message">{toast.message}</div>
            </div>
            <button 
              className="toast-close"
              onClick={() => setToast({ show: false, message: '', type: 'error' })}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Token Selector Modal */}
      {showTokenSelector && (
        <div className="token-modal-overlay" onClick={() => setShowTokenSelector(false)}>
          <div className="token-modal" onClick={(e) => e.stopPropagation()}>
            <div className="token-modal-header">
              <h3>Выберите токен</h3>
              <button onClick={() => setShowTokenSelector(false)}>×</button>
            </div>
            <div className="token-list">
              {tokens.map((token) => (
                <div
                  key={token.symbol}
                  className="token-option"
                  onClick={() => handleTokenSelect(token)}
                >
                  <div className="token-icon">
                    <img 
                      src={token.icon} 
                      alt={token.symbol}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                        e.target.nextSibling.style.display = 'none';
                      }}
                    />
                    <div style={{ 
                      display: 'none', 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      background: token.color, 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: 'white', 
                      fontSize: '12px', 
                      fontWeight: 'bold',
                      boxShadow: `0 0 0 2px ${token.color}20`
                    }}>
                      {token.symbol.charAt(0)}
                    </div>
                  </div>
                  <div className="token-info">
                    <div className="token-symbol">{token.symbol}</div>
                    <div className="token-name">{token.name}</div>
                    <div className="token-balance">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginRight: '4px' }}>
                        <path d="M3 10h18M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M8 14h.01M12 14h.01M16 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {parseFloat(contractBalances[token.symbol]).toFixed(2)} {token.symbol}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
