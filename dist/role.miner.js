module.exports = {
    run: function(creep) {
        if (creep.memory.teamId && !Memory.miningCrews[creep.memory.teamId]) {
            Memory.miningCrews[creep.memory.teamId] = {}
        }
        if (creep.memory.teamId && !Memory.miningCrews[creep.memory.teamId].minerId) {
            Memory.miningCrews[creep.memory.teamId].minerId = creep.id;
        }
        creep.getEnergy(false, true);
    }
}
