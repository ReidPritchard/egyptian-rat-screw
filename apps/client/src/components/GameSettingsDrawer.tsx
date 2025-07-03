import type { GameSettings, SlapRule } from "@oer/shared/types";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface GameSettingsDrawerProps {
	isOpen: boolean;
	onClose: () => void;
	gameSettings: GameSettings;
	allSlapRules: SlapRule[];
	handleGameSettingsChange: (settings: GameSettings) => void;
}

export const GameSettingsDrawer: React.FC<GameSettingsDrawerProps> = ({
	isOpen,
	onClose,
	gameSettings,
	allSlapRules,
	handleGameSettingsChange,
}) => {
	const [maxPlayers, setMaxPlayers] = useState(gameSettings.maximumPlayers);
	const [selectedRules, setSelectedRules] = useState<string[]>(
		gameSettings.slapRules.map((rule) => rule.name),
	);
	const drawerRef = useRef<HTMLDivElement>(null);

	// Handle closing the drawer when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				drawerRef.current &&
				!drawerRef.current.contains(event.target as Node)
			) {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, onClose]);

	// Update game settings when saving
	const handleSave = () => {
		handleGameSettingsChange({
			...gameSettings,
			maximumPlayers: maxPlayers,
			slapRules: selectedRules.map((ruleName) => {
				const foundRule = allSlapRules.find((r) => r.name === ruleName);
				if (!foundRule) {
					throw new Error(`Rule not found: ${ruleName}`);
				}
				return foundRule;
			}),
		});
		onClose();
	};

	// Toggle rule selection
	const toggleRule = (ruleName: string) => {
		setSelectedRules((prev) =>
			prev.includes(ruleName)
				? prev.filter((r) => r !== ruleName)
				: [...prev, ruleName],
		);
	};

	return (
		<>
			{/* Drawer */}
			<div
				className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
					isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
				}`}
			>
				<div
					ref={drawerRef}
					className={`fixed right-0 top-0 w-80 h-full bg-base-100 shadow-xl p-6 transition-transform duration-300 ease-in-out ${
						isOpen ? "translate-x-0" : "translate-x-full"
					}`}
				>
					<div className="flex flex-col h-full">
						<div className="flex justify-between items-center mb-6">
							<h2 className="text-xl font-bold">Game Settings</h2>
							<button
								className="btn btn-sm btn-circle btn-ghost"
								onClick={() => onClose()}
								type="button"
							>
								✕
							</button>
						</div>

						<div className="flex flex-col gap-4 flex-grow overflow-y-auto">
							{/* Max Players */}
							<div className="form-control">
								<label
									className="label"
									htmlFor="max-players-range"
								>
									<span className="label-text">Max Players</span>
								</label>
								<div className="flex items-center gap-2">
									<input
										id="max-players-range"
										type="range"
										min="2"
										max="8"
										value={maxPlayers}
										onChange={(e) => setMaxPlayers(Number(e.target.value))}
										className="range range-primary"
									/>
									<span className="badge badge-primary">{maxPlayers}</span>
								</div>
							</div>

							{/* Slap Rules */}
							<div className="form-control">
								<span className="label-text mb-2">Slap Rules</span>
								<div className="flex flex-col gap-1">
									{allSlapRules.map((rule) => (
										<div
											key={rule.name}
											className="form-control"
										>
											<label
												className="label cursor-pointer justify-start gap-2"
												htmlFor={`rule-${rule.name}`}
											>
												<input
													id={`rule-${rule.name}`}
													type="checkbox"
													className="checkbox checkbox-primary checkbox-sm"
													checked={selectedRules.includes(rule.name)}
													onChange={() => toggleRule(rule.name)}
												/>
												<span className="label-text">{rule.name}</span>
											</label>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="mt-6">
							<button
								className="btn btn-primary w-full"
								onClick={handleSave}
								type="button"
							>
								Save Changes
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};
