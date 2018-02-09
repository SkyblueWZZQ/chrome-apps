if (location.pathname === '/aa') {
  hackPage();
} else {
  halfHand();
}

// 自定义的 hack 页面，可以进行订单快速操作和查看，便捷高效啊啊啊啊啊
function hackPage() {
  document.title = 'what a ha';

  Vue.filter('payMethod', function (val) {
    if (val) {
      return val.split(',').map(type => ({
        1: 'C', // bankCard
        2: 'A', // alipay
        3: 'W', // wechat
      }[type])).join(',');
    }
    return '';
  });

  document.body.innerHTML = `
  <div id="app">
    <div class="ahead">
      <div>
        <label>显示条数：<input type="number" step="5" style="width:40px" v-model="pageSize" /></label>
        <label>刷新：<input type="checkbox" v-model="intervalOn" /></label>
        <label>间隔：<input type="number" step="100" style="width:40px" v-model="interval" /></label>
        <label>在线：<input type="checkbox" v-model="isOnline" /></label>
        <a target="_blank" href="/#/login">登录</a>
        <a id="trade" target="_blank" href="/#/trade/list?coin=2&type=1">列表</a>
        <a target="_blank" href="/#/financial">资产</a>
        <a target="_blank" href="/#/order/my_order">历史</a>
        <a target="_blank" href="/#/order/my_ad">发布</a>
        <span>计数：{{counter}}</span>
      </div>
      <div>
        <label>翻了：<input type="checkbox" v-model="nb" /></label>
        <label>数：<input style="width:60px" v-model="nbCount" /></label>
        <label>警戒：<input type="checkbox" v-model="buyNotify" /></label>
        <label>线：<input type="number" step="0.01" style="width:50px" v-model="notifyPrice" /></label>
        <label>数：<input style="width:60px" v-model="buyNotifyCount" /></label>
      </div>
    </div>
    <div v-if="false">
      <p>
        <span>今天买入：count</span>
        <span>今天买入：count</span>
        <span>营收USDT：count</span>
        <span>营收CNY：count</span>
      </p>
      <span>左边显示今天买入的订单列表</span>
      <span>右边显示今天卖出的订单列表</span>
    </div>
    <h2>
      <span>{{ad.totalCount + '条/' + ad.totalPage + '页'}}</span>
      <span class="notify" v-if="notifyMessage">{{notifyMessage}}</span>
    </h2>
    <table>
      <thead>
        <tr>
          <th>序号 [ID]</th>
          <th>用户</th>
          <th>价格</th>
          <th>数量</th>
          <th>范围</th>
          <th>总额</th>
          <th>付款方式</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item,index) in ad.list" v-if="true" v-bind:style="{background: item.isOnline ? '' : '#ddd'}">
          <td>{{index + 1}} [{{item.id}}]</td>
          <td v-bind:class="{self: item.userId == '2034346', offline: !item.isOnline}">
            {{item.merchant ? '★' : '☆'}}
            {{item.userName}} [{{item.userId}}]
            {{item.tradeMonthTimes}} ({{item.appealMonthWinTimes}}/{{item.appealMonthTimes}})
          </td>
          <td>{{item.price}}</td>
          <td>{{Math.floor(item.tradeCount)}}</td>
          <td>{{item.minTradeLimit}} - {{item.maxTradeLimit}}</td>
          <td>{{Math.floor(item.tradeCount * item.price)}}</td>
          <td>{{item.payMethod | payMethod}}</td>
          <td>
            <button v-on:click="order(item,100000)">10</button>
            <button v-on:click="order(item,50000)">5</button>
            <button v-on:click="order(item,20000)">2</button>
            <button v-on:click="order(item,10000)">1</button>
            <button v-on:click="order(item,'all')">全部</button>
          </td>
        </tr>
      <tbody>
    </table>
  </div>
  `;

  var vmodel = new Vue({
    el: '#app',
    data: {
      notifyPrice: localStorage.getItem('notifyPrice') || '6.46',
      notifyMessage: '',
      ad: {
        list: [],
        totalCount: 0,
        totalPage: 0,
      },
      orderList: [],
      userInfo: {

      },
      interval: 500,
      intervalOn: true,
      pageSize: 40,
      isOnline: true,
      nb: false,
      nbCount: localStorage.getItem('nbCount') || 'auto',
      buyNotify: false,
      buyNotifyCount: localStorage.getItem('buyNotifyCount') || '50000',
      counter: 1,
    },
    watch: {
      notifyPrice: function (price) {
        localStorage.setItem('notifyPrice', price);
      },
      nbCount: function (count) {
        localStorage.setItem('nbCount', count);
      },
      buyNotifyCount: function (count) {
        localStorage.setItem('buyNotifyCount', count);
      },
      intervalOn: function (on) {
        if (on) {
          this.fetchAdList();
        }
      }
    },
    created: function () {
      vm = this;
      this.fetchAdList();
    },
    computed: {

    },
    methods: {
      notify(message) {
        Notification.requestPermission(perm => {
          var notification = new Notification(message);
          notification.onclick = () => {
            document.getElementById('trade').click();
          }
        });
        clearTimeout(this.notifyTimer);
        this.notifyMessage = message;
        this.notifyTimer = setTimeout(() => {
          this.notifyMessage = '';
        }, 2000);
      },
      fetchAdList() {
        this.counter += 1;
        setTimeout(() => {
          fetchX({
            url: 'https://api-otc.huobi.pro/v1/otc/trade/list/public?coinId=2&tradeType=1&currentPage=1&payWay=&country=&merchant=0&online=' + (this.isOnline ? 1 : 0) + '&range=0&pageSize=' + this.pageSize + '&_tt=' + Date.now(),
          }).then(res => {
            const firstItem = res.data[0];
            const secondItem = res.data[1];
            const ret = secondItem.price - firstItem.price;
            if (ret > 0.015) {
              console.log('翻了翻了翻了', firstItem.price, secondItem.price, ret);
              this.notify('翻了翻了翻了');
              // this.goule();
            }
            if (res.data[0].price == this.notifyPrice) {
              console.log('警戒警戒警戒', firstItem.price, this.buyNotifyCount);
              this.notify('警戒警戒警戒');
              // this.goule();
            }
            this.ad.list = res.data;
            this.ad.totalCount = res.totalCount;
            this.ad.totalPage = res.totalPage;
            if (this.intervalOn) {
              this.fetchAdList();
            }
          }).catch(err => {
            this.fetchAdList();
            console.warn('fetchAdList error', err);
          })
        }, this.interval);
      },
      fetchOrderList() {

      },
      order(item, count, all) {
        return;
        fetchX({
          url: 'https://api-otc.huobi.pro/v1/otc/order/ticket?tradeId=' + item.id
        }).then(res => {
          const { price, minTradeLimit, maxTradeLimit, tradeCount, ticket, tradeId } = res.data;
          const total = tradeCount * price;
          const min = minTradeLimit;
          const max = Math.min(total, maxTradeLimit);
          if (count === 'all') {
            count = max;
          } else if (count === 'auto') {
            if (max > 10000 && max < 100000) {
              count = max;
            } else {
              console.log('没敢下单（小于1w大于10w）', minTradeLimit, maxTradeLimit, tradeCount, price, total);
              return;
            }
          }
          if (count > max && all) {
            count = max; // 警戒和够了，自动全部
          }
          if (count < min) {
            this.notify('最小 ' + min);
          } else if (count > max) {
            this.notify('最大 ' + max);
          } else {
            const param = {
              amount: Math.floor(count),
              ticket: ticket,
              tradeId: tradeId,
              password: md5('' + 'otc, nono')
            };
            const formData = new FormData();
            Object.keys(param).forEach(key => {
              formData.append(key, param[key]);
            })
            console.log(param);
            debugger
            fetchX({
              url: 'https://api-otc.huobi.pro/v1/otc/order/create',
              method: 'POST',
              body: formData
            }).then(res => {
              if (res.code == 200) {
                fetchX({
                  url: 'https://api-otc.huobi.pro/v1/otc/order/2009458/detail/appeal',
                }).then(info => {
                  console.log(info);
                  localStorage.setItem()
                })
              } else {
                this.notify('报错了', res);
              }
            }).catch(res => {
            })
          }
        })
      }
    }
  });
}

function buyall() {
  var all = document.querySelectorAll('.all');
  if (all.length === 0) {
    return setTimeout(buyall, 50);
  } else {
    all[1].click();
  }
}

// 半手工刷新广告列表 // 双击页面触发和关闭
var turnOn = false;
var inPriceInput = document.createElement('input');
inPriceInput.id = 'inPriceInput';
inPriceInput.oninput = () => {
  localStorage.setItem('inPriceInput', inPriceInput.value);
}
function halfHand() {
  var goffCount = 0;
  // 半手工操作
  function goff() {
    goffCount++;
    if (goffCount > 20) {
      goffCount = 0;
      console.clear();
    }
    if (!document.getElementById('inPriceInput')) {
      var button = document.querySelector('.table-head-right');
      var wrapper = document.querySelector('.table-head');
      inPriceInput.value = localStorage.getItem('inPriceInput') || '6.44';
      wrapper.insertBefore(inPriceInput, button);
    }
    var nnd = document.querySelectorAll('.table-head input')[0];
    if (nnd.checked) {
      nnd.click();
    }
    function check() {
      var row = document.querySelector('.right-margin .fontweight span');
      if (row) {
        var onlineIndex = [...document.querySelectorAll('.user-avatar-in')].findIndex(item => item.className.indexOf('not-online') <= 0);
        var price = document.querySelectorAll('.right-margin .fontweight span')[onlineIndex].innerText.split(/\s/)[0];
        console.log('check', price, inPriceInput.value);
        if (parseFloat(price, 10) < parseFloat(inPriceInput.value, 10)) {
          turnOn = false;
          document.querySelectorAll('.buy-btn')[onlineIndex].click();
          buyall();
        } else {
          setTimeout(goff, 500); // 接口返回后间隔 1 秒进行下一次刷新
        }
      } else {
        setTimeout(check, 50);
      }
    }
    if (turnOn) {
      document.querySelectorAll('.table-head input')[1].click();
      const beforeCheckCount = Date.now();
      function beforeCheck() {
        if (Date.now() - beforeCheckCount > 1000) {
          console.log('有问题，重新 goff');
          return goff(); // 有问题重新开始
        }
        var hasList = document.querySelector('.buy-btn');
        if (!hasList) {
          console.log('beforeCheck check');
          check(); // 查看接口是否返回
        } else {
          setTimeout(beforeCheck, 50);
        }
      }
      beforeCheck();
    }
  }
  const copyInput = document.createElement('input');
  copyInput.className = 'copy-input'
  copyInput.style.position = 'absolute';
  copyInput.style.marginLeft = '800px';
  copyInput.style.marginTop = '0px';
  copyInput.size = 40;

  function copy(text) {
    const detail = document.querySelector('.order-detail-wrapper');
    detail.insertBefore(copyInput, detail.firstChild);
    copyInput.value = text;
    copyInput.focus();
    copyInput.select();
    document.execCommand('copy');
  }
  document.body.ondblclick = function (e) {
    if (location.hash.startsWith('#/chat/')) {
      const el = e.target;
      const refer = document.querySelector('.reference-num');
      const amount = document.querySelector('.payment-amount');
      const otherNumber = document.querySelector('.other-number');
      const bankNum = document.querySelector('.bank .bank-num');
      const alipayNum = document.querySelector('.alipay .bank-num');
      const bank = document.querySelector('.bank .info-box');
      const alipay = document.querySelector('.alipay .info-box');
      if (refer.contains(el)) { // copy 参考号
        copy(refer.innerHTML);
      } else if (amount.contains(el)) { // copy 金额
        copy(amount.firstChild.nodeValue);
      } else if (otherNumber.contains(el)) { // copy 数量
        copy(otherNumber.firstChild.nodeValue);
      } else if (bankNum.contains(el)) { // copy 银行卡
        copy(bankNum.innerHTML);
      } else if (bank.firstChild === el) { // copy 姓名 或者银行名称
        var texts = bank.firstChild.innerText.split(/\s+/);
        if (e.offsetX > 50) {
          copy(texts[1]); // copy 银行名称
        } else {
          copy(texts[0]); // copy 姓名
        }
      } else if (bank.firstChild.nextElementSibling === el) { // 复制银行支行
        copy(bank.firstChild.nextElementSibling.innerHTML);
      } else if (alipayNum.contains(el)) { // 复制支付宝账号
        copy(alipayNum.innerHTML);
      } else if (alipay.firstChild === el) { // 复制支付宝账号
        copy(alipay.firstChild.innerHTML);
      }
    } else if (location.hash == '#/trade/list?coin=2&type=1') {
      turnOn = !turnOn;
      if (turnOn) {
        goff();
      }
    }
  }
}

function fetchX(options) {
  return fetch(options.url, {
    headers: new Headers({
      token: localStorage.otc_token,
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      fingerprint: 'e81918ba3398fe377a6722c505e1a0e7',
      Origin: 'https://otc.huobi.pro',
      ...options.headers,
      token: localStorage.getItem('otc_token'),
    }),
    method: options.method || 'GET',
    mode: 'cors',
    credentials: 'include',
  }).then(res => {
    return res.text();
  }).then(text => {
    return JSON.parse(text);
  });
}