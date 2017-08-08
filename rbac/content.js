if (/[&?]appSource=([^&]+)/.exec(location.search)) {
  var appSource = RegExp.$1;
  var nodeId = 0;
  var wrapper = document.createElement('div');
  wrapper.className = 'chrome-app-rbac';
  wrapper.style.display = 'none'; // 由 browser_action 控制显示隐藏
  wrapper.innerHTML = `
    <div class="rbac-tools">
      <span class="app-source">appSource: ${appSource} nodeId: <span class="node-id">${nodeId}</span></span>
      <button class="rbac-button rbac-export">1. 导出</button>
      <button class="rbac-button rbac-copy">2. 复制</button>
      <button class="rbac-button rbac-diff">3. 比较</button>
      <button class="rbac-button rbac-import">4. 导入</button>
      <button class="rbac-button rbac-remove">删除</button>
      <button class="rbac-button rbac-input">显示/隐藏</button>
    </div>
    <div class="rbac-tree" style="display:none">
      <textarea></textarea>
    </div>
  `;
  document.body.appendChild(wrapper);
  var inputContainer = document.querySelector('.chrome-app-rbac .rbac-tree');

  document.querySelector('.chrome-app-rbac .rbac-export').onclick = function () {
    RBAC.export();
    inputContainer.style.display = 'block';
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

  document.querySelector('.chrome-app-rbac .rbac-remove').onclick = function () {
    if (confirm('确定要删除选中节点的全部子节点吗？')) {
      RBAC.remove();
    }
  }
  document.querySelector('.chrome-app-rbac .rbac-input').onclick = function () {
    inputContainer.style.display = inputContainer.style.display === 'none' ? 'block' : 'none';
  }

  document.querySelector('.ui-tree-node').onclick = function (e) {
    var selectedNode = document.querySelector('.curSelectedNode a[node-id]');
    if (selectedNode) {
      nodeId = selectedNode.getAttribute('node-id');
      document.querySelector('.app-source .node-id').innerHTML = nodeId;
    }
  }

  var input = document.querySelector('.chrome-app-rbac .rbac-tree textarea');

  function request(url, data) {
    return fetch(url, {
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        rbac_source: appSource,
      },
      credentials: 'include',
      method: 'post',
      body: JSON.stringify(data),
    }).then(response => response.json())
  }

  // 查询权限树
  function exportRbac() {
    return request('/rbac/web/uri/queryTree/v1', {
      id: nodeId,
      appSource,
    });
  }

  function rbacTreeToMap(res) {
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
  }

  function getRbacInputValue() {
    try {
      var res = JSON.parse(input.value);
    } catch (e) {
      alert(`权限数据解析错误: ${e}`);
    }
    return res;
  }

  var RBAC = {
    export() {
      exportRbac().then(res => {
        localStorage.setItem(`export_rbac_tree_${appSource}`, JSON.stringify(res));
        input.value = JSON.stringify(res, null, 4);
      });
    },
    diff() {
      exportRbac().then(ret => {
        var oldRbacMap = rbacTreeToMap(ret);
        var newRbacMap = rbacTreeToMap(getRbacInputValue());
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
    importRbacItem(item, parentItem = { id: nodeId }, previousItem = { sort: -1 }) {
      const url = '/rbac/web/uri/save/v1';
      return request(url, {
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
    import(childList) {
      var res = getRbacInputValue();
      exportRbac().then(ret => {
        // 导入前暂存数据，误操作恢复
        localStorage.setItem(`before_import_rbac_tree_${appSource}`, JSON.stringify(ret));
        return this.importRbacList(res.data).then(() => {
          alert('导入成功！');
          location.reload(true)
        }).catch(e => alert(`导入异常: ${e}`));
      }).catch(e => alert(`导出异常 ${e}`));
    },
    remove() {
      exportRbac().then(res => {
        localStorage.setItem(`delete_rbac_tree_${appSource}_${nodeId}`, JSON.stringify(res));
        Promise.all(res.data.map(item => request('/rbac/web/uri/delete/v1', {
          appSource: appSource,
          uriId: item.id,
        }))).then(rets => {
          alert('删除成功！');
          location.reload();
        });
      });
    }
  };
}

