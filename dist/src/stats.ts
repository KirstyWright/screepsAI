module.exports = {
    exportStats: function () {
        // Reset stats object
        Memory.stats = {
            gcl: {},
            rooms: {},
            cpu: {},
        };

        Memory.stats.time = Game.time;

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
                    controllerProgress: (room.controller ? room.controller.progress: 0),
                    controllerProgressTotal: (room.controller ? room.controller.progressTotal: 0),
                    controllerLevel: (room.controller ? room.controller.level: 0),
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
};
