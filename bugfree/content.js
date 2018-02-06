function newForm(product, userId, status) {
  var formData = new FormData();
  formData.append('queryaction', '1');
  formData.append('queryTitle', '');
  formData.append('saveQuery', '0');
  formData.append('reset', '0');
  formData.append('showField', '');
  formData.append('BugFreeQuery[leftParenthesesName0]', '');
  formData.append('BugFreeQuery[field0]', 'module_name');
  formData.append('BugFreeQuery[operator0]', 'UNDER');
  formData.append('BugFreeQuery[value0]', product.name);
  formData.append('BugFreeQuery[rightParenthesesName0]', '');
  formData.append('BugFreeQuery[andor0]', 'And');
  formData.append('BugFreeQuery[leftParenthesesName1]', '');
  formData.append('BugFreeQuery[field1]', 'resolved_by_name');
  formData.append('BugFreeQuery[operator1]', '=');
  formData.append('BugFreeQuery[value1]', userId);
  formData.append('BugFreeQuery[rightParenthesesName1]', '');
  if (status) {
    formData.append('BugFreeQuery[andor1]', 'And');
    formData.append('BugFreeQuery[leftParenthesesName2]', '');
    formData.append('BugFreeQuery[field2]', 'solution');
    formData.append('BugFreeQuery[operator2]', '=');
    formData.append('BugFreeQuery[value2]', status);
    formData.append('BugFreeQuery[rightParenthesesName2]', '');
    formData.append('BugFreeQuery[andor2]', 'And');
    formData.append('BugFreeQuery[queryRowOrder]', 'SearchConditionRow0,SearchConditionRow1,SearchConditionRow2,');
  } else {
    formData.append('BugFreeQuery[andor1]', 'And');
    formData.append('BugFreeQuery[queryRowOrder]', 'SearchConditionRow0,SearchConditionRow1,');
  }
  return formData;
}

function fetchX(product, userId, status) {
  return fetch('/index.php/bug/list/' + product.id, {
    method: 'POST',
    credentials: 'include',
    body: newForm(product, userId, status),
  }).then(res => res.text()).then(innerHTML => {
    var match = /总数:<b>(\d+)<\/b>/.exec(innerHTML);
    if (match) {
      return parseInt(match[1], 10);
    } else {
      console.error('woca error le a');
      return 0;
    }
  });
}

function fetchOne(userId) {
  var statusList = ['', "By Design", "Duplicate", "External", "Fixed", "Not Repro", "Postponed", "Won't Fix"];
  statusList = [''];
  var productList = window.productList = [...document.querySelector('#product_name').options].map(option => ({ id: option.value, name: option.text }));;
  var ret = statusList.reduce((left, status) => {
    return left.then(countInfo => {
      return Promise.all(productList.map(product => fetchX(product, userId, status))).then(res => {
        const productCount = res.filter(i => i > 0);
        const count = res.reduce((i, j) => {
          return i + j;
        });
        countInfo.productCount = productCount;
        if (status) {
          countInfo[status] = count;
        } else {
          countInfo.all = count;
        }
        return countInfo;
      });
    });
  }, Promise.resolve({}));
  return ret.then(res => {
    console.log(userId, res, 'done');
    return res;
  });
}

function gogogo() {
  console.time('统计用时');
  var userIdList = [
    'hui.liu',
    'yajun.qiao',
    'bowen.liu01',
    'zheng.wang',
    'longhai.wang',
    'zhankui.hu',
    'zongchao.tang',
    'shuwen.liang',
    'xin.wang01',
    'chuanshi.xu',
    'weikang.zuo',
    'mengrui.yang',
    'jinsong.zhao',
    'lei.kong',
    'huafeng.li',
    'xuezhi.tian',
    'zhen.peng',
    'shen.li',
    'wei.wang03',
    'hualong.dai',
    'yandong.gao',
    'hailong.xu',
    'wenjie.xu',
    'xinzhe.yu',
    'linlin.zheng',
    'zhi.liang',
    'tian.xia',
    'shaohui.yang',
    'yicun.xu',
    'rui.shi',
    'chenkai.wu',
    'liang.zhao',
    'mo.zhou',
    'lei.qin',
    'zhen.an',
    'guangzhou.chen',
    'xiao.geng',
    'yifan.chen',
    'shuting.zheng',
    'liang.huang',
    'changhai.rong',
    'zhenhua.qi',
    'zhenchao.sun',
    'minghao.yu',
    'tianxiang.he',
    'yayu.wang',
    'li.wang',
    'xinjian.huang',
    'zongze.li',
    'di.zhang',
    'he.ren',
    'baotong.wang',
    'caichang.xiong',
    'yafei.li',
    'yue.cai',
    'chenghua.li',
    'xi.liu',
    'huixiang.fu'
  ];
  // userIdList.length = 5;
  var done = userIdList.reduce((left, id) => {
    return left.then((list) => {
      return fetchOne(id).then(res => {
        var userCount = {
          id,
          ...res,
        };
        list.push(userCount);
        return list;
      });
    });
  }, Promise.resolve([]));
  done.then(res => {
    window.aaa = res.sort((user0, user1) => {
      return user1.all - user0.all;
    })
    console.log('冠军（' + res[0].id + '）：' + res[0].all + '个bug');
    console.log('亚军（' + res[1].id + '）：' + res[1].all + '个bug');
    console.log('季军（' + res[2].id + '）：' + res[2].all + '个bug');
    console.timeEnd('统计用时');
    console.table(aaa);

    localStorage.setItem('aaa', JSON.stringify(aaa));
  })
}

var zouqi = document.createElement('button');
zouqi.innerHTML = '走起'
zouqi.className = 'zouqi';
zouqi.onclick = function(){
  if(confirm('要几分钟几百兆流量的，bugfree都可能搞挂，你确定走起？ ^v^')){
    gogogo()
  }
};

document.body.appendChild(zouqi);