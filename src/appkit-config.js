import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { mainnet } from '@reown/appkit/networks'

// 1. Get projectId from https://dashboard.reown.com
// ЗАМІНІТЬ НА НОВИЙ PROJECT ID з дашборду!
const projectId = '2ac4c10375d31642363f4e551e6d54a7' // ← ЗАМІНІТЬ НА НОВИЙ!

// 2. Create a metadata object
const metadata = {
  name: 'DeFi Exchange',
  description: 'Decentralized Exchange Platform',
  url: window.location.origin,
  icons: ['/logo-png/logo.png']
}

// 3. Set the networks (only Ethereum mainnet)
const networks = [mainnet]

// 4. Create Ethers Adapter
const ethersAdapter = new EthersAdapter({
  networks,
  projectId,
  ssr: false,
  enableNetworkSwitching: false, // Disable network switching
  enableEmail: false,
  enableSocials: false,
  enableOnramp: false,
  enableAnalytics: false,
  // Тимчасово відключаємо перевірку доменів для розробки
  disableInjectedProvider: false,
  // Додаткові налаштування для обходу WebSocket помилок
  enableNetworkView: false,
  enableAccountView: true,
  enableExplorer: true
})

// 5. Create modal
createAppKit({
  adapters: [ethersAdapter],
  networks,
  projectId,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#ff6b35',
    '--w3m-accent-fill-color': '#ffffff',
    '--w3m-background-color': '#1a1a1a',
    '--w3m-container-border-radius': '12px',
    '--w3m-wallet-icon-border-radius': '8px',
    '--w3m-wallet-icon-large-border-radius': '12px',
    '--w3m-input-border-radius': '8px',
    '--w3m-button-border-radius': '8px',
    '--w3m-notification-border-radius': '8px',
    '--w3m-icon-button-border-radius': '8px',
    '--w3m-secondary-button-border-radius': '8px',
    
    /* ШРИФТИ ДЛЯ REOWN APPKIT */
    '--w3m-font-family': 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    '--w3m-font-size-1': '12px',
    '--w3m-font-size-2': '14px',
    '--w3m-font-size-3': '16px',
    '--w3m-font-size-4': '18px',
    '--w3m-font-size-5': '20px',
    '--w3m-font-size-6': '24px',
    '--w3m-font-size-7': '28px',
    '--w3m-font-size-8': '32px',
    '--w3m-font-size-9': '36px',
    '--w3m-font-size-10': '40px',
    
    /* ЗАГОЛОВКИ */
    '--w3m-font-size-h1': '24px',
    '--w3m-font-size-h2': '20px',
    '--w3m-font-size-h3': '18px',
    '--w3m-font-size-h4': '16px',
    '--w3m-font-size-h5': '14px',
    '--w3m-font-size-h6': '12px',
    
    /* ВАГА ШРИФТІВ */
    '--w3m-font-weight-1': '300',
    '--w3m-font-weight-2': '400',
    '--w3m-font-weight-3': '500',
    '--w3m-font-weight-4': '600',
    '--w3m-font-weight-5': '700',
    '--w3m-font-weight-6': '800',
    '--w3m-font-weight-7': '900',
    
    /* ВИСОТА РЯДКІВ */
    '--w3m-line-height-1': '1.2',
    '--w3m-line-height-2': '1.3',
    '--w3m-line-height-3': '1.4',
    '--w3m-line-height-4': '1.5',
    '--w3m-line-height-5': '1.6',
    
    /* МІЖСИМВОЛЬНІ ВІДСТУПИ */
    '--w3m-letter-spacing-1': '-0.02em',
    '--w3m-letter-spacing-2': '-0.01em',
    '--w3m-letter-spacing-3': '0',
    '--w3m-letter-spacing-4': '0.01em',
    '--w3m-letter-spacing-5': '0.02em'
  },
  // Force Ethereum mainnet only
  defaultNetwork: mainnet,
  enableNetworkView: false, // Disable network selection
  enableAccountView: true,
  enableExplorer: true,
  // Mobile settings
  enableNetworkSwitching: false,
  enableAccountView: true,
  // Allow all domains
  enableAnalytics: false,
  enableOnramp: false,
  // Mobile optimizations
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
    '19177a98252e07ddfc9af2083ba8e07f6273a63e', // WalletConnect
    '8a0ee50d1f22f6651afcae7eb4263e8db0b8c713'  // Safe
  ],
  mobileWallets: [
    {
      id: 'metamask',
      name: 'MetaMask',
      links: {
        native: 'metamask://',
        universal: 'https://metamask.app.link'
      }
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      links: {
        native: 'trust://',
        universal: 'https://link.trustwallet.com'
      }
    },
    {
      id: 'rainbow',
      name: 'Rainbow',
      links: {
        native: 'rainbow://',
        universal: 'https://rainbow.app'
      }
    }
  ],
  // Allow all origins
  enableEmail: false,
  enableSocials: false,
  enableOnramp: false,
  enableAnalytics: false,
  // Додаткові налаштування для обходу перевірки доменів
  enableNetworkView: false,
  enableAccountView: true,
  enableExplorer: true,
  // Відключаємо перевірку доменів для розробки
  disableInjectedProvider: false,
  // Мобільні налаштування
  enableNetworkSwitching: false,
  enableAccountView: true,
  enableExplorer: true,
  // Додаткові налаштування для мобільних пристроїв
  mobileOptimizations: {
    enableMobileWalletConnect: true,
    enableMobileQRCode: true,
    enableMobileDeepLinking: true
  },
  
  // ДОДАТКОВІ НАЛАШТУВАННЯ ШРИФТІВ
  customFonts: {
    primary: 'Inter',
    secondary: 'Orbitron',
    fallback: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  
  // ТИПОГРАФІЯ
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '28px',
      '4xl': '32px'
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
      black: '900'
    },
    lineHeight: {
      tight: '1.2',
      normal: '1.4',
      relaxed: '1.6'
    }
  }
})

export { projectId, ethersAdapter }
