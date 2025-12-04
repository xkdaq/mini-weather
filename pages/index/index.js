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
    lastLocation: null
  },

  onLoad() {
    wx.showLoading({ title: "加载中…" });
    this.getLocation()
  },

  onPullDownRefresh() {
    wx.showLoading({ title: "刷新中…" });
    if (!this.data.locationFailed && this.data.lastLocation) {
      const { lat, lon } = this.data.lastLocation;
      this.getWeatherNow(lat, lon);
      this.getFutureWeather(lat, lon);
    } else {
      this.getLocation();
    }
  },

  getLocation() {
    wx.getLocation({
      type: "wgs84",
      success: (res) => {
        const { latitude, longitude } = res
        this.setData({
          locationFailed: false,
          lastLocation: { lat: latitude, lon: longitude }
        });

        //this.getWeatherNow(latitude, longitude)
        //this.getFutureWeather(latitude, longitude)
        this.getCity(latitude,longitude)
      },
      fail: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        wx.showToast({
          title: "请授权定位",
          icon: "none"
        })
        this.setData({ locationFailed: true })
      }
    })
  },

  retryLocation() {
    this.getLocation()
  },


  //单独使用高德获取城市
  getCity(lat, lon) {
    const key = getApp().globalData.amapKey;
  
    wx.request({
      url: "https://restapi.amap.com/v3/geocode/regeo",
      data: {
        key,
        location: `${lon},${lat}`
      },
      success: (res) => {
        const addrComp = res.data.regeocode.addressComponent;
        const city = addrComp.district || addrComp.city || addrComp.province;
        this.setData({ city });
        
        // 获取天气
        this.getWeatherNow(lat, lon);
        this.getFutureWeather(lat, lon);
      }
    });
  },

  /** 实时天气（和风 Now API） */
  getWeatherNow(lat, lon) {
    const key = getApp().globalData.qweatherKey; // 和风天气 key

    wx.request({
      url: `https://p56aprjgdy.re.qweatherapi.com/v7/weather/now?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const now = res.data.now
        //const city = res.data.location?.name || ""; // 可选
        //console.log("city====="+city);
        const iconMap = {
          "100":"sunny","101":"cloudy","102":"cloudy","103":"cloudy","104":"overcast","150":"sunny","151":"cloudy",
          "300":"rain_light","301":"rain","302":"rain_heavy","303":"rain_storm","304":"rain_bigstorm",
          "305":"rain_superstorm","306":"rain","307":"rain_heavy","308":"thunder","309":"thunder",
          "310":"thunder_hail","311":"snow_light","312":"snow","313":"snow_heavy","314":"snow_storm",
          "400":"sleet","401":"sleet","402":"sleet","500":"fog","501":"fog","502":"fog","503":"fog",
          "504":"fog","507":"haze","508":"haze","509":"haze","510":"haze","511":"dust","512":"dust",
          "513":"dust"
        }

        console.log("======>"+now.icon);
        const icon = iconMap[now.icon] || "sunny";

        this.setData({
          loaded: true,
          //city:city,
          weather: now.text,
          temperature: now.temp,
          icon: `/images/weather/${icon}.png`,
          description: `气温：${now.temp}° / 湿度：${now.humidity}% / ${now.text}`
        })

        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    })
  },

  /** 未来天气（和风 7 天 API） */
  getFutureWeather(lat, lon) {
    const key = getApp().globalData.qweatherKey;

    wx.request({
      url: `https://p56aprjgdy.re.qweatherapi.com/v7/weather/7d?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const forecasts = res.data.daily; // 7 天数组

        const weekMap = ["周日","周一","周二","周三","周四","周五","周六"]

        const list = forecasts.map((item, idx) => {
          const dateObj = new Date(item.fxDate);
          const weekLabel = idx === 0 ? "今天" : weekMap[dateObj.getDay()];
          return {
            date: item.fxDate.slice(5),   // MM-DD
            week: weekLabel,
            weather: item.textDay,
            temp: `${item.tempMin}° ~ ${item.tempMax}°`
          }
        })

        this.setData({
          futureList: list
        })
      }
    })
  },


  openHourly() {
    const { lastLocation, city } = this.data;
    if (!lastLocation) {
      wx.showToast({ title: "定位信息不存在", icon: "none" });
      return;
    }
    
    // 把经纬度传给新页面
    wx.navigateTo({
      url: `/pages/hourly/hourly?lat=${lastLocation.lat}&lon=${lastLocation.lon}&city=${city}`
    })
  },

  onShareAppMessage(res) {
      
  },
  onShareTimeline() {
    
  }


  

})
