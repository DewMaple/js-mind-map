"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.$win = window;
exports.NAME = 'jsMind';
exports.VERSION = '0.0.7';
exports.AUTHOR = '';
exports.logger = console;
exports.DEFAULT_OPTIONS = {
    container: '',
    editable: false,
    theme: null,
    mode: 'full',
    supportHtml: true,
    canRootNodeEditable: false,
    hasInteraction: false,
    view: {
        hmargin: 100,
        vmargin: 50,
        lineWidth: 2,
        lineColor: '#555'
    },
    layout: {
        hspace: 30,
        vspace: 20,
        pspace: 13
    },
    defaultEventHandle: {
        canHandleMouseDown: true,
        canHandleClick: true,
        canHandleDblclick: true
    },
    shortcut: {
        enable: true,
        handles: {},
        mapping: {
            addchild: 45,
            editnode: 113,
            delnode: 46,
            toggle: 32,
            left: 37,
            up: 38,
            right: 39,
            down: 40,
        }
    },
};
exports.$document = exports.$win.document;
exports.$get = function (id) { return exports.$document.getElementById(id); };
exports.$create = function (tag) { return exports.$document.createElement(tag); };
exports.$text = function (node, text) {
    if (node.hasChildNodes()) {
        node.firstChild.nodeValue = text;
    }
    else {
        node.appendChild(exports.$document.createTextNode(text));
    }
};
exports.$html = function (node, text) { return node.innerHTML = text; };
