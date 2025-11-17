import Auth from "./auth.js";
import Chat from "./chat.js";
const Router = (server) => {
    server.use("/auth", Auth);
    server.use("/chat", Chat)
};
export default Router;