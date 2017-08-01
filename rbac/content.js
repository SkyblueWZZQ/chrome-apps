if (/[&?]appSource=([^&]+)/.exec(location.search)) {
  var appSource = RegExp.$1;
  var nodeId = 0;
  var wrapper = document.createElement('div');
  wrapper.className = 'chrome-app-rbac';
  wrapper.style.display = 'none'; // 由 browser_action 控制显示隐藏
  wrapper.innerHTML = `
    <div class="tools">
      <span class="app-source">项目：${appSource} node-id: <span class="node-id">${nodeId}</span></span>
      <button class="rbac-export">1. 导出</button>
      <button class="rbac-copy">2. 复制</button>
      <button class="rbac-diff">3. 比较</button>
      <button class="rbac-import">3. 导入</button>
    </div>
    <div class="rbac-tree">
      <textarea></textarea>
    </div>
  `;
  document.body.appendChild(wrapper);

  document.querySelector('.chrome-app-rbac .rbac-export').onclick = function () {
    RBAC.export();
  }

  document.querySelector('.chrome-app-rbac .rbac-copy').onclick = function () {
    input.focus();
    input.select();
    document.execCommand('copy');
  }

  document.querySelector('.chrome-app-rbac .rbac-diff').onclick = function () {
    RBAC.diff();
  }

  document.querySelector('.chrome-app-rbac .rbac-import').onclick = function () {
    RBAC.import();
  }

  document.querySelector('.ui-tree-node').onclick = function (e) {
    var selectedNode = document.querySelector('.curSelectedNode a[node-id]');
    if (selectedNode) {
      nodeId = selectedNode.getAttribute('node-id');
      document.querySelector('.app-source .node-id').innerHTML = nodeId;
    }
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
    importRbacItem(item, parentItem = { id: nodeId }, previousItem = { sort: -1 }) {
      const url = '/rbac/web/uri/save/v1';
      return this.request(url, {
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
        if (res.ret) {
          // 添加子节点
          return this.importRbacList(item.childList, res.data).then(
            // 添加 next 节点
            () => item.nextItem ? this.importRbacItem(item.nextItem, parentItem, res.data) : Promise.resolve()
          );
        } else {
          return Promise.reject(res.msg);
        }
      })
    },
    importRbacList(childList, parentItem) {
      childList.forEach((item, index) => {
        if (index > 0) {
          childList[index - 1].nextItem = item;
        }
      });
      return childList.length ? this.importRbacItem(childList[0], parentItem) : Promise.resolve();
    },
    getRbacInput() {
      try {
        var res = JSON.parse(input.value);
      } catch (e) {
        alert(`权限数据解析错误: ${e}`);
      }
      return res;
    },
    rbacTreeToMap(res) {
      var map = {};
      function processList(list, parentNames = []) {
        for (var i = 0; i < list.length; i++) {
          var item = list[i];
          var treeName = parentNames.slice();
          treeName.push(item.name);
          if (item.childList.length > 0) {
            processList(item.childList, treeName);
          }
          item.childList = [];
          item.treeName = treeName.join('/');
          debugger
          map[item.path] = item;
        }
      }
      processList(res.data);
      return map;
    },
    diff() {
      this.exportRbac().then(ret => {
        var oldRbacMap = this.rbacTreeToMap(ret);
        var newRbacMap = this.rbacTreeToMap(this.getRbacInput());
        var diffList = [];
        Object.keys(oldRbacMap).forEach(url => {
          if (!newRbacMap[url]) {
            diffList.push(oldRbacMap[url]);
          }
        })
        if (diffList.length > 0) {
          localStorage.setItem(`diff_rbac_tree_${appSource}`, JSON.stringify(diffList));
          var diffUrlList = diffList.map(item => (item.path + ' ' + item.treeName));
          alert(`比较结果：会丢失 ${diffUrlList.length} 项权限\n${diffUrlList.join('\n')}`);
        } else {
          alert(`比较结果：无`);
        }
      }).catch(e => alert(`导出异常: ${e}`))
    },
    import(childList) {
      var res = this.getRbacInput();
      this.exportRbac().then(ret => {
        // 导入前暂存数据，误操作恢复
        localStorage.setItem(`before_import_rbac_tree_${appSource}`, JSON.stringify(ret));
        return this.importRbacList(res.data).then(() => {
          alert('导入成功！');
          location.reload(true)
        }).catch(e => alert(`导入异常: ${e}`));
      }).catch(e => alert(`导出异常 ${e}`));
    },
    // 查询权限树
    exportRbac() {
      return this.request('/rbac/web/uri/queryTree/v1', {
        id: nodeId,
        appSource,
      });
    },
    export() {
      this.exportRbac().then(res => {
        localStorage.setItem(`export_rbac_tree_${appSource}`, JSON.stringify(res));
        input.value = JSON.stringify(res, null, 4);
      });
    },
  };
}

