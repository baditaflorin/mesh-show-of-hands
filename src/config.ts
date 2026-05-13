import { createMeshConfig } from "@baditaflorin/mesh-common";

export const config = createMeshConfig({
  appName: "mesh-show-of-hands",
  description: "Live raised-hands board for classrooms and meetings, no account, mesh-synced",
  accentHex: "#f5a524",
  version: __APP_VERSION__,
  commit: __GIT_COMMIT__,
});
