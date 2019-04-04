/**********
 * A classic game of PONG
 * Starter javascript implementation provided by j.a.somers@hva.nl
 *
 */
var isGoing = false;

var keysCurrentlyDown = {};      // remembers any keys currently pressed
// traps any key pressed or key released
window.addEventListener("keydown", function (event) {
    if (isGoing) {
        // prevent further processing of this key event by the browser
        event.preventDefault();

        // remember the key is down
        keysCurrentlyDown[event.code] = true;
    }
    else {
        // for testing key codes
        document.getElementById('keypressed').innerText = event.code;
    }

});
window.addEventListener("keyup", function (event) {
    // forget that the key was down
    delete keysCurrentlyDown[event.code];
    document.getElementById('keypressed').innerText = "";

    if (isGoing) {
        // prevent further processing of this key event by the browser
        event.preventDefault();
    }
});

// some global variables representing the state of the court and the game.
var courtWidth = 0;
var courtHeight = 0;
var paddleWidth = 0;
var paddleSize = 0;

var ball = null;
var initialBallSpeed = 3;
var ballRadius = 0;
var player = null;
var computer = null;
var maxAngle = 2;       // maximum ratio between vertical and horizontal ballspeed
var animation = null;   // the timer object that drives the stepper

function pongStart(width, height, computerId, playerId) {
    pongStop();
    courtWidth = width;
    courtHeight = height;
    paddleWidth = width / 64;
    paddleSize = height / 8;
    ballRadius = courtHeight / 80;

    // reset all keys pressed, if any
    keysDown = {};

    // create the JS ball and associate with the SVG element
    ball = new Ball('ball');

    player = new PlayerPaddle(playerId);
    computer = new ComputerPaddle(computerId);

    // render the initial setup
    pongRender();

    // start the stepper with an interval of 12 ms
    animation = setInterval(pongStep, 12);
    isGoing = true;
}

function pongStop() {
    if (isGoing) {
        isGoing = false;

        // stop the stepper
        clearInterval(animation);
    }
}

function pongUpdate() {
    // update positions of all elements
    player.update();
    computer.update(ball);
    ball.update(computer, player);
}

function pongRender() {
    // change the visual svg elements
    player.render();
    computer.render();
    ball.render();
}

function pongStep() {
    pongUpdate();
    pongRender();
}

function Ball(domElId) {
    // remember the svg element for the ball
    this.domElement = document.getElementById(domElId);
    this.reset();
}
Ball.prototype.reset = function() {
    // serve the ball
    this.x = courtWidth / 6;
    this.y = courtHeight / 2;
    this.x_speed = initialBallSpeed;
    this.y_speed = 0;
};
Ball.prototype.update = function(cPaddle, pPaddle) {
    // move the ball according to its latest velocity
    this.x += this.x_speed;
    this.y += this.y_speed;

    // check leaving the court at either side
    if (this.x < 0) {
        // ball has left the court at computer side
        this.reset();
        return;
    } else if (this.x >= courtWidth) {
        // ball has left the court at player side
        this.reset();
        return;
    }

    // check bouncing of the side walls of the court
    if (this.y - ballRadius < 0) {
        this.y = ballRadius;
        if (this.y_speed < 0) {
            this.y_speed = -this.y_speed;
        }
    } else if (this.y + ballRadius > courtHeight) {
        this.y = courtHeight - ballRadius;
        if (this.y_speed > 0) {
            this.y_speed = -this.y_speed;
        }
    }

    // process any hits of the ball by the computerPaddle or the playerPaddle
    if (this.x < courtWidth / 2) {
        //only check at computer side
        cPaddle.checkHit(this);
    } else {
        // only check at player side
        pPaddle.checkHit(this);
    }
};
Ball.prototype.limitAngle = function(maxA) {

    let speedOrg = Math.sqrt(this.x_speed*this.x_speed + this.y_speed*this.y_speed);

    // determine the horizontal direction of movement of the ball
    let x_direction = (this.x_speed < 0 ? -1 : 1);

    // limit the angle of the ball path
    // such that very strong vertical bouncing will be prohibited.
    if (this.y_speed > maxA * this.x_speed * x_direction) {
        this.y_speed = maxA * this.x_speed * x_direction;
    } else if (this.y_speed < -maxA * this.x_speed * x_direction) {
        this.y_speed = -maxA * this.x_speed * x_direction;
    }

    let speedNew = Math.sqrt(this.x_speed*this.x_speed + this.y_speed*this.y_speed);

    // maintain original ballspeed
    if (speedNew < speedOrg) {
        this.x_speed *= speedOrg/speedNew;
        this.y_speed *= speedOrg/speedNew;
    }
};
Ball.prototype.render = function() {
    // update the svg view with the new ball position
    this.domElement.setAttribute("cx", this.x);
    this.domElement.setAttribute("cy", this.y);
    this.domElement.setAttribute("r", ballRadius);
};

function Paddle(xPos, size, domElId) {
    // remember the svg element of the paddle
    this.domElement = document.getElementById(domElId);

    // setup its properties
    this.x = xPos;
    this.y = undefined;
    this.width = paddleWidth;
    this.height = size;
    this.y_speed = undefined;

    // reset the paddle to its center position
    this.reset();
}
Paddle.prototype.reset = function() {
    // only the y-values matter
    this.y = courtHeight / 2 - this.height / 2;
    this.y_speed = 0;
};
// abstract method; will be overloaded for player and computer
Paddle.prototype.update = function() {
};
Paddle.prototype.render = function() {
    // update the svg view with the new ball position
    this.domElement.setAttribute("x", this.x);
    this.domElement.setAttribute("y", this.y);
    this.domElement.setAttribute("width", this.width);
    this.domElement.setAttribute("height", this.height);
};
Paddle.prototype.move = function(deltaY) {
    // move the paddle up or down
    this.y += deltaY;

    // remember its motion speed to apply to the ball when hit
    this.y_speed = deltaY;

    // check against the borders of the court
    if (this.y < 0) {
        this.y = 0;
        this.y_speed = 0;
    } else if (this.y + this.height > courtHeight) {
        this.y = courtHeight - this.height;
        this.y_speed = 0;
    }
};
Paddle.prototype.checkHit = function(ball) {

    if (ball.x + ballRadius < this.x ||
        ball.x - ballRadius >= this.x + this.width ||
        ball.y + ballRadius < this.y ||
        ball.y - ballRadius >= this.y + this.height) {
        // the ball has no overlap with the paddle, not from any direction
        return;
    }

    if (ball.x > this.x + this.width / 2 && ball.x_speed > 0) {
        // the ball is already moving to the right, and away from the paddle
        // no further action required
        return;
    }
    if (ball.x < this.x + this.width / 2 && ball.x_speed < 0) {
        // the ball is already moving to the left, and away from the paddle
        // no further action required
        return;
    }

    // paddle was hit: reverse the horizontal direction of the ball
    ball.x_speed = -ball.x_speed;

    // apply the impact of a moving paddle
    ball.y_speed += this.y_speed / 6;

    // restrict the angle of the ball path
    // such that very strong vertical bouncing will be prohibited.
    ball.limitAngle(maxAngle);
};

function PlayerPaddle(domElId) {

    // call superclass instantiation
    let paddle = new Paddle(courtWidth-2*paddleWidth, paddleSize, domElId);

    // overload update function to check on keys being pressed
    paddle.update = function () {
        paddle.move(0);
        for (let key in keysCurrentlyDown) {
            if (key == 'ArrowUp') {
                paddle.move(-4);
            } else if (key == 'ArrowDown') {
                paddle.move(4);
            }
        }
    };

    // return paddle object with player instantiation
    return paddle;
}

function ComputerPaddle(domElId) {

    // call superclass instantiation
    let paddle = new Paddle(paddleWidth, paddleSize, domElId);

    // overload update function to follow the ball
    paddle.update = function (ball) {
        // check whether computer sees the ball coming
        let isComing = (ball.x_speed < 0 && ball.x < 2 * courtWidth / 3);
        // reposition at the center
        let targetYPos = courtHeight / 2;
        if (isComing) {
            // follow the ball
            targetYPos = ball.y;
        }

        let diff = targetYPos - (paddle.y + paddle.height / 2);
        // the computer cannot not move too fast either...
        if (diff < -8) {
            diff = -8;
        } else if (diff > 8) {
            diff = 8;
        }
        if (isComing) {
            // move quickly
            paddle.move(diff / 3);
        } else {
            // take a breath...
            paddle.move(diff / 8);
        }
    };

    // return paddle object with computer instantiation
    return paddle;
}