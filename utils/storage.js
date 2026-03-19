// utils/storage.js - 本地存储工具层

const STORAGE_KEYS = {
  USERS: 'bt_users',
  TRANSACTIONS: 'bt_transactions',
  SETTINGS: 'bt_settings'
};

/**
 * 获取用户列表
 */
function getUsers() {
  try {
    const data = wx.getStorageSync(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('获取用户列表失败:', e);
    return [];
  }
}

/**
 * 保存用户列表
 */
function saveUsers(users) {
  try {
    wx.setStorageSync(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  } catch (e) {
    console.error('保存用户列表失败:', e);
    return false;
  }
}

/**
 * 获取流水列表
 */
function getTransactions() {
  try {
    const data = wx.getStorageSync(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('获取流水列表失败:', e);
    return [];
  }
}

/**
 * 保存流水列表
 */
function saveTransactions(transactions) {
  try {
    wx.setStorageSync(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    return true;
  } catch (e) {
    console.error('保存流水列表失败:', e);
    return false;
  }
}

/**
 * 添加用户
 */
function addUser(user) {
  const users = getUsers();
  users.push(user);
  return saveUsers(users);
}

/**
 * 更新用户
 */
function updateUser(userId, updates) {
  const users = getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    return saveUsers(users);
  }
  return false;
}

/**
 * 删除用户
 */
function deleteUser(userId) {
  const users = getUsers();
  const filtered = users.filter(u => u.id !== userId);
  return saveUsers(filtered);
}

/**
 * 添加流水
 */
function addTransaction(transaction) {
  const transactions = getTransactions();
  transactions.push(transaction);
  return saveTransactions(transactions);
}

/**
 * 更新流水
 */
function updateTransaction(transactionId, updates) {
  const transactions = getTransactions();
  const index = transactions.findIndex(t => t.id === transactionId);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updates };
    return saveTransactions(transactions);
  }
  return false;
}

/**
 * 删除流水
 */
function deleteTransaction(transactionId) {
  const transactions = getTransactions();
  const filtered = transactions.filter(t => t.id !== transactionId);
  return saveTransactions(filtered);
}

/**
 * 获取设置
 */
function getSettings() {
  try {
    const data = wx.getStorageSync(STORAGE_KEYS.SETTINGS);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

/**
 * 保存设置
 */
function saveSettings(settings) {
  try {
    wx.setStorageSync(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 清除所有数据
 */
function clearAll() {
  try {
    wx.removeStorageSync(STORAGE_KEYS.USERS);
    wx.removeStorageSync(STORAGE_KEYS.TRANSACTIONS);
    wx.removeStorageSync(STORAGE_KEYS.SETTINGS);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  STORAGE_KEYS,
  getUsers,
  saveUsers,
  getTransactions,
  saveTransactions,
  addUser,
  updateUser,
  deleteUser,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getSettings,
  saveSettings,
  clearAll
};
