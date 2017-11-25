"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var mind_map_node_1 = require("./mind-map-node");
exports.customizeUtil = {
    is_node: function (node) {
        return node instanceof mind_map_node_1.MindMapNode;
    },
    ajax: {
        _xhr: function () {
            var xhr = null;
            if (config_1.$win.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            }
            else {
                try {
                    xhr = new ActiveXObject('Microsoft.XMLHTTP');
                }
                catch (e) { }
            }
            return xhr;
        },
        _eurl: function (url) {
            return encodeURIComponent(url);
        },
        request: function (url, param, method, callback, fail_callback) {
            var a = exports.customizeUtil.ajax;
            var p = null;
            var tmp_param = [];
            for (var k in param) {
                tmp_param.push(a._eurl(k) + '=' + a._eurl(param[k]));
            }
            if (tmp_param.length > 0) {
                p = tmp_param.join('&');
            }
            var xhr = a._xhr();
            if (!xhr) {
                return;
            }
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200 || xhr.status == 0) {
                        if (typeof callback === 'function') {
                            var data = exports.customizeUtil.json.string2json(xhr.responseText);
                            if (data != null) {
                                callback(data);
                            }
                            else {
                                callback(xhr.responseText);
                            }
                        }
                    }
                    else {
                        if (typeof fail_callback === 'function') {
                            fail_callback(xhr);
                        }
                        else {
                            config_1.logger.error('xhr request failed.', xhr);
                        }
                    }
                }
            };
            method = method || 'GET';
            xhr.open(method, url, true);
            xhr.setRequestHeader('If-Modified-Since', '0');
            if (method == 'POST') {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
                xhr.send(p);
            }
            else {
                xhr.send();
            }
        },
        get: function (url, callback) {
            return exports.customizeUtil.ajax.request(url, {}, 'GET', callback);
        },
        post: function (url, param, callback) {
            return exports.customizeUtil.ajax.request(url, param, 'POST', callback);
        }
    },
    dom: {
        addEvent: function (t, e, h) {
            if (!!t.addEventListener) {
                t.addEventListener(e, h, false);
            }
            else {
                t.attachEvent('on' + e, h);
            }
        }
    },
    canvas: {
        bezierto: function (ctx, x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.bezierCurveTo(x1 + (x2 - x1) * 2 / 3, y1, x1, y2, x2, y2);
            ctx.stroke();
        },
        lineto: function (ctx, x1, y1, x2, y2) {
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        },
        clear: function (ctx, x, y, w, h) {
            ctx.clearRect(x, y, w, h);
        }
    },
    file: {
        read: function (file_data, fn_callback) {
            var reader = new FileReader();
            reader.onload = function () {
                if (typeof fn_callback === 'function') {
                    fn_callback(this.result, file_data.name);
                }
            };
            reader.readAsText(file_data);
        },
        save: function (file_data, type, name) {
            var blob;
            if (typeof config_1.$win.Blob === 'function') {
                blob = new Blob([file_data], { type: type });
            }
            else {
                var BlobBuilder = config_1.$win.BlobBuilder || config_1.$win.MozBlobBuilder || config_1.$win.WebKitBlobBuilder || config_1.$win.MSBlobBuilder;
                var bb = new BlobBuilder();
                bb.append(file_data);
                blob = bb.getBlob(type);
            }
            if (navigator.msSaveBlob) {
                navigator.msSaveBlob(blob, name);
            }
            else {
                var URL_1 = config_1.$win.URL || config_1.$win.webkitURL;
                var bloburl = URL_1.createObjectURL(blob);
                var anchor = config_1.$create('a');
                if ('download' in anchor) {
                    anchor.style.visibility = 'hidden';
                    anchor.href = bloburl;
                    anchor.download = name;
                    config_1.$document.body.appendChild(anchor);
                    var evt = config_1.$document.createEvent('MouseEvents');
                    evt.initEvent('click', true, true);
                    anchor.dispatchEvent(evt);
                    config_1.$document.body.removeChild(anchor);
                }
                else {
                    location.href = bloburl;
                }
            }
        }
    },
    json: {
        json2string: function (json) {
            if (!!JSON) {
                try {
                    var json_str = JSON.stringify(json);
                    return json_str;
                }
                catch (e) {
                    config_1.logger.warn(e);
                    config_1.logger.warn('can not convert to string');
                    return null;
                }
            }
        },
        string2json: function (json_str) {
            if (!!JSON) {
                try {
                    var json = JSON.parse(json_str);
                    return json;
                }
                catch (e) {
                    config_1.logger.warn(e);
                    config_1.logger.warn('can not parse to json');
                    return null;
                }
            }
        },
        merge: function (b, a) {
            for (var o in a) {
                if (o in b) {
                    if (typeof b[o] === 'object' &&
                        Object.prototype.toString.call(b[o]).toLowerCase() == '[object object]' && !b[o].length) {
                        exports.customizeUtil.json.merge(b[o], a[o]);
                    }
                    else {
                        b[o] = a[o];
                    }
                }
                else {
                    b[o] = a[o];
                }
            }
            return b;
        }
    },
    uuid: {
        newid: function () {
            return (new Date().getTime().toString(16) + Math.random().toString(16).substr(2)).substr(2, 16);
        }
    },
    text: {
        isEmpty: function (s) {
            if (!s) {
                return true;
            }
            return s.replace(/\s*/, '').length == 0;
        }
    }
};
