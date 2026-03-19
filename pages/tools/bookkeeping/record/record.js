// pages/tools/bookkeeping/record/record.js - 记账页面逻辑
const app = getApp();
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');

Page({
  data: {
    type: 'expense',           // expense-支出, income-收款
    users: [],                 // 用户列表
    userIndex: 0,              // 选中的用户索引
    amount: '',                // 金额
    date: '',                  // 日期
    note: '',                  // 备注
    canSubmit: false,          // 是否可以提交
    currentUserBalance: 0,     // 当前用户余额
    currentUserBalanceDisplay: '¥0',  // 格式化后的余额显示
    isEdit: false,             // 是否编辑模式
    editTransactionId: null,    // 编辑的流水ID
    originalTransaction: null   // 原流水数据（用于计算余额变化）
  },

  onLoad(options) {
    // 保存跳转参数
    this.setData({ loadOptions: options });

    // 初始化日期
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.setData({ date: dateStr });

    // 设置类型（从首页跳转时）
    if (options.type) {
      this.setData({ type: options.type });
    }

    // 加载用户列表（需要在用户加载完成后处理编辑模式）
    this.loadUsers(options);
  },

  // 加载流水数据（编辑模式）
  loadTransaction(transactionId, userIndex) {
    const transactions = storage.getTransactions();
    const transaction = transactions.find(t => t.id === transactionId);

    if (!transaction) {
      wx.showToast({ title: '流水不存在', icon: 'none' });
      return;
    }

    // 直接使用传入的 userIndex
    if (userIndex !== -1) {
      this.setData({
        isEdit: true,
        editTransactionId: transactionId,
        originalTransaction: transaction,
        type: transaction.type,
        userIndex: userIndex,
        amount: String(transaction.amount),
        date: transaction.date,
        note: transaction.note || ''
      });
    }
  },

  onShow() {
    // 每次显示时刷新用户列表
    this.loadUsers(null, true);
  },

  loadUsers(options, isOnShow) {
    // 获取所有用户（包括暂停的，用于编辑模式）
    const allUsers = storage.getUsers();
    const users = allUsers.filter(u => u.status === 'active');

    // 如果没有活跃用户
    if (users.length === 0 && !isOnShow) {
      wx.showModal({
        title: '提示',
        content: '请先添加用户',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/tools/bookkeeping/users/users?action=add' });
          }
        }
      });
      return;
    }

    // 获取当前页面参数
    const pages = getCurrentPages();
    const pagesOptions = options || pages[pages.length - 1].options;

    // 处理编辑模式
    if (pagesOptions.edit === '1' && pagesOptions.transactionId) {
      const transactions = storage.getTransactions();
      const transaction = transactions.find(t => t.id === pagesOptions.transactionId);
      
      if (transaction) {
        // 找到对应的用户（在所有用户中查找，包括暂停的）
        const userIndex = allUsers.findIndex(u => u.id === transaction.user_id);
        
        // 更新用户列表为所有用户
        this.setData({ users: allUsers });
        
        // 加载流水数据
        this.setData({
          isEdit: true,
          editTransactionId: pagesOptions.transactionId,
          originalTransaction: transaction,
          type: transaction.type,
          userIndex: userIndex !== -1 ? userIndex : 0,
          amount: String(transaction.amount),
          date: transaction.date,
          note: transaction.note || ''
        });
        
        this.updateCurrentUserBalance();
        return;
      }
    }

    // 普通模式：只显示活跃用户
    this.setData({ users });

    // 如果有预选用户
    if (pagesOptions.userId) {
      const index = users.findIndex(u => u.id === pagesOptions.userId);
      if (index !== -1) {
        this.setData({ userIndex: index });
      }
    }

    this.updateCurrentUserBalance();
  },

  // 切换类型
  switchType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ type });
  },

  // 选择用户
  onUserChange(e) {
    this.setData({
      userIndex: e.detail.value
    });
    this.updateCurrentUserBalance();
  },

  // 输入金额
  onAmountInput(e) {
    let value = e.detail.value;
    // 限制最多2位小数
    if (value.includes('.')) {
      const parts = value.split('.');
      if (parts[1].length > 2) {
        value = parts[0] + '.' + parts[1].substring(0, 2);
      }
    }
    this.setData({
      amount: value,
      canSubmit: value && parseFloat(value) > 0
    });
  },

  // 选择日期
  onDateChange(e) {
    this.setData({ date: e.detail.value });
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({ note: e.detail.value });
  },

  // 更新当前用户余额显示
  updateCurrentUserBalance() {
    const { users, userIndex } = this.data;
    if (users.length === 0) return;

    const user = users[userIndex];
    const transactions = storage.getTransactions();
    const balance = calculator.calcBalance(user.id, transactions);

    // 格式化余额显示
    const absBalance = Math.abs(balance);
    const display = balance < 0 ? `-¥${absBalance}` : `¥${absBalance}`;

    this.setData({ 
      currentUserBalance: balance,
      currentUserBalanceDisplay: display
    });
  },

  // 提交记录
  submitRecord() {
    const { type, users, userIndex, amount, date, note, isEdit, editTransactionId, originalTransaction } = this.data;

    if (!amount || parseFloat(amount) <= 0) {
      wx.showToast({
        title: '请输入有效金额',
        icon: 'none'
      });
      return;
    }

    if (users.length === 0) {
      wx.showToast({
        title: '请先添加用户',
        icon: 'none'
      });
      return;
    }

    const user = users[userIndex];
    const newAmount = parseFloat(amount);

    let success;

    if (isEdit && editTransactionId) {
      // 编辑模式：更新流水
      const updatedTransaction = {
        ...originalTransaction,
        type,
        user_id: user.id,
        amount: newAmount,
        date,
        note: note.trim(),
        updated_at: new Date().toISOString()
      };

      success = storage.updateTransaction(editTransactionId, updatedTransaction);

      if (success) {
        wx.showToast({
          title: '修改成功',
          icon: 'success',
          duration: 2000
        });

        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      }
    } else {
      // 新增模式
      const transaction = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        type,
        user_id: user.id,
        amount: newAmount,
        date,
        note: note.trim(),
        created_at: new Date().toISOString()
      };

      success = storage.addTransaction(transaction);

      if (success) {
        const actionText = type === 'expense' ? '支出' : '收款';

        wx.showToast({
          title: `${actionText}成功`,
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          this.setData({
            amount: '',
            note: '',
            canSubmit: false
          });
          this.updateCurrentUserBalance();
        }, 1500);
      }
    }

    if (!success) {
      wx.showToast({
        title: '保存失败',
        icon: 'none'
      });
    }
  },

  // 快速金额按钮
  quickAmount(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      amount: value,
      canSubmit: true
    });
  }
});
