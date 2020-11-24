var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 100 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var player;
var moon;
var station_walls;
var asteroids;
var processing_asteroid = [];
var asteroid_catcher;

var ice_cubes = [];

var cursors;
var aKey;
var dKey;
var health = 5;
var gameOver = false;
var score = 0;
var scoreText;

var timer = [];

// TODO : add interactable buttons - if the player is touching AND button is pressed, move asteroid collector
// Maybe just key input for now

var game = new Phaser.Game(config);

function preload ()
{
    this.load.spritesheet('spaceman', 
        'assets/spaceman.png',
        { frameWidth: 32, frameHeight: 48 }
    );

    this.load.image('space', 'assets/space.png');
    this.load.image('station', 'assets/station.png');
    this.load.image('station_hwall', 'assets/wall-horizontal.png');
    this.load.image('station_vwall', 'assets/wall-vertical.png');
    this.load.image('moon', 'assets/moon.png');
    this.load.image('asteroid', 'assets/asteroid.png');
    this.load.image('asteroid_catcher', 'assets/asteroid_catcher.png');

    this.load.image('ice', 'assets/ice.png');

    // Temp
    this.load.image('block', 'assets/block.png');

}

function create ()
{
    // timer = this.time.create(false);
    // timer.loop(2000, processAsteroid, this);

    this.add.image(400, 300, 'space');
    this.add.image(400, 400, 'station');

    moon = this.physics.add.staticGroup();
    moon.create(400, 70, 'moon');

    station_walls = this.physics.add.staticGroup();
    station_walls.create(400, 220, 'station_hwall');
    station_walls.create(400, 580, 'station_hwall');
    station_walls.create(180, 400, 'station_vwall');
    station_walls.create(620, 400, 'station_vwall');

    player = this.physics.add.sprite(400, 450, 'spaceman');
    player.body.setAllowGravity(false);
    player.setCollideWorldBounds(true);

    asteroid_catcher = this.physics.add.sprite(200, 200, 'asteroid_catcher');
    asteroid_catcher.body.setAllowGravity(false);

    // asteroid_machine = this.physics.add.staticGroup();
    // ice_machine = this.physics.add.staticGroup();
    // res_machine = this.physics.add.staticGroup();
    this.add.image(580, 260, 'block'); // Asteroid
    this.add.image(520, 260, 'block'); // Ice
    this.add.image(580, 320, 'block'); // Resources

    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('spaceman', { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [ { key: 'spaceman', frame: 4 } ],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('spaceman', { start: 5, end: 8 }),
        frameRate: 10,
        repeat: -1
    });

    //  Input Events
    cursors = this.input.keyboard.createCursorKeys();
    aKey = this.input.keyboard.addKey('A');
    dKey = this.input.keyboard.addKey('D');

    // TODO : Add random values!
    asteroids = this.physics.add.group({
        key: 'asteroid',
        repeat: 10,
        setXY: { x: 200, y: -100, stepX: 70, stepY: -1000 }
    });

    this.physics.add.collider(player, station_walls);

    // TODO : collide with station OR asteroid catcher
    this.physics.add.collider(station_walls, asteroids, hitAsteroid, null, this);

    // TODO : asteroid catcher needs to collide with station walls - extend vertical walls
    this.physics.add.overlap(asteroid_catcher, asteroids, catchAsteroid, null, this);

}

function update ()
{
    // if (gameOver) {
    //     return;
    // }

    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.anims.play('left', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.anims.play('right', true);
    } else {
        player.setVelocityX(0);
        player.anims.play('turn');
    }

    if (cursors.up.isDown) {
        player.setVelocityY(-160);
    } else if (cursors.down.isDown) {
        player.setVelocityY(160);
    } else {
        player.setVelocityY(0);
    }

    // Asteroid catcher movement
    if (aKey.isDown) {
        asteroid_catcher.setVelocityX(-100);
    } else if (dKey.isDown) {
        asteroid_catcher.setVelocityX(100);
    } else {
        asteroid_catcher.setVelocityX(0); // Might be harder to play without this
    }
}

function hitAsteroid (station_walls, asteroid) {
    // Need to take damage
    asteroid.disableBody(true, true);

    // If no health left
    station_walls.setTint(0xff0000); // ! This currently doesn't work

    health -= 1;
    
    if (health < 0) {
        gameOver = true;
        console.log('You Lose!');
    }
}

function catchAsteroid (asteroid_catcher, asteroid) {
    asteroid.disableBody(true, true);

    // TODO : process asteroid
    // change asteroid position - might actually just create an asteroid image?
    console.log(asteroid);
    // asteroid.body.center(580, 260);
    // asteroid.x = 580;
    // asteroid.y = 260;
    processing_asteroid.push(this.add.image(580, 260, 'asteroid'));

    // Need to time processing this...
    // TODO : do I need an array/list of timers
    timer.push(this.time.addEvent({ delay: 2000, callback: processAsteroid, callbackScope: this, loop: true }));
}

function processAsteroid () {
    console.log("Done turning asteroid into water...");
    console.log(processing_asteroid.length);

    timer_to_remove = timer.shift();
    timer_to_remove.remove(false);

    // remove asteroid
    asteroid_to_destroy = processing_asteroid.pop();
    asteroid_to_destroy.destroy(); // TODO : having an off by one error I think, last to destroy doesn't seem to exist

    // create water
    ice_cubes.push(this.add.image(540, 260, 'ice'));

    // reset timer
}