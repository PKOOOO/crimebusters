export function shuffle (array){
    let auxArray = array;
    var m = array.length, i;
    // While there remain elements to shuffle…
    while (m) {
        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);
        // And swap it with the current element.
        [auxArray[m], auxArray[i]] = [auxArray[i], auxArray[m]];
    }
    return auxArray;
  }