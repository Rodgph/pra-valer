import React, { useState } from "react";
import { useGamesStore, Game } from "./store";
import styles from "./FavoriteGames.module.css";

const GameCard: React.FC<{ game: Game }> = ({ game }) => {
  const posterUrl = game.isSteam 
    ? `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${game.appId}/library_600x900_2x.jpg`
    : `https://api.dicebear.com/7.x/initials/svg?seed=${game.name}&backgroundColor=050505`;

  return (
    <div className={styles.gameCard}>
      <img src={posterUrl} alt={game.name} className={styles.gamePoster} />
      <div className={styles.gameTitle}>
        {game.name}
      </div>
    </div>
  );
};

const FavoriteGames: React.FC = () => {
  const { favorites, isSteamConnected, steamUser, setSteamData, disconnectSteam } = useGamesStore();
  const [showConfig, setShowConfig] = useState(false);
  const [apiKey, setApiKey] = useState(steamUser?.apiKey || "");
  const [steamId, setSteamId] = useState(steamUser?.steamId || "");

  const handleSaveConfig = async () => {
    setSteamData({
      name: "STEAM_USER",
      avatar: "", 
      steamId,
      apiKey
    });
    setShowConfig(false);
  };

  return (
    <div className={styles.container}>
      {/* HEADER */}
      <div className={styles.header}>
        <div className={styles.title}>
          STATION // FAVORITE_GAMES
        </div>

        <div className={styles.headerActions}>
          {isSteamConnected && (
            <div className={styles.connectionStatus}>
              CONNECTED: {steamUser?.steamId}
            </div>
          )}
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className={styles.configButton}
          >
            {isSteamConnected ? 'EDIT_CONFIG' : 'CONNECT_STEAM'}
          </button>
        </div>
      </div>

      {/* GRID */}
      <div className={styles.grid}>
        <div className={styles.gridContent}>
          {favorites.map(game => <GameCard key={game.appId} game={game} />)}
          <div className={styles.addGamePlaceholder}>+</div>
        </div>
      </div>

      {/* CONFIG OVERLAY */}
      {showConfig && (
        <div className={styles.overlay}>
          <div className={styles.configForm}>
            <div className={styles.configTitle}>STEAM_API_CONFIGURATION</div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>STEAM_ID_64</label>
              <input 
                value={steamId}
                onChange={(e) => setSteamId(e.target.value)}
                placeholder="76561198XXXXXXXXX"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>WEB_API_KEY</label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="YOUR_SECRET_KEY"
                className={styles.input}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button 
                onClick={handleSaveConfig}
                className={styles.saveButton}
              >
                SAVE_AND_SYNC
              </button>
              <button 
                onClick={() => setShowConfig(false)}
                className={styles.cancelButton}
              >
                CANCEL
              </button>
            </div>

            {isSteamConnected && (
              <button 
                onClick={() => { disconnectSteam(); setShowConfig(false); }}
                className={styles.removeLinkButton}
              >
                REMOVE_ACCOUNT_LINK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteGames;
