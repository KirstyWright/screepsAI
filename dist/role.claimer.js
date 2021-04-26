module.exports = {
    run: function(creep) {

        if (Game.rooms['W43N28']) {
            let room = Game.rooms['W43N28'];
            if (room.controller && (room.controller.upgradeBlocked == undefined || room.controller.upgradeBlocked < 70)) {
                let claimCommand = creep.reserveController(room.controller);
                if (claimCommand == ERR_NOT_IN_RANGE) {
                    creep.moveToPos(room.controller);
                }
                return;
            }
        }

        let flag = Game.flags['claim'];
        if (flag) {
            if (!flag.room || creep.room.name != flag.room.name) {
                creep.moveToPos(flag);
                return;
            }
            // let claimCommand = creep.attackController(flag.room.controller);
            // let claimCommand = creep.claimController(flag.room.controller);
            let claimCommand = creep.reserveController(flag.room.controller);
            if (claimCommand == ERR_NOT_IN_RANGE) {
                creep.moveToPos(creep.room.controller);
            }
        }
    }
};
