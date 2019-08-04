const Controller = require('./Controller');
const Bitmex = require('./Bitmex');
const Server = require('./Server');

new Server(new Controller(new Bitmex()));
