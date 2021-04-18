module.exports = {
    run: function(creep) {
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
                    ignoreCreeps:true
                });
            } else {
                return this.raid(creep);
            }
            break;
        default:
        case "patrol":
            return this.findInRoomAndAttack(creep);
        }
    },
    raid(creep) {
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
                result = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                    filter: (structure) => {
                        return structure.structureType === STRUCTURE_TOWER;
                    }
                });
                if (result) {
                    creep.memory.targetId = result.id;
                } else {
                    result = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType !== STRUCTURE_CONTROLLER;
                        }
                    });
                    if (result) {
                        creep.memory.targetId = result.id;
                    }
                }
            }
            if (creep.memory.targetId) {
                creep.log('New target '+creep.memory.targetId);
            }
        }
        this.attackTarget(creep);
    },
    attackTarget(creep) {
        let target = creep.room.find(FIND_HOSTILE_CREEPS).filter( (hostile) => {
            return hostile.id == creep.memory.targetId;
        })[0];
        if (!target) {
            target = creep.room.find(FIND_STRUCTURES).filter( (hostile) => {
                return hostile.id == creep.memory.targetId;
            })[0];
        }
        if (target) {
            let attackMove = creep.rangedAttack(target);
            if (attackMove == OK) {
                let path = PathFinder.search(creep.pos, creep.room.find(FIND_HOSTILE_CREEPS).map(c=>{return{pos:c.pos,range:3};}),{flee:true}).path;
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
                    },
                    ignoreCreeps:false
                });
            } else {
                creep.log(attackMove);
            }
        } else {
            creep.memory.targetId = null;
        }
    },
    findInRoomAndAttack(creep) {
        if (!creep.memory.targetId) {
            let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (hostile) {
                creep.memory.targetId = hostile.id;
            } else {
                let spawns = creep.room.find(FIND_MY_SPAWNS);
                if (spawns.length > 0) {
                    creep.moveToPos(spawns[0].pos, {
                        range: 3
                    });
                }
            }
        } else {
            this.attackTarget(creep);
        }
    }
};
