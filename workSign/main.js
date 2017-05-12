alertMock();
window.onload = function() {
    createInfoArea();
    var qssoButton = document.querySelector('#qsso-login');
    if (qssoButton) {
        if (localStorage.getItem('AUTO_LOGIN')) {
            logger('auto login');
            qssoButton.click();
        }
    }
    var checkbox = document.querySelector('#isSelected');
    if (checkbox) {
        checkbox.checked = true;
    }
}

function createInfoArea() {
    var div = document.createElement('div');
    div.style.position = "absolute";
    div.style.top = "90px";
    div.style.width = "500px";
    div.style.right = "0px";
    div.style.textAlign = "right";
    var autoLoginText = localStorage.getItem('AUTO_LOGIN') ? '不自动登录' : '自动登录';
    div.innerHTML = [
        '<input type="button" id="official_site" value="市局网站" title="默认用户名：本人18位身份证号\n默认密码：身份证后6位+a" />',
        '<input type="button" id="clear_log" value="清空日志" />',
        '<input type="button" id="auto_login" value="' + autoLoginText + '" />',
        '<input type="number" id="countslimit" title="最多可报名人数" value="21" style="width:35px;margin-bottom:0px;" />',
        '<input type="button" id="auto_sign" title="点击后开始自动检查并自动报名" value="自动报名" style="height:40px;font-size:26px;" />',
        '<input type="button" onclick="location.reload(true)" value="刷新页面" />',
        '<textarea id="log_info" style="position:absolute;top:65px;right:0;width:100%;height:140px;font-size:12px;"></textarea>'
    ].join(' ');
    document.body.appendChild(div);
    var log = JSON.parse(localStorage.getItem('LOG_INFO') || '[]');
    saveLog(log);
    document.querySelector('#official_site').onclick = function() {
        window.open('http://219.232.200.39/uamsso/')
    };
    document.querySelector('#clear_log').onclick = function() {
        var logText = document.querySelector('#log_info').value.trim();
        saveLog([]);
    };
    document.querySelector('#auto_login').onclick = function() {
        if (localStorage.getItem('AUTO_LOGIN')) {
            logger('close login');
            localStorage.removeItem('AUTO_LOGIN');
            this.value = '自动登录';
        } else {
            logger('open login');
            localStorage.setItem('AUTO_LOGIN', 'true');
            this.value = '不自动登录';
        }
    };
    document.querySelector('#auto_sign').onclick = checkSignState;
}

var autoSignTimeout = null;

function checkSignState() {
    clearTimeout(autoSignTimeout);
    autoSignTimeout = setTimeout(checkSign, 100);
}

function alertMock() {
    window._alert = window.alert;
    window.alert = function(content) {
        logger(content);
        if (content == '报名成功' || content == '亲~本月报名人数已满，下个月加油！') {
            clearTimeout(autoSignTimeout);
            if(content == '报名成功'){
                window._alert('大功告成！');
            }else{
                var count = +document.querySelector("#countslimit").value;
                if(count < 24){
                    logger('娘的！！调整报名总数，继续报名 == ' + count);
                    document.querySelector("#countslimit").value = +document.querySelector("#countslimit").value + 1;
                    checkSignState();
                }else{
                    window._alert('悲剧啊，又没有报上名！');
                }
            }
        }
        if (content == '亲~本期次报名还没有开始,请耐心等待') {
            logger('自动检测报名状态。。')
            checkSignState();
        }
    };
}

function logger(content) {
    var log = JSON.parse(localStorage.getItem('LOG_INFO') || '[]');
    log.unshift(`[${new Date().toJSON()}] ${content}`);
    saveLog(log);
}

function saveLog(log) {
    document.querySelector('#log_info').value = log.join('\n');
    localStorage.setItem('LOG_INFO', JSON.stringify(log));
}

function ajaxReturn(data) {
    if (data.status == 2) {
        alert(data.message);
        var protocol = window.location.protocol;
        var host = window.location.host;
        var url = protocol + "//" + host + '/index.jsp';
        window.location.href = url;
        return false;
    }
    return true;
};

function checkSign() {
    var staffId = document.querySelector("#staffId").value;
    var rtxId = document.querySelector("#rtxId").value;
    if (staffId == null) {
        alert("传入的用户id不能为空");
    }

    fetch('/staff/entry.json?staffId=' + staffId, {
        credentials: 'include'
    }).then(function(res) {
        res.json().then(function(returnedData) {
            if (!ajaxReturn(returnedData)) {
                return;
            }
            if (returnedData != null && returnedData.data != null && returnedData.data.issueInfo != null) {
                if (returnedData.data.issueInfo.enrollRule != null) {
                    document.querySelector("#registerSpecification").innerHTML = returnedData.data.issueInfo.enrollRule + "<br>";
                }
                if (returnedData.data.issueInfo.enrollCondition != null) {
                    document.querySelector("#registerComment").innerHTML = returnedData.data.issueInfo.enrollCondition + "<br>";
                }
                if (returnedData.data.issueInfo.startTime != null && returnedData.data.issueInfo.endTime != null) {
                    //var issueTime = "<p>办理周期：" + returnedData.data.issueInfo.startTime + " ~ " + returnedData.data.issueInfo.endTime + "</p>";
                    //document.querySelector("#registerSpecification").innerHTML = issueTime;
                }
                if (returnedData.data.issueInfo.managerName != null) {
                    var manageMent = "<span><strong>" + returnedData.data.issueInfo.managerName + "</strong></span>";
                    //document.querySelector("#registerSpecification").innerHTML = manageMent;
                    document.querySelector("#Principal").innerHTML = manageMent;
                }
                if (returnedData.data.issueInfo.managerPhone != null) {
                    var telephone = "<span><strong>" + returnedData.data.issueInfo.managerPhone + "<strong></span>";
                    //document.querySelector("#registerSpecification").innerHTML = telephon;
                    document.querySelector("#telephone").innerHTML = telephone;
                }
                if (returnedData.data.issueInfo.issueName != null) {
                    document.querySelector("#resisterIssueName").innerHTML = returnedData.data.issueInfo.issueName;
                }

                var enrollState = returnedData.data.enrollState;
                if (enrollState != null) {
                    var stateMap = {
                        "报名已结束": "报名已经结束",
                        "未注册": "报名成功,《北京市工作居住证》系统注册中",
                        "完成注册": "注册已完成,请尽快完善系统,准备材料",
                        "报名失败": "报名失败,个税不符条件,待符合条件后重新报名",
                        "自动放弃": "逾期未提交材料,自动放弃",
                        "单位审核": "单位审核中",
                        "单位退回": "材料不齐,请1个月内尽快提交材料",
                        "人事局审核": "人事局审核中",
                        "人事局退回": "市局审核不通过",
                        "办理成功": "证件办理中",
                        "办理失败": "本次办理失败,请重新报名",
                        "领取证件": "制证已完成",
                    };
                    var registerState = stateMap[enrollState];
                    if (registerState) {
                        logger(registerState);
                    } else {
                        document.querySelector("#datestrs").value = returnedData.data.datestrs;
                        document.querySelector("#giveUps").value = returnedData.data.giveUps;
                        if (document.querySelector("#datestrs").value == "true") {
                            if (document.querySelector("#giveUps").value == "false") {
                                var registerState = " <div class=\"span4\"><div class=\"span3\" style=\"background: red ;width: 250px;height: 44px; \"><span class=\"registerStateSuccess\">逾期未提交材料,自动放弃</span></div></div> ";
                                document.querySelector("#registerIssueState").innerHTML = registerState;
                            } else {
                                document.querySelector("#remind").style.display = "block";
                                var registerState = " <input type=\"hidden\" name=\"counts\" id=\"counts\" value=\"\"><div id=\"registerIssueState\"><div class=\"span3\" id=\"staffState\"><input type=\"button\" class=\"btn btn-primary issuebutton  \" id=\"registerButton\"  onclick=\"register()\"  value=\"报 名\"></div></div>";
                                document.querySelector("#registerIssueState").innerHTML = registerState;
                                document.querySelector("#counts").value = returnedData.data.counts;
                                logger('当前报名人数：' + returnedData.data.counts + ', 开始自动报名');
                                sign();
                            }
                        } else {
                            logger("亲~本期次报名还没有开始,请耐心等待");
                            checkSignState();
                        }
                    }
                }
            } else {
                logger("系统出现异常请稍后重试！checkSign");
                checkSignState();
            }
        }).catch(function(e) {
            logger("系统出现异常请稍后重试！checkSign解析异常");
            setTimeout(checkSignState, 1000);
        });
    }).catch(function(e) {
        logger("访问服务器失败！checkSign");
        checkSignState();
    });
}

function sign() {
    if (document.querySelector("#isSelected").checked) {
        if (+document.querySelector("#counts").value >= (+document.querySelector("#countslimit").value)) {
            alert("亲~本月报名人数已满，下个月加油！");
        } else {
            var staffId = document.querySelector("#staffId").value;
            var rtxId = document.querySelector("#rtxId").value;
            fetch('/staff/apply.json?staffId=' + staffId + '&rtxId=' + rtxId, {
                credentials: 'include'
            }).then(function(res) {
                res.json().then(function(returnedData) {
                    document.querySelector("#state").value = returnedData.data.state;
                    if (!ajaxReturn(returnedData)) {
                        return;
                    }
                    alert(document.querySelector("#state").value);
                    if (document.querySelector("#state").value == "报名成功") {
                        if (returnedData != null && returnedData.status == 0) {
                            var registerState = " <div class=\"span3\"><div class=\"span3\" style=\"background: #EFFFE2 ;width: 350px;height: 44px; \"><span class=\"registerStateWaitFilter\">报名成功,《北京市工作居住证》系统注册中</span></div></div>";
                            document.querySelector("#registerIssueState").innerHTML = registerState;

                        } else {
                            alert("报名失败，系统中出现了异常。请一会重试");
                        }
                    }
                    document.querySelector("#state").value = "";
                }).catch(function(e) {
                    alert('访问服务器失败！解析异常');
                });

            }).catch(function(e) {
                alert('访问服务器失败！sign');
            });
        }
    } else {
        alert("请确定您是否阅读了报名细则，并选中");
    }
}