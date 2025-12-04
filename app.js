// app.js
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
  },
  globalData: {
    amapKey: "b732a0461f7ca8d9a8691e2124b3c287",
    qweatherKey:"e4493b32e3eb4d1bbac9a5d478926f28"
  }
})
