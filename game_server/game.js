'use strict';
const crypto = require('crypto');

const gameObj = {
  playersMap: new Map(),
  itemsMap: new Map(),
  airMap: new Map(),
  NPCMap: new Map(),
  addingNPCPlayerNum: 9,
  flyingMissilesMap: new Map(),
  missileAliveFlame: 180,
  missileSpeed: 3,
  missileWidth: 30,
  missileHeight: 30,
  directions: ['left', 'up', 'down', 'right'],
  fieldWidth: 1000,
  fieldHeight: 1000,
  itemTotal: 15,
  airTotal: 10,
  itemRadius: 4,
  airRadius: 6,
  addAirTime: 30,
  itemPoint: 3,
  killPoint: 500,
  submarineImageWidth: 42
};

function init() {
  for (let i = 0; i < gameObj.itemTotal; i++) {
    addItem();
  }
  for (let a = 0; a < gameObj.airTotal; a++) {
    addAir();
  }
}

init(); // 初期化（初期化はサーバ起動時に行う

const gameTicker = setInterval(() => {
  NPCMoveDecision(gameObj.NPCMap); // NPC の行動選択
  const playersAndNPCMap = new Map(Array.from(gameObj.playersMap).concat(Array.from(gameObj.NPCMap)));
  movePlayers(playersAndNPCMap); // 潜水艦の移動
  moveMissile(gameObj.flyingMissilesMap); // ミサイルの移動
  checkGetItem(playersAndNPCMap, gameObj.itemsMap, gameObj.airMap, gameObj.flyingMissilesMap); // アイテムの取得チェック
  addNPC();
}, 33);

function NPCMoveDecision(NPCMap) {
  for (let [NPCId, NPCObj] of NPCMap) {

    switch (NPCObj.level) {
      case 1:
        if (Math.floor(Math.random() * 60) === 1) {
          NPCObj.direction = gameObj.directions[Math.floor(Math.random() * gameObj.directions.length)];
        }
        if (NPCObj.missilesMany > 0 && Math.floor(Math.random() * 90) === 1) {
          missileEmit(NPCObj.playerId, NPCObj.direction);
        }
        break;
      case 2:
      case 3:
    }
  }
}

function newConnection(socketId, displayName, thumbUrl) {
  const playerX = Math.floor(Math.random() * gameObj.fieldWidth);
  const playerY = Math.floor(Math.random() * gameObj.fieldHeight);
  const playerId = crypto.createHash('sha1').update(socketId).digest('hex');

  const playerObj = {
    x: playerX,
    y: playerY,
    playerId: playerId,
    displayName: displayName,
    thumbUrl: thumbUrl,
    isAlive: true,
    direction: 'right',
    missilesMany: 0,
    airTime: 99,
    aliveTime: { 'clock': 0, 'seconds': 0 },
    deadCount: 0,
    score: 0
  };
  gameObj.playersMap.set(socketId, playerObj);

  const startObj = {
    playerObj: playerObj,
    fieldWidth: gameObj.fieldWidth,
    fieldHeight: gameObj.fieldHeight,
    missileSpeed: gameObj.missileSpeed
  };
  return startObj;
}

function getMapData() {
  const playersArray = [];
  const itemsArray = [];
  const airArray = [];
  const flyingMissilesArray = [];
  const playersAndNPCMap = new Map(Array.from(gameObj.playersMap).concat(Array.from(gameObj.NPCMap)));

  for (let [socketId, plyer] of playersAndNPCMap) {
    const playerDataForSend = [];

    playerDataForSend.push(plyer.x);
    playerDataForSend.push(plyer.y);
    playerDataForSend.push(plyer.playerId);
    playerDataForSend.push(plyer.displayName);
    playerDataForSend.push(plyer.score);
    playerDataForSend.push(plyer.isAlive);
    playerDataForSend.push(plyer.direction);
    playerDataForSend.push(plyer.missilesMany);
    playerDataForSend.push(plyer.airTime);
    playerDataForSend.push(plyer.deadCount);

    playersArray.push(playerDataForSend);
  }

  for (let [id, item] of gameObj.itemsMap) {
    const itemDataForSend = [];

    itemDataForSend.push(item.x);
    itemDataForSend.push(item.y);

    itemsArray.push(itemDataForSend);
  }

  for (let [id, air] of gameObj.airMap) {
    const airDataForSend = [];

    airDataForSend.push(air.x);
    airDataForSend.push(air.y);

    airArray.push(airDataForSend);
  }

  for (let [id, flyingMissile] of gameObj.flyingMissilesMap) {
    const flyingMissileDataForSend = [];

    flyingMissileDataForSend.push(flyingMissile.x);
    flyingMissileDataForSend.push(flyingMissile.y);
    flyingMissileDataForSend.push(flyingMissile.direction);
    flyingMissileDataForSend.push(flyingMissile.emitPlayerId);

    flyingMissilesArray.push(flyingMissileDataForSend);
  }

  return [playersArray, itemsArray, airArray, flyingMissilesArray];
}

function updatePlayerDirection(socketId, direction) {
  const playerObj = gameObj.playersMap.get(socketId);
  playerObj.direction = direction;
}

function missileEmit(socketId, direction) {
  const playersAndNPCMap = new Map(Array.from(gameObj.playersMap).concat(Array.from(gameObj.NPCMap)));
  if (!playersAndNPCMap.has(socketId)) return;

  let emitPlayerObj = playersAndNPCMap.get(socketId);

  if (emitPlayerObj.missilesMany <= 0) return; // 撃てないやん
  if (emitPlayerObj.isAlive === false) return; // 死んでるやんけ

  emitPlayerObj.missilesMany -= 1;
  const missileId = Math.floor(Math.random() * 100000) + ',' + socketId + ',' + emitPlayerObj.x + ',' + emitPlayerObj.y;

  const missileObj = {
    emitPlayerId: emitPlayerObj.playerId,
    emitPlayerSocketId: socketId,
    x: emitPlayerObj.x,
    y: emitPlayerObj.y,
    aliveFlame: gameObj.missileAliveFlame,
    direction: direction,
    id: missileId
  };
  gameObj.flyingMissilesMap.set(missileId, missileObj);
}

function disconnect(socketId) {
  gameObj.playersMap.delete(socketId);
}

function addItem() {
  const itemX = Math.floor(Math.random() * gameObj.fieldWidth);
  const itemY = Math.floor(Math.random() * gameObj.fieldHeight);
  const itemKey = `${itemX},${itemY}`;

  if (gameObj.itemsMap.has(itemKey)) { // アイテムの位置が被ってしまった場合は
    return addItem(); // 場所が重複した場合は作り直し
  }

  const itemObj = {
    x: itemX,
    y: itemY,
  };
  gameObj.itemsMap.set(itemKey, itemObj);
}

function addAir() {
  const airX = Math.floor(Math.random() * gameObj.fieldWidth);
  const airY = Math.floor(Math.random() * gameObj.fieldHeight);
  const airKey = `${airX},${airY}`;

  if (gameObj.airMap.has(airKey)) { // アイテムの位置が被ってしまった場合は
    return addAir(); // 場所が重複した場合は作り直し
  }

  const airObj = {
    x: airX,
    y: airY,
  };
  gameObj.airMap.set(airKey, airObj);
}

function movePlayers(playersMap) { // 潜水艦の移動
  for (let [playerId, player] of playersMap) {

    if (player.isAlive === false) {
      if (player.deadCount < 70) {
        player.deadCount += 1;
      } else {
        gameObj.playersMap.delete(playerId);
        gameObj.NPCMap.delete(playerId);
      }
      continue;
    }

    switch (player.direction) {
      case 'left':
        player.x -= 1;
        break;
      case 'up':
        player.y -= 1;
        break;
      case 'down':
        player.y += 1;
        break;
      case 'right':
        player.x += 1;
        break;
    }
    if (player.x > gameObj.fieldWidth) player.x -= gameObj.fieldWidth;
    if (player.x < 0) player.x += gameObj.fieldWidth;
    if (player.y < 0) player.y += gameObj.fieldHeight;
    if (player.y > gameObj.fieldHeight) player.y -= gameObj.fieldHeight;

    player.aliveTime.clock += 1;
    if (player.aliveTime.clock === 30) {
      player.aliveTime.clock = 0;
      player.aliveTime.seconds += 1;
      decreaseAir(player);
      player.score += 1;
    }
  }
}

function moveMissile(flyingMissilesMap) { // ミサイルの移動
  for (let [missileId, flyingMissile] of flyingMissilesMap) {
    const missile = flyingMissile;

    if (missile.aliveFlame === 0) {
      flyingMissilesMap.delete(missileId);
      continue;
    }

    flyingMissile.aliveFlame -= 1;

    switch (flyingMissile.direction) {
      case 'left':
        flyingMissile.x -= gameObj.missileSpeed;
        break;
      case 'up':
        flyingMissile.y -= gameObj.missileSpeed;
        break;
      case 'down':
        flyingMissile.y += gameObj.missileSpeed;
        break;
      case 'right':
        flyingMissile.x += gameObj.missileSpeed;
        break;
    }
    if (flyingMissile.x > gameObj.fieldWidth) flyingMissile.x -= gameObj.fieldWidth;
    if (flyingMissile.x < 0) flyingMissile.x += gameObj.fieldWidth;
    if (flyingMissile.y < 0) flyingMissile.y += gameObj.fieldHeight;
    if (flyingMissile.y > gameObj.fieldHeight) flyingMissile.y -= gameObj.fieldHeight;
  }
}

function decreaseAir(playerObj) {
  playerObj.airTime -= 1;
  if (playerObj.airTime === 0) {
    playerObj.isAlive = false;
  }
}

function checkGetItem(playersMap, itemsMap, airMap, flyingMissilesMap) {
  for (let [hashKey, playerObj] of playersMap) {
    if (playerObj.isAlive === false) continue;

    // アイテムのミサイル（赤丸）
    for (let [itemKey, itemObj] of itemsMap) {

      const distanceObj = calculationBetweenTwoPoints(
        playerObj.x, playerObj.y, itemObj.x, itemObj.y, gameObj.fieldWidth, gameObj.fieldHeight
      );

      if (
        distanceObj.distanceX <= (gameObj.submarineImageWidth / 2 + gameObj.itemRadius) &&
        distanceObj.distanceY <= (gameObj.submarineImageWidth / 2 + gameObj.itemRadius)
      ) { // got item!

        gameObj.itemsMap.delete(itemKey);
        playerObj.missilesMany = playerObj.missilesMany > 5 ? 6 : playerObj.missilesMany + 1;
        playerObj.score += gameObj.itemPoint;
        addItem();
      }
    }

    // アイテムの空気（青丸）
    for (let [airKey, airObj] of airMap) {

      const distanceObj = calculationBetweenTwoPoints(
        playerObj.x, playerObj.y, airObj.x, airObj.y, gameObj.fieldWidth, gameObj.fieldHeight
      );

      if (
        distanceObj.distanceX <= (gameObj.submarineImageWidth / 2 + gameObj.airRadius) &&
        distanceObj.distanceY <= (gameObj.submarineImageWidth / 2 + gameObj.airRadius)
      ) { // got air!

        gameObj.airMap.delete(airKey);
        if (playerObj.airTime + gameObj.addAirTime > 99) {
          playerObj.airTime = 99;
        } else {
          playerObj.airTime += gameObj.addAirTime;
        }
        playerObj.score += gameObj.itemPoint;
        addAir();
      }
    }

    // 撃ち放たれているミサイル
    for (let [missileId, flyingMissile] of flyingMissilesMap) {

      const distanceObj = calculationBetweenTwoPoints(
        playerObj.x, playerObj.y, flyingMissile.x, flyingMissile.y, gameObj.fieldWidth, gameObj.fieldHeight
      );

      if (
        distanceObj.distanceX <= (gameObj.submarineImageWidth / 2 + gameObj.missileWidth / 2) &&
        distanceObj.distanceY <= (gameObj.submarineImageWidth / 2 + gameObj.missileHeight / 2) &&
        playerObj.playerId !== flyingMissile.emitPlayerId
      ) {
        playerObj.isAlive = false;
        // 得点の更新
        if (playersMap.has(flyingMissile.emitPlayerSocketId)) {
          const emitPlayer = playersMap.get(flyingMissile.emitPlayerSocketId);
          emitPlayer.score += gameObj.killPoint;
          playersMap.set(flyingMissile.emitPlayerSocketId, emitPlayer);
        }
        flyingMissilesMap.delete(missileId); // ミサイル（魚雷）の削除
      }
    }
  }
}

function addNPC() {
  if (gameObj.playersMap.size + gameObj.NPCMap.size < gameObj.addingNPCPlayerNum) {
    const addMany = gameObj.addingNPCPlayerNum - gameObj.playersMap.size - gameObj.NPCMap.size;

    for (let i = 0; i < addMany; i++) {

      const playerX = Math.floor(Math.random() * gameObj.fieldWidth);
      const playerY = Math.floor(Math.random() * gameObj.fieldHeight);
      const level = Math.floor(Math.random() * 1) + 1;
      const id = Math.floor(Math.random() * 100000) + ',' + playerX + ',' + playerY + ',' + level;
      const playerObj = {
        x: playerX,
        y: playerY,
        isAlive: true,
        deadCount: 0,
        direction: 'right',
        missilesMany: 0,
        airTime: 99,
        aliveTime: { 'clock': 0, 'seconds': 0 },
        score: 0,
        level: level,
        displayName: 'NPC',
        thumbUrl: 'NPC',
        playerId: id
      };
      gameObj.NPCMap.set(id, playerObj);
    }
  }
}

function calculationBetweenTwoPoints(pX, pY, oX, oY, gameWidth, gameHeight) {
  let distanceX = 99999999;
  let distanceY = 99999999;

  if (pX <= oX) {
    // 右から
    distanceX = oX - pX;
    // 左から
    let tmpDistance = pX + gameWidth - oX;
    if (distanceX > tmpDistance) {
      distanceX = tmpDistance;
    }

  } else {
    // 右から
    distanceX = pX - oX;
    // 左から
    let tmpDistance = oX + gameWidth - pX;
    if (distanceX > tmpDistance) {
      distanceX = tmpDistance;
    }
  }

  if (pY <= oY) {
    // 下から
    distanceY = oY - pY;
    // 上から
    let tmpDistance = pY + gameHeight - oY;
    if (distanceY > tmpDistance) {
      distanceY = tmpDistance;
    }

  } else {
    // 上から
    distanceY = pY - oY;
    // 下から
    let tmpDistance = oY + gameHeight - pY;
    if (distanceY > tmpDistance) {
      distanceY = tmpDistance;
    }
  }

  return {
    distanceX,
    distanceY
  };
}

module.exports = {
  newConnection,
  getMapData,
  updatePlayerDirection,
  missileEmit,
  disconnect
};