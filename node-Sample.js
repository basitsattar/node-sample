import Express from "express";
const mongoose = require("mongoose");
import cookieParser from "cookie-parser";
import * as path from "path";
import * as http from "http";
import * as os from "os";
const passport = require("passport");
import cors from "cors";
import l from "./logger";
import * as OpenApiValidator from "express-openapi-validator";
import errorHandler from "../api/middlewares/error.handler";

const app = new Express();
const options = {
  keepAlive: 1,
  useUnifiedTopology: true,
  useNewUrlParser: true,
  useCreateIndex: true,
};

export default class ExpressServer {
  constructor() {
    const root = path.normalize(`${__dirname}/../..`);

    const apiSpec = path.join(__dirname, "api.yml");
    const validateResponses = !!(
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION &&
      process.env.OPENAPI_ENABLE_RESPONSE_VALIDATION.toLowerCase() === "true"
    );
    app.use(cors());
    app.use(passport.initialize());
    import(".././helpers/passport");

    app.set("appPath", `${root}client`);

    app.use(cookieParser(process.env.SESSION_SECRET));
    app.use(Express.static(`${root}/public`));
    mongoose.connect(process.env.MONGO_DB_URL, options);
    mongoose.connection.on("connected", function () {
      console.log("DB Connected");
    });
    app.use(process.env.OPENAPI_SPEC || "/spec", Express.static(apiSpec));
    app.use(
      OpenApiValidator.middleware({
        apiSpec,
        validateResponses,
        ignorePaths: /.*\/spec(\/|$)/,
      })
    );
  }

  router(routes) {
    routes(app);
    app.use(errorHandler);
    return this;
  }

  listen(port = process.env.PORT) {
    const welcome = (p) => () =>
      l.info(
        `up and running in ${
          process.env.NODE_ENV || "development"
        } @: ${os.hostname()} on port: ${p}}`
      );

    http.createServer(app).listen(port, welcome(port));

    return app;
  }
}
