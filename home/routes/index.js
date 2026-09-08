import Auth from "./auth.js";
import Chat from "./chat.js";
import Resource from "./resource.js";

const Router = (server) => {
    server.use("/auth", Auth);
    server.use("/chat", Chat)
    server.use("/resource", Resource);
};
export default Router;