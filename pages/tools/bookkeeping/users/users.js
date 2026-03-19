// pages/tools/bookkeeping/users/users.js - 用户管理页
const app = getApp();
const storage = require('../../../../utils/storage.js');
const calculator = require('../../../../utils/calculator.js');

Page({
  data: {
    users: [],
    showAddModal: false,
    newUser: {
      name: '',
      note: '',
      avatar_color: '#FF6B35'
    },
    avatarColors: [
      '#FF6B35', '#1890FF', '#52C41A', '#722ED1', '#F7931E', '#EB2F96'
    ],
    colorIndex: 0
  },

  onLoad(options) {
    // 如果有 action 参数，显示添加弹窗
    if (options.action === 'add') {
      this.setData({ showAddModal: true });
    }

    this.loadUsers();
  },

  onShow() {
    this.loadUsers();
  },

  loadUsers() {
    const users = storage.getUsers();
    const transactions = storage.getTransactions();

    // 计算每个用户的余额
    const usersWithBalance = users.map(user => {
      const balance = calculator.calcBalance(user.id, transactions);
      const absBalance = Math.abs(balance);
      return {
        ...user,
        balance: balance,
        balanceDisplay: balance < 0 ? `-¥${absBalance}` : `¥${absBalance}`,
        stats: calculator.getUserStats(user.id, transactions)
      };
    }).sort((a, b) => {
      // 活跃用户在前，暂停用户在后
      if (a.status === 'paused' && b.status !== 'paused') return 1;
      if (a.status !== 'paused' && b.status === 'paused') return -1;
      return 0;
    });

    this.setData({ users: usersWithBalance });
  },

  // 显示添加弹窗
  showAddUserModal() {
    this.setData({
      showAddModal: true,
      newUser: {
        name: '',
        note: '',
        avatar_color: '#FF6B35'
      },
      colorIndex: 0
    });
  },

  // 关闭添加弹窗
  closeAddModal() {
    this.setData({ showAddModal: false });
  },

  // 输入用户名
  onNameInput(e) {
    this.setData({
      'newUser.name': e.detail.value
    });
  },

  // 输入备注
  onNoteInput(e) {
    this.setData({
      'newUser.note': e.detail.value
    });
  },

  // 选择头像颜色
  selectColor(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      colorIndex: index,
      'newUser.avatar_color': this.data.avatarColors[index]
    });
  },

  // 添加用户
  addUser() {
    const { newUser } = this.data;

    if (!newUser.name.trim()) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (newUser.name.length > 10) {
      wx.showToast({
        title: '用户名最多10个字',
        icon: 'none'
      });
      return;
    }

    const user = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name: newUser.name.trim(),
      note: newUser.note.trim(),
      avatar_color: newUser.avatar_color,
      status: 'active',
      created_at: new Date().toISOString()
    };

    const success = storage.addUser(user);

    if (success) {
      wx.showToast({
        title: '添加成功',
        icon: 'success'
      });
      this.setData({ showAddModal: false });
      this.loadUsers();
    } else {
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },

  // 跳转用户详情
  goToUserDetail(e) {
    const userId = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/tools/bookkeeping/user-detail/user-detail?id=${userId}`
    });
  },

  // 长按用户操作
  showUserAction(e) {
    const index = e.currentTarget.dataset.index;
    const user = this.data.users[index];

    if (user.status === 'active') {
      wx.showActionSheet({
        itemList: ['暂停服务', '删除用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.pauseUser(user);
          } else if (res.tapIndex === 1) {
            this.deleteUser(user);
          }
        }
      });
    } else {
      wx.showActionSheet({
        itemList: ['恢复服务', '删除用户'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.resumeUser(user);
          } else if (res.tapIndex === 1) {
            this.deleteUser(user);
          }
        }
      });
    }
  },

  // 暂停用户
  pauseUser(user) {
    wx.showModal({
      title: '暂停服务',
      content: `确定暂停 "${user.name}" 的服务吗？暂停后不会显示在首页。`,
      success: (res) => {
        if (res.confirm) {
          storage.updateUser(user.id, { status: 'paused' });
          this.loadUsers();
          wx.showToast({ title: '已暂停', icon: 'success' });
        }
      }
    });
  },

  // 恢复用户
  resumeUser(user) {
    storage.updateUser(user.id, { status: 'active' });
    this.loadUsers();
    wx.showToast({ title: '已恢复', icon: 'success' });
  },

  // 删除用户
  deleteUser(user) {
    const balance = calculator.calcBalance(user.id, storage.getTransactions());

    if (balance !== 0) {
      wx.showModal({
        title: '无法删除',
        content: `"${user.name}" 仍有余额，请先结清后再删除。`,
        showCancel: false
      });
      return;
    }

    wx.showModal({
      title: '确认删除',
      content: `确定删除 "${user.name}" 吗？此操作不可恢复。`,
      success: (res) => {
        if (res.confirm) {
          storage.deleteUser(user.id);
          this.loadUsers();
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
});
