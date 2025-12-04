Page({
  data: {
    city: "",
    hourlyList: [],
    refreshing:false,
    lastLocation: null
  },

  onLoad(options) {
    const { lat, lon, city } = options;
    this.setData({ city, lastLocation: { lat, lon } });
    this.getHourlyWeather(lat, lon);
  },

  onPullDownRefresh() {
    const { lastLocation } = this.data;
    this.setData({ refreshing: true });
    if (lastLocation) {
      wx.showLoading({ title: '刷新中...' });
      this.getHourlyWeather(lastLocation.lat, lastLocation.lon);
    }else {
      wx.stopPullDownRefresh();
      wx.hideLoading();
    }
  },

  /** 获取分时天气（和风 24h API） */
  getHourlyWeather(lat, lon) {
    const key = getApp().globalData.qweatherKey;
    
    wx.request({
      url: `https://devapi.qweather.com/v7/weather/24h?location=${lon},${lat}&key=${key}`,
      success: (res) => {
        const hours = res.data.hourly; // 24 小时数组
        const iconMap = {
          "100":"sunny","101":"cloudy","102":"cloudy","103":"cloudy","104":"overcast",
          "150":"sunny",      
          "151":"cloudy",  
          "300":"rain_light","301":"rain","302":"rain_heavy","303":"rain_storm","304":"rain_bigstorm",
          "305":"rain_superstorm","306":"rain","307":"rain_heavy","308":"thunder","309":"thunder",
          "310":"thunder_hail","311":"snow_light","312":"snow","313":"snow_heavy","314":"snow_storm",
          "400":"sleet","401":"sleet","402":"sleet","500":"fog","501":"fog","502":"fog","503":"fog",
          "504":"fog","507":"haze","508":"haze","509":"haze","510":"haze","511":"dust","512":"dust",
          "513":"dust"
        };
        // const hourlyList = hours.map(item => ({
        //   time: item.fxTime.slice(11,16), // HH:mm
        //   temp: item.temp,
        //   icon: `/images/weather/${iconMap[item.icon] || "sunny"}.png`,
        //   weather: item.text
        // }));

        const hourlyList = hours.map(item => {
          console.log("hourly item iconCode:", item.icon, "text:", item.text); // 打印原始 iconCode 和文字描述
          return {
            time: item.fxTime.slice(11,16), // HH:mm
            temp: item.temp,
            icon: `/images/weather/${iconMap[item.icon] || "sunny"}.png`,
            weather: item.text
          };
        });

        this.setData({ hourlyList });
      },
      complete: () => {
        this.setData({ refreshing: false });
        wx.stopPullDownRefresh(); // 停止刷新
        wx.hideLoading();   
      }
    })
  },

    /** 返回首页 */
    goBack() {
      wx.navigateBack();
    },
    onShareAppMessage(res) {
      
    },
    onShareTimeline() {
      
    }
})
