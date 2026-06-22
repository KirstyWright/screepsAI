interface CachedCreepMemory {
  id: Id<Creep>;
}

export class CachedCreep {
  id: Id<Creep>;

  constructor(id: Id<Creep>) {
    this.id = id;
  }

  storageData(): CachedCreepMemory {
    return { id: this.id };
  }

  static buildFromMemory(memoryRecord: CachedCreepMemory): CachedCreep | false {
    if (!memoryRecord.id) {
      return false;
    }

    return new CachedCreep(memoryRecord.id);
  }
}
