// pages/hourly/hourly.js
Page({
  data: {
    city: "",
    hourlyList: [],
    lastLocation: null,
    minTemp: 0,
    maxTemp: 0
  },

  onLoad(options) {
    const { lat, lon, city } = options;
    this.setData({ city, lastLocation: { lat, lon } });
    this.getHourlyWeather(lat, lon);
  },



  /** 获取分时天气（和风 24h API） */
  getHourlyWeather(lat, lon) {
    const key = getApp().globalData.qweatherKey;

    wx.request({
      url: `https://p56aprjgdy.re.qweatherapi.com/v7/weather/24h?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const hours = res.data.hourly;
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

        // 计算温度范围
        let minTemp = 100, maxTemp = -100;
        hours.forEach(item => {
          const temp = parseInt(item.temp);
          minTemp = Math.min(minTemp, temp);
          maxTemp = Math.max(maxTemp, temp);
        });

        // 添加一些边距让图表更好看
        const tempRange = maxTemp - minTemp || 1;
        minTemp = minTemp - tempRange * 0.1;
        maxTemp = maxTemp + tempRange * 0.1;

        const hourlyList = hours.map(item => ({
          time: item.fxTime.slice(11, 16),
          temp: parseInt(item.temp),
          icon: `/images/weather/${iconMap[item.icon] || "sunny"}.png`,
          weather: item.text
        }));

        this.setData({
          hourlyList,
          minTemp,
          maxTemp
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  },

  /** 返回首页 */
  goBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: `${this.data.city} 24小时天气预报`,
      path: '/pages/index/index'
    };
  },

  onShareTimeline() {
    return {
      title: `${this.data.city} 24小时天气预报`,
      query: ''
    };
  }
});
