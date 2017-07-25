if (/[&?]appSource=([^&]+)/.exec(location.search)) {
  var appSource = RegExp.$1;
  var nodeId = 0;
  var wrapper = document.createElement('div');
  wrapper.className = 'chrome-app-rbac';
  wrapper.style.display = 'none'; // 由 browser_action 控制显示隐藏
  wrapper.innerHTML = `
    <div class="tools">
      <span class="app-source">项目：${appSource} node-id: <span class="node-id">${nodeId}</span></span>
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
    import(childList) {
      try {
        var res = JSON.parse(input.value);
        this.exportRbac().then(ret => {
          // 导入前暂存数据，误操作恢复
          localStorage.setItem(`before_import_rbac_tree_${appSource}`, JSON.stringify(ret));
          return this.importRbacList(res.data).then(() => {
            alert('导入成功！');
            location.reload(true)
          }).catch(e => alert(`导入异常: ${e}`));
        });
      } catch (e) {
        alert(`权限数据解析错误: ${e}`);
      }
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

