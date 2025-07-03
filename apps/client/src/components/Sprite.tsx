import type React from "react";
import { useSprite } from "@/hooks/useSprite";

interface ISpriteProps {
	/**
	 * Path to assets/sprites without the file extension
	 * e.g. "assets/sprites/player" (looks for player.png and player.json)
	 */
	spriteSrc: string;
	alt: string;
	className?: string;
	frameKey?: string;
	frameOrder?: string[];
	width?: number;
	height?: number;
}

export const Sprite: React.FC<ISpriteProps> = ({
	spriteSrc,
	alt,
	className = "",
	frameKey,
	frameOrder,
	width,
	height,
}) => {
	const { sprite, frame } = useSprite({
		spriteSrc,
		frameKey,
		frameOrder,
	});

	if (!(sprite && frame)) {
		return null;
	}

	// Calculate dimensions based on props or frame data
	const displayWidth = width ?? frame.sourceSize.w;
	const displayHeight = height ?? frame.sourceSize.h;

	const scale = displayWidth / frame.sourceSize.w;

	return (
		<div
			className={`relative overflow-hidden ${className}`}
			style={{
				width: displayWidth,
				height: displayHeight,
			}}
			role="img"
			aria-label={alt}
		>
			<div
				style={{
					width: sprite.width * scale,
					height: sprite.height * scale,
					transform: `translate(-${frame.frame.x * scale}px, -${
						frame.frame.y * scale
					}px)`,
				}}
			>
				<img
					src={sprite.src}
					alt={alt}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "contain",
						imageRendering: "pixelated",
					}}
				/>
			</div>
		</div>
	);
};
