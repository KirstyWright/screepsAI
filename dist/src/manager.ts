import { TaskManager } from "taskmanager";
import { GroupManager } from "groupmanager";
import { SpawnModule } from "spawn";
import { BuildModule } from "build";
import { GroupDismantle } from "./group/dismantle";

export class Manager {
    memory: any;
    id: number;
    room: Room;
    creeps: Record<string, Creep> = {};
    spawners: StructureSpawn[];
    taskManager: TaskManager;
    groupManager: GroupManager;
    wallStrength: Number = 1000;

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
        this.taskManager = new TaskManager(this);
        this.groupManager = new GroupManager(this);

    }
    log(content: any) {
        console.log("Manager:" + this.id + ': ' + String(content));
    }
    init() {
        if (!this.memory.creeps) {
            this.memory.creeps = [];
        }
        if (!this.memory.groups) {
            this.memory.groups = [];
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
                this.creeps[key].moved = false;
            }
        }

        if (this.room.controller && this.room.controller.level > 2) {
            this.wallStrength = (this.room.controller.level * 1000) * 2;
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

        this.taskManager.getNewTasks();

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
            }
        );

        towers.forEach((tower) => {
            let result = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (result) {
                tower.attack(result);
                return;
            }
            result = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (object) => {
                    return (object.hits < object.hitsMax);
                }
            });
            if (result) {
                tower.heal(result);
                return;
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
                            object.hits < this.wallStrength
                        )
                    );
                }
            });
            targets.sort((a, b) => a.hits - b.hits);
            if (targets.length > 0) {
                tower.repair(targets[0]);
            }
        });


        this.groupManager.run();
        if (this.taskManager.getTasksByType('repair').length > 20) {
            // keep one upgrader
            let first = true;
            Object.values(this.creeps).forEach(creep => {
                if (creep.memory.role == 'upgrader') {
                    if (first) {
                        first = false;
                        return;
                    }
                    creep.memory.role = 'builder';
                }
            });
        } else if (this.taskManager.getTasksByType('repair').length < 4) {
            let first = 0;
            Object.values(this.creeps).forEach(creep => {
                if (creep.memory.role == 'builder') {
                    if (first <= 3) {
                        first = first + 1;
                        return;
                    }
                    creep.memory.role = 'upgrader';
                }
            });
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
        this.groupManager.finish();
    }

    scheduleCreepIfNotInQueue(role: string, data: Record<string, any>) {
        let queue = this.memory.spawnQueue;
        let inQueue = false;
        for (let i = 0; i < queue.length; i++) {
            let item = queue[i];
            if (item.role == role) {
                for (let key in item.data) {
                    if (data[key] && data[key] == item.data[key]) {
                        inQueue = true;
                        break;
                    }
                }
            }
        }
        if (!inQueue) {
            let spawner = this.spawners[0];
            data.role = role;
            spawner.queueCreep(data);
        }
    }

}
