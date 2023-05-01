export var rightPressed: boolean = false;
export var leftPressed: boolean = false;
export var score: int = 0;


function onKeyDown(e) {
    if (e.keyCode === 39 || e.keyCode === 68) {
        rightPressed = true;
        return false;
    } else if (e.keyCode === 37 || e.keyCode === 65) {
        leftPressed = true;
        return false;
    }
}

function onKeyUp(e) {
    if (e.keyCode === 39 || e.keyCode === 68) {
        rightPressed = false;
        return false;
    } else if (e.keyCode === 37 || e.keyCode === 65) {
        leftPressed = false;
        return false;
    }
}


function leftPedalDown(e) {
    leftPressed = true;
    e.preventDefault();
    return false;
    score = score - 1;
}

function leftPedalUp(e) {
    leftPressed = false;
    e.preventDefault();
    return false;
}


function rightPedalDown(e) {
    rightPressed = true;
    e.preventDefault();
    return false;
    score = score + 1;
}

function rightPedalUp(e) {
    rightPressed = false;
    e.preventDefault();
    return false;
}


export function init() {
    // Keyboard
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Touch screen
    if (!!('ontouchstart' in document.documentElement)) {
        var leftPedal = document.getElementById('leftPedal');
        var rightPedal = document.getElementById('rightPedal');

        leftPedal.hidden = false;
        rightPedal.hidden = false;

        leftPedal.addEventListener('touchstart', leftPedalDown);
        leftPedal.addEventListener('touchleave', leftPedalUp);
        leftPedal.addEventListener('touchend', leftPedalUp);

        rightPedal.addEventListener('touchstart', rightPedalDown);
        rightPedal.addEventListener('touchleave', rightPedalUp);
        rightPedal.addEventListener('touchend', rightPedalUp);
    }
};
