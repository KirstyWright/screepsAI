module.exports = {
    run: function(creep) {
        this.mine(creep);
    },
    mine: function(creep) {
        let sources = creep.getManagerMemory().sources;
        if (!creep.memory.sourceId) {
            let sortable = [];
            for (let key in sources) {
                sortable.push({
                    "num": sources[key].miners.length,
                    "key": key
                });
            }

            sortable.sort(function(a, b) {
                return a["num"] > b["num"];
            });

            let first = sources[sortable[0].key];
            if (!sources[sortable[0].key].miners.includes(creep.name)) {
                creep.getManagerMemory().sources[sortable[0].key].miners.push(creep.name);
            }
            creep.memory.sourceId = first.sourceId;

        }
        if (creep.memory.sourceId) {
            let cachedSource = null;
            for (let key in sources) {
                if (sources[key].sourceId !== creep.memory.sourceId) {
                    continue;
                }
                cachedSource = sources[key];
            }
            if (cachedSource.pos.roomName === creep.pos.roomName) {
                let target = Game.getObjectById(creep.memory.sourceId);
                if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(target, {
                        range: 1,
                        visualizePathStyle: {
                            stroke: '#ffaa00'
                        }
                    });
                }
            } else {
                creep.moveToPos(new RoomPosition(cachedSource.pos.x, cachedSource.pos.y, cachedSource.pos.roomName), {
                    visualizePathStyle: {
                        stroke: '#ffaa00'
                    }
                });
            }
        }
    }
};
