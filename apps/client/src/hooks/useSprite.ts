/**
 * Hook to load and manipulate sprites
 * Uses the related Aseprite JSON format for calculating sprite/frame dimensions
 *
 *
 * Example Aseprite JSON file format
 *   { "frames": {
 *     "sprite-name 0.aseprite": {
 *      "frame": { "x": 0, "y": 0, "w": 32, "h": 32 },
 *      "rotated": false,
 *      "trimmed": false,
 *      "spriteSourceSize": { "x": 0, "y": 0, "w": 32, "h": 32 },
 *      "sourceSize": { "w": 32, "h": 32 },
 *      "duration": 100
 *     },
 *     "sprite-name 1.aseprite": { ... },
 *     ...
 *   }
 */

import { useEffect, useState } from "react";

interface IFrame {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  sourceSize: {
    w: number;
    h: number;
  };
}

interface ISpriteData {
  frames: Record<string, IFrame>;
  meta: {
    size: {
      w: number;
      h: number;
    };
  };
}

interface ISpriteProps {
  spriteSrc: string;
  frameKey?: string;
  frameOrder?: string[];
}

export const useSprite = (props: ISpriteProps) => {
  const { spriteSrc, frameKey, frameOrder } = props;

  const [sprite, setSprite] = useState<HTMLImageElement | null>(null);
  const [spriteData, setSpriteData] = useState<ISpriteData | null>(null);
  const [currentFrame, setCurrentFrame] = useState<IFrame | null>(null);

  const imageFile = `${spriteSrc}.png`; // The actual sprite image file
  const jsonFile = `${spriteSrc}.json`; // The related Aseprite JSON file

  // Load sprite image
  useEffect(() => {
    const img = new Image();
    img.src = imageFile;
    setSprite(img);
  }, [imageFile]);

  // Load and parse sprite data JSON
  useEffect(() => {
    fetch(jsonFile)
      .then((response) => response.json())
      .then((data: ISpriteData) => {
        setSpriteData(data);

        // Set initial frame
        if (frameKey && data.frames[frameKey]) {
          setCurrentFrame(data.frames[frameKey]);
        } else if (
          frameOrder &&
          frameOrder.length > 0 &&
          data.frames[frameOrder[0]]
        ) {
          setCurrentFrame(data.frames[frameOrder[0]]);
        } else {
          // Default to first frame if no specific frame is requested
          const firstFrameKey = Object.keys(data.frames)[0];
          setCurrentFrame(data.frames[firstFrameKey]);
        }
      })
      .catch((error) => {
        console.error("Error loading sprite data:", error);
      });
  }, [jsonFile, frameKey, frameOrder]);

  return {
    sprite,
    frame: currentFrame,
    spriteData,
  };
};
