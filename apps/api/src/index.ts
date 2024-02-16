import { info } from "@repo/utils";
import app from "./server";
import router from "./api";

const port = process.env.PORT || 5001;

app.use("/api", router);

app.listen(port, () => {
  info(`Server started on http://localhost:${port}/api`);
});
