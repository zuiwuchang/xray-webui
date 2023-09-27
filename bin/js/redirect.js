"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.create = void 0;
const provider_1 = require("./core/provider");
class MyProvider extends provider_1.BaseProvider {
}
function create() {
    return new MyProvider();
}
exports.create = create;
