module.exports = {

    run: function(creep) {
        if (creep.memory.emptying && creep.carry.energy == 0) {
            creep.memory.emptying = false;
        }
        if (!creep.memory.emptying && creep.carry.energy == creep.carryCapacity) {
            creep.memory.emptying = true;
        }

        if (!creep.memory.emptying) {
            // check crew
            if (!this.hasCrew(creep)) {
                this.assignCrew(creep);
            }
            // waiting for miner
            let miner = Game.getObjectById(Memory.miningCrews[creep.memory.teamId].minerId);
            if (!miner) {
                console.log('Waiting for miner');
                return;
            }

            // let energy = miner.pos.look();
            let energy = miner.pos.lookFor(LOOK_ENERGY);
            if (energy.length > 0) {
                if(creep.pickup(energy[0]) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(energy[0], {visualizePathStyle: {stroke: '#00FF00'}});
                }
            }
            // get dropped energy from crew mate
        } else {
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN) &&
                        structure.energy < structure.energyCapacity;
                }
            });
            var containers = creep.room.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return structure.structureType == STRUCTURE_CONTAINER && structure.store.energy < structure.storeCapacity
                }
            });
            if (targets.length > 0) {
                if (creep.transfer(targets[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else if (containers.length > 0) {
                if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(containers[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } else {
                var targets = creep.room.find(FIND_CONSTRUCTION_SITES);
                if (targets.length) {
                    if (creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                        creep.moveTo(targets[0], {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                    }
                }
            }
        }
    },
    hasCrew: function(creep)
    {
        if (creep.memory.teamId != null && creep.memory.teamId != undefined) {
            if (Memory.miningCrews[creep.memory.teamId]) {
                return true;
            }
        }
        return false;
    },
    assignCrew: function(creep)
    {

    }
}
