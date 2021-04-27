export class RoleMiner {
    static run(creep: Creep) {
        this.mine(creep);
    }
    static mine(creep :Creep) {
        let sources = creep.manager.memory.sources;
        if (creep.memory.sourceId) {
            let cachedSource = null;
            for (let key in sources) {
                if (sources[key].sourceId !== creep.memory.sourceId) {
                    continue;
                }
                cachedSource = sources[key];
            }
            if (cachedSource.pos.roomName === creep.pos.roomName) {
                let target = Game.getObjectById<Source>(creep.memory.sourceId);
                if (target && creep.harvest(target) == ERR_NOT_IN_RANGE) {
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
