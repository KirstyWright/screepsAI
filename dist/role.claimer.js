module.exports = {
    run: function(creep) {
        console.log(creep);

        let flag = Game.flags['claim'];
        if (flag) {
            if (!flag.room) {
                creep.moveTo(flag, {reusePath:true});
            } else if (creep.claimController(flag.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            } else {
                creep.claimController(flag.room.controller)
            }
        }
    }
}
