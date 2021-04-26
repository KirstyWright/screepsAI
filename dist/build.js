/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('build');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    pathfinderCostIgnoreRoads: {
        plainCost: 2,
        swampCost: 10,
        roomCallback(roomName) {
            let room = Game.rooms[roomName];
            if (!room) return;
            let costs = new PathFinder.CostMatrix;

            room.find(FIND_STRUCTURES).forEach(function(struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    // Favor roads over plain tiles
                    costs.set(struct.pos.x, struct.pos.y, 2);
                } else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                    // Can't walk through non-walkable buildings
                    costs.set(struct.pos.x, struct.pos.y, 0xff);
                }
                room.find(FIND_CREEPS).forEach(function(creep) {
                    costs.set(creep.pos.x, creep.pos.y, 0);
                });
            });
            return costs;
        }
    },
    run: function(manager) {
        if (manager.memory.buildQueue == undefined) {
            manager.memory.buildQueue = [];
        }
        if (_.filter(Game.creeps, (creep) => creep.memory.role == 'builder' && creep.room.id == manager.room.id).length > 1 && this.getCurrentSites(manager) < 2) {
            this.buildExtensions(manager);
            this.createRoads(manager);
        }
    },
    getCurrentSites: function(manager) {
        let results = [];
        for (let key in manager.memory.rooms) {
            let room = Game.rooms[manager.memory.rooms[key]];
            if (room) {
                results = results.concat(room.find(FIND_CONSTRUCTION_SITES));
            }
        }
        return results;
    },
    createRoads(manager) {
        let roads = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_ROAD;
            }
        });
        let search = manager.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        let spawn = search[0];
        // roads to sources
        let roadsToBuild = 5;
        let sources = manager.memory.sources;
        // let sources = manager.room.find(FIND_SOURCES);
        for (let key in sources) {
            if (roadsToBuild <= 0) {
                break;
            }
            let pathFinder = PathFinder.search(new RoomPosition(sources[key].pos.x, sources[key].pos.y, sources[key].pos.roomName), {
                pos: spawn.pos,
                range: 1
            });
            for (let pathKey in pathFinder.path) {
                let pos = pathFinder.path[pathKey];
                if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length && this.getCurrentSites(manager) < 2) {
                    if (pos.roomName == spawn.room.name) {
                        manager.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                        roadsToBuild = roadsToBuild - 1;
                    }
                }
            }
        }
        // roads to structures
        let structures = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return (structure.structureType == STRUCTURE_CONTROLLER
                || structure.structureType == STRUCTURE_TOWER);
            }
        });
        for (let key in structures) {
            let structure = structures[key];
            let path = PathFinder.search(spawn.pos, {pos: structure.pos, range: 1}, this.pathfinderCostIgnoreRoads);
            for (let pathKey in path.path) {
                if (roadsToBuild <= 0) {
                    break;
                }
                let pos = path.path[pathKey];
                if (!pos.lookFor(LOOK_STRUCTURES).length && !pos.lookFor(LOOK_CONSTRUCTION_SITES).length) {
                    manager.room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD);
                    roadsToBuild = roadsToBuild - 1;
                }
            }
        }

    },
    buildExtensions: function(manager) {
        // extensions build
        let search = manager.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });
        let spawn = search[0];
        let currentExtensions = manager.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                return structure.structureType == STRUCTURE_EXTENSION;
            }
        });

        let extensionsMap = {
            0: 0,
            1: 0,
            2: 5,
            3: 10,
            4: 20,
            5: 30,
            6: 40,
            7: 50,
            8: 60
        };
        let numberOfExtensionsAvailable = extensionsMap[manager.room.controller.level];

        if (currentExtensions.length >= numberOfExtensionsAvailable || this.getCurrentSites(manager).length > 2) {
            return
        }
        let tiles = manager.room.getTerrain();
        let options = [];
        for (var y = 0; y < 50; y++) {
            for (var x = 0; x < 50; x++) {
                if (
                    (tiles.get(x, y) === 0 || tiles.get(x, y) === TERRAIN_MASK_SWAMP) // plain or swamp
                    && (x + y) % 2 === 1 // fancy pattern§
                ) {
                    let results = manager.room.lookAt(x, y);
                    let flag = false;
                    for (let key in results) {
                        if (results[key].type == 'structure') {
                            flag = true;
                            break;
                        }
                    }
                    if (!flag) {
                        options.push({
                            x: x,
                            y: y
                        });
                    }
                }
            }
        }

        let sorted = options.sort( (a, b) => {
            return (spawn.pos.getRangeTo(a.x, a.y) - spawn.pos.getRangeTo(b.x, b.y));
        } );

        if (sorted[0]) {
            spawn.room.createConstructionSite(sorted[0].x, sorted[0].y, STRUCTURE_EXTENSION);
        }

    }
};
// new RoomVisual(spawn.room.name).circle(pos,{fill:'orange'});
