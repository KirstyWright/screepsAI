import { TaskManager } from "taskmanager";
import { SpawnModule } from "spawn";
// let buildModule = require('build');
export class Manager {
    memory: any;
    id: number;
    room: Room;
    creeps: Record<string, Creep> = {};
    spawner: StructureSpawn;
    taskManager: TaskManager;

    constructor(id: number) {
        this.id = id;
        this.memory = Memory.manager[id];
        this.creeps = {};
        this.room = Game.rooms[this.memory.room];

        let search = this.room.find(FIND_MY_SPAWNS);

        this.spawner = search[0];
        this.spawner.manager = this;
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
            this.memory.rooms.push(this.memory.room);

            let exits = Game.map.describeExits(this.room.name);
            this.memory.rooms = Object.values(exits);
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
        SpawnModule.run(this.spawner);
        this.spawner.attemptSpawning();

        // buildModule.run(this);

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

        if (!Memory.temp || Memory.temp != 'v') {
            Memory.temp = 'v';
            this.addRoom("W43N28");
        }


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
