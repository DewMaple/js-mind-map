"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _ = require("lodash");
var config_1 = require("./config");
var mind_map_main_1 = require("./mind-map-main");
var mind_map_mind_1 = require("./mind-map-mind");
var mind_map_node_1 = require("./mind-map-node");
exports.customizeFormat = {
    nodeTree: {
        example: {
            meta: {
                name: config_1.NAME,
                author: config_1.AUTHOR,
                version: config_1.VERSION
            },
            format: "nodeTree",
            data: { id: "root", topic: "Main Node" }
        },
        getMind: function (source) {
            var df = exports.customizeFormat.nodeTree;
            var mind = new mind_map_mind_1.MindMapMind();
            mind.name = _.get(source, 'meta.name', config_1.NAME);
            mind.author = _.get(source, 'meta.author', config_1.AUTHOR);
            mind.version = _.get(source, 'meta.version', config_1.VERSION);
            df._parse(mind, source.data);
            return mind;
        },
        getData: function (mind) {
            var df = exports.customizeFormat.nodeTree;
            var json = { meta: {}, format: '', data: {} };
            json.meta = {
                name: mind.name,
                author: mind.author,
                version: mind.version
            };
            json.format = 'nodeTree';
            json.data = df._buildNode(mind.root);
            return json;
        },
        _parse: function (mind, node_root) {
            var df = exports.customizeFormat.nodeTree;
            var data = df._extractData(node_root);
            mind.setRoot(node_root.id, node_root.topic, data);
            if ('children' in node_root) {
                var children = node_root.children;
                for (var i = 0; i < children.length; i++) {
                    df._extractSubNode(mind, mind.root, children[i]);
                }
            }
        },
        _extractData: function (node_json) {
            var data = {};
            for (var k in node_json) {
                if (k == 'id' ||
                    k == 'topic' ||
                    k == 'children' ||
                    k == 'direction' ||
                    k == 'expanded' ||
                    k == 'selectedType') {
                    continue;
                }
                if (k == 'backgroundColor') {
                    data['background-color'] = node_json[k];
                }
                else {
                    data[k] = node_json[k];
                }
            }
            return data;
        },
        _extractSubNode: function (mind, node_parent, node_json) {
            var df = exports.customizeFormat.nodeTree;
            var data = df._extractData(node_json);
            var d = null;
            if (node_parent.isroot) {
                d = node_json.direction == 'left' ? mind_map_main_1.MindMapMain.direction.left : mind_map_main_1.MindMapMain.direction.right;
            }
            var node = mind.addNode(node_parent, node_json.id, node_json.topic, data, null, d, node_json.expanded, node_json.selectedType);
            if ('children' in node_json) {
                var children = node_json.children;
                for (var i = 0; i < children.length; i++) {
                    df._extractSubNode(mind, node, children[i]);
                }
            }
        },
        _buildNode: function (node) {
            var df = exports.customizeFormat.nodeTree;
            if (!(node instanceof mind_map_node_1.MindMapNode)) {
                return;
            }
            var o = {
                id: node.id,
                topic: node.topic,
                direction: '',
                children: [],
                selectedType: node.selectedType,
                isCreated: node.isCreated,
                isroot: node.isroot,
                expanded: node.expanded
            };
            if (!!node.parent && node.parent.isroot) {
                o.direction = node.direction == mind_map_main_1.MindMapMain.direction.left ? 'left' : 'right';
            }
            if (node.data != null) {
                var node_data = node.data;
                for (var k in node_data) {
                    o[k] = node_data[k];
                }
            }
            var children = node.children;
            if (children.length > 0) {
                o.children = [];
                for (var i = 0; i < children.length; i++) {
                    o.children.push(df._buildNode(children[i]));
                }
            }
            return o;
        }
    },
    node_array: {
        example: {
            meta: {
                name: config_1.NAME,
                author: config_1.AUTHOR,
                version: config_1.VERSION
            },
            format: "node_array",
            data: [
                { id: "root", topic: "Main Node", isroot: true }
            ]
        },
        getMind: function (source) {
            var df = exports.customizeFormat.node_array;
            var mind = new mind_map_mind_1.MindMapMind();
            mind.name = _.get(source, 'meta.name', config_1.NAME);
            mind.author = _.get(source, 'meta.author', config_1.AUTHOR);
            mind.version = _.get(source, 'meta.version', config_1.VERSION);
            df._parse(mind, source.data);
            return mind;
        },
        getData: function (mind) {
            var df = exports.customizeFormat.node_array;
            var json = {
                meta: {},
                format: '',
                data: []
            };
            json.meta = {
                name: mind.name,
                author: mind.author,
                version: mind.version
            };
            json.format = 'node_array';
            json.data = [];
            df._array(mind, json.data);
            return json;
        },
        _parse: function (mind, node_array) {
            var df = exports.customizeFormat.node_array;
            var narray = node_array.slice(0);
            narray.reverse();
            var root_id = df._extractRoot(mind, narray);
            if (!!root_id) {
                df._extractSubNode(mind, root_id, narray);
            }
            else {
                config_1.logger.error('root node can not be found');
            }
        },
        _extractRoot: function (mind, node_array) {
            var df = exports.customizeFormat.node_array;
            var i = node_array.length;
            while (i--) {
                if ('isroot' in node_array[i] && node_array[i].isroot) {
                    var root_json = node_array[i];
                    var data = df._extractData(root_json);
                    mind.setRoot(root_json.id, root_json.topic, data);
                    node_array.splice(i, 1);
                    return root_json.id;
                }
            }
            return null;
        },
        _extractSubNode: function (mind, parentid, node_array) {
            var df = exports.customizeFormat.node_array;
            var i = node_array.length;
            var node_json = null;
            var data = null;
            var extract_count = 0;
            while (i--) {
                node_json = node_array[i];
                if (node_json.parentid == parentid) {
                    data = df._extractData(node_json);
                    var d = null;
                    var node_direction = node_json.direction;
                    if (!!node_direction) {
                        d = node_direction == 'left' ? mind_map_main_1.MindMapMain.direction.left : mind_map_main_1.MindMapMain.direction.right;
                    }
                    mind.addNode(parentid, node_json.id, node_json.topic, data, null, d, node_json.expanded);
                    node_array.splice(i, 1);
                    extract_count++;
                    var sub_extract_count = df._extractSubNode(mind, node_json.id, node_array);
                    if (sub_extract_count > 0) {
                        i = node_array.length;
                        extract_count += sub_extract_count;
                    }
                }
            }
            return extract_count;
        },
        _extractData: function (node_json) {
            var data = {};
            for (var k in node_json) {
                if (k == 'id' || k == 'topic' || k == 'parentid' || k == 'isroot' || k == 'direction' || k == 'expanded') {
                    continue;
                }
                data[k] = node_json[k];
            }
            return data;
        },
        _array: function (mind, node_array) {
            var df = exports.customizeFormat.node_array;
            df._arrayNode(mind.root, node_array);
        },
        _arrayNode: function (node, node_array) {
            var df = exports.customizeFormat.node_array;
            if (!(node instanceof mind_map_node_1.MindMapNode)) {
                return;
            }
            var o = {
                id: node.id,
                topic: node.topic,
                parentid: '',
                isroot: false,
                direction: '',
                expanded: node.expanded
            };
            if (!!node.parent) {
                o.parentid = node.parent.id;
            }
            if (node.isroot) {
                o.isroot = true;
            }
            if (!!node.parent && node.parent.isroot) {
                o.direction = node.direction == mind_map_main_1.MindMapMain.direction.left ? 'left' : 'right';
            }
            if (node.data != null) {
                var node_data = node.data;
                for (var k in node_data) {
                    o[k] = node_data[k];
                }
            }
            node_array.push(o);
            var ci = node.children.length;
            for (var i = 0; i < ci; i++) {
                df._arrayNode(node.children[i], node_array);
            }
        },
    },
    freemind: {
        example: {
            meta: {
                name: config_1.NAME,
                author: config_1.AUTHOR,
                version: config_1.VERSION
            },
            format: "freemind",
            data: "<map version=\"1.0.1\"><node ID=\"root\" TEXT=\"freemind Example\"/></map>"
        },
        getMind: function (source) {
            var df = exports.customizeFormat.freemind;
            var mind = new mind_map_mind_1.MindMapMind();
            mind.name = _.get(source, 'meta.name', config_1.NAME);
            mind.author = _.get(source, 'meta.author', config_1.AUTHOR);
            mind.version = _.get(source, 'meta.version', config_1.VERSION);
            var xml = source.data;
            var xml_doc = df._parseXml(xml);
            var xml_root = df._findRoot(xml_doc);
            df._loadNode(mind, null, xml_root);
            return mind;
        },
        getData: function (mind) {
            var df = exports.customizeFormat.freemind;
            var json = { meta: {}, format: '', data: '' };
            json.meta = {
                name: mind.name,
                author: mind.author,
                version: mind.version
            };
            json.format = 'freemind';
            var xmllines = [];
            xmllines.push('<map version=\"1.0.1\">');
            df._buildMap(mind.root, xmllines);
            xmllines.push('</map>');
            json.data = xmllines.join(' ');
            return json;
        },
        _parseXml: function (xml) {
            var xml_doc = null;
            if (config_1.$win.DOMParser) {
                var parser = new DOMParser();
                xml_doc = parser.parseFromString(xml, 'text/xml');
            }
            else {
                xml_doc = new ActiveXObject('Microsoft.XMLDOM');
                xml_doc.async = false;
                xml_doc.loadXML(xml);
            }
            return xml_doc;
        },
        _findRoot: function (xml_doc) {
            var nodes = xml_doc.childNodes;
            var node = null;
            var root = null;
            var n = null;
            for (var i = 0; i < nodes.length; i++) {
                n = nodes[i];
                if (n.nodeType == 1 && n.tagName == 'map') {
                    node = n;
                    break;
                }
            }
            if (!!node) {
                var ns = node.childNodes;
                node = null;
                for (var i = 0; i < ns.length; i++) {
                    n = ns[i];
                    if (n.nodeType == 1 && n.tagName == 'node') {
                        node = n;
                        break;
                    }
                }
            }
            return node;
        },
        _loadNode: function (mind, parent_id, xml_node) {
            var df = exports.customizeFormat.freemind;
            var node_id = xml_node.getAttribute('ID');
            var node_topic = xml_node.getAttribute('TEXT');
            if (node_topic == null) {
                var topic_children = xml_node.childNodes;
                var topic_child = null;
                for (var i = 0; i < topic_children.length; i++) {
                    topic_child = topic_children[i];
                    if (topic_child.nodeType == 1 && topic_child.tagName === 'richcontent') {
                        node_topic = topic_child.textContent;
                        break;
                    }
                }
            }
            var node_data = df._loadAttributes(xml_node);
            var node_expanded = ('expanded' in node_data) ? (node_data.expanded == 'true') : true;
            delete node_data.expanded;
            var node_position = xml_node.getAttribute('POSITION');
            var node_direction = null;
            if (!!node_position) {
                node_direction = node_position == 'left' ? mind_map_main_1.MindMapMain.direction.left : mind_map_main_1.MindMapMain.direction.right;
            }
            if (!!parent_id) {
                mind.addNode(parent_id, node_id, node_topic, node_data, null, node_direction, node_expanded);
            }
            else {
                mind.setRoot(node_id, node_topic, node_data);
            }
            var children = xml_node.childNodes;
            var child = null;
            for (var i = 0; i < children.length; i++) {
                child = children[i];
                if (child.nodeType == 1 && child.tagName == 'node') {
                    df._loadNode(mind, node_id, child);
                }
            }
        },
        _loadAttributes: function (xml_node) {
            var children = xml_node.childNodes;
            var attr = null;
            var attr_data = {};
            for (var i = 0; i < children.length; i++) {
                attr = children[i];
                if (attr.nodeType == 1 && attr.tagName === 'attribute') {
                    attr_data[attr.getAttribute('NAME')] = attr.getAttribute('VALUE');
                }
            }
            return attr_data;
        },
        _buildMap: function (node, xmllines) {
            var df = exports.customizeFormat.freemind;
            var pos = null;
            if (!!node.parent && node.parent.isroot) {
                pos = node.direction === mind_map_main_1.MindMapMain.direction.left ? 'left' : 'right';
            }
            xmllines.push('<node');
            xmllines.push('ID=\"' + node.id + '\"');
            if (!!pos) {
                xmllines.push('POSITION=\"' + pos + '\"');
            }
            xmllines.push('TEXT=\"' + node.topic + '\">');
            xmllines.push('<attribute NAME=\"expanded\" VALUE=\"' + node.expanded + '\"/>');
            var node_data = node.data;
            if (node_data != null) {
                for (var k in node_data) {
                    xmllines.push('<attribute NAME=\"' + k + '\" VALUE=\"' + node_data[k] + '\"/>');
                }
            }
            var children = node.children;
            for (var i = 0; i < children.length; i++) {
                df._buildMap(children[i], xmllines);
            }
            xmllines.push('</node>');
        },
    },
};
