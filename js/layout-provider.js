"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var mind_map_main_1 = require("./mind-map-main");
var LayoutProvider = (function () {
    function LayoutProvider(jm, options) {
        this.bounds = null;
        this.cache_valid = false;
        this.opts = options;
        this.jm = jm;
        this.isside = (this.opts.mode == 'side');
    }
    LayoutProvider.prototype.init = function () {
        config_1.logger.debug('layout.init');
    };
    LayoutProvider.prototype.reset = function () {
        config_1.logger.debug('layout.reset');
        this.bounds = { n: 0, s: 0, w: 0, e: 0 };
    };
    LayoutProvider.prototype.layout = function () {
        config_1.logger.debug('layout.layout');
        this.layoutDirection();
        this.layoutOffset();
    };
    LayoutProvider.prototype.layoutDirection = function () {
        this._layoutDirectionRoot();
    };
    LayoutProvider.prototype._layoutDirectionRoot = function () {
        var node = this.jm.mind.root;
        var layout_data = null;
        if ('layout' in node._data) {
            layout_data = node._data.layout;
        }
        else {
            layout_data = {};
            node._data.layout = layout_data;
        }
        var children = node.children;
        var children_count = children.length;
        layout_data.direction = mind_map_main_1.MindMapMain.direction.center;
        layout_data.side_index = 0;
        if (this.isside) {
            var i = children_count;
            while (i--) {
                this._layoutDirectionSide(children[i], mind_map_main_1.MindMapMain.direction.right, i);
            }
        }
        else {
            var i = children_count;
            var subnode = null;
            while (i--) {
                subnode = children[i];
                if (subnode.direction == mind_map_main_1.MindMapMain.direction.left) {
                    this._layoutDirectionSide(subnode, mind_map_main_1.MindMapMain.direction.left, i);
                }
                else {
                    this._layoutDirectionSide(subnode, mind_map_main_1.MindMapMain.direction.right, i);
                }
            }
        }
    };
    LayoutProvider.prototype._layoutDirectionSide = function (node, direction, side_index) {
        var layout_data = null;
        if ('layout' in node._data) {
            layout_data = node._data.layout;
        }
        else {
            layout_data = {};
            node._data.layout = layout_data;
        }
        var children = node.children;
        var children_count = children.length;
        layout_data.direction = direction;
        layout_data.side_index = side_index;
        var i = children_count;
        while (i--) {
            this._layoutDirectionSide(children[i], direction, i);
        }
    };
    LayoutProvider.prototype.layoutOffset = function () {
        var node = this.jm.mind.root;
        var layout_data = node._data.layout;
        layout_data.offset_x = 0;
        layout_data.offset_y = 0;
        layout_data.outer_height = 0;
        var children = node.children;
        var i = children.length;
        var left_nodes = [];
        var right_nodes = [];
        var subnode = null;
        while (i--) {
            subnode = children[i];
            if (subnode._data.layout.direction == mind_map_main_1.MindMapMain.direction.right) {
                right_nodes.unshift(subnode);
            }
            else {
                left_nodes.unshift(subnode);
            }
        }
        layout_data.left_nodes = left_nodes;
        layout_data.right_nodes = right_nodes;
        layout_data.outer_height_left = this._layoutOffsetSubNodes(left_nodes);
        layout_data.outer_height_right = this._layoutOffsetSubNodes(right_nodes);
        this.bounds.e = node._data.view.width / 2;
        this.bounds.w = 0 - this.bounds.e;
        this.bounds.n = 0;
        this.bounds.s = Math.max(layout_data.outer_height_left, layout_data.outer_height_right);
    };
    LayoutProvider.prototype._layoutOffsetSubNodes = function (nodes) {
        var total_height = 0;
        var nodes_count = nodes.length;
        var i = nodes_count;
        var node = null;
        var node_outer_height = 0;
        var layout_data = null;
        var base_y = 0;
        var pd = null;
        while (i--) {
            node = nodes[i];
            layout_data = node._data.layout;
            if (pd == null) {
                pd = node.parent._data;
            }
            node_outer_height = this._layoutOffsetSubNodes(node.children);
            if (!node.expanded) {
                node_outer_height = 0;
                this.setVisible(node.children, false);
            }
            node_outer_height = Math.max(node._data.view.height, node_outer_height);
            layout_data.outer_height = node_outer_height;
            layout_data.offset_y = base_y - node_outer_height / 2;
            layout_data.offset_x
                = this.opts.hspace * layout_data.direction + pd.view.width * (pd.layout.direction + layout_data.direction) / 2;
            if (!node.parent.isroot) {
                layout_data.offset_x += this.opts.pspace * layout_data.direction;
            }
            base_y = base_y - node_outer_height - this.opts.vspace;
            total_height += node_outer_height;
        }
        if (nodes_count > 1) {
            total_height += this.opts.vspace * (nodes_count - 1);
        }
        i = nodes_count;
        var middle_height = total_height / 2;
        while (i--) {
            node = nodes[i];
            node._data.layout.offset_y += middle_height;
        }
        return total_height;
    };
    LayoutProvider.prototype._layoutOffsetSubNodesHeight = function (nodes) {
        var total_height = 0;
        var nodes_count = nodes.length;
        var i = nodes_count;
        var node = null;
        var node_outer_height = 0;
        var layout_data = null;
        var base_y = 0;
        var pd = null;
        while (i--) {
            node = nodes[i];
            layout_data = node._data.layout;
            if (pd == null) {
                pd = node.parent._data;
            }
            node_outer_height = this._layoutOffsetSubNodesHeight(node.children);
            if (!node.expanded) {
                node_outer_height = 0;
            }
            node_outer_height = Math.max(node._data.view.height, node_outer_height);
            layout_data.outer_height = node_outer_height;
            layout_data.offset_y = base_y - node_outer_height / 2;
            base_y = base_y - node_outer_height - this.opts.vspace;
            total_height += node_outer_height;
        }
        if (nodes_count > 1) {
            total_height += this.opts.vspace * (nodes_count - 1);
        }
        i = nodes_count;
        var middle_height = total_height / 2;
        while (i--) {
            node = nodes[i];
            node._data.layout.offset_y += middle_height;
        }
        return total_height;
    };
    LayoutProvider.prototype.getNodeOffset = function (node) {
        var layout_data = node._data.layout;
        var offset_cache = null;
        if (('_offset_' in layout_data) && this.cache_valid) {
            offset_cache = layout_data._offset_;
        }
        else {
            offset_cache = { x: -1, y: -1 };
            layout_data._offset_ = offset_cache;
        }
        if (offset_cache.x == -1 || offset_cache.y == -1) {
            var x = layout_data.offset_x;
            var y = layout_data.offset_y;
            if (!node.isroot) {
                var offset_p = this.getNodeOffset(node.parent);
                x += offset_p.x;
                y += offset_p.y;
            }
            offset_cache.x = x;
            offset_cache.y = y;
        }
        return offset_cache;
    };
    LayoutProvider.prototype.getNodePoint = function (node) {
        var view_data = node._data.view;
        var offset_p = this.getNodeOffset(node);
        var p = { x: 0, y: 0 };
        p.x = offset_p.x + view_data.width * (node._data.layout.direction - 1) / 2;
        p.y = offset_p.y - view_data.height / 2;
        return p;
    };
    LayoutProvider.prototype.getNodePointIn = function (node) {
        return this.getNodeOffset(node);
    };
    LayoutProvider.prototype.getNodePointOut = function (node) {
        var layout_data = node._data.layout;
        var pout_cache = null;
        if (('_pout_' in layout_data) && this.cache_valid) {
            pout_cache = layout_data._pout_;
        }
        else {
            pout_cache = { x: -1, y: -1 };
            layout_data._pout_ = pout_cache;
        }
        if (pout_cache.x == -1 || pout_cache.y == -1) {
            if (node.isroot) {
                pout_cache.x = 0;
                pout_cache.y = 0;
            }
            else {
                var view_data = node._data.view;
                var offset_p = this.getNodeOffset(node);
                pout_cache.x = offset_p.x + (view_data.width + this.opts.pspace) * node._data.layout.direction;
                pout_cache.y = offset_p.y;
            }
        }
        return pout_cache;
    };
    LayoutProvider.prototype.getExpanderPoint = function (node) {
        var p = this.getNodePointOut(node);
        var ex_p = { x: 0, y: 0 };
        if (node._data.layout.direction == mind_map_main_1.MindMapMain.direction.right) {
            ex_p.x = p.x - this.opts.pspace;
        }
        else {
            ex_p.x = p.x;
        }
        ex_p.y = p.y - Math.ceil(this.opts.pspace / 2);
        return ex_p;
    };
    LayoutProvider.prototype.getMinSize = function () {
        var nodes = this.jm.mind.nodes;
        var node = null;
        var pout = null;
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            pout = this.getNodePointOut(node);
            if (pout.x > this.bounds.e) {
                this.bounds.e = pout.x;
            }
            if (pout.x < this.bounds.w) {
                this.bounds.w = pout.x;
            }
        }
        return {
            w: this.bounds.e - this.bounds.w,
            h: this.bounds.s - this.bounds.n
        };
    };
    LayoutProvider.prototype.toggleNode = function (node) {
        if (node.isroot) {
            return;
        }
        if (node.expanded) {
            this.collapseNode(node);
        }
        else {
            this.expandNode(node);
        }
    };
    LayoutProvider.prototype.expandNode = function (node) {
        node.expanded = true;
        this.partLayout(node);
        this.setVisible(node.children, true);
    };
    LayoutProvider.prototype.collapseNode = function (node) {
        node.expanded = false;
        this.partLayout(node);
        this.setVisible(node.children, false);
    };
    LayoutProvider.prototype.expandAll = function () {
        var nodes = this.jm.mind.nodes;
        var c = 0;
        var node;
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            if (!node.expanded) {
                node.expanded = true;
                c++;
            }
        }
        if (c > 0) {
            var root = this.jm.mind.root;
            this.partLayout(root);
            this.setVisible(root.children, true);
        }
    };
    LayoutProvider.prototype.collapseAll = function () {
        var nodes = this.jm.mind.nodes;
        var c = 0;
        var node;
        for (var nodeid in nodes) {
            node = nodes[nodeid];
            if (node.expanded && !node.isroot) {
                node.expanded = false;
                c++;
            }
        }
        if (c > 0) {
            var root = this.jm.mind.root;
            this.partLayout(root);
            this.setVisible(root.children, true);
        }
    };
    LayoutProvider.prototype.expandToDepth = function (target_depth, curr_nodes, curr_depth) {
        if (target_depth < 1) {
            return;
        }
        var nodes = curr_nodes || this.jm.mind.root.children;
        var depth = curr_depth || 1;
        var i = nodes.length;
        var node = null;
        while (i--) {
            node = nodes[i];
            if (depth < target_depth) {
                if (!node.expanded) {
                    this.expandNode(node);
                }
                this.expandToDepth(target_depth, node.children, depth + 1);
            }
            if (depth == target_depth) {
                if (node.expanded) {
                    this.collapseNode(node);
                }
            }
        }
    };
    LayoutProvider.prototype.partLayout = function (node) {
        var root = this.jm.mind.root;
        if (!!root) {
            var root_layout_data = root._data.layout;
            if (node.isroot) {
                root_layout_data.outer_height_right = this._layoutOffsetSubNodesHeight(root_layout_data.right_nodes);
                root_layout_data.outer_height_left = this._layoutOffsetSubNodesHeight(root_layout_data.left_nodes);
            }
            else {
                if (node._data.layout.direction == mind_map_main_1.MindMapMain.direction.right) {
                    root_layout_data.outer_height_right
                        = this._layoutOffsetSubNodesHeight(root_layout_data.right_nodes);
                }
                else {
                    root_layout_data.outer_height_left
                        = this._layoutOffsetSubNodesHeight(root_layout_data.left_nodes);
                }
            }
            this.bounds.s = Math.max(root_layout_data.outer_height_left, root_layout_data.outer_height_right);
            this.cache_valid = false;
        }
        else {
            config_1.logger.warn('can not found root node');
        }
    };
    LayoutProvider.prototype.setVisible = function (nodes, visible) {
        var i = nodes.length;
        var node = null;
        var layout_data = null;
        while (i--) {
            node = nodes[i];
            layout_data = node._data.layout;
            if (node.expanded) {
                this.setVisible(node.children, visible);
            }
            else {
                this.setVisible(node.children, false);
            }
            if (!node.isroot) {
                node._data.layout.visible = visible;
            }
        }
    };
    LayoutProvider.prototype.isExpand = function (node) {
        return node.expanded;
    };
    LayoutProvider.prototype.isVisible = function (node) {
        var layout_data = node._data.layout;
        if (('visible' in layout_data) && !layout_data.visible) {
            return false;
        }
        else {
            return true;
        }
    };
    return LayoutProvider;
}());
exports.LayoutProvider = LayoutProvider;
