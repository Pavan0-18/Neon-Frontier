import { GameEngine } from './game/engine/GameEngine';
import { createPhaserGame, DefenseScene } from './game/rendering/PhaserGame';
import { UIManager } from './ui/UIManager';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize simulation engine
  const engine = new GameEngine();

  // 2. Initialize Phaser Game Scene
  const game = createPhaserGame(engine, 'game-container');

  // 3. Connect UI once scene is ready
  const checkSceneReady = () => {
    const scene = game.scene.getScene('DefenseScene') as DefenseScene;
    if (scene && scene.sys && scene.sys.settings.active) {
      const uiManager = new UIManager(engine, scene);
      scene.uiManager = uiManager;

      (window as unknown as { gameEngine: GameEngine; defenseScene: DefenseScene; uiManager: UIManager }).gameEngine = engine;
      (window as unknown as { gameEngine: GameEngine; defenseScene: DefenseScene; uiManager: UIManager }).defenseScene = scene;
      (window as unknown as { gameEngine: GameEngine; defenseScene: DefenseScene; uiManager: UIManager }).uiManager = uiManager;

      console.log('⚡ NEON FRONTIER: LAST ORBIT initialized successfully.');
    } else {
      setTimeout(checkSceneReady, 50);
    }
  };

  setTimeout(checkSceneReady, 100);
});
