require('prototype_spawner');
let spawnModule = require('spawn');
let buildModule = require('build');
class Manager {
    constructor (id) {
        this.id = id;
        this.memory = Memory.manager[id];

        this.room = Game.rooms[this.memory.room];
    }
    log (content) {
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
        this.creeps = {};

        if (!this.memory.rooms || this.memory.rooms.length == 0) {
            this.memory.rooms = [];
            this.memory.rooms.push(this.memory.room);

            let exits = Game.map.describeExits(this.room.name);
            for (let dir in exits) {
                this.memory.rooms.push(exits[dir]);
            }
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
                this.log("Found new source "+sourcesInRoom[key].id);
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

        let search = this.room.find(FIND_MY_STRUCTURES, {
            filter: { structureType: STRUCTURE_SPAWN }
        });


        this.spawner = search[0];
        this.spawner.manager = this;
    }
    addRoom(roomName) {
        let room = Game.rooms[roomName];
        if (room) {
            if (!this.memory.rooms.includes(roomName)) {
                this.memory.rooms.push(roomName);
                let sourcesInRoom = room.find(FIND_SOURCES);
                for (let key in sourcesInRoom) {
                    this.memory.sources.push({
                        "miners": [],
                        "pos": sourcesInRoom[key].pos,
                        "sourceId": sourcesInRoom[key].id
                    });
                    this.log("Found new source "+sourcesInRoom[key].id);
                }
            }
        }
    }
    run() {
        spawnModule.run(this.spawner);
        this.spawner.attemptSpawning();

        buildModule.run(this);
    }
}

module.exports = Manager;
