(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./activator", "./composer", "./system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var _activator = require("./activator");
    exports.activator = _activator;
    var _composer = require("./composer");
    exports.composer = _composer;
    var _system = require("./system");
    exports.system = _system;
});
