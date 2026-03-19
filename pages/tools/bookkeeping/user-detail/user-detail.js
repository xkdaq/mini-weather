// pages/tools/bookkeeping/user-detail/user-detail.js - 用户详情页
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');
const billGenerator = require('../../../../utils/bill-generator.js');

Page({
  data: {
    user: null,
    balance: 0,
    stats: {},
    transactions: [],
    showBillModal: false,
    billContent: ''
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ userId: options.id });
      this.loadUserData(options.id);
    }
  },

  onShow() {
    if (this.data.userId) {
      this.loadUserData(this.data.userId);
    }
  },

  loadUserData(userId) {
    const users = storage.getUsers();
    const transactions = storage.getTransactions();

    const user = users.find(u => u.id === userId);

    if (!user) {
      wx.showToast({
        title: '用户不存在',
        icon: 'none'
      });
      wx.navigateBack();
      return;
    }

    // 计算余额
    const balance = calculator.calcBalance(userId, transactions);
    const absBalance = Math.abs(balance);
    const balanceDisplay = balance < 0 ? `-¥${absBalance}` : `¥${absBalance}`;

    // 统计信息
    const stats = calculator.getUserStats(userId, transactions);

    // 该用户的流水
    const userTransactions = transactions
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    this.setData({
      user,
      balance,
      balanceDisplay,
      stats,
      transactions: userTransactions
    });
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 快速记账
  quickRecord(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/record/record?type=${type}&userId=${this.data.userId}`
    });
  },

  // 生成账单
  generateBill() {
    const { user, transactions } = this.data;

    // 获取本月日期范围
    const { startDate, endDate } = billGenerator.getCurrentMonthRange();

    // 生成账单
    const bill = billGenerator.generateBill(user, transactions, startDate, endDate);

    this.setData({
      showBillModal: true,
      billContent: bill.message,
      billData: bill
    });
  },

  // 复制账单
  copyBill() {
    wx.setClipboardData({
      data: this.data.billContent,
      success: () => {
        wx.showToast({
          title: '已复制，去粘贴给TA吧 🥐',
          icon: 'success',
          duration: 2000
        });
        this.closeBillModal();
      }
    });
  },

  // 关闭账单弹窗
  closeBillModal() {
    this.setData({ showBillModal: false });
  },

  // 删除流水
  deleteTransaction(e) {
    const index = e.currentTarget.dataset.index;
    const transaction = this.data.transactions[index];
    const typeText = transaction.type === 'expense' ? '支出' : '收款';
    const amountText = `¥${transaction.amount}`;

    wx.showModal({
      title: '确认删除',
      content: `确定删除 "${typeText} ${amountText}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const success = storage.deleteTransaction(transaction.id);
          if (success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadUserData(this.data.userId);
          }
        }
      }
    });
  },

  // 跳转到记账编辑
  editTransaction(e) {
    const transactionId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/record/record?edit=1&transactionId=${transactionId}`
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
