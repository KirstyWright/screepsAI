/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('controller.mining');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function()
    {
        return;
        Memory.mining = {
            spots:{}
        }
        let sources = Game.spawns['Spawn'].room.find(FIND_SOURCES);
        for (var i = 0; i < sources.length; i++) {
            Memory.mining.spots[sources[i].id] = {
                spots: 2,
                harvesters: []
            }
        }
        let harvesters = _.filter(Game.creeps, (creep) => creep.memory.role == 'harvester');
        for (var id in harvesters) {
            harvesters[id].memory.assignment = null;
        }
    }
};
