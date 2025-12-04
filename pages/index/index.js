Page({
  data: {
    loaded: false, 
    city: "",
    weather: "",
    temperature: "",
    futureList: [],
    icon:"",
    description:"",
    locationFailed: false,
    lastLocation: null // 记录上次的经纬度
  },

  onLoad() {
    wx.showLoading({ title: "加载中…" });
    this.getLocation()
  },

    /** 下拉刷新 */
  onPullDownRefresh() {
    wx.showLoading({ title: "刷新中…" });
    if (!this.data.locationFailed && this.data.lastLocation) {
      // 之前定位成功 → 直接刷新天气
      const { lat, lon } = this.data.lastLocation;
      this.getCity(lat, lon);
    } else {
      // 之前定位失败 → 尝试再次定位
      this.getLocation();
    }
  },

  /** 获取定位 */
  getLocation() {
    wx.getLocation({
      type: "wgs84",
      success: (res) => {
        const { latitude, longitude } = res
        console.log("======latitude="+latitude+",longitude="+longitude);
        this.setData({
          locationFailed: false,
          lastLocation: { lat: latitude, lon: longitude }
        });

        this.getCity(latitude, longitude)
        //this.getCity(30.488966, 114.479)
      },
      fail: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        
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
          // ☀️ 晴
          "晴": "sunny",
        
          // ☁️ 多云、阴
          "多云": "cloudy",
          "少云": "cloudy",
          "晴间多云": "cloudy",
          "阴": "overcast",
        
          // 🌧 小雨 ~ 暴雨
          "小雨": "rain_light",
          "中雨": "rain",
          "大雨": "rain_heavy",
          "暴雨": "rain_storm",
          "大暴雨": "rain_bigstorm",
          "特大暴雨": "rain_superstorm",
          "阵雨": "rain",
          "强阵雨": "rain_heavy",
        
          // ⛈ 雷雨
          "雷阵雨": "thunder",
          "强雷阵雨": "thunder",
          "雷阵雨并伴有冰雹": "thunder_hail",
        
          // 🌨 雪
          "小雪": "snow_light",
          "中雪": "snow",
          "大雪": "snow_heavy",
          "暴雪": "snow_storm",
          "阵雪": "snow",
        
          // 🌨❄️ 雨夹雪 / 冻雨
          "雨夹雪": "sleet",
          "雨雪天气": "sleet",
          "冻雨": "sleet",
        
          // 🌫 雾
          "雾": "fog",
          "浓雾": "fog",
          "强浓雾": "fog",
          "轻雾": "fog",
          "大雾": "fog",
          "特强浓雾": "fog",
        
          // 🌁 霾
          "霾": "haze",
          "中度霾": "haze",
          "重度霾": "haze",
          "严重霾": "haze",
        
          // 🏜 沙尘
          "浮尘": "dust",
          "扬沙": "dust",
          "沙尘暴": "dust",
          "强沙尘暴": "dust",
        }
        const icon = iconMap[live.weather] || "sunny"

        this.setData({
          loaded: true,
          weather: live.weather,
          temperature: live.temperature,
          icon: `/images/weather/${icon}.png`,
          description: `气温：${live.temperature}° / 湿度：${live.humidity}% / ${live.weather}`
        })

        wx.hideLoading();
        wx.stopPullDownRefresh();
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
          let weekLabel = idx === 0 ? "今天" : weekMap[(item.week % 7)]
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
  },


  onShareAppMessage() {
  },

  /** 分享到朋友圈 */
  onShareTimeline() {
  },

})
