if (/[&?]appSource=([^&]+)/.exec(location.search)) {
  var appSource = RegExp.$1;

  var wrapper = document.createElement('div');
  wrapper.className = 'chrome-app-rbac';
  wrapper.style.display = 'none'; // 由 browser_action 控制显示隐藏
  wrapper.innerHTML = `
    <div class="tools">
      <span class="app-source">项目：${appSource}</span>
      <button class="rbac-export">1. 导出权限</button>
      <button class="rbac-copy">2. 复制</button>
      <button class="rbac-import">3. 导入权限</button>
    </div>
    <div class="rbac-tree">
      <textarea></textarea>
    </div>
  `;
  document.body.appendChild(wrapper);

  document.querySelector('.chrome-app-rbac .rbac-export').onclick = function () {
    RBAC.export();
  }

  document.querySelector('.chrome-app-rbac .rbac-import').onclick = function () {
    RBAC.import();
  }

  document.querySelector('.chrome-app-rbac .rbac-copy').onclick = function () {
    input.focus();
    input.select();
    document.execCommand('copy');
  }

  var input = document.querySelector('.chrome-app-rbac .rbac-tree textarea');

  var RBAC = {
    request(url, data) {
      return fetch(url, {
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
          rbac_source: appSource,
        },
        credentials: 'include',
        method: 'post',
        body: JSON.stringify(data),
      }).then(response => response.json())
    },
    importRbacItem(item, parentItem = { id: 0 }, previousItem = { sort: -1 }) {
      const url = '/rbac/web/uri/save/v1';
      this.request(url, {
        id: "",
        treeCode: "",
        appSource,
        parentId: parentItem.id,
        name: item.name,
        path: item.path,
        showType: item.showType,
        desc: item.desc,
        sort: previousItem.sort + 1,
      }).then(res => {
        // 添加子节点
        this.importRbacList(item.childList, res.data);

        // 添加 next 节点
        if (item.nextItem) {
          this.importRbacItem(item.nextItem, parentItem, res.data);
        }
      })
    },
    importRbacList(childList, parentItem) {
      if (childList.length) {
        childList.forEach((item, index) => {
          if (index > 0) {
            childList[index - 1].nextItem = item;
          }
        });
        this.importRbacItem(childList[0], parentItem);
      }
    },
    import(childList) {
      try {
        var res = JSON.parse(input.value);
        this.importRbacList(res.data);
      } catch (e) {
        alert(`权限数据解析错误 ${e}`);
      }
    },
    export() {
      // 查询权限树
      this.request('/rbac/web/uri/queryTree/v1', {
        id: 0,
        appSource,
      }).then(res => {
        input.value = JSON.stringify(res, null, 4);
      });
    },
  };
}

