import { Manager } from "manager";

export class Stats {
    static exportStats(managers: Manager[]) {
        // Reset stats object
        Memory.stats = {
            gcl: {},
            rooms: {},
            cpu: {},
            managers: {}
        };

        Memory.stats.time = Game.time;

        for (let key in managers) {
            let manager = managers[key];
            Memory.stats.managers[key] = {
                tasks: {
                    build: manager.taskManager.getTasksByType('build').length,
                    repair: manager.taskManager.getTasksByType('repair').length,
                    collect: manager.taskManager.getTasksByType('collect').length,
                    scout: manager.taskManager.getTasksByType('scout').length,
                    reserve: manager.taskManager.getTasksByType('reserve').length,
                },
                creeps: {
                    builder: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'builder').length,
                    claimer: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'claimer').length,
                    distributor: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'distributor').length,
                    harvester: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'harvester').length,
                    hauler: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'hauler').length,
                    militia: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'militia').length,
                    miner: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'miner').length,
                    scout: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'scout').length,
                    upgrader: Object.values(manager.creeps).filter( (creep) => creep.memory.role === 'upgrader').length
                }
            };
        }

        // Collect room stats
        for (let roomName in Game.rooms) {
            let room = Game.rooms[roomName];
            let isMyRoom = (room.controller ? room.controller.my : false);
            if (isMyRoom) {
                Memory.stats.rooms[roomName] = {
                    storageEnergy: (room.storage ? room.storage.store.energy : 0),
                    terminalEnergy: (room.terminal ? room.terminal.store.energy : 0),
                    energyAvailable: room.energyAvailable,
                    energyCapacityAvailable: room.energyCapacityAvailable,
                    controllerProgress: (room.controller ? room.controller.progress : 0),
                    controllerProgressTotal: (room.controller ? room.controller.progressTotal : 0),
                    controllerLevel: (room.controller ? room.controller.level : 0),
                };
            }
        }

        // Collect GCL stats
        Memory.stats.gcl.progress = Game.gcl.progress;
        Memory.stats.gcl.progressTotal = Game.gcl.progressTotal;
        Memory.stats.gcl.level = Game.gcl.level;

        // Collect CPU stats
        Memory.stats.cpu.bucket = Game.cpu.bucket;
        Memory.stats.cpu.limit = Game.cpu.limit;
        Memory.stats.cpu.used = Game.cpu.getUsed();
    }
}
