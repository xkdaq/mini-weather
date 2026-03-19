// utils/bill-generator.js - 账单文案生成

/**
 * 生成账单文案
 * @param {Object} user - 用户对象
 * @param {Array} transactions - 流水数组
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Object} 账单信息
 */
function generateBill(user, transactions, startDate, endDate) {
  // 筛选指定时间段的流水
  const filtered = transactions.filter(t => {
    if (t.user_id !== user.id) return false;
    const txDate = t.date;
    return txDate >= startDate && txDate <= endDate;
  });

  // 支出记录
  const expenses = filtered.filter(t => t.type === 'expense');
  const expenseCount = expenses.length;
  const expenseTotal = expenses.reduce((sum, t) => sum + t.amount, 0);

  // 收款记录
  const incomes = filtered.filter(t => t.type === 'income');
  const incomeTotal = incomes.reduce((sum, t) => sum + t.amount, 0);

  // 计算欠款
  const owed = expenseTotal - incomeTotal;

  // 格式化日期
  const start = formatDateCN(startDate);
  const end = formatDateCN(endDate);

  // 生成文案
  let message = '';
  if (owed > 0) {
    message = `${user.name}，本期共帮你带早餐 ${expenseCount} 次，合计 ¥${expenseTotal.toFixed(1)}，` +
      `已收 ¥${incomeTotal.toFixed(1)}，还差 ¥${owed.toFixed(1)}，麻烦转一下～`;
  } else if (owed < 0) {
    message = `${user.name}，本期共帮你带早餐 ${expenseCount} 次，合计 ¥${expenseTotal.toFixed(1)}，` +
      `已收 ¥${incomeTotal.toFixed(1)}，多付了 ¥${Math.abs(owed).toFixed(1)}，下次抵扣～`;
  } else {
    message = `${user.name}，本期共帮你带早餐 ${expenseCount} 次，合计 ¥${expenseTotal.toFixed(1)}，` +
      `已收 ¥${incomeTotal.toFixed(1)}，刚好结清～`;
  }

  return {
    userId: user.id,
    userName: user.name,
    period: `${start} - ${end}`,
    expenseCount,
    expenseTotal: parseFloat(expenseTotal.toFixed(1)),
    incomeTotal: parseFloat(incomeTotal.toFixed(1)),
    owed: parseFloat(owed.toFixed(1)),
    message,
    expenseDetails: expenses,
    incomeDetails: incomes
  };
}

/**
 * 简化版账单文案（不带日期范围）
 * @param {Object} user - 用户对象
 * @param {Array} transactions - 流水数组
 * @returns {string} 账单文案
 */
function generateSimpleBill(user, transactions) {
  const userTxs = transactions.filter(t => t.user_id === user.id);

  if (userTxs.length === 0) {
    return `${user.name}，你还没有任何代购记录哦～`;
  }

  // 按日期倒序，获取最近一笔交易
  const sorted = [...userTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const lastTx = sorted[0];

  // 统计总支出和总收款
  const expenseTotal = userTxs
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  const incomeTotal = userTxs
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = incomeTotal - expenseTotal;

  if (balance < 0) {
    return `${user.name}，你当前欠我 ¥${Math.abs(balance).toFixed(1)}，` +
      `方便时转一下吧～`;
  } else if (balance > 0) {
    return `${user.name}，你还有 ¥${balance.toFixed(1)} 余额，下次带早餐抵扣～`;
  } else {
    return `${user.name}，我们刚好结清啦！`;
  }
}

/**
 * 格式化日期为中文
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {string} 中文日期
 */
function formatDateCN(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}月${day}日`;
}

/**
 * 格式化日期为简短格式
 * @param {string} dateStr - 日期字符串 YYYY-MM-DD
 * @returns {string} 简短日期
 */
function formatDateShort(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}-${day}`;
}

/**
 * 获取本月的日期范围
 * @returns {Object} {startDate, endDate}
 */
function getCurrentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return {
    startDate: formatDateISO(start),
    endDate: formatDateISO(end)
  };
}

/**
 * 获取上月的日期范围
 * @returns {Object} {startDate, endDate}
 */
function getLastMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: formatDateISO(start),
    endDate: formatDateISO(end)
  };
}

/**
 * 格式化日期为 ISO 字符串
 * @param {Date} date
 * @returns {string} YYYY-MM-DD
 */
function formatDateISO(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = {
  generateBill,
  generateSimpleBill,
  formatDateCN,
  formatDateShort,
  getCurrentMonthRange,
  getLastMonthRange,
  formatDateISO
};
