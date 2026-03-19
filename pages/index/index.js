// pages/index/index.js
Page({
  data: {
    loaded: false,
    city: "",
    weather: "",
    temperature: "",
    humidity: "",
    windDir: "",
    windSpeed: "",
    futureList: [],
    icon: "",
    locationFailed: false,
    lastLocation: null,
    updateTime: ""
  },

  onLoad() {
    wx.showLoading({ title: "加载中…" });
    this.getLocation();
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
        const { latitude, longitude } = res;
        this.setData({
          locationFailed: false,
          lastLocation: { lat: latitude, lon: longitude }
        });
        this.getCity(latitude, longitude);
      },
      fail: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        wx.showToast({
          title: "请授权定位",
          icon: "none"
        });
        this.setData({ locationFailed: true });
      }
    });
  },

  retryLocation() {
    this.getLocation();
  },

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
        this.getWeatherNow(lat, lon);
        this.getFutureWeather(lat, lon);
      }
    });
  },

  getWeatherNow(lat, lon) {
    const key = getApp().globalData.qweatherKey;
    wx.request({
      url: `https://p56aprjgdy.re.qweatherapi.com/v7/weather/now?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const now = res.data.now;
        const iconMap = {
          "100": "sunny", "101": "cloudy", "102": "cloudy", "103": "cloudy", "104": "overcast",
          "150": "sunny", "151": "cloudy", "300": "rain_light", "301": "rain", "302": "rain_heavy",
          "303": "rain_storm", "304": "rain_bigstorm", "305": "rain_superstorm", "306": "rain",
          "307": "rain_heavy", "308": "thunder", "309": "thunder", "310": "thunder_hail",
          "311": "snow_light", "312": "snow", "313": "snow_heavy", "314": "snow_storm",
          "400": "sleet", "401": "sleet", "402": "sleet", "500": "fog", "501": "fog",
          "502": "fog", "503": "fog", "504": "fog", "507": "haze", "508": "haze",
          "509": "haze", "510": "haze", "511": "dust", "512": "dust", "513": "dust"
        };

        const icon = iconMap[now.icon] || "sunny";
        const now_time = new Date();
        const timeStr = `${now_time.getHours().toString().padStart(2, '0')}:${now_time.getMinutes().toString().padStart(2, '0')}`;

        this.setData({
          loaded: true,
          weather: now.text,
          temperature: now.temp,
          humidity: now.humidity,
          windDir: now.windDir,
          windSpeed: now.windScale,
          icon: `/images/weather/${icon}.png`,
          updateTime: `更新于 ${timeStr}`
        });

        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  getFutureWeather(lat, lon) {
    const key = getApp().globalData.qweatherKey;
    const iconMap = {
      "100": "sunny", "101": "cloudy", "102": "cloudy", "103": "cloudy", "104": "overcast",
      "150": "sunny", "151": "cloudy", "300": "rain_light", "301": "rain", "302": "rain_heavy",
      "303": "rain_storm", "304": "rain_bigstorm", "305": "rain_superstorm", "306": "rain",
      "307": "rain_heavy", "308": "thunder", "309": "thunder", "310": "thunder_hail",
      "311": "snow_light", "312": "snow", "313": "snow_heavy", "314": "snow_storm",
      "400": "sleet", "401": "sleet", "402": "sleet", "500": "fog", "501": "fog",
      "502": "fog", "503": "fog", "504": "fog", "507": "haze", "508": "haze",
      "509": "haze", "510": "haze", "511": "dust", "512": "dust", "513": "dust"
    };

    wx.request({
      url: `https://p56aprjgdy.re.qweatherapi.com/v7/weather/7d?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const forecasts = res.data.daily;
        const weekMap = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

        // 计算温度范围用于进度条
        let minTemp = 100, maxTemp = -100;
        forecasts.forEach(item => {
          minTemp = Math.min(minTemp, parseInt(item.tempMin));
          maxTemp = Math.max(maxTemp, parseInt(item.tempMax));
        });
        const tempRange = maxTemp - minTemp || 1;

        const list = forecasts.map((item, idx) => {
          const dateObj = new Date(item.fxDate);
          const weekLabel = idx === 0 ? "今天" : weekMap[dateObj.getDay()];
          const itemMin = parseInt(item.tempMin);
          const itemMax = parseInt(item.tempMax);

          // 计算温度条位置和宽度
          const tempPercent = ((itemMin - minTemp) / tempRange) * 100;
          const tempWidth = ((itemMax - itemMin) / tempRange) * 100;

          return {
            date: item.fxDate.slice(5),
            week: weekLabel,
            weather: item.textDay,
            tempMin: item.tempMin,
            tempMax: item.tempMax,
            tempPercent: tempPercent,
            tempWidth: tempWidth,
            icon: `/images/weather/${iconMap[item.iconDay] || 'sunny'}.png`
          };
        });

        this.setData({
          futureList: list
        });
      }
    });
  },

  openHourly() {
    const { lastLocation, city } = this.data;
    if (!lastLocation) {
      wx.showToast({ title: "定位信息不存在", icon: "none" });
      return;
    }
    wx.navigateTo({
      url: `/pages/hourly/hourly?lat=${lastLocation.lat}&lon=${lastLocation.lon}&city=${city}`
    });
  },

  onShareAppMessage() {
    return {
      title: `${this.data.city} ${this.data.temperature}° ${this.data.weather}`,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: `${this.data.city} ${this.data.temperature}° ${this.data.weather}`,
      query: ''
    };
  }
});
