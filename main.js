var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleTransporter = require('role.transporter');
var controllerFactory = require('controller.Factory');

module.exports.loop = function () {
    controllerFactory.run();
    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if(creep.memory.role == 'harvester') {
            roleHarvester.run(creep);
        }
        if(creep.memory.role == 'upgrader') {
            roleUpgrader.run(creep);
        }
        if(creep.memory.role == 'builder') {
            roleBuilder.run(creep);
        }
        if(creep.memory.role == 'transporter') {
            roleTransporter.run(creep);
        }
    }
    return;
    try {
        let source = Game.creeps['Elizabeth'].room.find(FIND_SOURCES)[1];
        // check adjecent squares
        let posToCheck = new RoomPosition(source.pos.x+1, source.pos.y, source.pos.roomName);
        // console.log(JSON.stringify(posToCheck.look()));
    } catch(e) {
        console.log(e);
    }
}
