/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('controller.Factory');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function()
    {
        for(var name in Memory.creeps) {
            if(!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log('Clearing non-existing creep memory:', name);
            }
        }

        let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        if (harvesters.length < 2) {
            this.createCreep('harvester');
        }
        let transporters = _.filter(Game.creeps, (creep) => creep.memory.role == 'transporter');
        if (transporters.length < 3) {
            this.createCreep('transporter');
        }
        let builders = _.filter(Game.creeps, (creep) => creep.memory.role == 'builder');
        if (builders.length < 2) {
            this.createCreep('builder');
        }
        let upgraders = _.filter(Game.creeps, (creep) => creep.memory.role == 'upgrader');
        if (upgraders.length < 2) {
            this.createCreep('upgrader');
        }

    },
    roles: {
        'harvester': [WORK, WORK, MOVE],
        'transporter': [MOVE,WORK,CARRY,CARRY,CARRY],
        'builder': [MOVE,WORK,WORK,CARRY],
        'upgrader': [MOVE,WORK,WORK,CARRY]
    },
    createCreep: function(type)
    {
        let spawn = Game.spawns['Spawn'];
        if (spawn.energy < 300) {
            return;
        }
        response = spawn.createCreep(this.roles[type],undefined,{role:type});
        if (isNaN(response)) {
            console.log('Creating creep ('+type+')');
        } else {
            console.log('Error creating creep: '+response);
        }
    }
};

// [MOVE,WORK,CARRY,CARRY,CARRY]
// Game.spawns['Spawn'].createCreep([MOVE,WORK,CARRY,CARRY,CARRY], 'TransportSmall1',{ role: 'transporter'});
// Game.spawns['Spawn'].createCreep([MOVE,WORK,CARRY], undefined,{ role: 'transporter'});
