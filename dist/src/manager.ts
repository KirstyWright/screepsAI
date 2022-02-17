import { TaskManager } from "taskmanager";
import { GroupManager } from "groupmanager";
import { SpawnModule } from "spawn";
import { BuildModule } from "build";
import { GroupCombat } from "./group/combat";

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

        if (!this.memory.variables) {
            this.memory.variables = {};
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

        // for (let key in this.memory.sources) {
        //     let sourceMemory = this.memory.sources[key];
        //     for (let i = 0; i < sourceMemory.miners.length; i++) {
        //         if (!Game.creeps[sourceMemory.miners[i]]) {
        //             let result = this.scheduleCreepIfNotInQueue('miner', {sourceId:sourceMemory.sourceId}, true);
        //             if (!result) {
        //                 console.log('Removing miner '+ sourceMemory.miners[i] + ' from source');
        //                 delete this.memory.sources[key].miners[i];
        //             } else {
        //                 // console.log('miner '+sourceMemory.miners[i] + " is in spawn queue");
        //             }
        //             // sourceId: Spawner.manager.memory.sources[key].sourceId
        //         }
        //     }
        // }

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
        this.manageDefenses();

        let builderTasks = this.taskManager.getTasksByType('repair').length + this.taskManager.getTasksByType('build').length;
        let builders = Object.values(this.creeps).filter( creep => creep.memory.role == 'builder');
        let upgraders = Object.values(this.creeps).filter( creep => creep.memory.role == 'upgrader');
        let numOfBuildersNeeded = Math.ceil(builderTasks / 10);
        let count: number;

        if (numOfBuildersNeeded < builders.length && upgraders.length > 2) {
            count = 0;
            Object.values(this.creeps).forEach(creep => {
                if (creep.memory.role == 'upgrader') {
                    if (count <= 2) {
                        count = count + 1;
                        return;
                    }
                    this.log("Converting a upgrader to builder ("+creep.name+")");
                    creep.memory.role = 'builder';
                }
            });
        } else if (builders.length > numOfBuildersNeeded) {
            count = builders.length;
            Object.values(this.creeps).forEach(creep => {
                if (creep.memory.role == 'builder') {
                    if (count <= 2) {
                        count = count + 1;
                        return;
                    }
                    this.log("Converting a builder to upgrader ("+creep.name+")");
                    creep.memory.role = 'upgrader';
                }
            });
        }
        if (this.room.controller && this.room.controller.ticksToDowngrade < 200) {
            // PANIC
            console.log('Controller near downgrade!!!')
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

    scheduleCreepIfNotInQueue(role: string, data: Record<string, any>, dry: boolean = false): boolean {
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
        if (!inQueue && dry == false) {
            let spawner = this.spawners[0];
            data.role = role;
            spawner.queueCreep(data);
        }
        return inQueue;
    }

    /**
     * [manageDefenses description]
     * level1
     * - Normal ops
     * level2
     * - Triggered by a hostile creep (includes invaders)
     * - Drops to level1 when no hostile creeps
     * - Defender creep to room in question
     * level3
     * - Triggered by hostile creeps (includes invaders) in room for longer than 50 ticks or more than 2 creeps
     * - Drops to level 2 when all killed
     * - Defender creep group to room in question
     */
    manageDefenses(): void
    {
        let hostileCreepsInRooms: Creep[] = this.findInRooms(FIND_HOSTILE_CREEPS);
        let militiaCreeps = Object.values(this.creeps).filter( (creep) => {
            return creep.memory.role == 'militia';
        });


        switch (this.memory.variables.defenseLevel) {
            case 1:
                // Do we need to go up?
                if (hostileCreepsInRooms.length > 0) {
                    this.changeDefenseLevel(2);
                }
                break;
            case 2:
                if (hostileCreepsInRooms.length == 0) {
                    this.changeDefenseLevel(1);
                } else if (hostileCreepsInRooms.length > 4 || Game.time > (this.memory.variables.defenseLevelModifiedTick + 50)) {
                    this.changeDefenseLevel(3);
                }
                break;
            case 3:
                if (militiaCreeps.length < 2) {
                    this.scheduleCreepIfNotInQueue('militia', {category:'patrol'});
                }

                if (hostileCreepsInRooms.length == 0) {
                    this.changeDefenseLevel(2);
                    // Group gets autodeleted by constructor
                }
                if (Game.time > (this.memory.variables.defenseLevelModifiedTick + 500)) {
                    // this.changeDefenseLevel(4);
                }
                break;
            case 4:
                let cgroup = new GroupCombat("RECRUITING", this.room.name, false);

                if (!this.groupManager.groups[cgroup.hash]) {
                    this.groupManager.addGroup(cgroup);
                }

                if (hostileCreepsInRooms.length == 0) {
                    this.changeDefenseLevel(2);
                    // Group gets autodeleted by constructor
                }
                break;
            default:
                this.changeDefenseLevel(1);
        }
    }

    changeDefenseLevel(level: Number): void {
        this.log('Defense level changing from '+this.memory.variables.defenseLevel+' to '+level)
        this.memory.variables.defenseLevel = level;
        this.memory.variables.defenseLevelModifiedTick = Game.time;
    }

}
