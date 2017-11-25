"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var mind_map_node_1 = require("./mind-map-node");
var util_1 = require("./util");
var mind_map_main_1 = require("./mind-map-main");
var MindMapMind = (function () {
    function MindMapMind() {
        this.name = null;
        this.author = null;
        this.version = null;
        this.root = null;
        this.selected = null;
        this.nodes = {};
    }
    MindMapMind.prototype.getNode = function (nodeid) {
        if (nodeid in this.nodes) {
            return this.nodes[nodeid];
        }
        else {
            config_1.logger.warn('the node[id=' + nodeid + '] can not be found');
            return null;
        }
    };
    MindMapMind.prototype.setRoot = function (nodeid, topic, data) {
        if (this.root == null) {
            this.root = new mind_map_node_1.MindMapNode(nodeid, 0, topic, data, true);
            this.putNode(this.root);
        }
        else {
            config_1.logger.error('root node is already exist');
        }
    };
    MindMapMind.prototype.addNode = function (parent_node, nodeid, topic, data, idx, direction, expanded, selected_type) {
        if (!util_1.customizeUtil.is_node(parent_node)) {
            return this.addNode(this.getNode(parent_node), nodeid, topic, data, idx, direction, expanded);
        }
        var nodeindex = idx || -1;
        if (!!parent_node) {
            var node = null;
            if (parent_node.isroot) {
                var d = mind_map_main_1.MindMapMain.direction.right;
                if (isNaN(direction)) {
                    var children = parent_node.children;
                    var children_len = children.length;
                    var r = 0;
                    d = mind_map_main_1.MindMapMain.direction.right;
                }
                else {
                    d = (direction != mind_map_main_1.MindMapMain.direction.left) ?
                        mind_map_main_1.MindMapMain.direction.right :
                        mind_map_main_1.MindMapMain.direction.left;
                }
                node =
                    new mind_map_node_1.MindMapNode(nodeid, nodeindex, topic, data, false, parent_node, d, expanded, selected_type, parent_node.level + 1);
            }
            else {
                node =
                    new mind_map_node_1.MindMapNode(nodeid, nodeindex, topic, data, false, parent_node, parent_node.direction, expanded, selected_type, parent_node.level + 1);
            }
            if (this.putNode(node)) {
                parent_node.children.push(node);
                this.reindex(parent_node);
            }
            else {
                config_1.logger.error('fail, the nodeid \'' + node.id + '\' has been already exist.');
                node = null;
            }
            return node;
        }
        else {
            config_1.logger.error('fail, the [node_parent] can not be found.');
            return null;
        }
    };
    MindMapMind.prototype.insertNodeBefore = function (node_before, nodeid, topic, data) {
        if (!util_1.customizeUtil.is_node(node_before)) {
            return this.insertNodeBefore(this.getNode(node_before), nodeid, topic, data);
        }
        if (!!node_before) {
            var node_index = node_before.index - 0.5;
            return this.addNode(node_before.parent, nodeid, topic, data, node_index);
        }
        else {
            config_1.logger.error('fail, the [node_before] can not be found.');
            return null;
        }
    };
    MindMapMind.prototype.getNodeBefore = function (node) {
        if (!node) {
            return null;
        }
        if (!util_1.customizeUtil.is_node(node)) {
            return this.getNodeBefore(this.getNode(node));
        }
        if (node.isroot) {
            return null;
        }
        var idx = node.index - 2;
        if (idx >= 0) {
            return node.parent.children[idx];
        }
        else {
            return null;
        }
    };
    MindMapMind.prototype.insertNodeAfter = function (node_after, nodeid, topic, data) {
        if (!util_1.customizeUtil.is_node(node_after)) {
            return this.insertNodeAfter(this.getNode(node_after), nodeid, topic, data);
        }
        if (!!node_after) {
            var node_index = node_after.index + 0.5;
            return this.addNode(node_after.parent, nodeid, topic, data, node_index);
        }
        else {
            config_1.logger.error('fail, the [node_after] can not be found.');
            return null;
        }
    };
    MindMapMind.prototype.getNodeAfter = function (node) {
        if (!node) {
            return null;
        }
        if (!util_1.customizeUtil.is_node(node)) {
            return this.getNodeAfter(this.getNode(node));
        }
        if (node.isroot) {
            return null;
        }
        var idx = node.index;
        var brothers = node.parent.children;
        if (brothers.length >= idx) {
            return node.parent.children[idx];
        }
        else {
            return null;
        }
    };
    MindMapMind.prototype.moveNode = function (node, beforeid, parentid, direction) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.moveNode(this.getNode(node), beforeid, parentid, direction);
        }
        if (!parentid) {
            parentid = node.parent.id;
        }
        return this.moveNodeDirect(node, beforeid, parentid, direction);
    };
    MindMapMind.prototype.flowNodeDirection = function (node, direction) {
        if (typeof direction === 'undefined') {
            direction = node.direction;
        }
        else {
            node.direction = direction;
        }
        var len = node.children.length;
        while (len--) {
            this.flowNodeDirection(node.children[len], direction);
        }
    };
    MindMapMind.prototype.moveNodeInternal = function (node, beforeid) {
        if (!!node && !!beforeid) {
            if (beforeid == '_last_') {
                node.index = -1;
                this.reindex(node.parent);
            }
            else if (beforeid == '_first_') {
                node.index = 0;
                this.reindex(node.parent);
            }
            else {
                var node_before = (!!beforeid) ? this.getNode(beforeid) : null;
                if (node_before != null && node_before.parent != null && node_before.parent.id == node.parent.id) {
                    node.index = node_before.index - 0.5;
                    this.reindex(node.parent);
                }
            }
        }
        return node;
    };
    MindMapMind.prototype.moveNodeDirect = function (node, beforeid, parentid, direction) {
        if (!!node && !!parentid) {
            if (node.parent.id != parentid) {
                var sibling = node.parent.children;
                var si = sibling.length;
                while (si--) {
                    if (sibling[si].id == node.id) {
                        sibling.splice(si, 1);
                        break;
                    }
                }
                node.parent = this.getNode(parentid);
                node.parent.children.push(node);
            }
            if (node.parent.isroot) {
                if (direction == mind_map_main_1.MindMapMain.direction.left) {
                    node.direction = direction;
                }
                else {
                    node.direction = mind_map_main_1.MindMapMain.direction.right;
                }
            }
            else {
                node.direction = node.parent.direction;
            }
            this.moveNodeInternal(node, beforeid);
            this.flowNodeDirection(node);
        }
        return node;
    };
    MindMapMind.prototype.removeNode = function (node) {
        if (!util_1.customizeUtil.is_node(node)) {
            return this.removeNode(this.getNode(node));
        }
        if (!node) {
            config_1.logger.error('fail, the node can not be found');
            return false;
        }
        if (node.isroot) {
            config_1.logger.error('fail, can not remove root node');
            return false;
        }
        if (this.selected != null && this.selected.id == node.id) {
            this.selected = null;
        }
        var children = node.children;
        var ci = children.length;
        while (ci--) {
            this.removeNode(children[ci]);
        }
        children.length = 0;
        var sibling = node.parent.children;
        var si = sibling.length;
        while (si--) {
            if (sibling[si].id == node.id) {
                sibling.splice(si, 1);
                break;
            }
        }
        delete this.nodes[node.id];
        for (var k in node) {
            delete node[k];
        }
        node = null;
        return true;
    };
    MindMapMind.prototype.putNode = function (node) {
        if (node.id in this.nodes) {
            config_1.logger.warn('the nodeid \'' + node.id + '\' has been already exist.');
            return false;
        }
        else {
            this.nodes[node.id] = node;
            return true;
        }
    };
    MindMapMind.prototype.reindex = function (node) {
        if (node instanceof mind_map_node_1.MindMapNode) {
            node.children.sort(mind_map_node_1.MindMapNode.compare);
            var length_1 = node.children.length;
            for (var i = 0; i < length_1; i++) {
                node.children[i].index = i + 1;
            }
        }
    };
    return MindMapMind;
}());
exports.MindMapMind = MindMapMind;
