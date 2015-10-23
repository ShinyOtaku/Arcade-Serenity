// Keep track of all the details of the canvas so I don't have to keep typing numbers and maybe get them wrong.
var gameDetails = {
  "numCols": 5,
  "numRows": 7,
  "colWidth": 101,
  "rowHeight": 83,
  "rowStart": 43, 
  "colStart": 0,
  "paused": 1,
  "gameRunning": 0,
  "confirmRestart": 0,
  "showInstructions": 0,
  "numStoneRows": 3,
  "rowImages": [
    'images/water-block.png',   // Top row is water
    'images/stone-block.png',   // Row 1 of 3 of stone
    'images/stone-block.png',   // Row 2 of 3 of stone
    'images/stone-block.png',   // Row 3 of 3 of stone
    'images/grass-block.png',   // Row 1 of 3 of grass
    'images/grass-block.png',   // Row 2 of 3 of grass
    'images/grass-block.png'    // Row 3 of 3 of grass
      ],
};

var previousState = {
  "paused": 1,
  "gameRunning": 0,
  "confirmRestart": 0,
  "showInstructions": 0,
};

var sprites = {
  "boy": "images/char-boy.png",
  "catGirl": "images/char-cat-girl.png",
  "hornGirl": 'images/char-horn-girl.png',
  "pinkGirl": 'images/char-pink-girl.png',
  "princessGirl": 'images/char-princess-girl.png',
  "bug": "images/enemy-bug.png",
  "gemBlue": "images/Gem Blue.png",
  "gemGreen": "images/Gem Green.png",
  "gemOrange": "images/Gem Orange.png",
  "heart": "images/Heart.png",
  "key": "images/Key.png",
  "selector": "images/Selector.png",
};

// This is our model prototype. All models have these features.
// Parameters:
//  x: Starting x location.
//  y: Starting y location of the model.
//  xSpeed: The starting speed at which the model moves left and right.
//  ySpeed: The starting speed at which the model moves up and down.
//  sprite: The location of the image to display.
var Model = function(x, y, xSpeed, ySpeed, sprite){

  // The image/sprite for each model, this uses  a helper we've provided to easily load images
  this.sprite = sprite;

  // This determines how fast each model will move.
  this.xSpeed = xSpeed;
  this.ySpeed = ySpeed;

  // x and y are used to determine the location of the model on the screen.
  this.x = x;
  this.y = y;
};

// Draw the model on the screen, required method for the game.
Model.prototype.render = function(){
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// Move the model around the screen.
// Parameters:
//  dx: Speed in the x direction.
//  dy: Speed in the y direction.
//  dt: Time delta between ticks. Use this to ensure the game runs at the same speed for all computers.
Model.prototype.move = function(dx, dy, dt) {
  this.x = this.x + dx * dt;
  this.y = this.y + dy * dt;
};

// Enemies our player must avoid
var Enemy = function() {
  
  this.replaced = false;

  Model.call(this,
      -1 * gameDetails.colWidth * Math.floor(Math.random() * 3 + 1),          // x: Start on the left for now. Start somewhere off the left side of the canvas to make it appear like the objects are created at different times.
      Math.floor(Math.random() * gameDetails.numStoneRows) * gameDetails.rowHeight + gameDetails.rowStart, // y: Pick a random row stone row. There are 3 or 4 stone rows.
      Math.floor(Math.random() * 110 + 40 + player.level),  // xSpeed: random speed between 50 and 150. Let's increase this based on the user level, so it gets a little bit harder.
      0,         // ySpeed: Bugs don't change lanes because they don't have blinkers.
      sprites.bug);
};

// Grab the prototype and set the constructor.
Enemy.prototype = Object.create(Model.prototype);
Enemy.prototype.constructor = Enemy;

Enemy.replacedCount = 0;
// Update the enemy's position
// Parameters:
//  dt: Time delta between ticks
Enemy.prototype.update = function(dt) {
  if(gameDetails.paused === 1)
    return;
  // You should multiply any movement by the dt parameter
  // which will ensure the game runs at the same speed for
  // all computers.

  this.move(this.xSpeed, this.ySpeed, dt);
  this.detectCollision();

  // replacedCount is here to tell me how many enemies have passed the halfway point.
  if(this.x > gameDetails.colWidth * gameDetails.numCols + gameDetails.colWidth) {
    Enemy.replacedCount--;
    this.remove();
  }

  // To see what replaced does, check the Enemy constructor.
  if(this.replaced === false && this.x > (gameDetails.colWidth * gameDetails.numCols + gameDetails.colWidth) / 2) {
    Enemy.replacedCount++;
    this.replace();
  }
};

// Once an enemy has moved off the screen we should remove it to free up it's memory.
Enemy.prototype.remove = function() {

  // We need to find the the current enemy in the list and remove it.
  for (var key in allEnemies) {
    if(allEnemies[key] === this) {
      allEnemies[key] = null;

      // remove the finished enemy.
      allEnemies.splice(key, 1);

      break;
    }
  }
};

// Lets add new enemies.
Enemy.prototype.replace = function() {

  this.replaced = true; // To see what replaced does, check the Enemy constructor.

  // Now, lets add some new enemies.
  // I want no more than 6 enemies, and no fewer than 2. More than 6 can get crowded and I don't want the player to have free reign.

  var curCount = allEnemies.length - Enemy.replacedCount;

  // The replacedCount here is to tell me how many enemies have passed halfway on the screen.
  // Halfway is where I'm triggering new enemies, and since I want a maximum and minimum on the enemies, I need to keep track.
  var maxAddition = 5;

  //If the screen is bigger, we need more enemies I think.
  if(gameDetails.numStoneRows === 4)
    maxAddition = 7;

  var maxAddition = maxAddition - curCount;

  if(maxAddition > 3)
    maxAddition = 3;

  var minAddition = 3 - curCount;


  if(minAddition < 0)   // If there are more than 2
    minAddition = 0;
  // How many should I create?
  var newEnemyCount = Math.floor(Math.random() * maxAddition + minAddition);

  // Create them.
  for(var i = 0; i < newEnemyCount; i++)
  {
    allEnemies.push(new Enemy());
  }
};

// In this bizarre world, bugs squash humans. Lets see if the bugs catch a human.
// The enemies move much more often than the player does, so lets check collision when the enemy moves.
Enemy.prototype.detectCollision = function() {

  // Is the enemy image inside the player box?
  // Lets give the player a little more room.
  // To define the hit box, The padding is going to be 1/6 of the image.
  var padding = gameDetails.rowHeight / 6;

  // Define the enemy hit box x coordinates here.
  var enemyX = this.x + padding;
  var enemyEndX = this.x + padding * 5;

  // Define the player hit box x coordinates here.
  var playerX = player.x + padding;
  var playerEndX = player.x + padding * 5;

  if(((enemyX >= playerX && enemyX <= playerEndX)
    || (enemyEndX > playerX && enemyEndX < playerEndX))
    && (this.y == player.y))
    {
      // yes? Then the plucky hero is squashed.
      player.nextLevel(true);
    }
};

/*********************************\
* Player
*   render  (overrides the Model class version)
*   renderConfirmRestart
*   renderTitleScreenText
*   renderTitleScreenSprites
*   renderInstructions
*   drawCharacterKey
*   drawImage
*   drawArrowKey
*   move    (inherited from the Model class)
*   update
*   handleInput
*   nextLevel
*   detectCollision
*   updateScore
*   confirmRestart
*   recordCurrentState
*   resetCurrentState
\*********************************/
// The heroic player. The chicken always makes it across. Maybe the player will too.
var Player = function(sprite) {
  // This is the players starting point. we should keep track of it so that we know where to reset the player when they reach the other side or are run over by an enemy.
  this.startingX = gameDetails.colWidth * 2 + gameDetails.colStart;
  this.startingY = gameDetails.rowHeight * 3 + gameDetails.rowStart;
  this.score = 0;     // Only players will have a score.
  this.highScore = 0; // Let's keep the high score.
  this.level = 1;

  Model.call(this,
      this.startingX,           // x: The players starting x location
      this.startingY,           // y: The players starting y location
      gameDetails.colWidth,     // xSpeed: The distance a player will move in the x direction
      gameDetails.rowHeight,    // ySpeed: The distance a player will move in the y direction.
      sprite);

  this.selector = new Model(0,
      gameDetails.rowHeight * 3 + gameDetails.rowStart,
      gameDetails.colWidth,
      0,
      sprites.selector);
};

// Grab the prototype and set the constructor.
Player.prototype = Object.create(Model.prototype);
Player.prototype.constructor = Player;

Player.prototype.update = function(dt){
  // Do collision Detection here?
  // Reset at the very least.
  if(this.y < 0)  // We have crossed to the pond
  {
    // Good things happen here.
    // Let's increase the score, and reset the player location for the next level.
    this.nextLevel(false);
  }
};

// Accept the user input and move the character accordingly.
Player.prototype.handleInput = function(val){
  // The input is not valid so there is no input to handle.
  if(val === undefined)
    return;

  var dx = 0,
      dy = 0,
      dt = 1;

  if(gameDetails.gameRunning === 1)
  {
    switch(val)
    {
      case "space": // Allow the player to pause the action.
      case "p":
        if(gameDetails.paused === 1) {
          gameDetails.paused = 0;
        }
        else {
          gameDetails.paused = 1;
        }
        return;
      case "r": // Allow the player to restart the game.
        this.confirmRestart();
        return;
    }
    // The details on how the player will move. Only move when the game is running
    // and the game is not paused.
    if(gameDetails.paused === 0)
    {
      switch(val)
      {
        case "left":
        case "a":
          if(this.x - this.xSpeed >= 0)
            dx = -1 * this.xSpeed;
          break;
        case "right":
        case "d":
          if(this.x + this.xSpeed < ctx.canvas.width)
            dx = this.xSpeed;
          break;
        case "up":
        case "w":
            // If we go above 0, no big deal. We're going to reset this in the update function.
            dy = -1 * this.ySpeed;
          break;
        case "down":
        case "s":
          if(this.y + this.ySpeed < ctx.canvas.height - 171)
            dy = this.ySpeed;
          break;
      }

      if(dx !== 0 || dy !== 0) {  // Only move if we need to move. We might not move if the player tried to move off the screen.
        this.move(dx, dy,dt);
        this.detectCollision();
      }
    } // gameDetails.paused === 0
  } // gameDetails.gameRunning === 1
  else {
    // Does the user Actually want to restart?
    if(gameDetails.confirmRestart === 1)
    {
      switch(val)
      {
        case "n":
          gameDetails.confirmRestart = 0;
          gameDetails.paused = 0;
          gameDetails.gameRunning = 1;
          break;
        case "y":
          this.selector = new Model(0,
              gameDetails.rowHeight * 3 + gameDetails.rowStart,
              gameDetails.colWidth,
              0,
              sprites.selector);

          this.nextLevel(true);
          allEnemies = [new Enemy(),new Enemy(),new Enemy()];
          gameDetails.paused = 1;
          gameDetails.gameRunning = 0;
          gameDetails.confirmRestart = 0;
          break;
      }
    }
    else
    {
      // Title screen user input
      switch(val)
      {
        case "enter":
          var spriteVal = this.selector.x / this.selector.xSpeed;
          // This is probably a bad way to do this, but I have an integer value representing the
          // sprite I want to use and the sprites enum is not an array. So lets start looping through
          // the sprites. In every loop if the spriteVal is 0, then this is the sprite we want. If not, subtract
          // 1 from the spritVal and keep looping.
          for(var v in sprites)
          {
            if(spriteVal === 0)
            {
              this.sprite = sprites[v];
              break;
            }
            spriteVal--;
          }
          // Lets start the game again.
          gameDetails.gameRunning = 1;
          gameDetails.paused = 0;
          this.selector = null;
          break;
        case "i":
          if(gameDetails.showInstructions === 0)
          {
            this.recordCurrentState();
            gameDetails.showInstructions = 1;
          }
          else
          {
            this.resetCurrentState();
          }
          break;
        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
          dx = -1 * this.selector.x + this.selector.xSpeed * (val - 1);
          break;
        case "left":
        case "a":
          if(this.selector.x - this.selector.xSpeed >= 0)
            dx = -1 * this.selector.xSpeed;
          break;
        case "right":
        case "d":
          if(this.selector.x + this.selector.xSpeed < ctx.canvas.width)
            dx = this.selector.xSpeed;
          break;
      }  // switch(val)
      if(dx !== 0 || dy !== 0) {  // Only move if we need to move. We might not move if the player tried to move off the screen.
        this.selector.move(dx, 0,dt);
      }
    }
  }
};

Player.prototype.recordCurrentState = function()
{
  previousState.paused = gameDetails.paused;
  previousState.gameRunning = gameDetails.gameRunning;
  previousState.confirmRestart = gameDetails.confirmRestart;
  previousState.showInstructions = gameDetails.showInstructions;
};

Player.prototype.resetCurrentState = function()
{
  gameDetails.paused = previousState.paused;
  gameDetails.gameRunning = previousState.gameRunning;
  gameDetails.confirmRestart = previousState.confirmRestart;
  gameDetails.showInstructions = previousState.showInstructions;

};

Player.prototype.nextLevel = function(reset) {

  if(reset === true)
  {
    // The player has been squashed. Handle the score for restarting the game.
    this.updateScore(-1 * this.score);
    allCollectibles = [];
    this.level = 1;

    gameDetails.rowImages[4] = 'images/grass-block.png';
    gameDetails.numStoneRows = 3;

    for(var i = 0; i < allEnemies.length; i++)
    {
      if(allEnemies[i].y === (gameDetails.numStoneRows * gameDetails.rowHeight + gameDetails.rowStart))
      {
        allEnemies[i].remove();
        i--;
      }
    }
  }
  else {
    // The player beat the level. Time to update the score.
    this.updateScore(this.level * 5);

    this.level++;
    Collectible.generateCollectibles();

    if(this.level > 50 && gameDetails.numStoneRows === 3)
    {
      gameDetails.rowImages[4] = 'images/stone-block.png';
      gameDetails.numStoneRows = 4;
    }
  }

  // Lastly, lets reset the player location.
  this.y = gameDetails.rowHeight * (gameDetails.numRows - 3 + (gameDetails.numStoneRows - 3)) + gameDetails.rowStart;
  this.x = this.startingX;
};

// Just like all heroes these days, our hero is crossing the road for Collectibles.
// Collectible's don't move, and so lets check collision when the player moves.
Player.prototype.detectCollision = function() {

  // Is the player image inside the collectible box?

  // Define the player hit box x coordinates here.
  var playerX = this.x;
  var playerEndX = this.x + gameDetails.rowHeight;

  for(var gKey in allCollectibles) {

    var collectible = allCollectibles[gKey];
    // Define the collectible hit box x coordinates here.
    var collectibleEndX = collectible.x + gameDetails.rowHeight;

    if(((collectible.x >= playerX && collectible.x <= playerEndX)
      || (collectibleEndX > playerX && collectibleEndX < playerEndX))
      && (this.y == collectible.y)) {

        // yes? Then the plucky here is squashed.
        this.updateScore(collectible.score);
        collectible.remove();
    }
  }
};

// There are basically 3 different game states.
// The game is not restarting and we're at the player selection screen
// The game is running (Paused or unpaused)
// The player asked to reset the game.
Player.prototype.render = function() {

  if(gameDetails.confirmRestart === 0 && gameDetails.gameRunning === 0) {
    this.renderTitleScreenSprites();

    if(gameDetails.showInstructions === 1) {
      this.renderInstructions();
    }
    else {
      this.renderTitleScreenText();
    }

    return;
  }
  ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
  if(gameDetails.confirmRestart === 1) {
    this.renderConfirmRestart();
  }
  else if(gameDetails.paused === 1) {
    this.renderPaused();
  }


  ctx.fillStyle = "White";
  ctx.font = "bold 16px Arial";

  ctx.fillText("Score: ", 50, 652);
  ctx.fillText( player.score, 106, 652);

  ctx.fillText("High Score: ", 212, 652);
  ctx.fillText( player.highScore, 308, 652);

  ctx.font = "bold 20px Arial";
  ctx.fillText("Level: ", 40, 100);
  ctx.fillText(player.level, 106, 100);
};

Player.prototype.renderConfirmRestart = function() {

  ctx.font = "bold 25px Arial";
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "Blue";
  ctx.fillRect(30, 200, 445, 140);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "White";
  ctx.fillText("Are you sure you want to restart? ", 55, 240);
  ctx.fillText("[Y] to Restart", 88, 280);
  ctx.fillText("[N] to Continue", 88, 320);

};

Player.prototype.renderPaused = function() {

  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "Blue";
  ctx.fillRect(30, 140, 445, 140);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "White";
  ctx.font = "bold 30px Arial";
  ctx.fillText("Paused", 200, 185);
  ctx.font = "bold 12px Arial";
  ctx.fillText("Press [P] or [Space] to continue...", 275, 270);

};

Player.prototype.renderTitleScreenText = function() {
  var rowX = 0,
    rowY = gameDetails.rowHeight * 3 + gameDetails.rowStart;

  // Lets write some text
  ctx.font = "bold 20px Arial";
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "blue";
  ctx.fillRect(30, 140, 445, 140);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "White";
  ctx.fillText("Choose a Serenity Character", 110, 185);
  ctx.fillText("Mal, Sage, Cinnamon, Lavendar, Kayle", 70, 220);
  ctx.font = "bold 12px Arial";
  ctx.fillText("Press [Enter] to continue...", 315, 270);
  ctx.fillText("Press [I] for instructions...", 40, 270);

};

Player.prototype.renderTitleScreenSprites = function() {
  var rowX = 0,
    rowY = gameDetails.rowHeight * 3 + gameDetails.rowStart;

  // Draw all the player sprites
  ctx.drawImage(Resources.get(this.selector.sprite), this.selector.x, this.selector.y);

  ctx.drawImage(Resources.get(sprites.boy), 0, rowY);
  ctx.drawImage(Resources.get(sprites.catGirl), gameDetails.colWidth, rowY);
  ctx.drawImage(Resources.get(sprites.hornGirl), gameDetails.colWidth * 2, rowY);
  ctx.drawImage(Resources.get(sprites.pinkGirl), gameDetails.colWidth * 3, rowY);
  ctx.drawImage(Resources.get(sprites.princessGirl), gameDetails.colWidth * 4, rowY);
};

Player.prototype.renderInstructions = function() {

  //Background box
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = "Blue";
  ctx.fillRect(30, 140, 445, 315);
  ctx.globalAlpha = 1;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "White";
  ctx.strokeStyle = "White";

  ctx.font = "bold 15px Arial";
  //Game Description
  this.drawImage(ctx, 150, 150, 100, 150, Resources.get(sprites.bug), "Your Mortal Enemy", true);

  //Talk about the scoring here
  var imgX = 350;
  var imgY = 150;
  var imgHeight = 25;
  var imgWidth = 25;
  ctx.fillText("Score", imgX + 30, imgY + 10);
  imgY = imgY + 17;
  ctx.font = "bold 12px Arial";
  this.drawImage(ctx, imgX, imgY, imgWidth, imgHeight, Resources.get(sprites.gemBlue), "5 Points", false);
  imgY = imgY + imgHeight;
  this.drawImage(ctx, imgX, imgY, imgWidth, imgHeight, Resources.get(sprites.gemGreen), "10 Points", false);
  imgY = imgY + imgHeight;
  this.drawImage(ctx, imgX, imgY, imgWidth, imgHeight, Resources.get(sprites.gemOrange), "20 Points", false);
  imgY = imgY + imgHeight;
  this.drawImage(ctx, imgX, imgY, imgWidth, imgHeight, Resources.get(sprites.heart), "30 Points", false);
  imgY = imgY + imgHeight;
  this.drawImage(ctx, imgX, imgY, imgWidth, imgHeight, Resources.get(sprites.key), "40 Points", false);

  //All the possible keys.
  ctx.font = "bold 15px Arial";

  //Using midKey and bottomKey, I can move all of the keys around without having
  //to change all the individual points.
  var midKey = 60;
  var bottomKey = 355;

  //Misc Keys
  this.drawCharacterKey(ctx, midKey, bottomKey, "P", "Pause", false);
  bottomKey = bottomKey + 35;
  this.drawCharacterKey(ctx, midKey, bottomKey, "R", "Restart", false);

  //Movement
  midKey = midKey + 190;
  bottomKey = bottomKey - 55;
  ctx.textAlign = "left";
  ctx.fillText("Character Movement", midKey, bottomKey);
  midKey = midKey - 8;

  //Movement WASD
  bottomKey = bottomKey + 55;
  this.drawCharacterKey(ctx, midKey, bottomKey - 35, "W", "", false);
  this.drawCharacterKey(ctx, midKey - 35, bottomKey, "A", "", false);
  this.drawCharacterKey(ctx, midKey, bottomKey, "S", "", false);
  this.drawCharacterKey(ctx, midKey + 35 * 1, bottomKey, "D", "Or", false);

  //Movement Arrows
  ctx.textAlign = "left";
  midKey = midKey + 135;
  this.drawArrowKey(ctx, midKey, bottomKey - 35, "W", "", false);
  this.drawArrowKey(ctx, midKey - 35, bottomKey, "A", "", false);
  this.drawArrowKey(ctx, midKey, bottomKey, "S", "", false);
  this.drawArrowKey(ctx, midKey + 35, bottomKey, "D", "", false);
  ctx.font = "bold 12px Arial";
  ctx.fillText("Press [I] to return to character selection...", 230, 440);
};

//Draw an image on the Instructions Screen
Player.prototype.drawImage = function(ctx, x, y, w, h, img, desc, textOnTop)
{
  ctx.drawImage(img, x, y, w, h);

  if(textOnTop === true) {
    ctx.textAlign = "center";
    ctx.fillText(desc, x + w / 2, y + 15);
  }
  else {
    ctx.textAlign = "left";
    ctx.fillText(desc, x + w + 10, y + h / 2);
  }

};
//Draw a character key on the Instructions Screen. A character key is a key with
// a single character in it.
Player.prototype.drawCharacterKey = function(ctx, x, y, key, desc, textOnTop) {
  ctx.textAlign = "center";
  ctx.strokeRect(x, y, 25, 25);
  ctx.fillText(key, x + 25 / 2, y + 25 / 2);
  if(textOnTop === true) {
    ctx.fillText(desc, x + 25 / 2, y - 12);
  }
  else {
    ctx.textAlign = "left";
    ctx.fillText(desc, x + 35, y + 25 / 2);
  }
};
//Draw an arrow key on the Instructions Screen. An arrow key is a key with
// a directional arrow in it.
Player.prototype.drawArrowKey = function(ctx, x, y, key, desc) {
  ctx.strokeRect(x, y, 25, 25);

  switch(key)
  {
    case "W":
      ctx.moveTo(x + 13, y + 7);
      ctx.lineTo(x + 13, y + 18);
      ctx.moveTo(x + 8, y + 13);
      ctx.lineTo(x + 13, y + 7);
      ctx.moveTo(x + 18, y + 13);
      ctx.lineTo(x + 13, y + 7);
      break;
    case "A":
      ctx.moveTo(x + 7, y + 13);
      ctx.lineTo(x + 18, y + 13);
      ctx.moveTo(x + 13, y + 8);
      ctx.lineTo(x + 7, y + 13);
      ctx.moveTo(x + 13, y + 18);
      ctx.lineTo(x + 7, y + 13);
      break;
    case "S":
      ctx.moveTo(x + 13, y + 7);
      ctx.lineTo(x + 13, y + 18);
      ctx.moveTo(x + 8, y + 13);
      ctx.lineTo(x + 13, y + 18);
      ctx.moveTo(x + 18, y + 13);
      ctx.lineTo(x + 13, y + 18);
      break;
    case "D":
      ctx.moveTo(x + 7, y + 13);
      ctx.lineTo(x + 18, y + 13);
      ctx.moveTo(x + 13, y + 8);
      ctx.lineTo(x + 18, y + 13);
      ctx.moveTo(x + 13, y + 18);
      ctx.lineTo(x + 18, y + 13);
      break;
  }
  ctx.stroke();

  ctx.fillText(desc, x + 35, y + 25 / 2);
};

Player.prototype.updateScore = function(toadd) {
  this.score = this.score + toadd;
  if(this.score > this.highScore) {
    this.highScore = this.score;
  }
};

Player.prototype.confirmRestart = function() {
  gameDetails.confirmRestart = 1;
  gameDetails.paused = 1;
  gameDetails.gameRunning = 0;
};

// Every hero needs a quest. Why is the hero crossing the road? To get more Collectibles of course.
var Collectible = function(sprite) {

  // The options are Blue, Green, and Orange, a Heart and a Key
  // Lets randomly generate the collectible, and I don't want them spaced evenly because I want them to
  // be worth a different number of points.
  // 40%: 30%: 15%: 10%: 5%: The brighter the color, the more points, and the more rare it is. And the key is the rarest of them all

  var colChoice = Math.floor(Math.random() * 100);

  if(colChoice < 5)
  {
    sprite = sprites.key;
    this.score = 40;
  }
  else if(colChoice < 15)
  {
    sprite = sprites.heart;
    this.score = 30;
  }
  else if(colChoice < 30)
  {
    sprite = sprites.gemOrange;
    this.score = 20;
  }
  else if(colChoice < 60)
  {
    sprite = sprites.gemGreen;
    this.score = 10;
  }
  else
  {
    sprite = sprites.gemBlue;
    this.score = 5;
  }
  var x = 0,
      y = 0;

  // Lets make sure that the collectibles don't sit on top of each other.
  var existing = true;
  while(existing === true)
  {
    existing = false;
    // new X and Y coordinate
    x = gameDetails.colWidth * Math.floor(Math.random() * 3 + 1);
    y = Math.floor(Math.random() * 3) * gameDetails.rowHeight + gameDetails.rowStart;
    // check it against other collectibles.
    for (var i = 0; i < allCollectibles.length; i++) {
      if(x == allCollectibles[i].x && y == allCollectibles[i].y) {
        existing = true;
      }
    }
  }

  Model.call(this,
      x, // x: Start on the left for now. Start somewhere off the left side of the canvas to make it appear like the objects are created at different times.
      y, // y: The collectibles starting y location
      0, // xSpeed: Collectible's don't move.
      0, // ySpeed: Collectible's don't move.
      sprite);
};

// Grab the prototype and set the constructor.
Collectible.prototype = Object.create(Model.prototype);
Collectible.prototype.constructor = Collectible;

// Once an Collectible has moved off the screen we should remove it to free up it's memory.
Collectible.prototype.remove = function() {

  // We need to find the the current collectible in the list and remove it.
  for (var key in allCollectibles) {
    if(allCollectibles[key] === this) {
      allCollectibles[key] = null;
      // remove the collectible.
      allCollectibles.splice(key, 1);

      break;
    }
  }
};

Collectible.generateCollectibles = function() {
  allCollectibles = [];
  var rand = Math.random();

  var count = Math.floor(rand * 3);
  for (var i = 0; i < count; i++) {
    allCollectibles.push(new Collectible());
  }
};

// Now instantiate your objects.
// Place all enemy objects in an array called allEnemies
// Place the player object in a variable called player

var player = new Player(sprites.boy);
var allEnemies = [new Enemy(),new Enemy(),new Enemy()];
var allCollectibles = [];
// This listens for key presses and sends the keys to your
// Player.handleInput() method. You don't need to modify this.
// Oh, but I will modify it. I'm going to add the space key to pause the game
// and the 'r' key to reset the game.
// Lets also let the user use the WASD keys to move, if they'd rather do that.
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        13: 'enter',  // Select player model
        32: 'space',  // Pause
        37: 'left',   // Move left
        38: 'up',     // Move up
        39: 'right',  // Move right
        40: 'down',   // Move down
        49: '1',      // Select the 1st model
        50: '2',      // Select the 2nd model
        51: '3',      // Select the 3rd model
        52: '4',      // Select the 4th model
        53: '5',      // Select the 5th model
        65: 'a',      // Move Left
        68: 'd',      // Move Right
        73: 'i',      // Instructions
        75: 'k',      // Keyboard shortcuts
        78: 'n',      // No (Restart)
        80: 'p',      // Pause
        82: 'r',      // Restart
        83: 's',      // Move down
        87: 'w',      // Move up
        89: 'y',      // Yes (Restart)

    };
    player.handleInput(allowedKeys[e.keyCode]);
});
