import { log } from "@repo/logger";
import app from "./server";
import router from "./api";

const port = process.env.PORT || 5001;

app.use("/api", router);

app.listen(port, () => {
  log(`Server started on http://localhost:${port}/api`);
});
