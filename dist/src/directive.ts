import { Helper } from 'helper';
import { Manager } from 'manager';
import { DirectiveBase } from 'directive/base';
import { DirectiveScout } from 'directive/scout';
import { DirectiveMine } from 'directive/mine';
import { Tick } from 'Tick';

// Flag control system
// Each tick:
// init every flag (including getting managers)
// run flags prior to managers running


// Flag.prototype.queueCreep = function(data) {
//
// }


export class Directive {

    flag: Flag;
    manager: Manager | null;
    specificDirective: DirectiveBase | null;

    constructor(flag: Flag) {
        this.flag = flag;
        this.manager = null;
        this.specificDirective = null;
    }

    init() {
        let args: string[] = this.flag.name.split("-");
        let id = Number(args[0]);
        this.manager = Tick.managers[id];
        this.specificDirective = Directive.getSpecificDirectiveByColour(this);
        if (!this.manager) {
            return;
        }
        if (args.length < 2) {
            // has no memory
            if (typeof id === 'number' && Tick.managers[id] != undefined && this.specificDirective != null) {
                let flagName = this.manager.id + '-' + this.flag.pos.roomName + '-' + this.specificDirective.type;
                let pos = this.flag.pos;

                if (Game.rooms[pos.roomName]) {
                    let c1 = this.flag.color;
                    let c2 = this.flag.secondaryColor
                    this.flag.remove();
                    Game.rooms[pos.roomName].createFlag(pos.x, pos.y, flagName, c1, c2);
                    console.log('Recreating flag with ID');
                }
            }
        }
    }

    run() {
        if (this.specificDirective) {
            return this.specificDirective.run();
        }
        return;
    }

    static getSpecificDirectiveByColour(directive: Directive): DirectiveBase | null{
        switch (directive.flag.color) {
            case COLOR_BLUE:
                switch (directive.flag.secondaryColor) {
                    case COLOR_RED:
                        return new DirectiveMine(directive);
                    case COLOR_PURPLE:
                        return new DirectiveScout(directive);
                    default:
                        return null;
                }
            default:
                return null;
        }
    }
}
