import { Manager } from "manager";
import { Task } from "task";

export {};

declare global {
  interface RoleRunner {
    run(creep: Creep): void;
  }

  interface CreepSpawnData {
    role?: string;
    managerId?: number;
    sourceId?: Id<Source> | string | null;
    category?: string;
    spawner?: string;
    groupHash?: number;
    [key: string]: string | number | boolean | null | undefined;
  }

  interface ManagerMemoryVariables {
    defenseLevel?: number;
    defenseLevelModifiedTick?: number;
  }

  interface ManagerMemorySpawnObject {
    parts?: BodyPartConstant[];
    role: string;
    name: string;
    data: CreepSpawnData & Partial<CreepMemory>;
    spawned?: boolean;
    spawner?: string;
  }

  interface ManagerMemoryTask {
    hash?: number;
    type: string;
    target?: Id<ConstructionSite> | Id<Structure> | Id<Resource> | Id<Tombstone> | Id<Ruin> | string | null;
    destination?: Id<Structure> | null;
    siteId?: Id<ConstructionSite>;
    stagingPos?: { x: number; y: number; roomName: string };
    amount?: number;
    completed?: boolean;
  }

  interface ManagerMemoryGroup {
    type: string;
    stage?: string;
    targetRoom?: string;
    targetId?: Id<Creep> | null;
    recruitWhenEnded?: boolean;
    hash?: number;
  }

  interface ManagerMemorySources {
    sourceId: Id<Source>;
    miners: string[];
    pos: RoomPosition;
    containerId?: Id<StructureContainer> | null;
  }

  interface ManagerMemory {
    creeps: string[];
    sources: ManagerMemorySources[];
    room: string;
    rooms: string[];
    spawnQueue: ManagerMemorySpawnObject[];
    groups?: Record<string, ManagerMemoryGroup>;
    tasks?: Record<string, ManagerMemoryTask>;
    variables: ManagerMemoryVariables;
    buildQueue?: unknown[];
  }

  interface MemoryStatsManager {
    tasks: Record<string, number>;
    creeps: Record<string, number>;
  }

  interface MemoryStatsRoom {
    storageEnergy: number;
    terminalEnergy: number;
    energyAvailable: number;
    energyCapacityAvailable: number;
    controllerProgress: number;
    controllerProgressTotal: number;
    controllerLevel: number;
  }

  interface MemoryStats {
    time?: number;
    gcl: {
      progress?: number;
      progressTotal?: number;
      level?: number;
    };
    rooms: Record<string, MemoryStatsRoom>;
    cpu: {
      bucket?: number;
      limit?: number;
      used?: number;
    };
    managers: Record<string, MemoryStatsManager>;
  }

  interface MemoryEmpire {
    hostileRooms?: Record<string, boolean | number>;
  }

  interface MemoryRoutes {
    [routeId: string]: unknown;
  }

  interface TaskTargetWithPos {
    pos: RoomPosition;
  }

  interface CreepMemory {
    _travel?: TravelData;
    _trav?: TravelData;
    targetRoom?: string;
    category?: string;
    targetId?: string | null;
    emptying?: boolean;
    taskHash?: number | null;
    groupHash?: number;
    sourceId?: null | Id<Source> | string;
    respawn_complete?: boolean;
    role: string;
    room?: string;
    lastPos?: string | null;
    managerId: number;
  }

  interface Creep {
    genericRun: () => boolean;
    idleMovement: boolean;
    findInManagerRooms: <K extends FindConstant>(
      type: K,
      opts?: FilterOptions<FindTypes[K], FindTypes[K]>
    ) => FindTypes[K][];
    moveToPos: (pos: RoomPosition, opts?: MoveToOpts) => ScreepsReturnCode;
    getEnergy: (useContainer?: boolean, useSource?: boolean, roomName?: string, taskPosition?: RoomPosition) => ScreepsReturnCode | void;
    getManagerMemory: () => ManagerMemory;
    log: (content: string) => void;
    manager: Manager;
    run: () => void;
    task?: Task | null;
    moved: boolean;
    travelTo: (target: RoomPosition | { pos: RoomPosition }, opts?: MoveToOpts) => ScreepsReturnCode;
  }

  interface StructureSpawn {
    attemptSpawning: () => void;
    generateCreepName: () => string;
    queueCreep: (data: CreepSpawnData) => ManagerMemorySpawnObject;
    manager: Manager;
  }

  interface Memory {
    routes: MemoryRoutes;
    stats: MemoryStats;
    lastCreepId: number;
    temp: string;
    uuid: number;
    log: Record<string, unknown>;
    manager: ManagerMemory[];
    empire?: MemoryEmpire;
  }

  interface RoomMemory {
    avoid?: number;
  }

  declare namespace NodeJS {
    interface Global {
      log: Record<string, unknown>;
    }
  }

  interface String {
    hashCode(): number;
  }
}
