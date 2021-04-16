require('prototype_spawner');
let spawnModule = require('spawn');
let buildModule = require('build');
class Manager {
    constructor (id) {
        this.id = id;
        this.memory = Memory.manager[id];

        this.room = Game.rooms[this.memory.room]
    }
    init() {
        if (!this.memory.creeps) {
            this.memory.creeps = [];
        }

        this.creeps = {}

        for (let key in this.memory.creeps) {
            if (!Game.creeps[this.memory.creeps[key]]) {
                this.memory.creeps.splice(key, 1);
            } else {
                this.creeps[key] = Game.creeps[this.memory.creeps[key]];
            }
        }

        this.spawner = Game.spawns["Spawn1"];
        this.spawner.manager = this;
    }
    run() {
        spawnModule.run(this.spawner);
        this.spawner.attemptSpawning();

        buildModule.run(this);
    }
}

module.exports = Manager
