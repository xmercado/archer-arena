// Temporary debug variables for server
// Will remove on launch.
var predictedPosition = null;
var actualPosition = null;
var debug = true;

var Player = {
  /*
    Initializes player, called only ONCE after the player joins a server
    - Input, Graphics, Draw
  */
  initialize: function(main) {
    var crosshair = main.physics.add.sprite(480, 480, 'nothing');
    var player = {
      speed: 100,
      physics: main.physics.add.sprite(480, 480, 'archer_blk'),
      data: {     
        x: 0,
        y: 0,
        velocity: {x: 0, y: 0},
        arrows: [],
        score: 0
      }
    }

    /*
      enable mouse
    */
    Phaser.Input.Mouse.MouseManager.enabled = true;
    Phaser.Input.Mouse.MouseManager.capture = true;

    main.input.on('pointerdown', function () {
      Arrow.initialize(main, player.physics, crosshair);
    })

    /*
      enable camera
    */
    main.cameras.main.setZoom(4);
    main.cameras.main.startFollow(player.physics, true, 0.1, 0.1);

    /* 
      Initializes movements key bindings based on configurations
    */
    moveKeys = main.input.keyboard.addKeys({
      'up': config.playerOptions.controls['up'],
      'down': config.playerOptions.controls['down'],
      'left': config.playerOptions.controls['left'],
      'right': config.playerOptions.controls['right']
    });

    /*
      Input event listeners WASD for movement on 'keydown'
    */
    main.input.keyboard.on('keydown_W', function(event) {
      player.physics.setVelocityY(-player.speed)
    });
    main.input.keyboard.on('keydown_A', function(event) {
      player.physics.setVelocityX(-player.speed)
    });
    main.input.keyboard.on('keydown_S', function(event) {
      player.physics.setVelocityY(player.speed)
    });
    main.input.keyboard.on('keydown_D', function(event) {
      player.physics.setVelocityX(player.speed)
    });

    /*
      Input event listeners WASD for movement on 'keyup'
    */
    main.input.keyboard.on('keyup_W', function (event) {
      if (moveKeys['down'].isUp)
        player.physics.setVelocityY(0)
      else
        player.physics.setVelocityY(player.speed)
    });
    main.input.keyboard.on('keyup_S', function (event) {
      if (moveKeys['up'].isUp)
        player.physics.setVelocityY(0)
      else
        player.physics.setVelocityY(-player.speed)
    });
    main.input.keyboard.on('keyup_A', function (event) {
      if (moveKeys['right'].isUp)
        player.physics.setVelocityX(0)
      else
        player.physics.setVelocityX(player.speed)
    });
    main.input.keyboard.on('keyup_D', function (event) {
      if (moveKeys['left'].isUp)
        player.physics.setVelocityX(0)
      else
        player.physics.setVelocityX(-player.speed)
    });

    /*
      Crosshair functions
      Initializes the crosshair, on mouse down, and movements
    */
    // Locks pointer on mousedown
    main.game.canvas.addEventListener('mousedown', function () {
      main.game.input.mouse.requestPointerLock();
    });
  
    // Exit pointer lock when Q or escape (by default) is pressed.
    main.input.keyboard.on('keydown_Q', function (event) {
      if (main.game.input.mouse.locked)
        main.game.input.mouse.releasePointerLock();
    }, 0, main);

    // Move reticle upon locked pointer move
    main.input.on('pointermove', function (pointer) {
      if (main.input.mouse.locked)
      {
          crosshair.x += pointer.movementX;
          crosshair.y += pointer.movementY;
      }
    }, main);
 /*
    // Crosshair cannot move offscreen
    constrainCrosshair: function(crosshair) {
      var distX = crosshair.x-player.x;
      var distY = crosshair.x-player.y;

      if (distX > 800)
        crosshair.x = player.x+800;
      else if (distX < -800)
        crosshair.x = player.x-800;
      
      if (distY > 600)
        crosshair.y = player.y+600;
      else if (distY < -600)
        crosshair.y = player.y-600;
    }
*/

    main.player = player;
  },

  update(main) {
    main.player.data = {
      x: main.player.physics.x,
      y: main.player.physics.y,
      velocity: main.player.physics.body.velocity,
      arrows: [],
      score: 0
    }
  },

  updateOtherPlayers(main, roomData) {
    
    for(let key in roomData.sockets) {
      if(socket.id != key) {

        if(debug) {
          if(!predictedPosition) {
            predictedPosition = main.physics.add.sprite(480, 480, 'archer_blu')
          }

          if(!actualPosition) {
            actualPosition = main.physics.add.sprite(480, 480, 'archer_red')
          }
        }

        // If the roomData does not have a object for a player, create one
        if(!(key in main.otherPlayers)) {
          main.otherPlayers[key] = main.physics.add.sprite(480, 480, 'archer_blk');
        } else {
          
          if(debug) {
            actualPosition.x = roomData.sockets[key].x;
            actualPosition.y = roomData.sockets[key].y;

            predictedPosition.x = roomData.sockets[key].x + roomData.sockets[key].velocity.x;
            predictedPosition.y = roomData.sockets[key].y + roomData.sockets[key].velocity.y;
          }

          if(roomData.sockets[key].velocity.x != 0 || roomData.sockets[key].velocity.y != 0) {
            main.physics.moveTo(main.otherPlayers[key], predictedPosition.x, predictedPosition.y, 100, 1000);
          } else {
            if(Phaser.Math.Distance.Between(main.otherPlayers[key].x, main.otherPlayers[key].y, roomData.sockets[key].x, roomData.sockets[key].y) > 10) {
              main.physics.moveTo(main.otherPlayers[key], roomData.sockets[key].x, roomData.sockets[key].y, 100, 1000);
            } else {
              main.otherPlayers[key].setVelocity(0, 0);
            }
          }
        }
      }
    }

    // Check for players who have left
    for(let key in main.otherPlayers) {
      if(!(key in roomData.sockets)) {
        main.otherPlayers[key].destroy();
        delete main.otherPlayers[key];
      }
    }
  }
}