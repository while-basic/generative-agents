import Phaser from "phaser";
import BubbleText from "./BubbleText";
import { Agent, AgentEvents } from "generative-agents";
import { interactionService } from "../services/interactionService";
import { locations } from "../data/world";

export default class AgentCharacter extends Phaser.GameObjects.Sprite {
  private agent: Agent;

  private bubbleText: BubbleText;

  // target coordinates for the agent to move to
  private targetX = 0;
  private targetY = 0;

  private visualRange: Phaser.GameObjects.Graphics;

  private interactionCooldown = 0;
  private lastInteractionTime = 0;
  private minInteractionInterval = 10000; // 10 seconds between interactions
  private speechBubbleDuration = 10000; // 10 seconds for speech bubbles
  private speechBubble: Phaser.GameObjects.Container | null = null;

  constructor(
    scene: Phaser.Scene,
    agent: Agent,
    sprite: string,
    x: number,
    y: number
  ) {
    super(scene, x, y, sprite);
    this.agent = agent;
    scene.add.existing(this);

    // add event listeners for agent event
    this.agent.on(AgentEvents.TASK_FINISHED, this.updateAgentLocation);

    this.createAnimations();
    this.bubbleText = new BubbleText(
      scene,
      x,
      y - 20,
      `${this.getAgentInitials()}: 👀`
    );

    // Draw a red circle around the agent representing their visual range
    const visualRange = new Phaser.GameObjects.Graphics(scene);
    visualRange.lineStyle(2, 0xff0000, 0.5);
    visualRange.strokeCircle(0, 0, 100);
    scene.add.existing(visualRange);
    this.visualRange = visualRange;

    // Initialize speech bubble (hidden by default)
    this.createSpeechBubble();
  }

  createAnimations() {
    const anims = this.scene.anims;

    anims.create({
      key: `${this.agent.id}_idle`,
      frames: anims.generateFrameNumbers(this.agent.id, { start: 75, end: 80 }),
      frameRate: 6,
      repeat: -1,
    });

    anims.create({
      key: `${this.agent.id}_walk_down`,
      frames: anims.generateFrameNumbers(this.agent.id, {
        start: 132,
        end: 137,
      }),
      frameRate: 6,
      repeat: -1,
    });

    anims.create({
      key: `${this.agent.id}_walk_up`,
      frames: anims.generateFrameNumbers(this.agent.id, {
        start: 122,
        end: 127,
      }),
      frameRate: 6,
      repeat: -1,
    });

    anims.create({
      key: `${this.agent.id}_walk_left`,
      frames: anims.generateFrameNumbers(this.agent.id, {
        start: 127,
        end: 132,
      }),
      frameRate: 6,
      repeat: -1,
    });

    anims.create({
      key: `${this.agent.id}_walk_right`,
      frames: anims.generateFrameNumbers(this.agent.id, {
        start: 116,
        end: 121,
      }),
      frameRate: 6,
      repeat: -1,
    });
  }

  private createSpeechBubble() {
    const bubble = this.scene.add.graphics();
    const text = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      color: '#000000',
      align: 'center',
      wordWrap: { width: 150 }
    });

    this.speechBubble = this.scene.add.container(this.x, this.y - 50, [bubble, text]);
    this.speechBubble.setVisible(false);
  }

  public showSpeechBubble(content: string, duration: number = 5000) {
    if (!this.speechBubble) return;

    const text = this.speechBubble.getAt(1) as Phaser.GameObjects.Text;
    text.setText(content);

    const padding = 10;
    const bubble = this.speechBubble.getAt(0) as Phaser.GameObjects.Graphics;
    bubble.clear();
    bubble.lineStyle(2, 0x000000, 1);
    bubble.fillStyle(0xffffff, 1);

    const bounds = text.getBounds();
    bubble.fillRoundedRect(
      -padding,
      -padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
      8
    );
    bubble.strokeRoundedRect(
      -padding,
      -padding,
      bounds.width + padding * 2,
      bounds.height + padding * 2,
      8
    );

    // Add tail to speech bubble
    bubble.lineBetween(
      bounds.width / 2 - 10,
      bounds.height + padding,
      bounds.width / 2,
      bounds.height + padding + 10
    );
    bubble.lineBetween(
      bounds.width / 2 + 10,
      bounds.height + padding,
      bounds.width / 2,
      bounds.height + padding + 10
    );

    this.speechBubble.setVisible(true);

    // Hide after duration
    this.scene.time.delayedCall(duration, () => {
      if (this.speechBubble) {
        this.speechBubble.setVisible(false);
      }
    });
  }

  update() {
    // if not moving, play idle animation
    if (this.targetX === 0 && this.targetY === 0) {
      this.play(`${this.agent.id}_idle`, true);
    }

    // Update the bubble text position
    this.bubbleText.x = this.x + 10;
    this.bubbleText.y = this.y - 50;

    // update the bubble text content
    this.bubbleText.updateText(
      `${this.getAgentInitials()}: ${this.agent.action.emoji}`
    );

    // Update the visual range
    this.visualRange.x = this.x;
    this.visualRange.y = this.y;

    // Update speech bubble position
    if (this.speechBubble) {
      this.speechBubble.setPosition(this.x, this.y - 50);
    }

    // Check for nearby agents and potentially interact
    this.checkForInteractions();
  }

  // Add a method to update the bubble text content
  updateBubbleText(text: string) {
    this.bubbleText.updateText(text);
  }

  getAgentInitials() {
    return this.agent.id
      .split("_")
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }

  updateAgentLocation = () => {
    const targetLocation = locations.find(
      (location) => location.name === this.agent.location
    );

    if (!targetLocation) {
      // agent is already moving
      return;
    }

    const offsetX =
      Math.floor(Math.random() * targetLocation.width) -
      targetLocation.width / 2;
    const offsetY =
      Math.floor(Math.random() * targetLocation.height) -
      targetLocation.height / 2;

    this.targetX = targetLocation.x + targetLocation.width / 2 + offsetX;
    this.targetY = targetLocation.y + targetLocation.height / 2 + offsetY;

    const distanceX = Math.abs(this.x - this.targetX);
    const distanceY = Math.abs(this.y - this.targetY);

    const durationX = distanceX;
    const durationY = distanceY;

    this.scene.tweens.add({
      targets: this,
      y: this.targetY,
      duration: durationY * 5,
      onComplete: () => {
        this.scene.tweens.add({
          targets: this,
          x: this.targetX,
          duration: durationX * 5,
          onComplete: () => {
            this.anims.play(`${this.agent.id}_idle`, true);
            this.agent.executeCurrentTask();
          },
        });
      },
    });
  };

  moveCharacter(direction: string) {
    switch (direction) {
      case "up":
        this.y -= 0.8;
        this.anims.play(`${this.agent.id}_walk_up`, true);
        break;
      case "down":
        this.y += 0.8;
        this.anims.play(`${this.agent.id}_walk_down`, true);
        break;
      case "left":
        this.x -= 0.8;
        this.anims.play(`${this.agent.id}_walk_left`, true);
        break;
      case "right":
        this.x += 0.8;
        this.anims.play(`${this.agent.id}_walk_right`, true);
        break;
    }
  }

  private async checkForInteractions() {
    if (Date.now() - this.lastInteractionTime < this.minInteractionInterval) {
      return;
    }

    const scene = this.scene as Phaser.Scene & { characters: AgentCharacter[] };
    if (!scene.characters) return;

    for (const otherCharacter of scene.characters) {
      if (otherCharacter === this) continue;

      if (interactionService.canInteract(this, otherCharacter)) {
        console.log(`${this.agent.name} is in range to interact with ${otherCharacter.agent.name}`);
        
        const shouldInteract = Math.random() < 0.3; // 30% chance to interact when nearby
        
        if (shouldInteract) {
          console.log(`${this.agent.name} is initiating interaction with ${otherCharacter.agent.name}`);
          const interactionType = Math.random() < 0.7 ? 'conversation' : 'rumor';
          console.log(`Interaction type: ${interactionType}`);
          
          const interaction = await interactionService.createInteraction(
            this.agent,
            otherCharacter.agent,
            interactionType
          );

          if (interaction) {
            console.log('Interaction content:', interaction.content);
            const [initiatorText, targetText] = interaction.content.split('|');
            this.showSpeechBubble(initiatorText.trim(), this.speechBubbleDuration);
            otherCharacter.showSpeechBubble(targetText.trim(), this.speechBubbleDuration);
            this.lastInteractionTime = Date.now();
            otherCharacter.lastInteractionTime = Date.now();
          }
        }
      }
    }
  }
}
