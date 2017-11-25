"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var util_1 = require("./util");
var config_1 = require("./config");
var mind_map_main_1 = require("./mind-map-main");
var ShortcutProvider = (function () {
    function ShortcutProvider(jm, options) {
        this._mapping = {};
        this.jm = jm;
        this.opts = options;
        this.mapping = options.mapping;
        this.handles = options.handles;
    }
    ShortcutProvider.prototype.init = function () {
        util_1.customizeUtil.dom.addEvent(config_1.$document, 'keydown', this.handler.bind(this));
        this.handles['addchild'] = this.handleAddChild;
        this.handles['addbrother'] = this.handleAddBrother;
        this.handles['editnode'] = this.handleEditNode;
        this.handles['delnode'] = this.handleDelNode;
        this.handles['toggle'] = this.handleToggle;
        this.handles['up'] = this.handleUp;
        this.handles['down'] = this.handleDown;
        this.handles['left'] = this.handleLeft;
        this.handles['right'] = this.handleRight;
        for (var handle in this.mapping) {
            if (!!this.mapping[handle] && (handle in this.handles)) {
                this._mapping[this.mapping[handle]] = this.handles[handle];
            }
        }
    };
    ShortcutProvider.prototype.enableShortcut = function () {
        this.opts.enable = true;
    };
    ShortcutProvider.prototype.disableShortcut = function () {
        this.opts.enable = false;
    };
    ShortcutProvider.prototype.handler = function (e) {
        if (this.jm.view.isEditing()) {
            return;
        }
        var evt = e || event;
        if (!this.opts.enable) {
            return true;
        }
        var kc = evt.keyCode;
        if (kc in this._mapping) {
            this._mapping[kc].call(this, this.jm, e);
        }
    };
    ShortcutProvider.prototype.handleAddChild = function (_jm, e) {
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node) {
            var nodeid = util_1.customizeUtil.uuid.newid();
            var node = _jm.addNode(selected_node, nodeid, 'New Node');
            if (!!node) {
                _jm.selectNode(nodeid);
                _jm.beginEdit(nodeid);
            }
        }
    };
    ShortcutProvider.prototype.handleAddBrother = function (_jm, e) {
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node && !selected_node.isroot) {
            var nodeid = util_1.customizeUtil.uuid.newid();
            var node = _jm.insertNodeAfter(selected_node, nodeid, 'New Node');
            if (!!node) {
                _jm.selectNode(nodeid);
                _jm.beginEdit(nodeid);
            }
        }
    };
    ShortcutProvider.prototype.handleEditNode = function (_jm, e) {
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node) {
            _jm.beginEdit(selected_node);
        }
    };
    ShortcutProvider.prototype.handleDelNode = function (_jm, e) {
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node && !selected_node.isroot) {
            _jm.selectNode(selected_node.parent);
            _jm.removeNode(selected_node);
        }
    };
    ShortcutProvider.prototype.handleToggle = function (_jm, e) {
        var evt = e || event;
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node) {
            _jm.toggleNode(selected_node.id);
            evt.stopPropagation();
            evt.preventDefault();
        }
    };
    ShortcutProvider.prototype.handleUp = function (_jm, e) {
        var evt = e || event;
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node) {
            var up_node = _jm.findNodeBefore(selected_node);
            if (!up_node) {
                var np = _jm.findNodeBefore(selected_node.parent);
                if (!!np && np.children.length > 0) {
                    up_node = np.children[np.children.length - 1];
                }
            }
            if (!!up_node) {
                _jm.selectNode(up_node);
            }
            evt.stopPropagation();
            evt.preventDefault();
        }
    };
    ShortcutProvider.prototype.handleDown = function (_jm, e) {
        var evt = e || event;
        var selected_node = _jm.getSelectedNode();
        if (!!selected_node) {
            var down_node = _jm.findNodeAfter(selected_node);
            if (!down_node) {
                var np = _jm.findNodeAfter(selected_node.parent);
                if (!!np && np.children.length > 0) {
                    down_node = np.children[0];
                }
            }
            if (!!down_node) {
                _jm.selectNode(down_node);
            }
            evt.stopPropagation();
            evt.preventDefault();
        }
    };
    ShortcutProvider.prototype.handleLeft = function (_jm, e) {
        this._handleDirection(_jm, e, mind_map_main_1.MindMapMain.direction.left);
    };
    ShortcutProvider.prototype.handleRight = function (_jm, e) {
        this._handleDirection(_jm, e, mind_map_main_1.MindMapMain.direction.right);
    };
    ShortcutProvider.prototype._handleDirection = function (_jm, e, d) {
        var evt = e || event;
        var selected_node = _jm.getSelectedNode();
        var node = null;
        if (!!selected_node) {
            if (selected_node.isroot) {
                var c = selected_node.children;
                var children = [];
                for (var i = 0; i < c.length; i++) {
                    if (c[i].direction === d) {
                        children.push(i);
                    }
                }
                node = c[children[Math.floor((children.length - 1) / 2)]];
            }
            else if (selected_node.direction === d) {
                var children = selected_node.children;
                var childrencount = children.length;
                if (childrencount > 0) {
                    node = children[Math.floor((childrencount - 1) / 2)];
                }
            }
            else {
                node = selected_node.parent;
            }
            if (!!node) {
                _jm.selectNode(node);
            }
            evt.stopPropagation();
            evt.preventDefault();
        }
    };
    return ShortcutProvider;
}());
exports.ShortcutProvider = ShortcutProvider;
