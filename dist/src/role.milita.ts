export class RoleMilita {
    static run(creep: Creep) {
        switch (creep.memory.category) {
            case "raid":
                if (!creep.memory.targetRoom) {
                    creep.log('No target room');
                    return;
                }
                if (creep.room.name != creep.memory.targetRoom && _.filter(Game.creeps, (object) => {
                    return object.memory.role == 'milita' && object.memory.targetRoom == creep.memory.targetRoom;
                }).length < 4) {
                    return;
                } else if (creep.room.name != creep.memory.targetRoom) {
                    creep.moveToPos(new RoomPosition(25, 25, creep.memory.targetRoom), {
                        visualizePathStyle: {
                            stroke: '#ff5733'
                        },
                        ignoreCreeps: true
                    });
                } else {
                    return this.raid(creep);
                }
                break;
            default:
            case "patrol":
                return this.findInManagerRoomsAndAttack(creep);
        }
    }
    static raid(creep: Creep) {
        if (!creep.memory.targetId) {
            let result = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                filter: function(hostile) {
                    return hostile.getActiveBodyparts(ATTACK) > 0 || hostile.getActiveBodyparts(RANGED_ATTACK) > 0;
                }
            });
            if (result) {
                creep.memory.targetId = result.id;
            } else {
                result = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS);
                if (result) {
                    creep.memory.targetId = result.id;
                }
            }
            if (!result) {
                let hostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType === STRUCTURE_TOWER;
                    }
                });
                if (hostileStructure) {
                    creep.memory.targetId = hostileStructure.id;
                } else {
                    hostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType !== STRUCTURE_CONTROLLER;
                        }
                    });
                    if (hostileStructure) {
                        creep.memory.targetId = hostileStructure.id;
                    }
                }
            }
            if (creep.memory.targetId) {
                creep.log('New target ' + creep.memory.targetId);
            }
        }
        this.attackTarget(creep);
    }
    static attackTarget(creep: Creep) {
        if (!creep.memory.targetId) {
            return;
        }
        let target =  Game.getObjectById<Creep|PowerCreep|Structure>(creep.memory.targetId)
        if (target) {
            let attackMove = creep.rangedAttack(target);
            if (attackMove == OK) {
                let path = PathFinder.search(creep.pos, creep.room.find(FIND_HOSTILE_CREEPS).map(c => { return { pos: c.pos, range: 3 }; }), { flee: true }).path;
                creep.moveByPath(path);
            } else if (attackMove == ERR_NOT_IN_RANGE) {
                let anotherTarget = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if (anotherTarget && creep.pos.inRangeTo(anotherTarget, 3)) {
                    creep.log('Found opportunity killing');
                    creep.attack(anotherTarget);
                }
                creep.moveToPos(target, {
                    visualizePathStyle: {
                        stroke: '#ff5733'
                    }
                });
            } else {
                creep.log(String(attackMove));
            }
        } else {
            creep.memory.targetId = null;
        }
    }
    static findInManagerRoomsAndAttack(creep: Creep) {
        if (!creep.memory.targetId) {
            let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (hostile) {
                creep.memory.targetId = hostile.id;
            } else {
                let hostiles = creep.manager.findInRooms(FIND_HOSTILE_CREEPS);
                if (hostiles.length > 0) {
                    creep.memory.targetId = hostiles[0].id;
                } else {
                    let spawns = creep.room.find(FIND_MY_SPAWNS);
                    if (spawns.length > 0) {
                        creep.moveToPos(spawns[0].pos, {
                            range: 5
                        });
                    }
                }

            }
        } else {
            this.attackTarget(creep);
        }
    }
};
