"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var config_1 = require("./config");
var customize_format_1 = require("./customize-format");
var MindMapDataProvider = (function () {
    function MindMapDataProvider(jm) {
        this.jm = jm;
    }
    MindMapDataProvider.prototype.init = function () {
        config_1.logger.debug('data.init');
    };
    MindMapDataProvider.prototype.reset = function () {
        config_1.logger.debug('data.reset');
    };
    MindMapDataProvider.prototype.load = function (mind_data) {
        var df = null;
        var mind = null;
        if (typeof mind_data === 'object') {
            if (!!mind_data.format) {
                df = mind_data.format;
            }
            else {
                df = 'nodeTree';
            }
        }
        else {
            df = 'freemind';
        }
        if (df == 'node_array') {
            mind = customize_format_1.customizeFormat.node_array.getMind(mind_data);
        }
        else if (df == 'nodeTree') {
            mind = customize_format_1.customizeFormat.nodeTree.getMind(mind_data);
        }
        else if (df == 'freemind') {
            mind = customize_format_1.customizeFormat.freemind.getMind(mind_data);
        }
        else {
            config_1.logger.warn('unsupported format');
        }
        return mind;
    };
    MindMapDataProvider.prototype.getData = function (data_format) {
        var data = null;
        if (data_format == 'node_array') {
            data = customize_format_1.customizeFormat.node_array.getData(this.jm.mind);
        }
        else if (data_format == 'nodeTree') {
            data = customize_format_1.customizeFormat.nodeTree.getData(this.jm.mind);
        }
        else if (data_format == 'freemind') {
            data = customize_format_1.customizeFormat.freemind.getData(this.jm.mind);
        }
        else {
            config_1.logger.error('unsupported ' + data_format + ' format');
        }
        return data;
    };
    return MindMapDataProvider;
}());
exports.MindMapDataProvider = MindMapDataProvider;
