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
  core.preload('bullet1.png','boss_vermiena.png', 'playscreen.png', 'shot1.png', 'snake.png',
               'putting_scissors.mp3', 'attack3.mp3', 'hidan.wav', 'star.png');
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
        const enemyLife = 300;
        let collision = false;

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
            this.image = core.assets['snake.png'];
            this.x = enemyDefaultPosition.x;
            this.y = enemyDefaultPosition.y;
            this.life = enemyLife;
            this.death = 0; //撃破時のframe記録用
            this.frame = 0;
            this.deathSe = core.assets['attack3.mp3'].clone();
            scene.addChild(this);
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
            });
          }
        });

        const Player = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, playerSize, playerSize);
            this.image = core.assets['boss_vermiena.png'];
            this.x = defaultPosition.x;
            this.y = defaultPosition.y;
            this.life = playerLife;
            this.deathSe = core.assets['hidan.wav'].clone();
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
                this.image = core.assets['shot1.png'];
                this.x = playersPlace.x;
                this.y = playersPlace.y;
                this.speed = 0;
                this.gNum = gNum;
                this.pos = pos; //相対的な位置
                this.shotSe = core.assets['putting_scissors.mp3'].clone();
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
            for(var i = 0; i < shotSum; i++){
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

        let bulletGroup = new Group();
        this.addChild(bulletGroup);

        const bullet = new Sprite(32, 32);
        bullet.image = core.assets['bullet1.png'];
        bullet.x = centerX-bullet.width/2;
        bullet.y = 16;
        this.frame = 0;
        bullet.on('enterframe', function() {
          this.y += 5;
          if (this.y >= screenSize.y) {
            this.y = 16;
          };
          if(this.within(player, playerCollisionDetection + 8)){
            collision = true;
          };
        });
        bulletGroup.addChild(bullet);

        // 外枠
        const playscreen = new Sprite(700, 700);
        playscreen.image = core.assets['playscreen.png'];

        this.addChild(playscreen);

        const lifeBar = new Sprite(460, 5);
        lifeBar.backgroundColor = 'white'
        lifeBar.x = 40;
        lifeBar.y = 40;
        this.addChild(lifeBar);

        const lifeLabel = new templateLabel('Player:', 540, 40);
        this.addChild(lifeLabel);

        const lifeStar = new Sprite(31*playerLife, 31);
        lifeStar.image = core.assets['star.png'];
        lifeStar.x = 560;
        lifeStar.y = 70;
        this.addChild(lifeStar);

        //ポーズシーン作成
        const pauseScene = new PauseScene();

        core.replaceScene(this);
        // GamePlaySceneのループ処理
        let pre = true;
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
