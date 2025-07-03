import type { Hotkey } from "@/clientTypes";
import { useLocalPlayerSettings } from "@/hooks/useLocalPlayerSettings";
import type React from "react";
import { useEffect, useState } from "react";

interface PlayerSettingsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const PlayerSettingsModal: React.FC<PlayerSettingsModalProps> = ({
	isOpen,
	onClose,
}) => {
	const localPlayerSettings = useLocalPlayerSettings();

	const [hotkeys, setHotkeys] = useState<Hotkey[]>(
		Object.values(localPlayerSettings.settings.hotkeys),
	);

	const [isDarkMode, setIsDarkMode] = useState(false);
	const [selectedTheme, setSelectedTheme] = useState("default");
	const [defaultLightTheme, setDefaultLightTheme] = useState("light");
	const [defaultDarkTheme, setDefaultDarkTheme] = useState("dark");
	const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"ui" | "shortcuts">("ui");

	// Mock theme data - replace with actual theme imports
	const lightUIThemes = [
		"light",
		"cupcake",
		"bumblebee",
		"emerald",
		"corporate",
	];
	const darkUIThemes = ["dark", "synthwave", "retro", "cyberpunk", "valentine"];

	const availableThemes = isDarkMode ? darkUIThemes : lightUIThemes;

	const handleClose = () => {
		// Save settings
		localPlayerSettings.saveHotkeys(hotkeys);
		onClose();
	};

	const toggleTheme = () => {
		setIsDarkMode(!isDarkMode);
		setSelectedTheme(isDarkMode ? defaultLightTheme : defaultDarkTheme);
	};

	const startEditing = (hotkeyId: string) => {
		setEditingHotkey(hotkeyId);
	};

	const stopEditing = () => {
		setEditingHotkey(null);
	};

	const handleKeyPress = (e: KeyboardEvent) => {
		e.preventDefault();
		if (!editingHotkey) return;

		// If the key is a modifier key, don't update the hotkey yet
		if (
			e.key === "Control" ||
			e.key === "Alt" ||
			e.key === "Shift" ||
			e.key === "Meta"
		)
			return;

		// Update the hotkey - implement your update logic here
		console.log("Updating hotkey:", editingHotkey, {
			key: e.key,
			ctrl: e.ctrlKey,
			shift: e.shiftKey,
			alt: e.altKey,
			meta: e.metaKey,
		});

		stopEditing();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (editingHotkey) {
			document.addEventListener("keydown", handleKeyPress);
			return () => document.removeEventListener("keydown", handleKeyPress);
		}
	}, [editingHotkey]);

	const resetToDefaults = () => {
		// Implement reset logic
		console.log("Resetting to defaults");
	};

	if (!isOpen) return null;

	return (
		<div
			className={`modal modal-bottom sm:modal-middle ${isOpen ? "modal-open" : ""}`}
		>
			<div className="modal-box">
				<div
					role="tablist"
					className="tabs tabs-border"
				>
					<input
						type="radio"
						name="settings"
						className="tab"
						aria-label="UI"
						checked={activeTab === "ui"}
						onChange={() => setActiveTab("ui")}
					/>

					<div className="tab-content border-base-300 bg-base-100 p-10">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Light/Dark Mode</legend>

							<div className="form-control">
								<label className="label cursor-pointer">
									<label className="flex cursor-pointer gap-2">
										<span>☀️</span>
										<input
											type="checkbox"
											className="toggle theme-controller"
											checked={isDarkMode}
											onChange={toggleTheme}
										/>
										<span>🌙</span>
									</label>
								</label>
							</div>

							<legend className="fieldset-legend">Current Theme</legend>

							<div className="form-control">
								<label className="label cursor-pointer">
									<select
										className="select"
										value={selectedTheme}
										onChange={(e) => setSelectedTheme(e.target.value)}
									>
										{availableThemes.map((theme) => (
											<option
												key={theme}
												value={theme}
											>
												{theme}
											</option>
										))}
									</select>
								</label>
							</div>

							<legend className="fieldset-legend">Default Light Theme</legend>

							<div className="form-control">
								<label className="label cursor-pointer">
									<select
										className="select"
										value={defaultLightTheme}
										onChange={(e) => setDefaultLightTheme(e.target.value)}
									>
										{lightUIThemes.map((theme) => (
											<option
												key={theme}
												value={theme}
											>
												{theme}
											</option>
										))}
									</select>
								</label>
							</div>
						</fieldset>

						<fieldset className="fieldset">
							<legend className="fieldset-legend">Default Dark Theme</legend>

							<div className="form-control">
								<label className="label cursor-pointer">
									<select
										className="select"
										value={defaultDarkTheme}
										onChange={(e) => setDefaultDarkTheme(e.target.value)}
									>
										{darkUIThemes.map((theme) => (
											<option
												key={theme}
												value={theme}
											>
												{theme}
											</option>
										))}
									</select>
								</label>
							</div>
						</fieldset>
					</div>

					<input
						type="radio"
						name="settings"
						className="tab"
						aria-label="Shortcuts"
						checked={activeTab === "shortcuts"}
						onChange={() => setActiveTab("shortcuts")}
					/>

					<div className="tab-content border-base-300 bg-base-100 p-10">
						<div className="overflow-x-auto">
							<table className="table">
								<thead>
									<tr>
										<th>Action</th>
										<th>Shortcut</th>
										<th>Edit</th>
									</tr>
								</thead>
								<tbody>
									{hotkeys.map((hotkey) => (
										<tr key={hotkey.id}>
											<td>{hotkey.description}</td>
											<td>
												<div className="flex gap-1 items-center">
													{editingHotkey === hotkey.id ? (
														<span className="text-sm text-accent">
															Press new key combination...
														</span>
													) : (
														<>
															{hotkey.ctrl && (
																<>
																	<kbd className="kbd kbd-sm">ctrl</kbd>
																	<span> + </span>
																</>
															)}
															{hotkey.alt && (
																<>
																	<kbd className="kbd kbd-sm">alt</kbd>
																	<span> + </span>
																</>
															)}
															{hotkey.shift && (
																<>
																	<kbd className="kbd kbd-sm">shift</kbd>
																	<span> + </span>
																</>
															)}
															{hotkey.meta && (
																<>
																	<kbd className="kbd kbd-sm">⌘</kbd>
																	<span> + </span>
																</>
															)}
															<kbd className="kbd kbd-sm">{hotkey.key}</kbd>
														</>
													)}
												</div>
											</td>
											<td>
												<button
													type="button"
													className="btn btn-ghost btn-sm"
													onClick={() =>
														editingHotkey === hotkey.id
															? stopEditing()
															: startEditing(hotkey.id)
													}
												>
													<span className="material-symbols-outlined">
														{editingHotkey === hotkey.id ? "close" : "edit"}
													</span>
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>

				<div className="modal-action">
					<button
						type="reset"
						className="btn btn-ghost"
						onClick={resetToDefaults}
					>
						Reset to Defaults
					</button>
					<button
						type="button"
						className="btn"
						onClick={handleClose}
					>
						Close
					</button>
				</div>
			</div>

			<form
				method="dialog"
				className="modal-backdrop"
				onClick={onClose}
				onKeyDown={onClose}
			>
				<button type="button">close</button>
			</form>
		</div>
	);
};
