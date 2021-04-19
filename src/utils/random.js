function randomDouble(from, to, digits = 2) {
    return (Math.random() * (to - from) + from).toFixed(digits);
}

function randomInt(from, to) {
    return randomDouble(from, to, 0)
}

module.exports = {
    randomDouble,
    randomInt
}