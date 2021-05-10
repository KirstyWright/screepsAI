export class RoleMiner {
    static run(creep: Creep) {
        this.mine(creep);
    }
    static mine(creep: Creep) {
        let sources = creep.manager.memory.sources;
        if (creep.memory.sourceId) {
            let cachedSource = null;
            let cachedSourceKey = null;
            for (let key in sources) {
                if (sources[key].sourceId !== creep.memory.sourceId) {
                    continue;
                }
                cachedSource = sources[key];
                cachedSourceKey = key;
            }
            if (cachedSource.pos.roomName === creep.pos.roomName) {
                let target = Game.getObjectById<Source>(creep.memory.sourceId);

                if (!target || !target.pos) {
                    return;
                }
                let container: null | StructureContainer = null;
                if (cachedSource.containerId) {
                    container = Game.getObjectById<StructureContainer>(cachedSource.containerId);
                    if (!container) {
                        // destroyed?
                        cachedSource.containerId = null;
                    }
                }

                if (container && container.pos) {
                    if (creep.pos != container.pos) {
                        if (container.pos.lookFor(LOOK_CREEPS).length == 0) {
                            creep.moveToPos(container.pos, {
                                range: 0
                            });
                        } else {
                            creep.moveToPos(target.pos, {
                                range: 1
                            });
                        }
                    }

                    creep.harvest(target);
                } else {
                    if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                        creep.moveToPos(target.pos, {
                            range: 1
                        });
                    }
                }

                if (!container && creep.pos.inRangeTo(target.pos.x, target.pos.y, 1)) {
                    // Need a container
                    let containerList = target.room.find<StructureContainer>(FIND_STRUCTURES, {
                        filter: (structure) => {
                            return structure.structureType === STRUCTURE_CONTAINER && structure.pos.inRangeTo((<Source>target).pos, 1);
                        }
                    });
                    if (containerList.length > 0) {
                        console.log("Found container - registering");
                        creep.manager.memory.sources[cachedSourceKey].containerId = containerList[0].id;
                        return;  // will do rest next loop
                    }

                    // Is there a construction site?
                    let list = target.room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: (structure) => {
                            return structure.structureType === STRUCTURE_CONTAINER && structure.pos.inRangeTo((<Source>target).pos, 1);
                        }
                    });
                    if (list.length < 1) {
                        creep.log('Creating container');
                        target.room.createConstructionSite(creep.pos.x, creep.pos.y, STRUCTURE_CONTAINER);
                    }
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
