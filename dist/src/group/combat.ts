import { Group } from "./group";

export class GroupCombat extends Group {
    targetRoom: string
    targetId: Id<Creep> | null = null

    constructor(stage: string, targetRoom: string, recruitWhenEnded: boolean, extra?: Record<string, any>) {
        super();
        this.requiredCreeps = ['militia', 'militia', 'militia', 'cmedic']
        this.type = 'combat'
        this.stage = stage;
        this.targetRoom = targetRoom;
        this.recruitWhenEnded = recruitWhenEnded;

        if (extra) {
            if (extra['targetId']) {
                this.targetId = extra['targetId']
            }
        }

        this.hash = String(this.type + targetRoom).hashCode();
    }

    run() {

        if (!this.manager) {
            return;
        }

        let tempList = this.requiredCreeps;
        for (let key in this.manager.creeps) {
            let creep = this.manager.creeps[key];
            if (creep.memory.groupHash == this.hash) {
                let index = tempList.indexOf(creep.memory.role);
                if (index >= 0) {
                    this.creeps.push(creep);
                    tempList.splice(index, 1);
                }
            }
        }

        if (this.stage === "RECRUITING" && tempList.length == 0) {
            this.stage = "ACTIVE";
            this.log("Switching to ACTIVE");
        } else if (this.stage == 'ACTIVE' && this.creeps.length == 0) {
            if (this.recruitWhenEnded) {
                this.stage = "RECRUITING";
                this.log("Switching to RECRUITING");
            } else {
                this.deleteGroup();
            }
        }

        if (this.stage === "RECRUITING") {
            this.scheduleCreeps(tempList);
        }

        if (this.stage === "ACTIVE") {
            this.activeRun();
        }
    }

    storageData(): Record<string, any> {
        return {
            type: this.type,
            stage: this.stage,
            targetRoom: this.targetRoom,
            recruitWhenEnded: this.recruitWhenEnded,
            targetId: this.targetId
        };
    }

    scheduleCreeps(list: string[]):void {
        if (!this.manager) {
            return;
        }
        for (let i = 0; i < list.length; i++) {
            this.manager.scheduleCreepIfNotInQueue(list[i], {
                groupHash: this.hash
            });
        }
    }

    activeRun(): void {
        let packlead: Creep|null = null;
        var target: Creep|null = null;

        this.creeps.forEach((creep) => {
            if (creep.memory.role == 'militia') {
                if (!packlead) {
                    packlead = creep;
                }
                if (creep.id != packlead.id) {
                    creep.travelTo(packlead.pos);
                }
                if (creep.room.name != this.targetRoom) {
                    creep.travelTo(new RoomPosition(25, 25, this.targetRoom));
                    return;
                } else {
                    // find target
                    if (this.targetId) {
                        target = Game.getObjectById<Creep>(this.targetId);
                    }
                    if (!target) {
                        target = this.findTarget(creep);
                        if (!target) {
                            return;
                        }
                        this.targetId = target.id;
                    }
                    let attackMove = creep.rangedAttack(target);
                    if (attackMove == OK) {
                        let path = PathFinder.search(creep.pos, creep.room.find(FIND_HOSTILE_CREEPS).map(c => { return { pos: c.pos, range: 3 }; }), { flee: true }).path;
                        creep.moveByPath(path);
                    } else if (attackMove == ERR_NOT_IN_RANGE) {
                        let anotherTarget = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                        if (anotherTarget && creep.pos.inRangeTo(anotherTarget, 3)) {
                            creep.rangedAttack(anotherTarget);
                            return;
                        }
                        creep.travelTo(target, {
                            ignoreRoads: true,
                        });
                    }
                    // attack target
                }
            } else if (creep.memory.role == 'cmedic' && packlead) {
                let creepsToHeal = this.creeps.filter((targetCreep) => targetCreep.hits < targetCreep.hitsMax);
                if (creepsToHeal.length > 0) {
                    creepsToHeal.sort((a, b) => a.hits - b.hits);

                    creep.travelTo(creepsToHeal[0].pos, {range:1});
                    creep.rangedHeal(creepsToHeal[0]);
                } else {
                    creep.travelTo(packlead.pos, {range:1});
                }

                let enemies = creep.room.find(FIND_HOSTILE_CREEPS);
                for (let key in enemies) {
                    if (creep.pos.inRangeTo(enemies[key], 4)) {
                        // check their body parts
                        let attacker = false;
                        for (let i = 0; i < enemies[key].body.length; i++) {
                            if (enemies[key].body[i].type === ATTACK || enemies[key].body[i].type === RANGED_ATTACK) {
                                attacker = true;
                                break;
                            }
                        }
                        if (attacker) {
                            let path = PathFinder.search(creep.pos, enemies.map(c => { return { pos: c.pos, range: 3 }; }), { flee: true }).path;
                            creep.moveByPath(path);
                            break;
                        }
                    }
                }

            }
        })
    }

    findTarget(creep: Creep): Creep | null {
        if (!creep.my) {
            return null;
        }
        let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if (hostile) {
            return hostile;
        }
        return null;
    }

    static buildFromMemory(memoryRecord: Record<string, any>): GroupCombat|false{

        let targetRoom = memoryRecord.targetRoom;
        if (!targetRoom) {
            return false;
        }

        return new GroupCombat(
            memoryRecord.stage,
            targetRoom,
            memoryRecord.recruitWhenEnded,
            {
                targetId: memoryRecord.targetId
            }
        );
    }
};
