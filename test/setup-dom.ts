/**
 * DOM test setup - registers happy-dom globals for `bun test`.
 * Preloaded via bunfig.toml so every test file gets `document`, `window`,
 * etc. without importing anything itself.
 */
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();
