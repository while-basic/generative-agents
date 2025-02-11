import Phaser from "phaser";
import { Agent } from "generative-agents";
import AgentCharacter from "../phaserClasses/AgentCharacter";
import { agentsData } from "../data/agents";
import { locations } from "../data/world";

// declare the custom type for the window object
declare global {
  interface Window {
    scene: Phaser.Scene;
  }
}

export class MainScene extends Phaser.Scene {
  public agents: Agent[] = [];
  public characters: AgentCharacter[] = [];

  // for displaying agents on screen
  private cameraScrollSpeed = 8;
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys | null = null;

  constructor(agents: Agent[]) {
    super({ key: "MainScene" });
    this.agents = agents;
    window.scene = this; // attach the scene to the global window object
  }

  preload() {
    this.load.image("background", "./images/background.png");

    // for all agents, load their character spritesheets
    agentsData.forEach((agent) => {
      // load spritesheet
      this.load.spritesheet(agent.id, agent.sprite, {
        frameWidth: 16,
        frameHeight: 32,
      });
    });

    this.load.audio("bgm", "./bgm.mp3");
  }

  create() {
    const { width, height } = this.sys.game.config;

    // infer width and height are numbers
    if (typeof width !== "number" || typeof height !== "number") {
      throw new Error("width and height must be numbers");
    }

    const bg = this.add.image(0, 0, "background");
    bg.setOrigin(0, 0);
    this.cameras.main.setBounds(0, 0, bg.width, bg.height); // Set camera bounds to the background image size

    const text = this.add.text(10, 10, "Begin Simulation!");
    text.setFont("VT323").setFontSize(24).setFill("#fff");

    this.playBackgroundMusic();
    this.setupZoom();
    this.setupKeyboard();

    // populate plans for all agents
    this.agents.forEach((agent, index) => {
      agent.createPlan(true);
      // fill basic observations
      agent.observe(`background: ${agent.personality.background}`);
      agent.observe(`current Goal: ${agent.personality.currentGoal}`);
      agent.observe(
        `agent has following innate tendencies: ${agent.personality.innateTendency.join(
          ", "
        )}`
      );
      agent.observe(
        `agent has following learned tendencies: ${agent.personality.learnedTendency.join(
          ", "
        )}`
      );
      agent.observe(
        `agent has following values: ${agent.personality.values.join(", ")}`
      );

      const startLocation = locations.find(
        (location) => location.name === agent.location
      );
      this.addCharacter(
        agent,
        agentsData[index].sprite,
        startLocation?.x ?? 0,
        startLocation?.y ?? 0
      );
    });
  }

  update() {
    this.cameraMovement();
    this.characters.forEach((character) => character.update());
  }

  updateEmoji(emoji: string) {
    console.log("Emoji changed to: ", emoji);
  }

  private addCharacter(
    agent: Agent,
    spriteKey: string,
    x: number,
    y: number
  ): void {
    const character = new AgentCharacter(this, agent, spriteKey, x, y);
    this.add.existing(character);
    this.characters.push(character);

    // Create walking animations
    this.anims.create({
      key: `${agent.id}_walk_down`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: `${agent.id}_walk_up`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 4, end: 7 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: `${agent.id}_walk_left`,
      frames: this.anims.generateFrameNumbers(spriteKey, { start: 8, end: 11 }),
      frameRate: 8,
      repeat: -1,
    });

    this.anims.create({
      key: `${agent.id}_walk_right`,
      frames: this.anims.generateFrameNumbers(spriteKey, {
        start: 12,
        end: 15,
      }),
      frameRate: 8,
      repeat: -1,
    });

    // Initialize with down animation
    character.play(`${agent.id}_walk_down`);
  }

  private playBackgroundMusic() {
    const bgm = this.sound.add("bgm", {
      loop: true,
      volume: 0.1,
    });
    bgm.play();
  }

  /**
   * allows moving camera using arrow keys
   */
  private cameraMovement() {
    if (!this.cursors) return;

    const camera = this.cameras.main;
    
    if (this.cursors.up.isDown) {
      camera.scrollY -= this.cameraScrollSpeed;
    }
    if (this.cursors.down.isDown) {
      camera.scrollY += this.cameraScrollSpeed;
    }
    if (this.cursors.left.isDown) {
      camera.scrollX -= this.cameraScrollSpeed;
    }
    if (this.cursors.right.isDown) {
      camera.scrollX += this.cameraScrollSpeed;
    }
  }

  /**
   * Setup the zoom functionality using mouse scroll
   */
  private setupZoom() {
    this.input.on(
      "wheel",
      (
        _pointer: Phaser.Input.Pointer,
        _gameObjects: Phaser.GameObjects.GameObject[],
        _deltaX: number,
        deltaY: number
        // _deltaZ: number
      ) => {
        if (deltaY > 0) {
          this.cameras.main.zoom *= 0.9; // Zoom out
        } else if (deltaY < 0) {
          this.cameras.main.zoom *= 1.1; // Zoom in
        }

        // Cap the zoom level within a range
        this.cameras.main.zoom = Phaser.Math.Clamp(
          this.cameras.main.zoom,
          0.4,
          2
        );
      }
    );
  }

  private setupKeyboard() {
    this.cursors = this.input.keyboard?.createCursorKeys() || null;
  }
}
