module.exports = {
    run: function(spawn)
    {
        // initalise
        if (Memory.miningCrews == undefined) {
            Memory.miningCrews = {};
            Memory.lastMiningCrewId = 1;
        }

        // find unassigned miners
        let miners = _.filter(Game.creeps, (creep) => creep.memory.role == 'miner');
        if (miners.length == 0 && Memory.run == undefined) {
            Memory.lastMiningCrewId = Memory.lastMiningCrewId + 1;
            let crewId = Memory.lastMiningCrewId;
            Memory.miningCrews[crewId] = {};
            spawn.queueCreep({
                role:'miner',
                teamId: crewId
            });
            spawn.queueCreep({
                role:'hauler',
                teamId: crewId
            });
            Memory.run = true;
        }
    }
}