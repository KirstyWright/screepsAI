// example declaration file - remove these and add your own custom typings


// import { Manager } from "manager";
// import { Task } from "task";

// memory extension samples
interface CreepMemory {
    targetRoom?: string;
    category?: string;
    targetId?: string|null;
    emptying?: boolean;
    taskHash?: any;
    sourceId?: null | string;
    respawn_complete?: boolean;
    role: string;
    room?: string;
    lastPos?: string | null;
    managerId: number;
}

interface Creep {
    idleMovement: boolean;
    findInManagerRooms: (type: any, opts: any) => any[];
    moveToPos: (pos: any, opts?: any) => 0 | -1 | -4 | -11 | -12 | -2 | -7;
    getEnergy: (useContainer?: any, useSource?: any, roomName?: any) => any;
    getManagerMemory: () => ManagerMemory;
    log: (arg0: string) => void;
    manager: Manager;
    run: () => void;
    task?: typeof Task;
}

interface StructureSpawn {
    attemptSpawning: () => void;
    generateCreepName: (role: string) => string;
    queueCreep: (data: any) => { parts: any; role: any; name: any; data: any; };
    manager: Manager;
}

interface Memory {
    stats: any;
    lastCreepId: number;
    temp: string;
    uuid: number;
    log: any;
    manager: Array<ManagerMemory>;
}

interface ManagerMemory {
    creeps: Array<String>;
    sources: Array<ManagerMemorySources>
    room: String
    rooms: Array<String>
    spawnQueue: Array<ManagerMemorySpawnObject>
}

interface ManagerMemorySpawnObject {
    name: string;

}

interface ManagerMemorySources {
    sourceId: Id<Source>;
    miners: Array<String>,
    pos: RoomPosition
    containerId: Id<StructureContainer> | null
}

// `global` extension samples
declare namespace NodeJS {
    interface Global {
        log: any;
    }
}

interface String {
    hashCode(): number;
}

interface Global {
  // document: Document;
  // window: Window;
  managers: Manager[]
  directives: Directive[]
  Profiler: any
}
