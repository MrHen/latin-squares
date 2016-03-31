/// <reference path="../typings/browser.d.ts" />
"use strict";
var express = require("express");
var http = require("http");
var app = express();
app.set("port", (process.env.PORT || 4000));
app.use("/", express.static("app"));
var server = http.createServer(app);
server.listen(app.get("port"), function () {
    console.info("Express server listening", { port: app.get("port") });
});
