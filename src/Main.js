const Controller = require('./Controller');
const controller = new Controller();

controller.start().catch(error => {
    console.error('Cant start!', error);
});
