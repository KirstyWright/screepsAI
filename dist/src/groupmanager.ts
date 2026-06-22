import { Manager } from "manager";
import { Group } from "./group/group";
import { GroupDismantle } from "./group/dismantle";
import { GroupCombat } from "./group/combat";

export class GroupManager {
  manager: Manager;
  groups: Record<string, Group>;
  constructor(manager: Manager) {
    this.manager = manager;
    this.groups = {};

    this.loadFromMemory();
  }
  finish() {
    this.saveToMemory();
  }
  loadFromMemory() {
    this.groups = {};
    for (const hash in this.manager.memory.groups) {
      const memoryGroup = this.manager.memory.groups[hash];
      var group: Group | false;
      switch (memoryGroup.type) {
        case "dismantle":
          group = GroupDismantle.buildFromMemory(memoryGroup);
          break;
        case "combat":
          group = GroupCombat.buildFromMemory(memoryGroup);
          break;
        default:
          continue;
      }
      if (group) {
        group.manager = this.manager;
        this.groups[group.hash] = group;
      }
    }
  }
  saveToMemory() {
    const list: Record<string, ManagerMemoryGroup> = {};
    for (const hash in this.groups) {
      const group = this.groups[hash];
      list[group.hash] = group.storageData();
    }
    this.manager.memory.groups = list;
  }
  addGroup(group: Group) {
    this.groups[group.hash] = group;
  }
  deleteGroup(hash: number) {
    delete this.groups[hash];
  }
  init() {}

  run(): void {
    Object.values(this.groups).forEach(group => {
      group.run();
    });
  }
}
