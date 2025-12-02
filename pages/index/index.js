Page({
  data: {
    loaded: false, 
    city: "",
    weather: "",
    temperature: "",
    futureList: [],
    icon:"",
    description:"",
    locationFailed: false
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
        console.log("======latitude="+latitude+",longitude="+longitude);
        //this.getCity(latitude, longitude)
        this.getCity(30.488966, 114.479)

        this.setData({ locationFailed: false })
      },
      fail: () => {
        wx.showToast({
          title: "请授权定位",
          icon: "none"
        })
        //this.getCity(30.488966, 114.479)
        this.setData({ locationFailed: true })
      }
    })
  },

  retryLocation() {
    this.getLocation()
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
        const addrComp = res.data.regeocode.addressComponent
        const city = addrComp.district || addrComp.city || addrComp.province

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

        const iconMap = {
          "晴": "sunny",
          "多云": "cloudy",
          "阴": "overcast",
          "小雨": "rain",
          "中雨": "rain",
          "大雨": "rain",
          "雷阵雨": "thunder"
        }
        const icon = iconMap[live.weather] || "sunny"

        this.setData({
          loaded: true,
          weather: live.weather,
          temperature: live.temperature,
          icon: `/images/weather/${icon}.png`,
          description: `气温：${live.temperature}° / 湿度：${live.humidity}% / ${live.weather}`
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

        const weekMap = ["周日","周一","周二","周三","周四","周五","周六"]

        const list = forecasts.slice(0, 4).map((item, idx) => {
          let weekLabel = idx === 0 ? "今天" : weekMap[item.week - 0]
          return {
            date: item.date.slice(5),   // MM-DD
            week: weekLabel,
            weather: item.dayweather,
            temp: `${item.nighttemp}° ~ ${item.daytemp}°`
          }
        })

        this.setData({
          futureList: list
        })
      }
    })
  }
})
