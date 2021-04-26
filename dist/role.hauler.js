module.exports = {

    run: function(creep) {
        if (creep.memory.emptying && creep.store.getUsedCapacity() == 0) {
            creep.memory.emptying = false;
        } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 0) {
            creep.memory.emptying = true;
        } else if (!creep.memory.emptying && creep.store.getFreeCapacity(RESOURCE_ENERGY) <= 100 && !creep.memory.target) {
            creep.memory.emptying = true;
        }

        if (!creep.memory.emptying) {
            if (creep.memory.target) {
                let pos = new RoomPosition(creep.memory.target.x, creep.memory.target.y, creep.memory.target.roomName);
                if (pos.roomName !== creep.room.name) {
                    creep.moveToPos(pos, {
                        visualizePathStyle: {
                            stroke: '#00FF00'
                        }
                    });
                } else {
                    let energy = pos.lookFor(LOOK_ENERGY)[0];
                    if (energy) {
                        let pickup = creep.pickup(energy);
                        if (pickup == ERR_NOT_IN_RANGE) {
                            creep.moveToPos(energy, {
                                visualizePathStyle: {
                                    stroke: '#00FF00'
                                },
                                ignoreCreeps: ( energy.room.name != creep.room.name )
                            });
                        }
                    } else {
                        creep.memory.target = false;
                        // creep.log('Previous energy soure depleted')
                    }
                }
            } else {
                let list = [];
                for (let key in creep.getManagerMemory().rooms) {
                    let roomName = creep.getManagerMemory().rooms[key];
                    if (Game.rooms[roomName] != undefined) {
                        list = list.concat(Game.rooms[roomName].find(FIND_DROPPED_RESOURCES, {
                            filter: (d) => {
                                return d.resourceType == RESOURCE_ENERGY;
                            }
                        }));
                    }
                }
                list = list.sort((a, b) => {
                    return a.amount < b.amount;
                });
                for (let key in list) {
                    let result = _.filter(Game.creeps, (creep) => {
                        if (!creep.memory.target) {
                            return false;
                        }
                        return (creep.memory.target.x == list[key].pos.x
                        && creep.memory.target.y == list[key].pos.y
                        && creep.memory.target.roomName == list[key].pos.roomName
                        && creep.memory.role == 'hauler');
                    }).length;
                    if (result == 0) {
                        creep.memory.target = list[key].pos;
                        break;
                    }
                }
            }
        } else {
            creep.memory.target = false;
            let targetRoom = Game.rooms[creep.getManagerMemory().room];
            var containers = targetRoom.find(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_CONTAINER || structure.structureType == STRUCTURE_STORAGE) && structure.store.energy < structure.storeCapacity;
                }
            });
            if (targetRoom.find(FIND_MY_CREEPS, {filter: (item) => {
                return item.memory.role == "distributor";
            }}).length == 0) {
                let structures = targetRoom.find(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_SPAWN || structure.structureType == STRUCTURE_EXTENSION) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0);
                    }
                });
                if (structures.length > 0) {
                    if (creep.transfer(structures[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        creep.moveToPos(structures[0], {
                            visualizePathStyle: {
                                stroke: '#ffffff'
                            }
                        });
                    }
                }
            } else if (containers.length > 0) {
                if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(containers[0], {
                        visualizePathStyle: {
                            stroke: '#ffffff'
                        }
                    });
                }
            } 
        }
    }
};
