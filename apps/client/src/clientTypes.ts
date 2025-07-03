export interface Hotkey {
	id: string;
	description: string;
	key: string;
	ctrl: boolean;
	shift: boolean;
	alt: boolean;
	meta: boolean;
}

export interface LocalPlayerSettings {
	name: string;
	enable_hotkeys: boolean;
	hotkeys: {
		playCard: Hotkey;
		slap: Hotkey;
		vote_yes: Hotkey;
		vote_no: Hotkey;
		ready: Hotkey;
		settings: Hotkey;
	};
	ui: {
		actionLog: {
			expanded: boolean;
		};
		highContrast: boolean;
		theme: string;
	};
}

export type Hotkeys = LocalPlayerSettings["hotkeys"];
