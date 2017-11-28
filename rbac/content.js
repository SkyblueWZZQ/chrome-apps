if (/[&?]appSource=([^&]+)/.exec(location.search)) {
  var ROOT_ID = 0;
  var appSource = RegExp.$1;
  var nodeId = ROOT_ID;
  var toolsWrapper = document.createElement('div');
  toolsWrapper.className = 'chrome-rbac-tools';
  toolsWrapper.innerHTML = `
    节点ID: <span class="chrome-rbac-node-id">${nodeId}</span>
    <button class="chrome-rbac-button chrome-rbac-remove-children">删除子节点</button>
    <button class="chrome-rbac-button chrome-rbac-export-children">导出子节点</button>
    <button class="chrome-rbac-button chrome-rbac-export">导出节点</button>
    <button class="chrome-rbac-button chrome-rbac-import">导入</button>
  `;
  var modalWrapper = document.createElement('div');
  modalWrapper.style.display = 'none';
  modalWrapper.className = 'chrome-rbac-modal';
  modalWrapper.innerHTML = `
    <textarea class="chrome-rbac-textarea"></textarea>
    <div class="chrome-rbac-modal-tools">
      <button class="chrome-rbac-modal-button chrome-rbac-close">关闭</button>
      <button class="chrome-rbac-modal-button chrome-rbac-copy">复制</button>
      <button class="chrome-rbac-modal-button chrome-rbac-confirm-import">确认导入到选中节点</button>
    </div>
  `;
  document.body.appendChild(toolsWrapper);
  document.body.appendChild(modalWrapper);
  var modalInput = document.querySelector('.chrome-rbac-textarea');
  var importButton = document.querySelector('.chrome-rbac-confirm-import');

  function showModal(content = '') {
    modalInput.value = content;
    modalWrapper.style.display = '';
    importButton.style.display = content ? 'none' : '';
  }
  function hideModal() {
    modalWrapper.style.display = 'none';
  }
  document.querySelector('.chrome-rbac-remove-children').onclick = function () {
    if (confirm('确定要删除选中节点的全部子节点吗？')) {
      RBAC.remove();
    }
  }
  document.querySelector('.chrome-rbac-close').onclick = function () {
    hideModal();
  }
  document.querySelector('.chrome-rbac-copy').onclick = function () {
    modalInput.focus();
    modalInput.select();
    document.execCommand('copy');
    hideModal();
  }
  document.querySelector('.chrome-rbac-export-children').onclick = function () {
    RBAC.exportChildren();
  }
  document.querySelector('.chrome-rbac-export').onclick = function () {
    RBAC.export();
  }
  document.querySelector('.chrome-rbac-import').onclick = function () {
    showModal();
  }
  document.querySelector('.chrome-rbac-confirm-import').onclick = function () {
    RBAC.check(function () {
      RBAC.import();
    });
  }
  document.querySelector('.ui-tree-node').onclick = function (e) {
    var selectedNode = document.querySelector('.curSelectedNode a[node-id]');
    if (selectedNode) {
      nodeId = selectedNode.getAttribute('node-id');
      document.querySelector('.chrome-rbac-node-id').innerHTML = nodeId;
    }
  }
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
  function exportRbac(id) {
    return request('/rbac/web/uri/queryTree/v1', {
      id: id !== undefined ? id : nodeId,
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
        map[item.path] = item;
      }
    }
    processList(res.data);
    return map;
  }

  function getRbacInputValue() {
    try {
      var res = JSON.parse(modalInput.value);
    } catch (e) {
      alert(`权限数据解析错误: ${e}`);
    }
    return res;
  }

  function getRbacNode(list) {
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      if (item.id == nodeId) {
        return item;
      } else if (item.childList.length > 0) {
        var subItem = getRbacNode(item.childList);
        if (subItem) {
          return subItem;
        }
      }
    }
  }

  var RBAC = {
    export() {
      if (nodeId == 0) {
        return alert('根节点无法导出，只能导出子节点');
      }
      exportRbac(0).then(res => {
        var node = getRbacNode(res.data);
        res.data = [node];
        var rbacTreeData = JSON.stringify(res, null, 4);
        localStorage.setItem(`export_rbac_tree_${appSource}`, rbacTreeData);
        showModal(rbacTreeData);
      });
    },
    exportChildren() {
      exportRbac().then(res => {
        var rbacTreeData = JSON.stringify(res, null, 4);
        localStorage.setItem(`export_rbac_tree_${appSource}`, rbacTreeData);
        showModal(rbacTreeData);
      });
    },
    check(callback) {
      exportRbac(0).then(ret => {
        var oldRbacMap = rbacTreeToMap(ret);
        var newRbacMap = rbacTreeToMap(getRbacInputValue());
        var diffList = [];
        Object.keys(oldRbacMap).forEach(url => {
          if (newRbacMap[url]) {
            diffList.push(oldRbacMap[url]);
          }
        })
        if (diffList.length > 0) {
          localStorage.setItem(`diff_rbac_tree_${appSource}`, JSON.stringify(diffList));
          var diffUrlList = diffList.map(item => ('名称：' + item.treeName + '\t路径：' + item.path));
          alert(`有 ${diffUrlList.length} 项权限重复\n${diffUrlList.join('\n')}`);
        } else {
          if (callback) {
            callback();
          }
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
    import() {
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

