// pages/tools/bookkeeping/home/home.js - 记账首页逻辑
const app = getApp();
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');

Page({
  data: {
    totalOwed: 0,           // 总欠款
    monthExpense: 0,        // 本月支出
    monthIncome: 0,         // 本月收款
    users: [],              // 用户列表（包含余额）
    activeUsers: []         // 活跃用户
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    // 从存储获取数据
    const users = storage.getUsers();
    const transactions = storage.getTransactions();

    // 计算总欠款
    const totalOwed = calculator.calcTotalOwed(users, transactions);

    // 获取本月数据
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthTransactions = transactions.filter(t => new Date(t.date) >= monthStart);

    // 本月支出和收款
    const monthExpense = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const monthIncome = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 为每个用户计算余额
    const usersWithBalance = users.map(user => {
      const balance = calculator.calcBalance(user.id, transactions);
      const absBalance = Math.abs(balance);
      return {
        ...user,
        balance: balance,
        balanceDisplay: balance < 0 ? `-¥${absBalance}` : `¥${absBalance}`,
        lastTransaction: this.getLastTransaction(user.id, transactions)
      };
    }).sort((a, b) => a.status === 'paused' ? 1 : -1);

    // 活跃用户
    const activeUsers = usersWithBalance.filter(u => u.status === 'active');

    this.setData({
      totalOwed,
      monthExpense,
      monthIncome,
      users: usersWithBalance,
      activeUsers
    });
  },

  // 获取用户最后一笔交易
  getLastTransaction(userId, transactions) {
    const userTxs = transactions
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    if (userTxs.length === 0) return null;

    const last = userTxs[0];
    const dateStr = this.formatDate(last.date);
    const note = last.note ? ` · ${last.note}` : '';
    return `${dateStr}${note}`;
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 跳转到记账页
  goToRecord(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/record/record?type=${type}`
    });
  },

  // 跳转到流水页
  goToTransactions() {
    wx.navigateTo({
      url: '/pages/tools/bookkeeping/transactions/transactions'
    });
  },

  // 跳转到用户详情
  goToUserDetail(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/user-detail/user-detail?id=${userId}`
    });
  },

  // 跳转到添加用户
  goToAddUser() {
    wx.navigateTo({
      url: '/pages/tools/bookkeeping/users/users?action=add'
    });
  },

  // 格式化金额显示
  formatAmount(amount) {
    const absAmount = Math.abs(amount).toFixed(1);
    return amount < 0 ? `-¥${absAmount}` : `¥${absAmount}`;
  }
});
