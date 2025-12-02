Page({
  data: {
    loaded: false, 
    city: "",
    weather: "",
    temperature: "",
    futureList: []
  },

  onLoad() {
    this.getLocation()
  },

  /** 获取定位 */
  getLocation() {
    wx.getLocation({
      type: "wgs84",
      success: (res) => {
        const { latitude, longitude } = res
        this.getCity(latitude, longitude)
      },
      fail: () => {
        wx.showToast({
          title: "请授权定位",
          icon: "none"
        })
      }
    })
  },

  /** 经纬度 -> 城市 */
  getCity(lat, lon) {
    const key = getApp().globalData.amapKey

    wx.request({
      url: "https://restapi.amap.com/v3/geocode/regeo",
      data: {
        key,
        location: `${lon},${lat}`
      },
      success: (res) => {
        const city =
          res.data.regeocode.addressComponent.city ||
          res.data.regeocode.addressComponent.province

        this.setData({ city })

        this.getWeather(city)
        this.getFuture(city)
      }
    })
  },

  /** 实时天气 */
  getWeather(cityName) {
    const key = getApp().globalData.amapKey

    wx.request({
      url: "https://restapi.amap.com/v3/weather/weatherInfo",
      data: {
        key,
        city: cityName,
        extensions: "base"
      },
      success: (res) => {
        const live = res.data.lives[0]

        this.setData({
          loaded: true,
          weather: live.weather,
          temperature: live.temperature
        })
      }
    })
  },

  /** 未来天气（取 4 天） */
  getFuture(cityName) {
    const key = getApp().globalData.amapKey

    wx.request({
      url: "https://restapi.amap.com/v3/weather/weatherInfo",
      data: {
        key,
        city: cityName,
        extensions: "all"
      },
      success: (res) => {
        const forecasts = res.data.forecasts[0].casts

        const list = forecasts.slice(1, 5).map(item => ({
          date: item.date.slice(5), // 只留 月-日
          weather: item.dayweather,
          temp: `${item.nighttemp}° ~ ${item.daytemp}°`
        }))

        this.setData({
          futureList: list
        })
      }
    })
  }
})
