// var roleHarvester = {
//
//     /** @param {Creep} creep **/
//     findSpot: function(creep) {
//         for (var spot in Memory.mining.spots) {
//             if (Memory.mining.spots[spot].harvesters.length < 2) {
//                 // Can mine here
//                 Memory.mining.spots[spot].harvesters.push(creep.id);
//                 creep.memory.assignment = spot;
//                 creep.say('Mining @ '+spot);
//                 return true;
//             }
//         }
//     },
//     run: function(creep) {
//         if (creep.memory.assignment) {
//             // has assignment
//             let source = _.filter(Game.spawns['Spawn'].room.find(FIND_SOURCES), (source) => source.id == creep.memory.assignment)[0];
//             if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
//                 creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
//             }
//         } else {
//             // needs assignment
//             this.findSpot(creep);
//         }
// 	}
// };
//
// module.exports = roleHarvester;

var roleHarvester = {

    findSpot: function(creep) {
        for (var spot in Memory.mining.spots) {
            if (Memory.mining.spots[spot].harvesters.length < 2) {
                // Can mine here
                Memory.mining.spots[spot].harvesters.push(creep.id);
                creep.memory.assignment = spot;
                creep.say('Mining @ '+spot);
                return true;
            }
        }
    },
    /** @param {Creep} creep **/
    run: function(creep) {
        if (creep.memory.assignment) {
            // has assignment
            if(creep.carry.energy < creep.carryCapacity) {
                let source = _.filter(Game.spawns['Spawn'].room.find(FIND_SOURCES), (source) => source.id == creep.memory.assignment)[0];
                if(creep.harvest(source) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(source, {visualizePathStyle: {stroke: '#ffaa00'}});
                }
            }
            else {
                var targets = creep.room.find(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return (
                                structure.structureType == STRUCTURE_EXTENSION ||
                                structure.structureType == STRUCTURE_SPAWN ||
                                structure.structureType == STRUCTURE_TOWER ||
                                structure.structureType == STRUCTURE_CONTAINER
                            ) && structure.energy < structure.energyCapacity;
                        }
                });
                if(targets.length > 0) {
                    if(creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
                    }
                }
            }
        } else {
            // needs assignment
            this.findSpot(creep);
        }
	}
};

module.exports = roleHarvester;
