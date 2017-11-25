"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var MindMapNode = (function () {
    function MindMapNode(sId, iIndex, sTopic, oData, bIsRoot, oParent, eDirection, bExpanded, selectedType, level) {
        if (!sId) {
            config_1.logger.error('invalid nodeid');
            return;
        }
        if (typeof iIndex != 'number') {
            config_1.logger.error('invalid node index');
            return;
        }
        if (typeof bExpanded === 'undefined') {
            bExpanded = true;
        }
        this.id = sId;
        this.index = iIndex;
        this.topic = sTopic;
        this.selectedType = selectedType;
        this.data = oData || {};
        this.isroot = bIsRoot;
        this.parent = oParent;
        this.direction = eDirection;
        this.expanded = !!bExpanded;
        this.level = level;
        this.children = [];
        this._data = {};
        this.isCreated = this.data.isCreated;
        if (this.isroot) {
            this.level = 1;
        }
    }
    ;
    MindMapNode.prototype.show = function () {
        if (this.selectedType) {
            return "[" + this.selectedType + "] " + this.topic;
        }
        return this.topic;
    };
    MindMapNode.prototype.getLocation = function () {
        var vd = this._data.view;
        return {
            x: vd.abs_x,
            y: vd.abs_y
        };
    };
    MindMapNode.prototype.getSize = function () {
        var vd = this._data.view;
        return {
            w: vd.width,
            h: vd.height
        };
    };
    return MindMapNode;
}());
exports.MindMapNode = MindMapNode;
MindMapNode.compare = function (node1, node2) {
    var r;
    var i1 = node1.index;
    var i2 = node2.index;
    if (i1 >= 0 && i2 >= 0) {
        r = i1 - i2;
    }
    else if (i1 == -1 && i2 == -1) {
        r = 0;
    }
    else if (i1 == -1) {
        r = 1;
    }
    else if (i2 == -1) {
        r = -1;
    }
    else {
        r = 0;
    }
    return r;
};
MindMapNode.inherited = function (pnode, node) {
    if (!!pnode && !!node) {
        if (pnode.id === node.id) {
            return true;
        }
        if (pnode.isroot) {
            return true;
        }
        var pid = pnode.id;
        var p = node;
        while (!p.isroot) {
            p = p.parent;
            if (p.id === pid) {
                return true;
            }
        }
    }
    return false;
};
