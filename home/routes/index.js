import Auth from "./auth.js";
const Router = (server) => {
    server.use("/auth", Auth);
    server.get("/", (req, res) => {
        try {
            res.status(200).json({
                status: "success",
                data: [],
                message: "Welcome to our API homepage!",
            });
        } catch (err) {
            res.status(500).json({
                status: "error",
                message: "Internal Server Error",
            });
        }
    })
};
export default Router;