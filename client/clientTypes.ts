export interface LocalPlayerSettings {
  name: string;
  hotkeys: {
    enable: boolean;
    playCard: string;
    slap: string;
    vote: {
      yes: string;
      no: string;
    };
    ready: string;
    settings: string;
  };
  ui: {
    actionLog: {
      expanded: boolean;
    };
  };
}
