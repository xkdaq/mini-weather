// pages/tools/bookkeeping/statistics/statistics.js - 统计页面
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');

Page({
  data: {
    currentPeriod: 'thisMonth',  // thisMonth, lastMonth, last3Months
    periods: ['本月', '上月', '近3月'],
    periodIndex: 0,

    // 汇总数据
    totalExpense: 0,
    totalIncome: 0,
    totalOwed: 0,

    // 用户欠款数据
    userDebts: [],

    // 每日支出趋势
    dailyExpenses: []
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const { currentPeriod } = this.data;
    const transactions = storage.getTransactions();
    const users = storage.getUsers();

    // 获取时间段
    const { startDate, endDate } = this.getPeriodRange(currentPeriod);

    // 筛选时间段内的流水
    const periodTransactions = transactions.filter(t => {
      const txDate = t.date;
      return txDate >= startDate && txDate <= endDate;
    });

    // 计算总支出
    const totalExpense = periodTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    // 计算总收款
    const totalIncome = periodTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    // 计算总欠款
    const totalOwed = calculator.calcTotalOwed(users, transactions);

    // 用户欠款
    const userDebts = calculator.calcUserDebts(users, periodTransactions);

    // 每日支出趋势
    const dailyExpenses = this.calcDailyExpenses(periodTransactions, startDate, endDate);

    this.setData({
      totalExpense,
      totalIncome,
      totalOwed,
      userDebts,
      dailyExpenses
    });
  },

  // 获取时间段范围
  getPeriodRange(period) {
    const now = new Date();
    let startDate, endDate;

    endDate = now.toISOString().split('T')[0];

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString().split('T')[0];
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          .toISOString().split('T')[0];
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
          .toISOString().split('T')[0];
        break;
      case 'last3Months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          .toISOString().split('T')[0];
        break;
    }

    return { startDate, endDate };
  },

  // 切换时间段
  switchPeriod(e) {
    const index = e.currentTarget.dataset.index;
    const periods = ['thisMonth', 'lastMonth', 'last3Months'];

    this.setData({
      periodIndex: index,
      currentPeriod: periods[index]
    });

    this.loadData();
  },

  // 计算每日支出
  calcDailyExpenses(transactions, startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // 创建日期到金额的映射
    const expenseMap = {};

    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const date = t.date;
        expenseMap[date] = (expenseMap[date] || 0) + t.amount;
      });

    // 生成每日数据
    const daily = [];
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    let current = new Date(start);

    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const dayName = dayNames[current.getDay()];
      const amount = expenseMap[dateStr] || 0;

      daily.push({
        date: dateStr,
        day: dayName,
        amount: parseFloat(amount.toFixed(1))
      });

      current.setDate(current.getDate() + 1);
    }

    return daily;
  },

  // 获取最大欠款金额（用于计算条形图宽度）
  getMaxDebt() {
    const { userDebts } = this.data;
    if (userDebts.length === 0) return 0;
    return Math.max(...userDebts.map(u => u.debt));
  },

  // 格式化金额
  formatAmount(amount) {
    return amount.toFixed(1);
  },

  // 获取最大每日支出（用于计算条形图高度）
  getMaxDailyExpense() {
    const { dailyExpenses } = this.data;
    if (!dailyExpenses || dailyExpenses.length === 0) return 1;
    const max = Math.max(...dailyExpenses.map(d => d.amount));
    return max > 0 ? max : 1;
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
