"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var config_1 = require("./config");
var util_1 = require("./util");
var mind_map_main_1 = require("./mind-map-main");
var ViewProvider = (function () {
    function ViewProvider(jm, options) {
        var _this = this;
        this.container = null;
        this.ePanel = null;
        this.eNodes = null;
        this.eCanvas = null;
        this.canvasCtx = null;
        this.size = { w: 0, h: 0 };
        this.selectedNode = null;
        this.editingNode = null;
        this.previousNode = null;
        this.opts = options;
        this.jm = jm;
        this.selectedOptions = this.jm.getSelectTypesByHierarchyRule();
        this.layout = jm.layout;
        this.jm.mindMapDataReceiver.subscribe(function (data) {
            _this.editNodeEnd(data);
        });
    }
    ViewProvider.get_select_option = function (value) {
        var eOption = config_1.$create('option');
        eOption.value = value;
        eOption.appendChild(config_1.$document.createTextNode(value));
        return eOption;
    };
    ;
    ViewProvider.prototype.init = function () {
        config_1.logger.debug('view.init');
        this.container = config_1.$get(this.opts.container);
        if (!this.container) {
            config_1.logger.error('the options.view.container was not be found in dom');
            return;
        }
        this.initView();
    };
    ViewProvider.prototype.initView = function () {
        this.ePanel = config_1.$create('div');
        this.eCanvas = config_1.$create('canvas');
        this.eNodes = config_1.$create('jmnodes');
        this.ePanel.className = 'jsmind-inner';
        this.ePanel.appendChild(this.eCanvas);
        this.ePanel.appendChild(this.eNodes);
        this.actualZoom = 1;
        this.zoomStep = 0.1;
        this.minZoom = 0.5;
        this.maxZoom = 2;
        this.addEventToCanvas();
        this.initSelect();
        this.initEditor();
        this.container.appendChild(this.ePanel);
        this.canvasCtx = this.eCanvas.getContext('2d');
    };
    ViewProvider.prototype.initSelect = function () {
        var _this = this;
        this.eSelect = config_1.$create('select');
        this.eSelect.value = this.selectedOptions[0];
        this.selectedOptions.forEach(function (ele) {
            _this.eSelect.appendChild(ViewProvider.get_select_option(ele));
        });
        this.addEventToSelect(this.eSelect);
    };
    ViewProvider.prototype.initEditor = function () {
        this.eEditor = config_1.$create('input');
        this.eEditor.className = 'jsmind-editor';
        this.eEditor.type = 'text';
        this.addEventToEditor(this.eEditor);
    };
    ViewProvider.prototype.addEventToCanvas = function () {
        var _this = this;
        util_1.customizeUtil.dom.addEvent(this.eNodes, 'click', function (e) {
            _this.editNodeEnd();
            e.stopPropagation();
        });
    };
    ViewProvider.prototype.addEventToEditor = function (editor) {
        var _this = this;
        util_1.customizeUtil.dom.addEvent(editor, 'keydown', function (e) {
            var evt = e || event;
            if (evt.keyCode == 13) {
                _this.editNodeEnd();
                evt.stopPropagation();
            }
        });
        util_1.customizeUtil.dom.addEvent(editor, 'blur', function () {
            _this.editNodeEnd();
        });
        util_1.customizeUtil.dom.addEvent(editor, 'click', function (e) {
            var evt = e || event;
            evt.stopPropagation();
        });
        util_1.customizeUtil.dom.addEvent(editor, 'focus', function (e) {
            var evt = e || event;
            evt.stopPropagation();
            var type = _this.editingNode.selectedType;
            if (_this.getIsInteractSelectedValue(type)) {
                _this.jm.mindMapDataTransporter.next({ type: type, topic: _this.editingNode.topic });
            }
        });
    };
    ViewProvider.prototype.addEventToSelect = function (select) {
        var _this = this;
        util_1.customizeUtil.dom.addEvent(select, 'click', function (e) {
            var evt = e || event;
            evt.stopPropagation();
        });
        util_1.customizeUtil.dom.addEvent(select, 'change', function (e) {
            var evt = e || event;
            evt.stopPropagation();
            var value = _.get(evt, 'srcElement.value');
            if (_this.getIsInteractSelectedValue(value)) {
                _this.jm.mindMapDataTransporter.next(value);
            }
        });
    };
    ViewProvider.prototype.getIsInteractSelectedValue = function (value) {
        return this.jm.options.hasInteraction && value === _.last(this.selectedOptions);
    };
    ViewProvider.prototype.addEvent = function (obj, event_name, event_handle) {
        util_1.customizeUtil.dom.addEvent(this.eNodes, event_name, function (e) {
            var evt = e || event;
            event_handle.call(obj, evt);
        });
    };
    ViewProvider.prototype.getBindedNodeId = function (element) {
        if (element == null) {
            return null;
        }
        var tagName = element.tagName.toLowerCase();
        if (tagName == 'jmnodes' || tagName == 'body' || tagName == 'html') {
            return null;
        }
        if (tagName == 'jmnode' || tagName == 'jmexpander') {
            return element.getAttribute('nodeid');
        }
        else {
            return this.getBindedNodeId(element.parentElement);
        }
    };
    ViewProvider.prototype.isExpander = function (element) {
        return (element.tagName.toLowerCase() == 'jmexpander');
    };
    ViewProvider.prototype.reset = function () {
        config_1.logger.debug('view.reset');
        this.selectedNode = null;
        this.clearLines();
        this.clearNodes();
        this.resetTheme();
    };
    ViewProvider.prototype.resetTheme = function () {
        var theme_name = this.jm.options.theme;
        if (!!theme_name) {
            this.eNodes.className = 'theme-' + theme_name;
        }
        else {
            this.eNodes.className = '';
        }
    };
    ViewProvider.prototype.resetCustomStyle = function () {
        var nodes = this.jm.mind.nodes;
        for (var nodeid in nodes) {
            this.resetNodeCustomStyle(nodes[nodeid]);
        }
    };
    ViewProvider.prototype.load = function () {
        config_1.logger.debug('view.load');
        this.initNodes();
    };
    ViewProvider.prototype.expandSize = function () {
        var min_size = this.layout.getMinSize();
        var min_width = min_size.w + this.opts.hmargin * 2;
        var min_height = min_size.h + this.opts.vmargin * 2;
        var client_w = this.ePanel.clientWidth;
        var client_h = this.ePanel.clientHeight;
        if (client_w < min_width) {
            client_w = min_width;
        }
        if (client_h < min_height) {
            client_h = min_height;
        }
        this.size.w = client_w;
        this.size.h = client_h;
    };
    ViewProvider.prototype.initNodesSize = function (node) {
        var view_data = node._data.view;
        view_data.width = view_data.element.clientWidth;
        view_data.height = view_data.element.clientHeight;
    };
    ViewProvider.prototype.initNodes = function () {
        var nodes = this.jm.mind.nodes;
        var doc_frag = config_1.$document.createDocumentFragment();
        for (var nodeid in nodes) {
            this.createNodeElement(nodes[nodeid], doc_frag);
        }
        this.eNodes.appendChild(doc_frag);
        for (var nodeid in nodes) {
            this.initNodesSize(nodes[nodeid]);
        }
    };
    ViewProvider.prototype.addNode = function (node) {
        this.createNodeElement(node, this.eNodes);
        this.initNodesSize(node);
    };
    ViewProvider.prototype.createNodeElement = function (node, parent_node) {
        var view_data = null;
        if ('view' in node._data) {
            view_data = node._data.view;
        }
        else {
            view_data = {};
            node._data.view = view_data;
        }
        var d = config_1.$create('jmnode');
        if (node.isroot) {
            d.className = 'root';
        }
        else {
            var d_e = config_1.$create('jmexpander');
            config_1.$text(d_e, '-');
            d_e.setAttribute('nodeid', node.id);
            d_e.style.visibility = 'hidden';
            parent_node.appendChild(d_e);
            view_data.expander = d_e;
        }
        if (!!node.topic) {
            if (this.opts.supportHtml) {
                config_1.$html(d, node.show());
            }
            else {
                config_1.$text(d, node.show());
            }
        }
        d.setAttribute('nodeid', node.id);
        d.style.visibility = 'hidden';
        this._resetNodeCustomStyle(d, node.data);
        parent_node.appendChild(d);
        view_data.element = d;
    };
    ViewProvider.prototype.removeNode = function (node) {
        if (this.selectedNode != null && this.selectedNode.id == node.id) {
            this.selectedNode = null;
        }
        if (this.editingNode != null && this.editingNode.id == node.id) {
            node._data.view.element.removeChild(this.eEditor);
            this.editingNode = null;
        }
        var children = node.children;
        var i = children.length;
        while (i--) {
            this.removeNode(children[i]);
        }
        if (node._data.view) {
            var element = node._data.view.element;
            var expander = node._data.view.expander;
            this.eNodes.removeChild(element);
            this.eNodes.removeChild(expander);
            node._data.view.element = null;
            node._data.view.expander = null;
        }
    };
    ViewProvider.prototype.updateNode = function (node) {
        var view_data = node._data.view;
        var element = view_data.element;
        if (!!node.topic) {
            if (this.opts.supportHtml) {
                config_1.$html(element, node.show());
            }
            else {
                config_1.$text(element, node.show());
            }
        }
        view_data.width = element.clientWidth;
        view_data.height = element.clientHeight;
    };
    ViewProvider.prototype.selectNode = function (node) {
        if (!!this.selectedNode) {
            this.selectedNode._data.view.element.className =
                this.selectedNode._data.view.element.className.replace(/\s*selected\s*/i, '');
            this.resetNodeCustomStyle(this.selectedNode);
        }
        if (!!node) {
            this.selectedNode = node;
            node._data.view.element.className += ' selected';
            this.clearNodeCustomStyle(node);
        }
    };
    ViewProvider.prototype.selectClear = function () {
        this.selectNode(null);
    };
    ViewProvider.prototype.getEditingNode = function () {
        return this.editingNode;
    };
    ViewProvider.prototype.isEditing = function () {
        return (!!this.editingNode);
    };
    ViewProvider.prototype.createSelectByTypes = function (types) {
        var newSelect = config_1.$create('select');
        types.slice(1).forEach(function (type) {
            newSelect.appendChild(ViewProvider.get_select_option(type));
        });
        if (types.length <= 1) {
            newSelect.style.borderColor = 'red';
        }
        this.addEventToSelect(newSelect);
        newSelect.value = types[0];
        return newSelect;
    };
    ViewProvider.prototype.editNodeBegin = function (node, types) {
        if (!node.topic) {
            config_1.logger.warn("don't edit image nodes");
            return;
        }
        if (this.editingNode != null) {
            this.editNodeEnd();
        }
        this.editingNode = node;
        this.previousNode = node;
        var view_data = node._data.view;
        var element = view_data.element;
        var topic = node.topic;
        var ncs = getComputedStyle(element);
        this.eEditor.value = topic;
        this.eEditor.style.width
            = (element.clientWidth - parseInt(ncs.getPropertyValue('padding-left')) - parseInt(ncs.getPropertyValue('padding-right'))) + 'px';
        element.innerHTML = '';
        if (types) {
            this.currentSelect = this.createSelectByTypes(types);
        }
        else {
            this.currentSelect = this.eSelect;
        }
        element.appendChild(this.currentSelect);
        element.appendChild(this.eEditor);
        element.style.zIndex = 5;
    };
    ViewProvider.prototype.editNodeEnd = function (value) {
        if (this.editingNode != null) {
            var node = this.editingNode;
            this.editingNode = null;
            var view_data = node._data.view;
            var element = view_data.element;
            if (value) {
                this.eEditor.value = value;
            }
            var topic = this.eEditor.value;
            var selectedType = this.currentSelect.value;
            element.style.zIndex = 'auto';
            element.removeChild(this.eEditor);
            element.removeChild(this.currentSelect);
            if (util_1.customizeUtil.text.isEmpty(topic) ||
                util_1.customizeUtil.text.isEmpty(selectedType) ||
                (node.topic === topic && node.selectedType === selectedType)) {
                if (this.opts.supportHtml) {
                    config_1.$html(element, node.show());
                }
                else {
                    config_1.$text(element, node.show());
                }
            }
            else {
                this.jm.updateNode(node.id, topic, selectedType);
            }
        }
        else if (value) {
            this.jm.updateNode(this.previousNode.id, value, this.previousNode.selectedType);
        }
    };
    ViewProvider.prototype.getViewOffset = function () {
        var bounds = this.layout.bounds;
        var _x = (this.size.w - bounds.e - bounds.w) / 2;
        var _y = this.size.h / 2;
        return { x: _x, y: _y };
    };
    ViewProvider.prototype.resize = function () {
        this.eCanvas.width = 1;
        this.eCanvas.height = 1;
        this.eNodes.style.width = '1px';
        this.eNodes.style.height = '1px';
        this.expandSize();
        this._show();
    };
    ViewProvider.prototype._show = function () {
        this.eCanvas.width = this.size.w;
        this.eCanvas.height = this.size.h;
        this.eNodes.style.width = this.size.w + 'px';
        this.eNodes.style.height = this.size.h + 'px';
        this.showNodes();
        this.showLines();
        this.jm.invokeEventHandleNextTick(mind_map_main_1.MindMapMain.eventType.resize, { data: [] });
    };
    ViewProvider.prototype.zoomIn = function () {
        return this.setZoom(this.actualZoom + this.zoomStep);
    };
    ViewProvider.prototype.zoomOut = function () {
        return this.setZoom(this.actualZoom - this.zoomStep);
    };
    ViewProvider.prototype.setZoom = function (zoom) {
        if ((zoom < this.minZoom) || (zoom > this.maxZoom)) {
            return false;
        }
        this.actualZoom = zoom;
        for (var i = 0; i < this.ePanel.children.length; i++) {
            this.ePanel.children[i].style.transform = 'scale(' + zoom + ')';
        }
        ;
        this.show(true);
        return true;
    };
    ViewProvider.prototype._centerRoot = function () {
        var outer_w = this.ePanel.clientWidth;
        var outer_h = this.ePanel.clientHeight;
        if (this.size.w > outer_w) {
            var _offset = this.getViewOffset();
            this.ePanel.scrollLeft = _offset.x - outer_w / 2;
        }
        if (this.size.h > outer_h) {
            this.ePanel.scrollTop = (this.size.h - outer_h) / 2;
        }
    };
    ViewProvider.prototype.show = function (keep_center) {
        config_1.logger.debug('view.show');
        this.expandSize();
        this._show();
        if (!!keep_center) {
            this._centerRoot();
        }
    };
    ViewProvider.prototype.relayout = function () {
        this.expandSize();
        this._show();
    };
    ViewProvider.prototype.saveLocation = function (node) {
        var vd = node._data.view;
        vd._saved_location = {
            x: parseInt(vd.element.style.left) - this.ePanel.scrollLeft,
            y: parseInt(vd.element.style.top) - this.ePanel.scrollTop,
        };
    };
    ViewProvider.prototype.restoreLocation = function (node) {
        var vd = node._data.view;
        this.ePanel.scrollLeft = parseInt(vd.element.style.left) - vd._saved_location.x;
        this.ePanel.scrollTop = parseInt(vd.element.style.top) - vd._saved_location.y;
    };
    ViewProvider.prototype.clearNodes = function () {
        var mind = this.jm.mind;
        if (mind == null) {
            return;
        }
        var nodes = mind.nodes;
        var node = null;
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            node._data.view.element = null;
            node._data.view.expander = null;
        }
        this.eNodes.innerHTML = '';
    };
    ViewProvider.prototype.showNodes = function () {
        var nodes = this.jm.mind.nodes;
        var node = null;
        var node_element = null;
        var operationArea = null;
        var expander = null;
        var p = null;
        var p_expander = null;
        var expander_text = '-';
        var view_data = null;
        var _offset = this.getViewOffset();
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            view_data = node._data.view;
            node_element = view_data.element;
            operationArea = view_data.operationArea;
            expander = view_data.expander;
            if (!this.layout.isVisible(node)) {
                node_element.style.display = 'none';
                expander.style.display = 'none';
                continue;
            }
            this.resetNodeCustomStyle(node);
            p = this.layout.getNodePoint(node);
            view_data.abs_x = _offset.x + p.x;
            view_data.abs_y = _offset.y + p.y;
            node_element.style.left = (_offset.x + p.x) + 'px';
            node_element.style.top = (_offset.y + p.y) + 'px';
            node_element.style.display = '';
            node_element.style.visibility = 'visible';
            if (operationArea) {
                operationArea.style.left = (_offset.x + p.x) + 'px';
                operationArea.style.top = (_offset.y + p.y + 43) + 'px';
            }
            if (!node.isroot && node.children.length > 0) {
                expander_text = node.expanded ? '-' : '+';
                p_expander = this.layout.getExpanderPoint(node);
                expander.style.left = (_offset.x + p_expander.x) + 'px';
                expander.style.top = (_offset.y + p_expander.y) + 'px';
                expander.style.display = '';
                expander.style.visibility = 'visible';
                config_1.$text(expander, expander_text);
            }
            if (!node.isroot) {
            }
            if (!node.isroot && node.children.length == 0) {
                expander.style.display = 'none';
                expander.style.visibility = 'hidden';
            }
        }
    };
    ViewProvider.prototype.resetNodeCustomStyle = function (node) {
        this._resetNodeCustomStyle(node._data.view.element, node.data);
    };
    ViewProvider.prototype._resetNodeCustomStyle = function (node_element, node_data) {
        if ('background-color' in node_data) {
            node_element.style.backgroundColor = node_data['background-color'];
        }
        if ('foreground-color' in node_data) {
            node_element.style.color = node_data['foreground-color'];
        }
        if ('width' in node_data) {
            node_element.style.width = node_data['width'] + 'px';
        }
        if ('height' in node_data) {
            node_element.style.height = node_data['height'] + 'px';
        }
        if ('font-size' in node_data) {
            node_element.style.fontSize = node_data['font-size'] + 'px';
        }
        if ('font-weight' in node_data) {
            node_element.style.fontWeight = node_data['font-weight'];
        }
        if ('font-style' in node_data) {
            node_element.style.fontStyle = node_data['font-style'];
        }
        if ('color' in node_data) {
            node_element.style.color = node_data['color'];
        }
        if ('background-image' in node_data) {
            var backgroundImage = node_data['background-image'];
            if (backgroundImage.startsWith('data') && node_data['width'] && node_data['height']) {
                var img = new Image();
                img.onload = function () {
                    var c = config_1.$create('canvas');
                    c.width = node_element.clientWidth;
                    c.height = node_element.clientHeight;
                    var img = this;
                    if (c.getContext) {
                        var ctx = c.getContext('2d');
                        ctx.drawImage(img, 2, 2, node_element.clientWidth, node_element.clientHeight);
                        var scaledImageData = c.toDataURL();
                        node_element.style.backgroundImage = 'url(' + scaledImageData + ')';
                    }
                };
                img.src = backgroundImage;
            }
            else {
                node_element.style.backgroundImage = 'url(' + backgroundImage + ')';
            }
            node_element.style.backgroundSize = '99%';
            if ('background-rotation' in node_data) {
                node_element.style.transform = 'rotate(' + node_data['background-rotation'] + 'deg)';
            }
        }
    };
    ViewProvider.prototype.clearNodeCustomStyle = function (node) {
        var node_element = node._data.view.element;
        node_element.style.backgroundColor = "";
        node_element.style.color = "";
    };
    ViewProvider.prototype.clearLines = function (canvas_ctx) {
        var ctx = canvas_ctx || this.canvasCtx;
        util_1.customizeUtil.canvas.clear(ctx, 0, 0, this.size.w, this.size.h);
    };
    ViewProvider.prototype.showLines = function (canvas_ctx) {
        this.clearLines(canvas_ctx);
        var nodes = this.jm.mind.nodes;
        var node = null;
        var pin = null;
        var pout = null;
        var _offset = this.getViewOffset();
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            if (!!node.isroot) {
                continue;
            }
            if (('visible' in node._data.layout) && !node._data.layout.visible) {
                continue;
            }
            pin = this.layout.getNodePointIn(node);
            pout = this.layout.getNodePointOut(node.parent);
            this.drawLine(pout, pin, _offset, canvas_ctx);
        }
    };
    ViewProvider.prototype.drawLine = function (pin, pout, offset, canvas_ctx) {
        var ctx = canvas_ctx || this.canvasCtx;
        ctx.strokeStyle = this.opts.lineColor;
        ctx.lineWidth = this.opts.lineWidth;
        ctx.lineCap = 'round';
        util_1.customizeUtil.canvas.bezierto(ctx, pin.x + offset.x, pin.y + offset.y, pout.x + offset.x, pout.y + offset.y);
    };
    return ViewProvider;
}());
exports.ViewProvider = ViewProvider;
