"use strict";var e=require("./adapters/index.cjs"),t=require("./client.cjs");exports.createHttpClient=function(r={}){const n=e.createAdapter(r.adapter);return new t.HttpClientImpl(r,n)};
//# sourceMappingURL=factory.cjs.map
