enchant();

const playerSize = 51;
const playerCollisionDetection = 8;
const screenSize = {'x': 600, 'y': 600};
const defaultPosition = {'x': Math.floor(screenSize.x/2 - playerSize/2),
                       'y': Math.floor(screenSize.y - playerSize - 60)};

window.onload = function() {
  const core = new Core(screenSize.x, screenSize.y);
  core.fps = 30;
  core.rootScene.backgroundColor = 'black';
  core.keybind(88, "a");
  core.keybind(90, "b");
  core.preload('bullet1.png','boss_vermiena.png');
  core.onload = function() {
    //シーン
    const GameStartScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const startLabel =  new templateLabel('START', 200, 200, '40px');
        const pressLabel = new templateLabel(
          'Press x to start.', 150, 300
        );

        this.addChild(startLabel);
        this.addChild(pressLabel);

        let preA = true;  //押した瞬間を検知
        this.on('enterframe', function() {
          if (core.input.a) {
            if (!preA) {
              removeScene(this);
              let gamePlayScene = new GamePlayScene();
            }
            preA = true;
          } else{
            preA = false;
          }
        });
        core.replaceScene(this);
      }
    });

    const GamePlayScene = Class.create(Scene, {
      initialize: function() {
        Scene.call(this);
        this.backgroundColor = 'black';

        const Player = Class.create(Sprite, {
          initialize: function(scene) {
            Sprite.call(this, playerSize, playerSize);
            this.image = core.assets['boss_vermiena.png'];
            this.x = defaultPosition.x;
            this.y = defaultPosition.y;
            this.frame = 12;
            let startAge = this.age;  //無敵時間用
            let movePermission = true;  //移動有効/無効
            let playerSpeed = 8;

            this.on('enterframe', function () {
              this.frame = [12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15];
              //  移動処理ここから
              if (core.input.b) {  //低速移動
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
              if ((this.x-left) <= 0) left = this.x;
              if ((this.x+playerSize+right) >= screenSize.x) right = screenSize.x-(this.x+playerSize);
              if ((this.y-up) <= 0) up = this.y;
              if ((this.y+playerSize+down) >= screenSize.y) down = screenSize.y-(this.y+playerSize);

              if (movePermission) {
                if (core.input.left) this.x -= left;
                if (core.input.right) this.x += right;
                if (core.input.up) this.y -= up;
                if (core.input.down) this.y += down;
              }
              //  移動処理ここまで

              if (((this.age - startAge) / core.fps >= 0.2)&& //0.2秒隔離
                 (this.y === defaultPosition.y + 1000)){
                if ((playerLife - death) <= 0) { //GAMEOVER判定
                  removeScene(scene);
                  let gameOverScene = new GameOverScene();
                }
                this.y = defaultPosition.y;
                movePermission = true;  //画面外の自機を戻す
              };
              if ((this.age - startAge) / core.fps <= 2) { //無敵時間2秒
                collision = false;
                this.opacity = ((Math.floor(this.age/2) % 2) === 1) ? 1 : 0;
              } else {
                this.opacity =1;
              };
              if (collision) {
                collision = false;
                death++;
                lifeLabel.text = playerLife - death;
                startAge = this.age;
                movePermission = false;
                this.x = defaultPosition.x;
                this.y = defaultPosition.y + 1000;
              };
            });

            scene.addChild(this);
          }
        });

        const player = new Player(this);
        let playerLife = 3;
        let death = 0;
        let collision = false;

        let bulletGroup = new Group();
        this.addChild(bulletGroup);

        const bullet = new Sprite(32, 32);
        bullet.image = core.assets['bullet1.png'];
        bullet.x = (screenSize.x-32)/2;
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

       const lifeLabel = new templateLabel(playerLife, 560, 5);
        this.addChild(lifeLabel);

        this.on('enterframe', function() {

        });
        core.replaceScene(this);
      }
    });

    const GameOverScene = Class.create(Scene, {
      initialize: function(){
        Scene.call(this);
        this.backgroundColor = 'black';
        const gameOverLabel =  new templateLabel('GAME OVER', 200, 200, '40px');
        const pressLabel = new templateLabel(
          'Press x to back to menu.', 150, 300
        );

        this.addChild(gameOverLabel);
        this.addChild(pressLabel);

        let preA = true;  //押した瞬間を検知
        this.on('enterframe', function() {
          if (core.input.a) {
            if (!preA) {
              removeScene(this);
              let gamePlayScene = new GameStartScene();
            }
            preA = true;
          } else{
            preA = false;
          }
        });

        core.replaceScene(this);
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
    })

    //関数
    function removeScene(scene){
      while(scene.firstChild){
        scene.removeChild(scene.firstChild);
      }
    }

    //最初のシーン呼び出し
    let gameStartScene = GameStartScene();
  };
  core.start();
};
