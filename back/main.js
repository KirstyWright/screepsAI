var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTransporter = require('role.transporter');
var controllerFactory = require('controller.Factory');
var controllerMining = require('controller.mining');
var controllerTransport = require('controller.transport');

module.exports.loop = function () {
    controllerFactory.run();
    controllerMining.run();
    // controllerTransport.run();

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        // new RoomVisual(creep.room.name).text(creep.memory.role, creep.pos.x+1, creep.pos.y, {color: 'white', font: 0.5});
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        // if(creep.memory.role == 'upgrader') {
        //     roleUpgrader.run(creep);
        // }
        // if(creep.memory.role == 'builder') {
        //     roleBuilder.run(creep);
        // }
        // if(creep.memory.role == 'transporter') {
        //     roleTransporter.run(creep);
        // }
    }
}
