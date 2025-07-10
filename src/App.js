import React, { useState, useEffect } from 'react';
// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// --- Secure Firebase Configuration ---
// The configuration is now loaded from environment variables.
// For local development, these are in `.env.development`.
// For GitHub Actions deployment, these are set as Repository Secrets.
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// --- Firebase Initialization (run once) ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- React Components ---

const PlayerChip = ({ name, onRemove }) => (
    <div className="bg-purple-500 text-white px-4 py-2 rounded-full flex items-center shadow-md animate-pop-in">
      <span className="font-semibold">{name}</span>
      <button onClick={onRemove} className="ml-3 text-purple-200 hover:text-white font-bold text-lg">&times;</button>
    </div>
);

const UpgradeModal = ({ onClose, onUpgrade }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="w-full max-w-md mx-auto rounded-3xl p-8 shadow-2xl text-center text-white bg-gradient-to-br from-yellow-500 to-orange-600 border border-yellow-300/50">
            <h2 className="text-3xl font-bold mb-4">Unlock All Levels!</h2>
            <p className="text-yellow-100 mb-6">You've reached a premium level. Upgrade now to unlock all Medium and Hard questions for endless fun!</p>
            <button onClick={onUpgrade} className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg mb-3">Upgrade to Premium ✨</button>
            <button onClick={onClose} className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-2 rounded-xl">Maybe Later</button>
        </div>
    </div>
);


const SettingsModal = ({ settings, onUpdateSettings, onUpgrade, onClose }) => {
    const [page, setPage] = useState('main'); 
    const handleRoundsChange = (e) => { const value = parseInt(e.target.value, 10); if (value > 0) { onUpdateSettings({ ...settings, roundsPerLevel: value }); } };
    const handleLanguageChange = (e) => { onUpdateSettings({ ...settings, language: e.target.value }); };
    
    const renderContent = () => {
        switch(page) {
            case 'terms': return ( <div><h3 className="text-2xl font-bold mb-4">Terms of Use</h3><p className="text-sm text-gray-300 mb-4">Placeholder text for Terms of Use...</p><button onClick={() => setPage('main')} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 rounded-lg">Back</button></div> );
            case 'privacy': return ( <div><h3 className="text-2xl font-bold mb-4">Privacy Policy</h3><p className="text-sm text-gray-300 mb-4">Placeholder text for Privacy Policy...</p><button onClick={() => setPage('main')} className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 rounded-lg">Back</button></div> );
            default:
                return (
                    <>
                        <div className="mb-6">
                            <label className="block text-lg font-semibold mb-2" htmlFor="roundsPerLevel">Rounds Per Level</label>
                            <input type="number" id="roundsPerLevel" value={settings.roundsPerLevel} onChange={handleRoundsChange} className="w-full p-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400" />
                        </div>
                        <div className="mb-6">
                            <label className="block text-lg font-semibold mb-2" htmlFor="language">Language</label>
                            <select id="language" value={settings.language} onChange={handleLanguageChange} className="w-full p-2 rounded-lg bg-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-400">
                                <option value="en" className="text-black">English</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-1 gap-3 text-center">
                            <button onClick={onUpgrade} className="w-full bg-yellow-500/80 hover:bg-yellow-500/100 text-white font-bold py-3 rounded-lg">Be Premium ✨</button>
                            <button onClick={() => setPage('terms')} className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-lg">Terms of Use</button>
                            <button onClick={() => setPage('privacy')} className="w-full bg-white/20 hover:bg-white/30 text-white font-bold py-3 rounded-lg">Privacy Policy</button>
                        </div>
                    </>
                );
        }
    }

    return ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"> <div className="w-full max-w-md mx-auto rounded-3xl p-8 shadow-2xl text-white bg-gradient-to-br from-gray-800 to-gray-900 border border-purple-500/50"> <div className="flex justify-between items-center mb-6"> <h2 className="text-3xl font-bold">Settings</h2> <button onClick={onClose} className="text-3xl font-bold text-gray-400 hover:text-white">&times;</button> </div> {renderContent()} </div> </div> );
};

const PlayerSetup = ({ onStartGame, onOpenSettings, isDataLoading, categories, availableItems }) => {
    const [step, setStep] = useState(1);
    const [players, setPlayers] = useState([]);
    const [playerName, setPlayerName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());

    const addPlayer = () => { if (playerName.trim() && !players.includes(playerName.trim())) { setPlayers([...players, playerName.trim()]); setPlayerName(''); } };
    const handleKeyPress = (e) => { if (e.key === 'Enter') addPlayer(); };
    const removePlayer = (index) => { setPlayers(players.filter((_, i) => i !== index)); };
    const toggleItem = (item) => { setSelectedItems(prev => { const newItems = new Set(prev); if (newItems.has(item)) newItems.delete(item); else newItems.add(item); return newItems; }); };

    if (isDataLoading) {
        return (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex flex-col items-center justify-center p-4 text-white">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-4 text-xl">Loading Game Data...</p>
            </div>
        );
    }

    const renderStep = () => {
    switch (step) {
      case 1: return ( <> <p className="text-indigo-200 mb-8">Step 1: Add Players</p> <div className="flex mb-6"> <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter player name" className="flex-grow p-4 rounded-l-xl bg-white/20 text-white placeholder-indigo-200 focus:outline-none focus:ring-4 focus:ring-purple-400 transition-all" /> <button onClick={addPlayer} className="bg-purple-500 hover:bg-purple-400 text-white font-bold p-4 rounded-r-xl transition-colors shadow-lg">ADD</button> </div> <div className="flex flex-wrap gap-3 justify-center mb-8 min-h-[50px]"> {players.map((p, i) => <PlayerChip key={i} name={p} onRemove={() => removePlayer(i)} />)} </div> <button onClick={() => setStep(2)} disabled={players.length < 2} className="w-full bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all">Next: Choose Category</button> </> );
      case 2: return ( <> <p className="text-indigo-200 mb-4">Step 2: Choose a Category</p> <div className="grid grid-cols-2 gap-4 mb-8"> {categories.map(cat => ( <button key={cat} onClick={() => setSelectedCategory(cat)} className={`p-4 rounded-xl font-bold uppercase tracking-wider transition-all duration-200 shadow-lg ${selectedCategory === cat ? 'bg-green-500 scale-105 ring-4 ring-white/50' : 'bg-white/20 hover:bg-white/30'}`}> {cat} </button> ))} </div> <div className="flex gap-4"> <button onClick={() => setStep(1)} className="w-1/2 bg-gray-500 hover:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all">Back</button> <button onClick={() => setStep(3)} disabled={!selectedCategory} className="w-1/2 bg-blue-500 hover:bg-blue-400 disabled:bg-gray-500 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all">Next: Select Items</button> </div> </> );
      case 3: return ( <> <p className="text-indigo-200 mb-4">Step 3: What items do you have?</p> <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-6 text-sm max-h-60 overflow-y-auto p-2 bg-black/10 rounded-lg"> {availableItems.map(item => ( <button key={item} onClick={() => toggleItem(item)} className={`p-2 rounded-lg font-semibold capitalize transition-all duration-200 shadow-md ${selectedItems.has(item) ? 'bg-green-500 ring-2 ring-white/50' : 'bg-white/20 hover:bg-white/30'}`}> {item} </button>))} </div> <div className="flex gap-4"> <button onClick={() => setStep(2)} className="w-1/2 bg-gray-500 hover:bg-gray-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-all">Back</button> <button onClick={() => onStartGame(players, selectedCategory, Array.from(selectedItems))} className="w-1/2 bg-green-500 hover:bg-green-400 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform transform hover:scale-105">Start Game</button> </div> </> );
      default: return null;
    }
  };


    return ( <div className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-800 flex flex-col items-center justify-center p-4 text-white"> <button onClick={onOpenSettings} className="absolute top-4 right-4 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition-colors"> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> </button> <div className="w-full max-w-md mx-auto bg-white/20 backdrop-blur-lg rounded-3xl p-8 shadow-2xl text-center"> <h1 className="text-5xl font-bold mb-2 tracking-tighter">Truth or Dare</h1> {renderStep()} </div> </div> );
};

const QuestionModal = ({ type, question, onComplete }) => ( <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"> <div className={`w-full max-w-md mx-auto rounded-3xl p-8 shadow-2xl text-center text-white transform animate-slide-up bg-gradient-to-br ${type === 'truth' ? 'from-blue-500 to-cyan-400' : 'from-red-500 to-orange-400'}`}> <h2 className="text-2xl font-bold uppercase tracking-widest mb-4">{type}</h2> <p className="text-3xl font-medium mb-10 min-h-[100px] flex items-center justify-center">{question}</p> <button onClick={onComplete} className="w-full bg-white/30 hover:bg-white/40 text-white font-bold py-4 rounded-xl text-xl shadow-lg transition-transform transform hover:scale-105">Done! Next Turn</button> </div> </div> );

const GameScreen = ({ players, category, items, settings, onReset, gameData, isPremium, onOpenUpgradeModal }) => {
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [modalData, setModalData] = useState(null);
    const [spin, setSpin] = useState(false);
    const [roundCount, setRoundCount] = useState(1);
    const [level, setLevel] = useState('easy');
    const { roundsPerLevel } = settings;

    useEffect(() => {
        if (roundCount > roundsPerLevel * 2) setLevel('hard');
        else if (roundCount > roundsPerLevel) setLevel('medium');
        else setLevel('easy');
    }, [roundCount, roundsPerLevel]);

    const currentPlayer = players[currentPlayerIndex];

    const selectOption = (type) => {
        if (level !== 'easy' && !isPremium) {
            onOpenUpgradeModal();
            return;
        }

        let question;
        if (type === 'truth') {
            const list = gameData[category].truth[level] || gameData[category].truth['easy'];
            question = list[Math.floor(Math.random() * list.length)];
        } else {
            const allDares = gameData[category].dare[level] || gameData[category].dare['easy'];
            const possibleDares = allDares.filter(dare => dare.requires.every(item => items.includes(item)));
            const noItemDares = allDares.filter(dare => dare.requires.length === 0);
            let chosenDare = (possibleDares.length > 0) ? possibleDares[Math.floor(Math.random() * possibleDares.length)] : noItemDares[Math.floor(Math.random() * noItemDares.length)];
            question = chosenDare.text;
        }
        setModalData({ type, question });
    };

    const handleNextTurn = () => { setModalData(null); setSpin(true); setTimeout(() => { setCurrentPlayerIndex((prevIndex) => (prevIndex + 1) % players.length); if (currentPlayerIndex === players.length - 1) { setRoundCount(prevRound => prevRound + 1); } setSpin(false); }, 500); };
    const getLevelProgress = () => { if (level === 'easy') return ((roundCount - 1) % roundsPerLevel) * (100 / roundsPerLevel); if (level === 'medium') return ((roundCount - (roundsPerLevel + 1)) % roundsPerLevel) * (100 / roundsPerLevel); if (level === 'hard') return 100; return 0; };
    const getNextLevelRounds = () => { if (level === 'easy') return (roundsPerLevel + 1) - roundCount; if (level === 'medium') return (roundsPerLevel * 2 + 1) - roundCount; return 0; };
    
    return ( <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-between p-4 text-white"> {modalData && <QuestionModal {...modalData} onComplete={handleNextTurn} />} <button onClick={onReset} className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 rounded-full p-3 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v6h6"/><path d="M21 12A9 9 0 0 0 6 5.3L3 8"/><path d="M21 22v-6h-6"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/></svg></button> <div className="text-center pt-20"> <p className="text-2xl text-gray-400 mb-2">It's your turn,</p> <h1 className={`text-6xl font-bold tracking-tighter transition-transform duration-500 ease-in-out ${spin ? 'transform -rotate-12 scale-75 opacity-0' : 'transform rotate-0 scale-100 opacity-100'}`}>{currentPlayer}</h1> </div> <div className="w-full max-w-md mx-auto"> <div className="flex gap-4 mb-8"> <button onClick={() => selectOption('truth')} className="w-1/2 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-bold py-16 rounded-2xl text-3xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-blue-400/50">TRUTH</button> <button onClick={() => selectOption('dare')} className="w-1/2 bg-gradient-to-r from-red-500 to-orange-400 text-white font-bold py-16 rounded-2xl text-3xl shadow-lg transition-transform transform hover:scale-105 hover:shadow-red-400/50">DARE</button> </div> <div className="bg-black/20 p-4 rounded-xl text-center"> <div className="flex justify-between items-center mb-2 text-lg"> <span className="font-bold uppercase text-cyan-300">Level: {level}</span> <span className="font-bold uppercase text-orange-300">Round: {roundCount}</span> </div> <div className="w-full bg-gray-600 rounded-full h-2.5"><div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-2.5 rounded-full" style={{width: `${getLevelProgress()}%`}}></div></div> {level !== 'hard' && <p className="text-xs text-gray-400 mt-2">Next level in {getNextLevelRounds()} rounds</p>} </div> </div> <div className="text-center pb-4"><p className="text-gray-500">Up next: {players[(currentPlayerIndex + 1) % players.length]}</p></div> </div> );
};


// --- Main App Component ---

export default function App() {
  const [gameState, setGameState] = useState('setup');
  const [players, setPlayers] = useState([]);
  const [category, setCategory] = useState(null);
  const [items, setItems] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState({ roundsPerLevel: 10, language: 'en' });
  
  const [gameData, setGameData] = useState({});
  const [categories, setCategories] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Using component state for premium status. For a real app, you'd verify this with a backend.
  const [isPremium, setIsPremium] = useState(false); 
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  useEffect(() => {
    const initializeAndFetch = async () => {
      try {
        await signInAnonymously(auth);
        
        // Fetch Categories and Questions
        const contentSnapshot = await getDocs(collection(db, "game_content"));
        const fetchedData = {};
        const fetchedCategories = [];
        contentSnapshot.forEach((doc) => {
            fetchedData[doc.id] = doc.data();
            fetchedCategories.push(doc.id);
        });
        setGameData(fetchedData);
        setCategories(fetchedCategories);

        // Fetch Available Items
        const itemsDocRef = doc(db, "game_config", "items");
        const itemsDocSnap = await getDoc(itemsDocRef);
        if (itemsDocSnap.exists()) {
            setAvailableItems(itemsDocSnap.data().list || []);
        } else {
            console.warn("Items document not found in game_config collection!");
        }
        
      } catch (error) {
        console.error("Error during initialization or fetch:", error);
        // You could add user-facing error UI here
      } finally {
        setIsDataLoading(false);
      }
    };

    initializeAndFetch();
  }, []);


  const handleStartGame = (playerList, selectedCategory, selectedItems) => {
    if (playerList.length >= 2 && selectedCategory) {
      setPlayers(playerList);
      setCategory(selectedCategory);
      setItems(selectedItems);
      setGameState('playing');
    }
  };

  const handleReset = () => {
    setPlayers([]);
    setCategory(null);
    setItems([]);
    setGameState('setup');
  };

  const handleUpgrade = () => {
      setIsPremium(true);
      setIsUpgradeModalOpen(false);
  };

  return (
    <div className="h-screen w-screen bg-gray-900 font-sans">
      {isSettingsOpen && <SettingsModal settings={settings} onUpdateSettings={setSettings} onUpgrade={handleUpgrade} onClose={() => setIsSettingsOpen(false)} />}
      {isUpgradeModalOpen && <UpgradeModal onClose={() => setIsUpgradeModalOpen(false)} onUpgrade={handleUpgrade} />}
      
      {gameState === 'setup' && <PlayerSetup onStartGame={handleStartGame} onOpenSettings={() => setIsSettingsOpen(true)} isDataLoading={isDataLoading} categories={categories} availableItems={availableItems}/>}
      {gameState === 'playing' && <GameScreen players={players} category={category} items={items} settings={settings} onReset={handleReset} gameData={gameData} isPremium={isPremium} onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)} />}
    </div>
  );
}
