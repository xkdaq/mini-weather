// pages/tools/index/index.js - 工具箱首页
Page({
  data: {
    tools: [
      {
        id: 'bookkeeping',
        name: '早餐记账',
        desc: '记录早餐代购收支',
        icon: '🥐',
        color: '#FF6B35',
        path: '/pages/tools/bookkeeping/home/home'
      }
    ],
    showBack: false
  },

  onLoad(options) {
    // 判断是否需要显示返回按钮
    const pages = getCurrentPages();
    this.setData({
      showBack: pages.length > 1
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 跳转到工具页面
  goToTool(e) {
    const { path } = e.currentTarget.dataset;
    wx.navigateTo({
      url: path
    });
  },

  // 添加更多工具（预留）
  addMoreTools() {
    wx.showToast({
      title: '更多工具开发中',
      icon: 'none'
    });
  }
});
