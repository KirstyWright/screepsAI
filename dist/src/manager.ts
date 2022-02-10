import { TaskManager } from "taskmanager";
import { SpawnModule } from "spawn";
import { BuildModule } from "build";

export class Manager {
    memory: any;
    id: number;
    room: Room;
    creeps: Record<string, Creep> = {};
    spawners: StructureSpawn[];
    taskManager: TaskManager;

    constructor(id: number) {
        this.id = id;
        this.memory = Memory.manager[id];
        this.creeps = {};
        this.room = Game.rooms[this.memory.room];

        let search = this.room.find(FIND_MY_SPAWNS);

        this.spawners = search;
        this.spawners.forEach(spawner => {
            spawner.manager = this;
        });
        this.taskManager = new TaskManager(this)
    }
    log(content: any) {
        console.log("Manager:" + this.id + ': ' + String(content));
    }
    init() {
        if (!this.memory.creeps) {
            this.memory.creeps = [];
        }

        if (!this.memory.spawnQueue) {
            this.memory.spawnQueue = [];
        }

        if (!this.memory.tasks) {
            this.memory.tasks = [];
        }

        if (!this.memory.rooms || this.memory.rooms.length == 0) {
            this.memory.rooms = [];
            let exits = Game.map.describeExits(this.room.name);
            this.memory.rooms = Object.values(exits);
            this.memory.rooms.push(this.memory.room);
        }

        if (!this.memory.sources || this.memory.sources.length == 0) {
            this.memory.sources = [];
            let sources = [];
            let sourcesInRoom = this.room.find(FIND_SOURCES);
            for (let key in sourcesInRoom) {
                sources.push({
                    "miners": [],
                    "pos": sourcesInRoom[key].pos,
                    "sourceId": sourcesInRoom[key].id
                });
                this.log("Found new source " + sourcesInRoom[key].id);
            }
            this.memory.sources = sources;
        }

        for (let key in this.memory.creeps) {
            if (!Game.creeps[this.memory.creeps[key]]) {
                this.memory.creeps.splice(key, 1);
            } else {
                this.creeps[key] = Game.creeps[this.memory.creeps[key]];
            }
        }

    }
    addRoom(roomName: string) {
        let room = Game.rooms[roomName];
        if (room) {
            if (!this.memory.rooms.includes(roomName)) {
                this.memory.rooms.push(roomName);
            }

            let sourcesInRoom = room.find(FIND_SOURCES);
            for (let key in sourcesInRoom) {
                let currentSourcesWithThisId = this.memory.sources.filter((source: ManagerMemorySources) => {
                    return (source.sourceId === sourcesInRoom[key].id)
                }).length;
                if (currentSourcesWithThisId == 0) {
                    this.memory.sources.push({
                        "miners": [],
                        "pos": sourcesInRoom[key].pos,
                        "sourceId": sourcesInRoom[key].id
                    });
                    this.log("Found new source " + sourcesInRoom[key].id);
                }
            }
        }
    }
    run() {
        // let count = 0;
        // this.memory.sources.forEach((element: ManagerMemorySources) => {
        //     count = count + 1;
        //     if (!element.containerId) {
        //         return;
        //     }
        //     // console.log(element.sourceId);
        //     let source = Game.getObjectById(element.containerId);
        //     let storage = this.room.storage ? this.room.storage.pos : this.spawners[0].pos
        //     if (source && storage) {
        //         let path = PathFinder.search(storage, source.pos, {
        //             plainCost: 2,
        //             swampCost: 3,
        //             roomCallback: (roomName: string) => {
        //                 let costMatrix = new PathFinder.CostMatrix;
        //                 let room = Game.rooms[roomName];
        //                 if (!room) {
        //                     return false;
        //                 }
        //
        //                 room.find(FIND_STRUCTURES).forEach(function(struct) {
        //                     if (struct.structureType !== STRUCTURE_CONTAINER  && struct.structureType !== STRUCTURE_ROAD &&
        //                         (struct.structureType !== STRUCTURE_RAMPART ||
        //                             !struct.my)) {
        //                         // Can't walk through non-walkable buildings
        //                         costMatrix.set(struct.pos.x, struct.pos.y, 255);
        //                     } else if (struct.structureType === STRUCTURE_ROAD) {
        //                         costMatrix.set(struct.pos.x, struct.pos.y, 1);
        //                     }
        //                 });
        //
        //                 return costMatrix;
        //             }
        //         });
        //         if (path.path) {
        //
        //             path.path.forEach(element => {
        //                 new RoomVisual(element.roomName).text(String(count), element);
        //             });
        //         }
        //     }
        // });

        SpawnModule.run(this.spawners[0]);
        this.spawners.forEach(spawner => {
            spawner.attemptSpawning();
        });

        BuildModule.run(this);

        let towers = this.room.find<StructureTower>(
            FIND_MY_STRUCTURES, {
                filter: {
                    structureType: STRUCTURE_TOWER
                }
            });
        towers.forEach((tower) => {
            let result = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (result) {
                tower.attack(result);
            }
            result = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (object) => {
                    return (object.hits < object.hitsMax);
                }
            });
            if (result) {
                tower.heal(result);
            }

            if (tower.store.getUsedCapacity(RESOURCE_ENERGY) < 500) {
                return;
            }
            var targets = this.room.find(FIND_STRUCTURES, {
                filter: (object) => {
                    return (
                        (object.hits < object.hitsMax &&
                            (object.structureType !== STRUCTURE_WALL && object.structureType !== STRUCTURE_RAMPART)) ||
                        (
                            (object.structureType === STRUCTURE_WALL || object.structureType === STRUCTURE_RAMPART) &&
                            object.hits < 5000
                        )
                    );
                }
            });
            targets.sort((a, b) => a.hits - b.hits);
            if (targets.length > 0) {
                tower.repair(targets[0]);
            }
        });

        // if (!Memory.temp || Memory.temp != 'v') {
        //     Memory.temp = 'v';
        //     this.addRoom("W43N28");
        // }


    }

    findStructuresByTypeInRooms<T extends StructureConstant>(structureType: T, filter?: (s: ConcreteStructure<T>) => boolean): ConcreteStructure<T>[] {
        let results: any[] = [];
        for (let key in this.memory.rooms) {
            let room = Game.rooms[this.memory.rooms[key]];
            if (room) {
                results = results.concat(room.find(FIND_STRUCTURES)
                    .filter((s): s is ConcreteStructure<T> => s.structureType === structureType));
            }
        }
        return filter ? results.filter(filter) : results
    }


    findInRooms<K extends FindConstant>(type: K, opts?: FilterOptions<K>): Array<FindTypes[K]> {
        let results: Array<FindTypes[K]> = [];
        for (let key in this.memory.rooms) {
            let room = Game.rooms[this.memory.rooms[key]];
            if (room) {
                results = results.concat(room.find(type, opts));
            }
        }
        return results;
    }
    finish() {
        this.taskManager.finish();
    }
}
