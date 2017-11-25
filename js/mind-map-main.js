"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var util_1 = require("./util");
var shortcut_provider_1 = require("./shortcut-provider");
var config_1 = require("./config");
var data_provider_1 = require("./data-provider");
var layout_provider_1 = require("./layout-provider");
var customize_format_1 = require("./customize-format");
var view_provider_1 = require("./view-provider");
var Subject_1 = require("rxjs/Subject");
var MindMapMain = (function () {
    function MindMapMain(options) {
        this.version = config_1.VERSION;
        this.opts = {};
        this.options = this.opts;
        this.inited = false;
        this.eventHandles = [];
        this.mindMapDataTransporter = new Subject_1.Subject();
        this.mindMapDataReceiver = new Subject_1.Subject();
        util_1.customizeUtil.json.merge(this.opts, config_1.DEFAULT_OPTIONS);
        util_1.customizeUtil.json.merge(this.opts, options);
        if (this.opts.container == null || this.opts.container.length == 0) {
            config_1.logger.error('the options.container should not be empty.');
            return;
        }
        this.init();
    }
    MindMapMain.prototype.init = function () {
        if (this.inited) {
            return;
        }
        this.inited = true;
        var opts = this.options;
        var optsLayout = {
            mode: opts.mode,
            hspace: opts.layout.hspace,
            vspace: opts.layout.vspace,
            pspace: opts.layout.pspace
        };
        var optsView = {
            container: opts.container,
            supportHtml: opts.supportHtml,
            hmargin: opts.view.hmargin,
            vmargin: opts.view.vmargin,
            lineWidth: opts.view.lineWidth,
            lineColor: opts.view.lineColor,
        };
        this.data = new data_provider_1.MindMapDataProvider(this);
        this.layout = new layout_provider_1.LayoutProvider(this, optsLayout);
        this.view = new view_provider_1.ViewProvider(this, optsView);
        this.shortcut = new shortcut_provider_1.ShortcutProvider(this, opts.shortcut);
        this.data.init();
        this.layout.init();
        this.view.init();
        this.shortcut.init();
        this.eventBind();
        MindMapMain.initPluginsNextTick(this);
    };
    MindMapMain.prototype.enableEdit = function () {
        this.options.editable = true;
    };
    MindMapMain.prototype.disableEdit = function () {
        this.options.editable = false;
    };
    MindMapMain.prototype.enableEventHandle = function (event_handle) {
        this.options.defaultEventHandle['can' + event_handle + 'Handle'] = true;
    };
    MindMapMain.prototype.disableEventHandle = function (event_handle) {
        this.options.defaultEventHandle['can' + event_handle + 'Handle'] = false;
    };
    MindMapMain.prototype.getEditable = function () {
        return this.options.editable;
    };
    MindMapMain.prototype.getNodeEditable = function (node) {
        return !(!this.options.canRootNodeEditable && node.isroot);
    };
    MindMapMain.prototype.setTheme = function (theme) {
        var theme_old = this.options.theme;
        this.options.theme = (!!theme) ? theme : null;
        if (theme_old != this.options.theme) {
            this.view.resetTheme();
            this.view.resetCustomStyle();
        }
    };
    MindMapMain.prototype.eventBind = function () {
        this.view.addEvent(this, 'mousedown', this.mouseDownHandle);
        this.view.addEvent(this, 'click', this.clickHandle);
        this.view.addEvent(this, 'dblclick', this.dblclickHandle);
    };
    MindMapMain.prototype.mouseDownHandle = function (e) {
        if (!this.options.defaultEventHandle.canHandleMouseDown) {
            return;
        }
        var element = e.target || event.srcElement;
        var nodeid = this.view.getBindedNodeId(element);
        if (!!nodeid) {
            this.selectNode(nodeid);
        }
        else {
            this.selectClear();
        }
        if (typeof this.options.afterMouseDown === 'function'){
            this.options.afterMouseDown(e)
        }
    };
    MindMapMain.prototype.clickHandle = function (e) {
        if (!this.options.defaultEventHandle.canHandleClick) {
            return;
        }
        var element = e.target || event.srcElement;
        var isexpander = this.view.isExpander(element);
        if (isexpander) {
            var nodeid = this.view.getBindedNodeId(element);
            if (!!nodeid) {
                this.toggleNode(nodeid);
            }
        }
        if (typeof this.options.afterClick === 'function'){
            this.options.afterClick(e)
        }
    };
    MindMapMain.prototype.dblclickHandle = function (e) {
        if (!this.options.defaultEventHandle.canHandleDblclick) {
            return;
        }
        if (this.getEditable()) {
            var element = e.target || event.srcElement;
            var nodeid = this.view.getBindedNodeId(element);
            if (!!nodeid && nodeid !== 'root') {
                this.beginEdit(nodeid);
            }
        }
        if (typeof this.options.afterDbClick === 'function'){
            this.options.afterDbClick(e)
        }
    };
    MindMapMain.prototype.getSelectTypesByHierarchyRule = function (node) {
        if (!this.options.hierarchyRule) {
            return null;
        }
        var types = [];
        types.push(_.get(node, 'selectedType'));
        var parent_select_type = _.get(node, 'parent.selectedType');
        var current_rule = _.find(this.options.hierarchyRule, { name: parent_select_type });
        if (!current_rule) {
            current_rule = this.options.hierarchyRule.ROOT;
        }
        current_rule.getChildren().forEach(function (children) {
            types.push(children.name);
        });
        return _.compact(types);
    };
    MindMapMain.prototype.beginEdit = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.beginEdit(this.getNode(node));
        }
        if (this.getEditable() && this.getNodeEditable(node)) {
            if (!!node) {
                this.view.editNodeBegin(node, this.getSelectTypesByHierarchyRule(node));
            }
            else {
                config_1.logger.error('the node can not be found');
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable.');
            return;
        }
    };
    MindMapMain.prototype.endEdit = function () {
        this.view.editNodeEnd();
    };
    MindMapMain.prototype.toggleNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.toggleNode(this.getNode(node));
        }
        if (!!node) {
            if (node.isroot) {
                return;
            }
            this.view.saveLocation(node);
            this.layout.toggleNode(node);
            this.view.relayout();
            this.view.restoreLocation(node);
        }
        else {
            config_1.logger.error('the node can not be found.');
        }
    };
    MindMapMain.prototype.expandNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.expandNode(this.getNode(node));
        }
        if (!!node) {
            if (node.isroot) {
                return;
            }
            this.view.saveLocation(node);
            this.layout.expandNode(node);
            this.view.relayout();
            this.view.restoreLocation(node);
        }
        else {
            config_1.logger.error('the node can not be found.');
        }
    };
    MindMapMain.prototype.collapseNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.collapseNode(this.getNode(node));
        }
        if (!!node) {
            if (node.isroot) {
                return;
            }
            this.view.saveLocation(node);
            this.layout.collapseNode(node);
            this.view.relayout();
            this.view.restoreLocation(node);
        }
        else {
            config_1.logger.error('the node can not be found.');
        }
    };
    MindMapMain.prototype.expandAll = function () {
        this.layout.expandAll();
        this.view.relayout();
    };
    MindMapMain.prototype.collapseAll = function () {
        this.layout.collapseAll();
        this.view.relayout();
    };
    MindMapMain.prototype.expandToDepth = function (depth) {
        this.layout.expandToDepth(depth);
        this.view.relayout();
    };
    MindMapMain.prototype._reset = function () {
        this.view.reset();
        this.layout.reset();
        this.data.reset();
    };
    MindMapMain.prototype._show = function (mind) {
        var m = mind || customize_format_1.customizeFormat.node_array.example;
        this.mind = this.data.load(m);
        if (!this.mind) {
            config_1.logger.error('data.load error');
            return;
        }
        else {
            config_1.logger.debug('data.load ok');
        }
        this.view.load();
        config_1.logger.debug('view.load ok');
        this.layout.layout();
        config_1.logger.debug('layout.layout ok');
        this.view.show(true);
        config_1.logger.debug('view.show ok');
        this.invokeEventHandleNextTick(MindMapMain.eventType.show, { data: [mind] });
    };
    MindMapMain.prototype.show = function (mind) {
        this._reset();
        this._show(mind);
    };
    MindMapMain.prototype.getMeta = function () {
        return {
            name: this.mind.name,
            author: this.mind.author,
            version: this.mind.version
        };
    };
    MindMapMain.prototype.getData = function (data_format) {
        var df = data_format || 'nodeTree';
        return this.data.getData(df);
    };
    MindMapMain.prototype.getDepth = function () {
        var currentData = this.getData().data;
        var getDepth = function (data) {
            var depth = 1;
            if (data.children && data.children[0]) {
                var childrenDepth = [];
                var childrenLength = data.children.length;
                for (var i = 0; i < childrenLength; i++) {
                    childrenDepth.push(getDepth(data.children[i]));
                }
                return depth + _.max(childrenDepth);
            }
            return depth;
        };
        return getDepth(currentData);
    };
    MindMapMain.prototype.getRoot = function () {
        return this.mind.root;
    };
    MindMapMain.prototype.getNode = function (nodeid) {
        return this.mind.getNode(nodeid);
    };
    MindMapMain.prototype.getCurrentHierarchyRule = function (parent_node) {
        if (!this.options.hierarchyRule) {
            return null;
        }
        if (parent_node.isroot) {
            return this.options.hierarchyRule.ROOT.getChildren()[0];
        }
        return _.find(this.options.hierarchyRule, { name: parent_node.selectedType }).getChildren()[0];
    };
    MindMapMain.prototype.addNode = function (parent_node, nodeid, topic, data) {
        data = data || {};
        data.isCreated = true;
        if (this.options.depth && (parent_node.level >= this.options.depth)) {
            throw new Error('over depth');
        }
        if (this.getEditable()) {
            var current_rule = this.getCurrentHierarchyRule(parent_node);
            var selected_type = current_rule && current_rule.name;
            if (!selected_type && this.options.hierarchyRule) {
                throw new Error('forbidden add');
            }
            else {
                topic = topic || selected_type + "\u7684\u540D\u79F0";
            }
            if (current_rule.backgroundColor) {
                data['background-color'] = current_rule.backgroundColor;
            }
            if (current_rule.color) {
                data['color'] = current_rule.color;
            }
            var node = this.mind.addNode(parent_node, nodeid, topic, data, null, null, null, selected_type);
            if (!!node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.view.resetNodeCustomStyle(node);
                this.expandNode(parent_node);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'addNode',
                    data: [parent_node.id, nodeid, topic, data],
                    node: nodeid
                });
            }
            return node;
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.insertNodeBefore = function (node_before, nodeid, topic, data) {
        if (this.getEditable()) {
            var beforeid = util_1.customizeUtil.is_node(node_before) ? node_before.id : node_before;
            var node = this.mind.insertNodeBefore(node_before, nodeid, topic, data);
            if (!!node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'insertNodeBefore',
                    data: [beforeid, nodeid, topic, data],
                    node: nodeid
                });
            }
            return node;
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.insertNodeAfter = function (node_after, nodeid, topic, data) {
        if (this.getEditable()) {
            var node = this.mind.insertNodeAfter(node_after, nodeid, topic, data);
            if (!!node) {
                this.view.addNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'insertNodeAfter',
                    data: [node_after.id, nodeid, topic, data],
                    node: nodeid
                });
            }
            return node;
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.removeNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.removeNode(this.getNode(node));
        }
        if (this.getEditable()) {
            if (!!node) {
                if (node.isroot) {
                    config_1.logger.error('fail, can not remove root node');
                    return false;
                }
                var nodeid = node.id;
                var parentid = node.parent.id;
                var parent_node = this.getNode(parentid);
                this.view.saveLocation(parent_node);
                this.view.removeNode(node);
                this.mind.removeNode(node);
                this.layout.layout();
                this.view.show(false);
                this.view.restoreLocation(parent_node);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'removeNode',
                    data: [nodeid],
                    node: parentid
                });
            }
            else {
                config_1.logger.error('fail, node can not be found');
                return false;
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return;
        }
    };
    MindMapMain.prototype.updateNode = function (nodeid, topic, selected_type) {
        if (this.getEditable()) {
            if (util_1.customizeUtil.text.isEmpty(topic)) {
                config_1.logger.warn('fail, topic can not be empty');
                return;
            }
            var node = this.getNode(nodeid);
            if (!!node) {
                if (node.topic === topic && node.selectedType === selected_type) {
                    config_1.logger.info('nothing changed');
                    this.view.updateNode(node);
                    return;
                }
                node.topic = topic;
                node.selectedType = selected_type;
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'updateNode',
                    data: [nodeid, topic],
                    node: nodeid
                });
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return;
        }
    };
    MindMapMain.prototype.moveNode = function (nodeid, beforeid, parentid, direction) {
        if (this.getEditable()) {
            var node = this.mind.moveNode(nodeid, beforeid, parentid, direction);
            if (!!node) {
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
                this.invokeEventHandleNextTick(MindMapMain.eventType.edit, {
                    evt: 'moveNode',
                    data: [nodeid, beforeid, parentid, direction],
                    node: nodeid
                });
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return;
        }
    };
    MindMapMain.prototype.selectNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.selectNode(this.getNode(node));
        }
        if (!node || !this.layout.isVisible(node)) {
            return;
        }
        this.mind.selected = node;
        if (!!node) {
            this.view.selectNode(node);
        }
    };
    MindMapMain.prototype.getSelectedNode = function () {
        if (!!this.mind) {
            return this.mind.selected;
        }
        else {
            return null;
        }
    };
    MindMapMain.prototype.selectClear = function () {
        if (!!this.mind) {
            this.mind.selected = null;
            this.view.selectClear();
        }
    };
    MindMapMain.prototype.isNodeVisible = function (node) {
        return this.layout.isVisible(node);
    };
    MindMapMain.prototype.findNodeBefore = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.findNodeBefore(this.getNode(node));
        }
        if (!node || node.isroot) {
            return null;
        }
        var n = null;
        if (node.parent.isroot) {
            var c = node.parent.children;
            var prev = null;
            var ni = null;
            for (var i = 0; i < c.length; i++) {
                ni = c[i];
                if (node.direction === ni.direction) {
                    if (node.id === ni.id) {
                        n = prev;
                    }
                    prev = ni;
                }
            }
        }
        else {
            n = this.mind.getNodeBefore(node);
        }
        return n;
    };
    MindMapMain.prototype.findNodeAfter = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.findNodeAfter(this.getNode(node));
        }
        if (!node || node.isroot) {
            return null;
        }
        var n = null;
        if (node.parent.isroot) {
            var c = node.parent.children;
            var getthis = false;
            var ni = null;
            for (var i = 0; i < c.length; i++) {
                ni = c[i];
                if (node.direction === ni.direction) {
                    if (getthis) {
                        n = ni;
                        break;
                    }
                    if (node.id === ni.id) {
                        getthis = true;
                    }
                }
            }
        }
        else {
            n = this.mind.getNodeAfter(node);
        }
        return n;
    };
    MindMapMain.prototype.setNodeColor = function (nodeid, bgcolor, fgcolor) {
        if (this.getEditable()) {
            var node = this.mind.getNode(nodeid);
            if (!!node) {
                if (!!bgcolor) {
                    node.data['background-color'] = bgcolor;
                }
                if (!!fgcolor) {
                    node.data['foreground-color'] = fgcolor;
                }
                this.view.resetNodeCustomStyle(node);
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.setNodeFontStyle = function (nodeid, size, weight, style) {
        if (this.getEditable()) {
            var node = this.mind.getNode(nodeid);
            if (!!node) {
                if (!!size) {
                    node.data['font-size'] = size;
                }
                if (!!weight) {
                    node.data['font-weight'] = weight;
                }
                if (!!style) {
                    node.data['font-style'] = style;
                }
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.setNodeBackgroundImage = function (nodeid, image, width, height, rotation) {
        if (this.getEditable()) {
            var node = this.mind.getNode(nodeid);
            if (!!node) {
                if (!!image) {
                    node.data['background-image'] = image;
                }
                if (!!width) {
                    node.data['width'] = width;
                }
                if (!!height) {
                    node.data['height'] = height;
                }
                if (!!rotation) {
                    node.data['background-rotation'] = rotation;
                }
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.setNodeBackgroundRotation = function (nodeid, rotation) {
        if (this.getEditable()) {
            var node = this.mind.getNode(nodeid);
            if (!!node) {
                if (!node.data['background-image']) {
                    config_1.logger.error('fail, only can change rotation angle of node with background image');
                    return null;
                }
                node.data['background-rotation'] = rotation;
                this.view.resetNodeCustomStyle(node);
                this.view.updateNode(node);
                this.layout.layout();
                this.view.show(false);
            }
        }
        else {
            config_1.logger.error('fail, this mind map is not editable');
            return null;
        }
    };
    MindMapMain.prototype.resize = function () {
        this.view.resize();
    };
    MindMapMain.prototype.addEventListener = function (callback) {
        if (typeof callback === 'function') {
            this.eventHandles.push(callback);
        }
    };
    MindMapMain.prototype.invokeEventHandleNextTick = function (type, data) {
        var j = this;
        config_1.$win.setTimeout(function () {
            j.invokeEventHandle(type, data);
        }, 0);
    };
    MindMapMain.prototype.invokeEventHandle = function (type, data) {
        var l = this.eventHandles.length;
        for (var i = 0; i < l; i++) {
            this.eventHandles[i](type, data);
        }
    };
    return MindMapMain;
}());
exports.MindMapMain = MindMapMain;
MindMapMain.direction = { left: -1, center: 0, right: 1 };
MindMapMain.eventType = { show: 1, resize: 2, edit: 3, select: 4 };
MindMapMain.plugin = function (name, init) {
    this.name = name;
    this.init = init;
};
MindMapMain.plugins = [];
MindMapMain.registerPlugin = function (plugin) {
    if (plugin instanceof MindMapMain.plugin) {
        MindMapMain.plugins.push(plugin);
    }
};
MindMapMain.initPluginsNextTick = function (sender) {
    config_1.$win.setTimeout(function () {
        MindMapMain.initPlugins(sender);
    }, 0);
};
MindMapMain.initPlugins = function (sender) {
    var l = MindMapMain.plugins.length;
    var fn_init = null;
    for (var i = 0; i < l; i++) {
        fn_init = MindMapMain.plugins[i].init;
        if (typeof fn_init === 'function') {
            fn_init(sender);
        }
    }
};
MindMapMain.show = function (options, mind) {
    var _jm = new MindMapMain(options);
    _jm.show(mind);
    return _jm;
};
