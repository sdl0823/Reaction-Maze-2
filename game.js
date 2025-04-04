// 遊戲常數
const CELL_SIZE = 40; // 每個格子的大小
const PLAYER_SIZE = 20; // 玩家角色大小
const OBSTACLE_SIZE = 15; // 障礙物大小
const GOAL_SIZE = 25; // 終點大小

// 遊戲變數
let canvas, ctx;
let gameInterval;
let animationFrame;
let level = 1;
let timeLeft = 30;
let isGameRunning = false;
let maze = [];
let player = { x: 0, y: 0, speed: 5 };
let goal = { x: 0, y: 0 };
let obstacles = [];
let movingObstacles = [];
let keys = { up: false, down: false, left: false, right: false };

// 音效
let bgMusic;
let collisionSound;
let victorySound;

// DOM 元素
let levelElement;
let timerElement;
let startBtn;
let restartBtn;
let gameOverScreen;
let gameOverTitle;
let gameOverMessage;
let playAgainBtn;

// 初始化遊戲
window.onload = function() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // 獲取 DOM 元素
    levelElement = document.getElementById('level');
    timerElement = document.getElementById('timer');
    startBtn = document.getElementById('startBtn');
    restartBtn = document.getElementById('restartBtn');
    gameOverScreen = document.getElementById('gameOverScreen');
    gameOverTitle = document.getElementById('gameOverTitle');
    gameOverMessage = document.getElementById('gameOverMessage');
    playAgainBtn = document.getElementById('playAgainBtn');
    
    // 初始化音效
    initSounds();
    
    // 事件監聽
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', restartGame);
    playAgainBtn.addEventListener('click', restartGame);
    
    // 鍵盤控制
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // 繪製初始畫面
    drawStartScreen();
};

// 初始化音效
function initSounds() {
    // 背景音樂
    bgMusic = new Audio();
    bgMusic.src = 'https://assets.mixkit.co/sfx/preview/mixkit-game-level-music-689.mp3';
    bgMusic.loop = true;
    bgMusic.volume = 0.5;
    
    // 碰撞音效
    collisionSound = new Audio();
    collisionSound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-arcade-retro-game-over-213.mp3';
    
    // 勝利音效
    victorySound = new Audio();
    victorySound.src = 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3';
}

// 開始畫面
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#4CAF50';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('反應迷宮', canvas.width / 2, canvas.height / 2 - 30);
    ctx.font = '16px Arial';
    ctx.fillText('點擊「開始遊戲」按鈕開始挑戰', canvas.width / 2, canvas.height / 2 + 20);
}

// 開始遊戲
function startGame() {
    level = 1;
    startBtn.disabled = true;
    restartBtn.disabled = false;
    gameOverScreen.style.display = 'none';
    initLevel();
    bgMusic.play().catch(e => console.log('無法播放背景音樂:', e));
}

// 重新開始遊戲
function restartGame() {
    level = 1;
    gameOverScreen.style.display = 'none';
    initLevel();
    bgMusic.currentTime = 0;
    bgMusic.play().catch(e => console.log('無法播放背景音樂:', e));
}

// 初始化關卡
function initLevel() {
    // 更新 UI
    levelElement.textContent = level;
    
    // 設定關卡參數
    const mazeSize = 5 + Math.min(4, Math.floor(level / 2) * 2); // 5x5, 7x7, 9x9...
    const obstacleCount = 3 + level * 2;
    const movingObstacleCount = Math.min(level - 1, 5); // 從第二關開始有移動障礙物
    timeLeft = Math.max(10, 30 - level * 2); // 時間隨關卡減少，最少10秒
    player.speed = 5 + Math.min(3, Math.floor(level / 3)); // 玩家速度隨關卡增加
    
    // 更新畫布大小
    canvas.width = mazeSize * CELL_SIZE;
    canvas.height = mazeSize * CELL_SIZE;
    
    // 生成迷宮
    generateMaze(mazeSize);
    
    // 設置玩家位置（左上角）- 確保玩家位置在格子中心
    player.x = CELL_SIZE / 2;
    player.y = CELL_SIZE / 2;
    
    // 設置終點位置（右下角）
    goal.x = canvas.width - CELL_SIZE / 2;
    goal.y = canvas.height - CELL_SIZE / 2;
    
    // 生成障礙物
    generateObstacles(obstacleCount, movingObstacleCount, mazeSize);
    
    // 更新計時器
    timerElement.textContent = timeLeft;
    
    // 開始遊戲循環
    isGameRunning = true;
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(updateTimer, 1000);
    
    // 開始動畫循環
    if (animationFrame) cancelAnimationFrame(animationFrame);
    gameLoop();
}

// 生成迷宮
function generateMaze(size) {
    maze = [];
    
    // 創建空迷宮
    for (let y = 0; y < size; y++) {
        let row = [];
        for (let x = 0; x < size; x++) {
            // 0 表示通道，1 表示牆
            row.push(0);
        }
        maze.push(row);
    }
    
    // 添加一些隨機牆壁，但確保有路徑可以從起點到終點
    // 這裡使用簡單的隨機生成，而不是完整的迷宮算法
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            // 跳過起點和終點附近的格子
            if ((x < 2 && y < 2) || (x > size - 3 && y > size - 3)) {
                continue;
            }
            
            // 隨機生成牆壁，但保持較低的密度以確保可通行
            if (Math.random() < 0.2) {
                maze[y][x] = 1;
            }
        }
    }
    
    // 確保從起點到終點有路徑（這裡簡化處理，實際上應該使用路徑搜索算法）
    // 清除邊緣，確保至少有一條路徑
    for (let i = 0; i < size; i++) {
        // 清除上邊緣和右邊緣，形成一條路徑
        maze[0][i] = 0;
        maze[i][size - 1] = 0;
    }
}

// 生成障礙物
function generateObstacles(count, movingCount, mazeSize) {
    obstacles = [];
    movingObstacles = [];
    
    // 生成靜態障礙物
    for (let i = 0; i < count - movingCount; i++) {
        let obstacle;
        let validPosition = false;
        
        // 嘗試找到有效位置
        while (!validPosition) {
            const x = Math.floor(Math.random() * (mazeSize - 2) + 1) * CELL_SIZE + CELL_SIZE / 2;
            const y = Math.floor(Math.random() * (mazeSize - 2) + 1) * CELL_SIZE + CELL_SIZE / 2;
            
            // 檢查是否與玩家或終點重疊
            const distToPlayer = Math.hypot(x - player.x, y - player.y);
            const distToGoal = Math.hypot(x - goal.x, y - goal.y);
            
            if (distToPlayer > CELL_SIZE * 1.5 && distToGoal > CELL_SIZE * 1.5) {
                obstacle = { x, y };
                validPosition = true;
            }
        }
        
        obstacles.push(obstacle);
    }
    
    // 生成移動障礙物
    for (let i = 0; i < movingCount; i++) {
        let obstacle;
        let validPosition = false;
        
        // 嘗試找到有效位置
        while (!validPosition) {
            const x = Math.floor(Math.random() * (mazeSize - 2) + 1) * CELL_SIZE + CELL_SIZE / 2;
            const y = Math.floor(Math.random() * (mazeSize - 2) + 1) * CELL_SIZE + CELL_SIZE / 2;
            
            // 檢查是否與玩家或終點重疊
            const distToPlayer = Math.hypot(x - player.x, y - player.y);
            const distToGoal = Math.hypot(x - goal.x, y - goal.y);
            
            if (distToPlayer > CELL_SIZE * 2 && distToGoal > CELL_SIZE * 2) {
                // 隨機移動方向和速度
                const angle = Math.random() * Math.PI * 2;
                const speed = 1 + Math.random() * level * 0.5; // 速度隨關卡增加
                
                obstacle = {
                    x,
                    y,
                    dx: Math.cos(angle) * speed,
                    dy: Math.sin(angle) * speed
                };
                validPosition = true;
            }
        }
        
        movingObstacles.push(obstacle);
    }
}

// 更新計時器
function updateTimer() {
    if (!isGameRunning) return;
    
    timeLeft--;
    timerElement.textContent = timeLeft;
    
    if (timeLeft <= 0) {
        gameOver(false, '時間用盡！');
    }
}

// 遊戲循環
function gameLoop() {
    if (!isGameRunning) return;
    
    update();
    draw();
    
    animationFrame = requestAnimationFrame(gameLoop);
}

// 更新遊戲狀態
function update() {
    // 更新玩家位置
    updatePlayerPosition();
    
    // 更新移動障礙物位置
    updateObstacles();
    
    // 檢查碰撞
    checkCollisions();
    
    // 檢查是否到達終點
    checkGoal();
}

// 更新玩家位置
function updatePlayerPosition() {
    // 獲取當前玩家所在的格子
    const currentCellX = Math.floor(player.x / CELL_SIZE);
    const currentCellY = Math.floor(player.y / CELL_SIZE);
    
    // 確定移動方向
    let targetCellX = currentCellX;
    let targetCellY = currentCellY;
    
    if (keys.up) targetCellY--;
    if (keys.down) targetCellY++;
    if (keys.left) targetCellX--;
    if (keys.right) targetCellX++;
    
    // 邊界檢查
    if (targetCellX < 0) targetCellX = 0;
    if (targetCellX >= maze[0].length) targetCellX = maze[0].length - 1;
    if (targetCellY < 0) targetCellY = 0;
    if (targetCellY >= maze.length) targetCellY = maze.length - 1;
    
    // 牆壁碰撞檢查
    let canMove = true;
    if (targetCellX !== currentCellX || targetCellY !== currentCellY) {
        // 檢查目標格子是否是牆
        if (maze[targetCellY][targetCellX] === 1) {
            canMove = false;
        }
    }
    
    if (canMove) {
        // 計算目標格子的中心位置
        const targetX = targetCellX * CELL_SIZE + CELL_SIZE / 2;
        const targetY = targetCellY * CELL_SIZE + CELL_SIZE / 2;
        
        // 平滑移動到目標位置
        const dx = targetX - player.x;
        const dy = targetY - player.y;
        
        // 計算移動距離
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 如果還沒到達目標位置，繼續移動
            const moveX = dx / distance * Math.min(player.speed, distance);
            const moveY = dy / distance * Math.min(player.speed, distance);
            
            player.x += moveX;
            player.y += moveY;
        }
    }
}

// 更新障礙物位置
function updateObstacles() {
    for (let obstacle of movingObstacles) {
        // 更新位置
        obstacle.x += obstacle.dx;
        obstacle.y += obstacle.dy;
        
        // 邊界反彈
        if (obstacle.x < OBSTACLE_SIZE || obstacle.x > canvas.width - OBSTACLE_SIZE) {
            obstacle.dx = -obstacle.dx;
            obstacle.x += obstacle.dx;
        }
        
        if (obstacle.y < OBSTACLE_SIZE || obstacle.y > canvas.height - OBSTACLE_SIZE) {
            obstacle.dy = -obstacle.dy;
            obstacle.y += obstacle.dy;
        }
    }
}

// 檢查碰撞
function checkCollisions() {
    // 檢查與靜態障礙物的碰撞
    for (let obstacle of obstacles) {
        const dist = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
        if (dist < (PLAYER_SIZE + OBSTACLE_SIZE) / 2) {
            gameOver(false, '撞到障礙物！');
            return;
        }
    }
    
    // 檢查與移動障礙物的碰撞
    for (let obstacle of movingObstacles) {
        const dist = Math.hypot(player.x - obstacle.x, player.y - obstacle.y);
        if (dist < (PLAYER_SIZE + OBSTACLE_SIZE) / 2) {
            gameOver(false, '撞到移動障礙物！');
            return;
        }
    }
}

// 檢查是否到達終點
function checkGoal() {
    const dist = Math.hypot(player.x - goal.x, player.y - goal.y);
    if (dist < (PLAYER_SIZE + GOAL_SIZE) / 2) {
        levelComplete();
    }
}

// 關卡完成
function levelComplete() {
    victorySound.currentTime = 0;
    victorySound.play().catch(e => console.log('無法播放勝利音效:', e));
    
    level++;
    initLevel();
}

// 遊戲結束
function gameOver(success, message) {
    isGameRunning = false;
    clearInterval(gameInterval);
    cancelAnimationFrame(animationFrame);
    
    if (!success) {
        collisionSound.currentTime = 0;
        collisionSound.play().catch(e => console.log('無法播放碰撞音效:', e));
        bgMusic.pause();
    }
    
    // 顯示遊戲結束畫面
    gameOverTitle.textContent = success ? '恭喜過關！' : '遊戲結束';
    gameOverMessage.textContent = `${message} 你達到了第 ${level} 關，用時 ${30 - timeLeft} 秒。`;
    gameOverScreen.style.display = 'flex';
    
    // 重置按鈕狀態
    startBtn.disabled = false;
    restartBtn.disabled = false;
}

// 繪製遊戲
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製迷宮
    drawMaze();
    
    // 繪製終點
    drawGoal();
    
    // 繪製障礙物
    drawObstacles();
    
    // 繪製玩家
    drawPlayer();
}

// 繪製迷宮
function drawMaze() {
    const size = maze.length;
    
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            if (maze[y][x] === 1) {
                ctx.fillStyle = '#333';
                ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            } else {
                // 繪製格子線
                ctx.strokeStyle = '#ddd';
                ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

// 繪製玩家
function drawPlayer() {
    ctx.fillStyle = '#4CAF50';
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加眼睛，讓角色更有趣
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 3, 3, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(player.x - 5, player.y - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(player.x + 5, player.y - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // 添加笑臉
    ctx.beginPath();
    ctx.arc(player.x, player.y + 3, 5, 0, Math.PI);
    ctx.stroke();
}

// 繪製終點
function drawGoal() {
    // 閃爍效果
    const alpha = 0.5 + 0.5 * Math.sin(Date.now() / 200);
    
    ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
    ctx.beginPath();
    ctx.arc(goal.x, goal.y, GOAL_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 星形效果
    ctx.strokeStyle = '#FF5722';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
        const x = goal.x + Math.cos(angle) * (GOAL_SIZE / 2);
        const y = goal.y + Math.sin(angle) * (GOAL_SIZE / 2);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.closePath();
    ctx.stroke();
}

// 繪製障礙物
function drawObstacles() {
    // 繪製靜態障礙物
    ctx.fillStyle = '#FF5722';
    for (let obstacle of obstacles) {
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, OBSTACLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 繪製移動障礙物
    ctx.fillStyle = '#9C27B0';
    for (let obstacle of movingObstacles) {
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, OBSTACLE_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 添加動態效果
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, OBSTACLE_SIZE / 2 * 0.7, 0, Math.PI * 2);
        ctx.stroke();
    }
}

// 鍵盤控制
function handleKeyDown(e) {
    if (!isGameRunning) return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = true;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = true;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = true;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = true;
            break;
    }
    
    // 防止方向鍵滾動頁面
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            keys.up = false;
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            keys.down = false;
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            keys.left = false;
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            keys.right = false;
            break;
    }
}