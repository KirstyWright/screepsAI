var roles = {
    'harvester': require('role.harvester'),
    'upgrader': require('role.upgrader'),
    'builder': require('role.builder'),
    'miner': require('role.miner'),
    'hauler': require('role.hauler'),
    'claimer': require('role.claimer'),
    'scout': require('role.scout'),
    'milita': require('role.milita'),
    'distributor': require('role.distributor'),
};
var roleEmoji = {
    'harvester':'⛏️',
    'upgrader':"🔬",
    'builder':'🛠️',
    'miner':'⚠️',
    'hauler':'🚚',
    'claimer': '🏴‍☠️',
    'scout': '🔭',
    'milita': '⚔️',
    'distributor': '🧱'
};

Creep.prototype.run = function() {
    new RoomVisual(this.room.name).text(roleEmoji[this.memory.role], this.pos.x + 0.8, this.pos.y+0.2, {
        color: 'white',
        font: 0.4
    });

    if (!this.memory.respawn_complete) {
        if (this.memory.managerId != undefined) {
            if (Memory.manager[this.memory.managerId].creeps.indexOf(this.name) == -1) {
                Memory.manager[this.memory.managerId].creeps.push(this.name);
            }
            Memory.manager[this.memory.managerId].spawnQueue.splice(Memory.manager[this.memory.managerId].spawnQueue.findIndex((element) => {
                return element.name === this.name;
            }), 1);
        }
        this.memory.respawn_complete = true;
    }

    let moved = false;
    if (!['scout', 'milita'].includes(this.memory.role)) {
        // check hostiles and flee
        let enemies = this.room.find(FIND_HOSTILE_CREEPS);
        for (let key in enemies) {
            if (this.pos.inRangeTo(enemies[key], 5)) {
                let path = PathFinder.search(this.pos, enemies.map(c=>{return{pos:c.pos,range:10};}),{flee:true}).path;
                this.moveByPath(path);
                this.log('Running away');
                moved = true;
                break;
            }
        }

        // Spawner.manager.memory.rooms
    }
    if (!moved) {
        roles[this.memory.role].run(this);
    }
};

Creep.prototype.log = function (content) {
    console.log("Creep:" + this.name + ': ' + String(content));
};

Creep.prototype.getManagerMemory = function () {
    return Memory.manager[0];
};

Creep.prototype.getEnergy = function(useContainer, useSource, roomName) {
    let container;
    let room = null;
    if (roomName) {
        room = Game.rooms[roomName];
    }
    if (useContainer) {
        let obj = {
            filter: (i) => {
                return (
                    (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store.energy > (['distributor'].includes(this.memory.role) ? 0 :  500)
                );
            }
        };
        if (room) {
            container = room.find(FIND_STRUCTURES, obj)[0];
        } else {
            container = this.pos.findClosestByRange(FIND_STRUCTURES, obj);
        }

        if (container) {
            // there is a container
            this.memory.sourceId = null;
            if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveToPos(container, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        } else {
            if (roomName === undefined) {
                return this.getEnergy(useContainer, useSource, this.getManagerMemory().room);
            }
            let obj = {
                filter: (i) => {
                    return (
                        (i.structureType == STRUCTURE_SPAWN) && i.store.energy > 100
                    );
                }
            };
            if (room) {
                container = room.find(FIND_STRUCTURES, obj)[0];
            } else {
                container = this.pos.findClosestByRange(FIND_STRUCTURES, obj);
            }

            if (container && !container.room.storage) {
                // there is a container and if no storage in the room
                this.memory.sourceId = null;
                if (this.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    this.moveToPos(container, {
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                }
            }

        }
    }

    if (container === undefined && useSource) {
        if (!this.memory.sourceId) {
            var sources = this.room.find(FIND_SOURCES);
            let sourceId = null;
            let thisCount = 9999;
            for (var key in sources) {
                let response = _.filter(Game.creeps, (creep) => creep.memory.sourceId == sources[key].id).length;
                if (response < thisCount) {
                    sourceId = sources[key].id;
                    thisCount = response;
                }
            }
            this.memory.sourceId = sourceId;
        }
        if (this.memory.sourceId) {
            let sources = this.getManagerMemory().sources;
            for (let key in sources) {
                if (sources[key].sourceId !== this.memory.sourceId) {
                    continue;
                }
                if (this.memory.role != 'miner') {
                    break;
                }
                if (!sources[key].miners.includes(this.name)) {
                    this.getManagerMemory().sources[key].miners.push(this.name);
                }
            }

            let target = Game.getObjectById(this.memory.sourceId);
            if (this.harvest(target) == ERR_NOT_IN_RANGE) {
                this.moveToPos(target, {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }
};

Creep.prototype.moveToPos = function(pos, opts) {
    if (opts == undefined) {
        opts = {};
    }
    opts.ignoreCreeps = 1;
    if (opts.costCallback == undefined) {
        opts.costCallback = (roomName, costMatrix) => {
            for (let name in Game.creeps) {
                if (Game.creeps[name].room.name == roomName) {
                    costMatrix.set(Game.creeps[name].pos.x, Game.creeps[name].pos.y, 20);
                }
            }
        }
    }

    opts.visualizePathStyle = {
        stroke: '#ffaa00'
    };
    return this.moveTo(pos, opts);
};

Creep.prototype.findInManagerRooms = function (type, opts) {
    let results = [];
    for (let key in this.getManagerMemory().rooms) {
        let room = Game.rooms[this.getManagerMemory().rooms[key]];
        if (room) {
            results = results.concat(room.find(type, opts));
        }
    }
    return results;
};
