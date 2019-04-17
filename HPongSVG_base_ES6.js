/**********
 * A classic game of PONG
 * Starter javascript implementation provided by j.a.somers@hva.nl
 *
 */


 const Note = Tonal.Note;
 const Chord = Tonal.Chord;

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
const initialBallSpeed = 3;
var ballRadius = 0;
var player = null;
var computer = null;
const maxAngle = 2;       // maximum ratio between vertical and horizontal ball speed
const maxServingAngle = 0.2
var animation = null;   // the timer object that drives the stepper
const ballSpeedupFactor = 1.15;
const ballSpeedupAfterReturns = 3;
const playerPaddleSpeed = 4;
var serveFactor = 1;
var isEasyMode = false;
var isCheatMode = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const toneLength = 0.1;
const playerChord = "E4";
const sideChord = "D4";
const computerChord = "C4";
const scoreChord = "C3";

function setEasyMode(bool){
  isEasyMode = bool;
  pongRender();
}

function checkCheatMode(){
  for (let key in keysCurrentlyDown) {
    if (key === 'Space') {
      isCheatMode = true;
    }else if (key === 'Enter'){
      isCheatMode = false;
    }
  }
}

function pongStart(width, height, computerId, computerScoreId, computerWonId, playerId, playerScoreId, playerWonId) {
    pongStop();

    audioCtx.resume();
    

    courtWidth = width;
    courtHeight = height;
    paddleWidth = width / 64;
    paddleSize = height / 8;
    ballRadius = courtHeight / 80;

    // reset all keys pressed, if any
    keysCurrentlyDown = {};

    // create the JS ball and associate with the SVG element
    ball = new Ball('ball');

    player = new PlayerPaddle(playerId, playerScoreId, playerWonId);
    computer = new ComputerPaddle(computerId, computerScoreId, computerWonId);

    // render the initial setup
    pongRender();
    hideWinnerAnnouncments();
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
    if(!isCheatMode){
      computer.update(ball);
      ball.update(computer, player);
    }
}

function pongRender() {
    if(isEasyMode){
      player.height = (courtHeight / 8) * 1.4;
      ball.radius = ballRadius * 2;
    }else{
      player.height = (courtHeight / 8);
      ball.radius = ballRadius
    }
    // change the visual svg elements
    player.render();
    computer.render();
    ball.render();
}

function pongStep() {
    checkCheatMode();
    pongUpdate();
    pongRender();
}

function hideWinnerAnnouncments(){
  player.wonMessageElement.setAttribute("visibility", 'hidden');
  computer.wonMessageElement.setAttribute("visibility", 'hidden');
}

function announceWinner(playerHasWon){
  pongStop();
  if(playerHasWon){
    player.wonMessageElement.setAttribute("visibility", 'visible');
  }else{
    computer.wonMessageElement.setAttribute("visibility", 'visible');
  }
}

/* function that plays a chord.
* makes use of: https://github.com/danigb/tonal
*/
function playSound(chord, length){
    Chord.notes(chord)
      .map(Note.freq)
      .map(Math.round)
      .map( freq => _playSound(freq, length, 'sine'))

}

function _playSound(freq, length, type){
  let oscillator = audioCtx.createOscillator();
  oscillator.frequency.value = freq;
  oscillator.type = type;
  oscillator.connect(audioCtx.destination);
  currentTime = audioCtx.currentTime;
  oscillator.start(currentTime);
  oscillator.stop(currentTime + length);
}

class Ball {

    constructor(domElId, rad) {
        // remember the svg element for the ball
        this.domElement = document.getElementById(domElId);
        this.reset(serveFactor);
        this.radius = rad;
    }

    reset(factor) {
        //get a random number between -1 and 1
        let randomFactor = ((Math.random() * 2) - 1)

        // serve the ball
        this.x = (courtWidth / 2) + (courtWidth / ( factor * -3 ));
        this.y = courtHeight / 2;
        this.x_speed = initialBallSpeed * factor;
        this.y_speed = this.x_speed * randomFactor;
        this.returns = 0;

        this.limitAngle(maxServingAngle)
    }

    update(cPaddle, pPaddle) {
        // move the ball according to its latest velocity
        this.x += this.x_speed;
        this.y += this.y_speed;

        // check leaving the court at either side
        if (this.x < 0) {
            // ball has left the court at computer side
            pPaddle.score += 1
            playSound(scoreChord, toneLength)
            if(pPaddle.score >= 5){
              announceWinner(true);
            }else{
              this.reset(-1);
            }
            return;
        } else if (this.x >= courtWidth) {
            // ball has left the court at player side
            cPaddle.score += 1
            playSound(scoreChord, toneLength)
            if(cPaddle.score >= 5){
              announceWinner(false);
            }else{
              this.reset(1);
            }
            return;
        }

        // check bouncing of the side walls of the court
        if (this.y - this.radius < 0) {
            this.y = this.radius;
            if (this.y_speed < 0) {
                this.y_speed = -this.y_speed;
                playSound(sideChord, toneLength)
            }
        } else if (this.y + this.radius > courtHeight) {
            this.y = courtHeight - this.radius;
            if (this.y_speed > 0) {
                this.y_speed = -this.y_speed;
                playSound(sideChord, toneLength)
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
    }

    limitAngle(maxA) {

        let speedOrg =
            Math.sqrt(this.x_speed * this.x_speed + this.y_speed * this.y_speed);

        // determine the horizontal direction of movement of the ball
        let x_direction = (this.x_speed < 0 ? -1 : 1);

        // limit the angle of the ball path
        // such that very strong vertical bouncing will be prohibited.
        if (this.y_speed > maxA * this.x_speed * x_direction) {
            this.y_speed = maxA * this.x_speed * x_direction;
        } else if (this.y_speed < -maxA * this.x_speed * x_direction) {
            this.y_speed = -maxA * this.x_speed * x_direction;
        }

        let speedNew =
            Math.sqrt(this.x_speed * this.x_speed + this.y_speed * this.y_speed);

        // maintain original ball speed
        this.x_speed *= speedOrg / speedNew;
        this.y_speed *= speedOrg / speedNew;
    }

    render() {
        // update the svg view with the new ball position
        this.domElement.setAttribute("cx", this.x);
        this.domElement.setAttribute("cy", this.y);
        this.domElement.setAttribute("r", this.radius);
    }
}

class Paddle {
    constructor(xPos, size, domElId, scoreElId, wonMessageId) {
        // remember the svg element of the paddle
        this.domElement = document.getElementById(domElId);
        this.scoreElement = document.getElementById(scoreElId);
        this.wonMessageElement = document.getElementById(wonMessageId);
        console.dir(wonMessageId);
        console.dir(this.wonMessageElement);
        // setup its properties
        this.startXPos = xPos;
        this.x = this.startXPos;
        this.y = undefined;
        this.width = paddleWidth;
        this.height = size;
        this.x_speed = undefined;
        this.y_speed = undefined;

        // reset the paddle to its center position
        this.reset();
    }

    reset() {
        // only the y-values matter
        this.x = this.startXPos;
        this.y = courtHeight / 2 - this.height / 2;
        this.y_speed = 0;
        this.score = 0;
    }

    // abstract method; will be overloaded for player and computer
    update() {
    }

    render() {
        // update the svg view with the new ball position
        this.domElement.setAttribute("x", this.x);
        this.domElement.setAttribute("y", this.y);
        this.domElement.setAttribute("width", this.width);
        this.domElement.setAttribute("height", this.height);
        // this.wonMessageElement.setAttribute("visibility", 'hidden');
        this.scoreElement.innerText = this.score;
        
    }

    move(deltaX, deltaY) {
        // move the paddle up or down
        this.y += deltaY;
        this.x += deltaX;

        // remember its motion speed to apply to the ball when hit
        this.y_speed = deltaY;
        this.x_speed = deltaX;

        // check against the borders of the court
        if (this.y < 0) {
            this.y = 0;
            this.y_speed = 0;
        } else if (this.y + this.height > courtHeight) {
            this.y = courtHeight - this.height;
            this.y_speed = 0;
        }
    }

    checkHit(ball, freq) {

        let paddleBottom = this.y + this.height;
        let paddleTop = this.y;
        let paddleMiddle = this.y + (this.height / 2);
        let ballTop = ball.y - ball.radius;
        let ballBottom =  ball.y + ball.radius;

        if (ball.x + ball.radius < this.x ||
            ball.x - ball.radius >= this.x + this.width ||
            ballBottom < paddleTop ||
            ballTop >= paddleBottom) {
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

        playSound(freq, toneLength)
        // paddle was hit: reverse the horizontal direction of the ball
        ball.x_speed = -ball.x_speed;

        // paddle has definitely been hit, so no need to check anymore
        if(ball.y <= paddleTop + (this.height / 6 )){
            ball.y_speed -= playerPaddleSpeed / 6;
            console.log("paddle top hit")
        }
        else if(ball.y >= paddleBottom - (this.height / 6 )){
            ball.y_speed += playerPaddleSpeed / 6;
            console.log("paddle bottom hit")
        }else{
          // apply the impact of a moving paddle
          ball.y_speed += this.y_speed / 6;
          console.log("paddle middle hit")
        }
        // check if ball was hit for the third
        ball.returns += 1;
        if(ball.returns % ballSpeedupAfterReturns === 0){
          ball.x_speed = ball.x_speed * ballSpeedupFactor;
          ball.y_speed = ball.y_speed * ballSpeedupFactor;
        }

        // restrict the angle of the ball path
        // such that very strong vertical bouncing will be prohibited.
        ball.limitAngle(maxAngle);
    }
}

class PlayerPaddle extends Paddle {

    constructor(domElId, scoreElId, wonId) {
        // call superclass instantiation
        super(courtWidth - 2 * paddleWidth, paddleSize, domElId, scoreElId, wonId);
    }

    // overload update function to check on keys being pressed
    update() {
        this.move(0,0);
        for (let key in keysCurrentlyDown) {
            if (key === 'ArrowUp') {
                this.move(0, -1 * playerPaddleSpeed);
            } else if (key === 'ArrowDown') {
                this.move(0, playerPaddleSpeed);
            } else if (key === 'ArrowRight') {
                this.move(playerPaddleSpeed, 0)
            } else if (key === 'ArrowLeft') {
                this.move(-1 * playerPaddleSpeed, 0)
            }
        }
    }

    move(deltaX, deltaY){
      super.move(deltaX, deltaY);

      if (this.x < (courtWidth/2)) {
          this.x = (courtWidth/2);
          this.x_speed = 0;
      } else if (this.x + this.width > courtWidth) {
          this.x = courtWidth - this.width;
          this.x_speed = 0;
      }
    }

    checkHit(ball){
      if ( ball.x_speed < 0) {
          // the ball is already moving to the left, and away from the paddle
          // no further action required
          return;
      }
      super.checkHit(ball, playerChord);
    }
}

class ComputerPaddle extends Paddle {

    constructor(domElId, scoreElId, wonId) {
        // call superclass instantiation
        super(paddleWidth, paddleSize, domElId, scoreElId, wonId);
    }

    // overload update function to follow the ball
    update() {
        // check whether computer sees the ball coming
        let isComing = (ball.x_speed < 0 && ball.x < 2 * courtWidth / 3);
        // reposition at the center
        let targetYPos = courtHeight / 2;
        if (isComing) {
            // follow the ball
            targetYPos = ball.y+200;
        }

        let diff = targetYPos - (this.y + this.height / 2);
        // the computer cannot not move too fast either...
        if (diff < -8) {
            diff = -8;
        } else if (diff > 8) {
            diff = 8;
        }
        if (isComing) {
            // move quickly
            this.move(0, diff / 3);
        } else {
            // take a breath...
            this.move(0, diff / 8);
        }
    }

    checkHit(ball){
      super.checkHit(ball, computerChord);
    }
}

pongStart(640, 480,'Chimp', 'chimp_score', 'Chimp_won', 'Speler', 'player_score', 'Player_won')
pongStop();
