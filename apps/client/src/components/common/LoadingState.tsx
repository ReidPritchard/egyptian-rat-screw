import type React from "react";

// AIDEV-NOTE: Shared loading component for consistent loading states across the app
interface LoadingStateProps {
	message: string;
	size?: "sm" | "md" | "lg";
	showSpinner?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
	message, 
	size = "lg", 
	showSpinner = true 
}) => (
	<div className="flex flex-col items-center justify-center h-full gap-6 animate-fade-in-up">
		{showSpinner && (
			<span className={`loading loading-infinity loading-${size} text-primary`} />
		)}
		<p className="text-center text-lg font-medium text-base-content/70">
			{message}
		</p>
	</div>
);