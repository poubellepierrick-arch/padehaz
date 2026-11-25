export const INITIAL_PARTICIPANTS = ['Anita', 'Boris', 'Christel', 'Clément', 'Éloïse', 'Fannie', 'Léa', 'Louis', 'Michelle', 'Olympe', 'Pam', 'Quentin', 'Rita', 'Thomas'];

export const INITIAL_PARTICIPANT_COLORS: Record<string, string> = {
    "Clément": "#F42C44",
    "Rita": "#F4B6A6",
    "Thomas": "#F4C800",
    "Léa": "#A5AEF5",
    "Christel": "#EC9EF4",
    "Anita": "#9CE5EB",
    "Éloïse": "#eb9372",
    "Pam": "#1aac49",
    "Olympe": "#4B01BC",
    "Boris": "#0179BC",
    "Michelle": "#738cc8",
    "Quentin": "#688E6E",
    "Fannie": "#a9ed8b",
    "Louis": "#e4581d"
};

export const SESSION_MARKER_COLORS = ["#ff6347", "#4682b4", "#32cd32", "#ffae42", "#9370db", "#40e0d0", "#ffa07a"];
export const MAIN_GROUP_SIZE_OPTIONS = Array.from({ length: 15 }, (_, i) => i);
export const BONUS_GROUP_SIZE_OPTIONS = Array.from({ length: 15 }, (_, i) => i);
export const DEFAULT_MAIN_SIZE = 3;
export const DEFAULT_BONUS_SIZE = 2;
export const DEFAULT_TIME_WINDOW_SETTINGS = { early: { start: "18:40", transition: "19:30", end: "20:00" }, late: { start: "22:40", transition: "22:50", end: "23:10" } };
export const COLUMN_MIN_WIDTH = 250;
export const COLUMN_LAYOUT_STORAGE_KEY = 'improAppColumnLayout';
export const DEFAULT_PROG_EMBED = 'https://pierricksauzon.notion.site/embed/2e2ddc608f9980438568f6cda4766a95?v=2e2ddc608f99816a8dc9000cad88e2a6';
export const MAX_PROG_EMBED_LENGTH = 2000;

