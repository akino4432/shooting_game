enchant();

const screenSize = {'x': 700, 'y': 700};

window.onload = function() {
  const core = new Core(screenSize.x, screenSize.y);
  core.fps = 30;
  core.rootScene.backgroundColor = 'black';
  core.keybind(88, "x");
  core.keybind(90, "y");
  core.keybind(81, "q");
  core.keybind(32, "space");
  core.preload('img/bullet1.png','img/boss_vermiena.png', 'img/playscreen.png', 'img/shot1.png',
               'img/snake.png', 'img/star.png','img/bullet2.png','img/bullet3.png',
               'sound/putting_scissors.mp3', 'sound/attack3.mp3', 'sound/hidan.wav');
  core.onload = function() {
    //シーン
    const GameStartScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const startLabel =  new templateLabel('START', 285, 250, '40px');
        const pressLabel = new templateLabel(
          'Press SPACE to start.', 255, 400
        );

        this.addChild(startLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameStartSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.space) {
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
        const enemyLife = 600;
        let collision = false;
        let phaseNum = 0;

        const PauseScene = Class.create(Scene, {
          initialize: function(scene) {
            Scene.call(this)
            this.backgroundColor = 'rgba(255, 255, 255, 0.2)'
            const pauseLabel = new templateLabel('PAUSE', 280, 280, '30px');
            const restartLabel = new templateLabel(
              'Press SPACE to restart.', 230, 380);
            this.addChild(pauseLabel);
            this.addChild(restartLabel);
            this.on('enterframe', function(){
              if (core.input.space){
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

        const Enemy = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, enemySize, enemySize);
            this.image = core.assets['img/snake.png'];
            this.x = enemyDefaultPosition.x;
            this.y = enemyDefaultPosition.y;
            this.life = enemyLife;
            this.death = 0; //撃破時のframe記録用
            this.frame = 0;
            this.deathSe = core.assets['sound/attack3.mp3'].clone();
            this.bullets = [];

            const Bullet = Class.create(Sprite, {
              initialize: function(width, height, imgName, frame, collisionDetection, num){
                Sprite.call(this, width, height);
                this.image = core.assets[imgName];
                this.frame = frame;
                this.num = num;
                this.x = enemyPlace.x;
                this.y = enemyPlace.y;
                this.speed = 0;
                this.outside = 20;  //画面外の、弾がなくならない範囲
                this.on('enterframe', function(){
                  //当たり判定
                  if (this.within(player, playerCollisionDetection+collisionDetection)){
                    collision = true;
                  }
                  // 画面外処理
                  if (this.speed !== 0){
                    if ((this.x <= 0 - this.width - this.outside)||
                       (this.x >= playScreenSize.x + this.outside)||
                       (this.y <= 0 - this.height - this.outside)||
                       (this.y >= playScreenSize.y + this.outside)){
                         this.speed = 0;
                         this.x = enemyPlace.x;
                         this.y = enemyPlace.y;
                       }
                  }
                });
              },
              enemyPosition: function(){
                const x = enemy.x + Math.floor((playerSize-this.width)/2);
                const y = enemy.y + Math.floor((playerSize-this.height)/2);
                return {'x': x, 'y': y};
              }
            });

            const BasicBullet = Class.create(Bullet, {
              initialize: function(width, height, imgName, frame, collisionDetection, num,
                                   speedMax, speedMin, angleMax, angleMin,
                                   startX=null, startY=null, acceleration = 1){
                Bullet.call(this, width, height, imgName, frame, collisionDetection, num);
                this.angle = 0;
                if (startX === null) startX = this.enemyPosition().x;
                if (startY === null) startY = this.enemyPosition().y;
                this.startXRandom = (startX === 'random') ? true: false;
                this.startYRandom = (startY === 'random') ? true: false;
                this.on('enterframe', function(){
                  //待機中かつ順番
                  if ((this.y === enemyPlace.y)&&(bulletNum === this.num)){
                    if (this.startXRandom) startX = Math.floor(Math.random() *
                                               (playScreenSize.x+this.width))+20-this.width;
                    if (this.startYRandom) startY = Math.floor(Math.random() *
                                               (playScreenSize.y+this.height))+20-this.height;
                    this.x = startX;
                    this.y = startY;
                    this.speed = Math.floor(Math.random() * (speedMax-speedMin))+speedMin;
                    this.angle = Math.floor(Math.random() * (angleMax-angleMin))+angleMin;
                  }
                  this.speed *= acceleration;
                  this.x += this.speed*Math.sin(this.angle/180*Math.PI);
                  this.y += this.speed*Math.cos(this.angle/180*Math.PI);
                })
              }
            });

            scene.addChild(this);

            //enemyのループ処理
            let bulletNum = -1;
            let phaseStartAge = 0;
            this.on('enterframe', function() {
              // 撃破処理
              if ((this.life <= 0)&&(this.death === 0)){
                this.deathSe.play()
                this.x = enemyPlace.x;
                this.y = enemyPlace.y;
                this.death = scene.age;
              }
              this.frame = Math.floor(this.age/4) % 3;

              //当たり判定
              if (this.within(player, playerCollisionDetection+20)){
                collision = true;
              }

              //phase分岐
              if ((phaseNum === 0)&&(this.life / enemyLife >= 2/3)){
                phaseNum = 1;
                phaseStartAge = this.age;
                enemy.bullets = [];
                for(let i=0;i<8;i++){
                  if (i % 4 === 3) continue;
                  let frame = i % 2;
                  for(let k=0;k<30;k++){
                    let bullet1 = new BasicBullet(
                      /* width */ 32,
                      /* height */ 32,
                      /* imageName */ 'img/bullet2.png',
                      /* frame */ frame,
                      /* collisionDetection */ 8,
                      /* num */ i,
                      /* speedMax */ 4,
                      /* speedMin */ 4,
                      /* angleMax */ k * 12 + frame * 6,
                      /* angleMin */ k * 12 + frame * 6 -3,
                      /* startX */ null,
                      /* startY */ null,
                      /* acceleration */ 1
                    );
                    enemy.bullets.push(bullet1);
                  }
                }
              }
              if ((phaseNum === 1)&&(this.life / enemyLife < 2/3)){
                phaseNum = 2;
                phaseStartAge = this.age;
                enemy.bullets = [];
                const bullet2 = new BasicBullet(32, 32, 'img/bullet2.png', 0, 8, 0, 7, 4, 0, 0, null, null, 1);
                enemy.bullets.push(bullet2);
              }
              if ((phaseNum === 2)&&(this.life / enemyLife < 1/3)){
                phaseNum = 3;
                phaseStartAge = this.age;
                enemy.bullets = [];
                const bullet3 = new BasicBullet(50, 50, 'img/bullet3.png', 0, 15, 0, 5, 5, 20, -20);
                enemy.bullets.push(bullet3);
              }

              if(phaseNum === 1){
                bulletNum = Math.floor((this.age-phaseStartAge)/30) % 8;
              }
              if(phaseNum === 2){
                bulletNum = Math.floor((this.age-phaseStartAge)/core.fps) % 10;
              }
              if(phaseNum === 3){
                bulletNum = Math.floor((this.age-phaseStartAge)/core.fps) % 10;
              }
            });
          }
        });

        const Player = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, playerSize, playerSize);
            this.image = core.assets['img/boss_vermiena.png'];
            this.x = defaultPosition.x;
            this.y = defaultPosition.y;
            this.life = playerLife;
            this.deathSe = core.assets['sound/hidan.wav'].clone();
            this.frame = 12;
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
                    enemy.life--;
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

            scene.addChild(this);
            // プレイヤーのループ処理
            this.on('enterframe', function () {
              this.frame = Math.floor(this.age/4) % 4 + 12;
              //被弾処理ここから
              //死亡時間経過後の処理
              if (((this.age - startAge) / core.fps >= deathTime)&&
                 (this.x === playersPlace.x)){
                if ((this.life) <= 0) { //GAMEOVER判定
                  removeAllChild(scene);
                  let gameOverScene = new GameOverScene();
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
        const pauseKeyLabel = new templateLabel('ポーズ：SPACE', 540, 520);
        this.addChild(pauseKeyLabel);
        const quitKeyLabel = new templateLabel('やめる：Q', 540, 560);
        this.addChild(quitKeyLabel);

        //ポーズシーン作成
        const pauseScene = new PauseScene();

        core.replaceScene(this);
        // GamePlaySceneのループ処理
        let pre = true;
        let prePhase = 0;
        this.on('enterframe', function() {
          // クリア判定
          if (enemy.death){
            if ((this.age - enemy.death) / core.fps >= 3){
              removeAllChild(this);
              let gameClearScene = new GameClearScene();
            }
          }
          //ポーズ
          if (core.input.space){
            if (!pre){
              pre = true;
              core.pushScene(pauseScene);
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

          //弾幕更新
          if (phaseNum !== prePhase){
            removeAllChild(bulletGroup);
            for(i=0;i < enemy.bullets.length;i++){
              bulletGroup.addChild(enemy.bullets[i]);
            }
          }

          prePhase = phaseNum;
        });
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
          'Press SPACE to back to the menu.', 205, 500
        );
        pressLabel.width = 500;

        this.addChild(gameClearLabel);
        this.addChild(thanksLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameClearSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.space) {
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
          'Press SPACE to back to the menu.', 205, 500
        );
        pressLabel.width = 500;

        this.addChild(gameOverLabel);
        this.addChild(pressLabel);

        let pre = true;  //押した瞬間を検知

        core.replaceScene(this);
        // GameOverSceneのループ処理
        this.on('enterframe', function() {
          if (core.input.space) {
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
