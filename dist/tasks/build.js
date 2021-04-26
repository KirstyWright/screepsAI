var Task = require('task');
class BuildTask extends Task {
    constructor(target) {
        this.type = 'build';
        this.target = target;
        super()

        this.log('hi')
    }
}

module.exports = BuildTask;
