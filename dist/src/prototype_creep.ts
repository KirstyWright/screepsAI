import { RoleBuilder } from 'role.builder';
import { RoleHarvester } from 'role.harvester';
import { RoleUpgrader } from 'role.upgrader';
import { RoleMiner } from 'role.miner';
import { RoleHauler } from 'role.hauler';
import { RoleClaimer } from 'role.claimer';
import { RoleMilita } from 'role.milita';
import { RoleDistributor } from 'role.distributor';
import { RoleScout } from 'role.scout';
import { Helper } from 'helper';

export { }

var roles: Record<string, any> = {
    'harvester': RoleHarvester,
    'upgrader': RoleUpgrader,
    'builder': RoleBuilder,
    'miner': RoleMiner,
    'hauler': RoleHauler,
    'claimer': RoleClaimer,
    'milita': RoleMilita,
    'scout': RoleScout,
    'distributor': RoleDistributor
};
var roleEmoji: Record<string, string> = {
    'harvester': '⛏️',
    'upgrader': "🔬",
    'builder': '🛠️',
    'miner': '⚠️',
    'hauler': '🚚',
    'claimer': '🏴‍☠️',
    'milita': '⚔️',
    'scout': '⚔️',
    'distributor': '🧱'
};

Creep.prototype.genericRun = function(): boolean {
    if (!this.memory.lastPos) {
        this.memory.lastPos = null;
    }
    let currentPosString = Helper.savePos(this.pos);
    if (this.memory.lastPos === currentPosString) {
        this.idleMovement = true;
    } else {
        this.idleMovement = false;
    }


    new RoomVisual(this.room.name).text(roleEmoji[this.memory.role], this.pos.x, this.pos.y + 0.15 , {
        color: 'white',
        font: 0.5
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
                // check their body parts
                let attacker = false;
                for (let i = 0; i < enemies[key].body.length; i++) {
                    if (enemies[key].body[i].type === ATTACK || enemies[key].body[i].type === RANGED_ATTACK) {
                        attacker = true;
                        break;
                    }
                }
                if (attacker) {
                    let path = PathFinder.search(this.pos, enemies.map(c => { return { pos: c.pos, range: 10 }; }), { flee: true }).path;
                    this.moveByPath(path);
                    moved = true;
                }
                break;
            }
        }

        // Spawner.manager.memory.rooms
    }

    // <StructureSpawn>
    if (this.idleMovement) {
        let spawns = this.room.find(FIND_MY_SPAWNS);
        for (let key in spawns) {
            let spawner = spawns[key];
            if (this.pos.inRangeTo(spawner.pos, 1)) {
                let route = PathFinder.search(this.pos, { pos: spawner.pos, range: 2 }, {
                    flee: true, roomCallback: function(roomName) {
                        let costMatrix = new PathFinder.CostMatrix();

                        let room = Game.rooms[roomName];
                        if (!room) {
                            return false;
                        }

                        room.find(FIND_STRUCTURES).forEach(function(struct) {
                            if (struct.structureType !== STRUCTURE_CONTAINER  && struct.structureType !== STRUCTURE_ROAD &&
                                (struct.structureType !== STRUCTURE_RAMPART ||
                                    !struct.my)) {
                                // Can't walk through non-walkable buildings
                                costMatrix.set(struct.pos.x, struct.pos.y, 255);
                            }
                        });

                        room.find(FIND_CREEPS).forEach(function(creep) {
                            costMatrix.set(creep.pos.x, creep.pos.y, 255);
                        });
                        return costMatrix;
                    }
                });
                let path = route.path;
                this.moveByPath(path);
                moved = true;

                break;
            }
        }
    }
    return moved;

}

Creep.prototype.run = function() {

    if (this.spawning) {
        return;
    }

    let moved = this.genericRun();

    if (!moved) {
        roles[this.memory.role].run(this);
    }

    if (!this.fatigue) {
        this.memory.lastPos = Helper.savePos(this.pos);;
    }
};

Creep.prototype.log = function(content) {
    console.log("Creep:" + this.name + ': ' + String(content));
};

Creep.prototype.getManagerMemory = function() {
    return Memory.manager[this.memory.managerId];
};

Creep.prototype.getEnergy = function(useContainer?: boolean, useSource?: boolean, roomName?: string) {
    let container;
    let room = null;
    if (roomName) {
        room = Game.rooms[roomName];
    }
    if (useContainer) {
        let obj;

        obj = {
            filter: (i: StructureContainer | StructureStorage) => {
                return (
                    (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store.energy > (['distributor'].includes(this.memory.role) ? 0 : 500)
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
                this.travelTo(container);
            }
        } else {
            if (roomName === undefined) {
                return this.getEnergy(useContainer, useSource, this.getManagerMemory().room);
            }
            let obj = {
                filter: (i: StructureSpawn) => {
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
                    this.travelTo(container);
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

            let target: Source | null = Game.getObjectById(this.memory.sourceId);
            if (target) {
                if (this.harvest(target) == ERR_NOT_IN_RANGE) {
                    this.travelTo(target);
                }
            }
        }
    }
};

Creep.prototype.moveToPos = function(pos, opts) {
    if (opts == undefined) {
        opts = {};
    }
    opts.reusePath = 20;
    opts.ignoreCreeps = 1;
    if (opts.costCallback == undefined) {
        opts.costCallback = (roomName: string, costMatrix: { set: (arg0: number, arg1: number, arg2: number) => void; }) => {
            for (let name in Game.creeps) {
                if (Game.creeps[name].room.name == roomName) {
                    costMatrix.set(Game.creeps[name].pos.x, Game.creeps[name].pos.y, 5);
                }
            }
        }
    }

    return this.moveTo(pos, opts);
};

Creep.prototype.findInManagerRooms = function(type, opts) {
    let results: Object[] = [];
    for (let key in this.manager.memory.rooms) {
        let room = Game.rooms[this.manager.memory.rooms[key]];
        if (room) {
            results = results.concat(room.find(type, opts));
        }
    }
    return results;
};
