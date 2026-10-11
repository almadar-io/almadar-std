import path from 'node:path';

import { behaviorRegistryDir, readBehaviorPackage } from '@almadar/core/behavior-package';

/** std's lowered programs, through its manifest: the live mirror of its `.lolo`
 *  sources in the workspace, the materialized registry once `materialize` ran. */
export const STD_REGISTRY = behaviorRegistryDir(readBehaviorPackage(path.resolve(__dirname, '..')));
