// pages/tools/bookkeeping/transactions/transactions.js - 流水记录列表页
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');

Page({
  data: {
    transactions: [],         // 所有流水
    filteredTransactions: [], // 筛选后的流水
    users: [],                // 用户列表
    filterType: 'all',        // all, expense, income, 或 userId
    filterTabs: [],           // 筛选标签
    activeTab: 0              // 当前激活的标签索引
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  loadData() {
    const transactions = storage.getTransactions();
    const users = storage.getUsers();

    // 按日期倒序排列
    const sorted = [...transactions].sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // 生成筛选标签
    const filterTabs = ['全部', '支出', '收款'];
    users.forEach(u => {
      if (u.status === 'active') {
        filterTabs.push(u.name);
      }
    });

    this.setData({
      transactions: sorted,
      filteredTransactions: sorted,
      users,
      filterTabs
    });
  },

  // 切换筛选
  switchFilter(e) {
    const index = e.currentTarget.dataset.index;
    const type = e.currentTarget.dataset.type;

    this.setData({ activeTab: index, filterType: type });
    this.applyFilter();
  },

  // 应用筛选
  applyFilter() {
    const { transactions, filterType } = this.data;
    let filtered = transactions;

    if (filterType === 'expense') {
      filtered = transactions.filter(t => t.type === 'expense');
    } else if (filterType === 'income') {
      filtered = transactions.filter(t => t.type === 'income');
    } else if (filterType !== 'all') {
      // 按用户筛选
      const user = this.data.users.find(u => u.id === filterType || u.name === filterType);
      if (user) {
        filtered = transactions.filter(t => t.user_id === user.id);
      }
    }

    this.setData({ filteredTransactions: filtered });
  },

  // 获取用户名
  getUserName(userId) {
    const user = this.data.users.find(u => u.id === userId);
    return user ? user.name : '未知用户';
  },

  // 格式化日期
  formatDate(dateStr) {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}月${day}日`;
  },

  // 长按操作
  showActionSheet(e) {
    const index = e.currentTarget.dataset.index;
    const transaction = this.data.filteredTransactions[index];

    wx.showActionSheet({
      itemList: ['编辑', '删除'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.editTransaction(index, transaction);
        } else if (res.tapIndex === 1) {
          this.deleteTransaction(index, transaction);
        }
      }
    });
  },

  // 编辑流水
  editTransaction(index, transaction) {
    // 跳转到记账页并预填数据
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/record/record?edit=1&transactionId=${transaction.id}`
    });
  },

  // 删除流水
  deleteTransaction(index, transaction) {
    const userName = this.getUserName(transaction.user_id);
    const typeText = transaction.type === 'expense' ? '支出' : '收款';
    const amountText = `¥${transaction.amount}`;

    wx.showModal({
      title: '确认删除',
      content: `确定删除 "${userName} ${typeText} ${amountText}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const success = storage.deleteTransaction(transaction.id);
          if (success) {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.loadData();
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  // 跳转记账页
  goToRecord() {
    wx.navigateTo({
      url: '/pages/tools/bookkeeping/record/record'
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  }
});
