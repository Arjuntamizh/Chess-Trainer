// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getDatabase, ref, onValue, set, push } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAI1oPe7OL78JQtFjscD5y_Wdp5NqoB-J0",
    authDomain: "iq4u-chess-b2835.firebaseapp.com",
    databaseURL: "https://iq4u-chess-b2835-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iq4u-chess-b2835",
    storageBucket: "iq4u-chess-b2835.firebasestorage.app",
    messagingSenderId: "1029237519163",
    appId: "1:1029237519163:web:2b060008c0f11bfe5a3d1e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// Piece theme list
const PieceList = [
    { Name: 'Alpha', DirectoryName: 'alpha', Type: 'svg' },
    { Name: 'Cburnett', DirectoryName: 'cburnett', Type: 'svg' },
    { Name: 'Chessnut', DirectoryName: 'chessnut', Type: 'svg' },
    { Name: 'Merida', DirectoryName: 'merida', Type: 'svg' },
    { Name: 'Staunty', DirectoryName: 'staunty', Type: 'svg' },
    { Name: 'Tatiana', DirectoryName: 'tatiana', Type: 'svg' }
];

// Default piece theme (Cburnett)
const defaultPieceTheme = { Name: 'Cburnett', DirectoryName: 'cburnett', Type: 'svg' };

// Global variables
window.auth = auth;
window.database = database;
window.currentUser = null;
window.gameState = {
    currentMove: 1,
    currentTurn: 'white',
    position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    moveHistory: [],
    accuracy: 0,
    progress: 0,
    currentPuzzle: 1,
    totalPuzzles: 15,
    pieceTheme: defaultPieceTheme
};

// Initialize Chessground and Chess.js
let chessground = null;
let chess = null;

// Import Chess from the chess.js file
async function loadChess() {
    try {
        const chessModule = await import('./chess.js');
        return chessModule.Chess || chessModule.default;
    } catch (error) {
        console.error('Failed to load chess.js:', error);
        return null;
    }
}

// Initialize without authentication check
window.currentUser = { email: 'student@iq4u.com', uid: 'student-' + Date.now() };
document.getElementById('userEmail').textContent = window.currentUser.email;
initializeGame();

// Initialize game
async function initializeGame() {
    try {
        // Initialize chess.js engine
        const ChessClass = await loadChess();
        if (ChessClass) {
            chess = new ChessClass();
            console.log('Chess.js loaded successfully');
        }

        // Initialize chessboard with chessground
        await loadChessground();
        setupChessboard();
        setupFirebaseListeners();
        startSessionTimer();
        updateConnectionStatus(true);
    } catch (error) {
        console.error('Failed to initialize game:', error);
        setupFallbackBoard();
        setupFirebaseListeners();
        startSessionTimer();
        updateConnectionStatus(false);
    }
}

// Load chessground dynamically with fallback
function loadChessground() {
    return new Promise((resolve, reject) => {
        // Try to load chessground
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/chessground@9.2.1/dist/chessground.min.js';
        script.onload = () => {
            if (window.Chessground) {
                resolve();
            } else {
                reject(new Error('Chessground not available'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load chessground'));
        document.head.appendChild(script);
    });
}

// Setup chessboard with chessground
function setupChessboard() {
    const boardElement = document.getElementById('chessboard');
    
    try {
        chessground = window.Chessground(boardElement, {
            fen: window.gameState.position,
            orientation: 'white',
            turnColor: 'white',
            check: false,
            coordinates: true,
            addPieceZIndex: false,
            blockTouchScroll: false,
            pieceKey: true,
            highlight: {
                lastMove: true,
                check: true
            },
            animation: {
                enabled: true,
                duration: 200
            },
            movable: {
                free: false,
                color: 'white',
                dests: getLegalMoves(),
                showDests: true,
                events: {
                    after: onMove
                }
            },
            draggable: {
                enabled: true,
                showGhost: true
            },
            selectable: {
                enabled: true
            },
            events: {
                select: onSquareSelect
            },
            premovable: {
                enabled: false
            },
            predroppable: {
                enabled: false
            },
            drawable: {
                enabled: true,
                visible: true,
                defaultSnapToValidMove: true
            }
        });

        // Apply Cburnett piece theme
        applyPieceTheme(window.gameState.pieceTheme);
        updateBoard();
    } catch (error) {
        console.error('Error setting up chessground:', error);
        setupFallbackBoard();
    }
}

// Apply piece theme to chessground
function applyPieceTheme(theme) {
    if (!chessground) return;
    
    const pieceBaseUrl = `https://unpkg.com/chessground@7.11.0/assets/pieces/${theme.DirectoryName}/`;
    
    // Remove old style if it exists
    const oldStyle = document.getElementById('piece-theme-style');
    if (oldStyle) oldStyle.remove();
    
    // Create new style
    const style = document.createElement('style');
    style.id = 'piece-theme-style';
    style.textContent = `
        .cg-wrap piece.pawn.white { background-image: url("${pieceBaseUrl}wp.svg") !important; }
        .cg-wrap piece.knight.white { background-image: url("${pieceBaseUrl}wn.svg") !important; }
        .cg-wrap piece.bishop.white { background-image: url("${pieceBaseUrl}wb.svg") !important; }
        .cg-wrap piece.rook.white { background-image: url("${pieceBaseUrl}wr.svg") !important; }
        .cg-wrap piece.queen.white { background-image: url("${pieceBaseUrl}wq.svg") !important; }
        .cg-wrap piece.king.white { background-image: url("${pieceBaseUrl}wk.svg") !important; }
        
        .cg-wrap piece.pawn.black { background-image: url("${pieceBaseUrl}bp.svg") !important; }
        .cg-wrap piece.knight.black { background-image: url("${pieceBaseUrl}bn.svg") !important; }
        .cg-wrap piece.bishop.black { background-image: url("${pieceBaseUrl}bb.svg") !important; }
        .cg-wrap piece.rook.black { background-image: url("${pieceBaseUrl}br.svg") !important; }
        .cg-wrap piece.queen.black { background-image: url("${pieceBaseUrl}bq.svg") !important; }
        .cg-wrap piece.king.black { background-image: url("${pieceBaseUrl}bk.svg") !important; }
    `;
    document.head.appendChild(style);
    
    // Force the board to redraw with new pieces
    chessground.redrawAll();
}

// Fallback simple chess board
function setupFallbackBoard() {
    const boardElement = document.getElementById('chessboard');
    boardElement.innerHTML = `
        <div style="
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            grid-template-rows: repeat(8, 1fr);
            border: 3px solid #8B4513;
            background: #F5DEB3;
            aspect-ratio: 1;
        ">
            ${generateSimpleBoard()}
        </div>
    `;
}

// Generate simple HTML chess board
function generateSimpleBoard() {
    const pieces = {
        'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
        'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
    };
    
    const startPosition = [
        ['r','n','b','q','k','b','n','r'],
        ['p','p','p','p','p','p','p','p'],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        [' ',' ',' ',' ',' ',' ',' ',' '],
        ['P','P','P','P','P','P','P','P'],
        ['R','N','B','Q','K','B','N','R']
    ];

    let boardHTML = '';
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const isLight = (row + col) % 2 === 0;
            const piece = startPosition[row][col];
            const pieceDisplay = piece === ' ' ? '' : pieces[piece] || '';
            
            boardHTML += `
                <div style="
                    background: ${isLight ? '#F0D9B5' : '#B58863'};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    cursor: pointer;
                    user-select: none;
                " onclick="handleSquareClick('${String.fromCharCode(97 + col)}${8 - row}')">
                    ${pieceDisplay}
                </div>
            `;
        }
    }
    return boardHTML;
}

// Handle square clicks for fallback board
window.handleSquareClick = function(square) {
    console.log('Square clicked:', square);
};

// Setup Firebase listeners
function setupFirebaseListeners() {
    const gameRef = ref(database, 'games/default');
    
    onValue(gameRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            window.gameState = { ...window.gameState, ...data };
            updateGameDisplay();
            updateBoard();
            updateConnectionStatus(true);
        }
    }, (error) => {
        console.error('Firebase connection error:', error);
        updateConnectionStatus(false);
    });
}

// Get legal moves for chessground
function getLegalMoves() {
    const dests = new Map();
    if (!chess) return dests;

    const moves = chess.moves({ verbose: true });
    moves.forEach(move => {
        const from = move.from;
        if (!dests.has(from)) {
            dests.set(from, []);
        }
        dests.get(from).push(move.to);
    });
    
    return dests;
}

// Handle chess moves with validation
function onMove(orig, dest, metadata) {
    if (!chess) {
        console.error('Chess engine not available');
        return;
    }

    // Attempt to make the move
    const move = chess.move({ from: orig, to: dest, promotion: 'q' });
    
    if (move) {
        // Valid move - update game state and send to Firebase
        window.gameState.position = chess.fen();
        window.gameState.moveHistory.push(move.san); // Standard algebraic notation
        window.gameState.currentMove = Math.ceil(chess.history().length / 2);
        window.gameState.currentTurn = chess.turn() === 'w' ? 'white' : 'black';
        
        sendMoveToFirebase(move);
        updateGameDisplay();
        updateBoard();
        
        // Check for game over
        if (chess.isGameOver()) {
            handleGameOver();
        }
    } else {
        // Invalid move - reset board position
        console.log('Invalid move attempted:', orig, 'to', dest);
        updateBoard();
    }
}

// Handle square selection
function onSquareSelect(square) {
    console.log('Selected square:', square);
}

// Send move to Firebase
function sendMoveToFirebase(move) {
    const gameRef = ref(database, 'games/default');
    const newMoveHistory = [...window.gameState.moveHistory, `${move.from}-${move.to}`];
    
    const updatedState = {
        ...window.gameState,
        moveHistory: newMoveHistory,
        currentMove: Math.floor(newMoveHistory.length / 2) + 1,
        currentTurn: window.gameState.currentTurn === 'white' ? 'black' : 'white'
    };

    set(gameRef, updatedState).catch(error => {
        console.error('Error sending move:', error);
    });
}

// Update board display
function updateBoard() {
    if (chessground) {
        chessground.set({
            fen: window.gameState.position,
            turnColor: window.gameState.currentTurn === 'white' ? 'white' : 'black',
            movable: {
                color: window.gameState.currentTurn === 'white' ? 'white' : 'black',
                dests: getLegalMoves()
            },
            check: chess ? chess.inCheck() : false
        });
    }
}

// Update game display
function updateGameDisplay() {
    document.getElementById('currentMove').textContent = window.gameState.currentMove;
    document.getElementById('currentTurn').textContent = window.gameState.currentTurn.charAt(0).toUpperCase() + window.gameState.currentTurn.slice(1);
    document.getElementById('currentPuzzle').textContent = window.gameState.currentPuzzle;
    document.getElementById('totalPuzzles').textContent = window.gameState.totalPuzzles;
    document.getElementById('accuracy').textContent = window.gameState.accuracy;
    document.getElementById('progressPercent').textContent = window.gameState.progress;
    document.getElementById('progressBar').style.width = window.gameState.progress + '%';

    updateMoveHistory();
}

// Handle game over conditions
function handleGameOver() {
    if (!chess) return;
    
    let gameResult = '';
    if (chess.isCheckmate()) {
        gameResult = chess.turn() === 'w' ? 'Black wins by checkmate!' : 'White wins by checkmate!';
    } else if (chess.isDraw()) {
        if (chess.isStalemate()) {
            gameResult = 'Game drawn by stalemate';
        } else if (chess.isThreefoldRepetition()) {
            gameResult = 'Game drawn by threefold repetition';
        } else if (chess.isInsufficientMaterial()) {
            gameResult = 'Game drawn by insufficient material';
        } else {
            gameResult = 'Game drawn by 50-move rule';
        }
    }
    
    if (gameResult) {
        setTimeout(() => {
            alert(gameResult);
        }, 500);
    }
}

// Update move history with proper chess notation
function updateMoveHistory() {
    const historyDiv = document.getElementById('moveHistory');
    
    if (window.gameState.moveHistory.length === 0) {
        historyDiv.innerHTML = '<p class="text-muted text-center">No moves yet</p>';
        return;
    }

    let historyHTML = '';
    for (let i = 0; i < window.gameState.moveHistory.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1;
        const whiteMove = window.gameState.moveHistory[i];
        const blackMove = window.gameState.moveHistory[i + 1] || '';
        
        historyHTML += `
            <div class="move-item">
                <span class="text-muted">${moveNumber}.</span>
                <span class="text-dark">${whiteMove}</span>
                ${blackMove ? `<span class="text-dark">${blackMove}</span>` : ''}
            </div>
        `;
    }
    
    historyDiv.innerHTML = historyHTML;
    historyDiv.scrollTop = historyDiv.scrollHeight;
}

// Update connection status
function updateConnectionStatus(connected) {
    const connectionDot = document.getElementById('connectionDot');
    const connectionText = document.getElementById('connectionText');
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');

    if (connected) {
        connectionDot.className = 'connection-dot connected';
        connectionText.textContent = 'Connected';
        statusDot.className = 'connection-dot connected';
        statusText.textContent = 'Synced with instructor';
    } else {
        connectionDot.className = 'connection-dot disconnected';
        connectionText.textContent = 'Offline';
        statusDot.className = 'connection-dot disconnected';
        statusText.textContent = 'Connection lost';
    }
}

// Session timer
let sessionSeconds = 0;
function startSessionTimer() {
    setInterval(() => {
        sessionSeconds++;
        const minutes = Math.floor(sessionSeconds / 60);
        const seconds = sessionSeconds % 60;
        document.getElementById('sessionTime').textContent = 
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// Global functions for buttons
window.logout = function() {
    // Simple logout - just reload the page or redirect
    alert('Logged out successfully');
    window.location.reload();
};

window.requestHint = function() {
    const hintsRef = ref(database, 'hints/default');
    push(hintsRef, {
        timestamp: Date.now(),
        studentId: window.currentUser.uid,
        requested: true
    }).catch(error => {
        console.error('Error requesting hint:', error);
    });
};

window.pauseGame = function() {
    // Implement pause functionality
    console.log('Game paused');
};

window.resetPosition = function() {
    // Reset chess.js engine
    if (chess) {
        chess.reset();
    }
    
    const gameRef = ref(database, 'games/default');
    const resetState = {
        ...window.gameState,
        position: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moveHistory: [],
        currentMove: 1,
        currentTurn: 'white'
    };

    window.gameState = resetState;
    updateGameDisplay();
    updateBoard();

    set(gameRef, resetState).catch(error => {
        console.error('Error resetting position:', error);
    });
};

// Voice chat functionality
let inCall = false;
let isMuted = false;

window.toggleCall = function() {
    const joinCallBtn = document.getElementById('joinCallBtn');
    const muteBtn = document.getElementById('muteBtn');
    
    inCall = !inCall;
    
    if (inCall) {
        joinCallBtn.innerHTML = '<i class="bi bi-telephone-x"></i> Leave Call';
        joinCallBtn.classList.add('active');
        muteBtn.disabled = false;
    } else {
        joinCallBtn.innerHTML = '<i class="bi bi-telephone"></i> Join Call';
        joinCallBtn.classList.remove('active');
        muteBtn.disabled = true;
        isMuted = false;
        muteBtn.classList.remove('muted');
        muteBtn.innerHTML = '<i class="bi bi-mic"></i> Mute';
    }
};

window.toggleMute = function() {
    if (!inCall) return;
    
    const muteBtn = document.getElementById('muteBtn');
    isMuted = !isMuted;
    
    if (isMuted) {
        muteBtn.innerHTML = '<i class="bi bi-mic-mute"></i> Unmute';
        muteBtn.classList.add('muted');
    } else {
        muteBtn.innerHTML = '<i class="bi bi-mic"></i> Mute';
        muteBtn.classList.remove('muted');
    }
};

// Change piece theme
window.changePieceTheme = function(themeDirectory) {
    const selectedTheme = PieceList.find(theme => theme.DirectoryName === themeDirectory);
    if (selectedTheme) {
        window.gameState.pieceTheme = selectedTheme;
        applyPieceTheme(selectedTheme);
        
        // Save to Firebase
        const gameRef = ref(database, 'games/default');
        set(gameRef, window.gameState).catch(error => {
            console.error('Error saving theme:', error);
        });
    }
};
