enchant();

const screenSize = {'x': 700, 'y': 700};

window.onload = function() {
  const core = new Core(screenSize.x, screenSize.y);
  core.fps = 30;
  core.rootScene.backgroundColor = 'black';
  core.keybind(88, "x");
  core.keybind(90, "y");
  core.keybind(81, "q");
  core.keybind(13, "enter");
  core.preload('img/bullet1.png','img/batt.png', 'img/playscreen.png', 'img/shot1.png',
               'img/snake.png', 'img/star.png','img/bullet2.png','img/bullet3.png', 'img/background.png',
               'sound/putting_scissors.mp3', 'sound/attack3.mp3', 'sound/hidan.wav', 'sound/dumping.mp3',
               'sound/bgm_maoudamashii_neorock73.mp3');
  core.onload = function() {
    //シーン
    const GameStartScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const startLabel =  new templateLabel('START', 285, 250, '40px');
        const pressLabel = new templateLabel(
          'Press ENTER to start.', 255, 400
        );

        this.addChild(startLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameStartSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.enter) {
            if (!pre) {
              removeAllChild(this);
              let gamePlayScene = new GamePlayScene();
            }
          } else{
            pre = false;
          }
        });
      }
    });

    const GamePlayScene = Class.create(Scene, {
      initialize: function() {
        Scene.call(this);
        this.backgroundColor = 'black';
        this.bgm = core.assets['sound/bgm_maoudamashii_neorock73.mp3'].clone();
        const backgroundImageSize = {'x': 500, 'y': 1320}
        const playerSize = 51;
        const playersPlace = {'x': -100, 'y': -100};
        const shotSize = {'x': 20, 'y': 60};
        const shotSum = 10; // ショットグループの個数
        const shotSpeed = 30;
        const playerCollisionDetection = 8; //自機の当たり判定
        const deathTime = 0.4; //秒
        const enemySize = 50;
        const enemyPlace = {'x': 800, 'y': -100};
        const invincibleTime = 2; //秒
        const playScreenSize = {'x': 500, 'y': 660};
        const fourCoordinates = {'x1': 20, 'x2': 520, 'y1': 20, 'y2': 680};
        const centerX = playScreenSize.x/2 + fourCoordinates.x1;
        const defaultPosition = {'x': Math.floor(centerX - playerSize/2),
                                 'y': fourCoordinates.y2 - playerSize - 60};
        const enemyDefaultPosition = {'x': Math.floor(centerX - enemySize/2),
                                      'y': fourCoordinates.y1 + 60};

        const playerLife = 3;
        const enemyLife = 1000;
        let collision = false;
        let enemyInvincible = false;

        const background = new Sprite(backgroundImageSize.x, backgroundImageSize.y);
        background.image = core.assets['img/background.png'];
        background.x = fourCoordinates.x1
        background.y = fourCoordinates.y1-playScreenSize.y
        background.tl.moveTo(fourCoordinates.x1, fourCoordinates.y1, 60)
                     .moveTo(fourCoordinates.x1, fourCoordinates.y1-playScreenSize.y, 1)
                     .loop();
        this.addChild(background);

        const PauseScene = Class.create(Scene, {
          initialize: function(scene) {
            Scene.call(this)
            this.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            const pauseLabel = new templateLabel('PAUSE', 280, 280, '30px');
            const restartLabel = new templateLabel(
              'Press ENTER to restart.', 230, 380);
            this.addChild(pauseLabel);
            this.addChild(restartLabel);
            core.pushScene(this);
            this.on('enterframe', function(){
              if (core.input.enter){
                if (!pre){
                  pre = true
                  core.popScene();
                }
              } else{
                pre = false;
              }
            });
          }
        });

        const bulletSmall = {'width': 16, 'height': 16, 'imgName': 'img/bullet1.png', 'collisionDetection': 4};
        const bulletMiddle = {'width': 32, 'height': 32, 'imgName': 'img/bullet2.png', 'collisionDetection': 8};
        const bulletLarge = {'width': 50, 'height': 50, 'imgName': 'img/bullet3.png', 'collisionDetection': 15};

        const Bullet = Class.create(Sprite, {
          initialize: function(enemy, bullet, frame, num, se){
            Sprite.call(this, bullet.width, bullet.height);
            this.image = core.assets[bullet.imgName];
            this.frame = frame;
            this.num = num;
            this.x = enemyPlace.x;
            this.y = enemyPlace.y;
            this.speed = 0;
            this.speedX = 0;
            this.speedY = 0;
            this.acceleration = 0;
            this.enemy = enemy;
            this.outside = 20;  //画面外の、弾がなくならない範囲
            this.se = se;
            if(this.se === true) {
              this.bulletSe = core.assets['sound/dumping.mp3'].clone();
            } else {
              this.bulletSe = null;
            }
            this.on('enterframe', function(){
              //当たり判定
              if (this.within(player, playerCollisionDetection + bullet.collisionDetection)){
                collision = true;
              }
              // 画面外処理
              if ((this.speed !== 0)||(this.speedX !== 0)||(this.speedX !== 0)){
                if ((this.x <= 0 - this.width - this.outside)||
                   (this.x >= playScreenSize.x + this.outside)||
                   (this.y <= 0 - this.height - this.outside)||
                   (this.y >= playScreenSize.y + this.outside)){
                     this.speed = 0;
                     this.speedX = 0;
                     this.speedY = 0;
                     this.acceleration = 0;
                     this.x = enemyPlace.x;
                     this.y = enemyPlace.y;
                   }
              }
            });
          },
          enemyPosition: function(){
            const x = this.enemy.x + Math.floor((playerSize-this.width)/2);
            const y = this.enemy.y + Math.floor((playerSize-this.height)/2);
            return {'x': x, 'y': y};
          }
        });

        const BasicBullet = Class.create(Bullet, {
          initialize: function(enemy, bullet, frame, num,
                               speedMax, speedMin, angleMax, angleMin, playerAiming = false,
                               startX='enemy', startY='enemy', acceleration = 0, accelDirection = null, se = false){
            Bullet.call(this, enemy, bullet, frame, num, se);
            this.angle = 0;
            this.playerAiming = playerAiming;
            if (startX === 'enemy') this.startXType = 'enemy';
            if (startY === 'enemy') this.startYType = 'enemy';
            if (startX === 'random') this.startXType = 'random';
            if (startY === 'random') this.startYType = 'random';
            let preNum = 0;
            let bulletPermission = true;
            this.on('enterframe', function(){
              // bulletNumが切り替わると許可
              if(preNum !== this.enemy.bulletNum) bulletPermission = true;
              preNum = this.enemy.bulletNum;
              //待機中かつ順番
              if ((bulletPermission)&&(this.y === enemyPlace.y)&&(this.enemy.bulletNum === this.num)){
                if (this.startXType === 'enemy') startX = this.enemyPosition().x;
                if (this.startYType === 'enemy') startY = this.enemyPosition().y;
                if (this.startXType === 'random') startX = Math.floor(Math.random() *
                                                           (playScreenSize.x+this.width))+20-this.width;
                if (this.startYType === 'random') startY = Math.floor(Math.random() *
                                                           (playScreenSize.y+this.height))+20-this.height;
                this.x = startX;
                this.y = startY;
                this.angle = (this.playerAiming) ? this.playerAngle() : 0;
                this.angle += (Math.floor(Math.random() * (angleMax-angleMin))+angleMin)/180*Math.PI;
                this.speed = Math.floor(Math.random() * (speedMax-speedMin))+speedMin;
                this.speedX = this.speed*Math.sin(this.angle);
                this.speedY = this.speed*Math.cos(this.angle);
                this.acceleration = acceleration;
                if (this.se){
                  this.bulletSe.play();
                }
                bulletPermission = false; //1ループで1射のみ
              }
              if (accelDirection === 'x'){
                this.speedX += this.acceleration;
                this.x += this.speedX;
                this.y += this.speedY;
              } else if (accelDirection === 'y') {
                this.speedY += this.acceleration;
                this.x += this.speedX;
                this.y += this.speedY;
              } else if (accelDirection === 'circle') {
                this.angle += this.acceleration;
                this.x += this.speed*Math.sin(this.angle);
                this.y += this.speed*Math.cos(this.angle);
              } else {
                this.speed += this.acceleration;
                this.x += this.speed*Math.sin(this.angle);
                this.y += this.speed*Math.cos(this.angle);
              }

            })
          },
          playerAngle: function(){
            if(player.x === playersPlace.x){
              return 0;
            }
            return Math.atan2(player.x-this.x, player.y-this.y);
          }
        });

        const Enemy = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, enemySize, enemySize);
            this.image = core.assets['img/snake.png'];
            this.x = 20;
            this.y = 20;
            this.life = enemyLife;
            this.frame = 0;
            this.deathSe = core.assets['sound/attack3.mp3'].clone();
            this.bullets = [];
            this.bulletNum = -1;
            this.phaseNum = 0;
            this.enemyInterval = false;
            this.phaseStartAge = 0;
            this.scene = scene;

            this.scene.addChild(this);

            //enemyのループ処理
            this.on('enterframe', function() {
              this.frame = Math.floor(this.age/4) % 3;

              //無敵処理
              enemyInvincible = this.enemyInterval;

              //当たり判定
              if (this.within(player, playerCollisionDetection+20)){
                collision = true;
              }

              //phase分岐
              if ((this.phaseNum === 0)&&(this.life / enemyLife >= 4/5)&&(!this.enemyInterval)){
                this.enemyInterval = true;
                this.moveToDefaultPosition();
              }
              if ((this.phaseNum === 1)&&(this.life / enemyLife < 4/5)&&(!this.enemyInterval)){
                removeAllChild(bulletGroup);
                this.enemyInterval = true;
                this.moveToDefaultPosition();
              }
              if ((this.phaseNum === 2)&&(this.life / enemyLife < 3/5)&&(!this.enemyInterval)){
                removeAllChild(bulletGroup);
                this.enemyInterval = true;
                this.moveToDefaultPosition();
              }
              if ((this.phaseNum === 3)&&(this.life / enemyLife < 2/5)&&(!this.enemyInterval)){
                removeAllChild(bulletGroup);
                this.enemyInterval = true;
                this.moveToDefaultPosition();
              }
              if ((this.phaseNum === 4)&&(this.life / enemyLife < 1/5)&&(!this.enemyInterval)){
                removeAllChild(bulletGroup);
                this.enemyInterval = true;
                this.moveToDefaultPosition();
              }
              if ((this.phaseNum === 5)&&(this.life === 0)){
                removeAllChild(bulletGroup);
                this.phaseJunction();
              }

              if(this.phaseNum === 1){
                this.bulletNum = Math.floor((this.age-this.phaseStartAge)/30) % 8;
              }
              if(this.phaseNum === 2){
                this.bulletNum = Math.floor((this.age-this.phaseStartAge)/5) % 90;
              }
              if(this.phaseNum === 3){
                this.bulletNum = Math.floor((this.age-this.phaseStartAge)/30) % 15;
              }
              if(this.phaseNum === 4){
                this.bulletNum = Math.floor((this.age-this.phaseStartAge)/1) % 180;
              }
              if(this.phaseNum === 5){
                this.bulletNum = Math.floor((this.age-this.phaseStartAge)/3) % 72;
              }
            });
          },
          moveToDefaultPosition: function(){
            this.tl.clear();
            this.tl.moveTo(enemyDefaultPosition.x, enemyDefaultPosition.y, 30, enchant.Easing.QUAD_EASEOUT)
                   .exec(this.phaseJunction);
          },
          phaseJunction: function(){
            this.enemyInterval = false;
            this.phaseNum++;
            this.phaseStartAge = this.age;
            this.bullets = [];
            this.tl.clear();
            switch (this.phaseNum) {
              case 1:
              for(let i=0;i<8;i++){
                if (i % 4 === 3) continue;
                let frame = i % 2;
                for(let k=0;k<30;k++){
                  let se = (k === 0) ? true: false;
                  let bullet1 = new BasicBullet(
                    /*enemy*/ this,
                    /* bullet */ bulletMiddle,
                    /* frame */ frame,
                    /* num */ i,
                    /* speedMax */ 4,
                    /* speedMin */ 4,
                    /* angleMax */ k * 12 + frame * 6,
                    /* angleMin */ k * 12 + frame * 6 -3,
                    /* playerAiming */ false,
                    /* startX */ 'enemy',
                    /* startY */ 'enemy',
                    /* acceleration */ 0,
                    /* accelDirection */ null,
                    /* se */ se
                  );
                  this.bullets.push(bullet1);
                }
              }
                break;
              case 2:
                this.tl.delay(90).moveX(395, 60).delay(60).moveX(95, 60).loop()
                for(i = 0; i < 90; i++){
                  if(i % 18 === 0){
                    for(k = 0; k < 3; k++){
                      let se = (k === 0) ? true: false;
                      let bullet2 = new BasicBullet(
                        /*enemy*/ this,
                        /* bullet */ bulletLarge,
                        /* frame */ 0,
                        /* num */ i,
                        /* speedMax */ 5,
                        /* speedMin */ 5,
                        /* angleMax */ (k - 1)*20,
                        /* angleMin */ (k - 1)*20,
                        /* playerAiming */ true,
                        /* startX */ 'enemy',
                        /* startY */ 'enemy',
                        /* acceleration */ 0,
                        /* accelDirection */ null,
                        /* se */ se
                      );
                      this.bullets.push(bullet2);
                    }
                  }
                  let frame = i % 4;
                  let bullet2 = new BasicBullet(
                    /*enemy*/ this,
                    /* bullet */ bulletSmall,
                    /* frame */ frame,
                    /* num */ i,
                    /* speedMax */ 5,
                    /* speedMin */ 4,
                    /* angleMax */ 20,
                    /* angleMin */ -20,
                    /* playerAiming */ false,
                    /* startX */ 'random',
                    /* startY */ 10,
                    /* acceleration */ 0,
                    /* accelDirection */ null,
                    /* se */ false
                  );
                  this.bullets.push(bullet2);
                }
                break;
              case 3:
              for(i = 0; i < 15; i++){
                if(i % 3 === 2){
                  let bullet3 = new BasicBullet(
                    /*enemy*/ this,
                    /* bullet */ bulletMiddle,
                    /* frame */ 0,
                    /* num */ i,
                    /* speedMax */ 5,
                    /* speedMin */ 5,
                    /* angleMax */ 0,
                    /* angleMin */ 0,
                    /* playerAiming */ true,
                    /* startX */ 'enemy',
                    /* startY */ 'enemy',
                    /* acceleration */ 0,
                    /* accelDirection */ null,
                    /* se */ true
                  );
                  this.bullets.push(bullet3);
                }
                for(k = 0; k < 10; k++){
                  if(i % 5 === 0){
                    let frame = k % 4;
                    let bullet3 = new BasicBullet(
                      /*enemy*/ this,
                      /* bullet */ bulletLarge,
                      /* frame */ frame,
                      /* num */ i,
                      /* speedMax */ 2,
                      /* speedMin */ 2,
                      /* angleMax */ 90 - 180 * (k%2),
                      /* angleMin */ 90 - 180 * (k%2),
                      /* playerAiming */ false,
                      /* startX */ 20 - 50 + 550 * (k%2),
                      /* startY */ 120 + k * 56,
                      /* acceleration */ 0,
                      /* accelDirection */ null,
                      /* se */ false
                    );
                    this.bullets.push(bullet3);
                  }
                  let frame = k % 4;
                  let bullet3 = new BasicBullet(
                    /*enemy*/ this,
                    /* Bullet */ bulletSmall,
                    /* frame */ frame,
                    /* num */ i,
                    /* speedMax */ 3,
                    /* speedMin */ 3,
                    /* angleMax */ 0,
                    /* angleMin */ 0,
                    /* playerAiming */ false,
                    /* startX */ k * 50 + 30,
                    /* startY */ 10,
                    /* acceleration */ 0,
                    /* accelDirection */ null,
                    /* se */ false
                  );
                  this.bullets.push(bullet3);
                }
              }
                break;
              case 4:
                for(i = 0; i< 180; i++){
                  let bullet;
                  if(i % 15 === 14){
                    bullet = bulletLarge;
                  } else if (i % 4 === 3){
                    bullet = bulletMiddle;
                  } else {
                    bullet = bulletSmall;
                  }
                  let bullet4 = new BasicBullet(
                    /*enemy*/ this,
                    /* bullet */ bullet,
                    /* frame */ 1,
                    /* num */ i,
                    /* speedMax */ 5,
                    /* speedMin */ 1,
                    /* angleMax */ 200,
                    /* angleMin */ 160,
                    /* playerAiming */ false,
                    /* startX */ 'random',
                    /* startY */ 'enemy',
                    /* acceleration */ 0.12,
                    /* accelDirection */ 'y',
                    /* se */ false
                  );
                  this.bullets.push(bullet4);
                }
                break;
              case 5:
                for(i = 0;i < 72; i++){
                  if(Math.floor(i/8) % 3 !== 2){
                    let bullet5 = new BasicBullet(
                      /*enemy*/ this,
                      /* bullet */ bulletMiddle,
                      /* frame */ 0,
                      /* num */ i,
                      /* speedMax */ 7,
                      /* speedMin */ 7,
                      /* angleMax */ 1,
                      /* angleMin */ -1,
                      /* playerAiming */ true,
                      /* startX */ 'enemy',
                      /* startY */ 'enemy',
                      /* acceleration */ 0,
                      /* accelDirection */ null,
                      /* se */ true
                    );
                    this.bullets.push(bullet5);
                  }
                  if(i % 6 === 0){
                    for(k = 0;k < 30; k++){
                      let frame = (i % 12 === 0) ? 2: 3;
                      let acceleration = (i % 12 === 0) ? 0.008: -0.008;
                      let angleDiff = (i % 12 === 0) ? i / 6: -i / 6;
                      let bullet5 = new BasicBullet(
                        /*enemy*/ this,
                        /* bullet */ bulletLarge,
                        /* frame */ frame,
                        /* num */ i,
                        /* speedMax */ 4,
                        /* speedMin */ 4,
                        /* angleMax */ k * 12 + angleDiff,
                        /* angleMin */ k * 12 + angleDiff,
                        /* playerAiming */ false,
                        /* startX */ 'enemy',
                        /* startY */ 'enemy',
                        /* acceleration */ acceleration,
                        /* accelDirection */ 'circle',
                        /* se */ false
                      );
                      this.bullets.push(bullet5);
                    }
                  }
                }
                break;
              default:
              //撃破処理
                this.deathSe.play()
                this.x = enemyPlace.x;
                this.y = enemyPlace.y;
                this.tl.delay(90).exec(function(){
                  clearGame(this.scene);
                });
                break;
            }
            for(i=0;i < this.bullets.length;i++){
              bulletGroup.addChild(this.bullets[i]);
            }
          }
        });

        const Player = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, playerSize, playerSize);
            this.image = core.assets['img/batt.png'];
            this.x = defaultPosition.x;
            this.y = defaultPosition.y;
            this.life = playerLife;
            this.deathSe = core.assets['sound/hidan.wav'].clone();
            this.frame = 12;
            this.scene = scene;
            let startAge = this.age;  //無敵時間用
            let movePermission = true;  //移動有効/無効
            let shotPermission = true;
            let playerSpeed = 8;
            let shotNum = -1; //ショットのグループ番号


            const ShotGroup = Class.create(Group, {
              initialize: function(gNum, player, scene) {
                Group.call(this);
                const shot1 = new Shot(this, gNum, -20, player, true);
                const shot2 = new Shot(this, gNum, 20, player, false);

                scene.addChild(this);
              }
            })

            const Shot = Class.create(Sprite, {
              initialize: function(group, gNum, pos, player, se) {
                Sprite.call(this, 20, 60);
                this.image = core.assets['img/shot1.png'];
                this.x = playersPlace.x;
                this.y = playersPlace.y;
                this.speed = 0;
                this.gNum = gNum;
                this.pos = pos; //相対的な位置
                this.shotSe = core.assets['sound/putting_scissors.mp3'].clone();
                this.se = se;
                group.addChild(this);
                this.on('enterframe', function() {
                  // 命中処理
                  if (this.intersect(enemy)){
                    this.x = playersPlace.x;
                    this.y = playersPlace.y;
                    this.speed = 0;
                    if(!enemyInvincible) enemy.life--;
                    if (enemy.life <= 0) enemy.life = 0;
                  }
                  // 待機中かつボタン入力でショット
                  if ((shotNum === this.gNum)&&(this.speed === 0)) {
                    this.x = player.x + (playerSize-shotSize.x)/2 + this.pos;
                    this.y = player.y - 20; //ショットが出る位置。20は適当
                    this.speed = shotSpeed;
                    if (se){
                      this.shotSe.play();
                    }
                  };
                  // 画面外待機
                  if (this.y <= -shotSize.y) {
                    this.x = playersPlace.x;
                    this.y = playersPlace.y;
                    this.speed = 0;
                  };
                  this.y -= this.speed
                });
              }
            });

            // ショットのグループをループで作成
            let shotGroup = [];
            for(let i = 0; i < shotSum; i++){
              shotGroup[i] = new ShotGroup(i, this, scene);
            }

            this.scene.addChild(this);
            // プレイヤーのループ処理
            this.on('enterframe', function () {
              this.frame = Math.floor(this.age/4) % 4;
              //被弾処理ここから
              //死亡時間経過後の処理
              if (((this.age - startAge) / core.fps >= deathTime)&&
                 (this.x === playersPlace.x)){
                if ((this.life) <= 0) { //GAMEOVER判定
                  this.scene.gameOver();
                }
                this.x = defaultPosition.x;
                this.y = defaultPosition.y; //画面外の自機を戻す
                movePermission = true;
                shotPermission = true;
              };
              // 無敵時間の処理
              if ((this.age - startAge) / core.fps <= invincibleTime) {
                collision = false;
                this.opacity = ((Math.floor(this.age/2) % 2) === 1) ? 1 : 0;
              } else {
                this.opacity =1;
              };
              //被弾処理
              if (collision) {
                collision = false;
                this.deathSe.play();
                this.life--;
                lifeStar.width = 31 * this.life;
                startAge = this.age;
                movePermission = false;
                shotPermission = false;
                this.x = playersPlace.x;  //画面外へ
                this.y = playersPlace.y;
              };
              //被弾処理ここまで
              //  移動処理ここから
              if (core.input.y) {  //低速移動
                playerSpeed = 4;
              } else {
                playerSpeed = 8;
              }
              //同時押し補正
              let keyCount = 0;
              if (core.input.left) keyCount++;
              if (core.input.right) keyCount++;
              if (core.input.up) keyCount++;
              if (core.input.down) keyCount++;
              if (keyCount === 2) playerSpeed *= 1/Math.sqrt(2);

              let left = playerSpeed
                  right = playerSpeed
                  up = playerSpeed
                  down = playerSpeed;
              //端での移動処理
              if ((this.x-left) <= fourCoordinates.x1) left = this.x-fourCoordinates.x1;
              if ((this.x+playerSize+right) >= fourCoordinates.x2) right = fourCoordinates.x2-(this.x+playerSize);
              if ((this.y-up) <= fourCoordinates.y1) up = this.y-fourCoordinates.y1;
              if ((this.y+playerSize+down) >= fourCoordinates.y2) down = fourCoordinates.y2-(this.y+playerSize);

              if (movePermission) {
                if (core.input.left) this.x -= left;
                if (core.input.right) this.x += right;
                if (core.input.up) this.y -= up;
                if (core.input.down) this.y += down;
              }
              //  移動処理ここまで

              //ショット処理
              if ((core.input.x)&&(shotPermission)) {
                shotNum = this.age/3 % shotSum;
              } else {
                shotNum = -1;
              }
            });
          }
        });

        function clearGame(scene){
          scene.bgm.stop();
          removeAllChild(scene);
          let gameClearScene = new GameClearScene();
        }

        const enemy = new Enemy(this);

        const player = new Player(this);

        const bulletGroup = new Group();
        this.addChild(bulletGroup);

        // 外枠
        const playscreen = new Sprite(700, 700);
        playscreen.image = core.assets['img/playscreen.png'];

        this.addChild(playscreen);

        const lifeBar = new Sprite(460, 5);
        lifeBar.backgroundColor = 'white'
        lifeBar.x = 40;
        lifeBar.y = 40;
        this.addChild(lifeBar);

        const lifeLabel = new templateLabel('Player:', 540, 40);
        this.addChild(lifeLabel);

        const lifeStar = new Sprite(31*playerLife, 31);
        lifeStar.image = core.assets['img/star.png'];
        lifeStar.x = 560;
        lifeStar.y = 70;
        this.addChild(lifeStar);

        const shotKeyLabel = new templateLabel('ショット：X', 540, 440);
        this.addChild(shotKeyLabel);
        const lowKeyLabel = new templateLabel('低速移動：Z', 540, 480);
        this.addChild(lowKeyLabel);
        const pauseKeyLabel = new templateLabel('ポーズ：ENTER', 540, 520);
        this.addChild(pauseKeyLabel);
        const quitKeyLabel = new templateLabel('やめる：Q', 540, 560);
        this.addChild(quitKeyLabel);
        
        this.bgm.play();


        core.replaceScene(this);
        // GamePlaySceneのループ処理
        let pre = true;
        this.on('enterframe', function() {

          //ポーズ
          if (core.input.enter){
            if (!pre){
              pre = true;
              // 手前に表示するため毎回作成
              this.bgm.pause();
              let pauseScene = new PauseScene();
            }
          } else{
            pre = false;
          }

          // ゲームをやめる
          if (core.input.q) {
            removeAllChild(this);
            let gameStartScene = new GameStartScene();
          }

          // 敵のHPバー
          lifeBar.width = 460 * enemy.life/enemyLife;
          if (enemy.life/enemyLife <= 0.2){
            lifeBar.backgroundColor = 'yellow';
          }
        });
      },
      gameOver: function(){
        this.bgm.stop();
        removeAllChild(this);
        let gameOverScene = new GameOverScene();
      }

    });

    const GameClearScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const gameClearLabel =  new templateLabel('Game Clear!', 215, 280, '50px');
        const thanksLabel = new templateLabel(
          'Thank you for playing!', 260, 390
        );
        const pressLabel = new templateLabel(
          'Press ENTER to back to the menu.', 205, 500
        );
        pressLabel.width = 500;

        this.addChild(gameClearLabel);
        this.addChild(thanksLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameClearSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.enter) {
            if (!pre) {
              removeAllChild(this);
              let gameStartScene = new GameStartScene();
            }
          } else{
            pre = false;
          }
        });
      }
    });

    const GameOverScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const gameOverLabel =  new templateLabel('GAME OVER', 235, 280, '40px');
        const pressLabel = new templateLabel(
          'Press ENTER to back to the menu.', 205, 500
        );
        pressLabel.width = 500;

        this.addChild(gameOverLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameOverSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.enter) {
            if (!pre) {
              removeAllChild(this);
              let gameStartScene = new GameStartScene();
            }
          } else{
            pre = false;
          }
        });
      }
    });

    //クラス
    const templateLabel = Class.create(Label, {
      initialize: function(text, x, y, size='20px') {
        Label.call(this);
        this.text = text;
        this.x = x;
        this.y = y;
        this.font = size + " Arial";
        this.color = 'white';
      }
    });

    //関数
    function removeAllChild(scene){
      while(scene.firstChild){
        scene.removeChild(scene.firstChild);
      }
    }

    //最初のシーン呼び出し
    let gameStartScene = GameStartScene();
  };
  core.start();
};
