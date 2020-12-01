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

var asteroid_mach;
var ice_mach;
var is_holding_ice = false; // flag for if player is holding ice
var drop_mach;

var ship;
var isLaunchShip = false;
var isShipDocked = false;

var cursors;
var aKey;
var dKey;
var health = 5;
var gameOver = false;
var score = 0;
var scoreText;

var timer = [];
var isShipTimerEnabled = false;

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
    this.load.image('block', 'assets/block.png');
    this.load.image('ship', 'assets/ship.png');
}

function create ()
{
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

    asteroid_mach = this.physics.add.staticGroup().create(580, 260, 'block');
    ice_mach = this.physics.add.staticGroup().create(520, 260, 'block');
    drop_mach = this.physics.add.staticGroup().create(220, 420, 'block');

    ship = this.physics.add.sprite(150, 1000, 'ship');
    ship.body.setAllowGravity(false);

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
    this.physics.add.collider(player, asteroid_mach);
    this.physics.add.collider(player, ice_mach, pickupIce, null, this);
    this.physics.add.collider(player, drop_mach, putdownIce, null, this);

    this.physics.add.collider(station_walls, asteroids, hitAsteroid, null, this);
    this.physics.add.overlap(asteroid_catcher, asteroids, catchAsteroid, null, this);

    scoreText = this.add.text(16, 16, 'score: 0', { fontSize: '32px', fill: '#fff'});
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

    if (ship.y < 100) {
        console.log(isLaunchShip);
        isLaunchShip = false;
        ship.destroy();
        ship = this.physics.add.sprite(150, 1000, 'ship');
        ship.body.setAllowGravity(false);
        isShipDocked = false;
    } else if (ship.y > 450 || isLaunchShip) {
        ship.setVelocityY(-100);
        isShipDocked = false;
    } else if (!isShipTimerEnabled) {
        isShipDocked = true;
        ship.setVelocityY(0);
        isShipTimerEnabled = true;
        ship_timer = this.time.addEvent({ delay: 5000, callback: launchShip, callbackScope: this, loop: false });
    }

}

function launchShip () {
    isLaunchShip = true;
    isShipTimerEnabled = false;
}

function hitAsteroid (station_walls, asteroid) {
    asteroid.disableBody(true, true);

    // TODO : If no health left
    station_walls.setTint(0xff0000); // ! This currently doesn't work

    // TODO : might remove
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
    ice_cubes.push(this.add.image(520, 260, 'ice'));
}

function pickupIce () {
    if (cursors.space.isDown && !is_holding_ice) {
        console.log('pickup ice');
        ice_cube = ice_cubes.shift();
        ice_cube.destroy();
        is_holding_ice = true;
    }
}

function putdownIce () {
    if (cursors.space.isDown && is_holding_ice && isShipDocked) {
        is_holding_ice = false;

        ice_cubes.push(this.add.image(220, 420, 'ice'));

        // TODO : timer for a second
        ice_cube = ice_cubes.pop();
        ice_cube.destroy();

        // TODO : Launch ship?

        score++;
        scoreText.setText('Score: ' + score);
        
    }
}