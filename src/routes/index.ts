import {Router} from "express";
import auth from "./auth.routes";
// import user from "./user.routes";
// import feed from "./feed.router";
// import group from "./group.routes";
// import post from "./post.routes";
// import chat from "./chat.routes";
// import comment from "./comment.routes"

const routes = Router();

routes.use("/auth", auth);
// routes.use("/user", user);
// routes.use("/feed", feed);
// routes.use("/group", group);
// routes.use("/post", post);
// routes.use("/chat", chat);
// routes.use("/comment", comment);

export default routes;
