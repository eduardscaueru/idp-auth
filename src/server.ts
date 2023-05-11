import express from 'express';
import cors from 'cors';
import 'reflect-metadata';
import helmet from "helmet";
import bodyParser from "body-parser";
import routes from "./routes";

const main = async () => {

  const upload = require('express-fileupload');
  const http = require('http');
  const app = express();
  const server = http.createServer(app);
  const port = 8080;

  //middlewares
  app.use(helmet());
  // app.use(cors({
  //   origin: ['http://idp-fe:4200']
  // }));
  app.use(cors());
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(upload());

  //routes
  app.use("/api", routes);

  //listen
  server.listen(port, () => {
    console.log(`App running on port: \x1b[32m${port}\x1b[0m`);
  });
}

main()
