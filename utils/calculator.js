// utils/calculator.js - 余额计算逻辑

/**
 * 计算单个用户的余额
 * 余额 = 累计收款 - 累计支出
 * 负数 = 欠我钱，正数 = 多付了
 * @param {string} userId - 用户ID
 * @param {Array} transactions - 流水数组
 * @returns {number} 余额
 */
function calcBalance(userId, transactions) {
  if (!transactions || transactions.length === 0) return 0;

  const userTxs = transactions.filter(t => t.user_id === userId);

  // 使用整数分计算，避免浮点误差
  let balanceCents = 0;

  userTxs.forEach(t => {
    const amountCents = Math.round(t.amount * 100);
    if (t.type === 'income') {
      // 收款增加余额
      balanceCents += amountCents;
    } else {
      // 支出减少余额
      balanceCents -= amountCents;
    }
  });

  return balanceCents / 100;
}

/**
 * 计算所有用户的总欠款
 * 只计算余额为负的用户（欠我钱的）
 * @param {Array} users - 用户数组
 * @param {Array} transactions - 流水数组
 * @returns {number} 总欠款金额
 */
function calcTotalOwed(users, transactions) {
  if (!users || users.length === 0 || !transactions || transactions.length === 0) {
    return 0;
  }

  let totalOwed = 0;

  users.forEach(user => {
    if (user.status === 'active') {
      const balance = calcBalance(user.id, transactions);
      if (balance < 0) {
        totalOwed += Math.abs(balance);
      }
    }
  });

  return Math.round(totalOwed * 10) / 10; // 保留一位小数
}

/**
 * 计算指定时间段的支出
 * @param {Array} transactions - 流水数组
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {number} 支出总额
 */
function calcPeriodExpense(transactions, startDate, endDate) {
  if (!transactions || transactions.length === 0) return 0;

  const start = new Date(startDate).setHours(0, 0, 0, 0);
  const end = new Date(endDate).setHours(23, 59, 59, 999);

  return transactions
    .filter(t => {
      const txDate = new Date(t.date).getTime();
      return t.type === 'expense' && txDate >= start && txDate <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * 计算指定时间段的收款
 * @param {Array} transactions - 流水数组
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {number} 收款总额
 */
function calcPeriodIncome(transactions, startDate, endDate) {
  if (!transactions || transactions.length === 0) return 0;

  const start = new Date(startDate).setHours(0, 0, 0, 0);
  const end = new Date(endDate).setHours(23, 59, 59, 999);

  return transactions
    .filter(t => {
      const txDate = new Date(t.date).getTime();
      return t.type === 'income' && txDate >= start && txDate <= end;
    })
    .reduce((sum, t) => sum + t.amount, 0);
}

/**
 * 获取用户的交易统计
 * @param {string} userId - 用户ID
 * @param {Array} transactions - 流水数组
 * @returns {Object} 统计数据
 */
function getUserStats(userId, transactions) {
  if (!transactions || transactions.length === 0) {
    return {
      expenseCount: 0,
      expenseTotal: 0,
      incomeCount: 0,
      incomeTotal: 0,
      balance: 0
    };
  }

  const userTxs = transactions.filter(t => t.user_id === userId);
  const expenses = userTxs.filter(t => t.type === 'expense');
  const incomes = userTxs.filter(t => t.type === 'income');

  return {
    expenseCount: expenses.length,
    expenseTotal: expenses.reduce((sum, t) => sum + t.amount, 0),
    incomeCount: incomes.length,
    incomeTotal: incomes.reduce((sum, t) => sum + t.amount, 0),
    balance: calcBalance(userId, transactions)
  };
}

/**
 * 按用户分组计算欠款
 * @param {Array} users - 用户数组
 * @param {Array} transactions - 流水数组
 * @returns {Array} 用户欠款数组 [{userId, userName, balance, ...}]
 */
function calcUserDebts(users, transactions) {
  if (!users || users.length === 0) return [];

  return users
    .filter(u => u.status === 'active')
    .map(user => {
      const balance = calcBalance(user.id, transactions);
      return {
        userId: user.id,
        userName: user.name,
        avatarColor: user.avatar_color,
        balance: balance,
        debt: balance < 0 ? Math.abs(balance) : 0
      };
    })
    .filter(u => u.debt > 0)
    .sort((a, b) => b.debt - a.debt); // 按欠款金额降序
}

/**
 * 获取本月开始日期
 */
function getMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * 获取上月开始日期
 */
function getLastMonthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() - 1, 1);
}

/**
 * 获取上月结束日期
 */
function getLastMonthEnd(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 0);
}

/**
 * 获取近N个月开始日期
 */
function getLastNMonthsStart(date = new Date(), n = 3) {
  return new Date(date.getFullYear(), date.getMonth() - n + 1, 1);
}

module.exports = {
  calcBalance,
  calcTotalOwed,
  calcPeriodExpense,
  calcPeriodIncome,
  getUserStats,
  calcUserDebts,
  getMonthStart,
  getLastMonthStart,
  getLastMonthEnd,
  getLastNMonthsStart
};
