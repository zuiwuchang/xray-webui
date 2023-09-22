class Item {
    constructor(id, note) {
        this.id = id
        this.note = note
    }
}
function make(id, note) {
    return new Item(id, note)
}

exports.Item = Item
exports.make = make