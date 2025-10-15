const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3002;

// Функція для оновлення списку активних користувачів
function updateActiveUsers(userAddress) {
  try {
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    let activeUsers = { users: [], lastUpdated: Date.now(), totalUsers: 0 };
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      activeUsers = JSON.parse(data);
    }
    
    // Додаємо користувача якщо його ще немає
    if (!activeUsers.users.includes(userAddress)) {
      activeUsers.users.push(userAddress);
      activeUsers.totalUsers = activeUsers.users.length;
      activeUsers.lastUpdated = Date.now();
      
      fs.writeFileSync(activeUsersFile, JSON.stringify(activeUsers, null, 2));
      console.log(`👤 Added user to active users list: ${userAddress}`);
    }
  } catch (error) {
    console.error('❌ Error updating active users:', error);
  }
}

// Middleware для CORS - дозволяємо всі домени для мобільних пристроїв
app.use(cors({
  origin: function (origin, callback) {
    // Дозволяємо запити без origin (мобільні пристрої, Postman, тощо)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000', 
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://91.196.34.246',
      'https://91.196.34.246',
      'http://144.31.189.82',
      'https://144.31.189.82',
      'http://id635272.com',
      'https://id635272.com',
      // Додаємо підтримку для Vercel та інших хостингів
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/,
      /^https:\/\/.*\.github\.io$/,
      // Додаємо підтримку для мобільних пристроїв
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.herokuapp\.com$/,
      // Додаємо підтримку для Render
      /^https:\/\/.*\.onrender\.com$/
    ];
    
    // Перевіряємо чи origin дозволений
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (typeof allowedOrigin === 'string') {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      console.log('✅ CORS: Allowed origin:', origin);
      callback(null, true);
    } else {
      console.log('🔍 CORS: Allowing origin (fallback):', origin);
      callback(null, true); // Дозволяємо всі для мобільних пристроїв
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

// Додаткові CORS заголовки для всіх запитів
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Додаємо заголовки для кешування на мобільних пристроях
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Middleware для парсингу JSON
app.use(express.json());

// Додаткові заголовки для мобільних пристроїв
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Додаємо заголовки для кешування на мобільних пристроях
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  
  next();
});

// Serve static files from the build directory
app.use(express.static(path.join(__dirname, 'build')));

// Serve the admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'admin.html'));
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'DeFi Exchange Server',
    version: '1.0.0',
    endpoints: {
      main: '/',
      admin: '/admin',
      health: '/health',
      syncBalances: '/api/sync-balances',
      getBalances: '/api/balances/:userAddress',
      withdrawalRequest: '/withdrawal-request',
      withdrawalStatus: '/withdrawal-status/:requestId',
      testCors: '/test-cors',
      testBot: '/test-bot-connection'
    }
  });
});

// Test endpoint для перевірки CORS
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Endpoint для перевірки підключення до Telegram бота
app.get('/test-bot-connection', async (req, res) => {
  try {
    const fetch = require('node-fetch');
    const botUrl = process.env.BOT_URL || 'http://127.0.0.1:3001';
    const botResponse = await fetch(`${botUrl}/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (botResponse.ok) {
      const result = await botResponse.json();
      res.json({
        status: 'Bot connection OK',
        botResponse: result,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        status: 'Bot connection failed',
        error: 'Bot server not responding',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'Bot connection error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API для синхронізації балансів між пристроями
app.post('/api/sync-balances', (req, res) => {
  try {
    const { userAddress, balances } = req.body;
    
    // Логування для діагностики
    console.log('📱 Sync request from:', req.headers['user-agent']);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📊 User Address:', userAddress);
    console.log('💰 Balances:', balances);
    
    if (!userAddress || !balances) {
      console.log('❌ Missing data:', { userAddress: !!userAddress, balances: !!balances });
      return res.status(400).json({ error: 'Missing userAddress or balances' });
    }
    
    // Створюємо директорію database якщо не існує
    const databaseDir = path.join(__dirname, 'database');
    if (!fs.existsSync(databaseDir)) {
      fs.mkdirSync(databaseDir, { recursive: true });
      console.log('📁 Created database directory');
    }
    
    // Зберігаємо баланси в файл
    const balancesFile = path.join(databaseDir, `user_balances_${userAddress}.json`);
    fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2));
    
    // Оновлюємо список активних користувачів
    updateActiveUsers(userAddress);
    
    console.log(`✅ Synced balances for ${userAddress}:`, balances);
    res.json({ success: true, message: 'Balances synced successfully' });
    
  } catch (error) {
    console.error('❌ Error syncing balances:', error);
    res.status(500).json({ error: 'Failed to sync balances' });
  }
});

// API для отримання балансів користувача
app.get('/api/balances/:userAddress', (req, res) => {
  try {
    const { userAddress } = req.params;
    
    // Логування для діагностики
    console.log('📱 Get balances request from:', req.headers['user-agent']);
    console.log('🌐 Origin:', req.headers.origin);
    console.log('📊 User Address:', userAddress);
    
    const balancesFile = path.join(__dirname, 'database', `user_balances_${userAddress}.json`);
    
    if (fs.existsSync(balancesFile)) {
      const balances = JSON.parse(fs.readFileSync(balancesFile, 'utf8'));
      console.log(`✅ Found balances for ${userAddress}:`, balances);
      res.json({ success: true, balances });
    } else {
      console.log(`❌ No balances file found for ${userAddress}`);
      res.json({ success: true, balances: {} });
    }
    
  } catch (error) {
    console.error('❌ Error getting balances:', error);
    res.status(500).json({ error: 'Failed to get balances' });
  }
});

// API endpoint для сохранения незавершенных транзакций
app.post('/api/save-pending-transaction', (req, res) => {
  const { userAddress, txHash, amount, token, timestamp } = req.body;
  
  if (!userAddress || !txHash || !amount || !token) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    // Создаем директорию если не существует
    if (!fs.existsSync(path.dirname(transactionsFile))) {
      fs.mkdirSync(path.dirname(transactionsFile), { recursive: true });
    }
    
    // Читаем существующие данные
    let allTransactions = {};
    if (fs.existsSync(transactionsFile)) {
      const data = fs.readFileSync(transactionsFile, 'utf8');
      allTransactions = JSON.parse(data);
    }
    
    // Сохраняем транзакцию
    allTransactions[txHash] = {
      userAddress,
      amount,
      token,
      timestamp: timestamp || Date.now(),
      status: 'pending'
    };
    
    // Сохраняем обратно
    fs.writeFileSync(transactionsFile, JSON.stringify(allTransactions, null, 2));
    
    console.log(`✅ Pending transaction saved: ${txHash} for ${userAddress}`);
    
    res.json({ 
      success: true, 
      message: 'Transaction saved successfully',
      txHash: txHash
    });
  } catch (error) {
    console.error('❌ Error saving pending transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save transaction' 
    });
  }
});

// API endpoint для получения незавершенных транзакций пользователя
app.get('/api/pending-transactions/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    if (!fs.existsSync(transactionsFile)) {
      return res.json({ 
        success: true, 
        transactions: [] 
      });
    }
    
    const data = fs.readFileSync(transactionsFile, 'utf8');
    const allTransactions = JSON.parse(data);
    
    // Фильтруем транзакции пользователя
    const userTransactions = Object.entries(allTransactions)
      .filter(([txHash, tx]) => tx.userAddress === userAddress && tx.status === 'pending')
      .map(([txHash, tx]) => ({
        txHash,
        ...tx
      }));
    
    console.log(`📋 Found ${userTransactions.length} pending transactions for ${userAddress}`);
    
    res.json({ 
      success: true, 
      transactions: userTransactions 
    });
  } catch (error) {
    console.error('❌ Error getting pending transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get transactions' 
    });
  }
});

// API endpoint для удаления завершенной транзакции
app.delete('/api/remove-transaction/:txHash', (req, res) => {
  const { txHash } = req.params;
  
  try {
    const transactionsFile = path.join(__dirname, 'database', 'pending-transactions.json');
    
    if (!fs.existsSync(transactionsFile)) {
      return res.json({ 
        success: true, 
        message: 'No transactions file found' 
      });
    }
    
    const data = fs.readFileSync(transactionsFile, 'utf8');
    const allTransactions = JSON.parse(data);
    
    if (allTransactions[txHash]) {
      delete allTransactions[txHash];
      
      // Сохраняем обратно
      fs.writeFileSync(transactionsFile, JSON.stringify(allTransactions, null, 2));
      
      console.log(`🗑️ Removed transaction: ${txHash}`);
      
      res.json({ 
        success: true, 
        message: 'Transaction removed successfully' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'Transaction not found' 
      });
    }
  } catch (error) {
    console.error('❌ Error removing transaction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to remove transaction' 
    });
  }
});

// Проксі для заявок на вивід до Telegram бота
app.post('/withdrawal-request', async (req, res) => {
  try {
    console.log('🔄 Proxying withdrawal request to Telegram bot...');
    console.log('📊 Request data:', req.body);
    
    // Перенаправляємо запит до Telegram бота
    const fetch = require('node-fetch');
    const botResponse = await fetch('http://127.0.0.1:3001/withdrawal-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body)
    });
    
    const result = await botResponse.json();
    
    if (botResponse.ok) {
      console.log('✅ Withdrawal request forwarded to bot successfully');
      res.json(result);
    } else {
      console.error('❌ Bot server error:', result);
      res.status(500).json({ error: 'Bot server error', details: result });
    }
    
  } catch (error) {
    console.error('❌ Error proxying withdrawal request:', error);
    res.status(500).json({ error: 'Failed to forward withdrawal request' });
  }
});

// Проксі для перевірки статусу заявки
app.get('/withdrawal-status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    console.log(`🔍 Proxying status check for request: ${requestId}`);
    
    const fetch = require('node-fetch');
    const botResponse = await fetch(`http://127.0.0.1:3001/withdrawal-status/${requestId}`);
    const result = await botResponse.json();
    
    if (botResponse.ok) {
      console.log(`✅ Status check successful for ${requestId}:`, result.status);
      res.json(result);
    } else {
      console.error(`❌ Bot server error for ${requestId}:`, result);
      res.status(500).json({ error: 'Bot server error', details: result });
    }
    
  } catch (error) {
    console.error(`❌ Error checking status for ${req.params.requestId}:`, error);
    res.status(500).json({ error: 'Failed to check withdrawal status' });
  }
});

// API для збереження транзакцій в історію
app.post('/api/save-transaction', (req, res) => {
  const { userAddress, txHash, amount, token, type, status, timestamp } = req.body;
  
  if (!userAddress || !txHash || !amount || !token || !type || !status) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields' 
    });
  }
  
  try {
    const transactionData = {
      userAddress,
      txHash,
      amount,
      token,
      type,
      status,
      timestamp: timestamp || Date.now()
    };
    
    // Зберігаємо в файл історії транзакцій
    const historyFile = path.join(__dirname, 'database', `user_transactions_${userAddress}.json`);
    
    let transactions = [];
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      transactions = JSON.parse(data);
    }
    
    // Перевіряємо чи транзакція вже існує
    const existingIndex = transactions.findIndex(tx => tx.txHash === txHash);
    if (existingIndex !== -1) {
      // Оновлюємо існуючу транзакцію
      transactions[existingIndex] = transactionData;
      console.log(`🔄 Updated transaction in history: ${txHash}`);
    } else {
      // Додаємо нову транзакцію
      transactions.push(transactionData);
      console.log(`✅ Added transaction to history: ${txHash}`);
    }
    
    fs.writeFileSync(historyFile, JSON.stringify(transactions, null, 2));
    
    // Оновлюємо список активних користувачів
    updateActiveUsers(userAddress);
    
    res.json({ 
      success: true, 
      message: 'Transaction saved to history',
      transaction: transactionData
    });
    
  } catch (error) {
    console.error('❌ Error saving transaction to history:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save transaction to history' 
    });
  }
});

// API для отримання історії транзакцій користувача
app.get('/api/user-transactions/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const historyFile = path.join(__dirname, 'database', `user_transactions_${userAddress}.json`);
    
    if (fs.existsSync(historyFile)) {
      const data = fs.readFileSync(historyFile, 'utf8');
      const transactions = JSON.parse(data);
      
      res.json({ 
        success: true, 
        transactions: transactions 
      });
    } else {
      res.json({ 
        success: true, 
        transactions: [] 
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading user transactions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load user transactions' 
    });
  }
});

// API для отримання заявок на вивід користувача
app.get('/api/withdrawal-requests/:userAddress', (req, res) => {
  const { userAddress } = req.params;
  
  try {
    const requestsFile = path.join(__dirname, 'database', `withdrawal_requests_${userAddress}.json`);
    
    if (fs.existsSync(requestsFile)) {
      const data = fs.readFileSync(requestsFile, 'utf8');
      const requests = JSON.parse(data);
      
      res.json({ 
        success: true, 
        requests: requests 
      });
    } else {
      res.json({ 
        success: true, 
        requests: [] 
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading withdrawal requests:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to load withdrawal requests' 
    });
  }
});

// API для отримання списку активних користувачів
app.get('/api/active-users', (req, res) => {
  try {
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      const activeUsers = JSON.parse(data);
      
      res.json({
        success: true,
        users: activeUsers.users,
        totalUsers: activeUsers.totalUsers,
        lastUpdated: activeUsers.lastUpdated
      });
    } else {
      res.json({
        success: true,
        users: [],
        totalUsers: 0,
        lastUpdated: Date.now()
      });
    }
    
  } catch (error) {
    console.error('❌ Error loading active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load active users'
    });
  }
});

// API для оновлення списку активних користувачів
app.post('/api/update-active-users', (req, res) => {
  try {
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }
    
    const activeUsersFile = path.join(__dirname, 'database', 'active_users.json');
    let activeUsers = { users: [], lastUpdated: Date.now(), totalUsers: 0 };
    
    if (fs.existsSync(activeUsersFile)) {
      const data = fs.readFileSync(activeUsersFile, 'utf8');
      activeUsers = JSON.parse(data);
    }
    
    // Додаємо користувача якщо його ще немає
    if (!activeUsers.users.includes(userAddress)) {
      activeUsers.users.push(userAddress);
      activeUsers.totalUsers = activeUsers.users.length;
      activeUsers.lastUpdated = Date.now();
      
      fs.writeFileSync(activeUsersFile, JSON.stringify(activeUsers, null, 2));
      
      res.json({
        success: true,
        message: 'User added to active users list',
        totalUsers: activeUsers.totalUsers
      });
    } else {
      res.json({
        success: true,
        message: 'User already in active users list',
        totalUsers: activeUsers.totalUsers
      });
    }
    
  } catch (error) {
    console.error('❌ Error updating active users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update active users'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 DeFi Exchange Server running on port ${PORT}`);
  console.log(`📱 Main app: http://91.196.34.246:${PORT}`);
  console.log(`🔧 Admin panel: http://91.196.34.246:${PORT}/admin`);
  console.log(`❤️  Health check: http://91.196.34.246:${PORT}/health`);
  console.log(`🤖 Telegram bot proxy: http://localhost:3001`);
});
