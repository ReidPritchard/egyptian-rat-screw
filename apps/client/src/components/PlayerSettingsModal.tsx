import type React from "react";
import { useEffect, useState } from "react";
import type { Hotkey } from "@/clientTypes";
import { useLocalPlayerSettings } from "@/hooks/useLocalPlayerSettings";

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

	const [editingHotkey, setEditingHotkey] = useState<string | null>(null);
	const [activeTab, setActiveTab] = useState<"ui" | "shortcuts">("shortcuts");

	const handleClose = () => {
		// Save settings
		localPlayerSettings.saveHotkeys(hotkeys);
		onClose();
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

		setHotkeys((prevHotkeys) => {
			return prevHotkeys.map((hotkey) => {
				if (hotkey.id === editingHotkey) {
					return {
						...hotkey,
						key: e.key,
						ctrl: e.ctrlKey,
						shift: e.shiftKey,
						alt: e.altKey,
						meta: e.metaKey,
					};
				}
				return hotkey;
			});
		});

		stopEditing();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: handleKeyPress changes every render
	useEffect(() => {
		if (editingHotkey) {
			document.addEventListener("keydown", handleKeyPress);
			return () => document.removeEventListener("keydown", handleKeyPress);
		}
	}, [editingHotkey]);

	const resetToDefaults = () => {
		localPlayerSettings.resetSettings();
		setHotkeys(Object.values(localPlayerSettings.settings.hotkeys));
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
											<td>{hotkey.description || hotkey.id}</td>
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
															<kbd className="kbd kbd-sm">
																{hotkey.key === " "
																	? "<Space>"
																	: hotkey.key.toLocaleUpperCase()}
															</kbd>
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

					<input
						type="radio"
						name="settings"
						className="tab"
						aria-label="UI"
						checked={activeTab === "ui"}
						onChange={() => setActiveTab("ui")}
					/>

					<div className="tab-content border-base-300 bg-base-100 p-10">
						<sub>Additional settings will be added here</sub>
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
