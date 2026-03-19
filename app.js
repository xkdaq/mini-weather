// app.js - 生活工具箱小程序全局入口
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })

    // 初始化记账数据
    this.loadBookkeepingData();
  },

  // 全局数据
  globalData: {
    // 天气相关
    amapKey: "b732a0461f7ca8d9a8691e2124b3c287",
    qweatherKey: "e4493b32e3eb4d1bbac9a5d478926f28",

    // 记账相关
    users: [],
    transactions: [],
    avatarColors: [
      '#FF6B35', '#1890FF', '#52C41A', '#722ED1', '#F7931E', '#EB2F96'
    ]
  },

  // 加载记账数据
  loadBookkeepingData() {
    const users = wx.getStorageSync('bt_users') || [];
    const transactions = wx.getStorageSync('bt_transactions') || [];
    this.globalData.users = users;
    this.globalData.transactions = transactions;
  },

  // 刷新记账数据
  refreshBookkeepingData() {
    this.loadBookkeepingData();
  },

  // 生成唯一ID
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // 获取格式化日期
  getFormattedDate(date) {
    const d = date ? new Date(date) : new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 获取月份第一天
  getMonthStart(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  },

  // 获取月份最后一天
  getMonthEnd(date = new Date()) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
});
